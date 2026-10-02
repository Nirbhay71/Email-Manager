import express from "express";
import {
    getBrief, getDues, getSummary, getVault, updateItem, addItemToCalendar, getProfile, updateProfile
} from "../controllers/finance.controllers.js";

const router = express.Router();

router.get("/brief", getBrief);
router.get("/dues", getDues);
router.get("/summary", getSummary);
router.get("/vault", getVault);
router.get("/profile", getProfile);
router.put("/profile", updateProfile);
router.patch("/:id", updateItem);
router.post("/:id/calendar", addItemToCalendar);

export default router;
