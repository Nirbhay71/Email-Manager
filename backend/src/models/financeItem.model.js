import mongoose from "mongoose";

export const FINANCE_TYPES = [
    "CARD_STATEMENT", "BILL", "LOAN_EMI", "PAYSLIP", "FORM16", "TAX_NOTICE",
    "INVESTMENT_PROOF_REQUEST", "MF_STATEMENT", "EPF", "INSURANCE_RENEWAL",
    "SUBSCRIPTION", "PAYMENT_CONFIRMATION", "REFUND", "SCAM_SUSPECT", "OTHER"
];

// open: something the user must pay/do by dueDate. info: a record to keep
// (payslip, Form 16, statement with nothing due). paid/dismissed: closed.
export const FINANCE_STATUSES = ["open", "paid", "dismissed", "info"];

/**
 * One money-related fact extracted from one email by classifier-service's
 * FinanceWorker (which writes this collection directly — keep field names in
 * sync with services/finance_worker.py). Only masked identifiers are stored:
 * the last 4 digits of a card/account, never full numbers or PAN.
 */
const financeItemSchema = new mongoose.Schema({
    userEmail: { type: String, required: true },
    messageId: { type: String, required: true },
    type: { type: String, enum: FINANCE_TYPES, required: true },
    issuer: { type: String, default: null },
    amount: { type: Number, default: null },
    minDue: { type: Number, default: null },
    currency: { type: String, default: "INR" },
    dueDate: { type: Date, default: null },
    // Statement/salary period as written in the email, e.g. "Sep 2026".
    period: { type: String, default: null },
    // Indian financial year the item belongs to, e.g. "2026-27".
    financialYear: { type: String, default: null },
    accountLast4: { type: String, default: null },
    actionRequired: { type: String, default: null },
    scamReason: { type: String, default: null },
    status: { type: String, enum: FINANCE_STATUSES, default: "info" },
    // The PAYMENT_CONFIRMATION item that closed this due, if matched automatically.
    linkedPaymentId: { type: mongoose.Schema.Types.ObjectId, default: null },
    calendarEventId: { type: String, default: null },
    lastRemindedAt: { type: Date, default: null },
    receivedAt: { type: Date, default: null }
}, { timestamps: true });

financeItemSchema.index({ userEmail: 1, messageId: 1 }, { unique: true });
financeItemSchema.index({ userEmail: 1, status: 1, dueDate: 1 });
financeItemSchema.index({ userEmail: 1, financialYear: 1, type: 1 });

export const FinanceItem = mongoose.model("financeItem", financeItemSchema);
