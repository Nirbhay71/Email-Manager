import express from "express";
import cors from "cors";
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

app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,   // required for cookies to be sent cross-origin
}));

app.use(express.json());
app.use(cookieParser());  // parse httpOnly cookies on every request

// ─── Public routes ────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
    res.send("AI Email Manager — go to /auth/google to register.");
});

app.use("/auth", authRoutes);      // /auth/google, /auth/google/callback, /auth/refresh (public)
app.use("/webhook", webhookRoutes);   // called by Google Pub/Sub, not by users

// ─── Protected routes (require valid accessToken cookie) ─────────────────────
app.use("/ask", requireAuth, askRoutes);
app.use("/search", requireAuth, searchRoutes);
app.use("/emails", requireAuth, emailRoutes);
app.use("/categories", requireAuth, categoryRoutes);
app.use("/calendar", requireAuth, calendarRoutes);
app.use("/chat", requireAuth, chatRoutes);

// ─── Developer test panel (keep public for now, reads no user data) ───────────
app.get("/test-ai", (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Email Assistant - Live Console</title>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&family=Fira+Code:wght@400;500&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg-color: #0b0816;
            --card-bg: rgba(20, 16, 38, 0.6);
            --border-color: rgba(255, 255, 255, 0.08);
            --accent-primary: linear-gradient(135deg, #a855f7 0%, #6366f1 100%);
            --accent-hover: linear-gradient(135deg, #c084fc 0%, #818cf8 100%);
            --text-primary: #f3f4f6;
            --text-secondary: #9ca3af;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            background-color: var(--bg-color);
            background-image:
                radial-gradient(at 0% 0%, rgba(168, 85, 247, 0.15) 0px, transparent 50%),
                radial-gradient(at 100% 100%, rgba(99, 102, 241, 0.15) 0px, transparent 50%);
            font-family: 'Outfit', sans-serif;
            color: var(--text-primary);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 2rem;
        }
        .container { width: 100%; max-width: 800px; background: var(--card-bg); backdrop-filter: blur(20px); border: 1px solid var(--border-color); border-radius: 24px; padding: 2.5rem; }
        h1 { font-size: 2rem; font-weight: 800; margin-bottom: 0.5rem; background: var(--accent-primary); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        p.subtitle { color: var(--text-secondary); margin-bottom: 2rem; }
        .note { background: rgba(168,85,247,0.1); border: 1px solid rgba(168,85,247,0.3); border-radius: 12px; padding: 1rem 1.25rem; margin-bottom: 1.5rem; font-size: 0.9rem; color: var(--text-secondary); }
        .note strong { color: #a855f7; }
        a.login-link { display: inline-block; padding: 0.75rem 1.5rem; background: var(--accent-primary); border-radius: 12px; color: white; text-decoration: none; font-weight: 600; }
    </style>
</head>
<body>
    <div class="container">
        <h1>AI Email Assistant</h1>
        <p class="subtitle">Developer test panel</p>
        <div class="note">
            <strong>⚠️ Authentication required.</strong> This panel now requires you to be logged in.
            The <code>/ask</code> endpoint reads your email from your session cookie automatically.
        </div>
        <p style="margin-bottom:1.5rem;color:var(--text-secondary)">If you are not logged in, please authenticate first:</p>
        <a class="login-link" href="/auth/google">Sign in with Google</a>
    </div>
</body>
</html>
    `);
});

export default app;
