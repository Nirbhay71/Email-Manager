import { FinanceItem } from "../models/financeItem.model.js";
import { upcomingTaxDates } from "../config/indiaTaxCalendar.js";

const DAY_MS = 24 * 60 * 60 * 1000;
const DUE_SOON_DAYS = 7;
const TAX_LOOKAHEAD_DAYS = 14;
// A bill this many times the issuer's recent average is called out.
const SPIKE_RATIO = 1.5;
const SPIKE_HISTORY = 6;

// Dues a payment confirmation can close.
const PAYABLE_TYPES = ["CARD_STATEMENT", "BILL", "LOAN_EMI", "INSURANCE_RENEWAL", "SUBSCRIPTION"];
// Words that appear in most issuer names and say nothing about which one it is.
const GENERIC_WORDS = new Set([
    "bank", "card", "cards", "credit", "debit", "ltd", "limited", "india", "pvt", "private", "the",
    "services", "service", "payment", "payments", "of", "and", "co", "company", "insurance", "life", "general"
]);

function issuerTokens(issuer = "") {
    return new Set(
        String(issuer || "").toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 1 && !GENERIC_WORDS.has(w))
    );
}

/** True when a PAYMENT_CONFIRMATION plausibly settles an open due. */
export function paymentSettles(due, payment) {
    if (due.amount == null || payment.amount == null) return false;
    if (payment.receivedAt && due.receivedAt && new Date(payment.receivedAt) < new Date(due.receivedAt) - DAY_MS) return false;

    const sameAccount = due.accountLast4 && payment.accountLast4 && due.accountLast4 === payment.accountLast4;
    const dueWords = issuerTokens(due.issuer);
    const sameIssuer = [...issuerTokens(payment.issuer)].some((w) => dueWords.has(w));
    if (!sameAccount && !sameIssuer) return false;

    // Paying the full amount (₹1 / 1% rounding slack) closes it; a part payment doesn't.
    return payment.amount >= due.amount - Math.max(1, due.amount * 0.01);
}

/**
 * Marks open dues as paid when a matching payment confirmation has arrived.
 * Each payment closes at most one due (the oldest it settles).
 * @returns {Promise<number>} how many dues were closed
 */
export async function reconcilePayments(userEmail) {
    const [dues, payments] = await Promise.all([
        FinanceItem.find({ userEmail, status: "open", type: { $in: PAYABLE_TYPES } }).sort({ dueDate: 1 }).lean(),
        FinanceItem.find({ userEmail, type: "PAYMENT_CONFIRMATION" }).lean()
    ]);
    if (!dues.length || !payments.length) return 0;

    const used = new Set(
        (await FinanceItem.distinct("linkedPaymentId", { userEmail, linkedPaymentId: { $ne: null } })).map(String)
    );
    let closed = 0;
    for (const due of dues) {
        const payment = payments.find((p) => !used.has(String(p._id)) && paymentSettles(due, p));
        if (!payment) continue;
        used.add(String(payment._id));
        const res = await FinanceItem.updateOne(
            { _id: due._id, status: "open" },
            { $set: { status: "paid", linkedPaymentId: payment._id } }
        );
        closed += res.modifiedCount;
    }
    return closed;
}

/** Bills well above what the same issuer usually charges. */
async function findSpikes(userEmail, since) {
    const recent = await FinanceItem.find({
        userEmail, type: { $in: ["BILL", "CARD_STATEMENT"] }, amount: { $gt: 0 }, receivedAt: { $gte: since }
    }).lean();

    const spikes = [];
    for (const item of recent) {
        const history = await FinanceItem.find({
            userEmail, type: item.type, issuer: item.issuer, amount: { $gt: 0 }, receivedAt: { $lt: item.receivedAt }
        }).sort({ receivedAt: -1 }).limit(SPIKE_HISTORY).select("amount").lean();
        if (history.length < 2) continue;
        const average = history.reduce((sum, h) => sum + h.amount, 0) / history.length;
        if (item.amount >= average * SPIKE_RATIO) {
            spikes.push({ ...item, average: Math.round(average) });
        }
    }
    return spikes;
}

/**
 * Everything the user should know about their money today. Read-only apart
 * from payment reconciliation, which runs first so paid dues don't show.
 */
export async function buildMoneyBrief(userEmail, { now = new Date(), employerProofDeadline = null } = {}) {
    const paidToday = await reconcilePayments(userEmail);

    const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const soonEnd = new Date(startOfToday.getTime() + (DUE_SOON_DAYS + 1) * DAY_MS);
    const weekAgo = new Date(now.getTime() - 7 * DAY_MS);

    const [overdue, dueSoon, scams, spikes] = await Promise.all([
        FinanceItem.find({ userEmail, status: "open", dueDate: { $lt: startOfToday } }).sort({ dueDate: 1 }).lean(),
        FinanceItem.find({ userEmail, status: "open", dueDate: { $gte: startOfToday, $lt: soonEnd } }).sort({ dueDate: 1 }).lean(),
        FinanceItem.find({ userEmail, type: "SCAM_SUSPECT", status: { $ne: "dismissed" }, receivedAt: { $gte: weekAgo } }).lean(),
        findSpikes(userEmail, weekAgo)
    ]);

    const taxDates = upcomingTaxDates(now, TAX_LOOKAHEAD_DAYS);
    if (employerProofDeadline) {
        const d = new Date(employerProofDeadline);
        if (d >= startOfToday && d.getTime() <= now.getTime() + TAX_LOOKAHEAD_DAYS * DAY_MS) {
            taxDates.push({ date: d, title: "Submit investment proofs to your employer" });
            taxDates.sort((a, b) => a.date - b.date);
        }
    }

    return { generatedAt: now, paidToday, overdue, dueSoon, scams, spikes, taxDates };
}

export function hasNews(brief) {
    return Boolean(brief.overdue.length || brief.dueSoon.length || brief.scams.length || brief.spikes.length || brief.taxDates.length);
}

const rupees = (n) => (n == null ? "" : `₹${Math.round(n).toLocaleString("en-IN")}`);
const day = (d) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" });

/** Short plain-text brief for SMS/WhatsApp (keep it a few lines). */
export function formatBriefText(brief, { maxLines = 6 } = {}) {
    const lines = [];
    for (const i of brief.overdue) lines.push(`OVERDUE: ${i.issuer || i.type} ${rupees(i.amount)} (was due ${day(i.dueDate)})`);
    for (const i of brief.dueSoon) lines.push(`Due ${day(i.dueDate)}: ${i.issuer || i.type} ${rupees(i.amount)}`);
    for (const i of brief.spikes) lines.push(`High bill: ${i.issuer} ${rupees(i.amount)} vs usual ${rupees(i.average)}`);
    for (const i of brief.scams) lines.push(`Possible scam email from ${i.issuer || "unknown sender"} — don't click links`);
    for (const t of brief.taxDates) lines.push(`${day(t.date)}: ${t.title}`);

    const shown = lines.slice(0, maxLines);
    if (lines.length > maxLines) shown.push(`+${lines.length - maxLines} more in MailSense`);
    return ["MailSense money brief", ...shown].join("\n");
}
