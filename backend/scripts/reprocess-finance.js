/**
 * Queues already-stored emails for finance extraction — for mail ingested
 * before the finance feature existed, or while Redis was down.
 *
 *   node scripts/reprocess-finance.js                 # dry run: count candidates
 *   node scripts/reprocess-finance.js --apply         # queue them for classifier-service
 *   node scripts/reprocess-finance.js --apply --all   # also re-queue emails that already have an item
 *
 * Re-extraction never reopens an item the user marked paid or dismissed.
 */
import dotenv from "dotenv";
dotenv.config({ path: "./src/.env" });
import mongoose from "mongoose";
import { Email } from "../src/models/email.model.js";
import { FinanceItem } from "../src/models/financeItem.model.js";
import { isFinanceCandidate } from "../src/service/financeFilter.service.js";
import { enqueueFinanceExtraction, closeClassifyQueue } from "../src/service/classifyQueue.js";

const apply = process.argv.includes("--apply");
const all = process.argv.includes("--all");

await mongoose.connect(process.env.MONGO_URI);

const done = all ? new Set() : new Set(await FinanceItem.distinct("messageId"));
const emails = await Email.find().select("userEmail messageId from subject body").lean();

const candidates = emails.filter((e) => !done.has(e.messageId) && isFinanceCandidate(e));
console.log(`${emails.length} emails checked, ${candidates.length} finance candidate(s) to queue`);

if (apply) {
    let queued = 0;
    for (const e of candidates) {
        await enqueueFinanceExtraction(e.userEmail, e.messageId);
        queued++;
    }
    console.log(`Queued ${queued}. classifier-service will extract them at the Gemini rate limit.`);
    await closeClassifyQueue();
} else {
    console.log("Dry run — re-run with --apply to queue them.");
}

await mongoose.disconnect();
