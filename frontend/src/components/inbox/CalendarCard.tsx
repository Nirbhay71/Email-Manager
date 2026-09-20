import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../../utils/api.ts";

interface CalEvent {
  id: string;
  title: string;
  htmlLink?: string;
  start: string;
  end: string;
  allDay: boolean;
}

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** All-day events carry a plain YYYY-MM-DD; timed ones an ISO instant in some zone. */
function eventKey(e: CalEvent): string {
  return e.allDay ? e.start.slice(0, 10) : dateKey(new Date(e.start));
}

function eventTime(e: CalEvent): string {
  if (e.allDay) return "All day";
  return new Date(e.start).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

/** Six-row (42 day) Monday-first grid covering the month. */
function monthCells(month: Date) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const start = new Date(first);
  start.setDate(1 - ((first.getDay() + 6) % 7));
  const todayKey = dateKey(new Date());
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return { date: d, key: dateKey(d), inMonth: d.getMonth() === month.getMonth(), isToday: dateKey(d) === todayKey };
  });
}

async function fetchEvents(from: Date, to: Date, signal: AbortSignal): Promise<CalEvent[]> {
  const params = new URLSearchParams({ timeMin: from.toISOString(), timeMax: to.toISOString() });
  const res = await apiFetch(`/calendar/events?${params}`, { signal });
  if (!res.ok) throw new Error(String(res.status));
  const json = await res.json();
  return Array.isArray(json.events) ? json.events : [];
}

function relativeDay(d: Date): string {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === tomorrow.toDateString()) return "Tomorrow";
  return d.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
}

export default function CalendarCard() {
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [selected, setSelected] = useState(() => dateKey(new Date()));
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [upcoming, setUpcoming] = useState<CalEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Events for the visible month
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    fetchEvents(new Date(month.getFullYear(), month.getMonth() - 1, 24), new Date(month.getFullYear(), month.getMonth() + 1, 8), controller.signal)
      .then(setEvents)
      .catch((e) => { if (e.name !== "AbortError") { setEvents([]); setError("Calendar unavailable — reconnect Google if this persists."); } })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [month]);

  // The next events from right now, independent of which month is showing
  useEffect(() => {
    const controller = new AbortController();
    const load = () => {
      const now = new Date();
      const end = new Date(now);
      end.setDate(now.getDate() + 30);
      fetchEvents(now, end, controller.signal).then(setUpcoming).catch(() => { /* banner just hides */ });
    };
    load();
    const id = window.setInterval(load, 5 * 60 * 1000);
    return () => { controller.abort(); window.clearInterval(id); };
  }, []);

  const cells = useMemo(() => monthCells(month), [month]);
  const byDay = useMemo(() => {
    const map = new Map<string, CalEvent[]>();
    for (const e of events) {
      const k = eventKey(e);
      map.set(k, [...(map.get(k) ?? []), e]);
    }
    return map;
  }, [events]);

  const dayEvents = byDay.get(selected) ?? [];
  const next = upcoming[0];
  const nextStart = next ? new Date(next.allDay ? `${next.start.slice(0, 10)}T00:00` : next.start) : null;

  const shift = (delta: number) => setMonth(new Date(month.getFullYear(), month.getMonth() + delta, 1));

  return (
    <section className="bg-white rounded-[32px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)] p-[24px] flex flex-col min-h-[280px]">
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-[12px]">
          <h2 className="font-['Inter:Bold',sans-serif] font-bold text-[20px] text-black leading-[28px]">Calendar</h2>
          <span className="flex items-center gap-[6px] text-[10px] font-bold tracking-[0.8px] text-[#6b7280] uppercase">
            <span className={`w-[6px] h-[6px] rounded-full ${error ? "bg-[#dc2626]" : "bg-[#22c55e]"}`} />
            {error ? "Offline" : "Live sync"}
          </span>
        </div>
        <div className="flex items-center gap-[4px]">
          <button onClick={() => shift(-1)} aria-label="Previous month" className="w-[30px] h-[30px] rounded-full hover:bg-[#f3f4f6] text-[#4b5563]" type="button">‹</button>
          <button
            onClick={() => { const n = new Date(); setMonth(new Date(n.getFullYear(), n.getMonth(), 1)); setSelected(dateKey(n)); }}
            className="text-[13px] font-semibold text-black px-[6px] min-w-[120px] text-center"
            type="button"
            title="Jump to today"
          >
            {month.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </button>
          <button onClick={() => shift(1)} aria-label="Next month" className="w-[30px] h-[30px] rounded-full hover:bg-[#f3f4f6] text-[#4b5563]" type="button">›</button>
        </div>
      </div>

      {nextStart && next && (
        <a
          href={next.htmlLink || undefined}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-[14px] flex items-center justify-between gap-[12px] bg-black text-white rounded-[20px] px-[18px] py-[12px] shrink-0 hover:opacity-90 transition"
        >
          <span className="min-w-0">
            <span className="block text-[10px] tracking-[1px] uppercase text-[#9ca3af]">Next event</span>
            <span className="block text-[14px] font-semibold truncate">{next.title}</span>
            <span className="block text-[12px] text-[#d1d5db]">
              {relativeDay(nextStart)}{next.allDay ? "" : ` at ${eventTime(next)}`}
            </span>
          </span>
          {upcoming.length > 1 && <span className="text-[11px] font-semibold bg-white/15 rounded-full px-[10px] py-[3px] shrink-0">+{upcoming.length - 1} more</span>}
        </a>
      )}

      <div className="grid md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] gap-[20px] mt-[16px] flex-1 min-h-0">
        {/* Month grid */}
        <div aria-busy={loading}>
          <div className="grid grid-cols-7 text-center mb-[4px]">
            {WEEKDAYS.map((d) => <span key={d} className="text-[10px] font-bold tracking-[0.6px] text-[#9ca3af] uppercase">{d}</span>)}
          </div>
          <div className="grid grid-cols-7 gap-y-[2px]">
            {cells.map((c) => {
              const count = byDay.get(c.key)?.length ?? 0;
              const isSel = c.key === selected;
              return (
                <button
                  key={c.key}
                  onClick={() => setSelected(c.key)}
                  aria-label={`${c.date.toDateString()}${count ? `, ${count} event${count > 1 ? "s" : ""}` : ""}`}
                  aria-pressed={isSel}
                  className={`relative h-[36px] rounded-[12px] text-[13px] font-semibold transition
                    ${isSel ? "bg-black text-white" : c.isToday ? "bg-[#f3f4f6] text-black" : c.inMonth ? "text-[#374151] hover:bg-[#f9fafb]" : "text-[#d1d5db] hover:bg-[#f9fafb]"}`}
                  type="button"
                >
                  {c.date.getDate()}
                  {count > 0 && <span className={`absolute bottom-[4px] left-1/2 -translate-x-1/2 w-[4px] h-[4px] rounded-full ${isSel ? "bg-white" : "bg-[#2563eb]"}`} />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected day */}
        <div className="min-w-0">
          <p className="text-[12px] font-bold text-[#6b7280] uppercase tracking-[0.6px] mb-[8px]">
            {relativeDay(new Date(`${selected}T00:00`))}
          </p>
          {dayEvents.length === 0 ? (
            <p className="text-[13px] text-[#9ca3af]">{loading ? "Loading…" : "Nothing scheduled."}</p>
          ) : (
            <ul className="flex flex-col gap-[8px] max-h-[220px] overflow-y-auto pr-[4px]">
              {dayEvents.map((e) => (
                <li key={e.id} className="bg-[#f9fafb] border border-[#f3f4f6] rounded-[14px] px-[14px] py-[10px]">
                  <p className="text-[13px] font-semibold text-[#374151] truncate">{e.title}</p>
                  <p className="text-[11px] text-[#9ca3af]">{eventTime(e)}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
