/**
 * Cheap, local check for "might this email be about the user's money?".
 * Only emails that pass are queued for Gemini extraction, so the free-tier
 * quota isn't spent on newsletters and work mail. False positives are fine
 * (the extractor drops non-finance mail); false negatives are lost items.
 */

// Banks, cards, brokers/AMCs, insurers, tax/PF portals and utilities that
// Indian salaried users commonly hear from. Matched against the sender address.
const FINANCE_SENDER = new RegExp(
    "(" + [
        "hdfcbank", "icicibank", "sbi\\.co\\.in", "onlinesbi", "sbicard", "axisbank", "kotak", "yesbank",
        "idfcfirstbank", "indusind", "rblbank", "aubank", "federalbank", "bankofbaroda", "pnb",
        "americanexpress", "aexp", "citi", "hsbc", "sc\\.com", "onecard", "cred\\.club", "slice",
        "paytm", "phonepe", "amazonpay", "razorpay",
        "camsonline", "kfintech", "karvy", "zerodha", "groww", "upstox", "angelone", "nsdl", "cdsl", "mfcentral",
        "incometax\\.gov\\.in", "epfindia", "nps", "licindia", "policybazaar", "hdfclife", "iciciprulife",
        "starhealth", "tataaig", "careinsurance", "nivabupa", "acko", "godigit",
        "airtel", "jio", "bescom", "tatapower", "adanielectricity", "mahadiscom", "actcorp", "hathway"
    ].join("|") + ")",
    "i"
);

const FINANCE_SUBJECT = /\b(statement|e-?statement|pay ?slip|salary slip|salary (credit|credited)|form[\s-]?16|tds|26as|\bais\b|itr|income tax|tax refund|refund|due date|payment due|amount due|bill|invoice|emi|premium|renewal|investment (proof|declaration)|80c|80d|hra|rent receipt|mutual fund|\bsip\b|\bnav\b|capital gains?|epf|uan|provident fund|payment (received|successful|confirmation)|transaction alert|debited|credited|kyc|subscription)s?\b/i;

const RUPEE_AMOUNT = /(₹|\brs\.?\s?\d|\binr\s?\d)/i;
const BODY_KEYWORD = /\b(due|payable|statement|invoice|bill|premium|emi|salary|tax|refund|debited|credited|subscription|renew)/i;

// Login codes from banks would otherwise all pass the sender check.
const NOT_FINANCE = /\b(otp|one[\s-]time password|verification code|login alert|new device)\b/i;

const BODY_SCAN_CHARS = 2000;

export function isFinanceCandidate({ from = "", subject = "", body = "" }) {
    if (NOT_FINANCE.test(subject)) return false;
    if (FINANCE_SENDER.test(from) || FINANCE_SUBJECT.test(subject)) return true;
    const head = body.slice(0, BODY_SCAN_CHARS);
    return RUPEE_AMOUNT.test(head) && BODY_KEYWORD.test(head);
}
