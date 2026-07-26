import express from "express";
import {
    getSessions,
    createSession,
    updateSessionStatus
} from "../controllers/chat.controllers.js";

const router = express.Router();

router.get("/sessions", getSessions);
router.post("/sessions", createSession);
router.patch("/sessions/:id", updateSessionStatus);

export default router;
