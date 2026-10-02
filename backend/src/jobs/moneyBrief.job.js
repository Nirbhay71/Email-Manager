import { User } from "../models/user.model.js";
import { buildMoneyBrief, formatBriefText, hasNews } from "../service/financeAgent.service.js";
import { sendTestSms } from "../service/sms.service.js";

const CHECK_EVERY_MS = 60 * 60 * 1000;
// Briefs go out from 8 AM India time, once per IST calendar day.
const BRIEF_HOUR_IST = 8;
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

/** Start of today in IST, as a UTC instant. */
function startOfIstDay(now) {
    const ist = new Date(now.getTime() + IST_OFFSET_MS);
    return new Date(Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate()) - IST_OFFSET_MS);
}

/**
 * The proactive half of the money assistant: once a day per user it closes
 * dues that matching payment emails have settled, then sends a short brief of
 * what's due, overdue, unusually high, suspicious, or tax-related.
 *
 * SMS stays gated behind SMS_ENABLED because sendTestSms always texts one
 * fixed TWILIO_TEST_TO_NUMBER (same as ingest's deadline SMS). The brief is
 * always available in the app via GET /finance/brief regardless.
 */
export async function sendMoneyBriefs(now = new Date()) {
    const istHour = new Date(now.getTime() + IST_OFFSET_MS).getUTCHours();
    if (istHour < BRIEF_HOUR_IST) return;
    const today = startOfIstDay(now);

    const users = await User.find({
        tokens: { $exists: true, $ne: null },
        "financeProfile.briefEnabled": { $ne: false },
        $or: [{ "financeProfile.lastBriefAt": null }, { "financeProfile.lastBriefAt": { $lt: today } }]
    }).select("email financeProfile");

    let sent = 0;
    for (const user of users) {
        try {
            const brief = await buildMoneyBrief(user.email, {
                now,
                employerProofDeadline: user.financeProfile?.employerProofDeadline
            });
            if (hasNews(brief) && process.env.SMS_ENABLED === "true") {
                await sendTestSms(formatBriefText(brief));
                sent += 1;
            }
            await User.updateOne({ _id: user._id }, { $set: { "financeProfile.lastBriefAt": now } });
        } catch (err) {
            console.warn(`[moneyBrief] brief failed for user ${user._id}: ${err.message}`);
        }
    }
    if (users.length) console.log(`[moneyBrief] processed ${users.length} user(s), ${sent} SMS sent`);
}

export function scheduleMoneyBriefs() {
    const run = () => sendMoneyBriefs().catch((err) => {
        console.error("[moneyBrief] sweep failed:", err.message);
    });
    run();
    setInterval(run, CHECK_EVERY_MS).unref();
}
