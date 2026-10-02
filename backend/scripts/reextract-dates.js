/**
 * Re-runs deadline detection over stored emails after the extractor changes.
 *
 *   node scripts/reextract-dates.js           # dry run: report what would change
 *   node scripts/reextract-dates.js --apply   # write the new detectedDate values
 *
 * Emails the user already added to Google Calendar (calendarEventId set) are
 * left untouched — that date was confirmed by a person.
 */
import dotenv from "dotenv";
dotenv.config({ path: "./src/.env" });
import mongoose from "mongoose";
import { Email } from "../src/models/email.model.js";
import { extractDate } from "../src/service/dateExtractor.service.js";

const apply = process.argv.includes("--apply");

await mongoose.connect(process.env.MONGO_URI);

const emails = await Email.find({ calendarEventId: null })
    .select("subject body receivedAt createdAt detectedDate")
    .lean();

let cleared = 0, changed = 0, added = 0, unchanged = 0;
const ops = [];
for (const e of emails) {
    const next = extractDate(`${e.subject} ${e.body}`, e.receivedAt || e.createdAt);
    const prev = e.detectedDate || null;
    if (next === prev) { unchanged++; continue; }
    if (prev && !next) cleared++;
    else if (!prev && next) added++;
    else changed++;
    ops.push({ updateOne: { filter: { _id: e._id }, update: { $set: { detectedDate: next } } } });
}

console.log(`${emails.length} emails checked (calendar-confirmed ones skipped)`);
console.log(`  cleared (false deadline removed): ${cleared}`);
console.log(`  changed to a different date:      ${changed}`);
console.log(`  newly detected:                   ${added}`);
console.log(`  unchanged:                        ${unchanged}`);

if (apply && ops.length) {
    const res = await Email.bulkWrite(ops);
    console.log(`Applied: ${res.modifiedCount} updated.`);
} else if (!apply) {
    console.log("Dry run — re-run with --apply to save.");
}

await mongoose.disconnect();
