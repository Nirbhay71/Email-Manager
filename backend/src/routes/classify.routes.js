import express from "express";
import { Email } from "../models/email.model.js";
import { storeManualLabel, recordFeedback, getStatus } from "../grpc/classifierClient.js";

const router = express.Router();

// GET /classify/status?userEmail=...
router.get("/status", async (req, res) => {
    try {
        const { userEmail } = req.query;
        if (!userEmail) {
            return res.status(400).json({ error: "userEmail query parameter is required" });
        }
        const status = await getStatus(userEmail);
        return res.json(status);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

// GET /classify/emails?userEmail=...
router.get("/emails", async (req, res) => {
    try {
        const { userEmail } = req.query;
        if (!userEmail) {
            return res.status(400).json({ error: "userEmail query parameter is required" });
        }
        const emails = await Email.find({ userEmail }).sort({ createdAt: -1 });
        return res.json({ emails });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

// POST /classify/label
router.post("/label", async (req, res) => {
    try {
        const { userEmail, emailId, category } = req.body;
        if (!userEmail || !emailId || !category) {
            return res.status(400).json({ error: "userEmail, emailId, and category are required" });
        }
        
        // Find email to get details
        const emailRecord = await Email.findOne({ userEmail, messageId: emailId });
        if (!emailRecord) {
            return res.status(404).json({ error: "Email not found" });
        }
        
        const emailContent = {
            email_id: emailId,
            subject: emailRecord.subject,
            body_snippet: emailRecord.body ? emailRecord.body.substring(0, 500) : "",
            sender: emailRecord.from
        };
        
        const resGrpc = await storeManualLabel(userEmail, emailContent, category);
        
        // Update database record with the assigned category
        emailRecord.category = category;
        emailRecord.needsReview = false;
        await emailRecord.save();
        
        return res.json({
            success: true,
            categoryCount: resGrpc.category_count,
            thresholdCrossed: resGrpc.threshold_crossed
        });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

// POST /classify/feedback
router.post("/feedback", async (req, res) => {
    try {
        const { userEmail, emailId, predictedCategory, correctCategory } = req.body;
        if (!userEmail || !emailId || !predictedCategory || !correctCategory) {
            return res.status(400).json({ error: "userEmail, emailId, predictedCategory, and correctCategory are required" });
        }
        
        // Find email to get details
        const emailRecord = await Email.findOne({ userEmail, messageId: emailId });
        if (!emailRecord) {
            return res.status(404).json({ error: "Email not found" });
        }
        
        const emailContent = {
            email_id: emailId,
            subject: emailRecord.subject,
            body_snippet: emailRecord.body ? emailRecord.body.substring(0, 500) : "",
            sender: emailRecord.from
        };
        
        const resGrpc = await recordFeedback(userEmail, emailContent, predictedCategory, correctCategory);
        
        // Update database record
        emailRecord.category = correctCategory;
        emailRecord.needsReview = false;
        await emailRecord.save();
        
        return res.json({
            success: true,
            categoryCount: resGrpc.category_count,
            thresholdCrossed: resGrpc.threshold_crossed
        });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

export default router;
