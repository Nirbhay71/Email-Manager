import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
    userEmail: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    summary: {
        type: String,
        default: ""
    },
    pendingCount: {
        type: Number,
        default: 0
    },
    pendingEmailIds: {
        type: [String],
        default: []
    },
    summaryNeedsUpdate: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

// Composite unique index so a user cannot create the same category twice
categorySchema.index({ userEmail: 1, name: 1 }, { unique: true });

export const Category = mongoose.model('category', categorySchema);
