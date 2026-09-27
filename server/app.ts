import "dotenv/config";
import express from "express";
import cors from "cors";
import session from "express-session";
import MongoStore from "connect-mongo";
import { connectDB } from "./db";
import { registerRoutes } from "./routes";

let appPromise: Promise<express.Express> | null = null;

export async function createApp() {
  if (appPromise) return appPromise;

  appPromise = (async () => {
    await connectDB();

    const app = express();
    const isProduction = process.env.NODE_ENV === "production";

    app.use(express.json({ limit: "1mb" }));
    app.use(
      cors({
        origin: process.env.FRONTEND_URL || true,
        credentials: true
      })
    );

    app.use(
      session({
        secret: process.env.SESSION_SECRET || "dev-session-secret-change-me",
        resave: false,
        saveUninitialized: true,
        proxy: true,
        store: MongoStore.create({
          mongoUrl: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/modi-glasses"
        }),
        cookie: {
          httpOnly: true,
          sameSite: isProduction ? "none" : "lax",
          secure: isProduction,
          maxAge: 1000 * 60 * 60 * 24 * 30
        }
      })
    );

    registerRoutes(app);
    return app;
  })();

  return appPromise;
}
