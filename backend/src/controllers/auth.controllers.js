import crypto from "crypto";
import { google } from "googleapis";
import { getOAuthClient } from "../config/google.config.js";
import { User } from "../models/user.model.js";
import { startWatch } from "../service/gmail.service.js";
import {
    signAccessToken,
    generateRefreshToken,
    setAuthCookies,
    clearAuthCookies,
    OAUTH_STATE_COOKIE_OPTS
} from "../utils/token.utils.js";
import { sha256 } from "../utils/crypto.utils.js";

const SCOPES = [
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/calendar.events",
    "https://www.googleapis.com/auth/userinfo.email"
];

function base64url(buffer) {
    return buffer.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// ─── Initiate Google OAuth ────────────────────────────────────────────────────
export const googleLogin = (req, res) => {
    const oAuth2Client = getOAuthClient();

    // CSRF protection: random state, verified against a cookie on callback.
    const state = base64url(crypto.randomBytes(32));
    // PKCE: prevents a stolen authorization code from being redeemed elsewhere.
    const codeVerifier = base64url(crypto.randomBytes(32));
    const codeChallenge = base64url(crypto.createHash("sha256").update(codeVerifier).digest());

    res.cookie("oauth_state", state, OAUTH_STATE_COOKIE_OPTS);
    res.cookie("oauth_code_verifier", codeVerifier, OAUTH_STATE_COOKIE_OPTS);

    const url = oAuth2Client.generateAuthUrl({
        access_type: "offline",
        prompt: "consent",
        scope: SCOPES,
        state,
        code_challenge: codeChallenge,
        code_challenge_method: "S256"
    });
    res.redirect(url);
};

// ─── Google OAuth Callback — issue tokens ────────────────────────────────────
export const googleCallback = async (req, res) => {
    const expectedState = req.cookies?.oauth_state;
    const codeVerifier = req.cookies?.oauth_code_verifier;
    res.clearCookie("oauth_state", OAUTH_STATE_COOKIE_OPTS);
    res.clearCookie("oauth_code_verifier", OAUTH_STATE_COOKIE_OPTS);

    try {
        const { code, state } = req.query;

        if (!code || typeof code !== "string") {
            return res.status(400).send("Missing authorization code");
        }
        if (!state || !expectedState || state !== expectedState) {
            return res.status(400).send("Invalid or missing OAuth state — please try logging in again");
        }
        if (!codeVerifier) {
            return res.status(400).send("Missing PKCE verifier — please try logging in again");
        }

        const oAuth2Client = getOAuthClient();
        const { tokens } = await oAuth2Client.getToken({ code, codeVerifier });
        oAuth2Client.setCredentials(tokens);

        // Get user profile from Google
        const oauth2 = google.oauth2({ auth: oAuth2Client, version: "v2" });
        const { data } = await oauth2.userinfo.get();
        const email = data.email;

        // Upsert user in MongoDB
        let user = await User.findOne({ email });
        if (user) {
            user.tokensPlain = tokens;
        } else {
            user = new User({ email, avtar: data.picture || "" });
            user.tokensPlain = tokens;
        }

        // Start Gmail Pub/Sub watch
        const watchResult = await startWatch(tokens);
        user.historyId = watchResult.historyId;

        // ── Issue our own auth tokens ──────────────────────────────────────
        const accessToken = signAccessToken({ email, sub: user._id.toString() });
        const refreshToken = generateRefreshToken();

        // Store refresh token with 7-day expiry (remove expired ones first).
        // Only the SHA-256 hash is persisted — the raw value only ever lives
        // in the httpOnly cookie handed to the client.
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        user.refreshTokens = (user.refreshTokens || [])
            .filter(rt => rt.expiresAt > new Date())   // prune expired ones
            .concat({ token: sha256(refreshToken), expiresAt }); // add new one

        await user.save();

        console.log(`[auth] user logged in. historyId=${watchResult.historyId}`);

        // Set httpOnly cookies
        setAuthCookies(res, accessToken, refreshToken);

        // Redirect to frontend dashboard — no sensitive data in the query string.
        // The frontend fetches identity from GET /auth/me using the cookie.
        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
        res.redirect(`${frontendUrl}/inbox`);

    } catch (error) {
        console.error("[auth] callback error:", error);
        res.status(500).send("OAuth callback failed, check server logs");
    }
};

// ─── Refresh — rotate access + refresh tokens ─────────────────────────────────
export const refreshTokensHandler = async (req, res) => {
    const incomingRefreshToken = req.cookies?.refreshToken;

    if (!incomingRefreshToken) {
        return res.status(401).json({ error: "No refresh token" });
    }

    const incomingHash = sha256(incomingRefreshToken);

    try {
        // Find the user that owns this (unexpired) refresh token hash, used or not
        const user = await User.findOne({
            "refreshTokens.token": incomingHash,
            "refreshTokens.expiresAt": { $gt: new Date() }
        });

        if (!user) {
            clearAuthCookies(res);
            return res.status(401).json({ error: "Invalid or expired refresh token" });
        }

        const entry = user.refreshTokens.find(rt => rt.token === incomingHash);

        if (entry.usedAt) {
            // Reuse of an already-rotated token — the refresh token was likely
            // stolen. Revoke every session for this account and force re-login.
            console.warn(`[auth] refresh token reuse detected for user ${user._id} — revoking all sessions`);
            user.refreshTokens = [];
            await user.save();
            clearAuthCookies(res);
            return res.status(401).json({ error: "Refresh token reuse detected — all sessions revoked, please log in again" });
        }

        // Rotation: mark the used token spent (kept until its natural expiry
        // for reuse detection), issue a fresh pair
        entry.usedAt = new Date();

        const newAccessToken = signAccessToken({ email: user.email, sub: user._id.toString() });
        const newRefreshToken = generateRefreshToken();
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        user.refreshTokens.push({ token: sha256(newRefreshToken), expiresAt });
        await user.save();

        setAuthCookies(res, newAccessToken, newRefreshToken);
        res.json({ ok: true });

    } catch (error) {
        console.error("[auth] refresh error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// ─── Logout — invalidate this device's session ────────────────────────────────
export const logout = async (req, res) => {
    const incomingRefreshToken = req.cookies?.refreshToken;

    if (incomingRefreshToken) {
        try {
            // Remove only this refresh token (single-device logout)
            await User.findOneAndUpdate(
                { email: req.user.email },
                { $pull: { refreshTokens: { token: sha256(incomingRefreshToken) } } }
            );
        } catch (err) {
            console.warn("[auth] logout DB cleanup error:", err.message);
        }
    }

    clearAuthCookies(res);
    res.json({ ok: true, message: "Logged out successfully" });
};

// ─── Logout everywhere — revoke all sessions for this account ─────────────────
export const logoutAll = async (req, res) => {
    try {
        await User.findOneAndUpdate(
            { email: req.user.email },
            { $set: { refreshTokens: [] } }
        );
    } catch (err) {
        console.warn("[auth] logoutAll DB cleanup error:", err.message);
    }

    clearAuthCookies(res);
    res.json({ ok: true, message: "Logged out of all sessions" });
};

// ─── Get current user ─────────────────────────────────────────────────────────
// req.user is already populated by requireAuth middleware (no extra DB hit needed for email)
export const getMe = async (req, res) => {
    try {
        const user = await User.findOne({ email: req.user.email }).select("email avtar");
        if (!user) return res.status(404).json({ error: "User not found" });
        res.json({ email: user.email, avatar: user.avtar });
    } catch (error) {
        console.error("[auth] me error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};