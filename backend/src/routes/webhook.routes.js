import express from "express";
import { handleGmailWebhook } from "../controllers/webhook.controllers.js";
import { verifyPubSub } from "../middleware/verifyPubSub.middleware.js";

const router = express.Router();

// verifyPubSub validates the Google OIDC token before the handler runs
router.post("/gmail", verifyPubSub, handleGmailWebhook);

export default router;