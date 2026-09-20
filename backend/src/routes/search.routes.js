import express from "express";
import { hybridSearchClient, buildServiceMetadata } from "../grpc/hybridSearchClient.js";

const router = express.Router();

/**
 * POST /search/v2
 * Hybrid search endpoint utilizing BM25, semantic vector search, and reranking.
 * Request body: { query: string, userEmail: string, limit?: number, offset?: number }
 */
const MAX_QUERY_LENGTH = 500;
const MAX_LIMIT = 100;

router.post("/v2", async (req, res) => {
    const { query, limit, offset } = req.body;
    const userEmail = req.user.email; // from verified JWT — cannot be spoofed

    if (!query || typeof query !== "string") {
        return res.status(400).json({ error: "query is required" });
    }
    if (query.length > MAX_QUERY_LENGTH) {
        return res.status(400).json({ error: `query must be under ${MAX_QUERY_LENGTH} characters` });
    }

    const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), MAX_LIMIT);
    const safeOffset = Math.max(Number(offset) || 0, 0);

    hybridSearchClient.Search({
        query: query,
        user_email: userEmail,
        limit: safeLimit,
        offset: safeOffset
    }, buildServiceMetadata(), (err, response) => {
        if (err) {
            console.error("[/search/v2] gRPC search error:", err.message);
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
