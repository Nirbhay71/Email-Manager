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
        required: true
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
    }
}, { timestamps: true })

export const Email = mongoose.model('email', emailSchema)