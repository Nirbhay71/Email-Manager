import express from "express";
import { handleGmailWebhook } from "../controllers/webhook.controllers.js";

const router = express.Router();

router.post("/gmail", handleGmailWebhook);

export default router;