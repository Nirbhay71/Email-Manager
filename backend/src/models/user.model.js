import mongoose from "mongoose"

const UserSchema = new mongoose.Schema({
    email: {
        type: String,
        unique: true,
        required: true
    },
    avtar: {
        type: String
    },
    // Google OAuth tokens (for Gmail / Calendar API calls)
    tokens: {
        access_token: { type: String },
        refresh_token: { type: String },
        scope: { type: String },
        token_type: { type: String },
        expiry_date: { type: Number }
    },
    historyId: {
        type: String,
        default: null
    },
    isActive: {
        type: Boolean,
        default: null
    },
    // Opaque refresh tokens for our own JWT auth (rotating token strategy)
    refreshTokens: [{
        token: { type: String, required: true },  // raw token (stored hashed)
        expiresAt: { type: Date, required: true }
    }]
}, { timestamps: true })

// TTL-like cleanup: index on expiresAt so expired tokens are easy to purge
UserSchema.index({ "refreshTokens.expiresAt": 1 });

export const User = mongoose.model("user", UserSchema);