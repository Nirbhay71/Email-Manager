import mongoose from "mongoose"
import { encrypt, decrypt } from "../utils/crypto.utils.js"

const UserSchema = new mongoose.Schema({
    email: {
        type: String,
        unique: true,
        required: true
    },
    avtar: {
        type: String
    },
    // Google OAuth tokens (for Gmail / Calendar API calls), stored as an
    // AES-256-GCM encrypted JSON blob. Use user.tokensPlain to read/write
    // the plaintext { access_token, refresh_token, scope, token_type, expiry_date } object.
    tokens: {
        type: String
    },
    historyId: {
        type: String,
        default: null
    },
    isActive: {
        type: Boolean,
        default: null
    },
    // Opaque refresh tokens for our own JWT auth (rotating token strategy).
    // `token` stores a SHA-256 hash of the value handed to the client, never the raw value.
    // `usedAt` is set the moment a token is redeemed; a second redemption of an
    // already-used token is refresh-token reuse and revokes all of this user's sessions.
    refreshTokens: [{
        token: { type: String, required: true },
        expiresAt: { type: Date, required: true },
        usedAt: { type: Date, default: null }
    }]
}, { timestamps: true })

// NOT a TTL index (Mongo TTL indexes can't expire individual array elements,
// only whole documents) — this just speeds up the $elemMatch lookup in
// refreshTokensHandler. Expired entries are pruned opportunistically there,
// not automatically by Mongo.
UserSchema.index({ "refreshTokens.expiresAt": 1 });

UserSchema.virtual("tokensPlain")
    .get(function () {
        if (!this.tokens) return null;
        return JSON.parse(decrypt(this.tokens));
    })
    .set(function (value) {
        this.tokens = value ? encrypt(JSON.stringify(value)) : undefined;
    });

export const User = mongoose.model("user", UserSchema);