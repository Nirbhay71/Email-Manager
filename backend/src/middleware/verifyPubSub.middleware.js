import { OAuth2Client } from "google-auth-library";

const client = new OAuth2Client();

/**
 * verifyPubSub — validates the Google-issued OIDC token on incoming Pub/Sub push messages.
 *
 * Google attaches:  Authorization: Bearer <OIDC_TOKEN>
 * to every push request. We verify the token's signature and audience before
 * allowing the webhook handler to process the message.
 *
 * Required env var:
 *   PUBSUB_AUDIENCE — the full URL of this webhook endpoint that you registered
 *                     when creating the Pub/Sub push subscription.
 *                     e.g. https://abc123.ngrok.io/webhook/gmail
 *                     In dev you can omit this to skip strict audience check.
 */
export async function verifyPubSub(req, res, next) {
    // Dev bypass: if PUBSUB_AUDIENCE is not configured, skip verification
    // Set PUBSUB_AUDIENCE in .env to enable enforcement (required in production)
    if (!process.env.PUBSUB_AUDIENCE) {
        console.warn("[webhook] ⚠️  PUBSUB_AUDIENCE not set — skipping OIDC verification (dev mode)");
        return next();
    }

    const authHeader = req.headers["authorization"];

    if (!authHeader?.startsWith("Bearer ")) {
        console.warn("[webhook] Missing or malformed Authorization header — rejecting");
        return res.status(401).send("Unauthorized");
    }

    const token = authHeader.slice(7);

    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            // If PUBSUB_AUDIENCE is not set (local dev without ngrok), skip audience check.
            // Set it to your full webhook URL in production/staging.
            audience: process.env.PUBSUB_AUDIENCE || undefined,
        });

        const claims = ticket.getPayload();

        // Optionally confirm the token was issued for our service account
        const expectedEmail = process.env.PUBSUB_SERVICE_ACCOUNT_EMAIL;
        if (expectedEmail && claims?.email !== expectedEmail) {
            console.warn(`[webhook] OIDC token email mismatch: got ${claims?.email}, expected ${expectedEmail}`);
            return res.status(403).send("Forbidden");
        }

        req.pubsubClaims = claims; // available in handler if needed
        next();
    } catch (err) {
        console.error("[webhook] OIDC token verification failed:", err.message);
        return res.status(401).send("Invalid Pub/Sub token");
    }
}
