import mongoose from "mongoose";

const chatSessionSchema = new mongoose.Schema({
    userEmail: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['ACTIVE', 'ARCHIVED', 'SHARED'],
        default: 'ACTIVE'
    },
    messages: [{
        role: { type: String, enum: ['user', 'ai'], required: true },
        content: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
    }]
}, { timestamps: true });

export const ChatSession = mongoose.model('chatSession', chatSessionSchema);
