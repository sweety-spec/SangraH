import mongoose, { Schema } from "mongoose";

export async function connectDB() {
  const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/modi-glasses";
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  return mongoose.connect(uri);
}

const userSchema = new Schema(
  {
    username: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    passwordHash: String,
    avatar: String,
    googleId: { type: String, index: true }
  },
  { timestamps: true }
);

const categorySchema = new Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    description: { type: String, required: true },
    image: { type: String, required: true }
  },
  { timestamps: true }
);

const productSchema = new Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    compareAtPrice: Number,
    category: { type: String, required: true, index: true },
    style: { type: String, required: true, index: true },
    size: { type: String, required: true, index: true },
    image: { type: String, required: true },
    images: [String],
    tags: [String],
    inventory: { type: Number, default: 0 },
    featured: { type: Boolean, default: false },
    trending: { type: Boolean, default: false },
    isNew: { type: Boolean, default: false }
  },
  { timestamps: true, suppressReservedKeysWarning: true }
);

const reviewSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    name: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true }
  },
  { timestamps: true }
);

const cartItemSchema = new Schema(
  {
    sessionId: { type: String, required: true, index: true },
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, required: true, min: 1 }
  },
  { timestamps: true }
);
cartItemSchema.index({ sessionId: 1, productId: 1 }, { unique: true });

const wishlistSchema = new Schema(
  {
    sessionId: { type: String, required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true }
  },
  { timestamps: true }
);
wishlistSchema.index({ sessionId: 1, productId: 1 }, { unique: true });

const orderSchema = new Schema(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    items: [
      {
        productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
        name: { type: String, required: true },
        slug: { type: String, required: true },
        image: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true }
      }
    ],
    shippingAddress: {
      fullName: String,
      phone: String,
      line1: String,
      line2: String,
      city: String,
      state: String,
      postalCode: String,
      country: String
    },
    subtotal: { type: Number, required: true },
    shipping: { type: Number, required: true },
    tax: { type: Number, required: true },
    total: { type: Number, required: true },
    currency: { type: String, default: "inr" },
    status: { type: String, enum: ["pending", "paid", "processing", "shipped", "delivered", "cancelled"], default: "pending" },
    paymentStatus: { type: String, enum: ["pending", "paid", "failed", "refund_initiated", "refunded"], default: "pending" },
    paymentMethod: { type: String, enum: ["razorpay", "cod", "demo_card"], required: true },
    razorpayOrderId: String,
    razorpayPaymentId: String,
    paidAt: Date,
    shiprocketOrderId: String,
    shiprocketShipmentId: String,
    shiprocketStatus: String,
    shiprocketAwbCode: String,
    shiprocketCourierName: String
  },
  { timestamps: true }
);

export const UserModel = mongoose.models.User || mongoose.model("User", userSchema);
export const CategoryModel = mongoose.models.Category || mongoose.model("Category", categorySchema);
export const ProductModel = mongoose.models.Product || mongoose.model("Product", productSchema);
export const ReviewModel = mongoose.models.Review || mongoose.model("Review", reviewSchema);
export const CartItemModel = mongoose.models.CartItem || mongoose.model("CartItem", cartItemSchema);
export const WishlistModel = mongoose.models.Wishlist || mongoose.model("Wishlist", wishlistSchema);
export const OrderModel = mongoose.models.Order || mongoose.model("Order", orderSchema);

const imageSchema = new Schema(
  {
    filename: { type: String, required: true },
    contentType: { type: String, required: true },
    data: { type: Buffer, required: true },
    size: { type: Number, required: true }
  },
  { timestamps: true }
);

export const ImageModel = mongoose.models.Image || mongoose.model("Image", imageSchema);
