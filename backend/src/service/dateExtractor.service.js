import * as chrono from "chrono-node";

/**
 * Extracts the first upcoming deadline mentioned in `text` — absolute
 * ("15/03/2025", "March 15th 2025", "2025-03-15", "1 October") or relative
 * ("tomorrow", "next Friday", "in 3 days", "within 72 hours") — resolved
 * against `referenceDate` (the email's received date, so "tomorrow" means
 * the day after it was sent).
 *
 * chrono finds every date-like phrase, which in real email is mostly noise.
 * A match only counts as a deadline when it survives these checks (each
 * one comes from false positives seen in real inboxes):
 *   - it names a real day: "September 2026", "this week", "now" don't
 *   - it isn't a code or timestamp: "3D" / "7D7D7D" (CSS colours like
 *     #3D3D3D), "1w-8", ISO timestamps "2026-09-28T12:17:38Z"
 *   - it isn't a bare duration: "18 years", "12 months", "a minute"
 *     ("in 7 days", "within 72 hours", "after 2 days" are fine)
 *   - it isn't in the past relative to the email: "logged in on
 *     20 September at 22:28" must not become next year's 20 September
 *   - it falls within a year of the email (not 2044 or year 5926)
 *
 * Uses the day-first (DD/MM/YYYY) parser for ambiguous numeric dates.
 * Returns "YYYY-MM-DD" for the first mention that passes, or null.
 */
export function extractDate(text, referenceDate = new Date()) {
    return extractDeadline(text, referenceDate)?.date ?? null;
}

/** Same as extractDate, but also returns the phrase the date came from. */
export function extractDeadline(text, referenceDate = new Date()) {
    if (!text) return null;

    const ref = new Date(referenceDate);
    const refDay = startOfDay(ref);
    const maxDay = new Date(refDay);
    maxDay.setFullYear(maxDay.getFullYear() + 1);

    // forwardDate resolves "Friday" / "1 October" to the next occurrence;
    // the plain parse tells us whether a year-less date was actually in the past.
    const forward = chrono.en.GB.parse(text, ref, { forwardDate: true });
    const plainByIndex = new Map(chrono.en.GB.parse(text, ref).map((r) => [r.index, r]));

    for (const result of forward) {
        if (!looksLikeDeadline(result)) continue;

        const start = result.start;
        let date = start.date();

        // A day+month with no year: use it as written unless that day is
        // before the email — then it's a past event, not next year's date.
        // (forwardDate alone would also push "on 27 September at 09:38" in an
        // email received at 10:00 that same day into next year.)
        if (!start.isCertain("year") && start.isCertain("day")) {
            const plain = plainByIndex.get(result.index);
            if (plain) {
                if (startOfDay(plain.start.date()) < refDay) continue;
                date = plain.start.date();
            }
        }

        // A specific time that had already passed when the email arrived is a
        // record of something that happened (sign-in alerts, receipts), not a deadline.
        if (start.isCertain("hour") && date < ref) continue;

        const day = startOfDay(date);
        if (day < refDay || day > maxDay) continue;

        return { date: formatDay(date), text: result.text.trim() };
    }
    return null;
}

const VAGUE = /^(right\s+)?(now|today|tonight|this\s+(week|weekend|month|year|morning|afternoon|evening)|(last|past|previous)\s+\w+|recently|soon|(next|coming|following)\s+(few|couple(\s+of)?)\s+\w+)$/i;
// Bare durations with no "in"/"within"/"after"/"by" in front — including
// spelled-out amounts ("two weeks") and "for ..." spans ("for a few weeks").
const BARE_DURATION = /^(for\s+)?(an?|\d+(\.\d+)?|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|a\s+few|a\s+couple(\s+of)?|few|several)\s*(sec(ond)?s?|min(ute)?s?|h(ou)?rs?|days?|weeks?|months?|years?|yrs?)$/i;
// Lone 3-letter weekday abbreviations ("sun", "mon", "sat") are usually ordinary words.
const SHORT_WEEKDAY = /^(on\s+)?(mon|tue|wed|thu|fri|sat|sun)\.?,?$/i;
// Sub-day offsets ("in 5 minutes") aren't calendar deadlines.
const SUB_DAY = /\b(sec(ond)?s?|min(ute)?s?)\b/i;
// Machine timestamps: ISO "2026-09-28T12:17", or clock times with seconds "18:04:21".
const ISO_TIMESTAMP = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}|\b\d{1,2}:\d{2}:\d{2}\b/;
// The phrase must name something day-like: a month, a weekday, tomorrow/tonight,
// or an amount of hours/days/weeks/months. Rules out "the day", "30s, they", "next week".
const DAY_ANCHOR = /\b(jan(uary)?|feb(ruary)?|mar(ch)?|apr(il)?|may|june?|july?|aug(ust)?|sept?(ember)?|oct(ober)?|nov(ember)?|dec(ember)?|monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tues?|wed|thu(rs)?|fri|sat|sun|tomorrow|tonight)\b|\b(\d+|an?|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|few|couple(\s+of)?)\s*(hours?|hrs?|days?|weeks?|months?)\b/i;
const NUMERIC_DATE = /\b\d{1,4}[/.-]\d{1,2}[/.-]\d{2,4}\b/;

function looksLikeDeadline(result) {
    const text = result.text.trim();

    // Codes like "3D", "7D7D7D", "1w-8": no real word and not a full numeric date.
    if (!/[a-z]{3,}/i.test(text) && !NUMERIC_DATE.test(text)) return false;
    if (ISO_TIMESTAMP.test(text)) return false;
    if (VAGUE.test(text)) return false;
    if (BARE_DURATION.test(text)) return false;
    if (SHORT_WEEKDAY.test(text)) return false;
    if (SUB_DAY.test(text)) return false;
    if (!DAY_ANCHOR.test(text) && !NUMERIC_DATE.test(text)) return false;

    // Must pin down an actual day: an explicit day, or a weekday ("next Friday").
    const start = result.start;
    return start.isCertain("day") || start.isCertain("weekday");
}

function startOfDay(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
}

// Local calendar components, not toISOString() (UTC can shift the day near midnight).
function formatDay(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}
