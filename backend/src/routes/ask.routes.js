import express from "express";
import { hybridSearchClient } from "../grpc/hybridSearchClient.js";
import { ChatSession } from "../models/chatSession.model.js";

const router = express.Router();

router.get("/", (req, res) => {
    res.redirect("/test-ai");
});

/**
 * POST /ask
 * Streams answer to user query via Server-Sent Events (SSE)
 * Request body: { question: string, userEmail: string, sessionId?: string }
 */
router.post("/", async(req, res) => {
    const { question, userEmail, sessionId } = req.body;

    if (!question || !userEmail) {
        return res.status(400).json({ error: "question and userEmail are required" });
    }

    // Set Server-Sent Events (SSE) headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders(); // Send headers immediately so client knows connection is open

    // Send a heartbeat every 1s so clients (Postman/browser) don't time out
    // while Python is embedding the query and waiting for Gemini to start
    const keepalive = setInterval(() => {
        if (!res.writableEnded) {
            res.write(': keepalive\n\n');
        }
    }, 1000);

    // Initiate gRPC streaming call to Python service
    const call = hybridSearchClient.AskQuestion({
        user_email: userEmail,
        question: question,
        top_k: 5
    });

    let fullAiResponse = "";
    let finalSources = [];

    try {
        for await (const chunk of call) {
            if (chunk.text_delta) {
                fullAiResponse += chunk.text_delta;
            }
            if (chunk.is_final && chunk.sources) {
                finalSources = chunk.sources;
            }
            // Write streamed chunk as JSON event
            res.write(`data: ${JSON.stringify(chunk)}\n\n`);
        }
        
        // After streaming is done, persist to DB if sessionId is provided
        if (sessionId) {
            try {
                await ChatSession.findByIdAndUpdate(sessionId, {
                    $push: {
                        messages: [
                            { role: 'user', content: question, timestamp: new Date() },
                            { role: 'ai', content: fullAiResponse, timestamp: new Date(), metadata: { sources: finalSources } }
                        ]
                    }
                });
            } catch (dbErr) {
                console.error("[/ask] DB persist error:", dbErr);
            }
        }

        res.end();
    } catch (err) {
        console.error("[/ask] gRPC stream error:", err);
        if (!res.writableEnded) {
            res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
            res.end();
        }
    } finally {
        clearInterval(keepalive);
    }

    req.on("close", () => {
        clearInterval(keepalive);
        if (!res.writableEnded) {
            res.end();
        }
    });
});

export default router;
