import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { apiFetch } from "../../utils/api.ts";

export interface InboxEmail {
  id: string;
  messageId: string;
  subject: string;
  preview: string;
  senderName: string;
  senderEmail: string;
  from: string;
  receivedAt: string;
  detectedDate?: string | null;
  calendarEventId?: string | null;
}

interface InboxResponse {
  emails: InboxEmail[];
  total: number;
  page: number;
  pages: number;
  limit: number;
  counts: { all: number; deadlines: number };
}

type Tab = "all" | "deadlines";

const PAGE_SIZE = 8;
const REFRESH_MS = 30000;

const AVATAR_THEMES = [
  "bg-[#dbeafe] text-[#2563eb]",
  "bg-[#f3e8ff] text-[#9333ea]",
  "bg-[#fee2e2] text-[#dc2626]",
  "bg-[#f3f4f6] text-[#4b5563]",
  "bg-[#dcfce7] text-[#16a34a]",
  "bg-[#ffedd5] text-[#ea580c]",
];

function themeFor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return AVATAR_THEMES[hash % AVATAR_THEMES.length];
}

function initials(name: string): string {
  const parts = name.replace(/[^a-zA-Z0-9\s]/g, " ").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function formatWhen(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], d.getFullYear() === now.getFullYear()
    ? { month: "short", day: "numeric" }
    : { month: "short", day: "numeric", year: "numeric" });
}

/** Compact page list: 1 … 4 5 6 … 12 */
function pageWindow(page: number, pages: number): (number | "…")[] {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
  const out: (number | "…")[] = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(pages - 1, page + 1);
  if (start > 2) out.push("…");
  for (let i = start; i <= end; i++) out.push(i);
  if (end < pages - 1) out.push("…");
  out.push(pages);
  return out;
}

export default function InboxCard({ onLatest }: { onLatest?: (email: InboxEmail | null, deadlines: number) => void }) {
  const [tab, setTab] = useState<Tab>("all");
  const [page, setPage] = useState(1);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [data, setData] = useState<InboxResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const onLatestRef = useRef(onLatest);
  onLatestRef.current = onLatest;

  // Debounce the search box so we don't query on every keystroke
  useEffect(() => {
    const id = window.setTimeout(() => { setQuery(search.trim()); setPage(1); }, 300);
    return () => window.clearTimeout(id);
  }, [search]);

  const load = useCallback(async (signal: AbortSignal, silent: boolean) => {
    if (!silent) setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
      if (tab === "deadlines") params.set("filter", "deadlines");
      if (query) params.set("q", query);
      const res = await apiFetch(`/emails/inbox?${params}`, { signal });
      if (!res.ok) throw new Error(`Inbox request failed with ${res.status}`);
      const json: InboxResponse = await res.json();
      setData(json);
      setError("");
      if (page === 1 && !query && tab === "all") onLatestRef.current?.(json.emails[0] ?? null, json.counts.deadlines);
      if (json.page !== page) setPage(json.page);
    } catch (e) {
      if ((e as Error).name !== "AbortError") setError("Unable to load emails right now.");
    } finally {
      if (!signal.aborted) setLoading(false);
    }
  }, [page, tab, query]);

  // Load on every page/tab/search change, and poll quietly so new webhook mail shows up
  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal, false);
    const id = window.setInterval(() => load(controller.signal, true), REFRESH_MS);
    return () => { controller.abort(); window.clearInterval(id); };
  }, [load]);

  const emails = data?.emails ?? [];
  const total = data?.total ?? 0;
  const pages = data?.pages ?? 1;
  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: "all", label: "All mail", count: data?.counts.all },
    { key: "deadlines", label: "Deadlines", count: data?.counts.deadlines },
  ];

  return (
    <section className="bg-white rounded-[32px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] flex flex-col min-h-0 h-full p-[24px]">
      {/* Header */}
      <div className="flex items-center justify-between gap-[12px] shrink-0">
        <h2 className="font-['Inter:Bold',sans-serif] font-bold text-[22px] text-black leading-[30px]">Inbox</h2>
        <div className="flex items-center gap-[8px] min-w-0">
          {searchOpen && (
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search sender or subject"
              className="min-w-0 w-[200px] bg-[#f9fafb] border border-[#e5e7eb] rounded-full px-[14px] py-[6px] text-[13px] outline-none focus:border-black"
            />
          )}
          <button
            onClick={() => { if (searchOpen) { setSearch(""); } setSearchOpen(!searchOpen); }}
            aria-label={searchOpen ? "Close search" : "Search inbox"}
            className="w-[34px] h-[34px] rounded-full hover:bg-[#f3f4f6] flex items-center justify-center text-[#6b7280] transition shrink-0"
            type="button"
          >
            {searchOpen ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
            )}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-[20px] border-b border-[#f3f4f6] mt-[12px] shrink-0">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setPage(1); }}
            className={`pb-[10px] -mb-px text-[14px] font-semibold border-b-2 transition ${tab === t.key ? "border-black text-black" : "border-transparent text-[#9ca3af] hover:text-[#4b5563]"}`}
            type="button"
          >
            {t.label}
            {t.count !== undefined && (
              <span className={`ml-[6px] rounded-full px-[7px] py-[1px] text-[11px] ${tab === t.key ? "bg-black text-white" : "bg-[#f3f4f6] text-[#6b7280]"}`}>{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 min-h-0 overflow-y-auto mt-[8px] -mr-[8px] pr-[8px]">
        {loading && !data ? (
          <ul aria-busy className="flex flex-col gap-[4px]">
            {Array.from({ length: 5 }).map((_, i) => (
              <li key={i} className="flex items-center gap-[14px] p-[12px] animate-pulse">
                <span className="w-[40px] h-[40px] rounded-full bg-[#f3f4f6]" />
                <span className="flex-1 flex flex-col gap-[8px]">
                  <span className="h-[12px] w-[35%] rounded bg-[#f3f4f6]" />
                  <span className="h-[10px] w-[75%] rounded bg-[#f3f4f6]" />
                </span>
              </li>
            ))}
          </ul>
        ) : error ? (
          <Empty title="Inbox unavailable" detail={error} />
        ) : emails.length === 0 ? (
          query ? <Empty title="No matches" detail={`Nothing found for “${query}”.`} />
            : tab === "deadlines" ? <Empty title="No deadlines yet" detail="Emails containing a date will be listed here." />
            : <Empty title="No emails yet" detail="New mail appears here automatically once Gmail notifies the app." />
        ) : (
          <ul className="flex flex-col gap-[2px]">
            {emails.map((email) => {
              const sender = email.senderName || email.senderEmail || email.from || "Unknown sender";
              return (
                <li key={email.messageId || email.id} className="flex items-center gap-[14px] p-[12px] rounded-[20px] hover:bg-[#f9fafb] transition-colors">
                  <span className={`${themeFor(sender)} w-[40px] h-[40px] rounded-full flex items-center justify-center text-[12px] font-bold shrink-0`}>
                    {initials(sender)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-[12px]">
                      <p className="font-bold text-[14px] text-black truncate">{sender}</p>
                      <time className="text-[10px] font-semibold text-[#9ca3af] shrink-0" dateTime={email.receivedAt}>{formatWhen(email.receivedAt)}</time>
                    </div>
                    <p className="text-[12px] font-medium text-[#6b7280] truncate">
                      <span className="text-[#374151]">{email.subject}</span>
                      {email.preview ? ` — ${email.preview}` : ""}
                    </p>
                    {(email.detectedDate || email.calendarEventId) && (
                      <div className="flex gap-[6px] mt-[4px]">
                        {email.detectedDate && <Chip>Deadline {email.detectedDate}</Chip>}
                        {email.calendarEventId && <Chip>On calendar</Chip>}
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between gap-[12px] pt-[12px] mt-[8px] border-t border-[#f3f4f6] shrink-0">
        <p className="text-[12px] text-[#9ca3af]">
          {total === 0 ? "No messages" : `${from}–${to} of ${total}`}
        </p>
        <nav className="flex items-center gap-[4px]" aria-label="Inbox pages">
          <PagerButton disabled={page <= 1} onClick={() => setPage(page - 1)} label="Previous page">‹</PagerButton>
          {pageWindow(page, pages).map((p, i) =>
            p === "…" ? (
              <span key={`gap-${i}`} className="px-[4px] text-[#9ca3af] text-[12px]">…</span>
            ) : (
              <PagerButton key={p} active={p === page} onClick={() => setPage(p)} label={`Page ${p}`}>{p}</PagerButton>
            )
          )}
          <PagerButton disabled={page >= pages} onClick={() => setPage(page + 1)} label="Next page">›</PagerButton>
        </nav>
      </div>
    </section>
  );
}

function Chip({ children }: { children: ReactNode }) {
  return <span className="text-[10px] font-semibold text-[#4b5563] bg-[#f3f4f6] rounded-full px-[8px] py-[2px]">{children}</span>;
}

function PagerButton({ children, onClick, disabled, active, label }: {
  children: ReactNode; onClick: () => void; disabled?: boolean; active?: boolean; label: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-current={active ? "page" : undefined}
      className={`min-w-[30px] h-[30px] px-[8px] rounded-full text-[13px] font-semibold transition ${active ? "bg-black text-white" : "text-[#4b5563] hover:bg-[#f3f4f6] disabled:opacity-30 disabled:hover:bg-transparent"}`}
      type="button"
    >
      {children}
    </button>
  );
}

function Empty({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="h-full min-h-[160px] flex flex-col items-center justify-center text-center px-[24px] gap-[4px]">
      <p className="font-bold text-[14px] text-black">{title}</p>
      <p className="text-[12px] font-medium text-[#9ca3af] max-w-[320px]">{detail}</p>
    </div>
  );
}
