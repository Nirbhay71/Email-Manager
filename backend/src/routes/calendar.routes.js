import express from "express";
import { getCalendarEvents } from "../controllers/calendar.controllers.js";

const router = express.Router();

router.get("/events", getCalendarEvents);

export default router;
