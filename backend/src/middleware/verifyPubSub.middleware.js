import { OAuth2Client } from "google-auth-library";

const client = new OAuth2Client();

/**
 * verifyPubSub — validates the OIDC bearer token Google Cloud Pub/Sub
 * attaches to push requests. Fails closed: with no valid, correctly
 * audienced, correctly issued token from the configured service account,
 * the request is rejected. Skipping verification is only permitted when
 * NODE_ENV=development, and only then.
 */
export async function verifyPubSub(req, res, next) {
    const audience = process.env.PUBSUB_AUDIENCE;
    const expectedServiceAccount = process.env.PUBSUB_SERVICE_ACCOUNT_EMAIL;

    if (!audience || !expectedServiceAccount) {
        if (process.env.NODE_ENV === "development") {
            console.warn("[verifyPubSub] PUBSUB_AUDIENCE/PUBSUB_SERVICE_ACCOUNT_EMAIL not set — skipping verification (development only)");
            return next();
        }
        console.error("[verifyPubSub] PUBSUB_AUDIENCE/PUBSUB_SERVICE_ACCOUNT_EMAIL not configured — rejecting webhook");
        return res.status(503).send("webhook not configured");
    }

    const authHeader = req.headers.authorization || "";
    const [, token] = authHeader.split(" ");
    if (!token) {
        return res.status(401).send("missing bearer token");
    }

    try {
        const ticket = await client.verifyIdToken({ idToken: token, audience });
        const payload = ticket.getPayload();

        if (!payload?.email_verified || payload.email !== expectedServiceAccount) {
            console.warn(`[verifyPubSub] rejected token for unexpected principal: ${payload?.email}`);
            return res.status(401).send("unauthorized principal");
        }

        next();
    } catch (err) {
        console.warn(`[verifyPubSub] token verification failed: ${err.message}`);
        return res.status(401).send("invalid token");
    }
}
