import mongoose from "mongoose";

const onboardingSampleSchema = new mongoose.Schema({
    userEmail: {
        type: String,
        required: true,
        unique: true
    },
    emailIds: [{
        emailId: { type: String, required: true },
        clusterId: { type: String, required: true }
    }],
    /**
     * If the sample ended up smaller than the target due to the user having
     * fewer emails, this field records the reason for downstream awareness.
     */
    sampleNote: {
        type: String,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export const OnboardingSample = mongoose.model("onboardingSample", onboardingSampleSchema);
