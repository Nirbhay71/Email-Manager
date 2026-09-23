import { Category } from "../models/category.model.js";
import { getStatus } from "../grpc/classifierClient.js";

// Must be kept in sync with MIN_EXAMPLES_PER_CATEGORY in classifier-service/.env.
// Only used as a display fallback for categories with zero examples so far,
// which never show up in the gRPC status response at all.
const DEFAULT_EXAMPLES_NEEDED = 15;

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
        const userEmail = req.user.email; // from verified JWT

        const [categories, grpcStatus] = await Promise.all([
            Category.find({ userEmail })
                .sort({ createdAt: -1 })
                .select("name createdAt updatedAt")
                .lean(),
            getStatus(userEmail).catch((err) => {
                // A classifier-service hiccup shouldn't break the category list —
                // just fall back to "no examples yet" for every category.
                console.warn("[categories] status gRPC call failed:", err.message);
                return { categories: [] };
            })
        ]);

        const statusByName = new Map(
            (grpcStatus.categories || []).map((s) => [s.category, s])
        );

        res.json({
            categories: categories.map((category) => {
                const status = statusByName.get(category.name);
                return {
                    ...toCategory(category),
                    count: status ? status.count : 0,
                    autoClassifyEnabled: status ? status.auto_classify_enabled : false,
                    examplesNeeded: status ? status.examples_needed : DEFAULT_EXAMPLES_NEEDED
                };
            }),
            total: categories.length
        });
    } catch (error) {
        console.error("[categories] list error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const createCategory = async (req, res) => {
    try {
        const userEmail = req.user.email; // from verified JWT
        const name = normalizeName(req.body.name);

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
