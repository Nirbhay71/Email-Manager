import express from "express";
import { getInboxEmails } from "../controllers/email.controllers.js";

const router = express.Router();

router.get("/inbox", getInboxEmails);

export default router;
