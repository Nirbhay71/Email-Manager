import * as chrono from "chrono-node";

/**
 * Extracts the first date/deadline mentioned in `text` — absolute
 * ("15/03/2025", "March 15th 2025", "2025-03-15", "15 Jan") or relative
 * ("tomorrow", "day after tomorrow", "next Friday", "in 3 days") —
 * resolved against `referenceDate`.
 *
 * `referenceDate` should be the email's own received date when available,
 * so "tomorrow" means the day after the email was sent, not the day after
 * whenever the webhook happens to process it (it defaults to now for
 * callers that don't have that, e.g. direct/manual use).
 *
 * Uses the day-first (DD/MM/YYYY) English parser for ambiguous numeric
 * dates, matching this app's original DD/MM convention, and biases
 * ambiguous relative terms ("Friday") toward the next future occurrence,
 * since this is used to detect upcoming deadlines.
 *
 * Returns "YYYY-MM-DD" (date only, no time) for the earliest-mentioned
 * date in the text, or null if none is found.
 */
export function extractDate(text, referenceDate = new Date()) {
    if (!text) return null;

    const results = chrono.en.GB.parse(text, referenceDate, { forwardDate: true });
    if (results.length === 0) return null;

    // Preserve the original "head extraction" behavior: whichever date is
    // mentioned first in the text wins. chrono returns results ordered by
    // their position in the text.
    const date = results[0].start.date();

    // Build the string from local calendar components (not toISOString(),
    // which converts to UTC and can shift the date by a day near midnight).
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}
