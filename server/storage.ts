import type { Category, CheckoutInput, Order, OrderStatus, PaymentStatus, Product, ReviewInput } from "../shared/schema";
import { CartItemModel, CategoryModel, OrderModel, ProductModel, ReviewModel, UserModel, WishlistModel } from "./db";

export type ProductFilters = {
  category?: string;
  style?: string;
  size?: string;
  sort?: string;
};

export interface Storage {
  getCategories(): Promise<Category[]>;
  createCategory(input: Category): Promise<Category>;
  updateCategory(id: string, input: Partial<Category>): Promise<Category | null>;
  deleteCategory(id: string): Promise<void>;
  getProducts(filters?: ProductFilters): Promise<Product[]>;
  getProductBySlug(slug: string): Promise<(Product & { _id: string }) | null>;
  createProduct(input: Product): Promise<Product>;
  updateProduct(id: string, input: Partial<Product>): Promise<Product | null>;
  deleteProduct(id: string): Promise<void>;
  getCart(sessionId: string): Promise<unknown[]>;
  incrementCartItem(sessionId: string, productId: string, quantity: number): Promise<void>;
  upsertCartItem(sessionId: string, productId: string, quantity: number): Promise<void>;
  removeCartItem(sessionId: string, productId: string): Promise<void>;
  clearCart(sessionId: string): Promise<void>;
  getWishlist(sessionId: string): Promise<unknown[]>;
  addWishlist(sessionId: string, productId: string, userId?: string): Promise<void>;
  removeWishlist(sessionId: string, productId: string): Promise<void>;
  getReviews(slug: string): Promise<unknown[]>;
  createReview(slug: string, input: ReviewInput, userId?: string): Promise<unknown>;
  createOrderFromCart(sessionId: string, userId: string, input: CheckoutInput): Promise<Order>;
  getOrders(userId: string): Promise<Order[]>;
  getOrderById(id: string, userId?: string): Promise<Order | null>;
  getAllOrders(): Promise<Order[]>;
  updateOrderStatus(id: string, status?: OrderStatus, paymentStatus?: PaymentStatus): Promise<Order | null>;
  cancelOrder(id: string, userId: string): Promise<Order | null>;
  markOrderPaid(id: string, paymentId?: string): Promise<Order | null>;
  attachRazorpayOrder(id: string, razorpayOrderId: string): Promise<Order | null>;
  attachShiprocketShipment(id: string, shipment: ShiprocketShipmentUpdate): Promise<Order | null>;
}

const lean = <T>(value: T) => JSON.parse(JSON.stringify(value));

export type ShiprocketShipmentUpdate = {
  shiprocketOrderId?: string;
  shiprocketShipmentId?: string;
  shiprocketStatus?: string;
  shiprocketAwbCode?: string;
  shiprocketCourierName?: string;
};

export class MongoStorage implements Storage {
  async getCategories() {
    return lean(await CategoryModel.find().sort({ name: 1 }).lean());
  }

  async createCategory(input: Category) {
    return lean(await CategoryModel.create(input));
  }

  async updateCategory(id: string, input: Partial<Category>) {
    return lean(await CategoryModel.findByIdAndUpdate(id, input, { new: true }).lean());
  }

  async deleteCategory(id: string) {
    await CategoryModel.findByIdAndDelete(id);
  }

  async getProducts(filters: ProductFilters = {}) {
    const query: Record<string, unknown> = {};
    if (filters.category) query.category = filters.category;
    if (filters.style) query.style = filters.style;
    if (filters.size) query.size = filters.size;

    const sortMap: Record<string, Record<string, 1 | -1>> = {
      price_asc: { price: 1 },
      price_desc: { price: -1 },
      newest: { createdAt: -1 },
      name: { name: 1 }
    };

    return lean(await ProductModel.find(query).sort(sortMap[filters.sort || "newest"] || { createdAt: -1 }).lean());
  }

  async getProductBySlug(slug: string) {
    return lean(await ProductModel.findOne({ slug }).lean());
  }

  async createProduct(input: Product) {
    return lean(await ProductModel.create(input));
  }

  async updateProduct(id: string, input: Partial<Product>) {
    return lean(await ProductModel.findByIdAndUpdate(id, input, { new: true }).lean());
  }

  async deleteProduct(id: string) {
    await ProductModel.findByIdAndDelete(id);
  }

  async getCart(sessionId: string) {
    const items = await CartItemModel.find({ sessionId }).populate("productId").lean();
    return lean(items.filter((item: any) => Boolean(item.productId)));
  }

  async incrementCartItem(sessionId: string, productId: string, quantity: number) {
    const existing = (await CartItemModel.findOne({ sessionId, productId }).lean()) as { quantity?: number } | null;
    await CartItemModel.findOneAndUpdate(
      { sessionId, productId },
      { $set: { quantity: Math.min(25, (existing?.quantity || 0) + quantity) } },
      { upsert: true, new: true }
    );
  }

  async upsertCartItem(sessionId: string, productId: string, quantity: number) {
    await CartItemModel.findOneAndUpdate(
      { sessionId, productId },
      { $set: { quantity } },
      { upsert: true, new: true }
    );
  }

  async removeCartItem(sessionId: string, productId: string) {
    await CartItemModel.deleteOne({ sessionId, productId });
  }

  async clearCart(sessionId: string) {
    await CartItemModel.deleteMany({ sessionId });
  }

  async getWishlist(sessionId: string) {
    const items = await WishlistModel.find({ sessionId }).populate("productId").lean();
    return lean(items.filter((item: any) => Boolean(item.productId)));
  }

  async addWishlist(sessionId: string, productId: string, userId?: string) {
    await WishlistModel.findOneAndUpdate(
      { sessionId, productId },
      { $set: { userId } },
      { upsert: true }
    );
  }

  async removeWishlist(sessionId: string, productId: string) {
    await WishlistModel.deleteOne({ sessionId, productId });
  }

  async getReviews(slug: string) {
    const product = (await ProductModel.findOne({ slug }).select("_id").lean()) as { _id: unknown } | null;
    if (!product) return [];
    return lean(await ReviewModel.find({ productId: product._id }).sort({ createdAt: -1 }).lean());
  }

  async createReview(slug: string, input: ReviewInput, userId?: string) {
    const product = (await ProductModel.findOne({ slug }).select("_id").lean()) as { _id: unknown } | null;
    if (!product) throw new Error("Product not found");
    const user = userId ? ((await UserModel.findById(userId).lean()) as { username?: string } | null) : null;
    return lean(
      await ReviewModel.create({
        productId: product._id,
        userId,
        name: user?.username || input.name,
        rating: input.rating,
        comment: input.comment
      })
    );
  }

  async createOrderFromCart(sessionId: string, userId: string, input: CheckoutInput) {
    const cartRows = await CartItemModel.find({ sessionId }).populate("productId").lean();
    if (!cartRows.length) throw new Error("Your cart is empty");

    const items = cartRows.map((row: any) => {
      const product = row.productId;
      if (!product) throw new Error("A product in your cart is no longer available");
      return {
        productId: String(product._id),
        name: product.name,
        slug: product.slug,
        image: product.image,
        price: product.price,
        quantity: row.quantity
      };
    });

    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shipping = subtotal >= 5000 ? 0 : 249;
    const tax = Math.round(subtotal * 0.18);
    const total = subtotal + shipping + tax;
    const orderNumber = `MG-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 900 + 100)}`;
    const status = input.paymentMethod === "cod" ? "processing" : "pending";

    const order = await OrderModel.create({
      orderNumber,
      userId,
      items,
      shippingAddress: input.shippingAddress,
      subtotal,
      shipping,
      tax,
      total,
      currency: "inr",
      status,
      paymentStatus: input.paymentMethod === "cod" ? "pending" : "pending",
      paymentMethod: input.paymentMethod
    });

    if (input.paymentMethod === "cod") await CartItemModel.deleteMany({ sessionId });
    return lean(order);
  }

  async getOrders(userId: string) {
    return lean(await OrderModel.find({ userId }).sort({ createdAt: -1 }).lean());
  }

  async getOrderById(id: string, userId?: string) {
    const query: Record<string, string> = { _id: id };
    if (userId) query.userId = userId;
    return lean(await OrderModel.findOne(query).lean());
  }

  async getAllOrders() {
    return lean(await OrderModel.find().sort({ createdAt: -1 }).lean());
  }

  async updateOrderStatus(id: string, status?: OrderStatus, paymentStatus?: PaymentStatus) {
    const update: Record<string, any> = {};
    if (status) update.status = status;
    if (paymentStatus) {
      update.paymentStatus = paymentStatus;
    } else if (status === "cancelled") {
      update.paymentStatus = "refund_initiated";
    }
    return lean(await OrderModel.findByIdAndUpdate(id, { $set: update }, { new: true }).lean());
  }

  async cancelOrder(id: string, userId: string) {
    const order = await OrderModel.findOne({ _id: id, userId }).lean();
    if (!order) return null;
    const current = (order as any).status;
    if (["shipped", "delivered", "cancelled"].includes(current)) {
      throw new Error("This order can no longer be cancelled online");
    }
    return lean(
      await OrderModel.findByIdAndUpdate(
        id,
        { $set: { status: "cancelled", paymentStatus: "refund_initiated" } },
        { new: true }
      ).lean()
    );
  }

  async markOrderPaid(id: string, paymentId?: string) {
    const order = await OrderModel.findByIdAndUpdate(
      id,
      {
        $set: {
          status: "paid",
          paymentStatus: "paid",
          razorpayPaymentId: paymentId,
          paidAt: new Date()
        }
      },
      { new: true }
    ).lean();
    return lean(order);
  }

  async attachRazorpayOrder(id: string, razorpayOrderId: string) {
    return lean(await OrderModel.findByIdAndUpdate(id, { $set: { razorpayOrderId } }, { new: true }).lean());
  }

  async attachShiprocketShipment(id: string, shipment: ShiprocketShipmentUpdate) {
    return lean(await OrderModel.findByIdAndUpdate(id, { $set: shipment }, { new: true }).lean());
  }
}

export const storage = new MongoStorage();
