import jwt from "jsonwebtoken";

/**
 * requireAuth — verifies the accessToken httpOnly cookie.
 * On success: attaches req.user = { email, sub } and calls next().
 * On failure: responds 401.
 */
export function requireAuth(req, res, next) {
    const token = req.cookies?.accessToken;

    if (!token) {
        return res.status(401).json({ error: "Unauthorized — please log in" });
    }

    try {
        const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
        req.user = { email: payload.email, sub: payload.sub };
        next();
    } catch (err) {
        if (err.name === "TokenExpiredError") {
            return res.status(401).json({ error: "Access token expired", code: "ACCESS_EXPIRED" });
        }
        return res.status(401).json({ error: "Invalid token" });
    }
}
