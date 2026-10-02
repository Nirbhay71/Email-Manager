import { User } from "../models/user.model.js";
import { startWatch } from "../service/gmail.service.js";
import { flagIfReauthNeeded } from "../service/ingest.service.js";

// Gmail watches expire after 7 days; renew anything within 2 days of lapsing.
const RENEW_WITHIN_MS = 2 * 24 * 60 * 60 * 1000;
const CHECK_EVERY_MS = 6 * 60 * 60 * 1000;

/**
 * Re-registers the Gmail Pub/Sub watch for every user whose watch is missing
 * or about to expire. Without this, push notifications silently stop a week
 * after each user's last login.
 *
 * Deliberately does NOT touch user.historyId: a fresh watch returns the
 * mailbox's *current* historyId, and adopting it would skip any mail that
 * arrived since the last processed notification.
 */
export async function renewExpiringWatches() {
    const cutoff = new Date(Date.now() + RENEW_WITHIN_MS);
    const users = await User.find({
        tokens: { $exists: true, $ne: null },
        needsReauth: { $ne: true },
        $or: [{ watchExpiration: null }, { watchExpiration: { $lt: cutoff } }]
    }).select("email tokens");

    let renewed = 0;
    for (const user of users) {
        try {
            const result = await startWatch(user.tokensPlain);
            await User.updateOne(
                { _id: user._id },
                { $set: { watchExpiration: new Date(Number(result.expiration)) } }
            );
            renewed += 1;
        } catch (err) {
            if (!(await flagIfReauthNeeded(user.email, err))) {
                console.warn(`[gmailWatch] renewal failed for user ${user._id}: ${err.message}`);
            }
        }
    }
    if (users.length) console.log(`[gmailWatch] renewed ${renewed}/${users.length} watch(es)`);
}

export function scheduleWatchRenewal() {
    const run = () => renewExpiringWatches().catch((err) => {
        console.error("[gmailWatch] renewal sweep failed:", err.message);
    });
    run();
    setInterval(run, CHECK_EVERY_MS).unref();
}
