import { Category } from "../models/category.model.js";

function normalizeName(name = "") {
    return name.replace(/\s+/g, " ").trim();
}

function toCategory(category) {
    return {
        id: category._id?.toString(),
        name: category.name,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt
    };
}

export const getCategories = async (req, res) => {
    try {
        const { userEmail } = req.query;

        if (!userEmail) {
            return res.status(400).json({ error: "userEmail query param required" });
        }

        const categories = await Category.find({ userEmail })
            .sort({ createdAt: -1 })
            .select("name createdAt updatedAt")
            .lean();

        res.json({
            categories: categories.map(toCategory),
            total: categories.length
        });
    } catch (error) {
        console.error("[categories] list error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const createCategory = async (req, res) => {
    try {
        const { userEmail } = req.body;
        const name = normalizeName(req.body.name);

        if (!userEmail) {
            return res.status(400).json({ error: "userEmail is required" });
        }

        if (!name) {
            return res.status(400).json({ error: "category name is required" });
        }

        const category = await Category.create({ userEmail, name });

        res.status(201).json({
            category: toCategory(category)
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ error: "Category already exists" });
        }

        console.error("[categories] create error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};
