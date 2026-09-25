import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes.js";
import webhookRoutes from "./routes/webhook.routes.js";
import askRoutes from "./routes/ask.routes.js";
import searchRoutes from "./routes/search.routes.js";
import emailRoutes from "./routes/email.routes.js";
import categoryRoutes from "./routes/category.routes.js";
import calendarRoutes from "./routes/calendar.routes.js";
import chatRoutes from "./routes/chat.routes.js";
import { requireAuth } from "./middleware/auth.middleware.js";

const app = express();

// Behind exactly one reverse proxy (ngrok / a load balancer): trust its X-Forwarded-For
// so express-rate-limit keys on the real client IP. Set TRUST_PROXY=0 if run without a proxy.
app.set("trust proxy", Number(process.env.TRUST_PROXY ?? 1));

app.use(helmet());

app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,   // required for cookies to be sent cross-origin
}));

app.use(express.json({ limit: "100kb" }));
app.use(cookieParser());  // parse httpOnly cookies on every request

// Generous global limiter as a backstop against abuse/scraping
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(globalLimiter);

// Tighter limits on auth and AI/search endpoints (brute-force / cost abuse)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: true,
    legacyHeaders: false,
});
const aiLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 15,
    standardHeaders: true,
    legacyHeaders: false,
});

// ─── Public routes ────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
    res.send("AI Email Manager — go to /auth/google to register.");
});

// Used by hosting platforms / process managers to know the process is up and
// actually connected to MongoDB, not just that Node is running.
app.get("/health", (req, res) => {
    const dbUp = mongoose.connection.readyState === 1; // 1 = connected
    res.status(dbUp ? 200 : 503).json({ status: dbUp ? "ok" : "degraded", db: dbUp ? "up" : "down" });
});

app.use("/auth/refresh", authLimiter);
app.use("/auth", authRoutes);      // /auth/google, /auth/google/callback, /auth/refresh (public)
app.use("/webhook", webhookRoutes);   // called by Google Pub/Sub, not by users

// ─── Protected routes (require valid accessToken cookie) ─────────────────────
app.use("/ask", requireAuth, aiLimiter, askRoutes);
app.use("/search", requireAuth, aiLimiter, searchRoutes);
app.use("/emails", requireAuth, emailRoutes);
app.use("/categories", requireAuth, categoryRoutes);
app.use("/calendar", requireAuth, calendarRoutes);
app.use("/chat", requireAuth, chatRoutes);

// ─── 404 + error handlers (must stay last) ────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({ error: "Not found" });
});

// eslint-disable-next-line no-unused-vars -- Express requires 4 params to recognize an error handler
app.use((err, req, res, next) => {
    console.error("[app] unhandled error:", err);
    res.status(err.status || 500).json({ error: "Internal server error" });
});

export default app;
