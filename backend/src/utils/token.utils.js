import jwt from "jsonwebtoken";
import crypto from "crypto";

// ─── Config ──────────────────────────────────────────────────────────────────
const ACCESS_EXPIRY = "15m";   // Access token: 15 minutes
const REFRESH_EXPIRY = "7d";    // Refresh token: 7 days
const REFRESH_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days in ms

// ─── Cookie options ───────────────────────────────────────────────────────────
const BASE_COOKIE_OPTS = {
    httpOnly: true,                               // JS cannot read this cookie
    sameSite: "lax",                              // Protects against CSRF
    secure: process.env.NODE_ENV === "production" // HTTPS only in production
};

export const ACCESS_COOKIE_OPTS = {
    ...BASE_COOKIE_OPTS,
    maxAge: 15 * 60 * 1000 // 15 minutes in ms
};

export const REFRESH_COOKIE_OPTS = {
    ...BASE_COOKIE_OPTS,
    maxAge: REFRESH_EXPIRY_MS
};

// Short-lived cookies used only to carry the OAuth `state` and PKCE
// `code_verifier` between /auth/google and /auth/google/callback.
export const OAUTH_STATE_COOKIE_OPTS = {
    ...BASE_COOKIE_OPTS,
    maxAge: 10 * 60 * 1000 // 10 minutes
};

// ─── Token generators ─────────────────────────────────────────────────────────

/**
 * Signs a short-lived access JWT.
 * @param {{ email: string, sub: string }} payload
 */
export function signAccessToken(payload) {
    return jwt.sign(payload, process.env.JWT_ACCESS_SECRET, { expiresIn: ACCESS_EXPIRY });
}

/**
 * Generates a cryptographically random opaque refresh token string.
 * This is NOT a JWT — it is a random token stored in MongoDB.
 */
export function generateRefreshToken() {
    return crypto.randomBytes(64).toString("hex");
}

/**
 * Sets both accessToken and refreshToken as httpOnly cookies on the response.
 */
export function setAuthCookies(res, accessToken, refreshToken) {
    res.cookie("accessToken", accessToken, ACCESS_COOKIE_OPTS);
    res.cookie("refreshToken", refreshToken, REFRESH_COOKIE_OPTS);
}

/**
 * Clears both auth cookies (used on logout).
 */
export function clearAuthCookies(res) {
    res.clearCookie("accessToken", BASE_COOKIE_OPTS);
    res.clearCookie("refreshToken", BASE_COOKIE_OPTS);
}
