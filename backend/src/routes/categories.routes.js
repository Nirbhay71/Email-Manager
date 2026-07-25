import express from "express";
import { Category } from "../models/category.model.js";
import { getStatus } from "../grpc/classifierClient.js";

const router = express.Router();

// GET /categories?userEmail=...
router.get("/", async (req, res) => {
    try {
        const { userEmail } = req.query;
        if (!userEmail) {
            return res.status(400).json({ error: "userEmail query parameter is required" });
        }
        
        // Fetch categories defined by user in database
        const dbCategories = await Category.find({ userEmail });
        
        // Fetch status from classifier gRPC service
        let grpcStatus = { categories: [] };
        try {
            grpcStatus = await getStatus(userEmail);
        } catch (grpcErr) {
            console.warn(`[gRPC] Failed to get category status: ${grpcErr.message}`);
        }
        
        // Merge them
        const merged = dbCategories.map(cat => {
            const status = grpcStatus.categories.find(c => c.category === cat.name) || {
                count: 0,
                auto_classify_enabled: false,
                examples_needed: 15
            };
            return {
                _id: cat._id,
                name: cat.name,
                userEmail: cat.userEmail,
                count: status.count,
                autoClassifyEnabled: status.auto_classify_enabled,
                examplesNeeded: status.examples_needed,
                summary: cat.summary || "",
                pendingCount: cat.pendingCount || 0,
                pendingEmailIds: cat.pendingEmailIds || [],
                summaryNeedsUpdate: cat.summaryNeedsUpdate || false
            };
        });
        
        return res.json({ categories: merged });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

// POST /categories
router.post("/", async (req, res) => {
    try {
        const { userEmail, name } = req.body;
        if (!userEmail || !name) {
            return res.status(400).json({ error: "userEmail and name are required fields" });
        }
        
        // Create new category in MongoDB
        const category = await Category.create({ userEmail, name });
        return res.status(201).json({ category });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ error: "Category already exists for this user" });
        }
        return res.status(500).json({ error: error.message });
    }
});

// DELETE /categories/:name
router.delete("/:name", async (req, res) => {
    try {
        const { name } = req.params;
        const { userEmail } = req.query;
        if (!userEmail) {
            return res.status(400).json({ error: "userEmail query parameter is required" });
        }
        
        const deleted = await Category.findOneAndDelete({ userEmail, name });
        if (!deleted) {
            return res.status(404).json({ error: "Category not found" });
        }
        return res.json({ success: true, message: `Category "${name}" deleted` });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

export default router;
