/**
 * Statutory default income-tax dates for salaried individuals in India.
 * CBDT sometimes extends these by notification — the UI labels them as
 * default due dates, and the user's own employer deadlines come from email.
 */

/** Indian FY runs April-March: 2026-10-02 -> "2026-27". Keep in sync with finance_worker.py. */
export function financialYearOf(date) {
    const d = new Date(date);
    const start = d.getUTCMonth() >= 3 ? d.getUTCFullYear() : d.getUTCFullYear() - 1;
    return `${start}-${String(start + 1).slice(-2)}`;
}

export function previousFinancialYear(fy) {
    const start = Number(fy.slice(0, 4)) - 1;
    return `${start}-${String(start + 1).slice(-2)}`;
}

const utc = (y, m, d) => new Date(Date.UTC(y, m - 1, d));

/** All default tax dates that relate to financial year `fy` ("2026-27"). */
export function taxDatesForFY(fy) {
    const y = Number(fy.slice(0, 4));
    return [
        { date: utc(y, 6, 15), title: "Advance tax — 1st instalment (15%)", fy },
        { date: utc(y, 9, 15), title: "Advance tax — 2nd instalment (45%)", fy },
        { date: utc(y, 12, 15), title: "Advance tax — 3rd instalment (75%)", fy },
        { date: utc(y + 1, 3, 15), title: "Advance tax — final instalment (100%)", fy },
        { date: utc(y + 1, 3, 31), title: `Last day for 80C/80D tax-saving investments for FY ${fy}`, fy },
        { date: utc(y + 1, 6, 15), title: `Employers issue Form 16 for FY ${fy}`, fy },
        { date: utc(y + 1, 7, 31), title: `ITR filing deadline for FY ${fy} (non-audit)`, fy },
        { date: utc(y + 1, 12, 31), title: `Belated / revised ITR deadline for FY ${fy}`, fy }
    ];
}

/** Tax dates falling within [now, now + withinDays]. */
export function upcomingTaxDates(now = new Date(), withinDays = 30) {
    const fy = financialYearOf(now);
    const end = now.getTime() + withinDays * 24 * 60 * 60 * 1000;
    const startOfToday = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    return [...taxDatesForFY(previousFinancialYear(fy)), ...taxDatesForFY(fy)]
        .filter((d) => d.date.getTime() >= startOfToday && d.date.getTime() <= end)
        .sort((a, b) => a.date - b.date);
}
