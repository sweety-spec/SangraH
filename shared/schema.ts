import { z } from "zod";

export const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, "Invalid id");

export const categorySchema = z.object({
  _id: z.string().optional(),
  name: z.string().min(2),
  slug: z.string().min(2),
  description: z.string().min(8),
  image: z.string().min(1)
});

export const productSchema = z.object({
  _id: z.string().optional(),
  name: z.string().min(2),
  slug: z.string().min(2),
  description: z.string().min(12),
  price: z.number().positive(),
  compareAtPrice: z.number().positive().optional(),
  category: z.string().min(2),
  style: z.string().min(2),
  size: z.string().min(1),
  image: z.string().min(1),
  images: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  inventory: z.number().int().nonnegative().default(0),
  featured: z.boolean().default(false),
  trending: z.boolean().default(false),
  isNew: z.boolean().default(false)
});

export const reviewSchema = z.object({
  name: z.string().min(2),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(6).max(500)
});

export const signupSchema = z.object({
  username: z.string().min(2).max(60),
  email: z.string().email(),
  password: z.string().min(8)
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export const googleAuthSchema = z.object({
  credential: z.string().min(10)
});

export const cartItemSchema = z.object({
  productId: objectIdSchema,
  quantity: z.number().int().min(1).max(25)
});

export const shippingAddressSchema = z.object({
  fullName: z.string().min(2),
  phone: z.string().min(8),
  line1: z.string().min(4),
  line2: z.string().optional().default(""),
  city: z.string().min(2),
  state: z.string().min(2),
  postalCode: z.string().min(4),
  country: z.string().min(2).default("India")
});

export const checkoutSchema = z.object({
  shippingAddress: shippingAddressSchema,
  paymentMethod: z.enum(["razorpay", "cod", "demo_card"]).default("demo_card")
});

export const razorpayVerifySchema = z.object({
  razorpay_order_id: z.string().min(4),
  razorpay_payment_id: z.string().min(4),
  razorpay_signature: z.string().min(10)
});

export const orderStatusSchema = z.enum(["pending", "paid", "processing", "shipped", "delivered", "cancelled"]);
export const paymentStatusSchema = z.enum(["pending", "paid", "failed", "refund_initiated", "refunded"]);

export const adminPasswordSchema = z.object({
  adminPassword: z.string().min(1)
});

export type Category = z.infer<typeof categorySchema>;
export type Product = z.infer<typeof productSchema>;
export type ReviewInput = z.infer<typeof reviewSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CartItemInput = z.infer<typeof cartItemSchema>;
export type ShippingAddress = z.infer<typeof shippingAddressSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type OrderStatus = z.infer<typeof orderStatusSchema>;
export type PaymentStatus = z.infer<typeof paymentStatusSchema>;

export type User = {
  _id: string;
  username: string;
  email: string;
  avatar?: string;
  googleId?: string;
};

export type CartLine = {
  product: Product & { _id: string };
  quantity: number;
};

export type OrderLine = {
  productId: string;
  name: string;
  slug: string;
  image: string;
  price: number;
  quantity: number;
};

export type Order = {
  _id: string;
  orderNumber: string;
  userId: string;
  items: OrderLine[];
  shippingAddress: ShippingAddress;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  currency: "inr";
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: "razorpay" | "cod" | "demo_card";
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  shiprocketOrderId?: string;
  shiprocketShipmentId?: string;
  shiprocketStatus?: string;
  shiprocketAwbCode?: string;
  shiprocketCourierName?: string;
  createdAt?: string;
  updatedAt?: string;
};
