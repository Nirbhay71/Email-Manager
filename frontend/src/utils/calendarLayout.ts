export interface CalendarEvent {
  id?: string;
  title?: string;
  summary?: string;
  start: string;
  end?: string;
  allDay?: boolean;
  htmlLink?: string;
}

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/** Google all-day events carry a bare date; parse it as *local* midnight, not UTC. */
function parse(value: string | undefined): Date | null {
  if (!value) return null;
  const d = new Date(DATE_ONLY.test(value) ? `${value}T00:00:00` : value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function eventStart(e: CalendarEvent): Date | null {
  return parse(e.start);
}

/** End instant (exclusive). A missing/invalid end falls back to one hour, or one day if all-day. */
export function eventEnd(e: CalendarEvent): Date | null {
  const start = eventStart(e);
  if (!start) return null;
  const end = parse(e.end);
  if (end && end > start) return end;
  const fallback = new Date(start);
  if (e.allDay || DATE_ONLY.test(e.start)) fallback.setDate(fallback.getDate() + 1);
  else fallback.setHours(fallback.getHours() + 1);
  return fallback;
}

export function isAllDay(e: CalendarEvent): boolean {
  return Boolean(e.allDay) || DATE_ONLY.test(e.start);
}

export function startOfDay(d: Date): Date {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  return out;
}

/** Monday-first week containing `date`. */
export function weekDays(date: Date): Date[] {
  const start = startOfDay(date);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

export interface PlacedEvent {
  event: CalendarEvent;
  /** minutes from the top of the day, clamped to 0–1440 */
  startMin: number;
  endMin: number;
  lane: number;
  lanes: number;
}

/** Timed events that overlap `day`, laid out side by side when they collide. */
export function layoutDay(events: CalendarEvent[], day: Date, minDurationMin = 30): PlacedEvent[] {
  const dayStart = startOfDay(day);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  const items = events
    .filter((e) => !isAllDay(e))
    .map((event) => {
      const s = eventStart(event);
      const e = eventEnd(event);
      if (!s || !e || e <= dayStart || s >= dayEnd) return null;
      const startMin = Math.max(0, (s.getTime() - dayStart.getTime()) / 60000);
      const rawEnd = Math.min(1440, (e.getTime() - dayStart.getTime()) / 60000);
      return { event, startMin, endMin: Math.max(rawEnd, Math.min(startMin + minDurationMin, 1440)) };
    })
    .filter((x): x is { event: CalendarEvent; startMin: number; endMin: number } => x !== null)
    .sort((a, b) => a.startMin - b.startMin || b.endMin - a.endMin);

  const placed: PlacedEvent[] = [];
  let cluster: PlacedEvent[] = [];
  let laneEnds: number[] = [];
  let clusterEnd = -1;

  const flush = () => {
    for (const p of cluster) p.lanes = laneEnds.length;
    placed.push(...cluster);
    cluster = [];
    laneEnds = [];
    clusterEnd = -1;
  };

  for (const item of items) {
    if (cluster.length && item.startMin >= clusterEnd) flush();
    let lane = laneEnds.findIndex((end) => end <= item.startMin);
    if (lane === -1) { lane = laneEnds.length; laneEnds.push(item.endMin); }
    else laneEnds[lane] = item.endMin;
    cluster.push({ ...item, lane, lanes: 1 });
    clusterEnd = Math.max(clusterEnd, item.endMin);
  }
  flush();
  return placed;
}

/** All-day events that cover `day`. End is exclusive, so a one-day event ends at the next midnight. */
export function allDayFor(events: CalendarEvent[], day: Date): CalendarEvent[] {
  const dayStart = startOfDay(day);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);
  return events.filter((e) => {
    if (!isAllDay(e)) return false;
    const s = eventStart(e);
    const en = eventEnd(e);
    return Boolean(s && en && s < dayEnd && en > dayStart);
  });
}
