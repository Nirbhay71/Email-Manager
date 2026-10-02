import { test } from "node:test";
import assert from "node:assert/strict";
import { paymentSettles, formatBriefText, hasNews } from "../src/service/financeAgent.service.js";
import { financialYearOf, upcomingTaxDates } from "../src/config/indiaTaxCalendar.js";

const statement = {
    type: "CARD_STATEMENT", issuer: "HDFC Bank Credit Card", amount: 23400, accountLast4: "3456",
    receivedAt: new Date("2026-09-20"), dueDate: new Date("2026-10-12")
};

test("a full payment from the same card closes the statement", () => {
    assert.ok(paymentSettles(statement, { issuer: "HDFC Bank", amount: 23400, receivedAt: new Date("2026-10-05") }));
    assert.ok(paymentSettles(statement, { issuer: "CRED", accountLast4: "3456", amount: 23399.5, receivedAt: new Date("2026-10-05") }));
});

test("partial, unrelated or earlier payments don't close it", () => {
    assert.equal(paymentSettles(statement, { issuer: "HDFC Bank", amount: 1170, receivedAt: new Date("2026-10-05") }), false);
    assert.equal(paymentSettles(statement, { issuer: "ICICI Bank Credit Card", amount: 23400, receivedAt: new Date("2026-10-05") }), false);
    assert.equal(paymentSettles(statement, { issuer: "HDFC Bank", amount: 23400, receivedAt: new Date("2026-08-01") }), false);
});

test("Indian financial year boundaries", () => {
    assert.equal(financialYearOf(new Date("2026-10-02")), "2026-27");
    assert.equal(financialYearOf(new Date("2027-03-31T12:00:00Z")), "2026-27");
    assert.equal(financialYearOf(new Date("2027-04-01T12:00:00Z")), "2027-28");
});

test("upcoming tax dates include last FY's ITR deadline in July", () => {
    const titles = upcomingTaxDates(new Date("2026-07-20T00:00:00Z"), 14).map((d) => d.title);
    assert.ok(titles.some((t) => t.includes("ITR filing deadline for FY 2025-26")));
    const sept = upcomingTaxDates(new Date("2026-09-10T00:00:00Z"), 14).map((d) => d.title);
    assert.ok(sept.some((t) => t.includes("2nd instalment")));
});

test("brief text is short and readable", () => {
    const brief = {
        overdue: [], scams: [], spikes: [],
        dueSoon: [{ ...statement }],
        taxDates: [{ date: new Date("2026-10-15"), title: "Submit investment proofs to your employer" }]
    };
    assert.ok(hasNews(brief));
    const text = formatBriefText(brief);
    assert.match(text, /Due 12 Oct: HDFC Bank Credit Card ₹23,400/);
    assert.match(text, /investment proofs/);
    assert.equal(hasNews({ overdue: [], dueSoon: [], scams: [], spikes: [], taxDates: [] }), false);
});
