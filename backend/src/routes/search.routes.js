import express from "express";
import { hybridSearchClient } from "../grpc/hybridSearchClient.js";

const router = express.Router();

/**
 * POST /search/v2
 * Hybrid search endpoint utilizing BM25, semantic vector search, and reranking.
 * Request body: { query: string, userEmail: string, limit?: number, offset?: number }
 */
router.post("/v2", async (req, res) => {
    const { query, userEmail, limit, offset } = req.body;

    if (!query) {
        return res.status(400).json({ error: "query is required" });
    }
    if (!userEmail) {
        return res.status(400).json({ error: "userEmail is required" });
    }

    console.log(`[HOP 1: Express Route] Received query="${query}", userEmail="${userEmail}"`);

    hybridSearchClient.Search({
        query: query,
        user_email: userEmail,
        limit: limit || 20,
        offset: offset || 0
    }, (err, response) => {
        if (err) {
            console.error("[/search/v2] gRPC search error:", err);
            // 14 is grpc.status.UNAVAILABLE
            if (err.code === 14) {
                return res.status(503).json({ error: "Search service is temporarily unreachable" });
            }
            return res.status(500).json({ error: "Internal search service error" });
        }

        // Map the protobuf response to the frontend contract,
        // explicitly including the degraded and stages_timed_out fields.
        res.json({
            results: response.results || [],
            total: response.total || 0,
            query_interpretation: response.query_interpretation || {},
            timings: response.timings || {},
            degraded: response.degraded || false,
            stages_timed_out: response.stages_timed_out || []
        });
    });
});

export default router;
