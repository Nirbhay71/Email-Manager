import dotenv from "dotenv";
dotenv.config({ path: "./src/.env" });
import connectDB from "./db/index.db.js";
import app from "./app.js";

// A single unhandled throw or rejected promise shouldn't silently take down
// every user's session with no trace of why — log it and exit so a process
// manager (pm2, systemd, the hosting platform) can restart cleanly.
process.on("uncaughtException", (err) => {
    console.error("[fatal] uncaught exception:", err);
    process.exit(1);
});
process.on("unhandledRejection", (reason) => {
    console.error("[fatal] unhandled rejection:", reason);
    process.exit(1);
});

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
        console.log(`Expose it with: ngrok http ${PORT}`);
    });
});