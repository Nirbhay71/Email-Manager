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
  category?: string | null;
  needsReview?: boolean;
}

interface CategoryOption { id: string; name: string }

interface InboxResponse {
  emails: InboxEmail[];
  total: number;
  page: number;
  pages: number;
  limit: number;
  counts: { all: number; deadlines: number };
}

type Tab = "all" | "deadlines";

const DEFAULT_PAGE_SIZE = 8;
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

export default function InboxCard({ onLatest, pageSize = DEFAULT_PAGE_SIZE }: {
  onLatest?: (email: InboxEmail | null, deadlines: number) => void;
  pageSize?: number;
}) {
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

  // "Add event" / "categorize" state, shared between the row controls and the open-mail modal
  const [addingIds, setAddingIds] = useState<Set<string>>(new Set());
  const [categorizingIds, setCategorizingIds] = useState<Set<string>>(new Set());
  const [actionError, setActionError] = useState("");
  const [categories, setCategories] = useState<CategoryOption[]>([]);

  // Open-mail modal
  const [openEmailId, setOpenEmailId] = useState<string | null>(null);
  const [detail, setDetail] = useState<(InboxEmail & { body: string }) | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  // Debounce the search box so we don't query on every keystroke
  useEffect(() => {
    const id = window.setTimeout(() => { setQuery(search.trim()); setPage(1); }, 300);
    return () => window.clearTimeout(id);
  }, [search]);

  const load = useCallback(async (signal: AbortSignal, silent: boolean) => {
    if (!silent) setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(pageSize) });
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
  }, [page, tab, query, pageSize]);

  // Load on every page/tab/search change, and poll quietly so new webhook mail shows up
  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal, false);
    const id = window.setInterval(() => load(controller.signal, true), REFRESH_MS);
    return () => { controller.abort(); window.clearInterval(id); };
  }, [load]);

  // Fetch the full body when a mail is opened
  useEffect(() => {
    if (!openEmailId) { setDetail(null); setDetailError(""); return; }
    const controller = new AbortController();
    setDetailLoading(true);
    setDetailError("");
    apiFetch(`/emails/${openEmailId}`, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error(`Request failed with ${res.status}`);
        setDetail(await res.json());
      })
      .catch((e) => { if (e.name !== "AbortError") setDetailError("Unable to load this email."); })
      .finally(() => { if (!controller.signal.aborted) setDetailLoading(false); });
    return () => controller.abort();
  }, [openEmailId]);

  // The user's categories, for the inline categorize picker — fetched once,
  // independent of CategoriesCard's own fetch elsewhere on the dashboard.
  useEffect(() => {
    const controller = new AbortController();
    apiFetch("/categories", { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) return;
        const json = await res.json();
        setCategories((json.categories ?? []).map((c: CategoryOption) => ({ id: c.id, name: c.name })));
      })
      .catch(() => { /* picker just stays empty */ });
    return () => controller.abort();
  }, []);

  const handleAddEvent = useCallback(async (target: { id: string }) => {
    setAddingIds((prev) => new Set(prev).add(target.id));
    setActionError("");
    try {
      const res = await apiFetch(`/emails/${target.id}/calendar-event`, { method: "POST" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || `Request failed with ${res.status}`);
      setData((prev) => prev ? {
        ...prev,
        emails: prev.emails.map((e) => e.id === target.id ? { ...e, calendarEventId: json.calendarEventId } : e),
      } : prev);
      setDetail((prev) => prev && prev.id === target.id ? { ...prev, calendarEventId: json.calendarEventId } : prev);
    } catch (e) {
      setActionError((e as Error).message || "Unable to add event.");
    } finally {
      setAddingIds((prev) => { const next = new Set(prev); next.delete(target.id); return next; });
    }
  }, []);

  const handleRemoveEvent = useCallback(async (target: { id: string }) => {
    setAddingIds((prev) => new Set(prev).add(target.id));
    setActionError("");
    try {
      const res = await apiFetch(`/emails/${target.id}/calendar-event`, { method: "DELETE" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || `Request failed with ${res.status}`);
      setData((prev) => prev ? {
        ...prev,
        emails: prev.emails.map((e) => e.id === target.id ? { ...e, calendarEventId: null } : e),
      } : prev);
      setDetail((prev) => prev && prev.id === target.id ? { ...prev, calendarEventId: null } : prev);
    } catch (e) {
      setActionError((e as Error).message || "Unable to remove event.");
    } finally {
      setAddingIds((prev) => { const next = new Set(prev); next.delete(target.id); return next; });
    }
  }, []);

  const handleSetCategory = useCallback(async (target: { id: string }, category: string) => {
    setCategorizingIds((prev) => new Set(prev).add(target.id));
    setActionError("");
    try {
      const res = await apiFetch(`/emails/${target.id}/category`, { method: "POST", body: JSON.stringify({ category }) });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || `Request failed with ${res.status}`);
      setData((prev) => prev ? {
        ...prev,
        emails: prev.emails.map((e) => e.id === target.id ? { ...e, category: json.category, needsReview: json.needsReview } : e),
      } : prev);
      setDetail((prev) => prev && prev.id === target.id ? { ...prev, category: json.category, needsReview: json.needsReview } : prev);
    } catch (e) {
      setActionError((e as Error).message || "Unable to set category.");
    } finally {
      setCategorizingIds((prev) => { const next = new Set(prev); next.delete(target.id); return next; });
    }
  }, []);

  const emails = data?.emails ?? [];
  const total = data?.total ?? 0;
  const pages = data?.pages ?? 1;
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

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
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => setOpenEmailId(email.id)}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpenEmailId(email.id); } }}
                    className="flex items-center gap-[14px] min-w-0 flex-1 cursor-pointer text-left"
                  >
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
                      {(email.detectedDate || email.calendarEventId || email.category || categories.length > 0) && (
                        <div className="flex items-center justify-between gap-[8px] mt-[4px] flex-wrap">
                          <div className="flex items-center gap-[6px]">
                            {email.detectedDate && <Chip>Deadline {email.detectedDate}</Chip>}
                            {email.calendarEventId && (
                              <span className="flex items-center gap-[4px]">
                                <Chip>On calendar</Chip>
                                <button
                                  onClick={(e) => { e.stopPropagation(); handleRemoveEvent(email); }}
                                  disabled={addingIds.has(email.id)}
                                  type="button"
                                  className="text-[10px] font-semibold text-[#9ca3af] hover:text-[#dc2626] disabled:opacity-50 transition"
                                >
                                  {addingIds.has(email.id) ? "…" : "Remove"}
                                </button>
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-[6px] shrink-0">
                            {email.detectedDate && !email.calendarEventId && (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleAddEvent(email); }}
                                disabled={addingIds.has(email.id)}
                                type="button"
                                className="text-[10px] font-semibold text-white bg-black rounded-full px-[10px] py-[3px] hover:opacity-90 disabled:opacity-50 transition shrink-0"
                              >
                                {addingIds.has(email.id) ? "Adding…" : "+ Add event"}
                              </button>
                            )}
                            {(email.category || categories.length > 0) && (
                              <CategoryPicker
                                category={email.category}
                                needsReview={email.needsReview}
                                categories={categories}
                                busy={categorizingIds.has(email.id)}
                                onSet={(category) => handleSetCategory(email, category)}
                              />
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {actionError && (
        <p className="text-[11px] font-medium text-[#dc2626] pt-[8px] shrink-0">{actionError}</p>
      )}

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

      {openEmailId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-[16px]"
          onClick={() => setOpenEmailId(null)}
        >
          <div
            className="bg-white rounded-[24px] shadow-xl w-full max-w-[560px] max-h-[80vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-[12px] p-[20px] border-b border-[#f3f4f6] shrink-0">
              <h3 className="font-bold text-[16px] text-black truncate">{detail?.subject || "Email"}</h3>
              <button
                onClick={() => setOpenEmailId(null)}
                aria-label="Close"
                type="button"
                className="w-[32px] h-[32px] rounded-full hover:bg-[#f3f4f6] flex items-center justify-center text-[#6b7280] shrink-0"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-[20px]">
              {detailLoading ? (
                <p className="text-[13px] text-[#9ca3af]">Loading…</p>
              ) : detailError ? (
                <p className="text-[13px] text-[#dc2626]">{detailError}</p>
              ) : detail ? (
                <>
                  <div className="flex items-start justify-between gap-[12px] mb-[12px]">
                    <div className="min-w-0">
                      <p className="font-bold text-[14px] text-black truncate">{detail.senderName || detail.senderEmail}</p>
                      <p className="text-[12px] text-[#9ca3af] truncate">{detail.senderEmail || detail.from}</p>
                    </div>
                    <time className="text-[11px] text-[#9ca3af] shrink-0">{formatWhen(detail.receivedAt)}</time>
                  </div>
                  {(detail.detectedDate || detail.calendarEventId || detail.category || categories.length > 0) && (
                    <div className="flex items-center justify-between gap-[8px] mb-[16px] flex-wrap">
                      <div className="flex items-center gap-[6px]">
                        {detail.detectedDate && <Chip>Deadline {detail.detectedDate}</Chip>}
                        {detail.calendarEventId && (
                          <span className="flex items-center gap-[4px]">
                            <Chip>On calendar</Chip>
                            <button
                              onClick={() => handleRemoveEvent(detail)}
                              disabled={addingIds.has(detail.id)}
                              type="button"
                              className="text-[10px] font-semibold text-[#9ca3af] hover:text-[#dc2626] disabled:opacity-50 transition"
                            >
                              {addingIds.has(detail.id) ? "…" : "Remove"}
                            </button>
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-[6px] shrink-0">
                        {detail.detectedDate && !detail.calendarEventId && (
                          <button
                            onClick={() => handleAddEvent(detail)}
                            disabled={addingIds.has(detail.id)}
                            type="button"
                            className="text-[10px] font-semibold text-white bg-black rounded-full px-[10px] py-[3px] hover:opacity-90 disabled:opacity-50 transition shrink-0"
                          >
                            {addingIds.has(detail.id) ? "Adding…" : "+ Add event"}
                          </button>
                        )}
                        {(detail.category || categories.length > 0) && (
                          <CategoryPicker
                            category={detail.category}
                            needsReview={detail.needsReview}
                            categories={categories}
                            busy={categorizingIds.has(detail.id)}
                            onSet={(category) => handleSetCategory(detail, category)}
                          />
                        )}
                      </div>
                    </div>
                  )}
                  <p className="text-[13px] text-[#374151] whitespace-pre-wrap leading-[20px]">{detail.body}</p>
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function Chip({ children }: { children: ReactNode }) {
  return <span className="text-[10px] font-semibold text-[#4b5563] bg-[#f3f4f6] rounded-full px-[8px] py-[2px]">{children}</span>;
}

/**
 * Inline category assign/correct control. The <select> always reflects the
 * current category (or a placeholder), so changing it is always a valid
 * action. A prediction the model is unsure about can't be "confirmed" by
 * re-picking the same already-selected option (no change event fires), so
 * a needs-review badge doubles as a one-click "accept as-is" button.
 */
function CategoryPicker({ category, needsReview, categories, busy, onSet }: {
  category?: string | null;
  needsReview?: boolean;
  categories: CategoryOption[];
  busy: boolean;
  onSet: (category: string) => void;
}) {
  return (
    <span className="flex items-center gap-[6px]" onClick={(e) => e.stopPropagation()}>
      {needsReview && category && (
        <button
          type="button"
          onClick={() => onSet(category)}
          disabled={busy}
          className="text-[10px] font-semibold text-[#b45309] bg-[#fef3c7] rounded-full px-[8px] py-[2px] hover:opacity-80 disabled:opacity-50 transition"
        >
          Needs review · Confirm
        </button>
      )}
      <select
        value={category ?? ""}
        disabled={busy || categories.length === 0}
        onChange={(e) => { if (e.target.value) onSet(e.target.value); }}
        className="text-[10px] font-semibold text-[#4b5563] bg-white border border-[#e5e7eb] rounded-full pl-[8px] pr-[4px] py-[2px] outline-none focus:border-black max-w-[130px] truncate disabled:opacity-50"
      >
        <option value="" disabled>{categories.length === 0 ? "No categories yet" : "Categorize…"}</option>
        {categories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
      </select>
    </span>
  );
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
