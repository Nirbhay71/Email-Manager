import express from "express";
import { getInboxEmails, getEmailById, createEmailCalendarEvent, removeEmailCalendarEvent, setEmailCategory } from "../controllers/email.controllers.js";

const router = express.Router();

router.get("/inbox", getInboxEmails);
router.get("/:id", getEmailById);
router.post("/:id/calendar-event", createEmailCalendarEvent);
router.delete("/:id/calendar-event", removeEmailCalendarEvent);
router.post("/:id/category", setEmailCategory);

export default router;
