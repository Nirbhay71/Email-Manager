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