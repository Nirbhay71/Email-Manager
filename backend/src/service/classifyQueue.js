import { createClient } from "redis";

// classifier-service's ClassifyWorker consumes this stream in batches and
// writes results straight to the emails collection.
const STREAM = process.env.CLASSIFY_STREAM || "mailsense:classify";
// Bound the stream so a classifier outage can't grow Redis without limit.
const MAX_STREAM_LENGTH = 100000;
const FIRST_CONNECT_TIMEOUT_MS = 3000;

let client = null;
let firstConnect = null;
let waitedForFirstConnect = false;

function getClient() {
    if (!client) {
        client = createClient({
            url: process.env.REDIS_URL || "redis://localhost:6379",
            // Fail fast while disconnected instead of queueing commands in
            // memory — the caller has a direct-classification fallback.
            disableOfflineQueue: true,
            socket: { connectTimeout: FIRST_CONNECT_TIMEOUT_MS, reconnectStrategy: (retries) => Math.min(retries * 500, 5000) }
        });
        // Without a listener, node-redis connection errors crash the process.
        client.on("error", (err) => console.warn("[classifyQueue] redis error:", err.message));
        // Keeps reconnecting in the background for as long as the process runs.
        firstConnect = client.connect().catch(() => {});
    }
    return client;
}

/**
 * Queue an email for background classification.
 * Throws (within a few seconds at most) if Redis is unreachable, so the
 * caller can fall back instead of stalling ingestion.
 */
export async function enqueueClassification(userEmail, messageId) {
    const redis = getClient();
    if (!redis.isReady && !waitedForFirstConnect) {
        // Only the first call waits for the initial connection; afterwards a
        // down Redis fails immediately (it keeps reconnecting in the background).
        await Promise.race([firstConnect, new Promise((r) => setTimeout(r, FIRST_CONNECT_TIMEOUT_MS).unref())]);
        waitedForFirstConnect = true;
    }
    if (!redis.isReady) throw new Error("Redis not connected");
    await redis.xAdd(
        STREAM,
        "*",
        { user_email: userEmail, message_id: messageId },
        { TRIM: { strategy: "MAXLEN", strategyModifier: "~", threshold: MAX_STREAM_LENGTH } }
    );
}

export async function closeClassifyQueue() {
    if (client?.isOpen) await client.quit();
}
