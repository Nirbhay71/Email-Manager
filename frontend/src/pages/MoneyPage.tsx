import { useCallback, useEffect, useState, type ReactNode } from "react";
import NavRail from "../components/NavRail.tsx";
import { apiFetch } from "../utils/api.ts";

interface FinanceItem {
  id: string;
  type: string;
  issuer: string | null;
  amount: number | null;
  minDue: number | null;
  dueDate: string | null;
  period: string | null;
  accountLast4: string | null;
  actionRequired: string | null;
  scamReason: string | null;
  status: "open" | "paid" | "dismissed" | "info";
  calendarEventId: string | null;
  receivedAt: string | null;
  subject: string | null;
  from: string | null;
  average?: number;
}

interface TaxDate { date: string; title: string }

interface Brief {
  paidToday: number;
  overdue: FinanceItem[];
  dueSoon: FinanceItem[];
  scams: FinanceItem[];
  spikes: FinanceItem[];
  taxDates: TaxDate[];
}

interface Summary {
  months: { month: string; total: number }[];
  topIssuersThisMonth: { issuer: string; total: number; count: number }[];
  latestSalary: { amount: number; period: string | null; issuer: string | null } | null;
}

interface Vault {
  fy: string;
  documents: FinanceItem[];
  checklist: { key: string; label: string; done: boolean; detail: string }[];
}

interface Profile { taxRegime?: "new" | "old" | null; employerProofDeadline?: string | null; briefEnabled?: boolean }

const TYPE_LABEL: Record<string, string> = {
  CARD_STATEMENT: "Card statement", BILL: "Bill", LOAN_EMI: "Loan EMI", PAYSLIP: "Payslip", FORM16: "Form 16",
  TAX_NOTICE: "Tax notice", INVESTMENT_PROOF_REQUEST: "Investment proofs", MF_STATEMENT: "Mutual fund statement",
  EPF: "EPF", INSURANCE_RENEWAL: "Insurance", SUBSCRIPTION: "Subscription", PAYMENT_CONFIRMATION: "Payment",
  REFUND: "Refund", SCAM_SUSPECT: "Possible scam",
};

const card = "bg-white rounded-[32px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] p-[24px]";
const heading = "font-['Inter:Bold',sans-serif] font-bold text-[18px] text-black leading-[26px]";
const label = "font-['Inter:Semi_Bold',sans-serif] font-semibold text-[#9ca3af] text-[11px] uppercase tracking-[0.6px]";
const pill = "rounded-full px-[12px] py-[6px] text-[12px] font-semibold transition disabled:opacity-50";

const rupees = (n: number | null | undefined) =>
  n == null ? "—" : `₹${Math.round(n).toLocaleString("en-IN")}`;
const day = (d: string | null) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";

function currentFY(): string {
  const now = new Date();
  const start = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  return `${start}-${String(start + 1).slice(-2)}`;
}

function shiftFY(fy: string, by: number): string {
  const start = Number(fy.slice(0, 4)) + by;
  return `${start}-${String(start + 1).slice(-2)}`;
}

async function getJson<T>(path: string): Promise<T> {
  const res = await apiFetch(path);
  if (!res.ok) throw new Error(String(res.status));
  return res.json();
}

function ItemLine({ item, right }: { item: FinanceItem; right?: ReactNode }) {
  return (
    <li className="flex items-center justify-between gap-[12px] bg-[#f9fafb] border border-[#f3f4f6] rounded-[20px] px-[16px] py-[12px]">
      <div className="min-w-0">
        <p className="text-[14px] font-semibold text-[#111827] truncate">
          {item.issuer || TYPE_LABEL[item.type] || item.type}
          {item.accountLast4 ? <span className="text-[#9ca3af] font-normal"> ••{item.accountLast4}</span> : null}
        </p>
        <p className="text-[12px] text-[#6b7280] truncate">
          {TYPE_LABEL[item.type] || item.type}
          {item.dueDate ? ` · due ${day(item.dueDate)}` : ""}
          {item.subject ? ` · ${item.subject}` : ""}
        </p>
      </div>
      <div className="flex items-center gap-[8px] shrink-0">
        <span className="text-[14px] font-bold text-black">{rupees(item.amount)}</span>
        {right}
      </div>
    </li>
  );
}

function BriefCard({ brief }: { brief: Brief | null }) {
  if (!brief) return <div className={card}><p className="text-[13px] text-[#9ca3af]">Loading brief…</p></div>;
  const empty = !brief.overdue.length && !brief.dueSoon.length && !brief.scams.length && !brief.spikes.length && !brief.taxDates.length;

  return (
    <div className={`${card} flex flex-col gap-[16px]`}>
      <div className="flex items-center justify-between">
        <h2 className={heading}>Today's money brief</h2>
        {brief.paidToday > 0 && <span className="text-[12px] text-[#16a34a] font-semibold">{brief.paidToday} matched payment(s) closed</span>}
      </div>
      {empty && <p className="text-[13px] text-[#6b7280]">Nothing due this week. You're all caught up.</p>}

      {brief.overdue.length > 0 && (
        <section className="flex flex-col gap-[8px]">
          <p className={`${label} !text-[#dc2626]`}>Overdue</p>
          <ul className="flex flex-col gap-[8px]">{brief.overdue.map((i) => <ItemLine key={i.id} item={i} />)}</ul>
        </section>
      )}
      {brief.dueSoon.length > 0 && (
        <section className="flex flex-col gap-[8px]">
          <p className={label}>Due in the next 7 days</p>
          <ul className="flex flex-col gap-[8px]">{brief.dueSoon.map((i) => <ItemLine key={i.id} item={i} />)}</ul>
        </section>
      )}
      {brief.spikes.length > 0 && (
        <section className="flex flex-col gap-[8px]">
          <p className={label}>Higher than usual</p>
          <ul className="flex flex-col gap-[8px]">
            {brief.spikes.map((i) => (
              <ItemLine key={i.id} item={i} right={<span className="text-[12px] text-[#b45309]">usually {rupees(i.average)}</span>} />
            ))}
          </ul>
        </section>
      )}
      {brief.scams.length > 0 && (
        <section className="flex flex-col gap-[8px]">
          <p className={`${label} !text-[#dc2626]`}>Possible scams — don't click links</p>
          <ul className="flex flex-col gap-[8px]">
            {brief.scams.map((i) => (
              <li key={i.id} className="bg-[#fef2f2] border border-[#fee2e2] rounded-[20px] px-[16px] py-[12px]">
                <p className="text-[14px] font-semibold text-[#991b1b] truncate">{i.subject || i.issuer || "Suspicious email"}</p>
                <p className="text-[12px] text-[#b91c1c]">{i.scamReason || "Looks like phishing"}{i.from ? ` · ${i.from}` : ""}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
      {brief.taxDates.length > 0 && (
        <section className="flex flex-col gap-[8px]">
          <p className={label}>Tax dates</p>
          <ul className="flex flex-col gap-[6px]">
            {brief.taxDates.map((t) => (
              <li key={t.title} className="flex justify-between gap-[12px] text-[13px]">
                <span className="text-[#374151]">{t.title}</span>
                <span className="font-semibold text-black shrink-0">{day(t.date)}</span>
              </li>
            ))}
          </ul>
          <p className="text-[11px] text-[#9ca3af]">Default due dates. Check incometax.gov.in for extensions.</p>
        </section>
      )}
    </div>
  );
}

function SummaryCard({ summary }: { summary: Summary | null }) {
  const thisMonth = summary?.months.at(-1);
  return (
    <div className={`${card} flex flex-col gap-[16px]`}>
      <h2 className={heading}>Overview</h2>
      <div className="grid grid-cols-2 gap-[12px]">
        <div className="bg-[#f9fafb] border border-[#f3f4f6] rounded-[20px] p-[16px]">
          <p className="text-[22px] font-bold text-black">{rupees(summary?.latestSalary?.amount)}</p>
          <p className={label}>Latest salary{summary?.latestSalary?.period ? ` · ${summary.latestSalary.period}` : ""}</p>
        </div>
        <div className="bg-[#f9fafb] border border-[#f3f4f6] rounded-[20px] p-[16px]">
          <p className="text-[22px] font-bold text-black">{rupees(thisMonth?.total ?? 0)}</p>
          <p className={label}>Billed this month</p>
        </div>
      </div>
      {summary && summary.months.length > 0 && (
        <section className="flex flex-col gap-[6px]">
          <p className={label}>Bills & statements by month</p>
          {summary.months.map((m) => (
            <div key={m.month} className="flex justify-between text-[13px]">
              <span className="text-[#6b7280]">{new Date(`${m.month}-01`).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}</span>
              <span className="font-semibold text-black">{rupees(m.total)}</span>
            </div>
          ))}
        </section>
      )}
      {summary && summary.topIssuersThisMonth.length > 0 && (
        <section className="flex flex-col gap-[6px]">
          <p className={label}>Biggest this month</p>
          {summary.topIssuersThisMonth.map((i) => (
            <div key={i.issuer} className="flex justify-between text-[13px]">
              <span className="text-[#374151] truncate">{i.issuer}</span>
              <span className="font-semibold text-black">{rupees(i.total)}</span>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}

function DuesCard({ items, onChange }: { items: FinanceItem[] | null; onChange: () => void }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  const act = async (item: FinanceItem, action: "paid" | "dismissed" | "open" | "calendar") => {
    setBusy(item.id);
    setError("");
    try {
      const res = action === "calendar"
        ? await apiFetch(`/finance/${item.id}/calendar`, { method: "POST" })
        : await apiFetch(`/finance/${item.id}`, { method: "PATCH", body: JSON.stringify({ status: action }) });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Something went wrong");
      onChange();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const open = items?.filter((i) => i.status === "open") ?? [];
  const closed = items?.filter((i) => i.status !== "open") ?? [];

  return (
    <div className={`${card} flex flex-col gap-[16px]`}>
      <h2 className={heading}>Dues</h2>
      {error && <p className="text-[12px] text-[#dc2626]">{error}</p>}
      {items === null && <p className="text-[13px] text-[#9ca3af]">Loading…</p>}
      {items !== null && open.length === 0 && <p className="text-[13px] text-[#6b7280]">No open dues found in your email.</p>}
      <ul className="flex flex-col gap-[8px]">
        {open.map((i) => (
          <ItemLine key={i.id} item={i} right={
            <>
              {i.dueDate && !i.calendarEventId && (
                <button type="button" disabled={busy === i.id} onClick={() => act(i, "calendar")} className={`${pill} bg-[#f3f4f6] text-[#374151] hover:bg-[#e5e7eb]`}>Calendar</button>
              )}
              <button type="button" disabled={busy === i.id} onClick={() => act(i, "paid")} className={`${pill} bg-black text-white hover:opacity-90`}>Paid</button>
              <button type="button" disabled={busy === i.id} onClick={() => act(i, "dismissed")} className={`${pill} text-[#9ca3af] hover:text-black`} aria-label="Dismiss">✕</button>
            </>
          } />
        ))}
      </ul>
      {closed.length > 0 && (
        <section className="flex flex-col gap-[8px]">
          <p className={label}>Recently closed</p>
          <ul className="flex flex-col gap-[8px] opacity-70">
            {closed.map((i) => (
              <ItemLine key={i.id} item={i} right={
                <button type="button" disabled={busy === i.id} onClick={() => act(i, "open")} className={`${pill} text-[#6b7280] hover:text-black`}>
                  {i.status === "paid" ? "Paid ✓" : "Dismissed"} · undo
                </button>
              } />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function VaultCard() {
  const [fy, setFy] = useState(() => shiftFY(currentFY(), -1));
  const [vault, setVault] = useState<Vault | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setVault(null);
    setFailed(false);
    getJson<Vault>(`/finance/vault?fy=${fy}`)
      .then((v) => { if (!cancelled) setVault(v); })
      .catch(() => { if (!cancelled) setFailed(true); });
    return () => { cancelled = true; };
  }, [fy]);

  return (
    <div className={`${card} flex flex-col gap-[16px]`}>
      <div className="flex items-center justify-between">
        <h2 className={heading}>Tax vault</h2>
        <div className="flex items-center gap-[6px]">
          <button type="button" onClick={() => setFy(shiftFY(fy, -1))} className={`${pill} bg-[#f3f4f6]`} aria-label="Previous financial year">‹</button>
          <span className="text-[13px] font-semibold">FY {fy}</span>
          <button type="button" disabled={fy === currentFY()} onClick={() => setFy(shiftFY(fy, 1))} className={`${pill} bg-[#f3f4f6]`} aria-label="Next financial year">›</button>
        </div>
      </div>
      {failed && <p className="text-[13px] text-[#dc2626]">Couldn't load the vault.</p>}
      {!vault && !failed && <p className="text-[13px] text-[#9ca3af]">Loading…</p>}
      {vault && (
        <>
          <ul className="flex flex-col gap-[8px]">
            {vault.checklist.map((c) => (
              <li key={c.key} className="flex items-center justify-between gap-[12px] text-[13px]">
                <span className="flex items-center gap-[8px]">
                  <span className={`w-[18px] h-[18px] rounded-full flex items-center justify-center text-[11px] ${c.done ? "bg-[#22c55e] text-white" : "bg-[#f3f4f6] text-[#9ca3af]"}`}>{c.done ? "✓" : ""}</span>
                  <span className="text-[#374151]">{c.label}</span>
                </span>
                <span className="text-[#9ca3af] text-[12px] text-right">{c.detail}</span>
              </li>
            ))}
          </ul>
          {vault.documents.length > 0 && (
            <section className="flex flex-col gap-[8px]">
              <p className={label}>{vault.documents.length} document email(s)</p>
              <ul className="flex flex-col gap-[8px] max-h-[280px] overflow-auto">
                {vault.documents.map((d) => <ItemLine key={d.id} item={d} />)}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function SettingsCard({ onSaved }: { onSaved: () => void }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { getJson<Profile>("/finance/profile").then(setProfile).catch(() => setProfile({})); }, []);

  const save = async (patch: Profile) => {
    setSaving(true);
    try {
      const res = await apiFetch("/finance/profile", { method: "PUT", body: JSON.stringify(patch) });
      if (res.ok) { setProfile(await res.json()); onSaved(); }
    } finally {
      setSaving(false);
    }
  };

  if (!profile) return null;
  return (
    <div className={`${card} flex flex-col gap-[14px]`}>
      <h2 className={heading}>Settings</h2>
      <label className="flex items-center justify-between gap-[12px] text-[13px] text-[#374151]">
        Employer investment-proof deadline
        <input
          type="date"
          disabled={saving}
          value={profile.employerProofDeadline ? profile.employerProofDeadline.slice(0, 10) : ""}
          onChange={(e) => save({ employerProofDeadline: e.target.value || null })}
          className="border border-[#e5e7eb] rounded-[12px] px-[10px] py-[6px] text-[13px]"
        />
      </label>
      <label className="flex items-center justify-between gap-[12px] text-[13px] text-[#374151]">
        Tax regime
        <select
          disabled={saving}
          value={profile.taxRegime || ""}
          onChange={(e) => save({ taxRegime: (e.target.value || null) as Profile["taxRegime"] })}
          className="border border-[#e5e7eb] rounded-[12px] px-[10px] py-[6px] text-[13px]"
        >
          <option value="">Not set</option>
          <option value="new">New regime</option>
          <option value="old">Old regime</option>
        </select>
      </label>
      <label className="flex items-center justify-between gap-[12px] text-[13px] text-[#374151]">
        Daily money brief (8 AM)
        <input type="checkbox" disabled={saving} checked={profile.briefEnabled !== false} onChange={(e) => save({ briefEnabled: e.target.checked })} />
      </label>
    </div>
  );
}

export default function MoneyPage() {
  const [brief, setBrief] = useState<Brief | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [dues, setDues] = useState<FinanceItem[] | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const [b, s, d] = await Promise.all([
        getJson<Brief>("/finance/brief"),
        getJson<Summary>("/finance/summary?months=6"),
        getJson<{ items: FinanceItem[] }>("/finance/dues"),
      ]);
      setBrief(b);
      setSummary(s);
      setDues(d.items);
      setError("");
    } catch {
      setError("Couldn't load your money data. Try again in a moment.");
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="w-full min-h-screen" style={{ background: "rgb(226,228,231)" }}>
      <div className="flex gap-[16px] items-start p-[16px] w-full">
        <NavRail active="money" />

        <main className="flex-1 min-w-0 flex flex-col gap-[20px] pr-[8px] pb-[16px]">
          <header>
            <h1 className="font-['Inter:Semi_Bold',sans-serif] font-semibold text-[32px] text-black tracking-[-0.9px] leading-[38px]">Money</h1>
            <p className="font-['Inter:Medium',sans-serif] font-medium text-[#6b7280] text-[13px] mt-[2px]">
              Bills, card dues, salary and tax documents found in your email
            </p>
          </header>
          {error && <p className="text-[13px] text-[#dc2626]">{error}</p>}

          <div className="grid gap-[20px] xl:grid-cols-12">
            <div className="xl:col-span-7"><BriefCard brief={brief} /></div>
            <div className="xl:col-span-5"><SummaryCard summary={summary} /></div>
          </div>
          <div className="grid gap-[20px] xl:grid-cols-12">
            <div className="xl:col-span-7"><DuesCard items={dues} onChange={load} /></div>
            <div className="xl:col-span-5 flex flex-col gap-[20px]">
              <VaultCard />
              <SettingsCard onSaved={load} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
