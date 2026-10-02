import mongoose from "mongoose";
import { FinanceItem } from "../models/financeItem.model.js";
import { Email } from "../models/email.model.js";
import { User } from "../models/user.model.js";
import { createDeadlineEvent } from "../service/calendar.service.js";
import { flagIfReauthNeeded } from "../service/ingest.service.js";
import { buildMoneyBrief, reconcilePayments } from "../service/financeAgent.service.js";
import { financialYearOf } from "../config/indiaTaxCalendar.js";

const DAY_MS = 24 * 60 * 60 * 1000;
const SPEND_TYPES = ["CARD_STATEMENT", "BILL", "LOAN_EMI", "SUBSCRIPTION", "INSURANCE_RENEWAL"];
const USER_STATUSES = ["open", "paid", "dismissed"];
const FY_PATTERN = /^\d{4}-\d{2}$/;

/** Adds each item's email subject/sender so the UI can show where it came from. */
async function withEmailInfo(userEmail, items) {
    const emails = await Email.find({ userEmail, messageId: { $in: items.map((i) => i.messageId) } })
        .select("messageId subject from")
        .lean();
    const byId = new Map(emails.map((e) => [e.messageId, e]));
    return items.map((i) => ({
        ...i,
        id: String(i._id),
        subject: byId.get(i.messageId)?.subject || null,
        from: byId.get(i.messageId)?.from || null
    }));
}

async function loadProfile(userEmail) {
    const user = await User.findOne({ email: userEmail }).select("financeProfile").lean();
    return user?.financeProfile || {};
}

/** GET /finance/brief — today's money brief (dues, overdue, spikes, scams, tax dates). */
export const getBrief = async (req, res) => {
    try {
        const userEmail = req.user.email;
        const profile = await loadProfile(userEmail);
        const brief = await buildMoneyBrief(userEmail, { employerProofDeadline: profile.employerProofDeadline });
        const [overdue, dueSoon, scams, spikes] = await Promise.all(
            [brief.overdue, brief.dueSoon, brief.scams, brief.spikes].map((list) => withEmailInfo(userEmail, list))
        );
        res.json({ ...brief, overdue, dueSoon, scams, spikes });
    } catch (error) {
        console.error("[finance] brief error:", error);
        res.status(500).json({ error: "Unable to build money brief" });
    }
};

/** GET /finance/dues — open dues plus anything paid/dismissed in the last 30 days. */
export const getDues = async (req, res) => {
    try {
        const userEmail = req.user.email;
        await reconcilePayments(userEmail);
        const since = new Date(Date.now() - 30 * DAY_MS);
        const items = await FinanceItem.find({
            userEmail,
            $or: [
                { status: "open" },
                { status: { $in: ["paid", "dismissed"] }, dueDate: { $ne: null }, updatedAt: { $gte: since } }
            ]
        }).sort({ dueDate: 1 }).limit(200).lean();
        res.json({ items: await withEmailInfo(userEmail, items) });
    } catch (error) {
        console.error("[finance] dues error:", error);
        res.status(500).json({ error: "Unable to load dues" });
    }
};

/** GET /finance/summary?months=6 — monthly spend, top issuers this month, latest salary. */
export const getSummary = async (req, res) => {
    try {
        const userEmail = req.user.email;
        const months = Math.min(Math.max(Number.parseInt(req.query.months, 10) || 6, 1), 24);
        const now = new Date();
        const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (months - 1), 1));
        const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

        const [monthly, issuers, salary] = await Promise.all([
            FinanceItem.aggregate([
                { $match: { userEmail, type: { $in: SPEND_TYPES }, amount: { $gt: 0 }, receivedAt: { $gte: from } } },
                { $group: {
                    _id: { month: { $dateToString: { format: "%Y-%m", date: "$receivedAt", timezone: "Asia/Kolkata" } }, type: "$type" },
                    total: { $sum: "$amount" }
                } },
                { $sort: { "_id.month": 1 } }
            ]),
            FinanceItem.aggregate([
                { $match: { userEmail, type: { $in: SPEND_TYPES }, amount: { $gt: 0 }, receivedAt: { $gte: monthStart } } },
                { $group: { _id: "$issuer", total: { $sum: "$amount" }, count: { $sum: 1 } } },
                { $sort: { total: -1 } },
                { $limit: 8 }
            ]),
            FinanceItem.findOne({ userEmail, type: "PAYSLIP", amount: { $gt: 0 } }).sort({ receivedAt: -1 }).lean()
        ]);

        const byMonth = new Map();
        for (const row of monthly) {
            const entry = byMonth.get(row._id.month) || { month: row._id.month, total: 0, byType: {} };
            entry.byType[row._id.type] = row.total;
            entry.total += row.total;
            byMonth.set(row._id.month, entry);
        }

        res.json({
            months: [...byMonth.values()],
            topIssuersThisMonth: issuers.map((i) => ({ issuer: i._id || "Unknown", total: i.total, count: i.count })),
            latestSalary: salary ? { amount: salary.amount, period: salary.period, issuer: salary.issuer, receivedAt: salary.receivedAt } : null
        });
    } catch (error) {
        console.error("[finance] summary error:", error);
        res.status(500).json({ error: "Unable to load summary" });
    }
};

/**
 * GET /finance/vault?fy=2025-26 — tax documents for filing that FY's return,
 * with a checklist. Form 16 for FY X normally arrives in FY X+1 (by June).
 */
export const getVault = async (req, res) => {
    try {
        const userEmail = req.user.email;
        const fy = FY_PATTERN.test(req.query.fy || "") ? req.query.fy : financialYearOf(new Date());
        const startYear = Number(fy.slice(0, 4));
        const nextFy = `${startYear + 1}-${String(startYear + 2).slice(-2)}`;

        const items = await FinanceItem.find({
            userEmail,
            $or: [
                { financialYear: fy, type: { $in: ["PAYSLIP", "MF_STATEMENT", "EPF", "TAX_NOTICE", "INSURANCE_RENEWAL", "INVESTMENT_PROOF_REQUEST", "FORM16"] } },
                { financialYear: nextFy, type: { $in: ["FORM16", "TAX_NOTICE"] } }
            ]
        }).sort({ receivedAt: 1 }).lean();
        const docs = await withEmailInfo(userEmail, items);

        const payslipMonths = new Set(
            docs.filter((d) => d.type === "PAYSLIP" && d.receivedAt)
                .map((d) => new Date(d.receivedAt).toLocaleDateString("en-IN", { month: "short", year: "numeric", timeZone: "Asia/Kolkata" }))
        );
        const has = (type) => docs.some((d) => d.type === type);
        const checklist = [
            { key: "payslips", label: "Payslips (12 months)", done: payslipMonths.size >= 12, detail: `${payslipMonths.size} of 12 found` },
            { key: "form16", label: "Form 16 from employer", done: has("FORM16"), detail: has("FORM16") ? "Found" : `Usually arrives by 15 Jun ${startYear + 1}` },
            { key: "mf", label: "Mutual fund / capital gains statement", done: has("MF_STATEMENT"), detail: has("MF_STATEMENT") ? "Found" : "Request a CAS from CAMS/KFintech" },
            { key: "insurance", label: "Health/life insurance premium receipts (80C/80D)", done: has("INSURANCE_RENEWAL"), detail: has("INSURANCE_RENEWAL") ? "Found" : "Not found in email" },
            { key: "tax", label: "Income-tax / TDS notices (26AS, AIS)", done: has("TAX_NOTICE"), detail: has("TAX_NOTICE") ? "Found" : "Download from incometax.gov.in" }
        ];

        res.json({ fy, documents: docs, checklist });
    } catch (error) {
        console.error("[finance] vault error:", error);
        res.status(500).json({ error: "Unable to load tax vault" });
    }
};

/** PATCH /finance/:id — { status: "open" | "paid" | "dismissed" } */
export const updateItem = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: "Invalid id" });
        if (!USER_STATUSES.includes(status)) return res.status(400).json({ error: "Invalid status" });

        const item = await FinanceItem.findOneAndUpdate(
            { _id: id, userEmail: req.user.email },
            { $set: { status } },
            { new: true, runValidators: true }
        ).lean();
        if (!item) return res.status(404).json({ error: "Item not found" });
        res.json({ ...item, id: String(item._id) });
    } catch (error) {
        console.error("[finance] update error:", error);
        res.status(500).json({ error: "Unable to update item" });
    }
};

/** POST /finance/:id/calendar — put a due date on the user's Google Calendar. */
export const addItemToCalendar = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: "Invalid id" });

        const item = await FinanceItem.findOne({ _id: id, userEmail: req.user.email });
        if (!item) return res.status(404).json({ error: "Item not found" });
        if (!item.dueDate) return res.status(400).json({ error: "This item has no due date" });
        if (item.calendarEventId) return res.status(409).json({ error: "Already on your calendar", calendarEventId: item.calendarEventId });

        const user = await User.findOne({ email: req.user.email }).select("tokens");
        const tokens = user?.tokensPlain;
        if (!tokens?.access_token && !tokens?.refresh_token) {
            return res.status(401).json({ error: "Google Calendar is not connected for this user" });
        }

        const amount = item.amount != null ? ` ₹${Math.round(item.amount).toLocaleString("en-IN")}` : "";
        const event = await createDeadlineEvent(tokens, {
            title: `Pay ${item.issuer || "bill"}${amount}`,
            isoDate: item.dueDate.toISOString().slice(0, 10),
            description: item.actionRequired || "Added by MailSense money assistant"
        });
        item.calendarEventId = event.id;
        await item.save();
        res.json({ calendarEventId: event.id, htmlLink: event.htmlLink || "" });
    } catch (error) {
        if (await flagIfReauthNeeded(req.user.email, error)) {
            return res.status(401).json({ error: "Google access expired — please sign in again", code: "GOOGLE_REAUTH_REQUIRED" });
        }
        console.error("[finance] calendar error:", error);
        res.status(500).json({ error: "Unable to create calendar event" });
    }
};

/** GET/PUT /finance/profile — tax regime, employer proof deadline, daily brief toggle. */
export const getProfile = async (req, res) => {
    try {
        res.json(await loadProfile(req.user.email));
    } catch (error) {
        console.error("[finance] profile error:", error);
        res.status(500).json({ error: "Unable to load settings" });
    }
};

export const updateProfile = async (req, res) => {
    try {
        const { taxRegime, employerProofDeadline, briefEnabled } = req.body;
        const set = {};
        if (taxRegime !== undefined) {
            if (![null, "new", "old"].includes(taxRegime)) return res.status(400).json({ error: "Invalid taxRegime" });
            set["financeProfile.taxRegime"] = taxRegime;
        }
        if (employerProofDeadline !== undefined) {
            const d = employerProofDeadline ? new Date(employerProofDeadline) : null;
            if (d && Number.isNaN(d.getTime())) return res.status(400).json({ error: "Invalid employerProofDeadline" });
            set["financeProfile.employerProofDeadline"] = d;
        }
        if (briefEnabled !== undefined) set["financeProfile.briefEnabled"] = Boolean(briefEnabled);

        const user = await User.findOneAndUpdate({ email: req.user.email }, { $set: set }, { new: true, runValidators: true })
            .select("financeProfile").lean();
        res.json(user?.financeProfile || {});
    } catch (error) {
        console.error("[finance] profile update error:", error);
        res.status(500).json({ error: "Unable to save settings" });
    }
};
