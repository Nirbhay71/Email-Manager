import express from "express";
import authRoutes from "./routes/auth.routes.js";
import webhookRoutes from "./routes/webhook.routes.js";

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
    res.send("AI Email Manager — go to /auth/google to register.");
});

app.use("/auth", authRoutes);
app.use("/webhook", webhookRoutes);

export default app;