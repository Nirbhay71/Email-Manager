import express from "express";
import { handleGmailWebhook } from "../controllers/webhook.controllers.js";
import { verifyPubSub } from "../middleware/verifyPubSub.middleware.js";

const router = express.Router();

router.post("/gmail", verifyPubSub, handleGmailWebhook);

export default router;