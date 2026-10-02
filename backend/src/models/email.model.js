import mongoose from "mongoose";

const emailSchema = new mongoose.Schema({
    userEmail: {
        type: String,
        required: true
    },
    messageId: {
        type: String,
        required: true,
        unique: true
    },
    from: {
        type: String,
        required: true
    },
    to: {
        type: String,
        required: true
    },
    subject: {
        type: String,
        required: true
    },
    body: {
        type: String,
        default: ""
    },
    // Gmail's own receipt time (internalDate). Falls back to createdAt for
    // emails stored before this field existed.
    receivedAt: {
        type: Date,
        default: null
    },
    // The sender's HTML (inline images embedded), cached the first time the
    // email is opened — Gmail takes 1-6s per fetch. Excluded from normal
    // queries so inbox listings stay small.
    bodyHtml: {
        type: String,
        default: null,
        select: false
    },
    detectedDate: {
        type: String,
        default: null
    },
    calendarEventId: {
        type: String,
        default: null
    },
    smsSent: {
        type: Boolean,
        default: false
    },
    category: {
        type: String,
        default: null
    },
    confidence: {
        type: Number,
        default: null
    },
    needsReview: {
        type: Boolean,
        default: false
    },
    classifyReasoning: {
        type: String,
        default: null
    }
}, { timestamps: true });

emailSchema.index({ subject: "text", body: "text" });
emailSchema.index({ userEmail: 1, receivedAt: -1 });

export const Email = mongoose.model('email', emailSchema);