import express from "express";
import {
    googleLogin,
    googleCallback,
    refreshTokensHandler,
    logout,
    logoutAll,
    getMe
} from "../controllers/auth.controllers.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = express.Router();

// Public — no auth needed
router.get("/google", googleLogin);
router.get("/google/callback", googleCallback);
router.post("/refresh", refreshTokensHandler);  // uses refreshToken cookie

// Protected
router.get("/me", requireAuth, getMe);
router.post("/logout", requireAuth, logout);
router.post("/logout-all", requireAuth, logoutAll);

export default router;