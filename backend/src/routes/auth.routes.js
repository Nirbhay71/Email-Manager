import express from "express";
import { googleLogin, googleCallback, getMe } from "../controllers/auth.controllers.js";

const router = express.Router();

router.get("/google", googleLogin);
router.get("/google/callback", googleCallback);
router.get("/me", getMe);

export default router;