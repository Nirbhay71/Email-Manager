import { useEffect, useMemo, useRef } from "react";
import { allDayFor, layoutDay, startOfDay, weekDays, eventStart, type CalendarEvent } from "../../utils/calendarLayout.ts";
import { useNow } from "../../utils/weather.ts";

const HOUR_PX = 64;
const HOURS = Array.from({ length: 24 }, (_, h) => h);

function hourLabel(h: number): string {
  if (h === 0) return "";
  const suffix = h < 12 ? "AM" : "PM";
  return `${h % 12 === 0 ? 12 : h % 12} ${suffix}`;
}

function clock(minutes: number): string {
  const d = new Date(2000, 0, 1, 0, minutes);
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

interface Props {
  events: CalendarEvent[];
  anchorDate: Date;
  viewMode: "day" | "week" | string;
}

/**
 * 24-hour day/week grid. Each event sits in its day's column at its real start time,
 * sized by duration; overlapping events share the column. All-day events go in a strip on top.
 * Column widths match the sticky header above it (one time gutter + one column per day).
 */
export default function TimeGrid({ events, anchorDate, viewMode }: Props) {
  const days = useMemo(() => (viewMode === "day" ? [startOfDay(anchorDate)] : weekDays(anchorDate)), [anchorDate, viewMode]);
  const now = useNow(60000);
  const scroller = useRef<HTMLDivElement>(null);
  const cols = { gridTemplateColumns: `repeat(${days.length + 1}, minmax(0, 1fr))` };

  const perDay = useMemo(
    () => days.map((day) => ({ day, timed: layoutDay(events, day), allDay: allDayFor(events, day) })),
    [days, events]
  );
  const hasAllDay = perDay.some((d) => d.allDay.length > 0);

  // Open scrolled to something useful: the earliest visible event, else "now" if today is showing, else 8 AM
  const rangeKey = `${days[0].getTime()}-${days.length}`;
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const starts = perDay.flatMap((d) => d.timed.map((p) => p.startMin));
    const todayShown = days.some((d) => d.toDateString() === new Date().toDateString());
    const focusMin = starts.length ? Math.min(...starts) : todayShown ? new Date().getHours() * 60 : 8 * 60;
    el.scrollTop = Math.max(0, (focusMin / 60 - 1) * HOUR_PX);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rangeKey]);

  const nowMin = now.getHours() * 60 + now.getMinutes();

  return (
    <div className="flex flex-col flex-[1_0_0] min-h-0 w-full">
      {hasAllDay && (
        <div className="grid shrink-0 border-b border-[rgba(0,0,0,0.05)]" style={cols}>
          <div className="flex items-center justify-center py-[8px] text-[10px] font-bold tracking-[1px] uppercase text-[#71717a]">All day</div>
          {perDay.map(({ day, allDay }) => (
            <div key={day.toISOString()} className="border-l border-[rgba(0,0,0,0.05)] p-[4px] flex flex-col gap-[4px] min-w-0">
              {allDay.map((e, i) => (
                <div key={e.id ?? i} className="bg-black text-white rounded-[10px] px-[8px] py-[3px] text-[11px] font-bold truncate" title={e.title || e.summary}>
                  {e.title || e.summary || "Event"}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      <div ref={scroller} className="flex-1 min-h-0 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="grid relative" style={{ ...cols, height: HOUR_PX * 24 }}>
          {/* Time gutter */}
          <div className="relative">
            {HOURS.map((h) => h > 0 && (
              <span
                key={h}
                className="absolute inset-x-0 text-center text-[10px] font-bold tracking-[0.8px] uppercase text-[#71717a] -translate-y-1/2"
                style={{ top: h * HOUR_PX }}
              >
                {hourLabel(h)}
              </span>
            ))}
          </div>

          {perDay.map(({ day, timed }) => {
            const isToday = day.toDateString() === now.toDateString();
            return (
              <div
                key={day.toISOString()}
                className={`relative border-l border-[rgba(0,0,0,0.05)] ${isToday ? "bg-[rgba(0,0,0,0.03)]" : ""}`}
                style={{
                  backgroundImage: `repeating-linear-gradient(to bottom, transparent 0, transparent ${HOUR_PX - 1}px, rgba(0,0,0,0.05) ${HOUR_PX - 1}px, rgba(0,0,0,0.05) ${HOUR_PX}px)`,
                }}
              >
                {timed.map((p, i) => {
                  const top = (p.startMin / 60) * HOUR_PX;
                  const height = Math.max(((p.endMin - p.startMin) / 60) * HOUR_PX - 2, 22);
                  const title = p.event.title || p.event.summary || "Event";
                  const start = eventStart(p.event);
                  const body = (
                    <>
                      <span className="block text-[12px] font-bold leading-[15px] truncate">{title}</span>
                      {height >= 38 && start && (
                        <span className="block text-[10px] leading-[14px] text-white/70 truncate">{clock(p.startMin)} – {clock(p.endMin)}</span>
                      )}
                    </>
                  );
                  const style = {
                    top,
                    height,
                    left: `calc(${(p.lane / p.lanes) * 100}% + 2px)`,
                    width: `calc(${100 / p.lanes}% - 4px)`,
                  };
                  const cls = "absolute bg-black text-white rounded-[12px] px-[8px] py-[4px] overflow-hidden shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.15)] hover:z-10 hover:shadow-lg transition";
                  return p.event.htmlLink ? (
                    <a key={p.event.id ?? i} href={p.event.htmlLink} target="_blank" rel="noopener noreferrer" className={cls} style={style} title={title}>{body}</a>
                  ) : (
                    <div key={p.event.id ?? i} className={cls} style={style} title={title}>{body}</div>
                  );
                })}

                {isToday && (
                  <div className="absolute inset-x-0 pointer-events-none z-20" style={{ top: (nowMin / 60) * HOUR_PX }}>
                    <div className="h-[2px] bg-black" />
                    <span className="absolute -left-[4px] -top-[3px] w-[8px] h-[8px] rounded-full bg-black" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
