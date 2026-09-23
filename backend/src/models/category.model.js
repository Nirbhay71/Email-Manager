import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
    userEmail: {
        type: String,
        required: true,
        trim: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    // Written directly by classifier-service (raw pymongo, bypasses Mongoose) —
    // field names must stay in sync with services/pipeline/db_service.py there.
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

categorySchema.index({ userEmail: 1, name: 1 }, { unique: true });

export const Category = mongoose.model("category", categorySchema);
