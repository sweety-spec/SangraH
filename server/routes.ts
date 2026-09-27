import bcrypt from "bcryptjs";
import { OAuth2Client } from "google-auth-library";
import crypto from "node:crypto";
import Razorpay from "razorpay";
import type { Express, Request, Response, NextFunction } from "express";
import multer from "multer";
import { z } from "zod";
import { CategoryModel, ImageModel, UserModel } from "./db";
import { createShiprocketOrder } from "./shiprocket";
import { storage } from "./storage";
import {
  adminPasswordSchema,
  cartItemSchema,
  categorySchema,
  checkoutSchema,
  googleAuthSchema,
  loginSchema,
  productSchema,
  razorpayVerifySchema,
  reviewSchema,
  orderStatusSchema,
  paymentStatusSchema,
  signupSchema
} from "../shared/schema";

declare module "express-session" {
  interface SessionData {
    userId?: string;
    cartTouched?: boolean;
  }
}

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const razorpay =
  process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
    ? new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET })
    : null;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.mimetype)) {
      cb(new Error("Only JPG, PNG, WEBP, and GIF images are allowed"));
      return;
    }
    cb(null, true);
  }
});

const sanitizeUser = (user: any) =>
  user ? { _id: String(user._id), username: user.username, email: user.email, avatar: user.avatar, googleId: user.googleId } : null;

function handleError(res: Response, error: unknown) {
  if (error instanceof z.ZodError) {
    const details = error.issues.map((i) => `${i.path.join(".") || "field"}: ${i.message}`).join("; ");
    return res.status(400).json({ message: `Validation error: ${details}`, issues: error.flatten() });
  }
  const message = error instanceof Error ? error.message : "Something went wrong";
  return res.status(500).json({ message });
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const parsed = adminPasswordSchema.safeParse(req.body);
  if (!parsed.success || parsed.data.adminPassword !== "Sangrah@2026") {
    return res.status(401).json({ message: "Invalid admin password" });
  }
  next();
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) return res.status(401).json({ message: "Please login to continue" });
  next();
}

function keepGuestCartSession(req: Request) {
  req.session.cartTouched = true;
}

export function registerRoutes(app: Express) {
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const input = signupSchema.parse(req.body);
      const existing = await UserModel.findOne({ email: input.email.toLowerCase() });
      if (existing) return res.status(409).json({ message: "Email already registered" });
      const passwordHash = await bcrypt.hash(input.password, 12);
      const user = await UserModel.create({ username: input.username, email: input.email.toLowerCase(), passwordHash });
      req.session.userId = String(user._id);
      res.status(201).json({ user: sanitizeUser(user) });
    } catch (error) {
      handleError(res, error);
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const input = loginSchema.parse(req.body);
      const user = await UserModel.findOne({ email: input.email.toLowerCase() });
      if (!user?.passwordHash || !(await bcrypt.compare(input.password, user.passwordHash))) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      req.session.userId = String(user._id);
      res.json({ user: sanitizeUser(user) });
    } catch (error) {
      handleError(res, error);
    }
  });

  app.post("/api/auth/google", async (req, res) => {
    try {
      const { credential } = googleAuthSchema.parse(req.body);
      if (!process.env.GOOGLE_CLIENT_ID) return res.status(503).json({ message: "Google Sign-In is not configured" });
      const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: process.env.GOOGLE_CLIENT_ID });
      const payload = ticket.getPayload();
      if (!payload?.email) return res.status(401).json({ message: "Unable to verify Google account" });
      const user = await UserModel.findOneAndUpdate(
        { email: payload.email.toLowerCase() },
        {
          $set: {
            username: payload.name || payload.email.split("@")[0],
            email: payload.email.toLowerCase(),
            avatar: payload.picture,
            googleId: payload.sub
          }
        },
        { upsert: true, new: true }
      );
      req.session.userId = String(user._id);
      res.json({ user: sanitizeUser(user) });
    } catch (error) {
      handleError(res, error);
    }
  });

  app.get("/api/auth/me", async (req, res) => {
    if (!req.session.userId) return res.json({ user: null });
    const user = await UserModel.findById(req.session.userId);
    res.json({ user: sanitizeUser(user) });
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy(() => res.json({ ok: true }));
  });

  app.get("/api/auth/google-client-id", (_req, res) => {
    res.json({ clientId: process.env.GOOGLE_CLIENT_ID || "" });
  });

  app.get("/api/payments/config", (_req, res) => {
    res.json({
      razorpayKeyId: process.env.RAZORPAY_KEY_ID || "",
      razorpayEnabled: Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET)
    });
  });

  app.get("/api/categories", async (_req, res) => res.json(await storage.getCategories()));
  app.post("/api/categories", requireAdmin, async (req, res) => {
    try {
      res.status(201).json(await storage.createCategory(categorySchema.parse(req.body)));
    } catch (error) {
      handleError(res, error);
    }
  });

  app.get("/api/products", async (req, res) => {
    res.json(await storage.getProducts(req.query as Record<string, string>));
  });

  app.get("/api/products/:slug", async (req, res) => {
    const product = await storage.getProductBySlug(req.params.slug);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  });

  app.post("/api/admin/products", requireAdmin, async (req, res) => {
    try {
      res.status(201).json(await storage.createProduct(productSchema.parse(req.body)));
    } catch (error) {
      handleError(res, error);
    }
  });

  app.patch("/api/admin/products/:id", requireAdmin, async (req, res) => {
    try {
      const { adminPassword, ...data } = req.body;
      res.json(await storage.updateProduct(String(req.params.id), productSchema.partial().parse(data)));
    } catch (error) {
      handleError(res, error);
    }
  });

  app.delete("/api/admin/products/:id", requireAdmin, async (req, res) => {
    await storage.deleteProduct(String(req.params.id));
    res.json({ ok: true });
  });

  app.get("/api/media/:id", async (req, res) => {
    try {
      const image = await ImageModel.findById(req.params.id);
      if (!image) return res.status(404).send("Image not found");
      res.set("Content-Type", image.contentType);
      res.set("Cache-Control", "public, max-age=31536000, immutable");
      return res.send(image.data);
    } catch {
      return res.status(404).send("Image not found");
    }
  });

  app.post("/api/admin/upload/product-image", upload.single("image"), async (req, res) => {
    try {
      const parsed = adminPasswordSchema.safeParse(req.body);
      if (!parsed.success || parsed.data.adminPassword !== "Sangrah@2026") {
        return res.status(401).json({ message: "Invalid admin password" });
      }
      if (!req.file) return res.status(400).json({ message: "Image file is required" });

      const newImage = await ImageModel.create({
        filename: req.file.originalname,
        contentType: req.file.mimetype,
        data: req.file.buffer,
        size: req.file.size
      });

      res.status(201).json({ imageUrl: `/api/media/${newImage._id}` });
    } catch (error) {
      handleError(res, error);
    }
  });

  app.post("/api/admin/categories", requireAdmin, async (req, res) => {
    try {
      res.status(201).json(await storage.createCategory(categorySchema.parse(req.body)));
    } catch (error) {
      handleError(res, error);
    }
  });

  app.patch("/api/admin/categories/:id", requireAdmin, async (req, res) => {
    try {
      const { adminPassword, ...data } = req.body;
      res.json(await storage.updateCategory(String(req.params.id), categorySchema.partial().parse(data)));
    } catch (error) {
      handleError(res, error);
    }
  });

  app.delete("/api/admin/categories/:id", requireAdmin, async (req, res) => {
    await CategoryModel.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
  });

  app.post("/api/admin/orders/list", requireAdmin, async (_req, res) => {
    res.json(await storage.getAllOrders());
  });

  app.patch("/api/admin/orders/:id", requireAdmin, async (req, res) => {
    try {
      const status = req.body.status ? orderStatusSchema.parse(req.body.status) : undefined;
      const paymentStatus = req.body.paymentStatus ? paymentStatusSchema.parse(req.body.paymentStatus) : undefined;
      if (!status && !paymentStatus) {
        return res.status(400).json({ message: "Either status or paymentStatus is required" });
      }
      res.json(await storage.updateOrderStatus(String(req.params.id), status, paymentStatus));
    } catch (error) {
      handleError(res, error);
    }
  });

  app.post("/api/admin/orders/:id/shiprocket", requireAdmin, async (req, res) => {
    try {
      const order = await storage.getOrderById(String(req.params.id));
      if (!order) return res.status(404).json({ message: "Order not found" });
      const shiprocketOrder = await createShiprocketOrder(order);
      const updated = await storage.attachShiprocketShipment(order._id, {
        shiprocketOrderId: shiprocketOrder.order_id ? String(shiprocketOrder.order_id) : undefined,
        shiprocketShipmentId: shiprocketOrder.shipment_id ? String(shiprocketOrder.shipment_id) : undefined,
        shiprocketStatus: shiprocketOrder.status || shiprocketOrder.message || "Created",
        shiprocketAwbCode: shiprocketOrder.awb_code,
        shiprocketCourierName: shiprocketOrder.courier_name
      });
      res.status(201).json({ order: updated, shiprocketOrder });
    } catch (error) {
      handleError(res, error);
    }
  });

  // app.get("/api/cart", async (req, res) => res.json(await storage.getCart(req.sessionID)));
  // app.post("/api/cart", async (req, res) => {
  //   keepGuestCartSession(req);
  //   const input = cartItemSchema.parse(req.body);
  //   await storage.incrementCartItem(req.sessionID, input.productId, input.quantity);
  //   res.json(await storage.getCart(req.sessionID));
  // });
  // app.patch("/api/cart", async (req, res) => {
  //   keepGuestCartSession(req);
  //   const input = cartItemSchema.parse(req.body);
  //   await storage.upsertCartItem(req.sessionID, input.productId, input.quantity);
  //   res.json(await storage.getCart(req.sessionID));
  // });
  // app.delete("/api/cart", async (req, res) => {
  //   keepGuestCartSession(req);
  //   const productId = String(req.query.productId || "");
  //   if (productId) await storage.removeCartItem(req.sessionID, productId);
  //   else await storage.clearCart(req.sessionID);
  //   res.json(await storage.getCart(req.sessionID));
  // });

// ================= CART =================

app.get("/api/cart", async (req, res) => {
  const cart = await storage.getCart(req.sessionID);
  res.json(cart);
});

app.post("/api/cart", async (req, res) => {
  try {
    req.session.cartTouched = true;

    const input = cartItemSchema.parse(req.body);

    await storage.incrementCartItem(
      req.sessionID,
      input.productId,
      input.quantity
    );

    req.session.save(async () => {
      const cart = await storage.getCart(req.sessionID);
      res.json(cart);
    });

  } catch (error) {
    handleError(res, error);
  }
});

app.patch("/api/cart", async (req, res) => {
  try {
    req.session.cartTouched = true;

    const input = cartItemSchema.parse(req.body);

    await storage.upsertCartItem(
      req.sessionID,
      input.productId,
      input.quantity
    );

    req.session.save(async () => {
      const cart = await storage.getCart(req.sessionID);
      res.json(cart);
    });

  } catch (error) {
    handleError(res, error);
  }
});

app.delete("/api/cart", async (req, res) => {
  try {
    req.session.cartTouched = true;

    const productId = String(req.query.productId || "");

    if (productId) {
      await storage.removeCartItem(req.sessionID, productId);
    } else {
      await storage.clearCart(req.sessionID);
    }

    req.session.save(async () => {
      const cart = await storage.getCart(req.sessionID);
      res.json(cart);
    });

  } catch (error) {
    handleError(res, error);
  }
});

  app.post("/api/checkout", requireAuth, async (req, res) => {
    try {
      const input = checkoutSchema.parse(req.body);
      const order = await storage.createOrderFromCart(req.sessionID, req.session.userId!, input);

      if (input.paymentMethod === "razorpay") {
        if (!razorpay) return res.status(503).json({ message: "Razorpay is not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET." });
        const razorpayOrder = await razorpay.orders.create({
          amount: Math.round(order.total * 100),
          currency: "INR",
          receipt: order.orderNumber,
          notes: {
            appOrderId: order._id,
            appOrderNumber: order.orderNumber,
            userId: req.session.userId!
          }
        });
        await storage.attachRazorpayOrder(order._id, razorpayOrder.id);
        return res.status(201).json({ order: { ...order, razorpayOrderId: razorpayOrder.id }, razorpayOrder, razorpayKeyId: process.env.RAZORPAY_KEY_ID, razorpayEnabled: true });
      }

      if (input.paymentMethod === "demo_card") {
        return res.status(201).json({ order, razorpayOrder: null, razorpayEnabled: false });
      }

      return res.status(201).json({ order, razorpayOrder: null, razorpayEnabled: false });
    } catch (error) {
      handleError(res, error);
    }
  });

  app.post("/api/orders/:id/confirm", requireAuth, async (req, res) => {
    try {
      const order = await storage.getOrderById(String(req.params.id), req.session.userId);
      if (!order) return res.status(404).json({ message: "Order not found" });

      if (order.paymentMethod === "razorpay") {
        const input = razorpayVerifySchema.parse(req.body);
        if (!process.env.RAZORPAY_KEY_SECRET || !order.razorpayOrderId) return res.status(400).json({ message: "Razorpay payment is not ready" });
        if (input.razorpay_order_id !== order.razorpayOrderId) return res.status(400).json({ message: "Payment order mismatch" });
        const expected = crypto
          .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
          .update(`${input.razorpay_order_id}|${input.razorpay_payment_id}`)
          .digest("hex");
        if (expected !== input.razorpay_signature) return res.status(400).json({ message: "Payment signature verification failed" });
      }

      const paidOrder = await storage.markOrderPaid(order._id, req.body.razorpay_payment_id);
      await storage.clearCart(req.sessionID);
      res.json({ order: paidOrder });
    } catch (error) {
      handleError(res, error);
    }
  });

  app.post("/api/orders/:id/demo-pay", requireAuth, async (req, res) => {
    try {
      const order = await storage.getOrderById(String(req.params.id), req.session.userId);
      if (!order) return res.status(404).json({ message: "Order not found" });
      if (order.paymentMethod !== "demo_card") return res.status(400).json({ message: "Demo payment is only available for demo card orders" });
      const paidOrder = await storage.markOrderPaid(order._id, `demo_${Date.now()}`);
      await storage.clearCart(req.sessionID);
      res.json({ order: paidOrder });
    } catch (error) {
      handleError(res, error);
    }
  });

  app.post("/api/orders/:id/cancel", requireAuth, async (req, res) => {
    try {
      const order = await storage.cancelOrder(String(req.params.id), req.session.userId!);
      if (!order) return res.status(404).json({ message: "Order not found" });
      res.json({ order });
    } catch (error) {
      handleError(res, error);
    }
  });

  app.get("/api/orders", requireAuth, async (req, res) => {
    res.json(await storage.getOrders(req.session.userId!));
  });

  app.get("/api/orders/:id", requireAuth, async (req, res) => {
    const order = await storage.getOrderById(String(req.params.id), req.session.userId);
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json(order);
  });

  app.get("/api/wishlist", async (req, res) => res.json(await storage.getWishlist(req.sessionID)));
  app.post("/api/wishlist", async (req, res) => {
    const { productId } = cartItemSchema.pick({ productId: true }).parse(req.body);
    await storage.addWishlist(req.sessionID, productId, req.session.userId);
    res.json(await storage.getWishlist(req.sessionID));
  });
  app.delete("/api/wishlist", async (req, res) => {
    await storage.removeWishlist(req.sessionID, String(req.query.productId || ""));
    res.json(await storage.getWishlist(req.sessionID));
  });

  app.get("/api/products/:slug/reviews", async (req, res) => res.json(await storage.getReviews(req.params.slug)));
  app.post("/api/products/:slug/reviews", async (req, res) => {
    try {
      res.status(201).json(await storage.createReview(req.params.slug, reviewSchema.parse(req.body), req.session.userId));
    } catch (error) {
      handleError(res, error);
    }
  });
}
