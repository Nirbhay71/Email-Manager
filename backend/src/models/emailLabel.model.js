import mongoose from "mongoose";

const emailLabelSchema = new mongoose.Schema({
    userEmail: {
        type: String,
        required: true
    },
    emailId: {
        type: String,
        required: true
    },
    label: {
        type: String,
        enum: ["important", "not_important", "skipped"],
        required: true
    },
    source: {
        type: String,
        enum: ["onboarding", "behavioral"],
        default: "onboarding"
    },
    clusterId: {
        type: String,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Compound unique index: one label per (user, email) pair
emailLabelSchema.index({ userEmail: 1, emailId: 1 }, { unique: true });

// Fast retrieval by user
emailLabelSchema.index({ userEmail: 1 });

export const EmailLabel = mongoose.model("emailLabel", emailLabelSchema);
