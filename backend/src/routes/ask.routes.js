import express from "express";
import { hybridSearchClient, buildServiceMetadata } from "../grpc/hybridSearchClient.js";
import mongoose from "mongoose";
import { ChatSession } from "../models/chatSession.model.js";

const router = express.Router();

const MAX_QUESTION_LENGTH = 2000;
// How much of the chat is sent with each question (the Python side trims further).
const HISTORY_MESSAGES = 8;
// Replies that are app/service errors, not answers — useless as conversation context.
const NON_ANSWER = /^(Sorry, the AI assistant|The AI service is very busy|Out of tokens|No answer came back|\[Response interrupted)/;

/**
 * Recent turns of this chat plus the emails the last answer was based on,
 * loaded from the database (never trusted from the client) and scoped to the
 * signed-in user, so follow-ups like "tell me more about the second one" work.
 */
async function loadConversation(sessionId, userEmail) {
    if (!sessionId || !mongoose.isValidObjectId(sessionId)) return { history: [], carryOverIds: [] };
    const session = await ChatSession.findOne(
        { _id: sessionId, userEmail },
        { messages: { $slice: -HISTORY_MESSAGES } }
    ).lean();
    const messages = (session?.messages || []).filter((m) => m.content && !NON_ANSWER.test(m.content.trim()));
    const lastAi = [...messages].reverse().find((m) => m.role === "ai");
    return {
        history: messages.map((m) => ({ role: m.role, content: m.content })),
        carryOverIds: (lastAi?.metadata?.sources || []).map((s) => s.message_id).filter(Boolean).slice(0, 5)
    };
}

/**
 * POST /ask
 * Streams answer to user query via Server-Sent Events (SSE)
 * Request body: { question: string, userEmail: string, sessionId?: string }
 */
router.post("/", async (req, res) => {
    const { question, sessionId } = req.body;
    const userEmail = req.user.email; // from verified JWT — cannot be spoofed

    if (!question || typeof question !== "string") {
        return res.status(400).json({ error: "question is required" });
    }
    if (question.length > MAX_QUESTION_LENGTH) {
        return res.status(400).json({ error: `question must be under ${MAX_QUESTION_LENGTH} characters` });
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

    let conversation = { history: [], carryOverIds: [] };
    try {
        conversation = await loadConversation(sessionId, userEmail);
    } catch (err) {
        console.warn("[/ask] could not load chat history:", err.message); // answer without it
    }

    // Initiate gRPC streaming call to Python service
    const call = hybridSearchClient.AskQuestion({
        user_email: userEmail,
        question: question,
        top_k: 5,
        history: conversation.history,
        carry_over_ids: conversation.carryOverIds
    }, buildServiceMetadata());

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
        // Don't save an empty AI reply into the chat history.
        if (sessionId && fullAiResponse.trim()) {
            try {
                // Scoped to the authenticated user — prevents cross-user session injection
                await ChatSession.findOneAndUpdate(
                    { _id: sessionId, userEmail },
                    {
                        $push: {
                            messages: [
                                { role: 'user', content: question, timestamp: new Date() },
                                { role: 'ai', content: fullAiResponse, timestamp: new Date(), metadata: { sources: finalSources } }
                            ]
                        }
                    }
                );
            } catch (dbErr) {
                console.error("[/ask] DB persist error:", dbErr);
            }
        }

        res.end();
    } catch (err) {
        console.error("[/ask] gRPC stream error:", err);
        if (!res.writableEnded) {
            res.write(`data: ${JSON.stringify({ error: "Something went wrong while generating a response." })}\n\n`);
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
