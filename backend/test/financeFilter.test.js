import { test } from "node:test";
import assert from "node:assert/strict";
import { isFinanceCandidate } from "../src/service/financeFilter.service.js";

test("flags common Indian finance senders and subjects", () => {
    assert.ok(isFinanceCandidate({ from: "HDFC Bank <alerts@hdfcbank.net>", subject: "Your account update" }));
    assert.ok(isFinanceCandidate({ from: "statements@sbicard.com", subject: "Statement for Sep 2026" }));
    assert.ok(isFinanceCandidate({ from: "donotreply@camsonline.com", subject: "Consolidated Account Statement" }));
    assert.ok(isFinanceCandidate({ from: "hr@acme-tech.com", subject: "Submit investment proofs by 15 Jan" }));
    assert.ok(isFinanceCandidate({ from: "payroll@acme-tech.com", subject: "Payslip for September 2026" }));
    assert.ok(isFinanceCandidate({ from: "noreply@acme.com", subject: "Form 16 for FY 2025-26" }));
});

test("flags rupee amounts with money words in the body", () => {
    assert.ok(isFinanceCandidate({ from: "billing@broadband.in", subject: "Hello", body: "Amount payable ₹799 by 10 Oct" }));
    assert.ok(isFinanceCandidate({ from: "x@y.com", subject: "Update", body: "Rs. 1,200 has been debited" }));
});

test("ignores OTPs and ordinary mail", () => {
    assert.equal(isFinanceCandidate({ from: "alerts@hdfcbank.net", subject: "OTP for your transaction" }), false);
    assert.equal(isFinanceCandidate({ from: "jira@acme.atlassian.net", subject: "[JIRA] PROJ-12 assigned to you", body: "Please review" }), false);
    assert.equal(isFinanceCandidate({ from: "friend@gmail.com", subject: "Weekend plan", body: "Let's meet at 6" }), false);
});
