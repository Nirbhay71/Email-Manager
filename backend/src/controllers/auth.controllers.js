import { google } from "googleapis";
import { getOAuthClient } from "../config/google.config.js";
import { User } from "../models/user.model.js";
import { startWatch } from "../service/gmail.service.js";
import {
    signAccessToken,
    generateRefreshToken,
    setAuthCookies,
    clearAuthCookies
} from "../utils/token.utils.js";

const SCOPES = [
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/calendar.events",
    "https://www.googleapis.com/auth/userinfo.email"
];

// ─── Initiate Google OAuth ────────────────────────────────────────────────────
export const googleLogin = (req, res) => {
    const oAuth2Client = getOAuthClient();
    const url = oAuth2Client.generateAuthUrl({
        access_type: "offline",
        prompt: "consent",
        scope: SCOPES
    });
    res.redirect(url);
};

// ─── Google OAuth Callback — issue tokens ────────────────────────────────────
export const googleCallback = async (req, res) => {
    try {
        const { code } = req.query;
        const oAuth2Client = getOAuthClient();
        const { tokens } = await oAuth2Client.getToken(code);
        oAuth2Client.setCredentials(tokens);

        // Get user profile from Google
        const oauth2 = google.oauth2({ auth: oAuth2Client, version: "v2" });
        const { data } = await oauth2.userinfo.get();
        const email = data.email;

        // Upsert user in MongoDB
        let user = await User.findOne({ email });
        if (user) {
            user.tokens = tokens;
        } else {
            user = new User({ email, avtar: data.picture || "", tokens });
        }

        // Start Gmail Pub/Sub watch
        const watchResult = await startWatch(tokens);
        user.historyId = watchResult.historyId;

        // ── Issue our own auth tokens ──────────────────────────────────────
        const accessToken = signAccessToken({ email, sub: user._id.toString() });
        const refreshToken = generateRefreshToken();

        // Store refresh token with 7-day expiry (remove expired ones first)
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        user.refreshTokens = (user.refreshTokens || [])
            .filter(rt => rt.expiresAt > new Date())   // prune expired ones
            .concat({ token: refreshToken, expiresAt }); // add new one

        await user.save();

        console.log(`[auth] ${email} logged in. historyId=${watchResult.historyId}`);

        // Set httpOnly cookies
        setAuthCookies(res, accessToken, refreshToken);

        // Redirect to frontend dashboard (no sensitive data in the query string)
        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
        res.redirect(
            `${frontendUrl}/dashboard?email=${encodeURIComponent(email)}&name=${encodeURIComponent(data.name || email)}&avatar=${encodeURIComponent(data.picture || "")}`
        );

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

    try {
        // Find the user that owns this refresh token and it hasn't expired
        const user = await User.findOne({
            "refreshTokens.token": incomingRefreshToken,
            "refreshTokens.expiresAt": { $gt: new Date() }
        });

        if (!user) {
            // Possible token reuse attack — clear cookies and reject
            clearAuthCookies(res);
            return res.status(401).json({ error: "Invalid or expired refresh token" });
        }

        // Rotation: remove the used token, issue a fresh pair
        user.refreshTokens = user.refreshTokens.filter(
            rt => rt.token !== incomingRefreshToken
        );

        const newAccessToken = signAccessToken({ email: user.email, sub: user._id.toString() });
        const newRefreshToken = generateRefreshToken();
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        user.refreshTokens.push({ token: newRefreshToken, expiresAt });
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
                { $pull: { refreshTokens: { token: incomingRefreshToken } } }
            );
        } catch (err) {
            console.warn("[auth] logout DB cleanup error:", err.message);
        }
    }

    clearAuthCookies(res);
    res.json({ ok: true, message: "Logged out successfully" });
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