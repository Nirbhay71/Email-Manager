/**
 * Imports older inbox mail than the first-login backfill does (that one stops
 * at BACKFILL_MAX_MESSAGES / BACKFILL_NEWER_THAN_DAYS — about two weeks for
 * a busy inbox). Already-stored emails are skipped, so it's safe to re-run.
 *
 *   node scripts/import-history.js --user you@gmail.com [--days 180] [--max 1500]
 *
 * Each new email is stored, indexed for search (search_feature_demo must be
 * running) and queued for classification — the same path as live mail, minus
 * deadline SMS. Expect ~1-2s per email on CPU; the app shows its
 * "Importing your recent emails…" banner while this runs.
 */
import dotenv from "dotenv";
dotenv.config({ path: "./src/.env" });

function arg(name, fallback) {
    const i = process.argv.indexOf(`--${name}`);
    return i > -1 ? process.argv[i + 1] : fallback;
}

const user = arg("user");
if (!user) {
    console.error("Usage: node scripts/import-history.js --user you@gmail.com [--days 180] [--max 1500]");
    process.exit(1);
}
// backfillUser reads these when ingest.service.js is loaded — set them first.
process.env.BACKFILL_NEWER_THAN_DAYS = arg("days", "180");
process.env.BACKFILL_MAX_MESSAGES = arg("max", "1500");

const { default: mongoose } = await import("mongoose");
const { Email } = await import("../src/models/email.model.js");
const { backfillUser } = await import("../src/service/ingest.service.js");
const { closeClassifyQueue } = await import("../src/service/classifyQueue.js");

await mongoose.connect(process.env.MONGO_URI);
const before = await Email.countDocuments({ userEmail: user });
console.log(`Importing up to ${process.env.BACKFILL_MAX_MESSAGES} inbox emails from the last ${process.env.BACKFILL_NEWER_THAN_DAYS} days (${before} already stored)…`);

const t = Date.now();
await backfillUser(user);

const after = await Email.countDocuments({ userEmail: user });
console.log(`Done in ${Math.round((Date.now() - t) / 60000)} min: ${after - before} new emails (${after} total).`);
await closeClassifyQueue();
await mongoose.disconnect();
process.exit(0);
