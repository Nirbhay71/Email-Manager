import express from "express";
import { Email } from "../models/email.model.js";

const router = express.Router();

/**
 * GET /inbox/emails
 * Fetch user's emails sorted by date descending, paginated.
 */
router.get("/emails", async (req, res) => {
    try {
        const { userEmail, page = 1, limit = 20 } = req.query;
        if (!userEmail) {
            return res.status(400).json({ error: "userEmail is required" });
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        const emails = await Email.find({ userEmail })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .lean();
            
        const total = await Email.countDocuments({ userEmail });

        res.json({
            emails: emails.map(e => ({
                emailId: e.messageId,
                subject: e.subject,
                from: e.from,
                date: e.createdAt,
                snippet: (e.body || "").slice(0, 250)
            })),
            total,
            page: parseInt(page),
            pages: Math.ceil(total / parseInt(limit))
        });
    } catch (error) {
        console.error("[inbox/emails] error:", error);
        res.status(500).json({ error: "Failed to fetch emails" });
    }
});

/**
 * POST /inbox/score
 * Proxy to the Python Flask scoring endpoint.
 * Handles graceful degradation if Python service is down.
 */
router.post("/score", async (req, res) => {
    try {
        const { userEmail, emailId } = req.body;
        if (!userEmail || !emailId) {
            return res.status(400).json({ error: "userEmail and emailId are required" });
        }

        const FLASK_URL = process.env.FLASK_API_URL || "http://127.0.0.1:5001";
        
        const response = await fetch(`${FLASK_URL}/score`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userEmail, emailId })
        });

        if (!response.ok) {
            console.error(`[inbox/score] Flask returned ${response.status}`);
            throw new Error(`Flask error: ${response.status}`);
        }

        const data = await response.json();
        res.json(data);
        
    } catch (error) {
        console.warn("[inbox/score] Proxy error (Python service may be down):", error.message);
        // Graceful fallback to avoid crashing the frontend
        res.json({
            score: 0,
            calibrated: false,
            prediction: "not_important",
            reasons: [],
            fallback: true
        });
    }
});

export default router;
