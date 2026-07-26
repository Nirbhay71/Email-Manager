import mongoose from "mongoose";

const emailFeatureSchema = new mongoose.Schema({
    userEmail: {
        type: String,
        required: true
    },
    emailId: {
        type: String,
        required: true
    },
    labelId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'emaillabel',
        default: null
    },
    senderFeatures: {
        domain: { type: String, default: "unknown" },
        knownContact: { type: Boolean, default: false },
        historicalCount: { type: Number, default: 0 }
    },
    contentFeatures: {
        isDeadline: { type: Boolean, default: false },
        isInterview: { type: Boolean, default: false },
        isInvoice: { type: Boolean, default: false },
        isOtp: { type: Boolean, default: false },
        hasAttachment: { type: Boolean, default: false },
        subjectLength: { type: Number, default: 0 },
        bodyLength: { type: Number, default: 0 }
    },
    timeFeatures: {
        dayOfWeek: { type: Number, default: 0 }, // 0 (Sun) to 6 (Sat)
        isWorkingHours: { type: Boolean, default: true },
        daysUntilDeadline: { type: Number, default: null } // Nullable
    },
    embeddingFeatures: {
        cosineToImportantCentroid: { type: Number, default: null }, // Nullable for cold-start
        cosineToNotImportantCentroid: { type: Number, default: null } // Nullable for cold-start
    },
    behavioralFeatures: {
        openedSimilarBefore: { type: Boolean, default: null } // Phase 4 placeholder
    }
}, { timestamps: true });

// Compound unique index for fast lookups by (userEmail, emailId)
emailFeatureSchema.index({ userEmail: 1, emailId: 1 }, { unique: true });

export const EmailFeature = mongoose.model('emailfeature', emailFeatureSchema);
