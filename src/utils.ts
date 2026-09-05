import type { AvailabilitySlot, DayOfWeek } from "./types";
import {
  CONSULTATION_GRID_END_MINUTES,
  CONSULTATION_GRID_START_MINUTES,
} from "./constants";

/** Generates a unique temporary ID for a newly created availability slot. */
export function newTempAvailabilitySlotId(): string {
  const c = globalThis.crypto;
  if (c !== undefined && typeof c.randomUUID === "function") {
    return `temp-${c.randomUUID()}`;
  }
  if (c !== undefined && typeof c.getRandomValues === "function") {
    const bytes = new Uint8Array(16);
    c.getRandomValues(bytes);
    return `temp-${Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")}`;
  }
  return `temp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

/**
 * Determines which day-of-week column a pointer X position falls on.
 * @param clientX - Pointer clientX coordinate.
 * @param daysGridEl - The days grid DOM element.
 * @param orderedDays - Days array ordered by `startDay` setting.
 * @returns The `DayOfWeek` corresponding to the column under the pointer.
 */
export function dayIndexFromClientX(
  clientX: number,
  daysGridEl: HTMLElement,
  orderedDays: DayOfWeek[]
): DayOfWeek {
  const r = daysGridEl.getBoundingClientRect();
  const x = Math.max(0, Math.min(r.width - Number.EPSILON, clientX - r.left));
  const colW = r.width / 7;
  const colIndex = Math.min(6, Math.floor(x / colW));
  return orderedDays[colIndex];
}

/**
 * Clamps the move-ghost position so it stays within the visible grid area.
 * @returns Clamped `{ left, top }` in viewport coordinates.
 */
export function clampGhostToGridArea(
  clientX: number,
  clientY: number,
  grabOffsetX: number,
  grabOffsetY: number,
  widthPx: number,
  heightPx: number,
  container: DOMRectReadOnly,
  daysGrid: DOMRectReadOnly,
  headerRowPx: number
): { left: number; top: number } {
  const left = clientX - grabOffsetX;
  const top = clientY - grabOffsetY;
  const stickyHeaderBottom = container.top + headerRowPx;
  const minL = Math.max(container.left, daysGrid.left);
  const maxL = Math.min(container.right - widthPx, daysGrid.right - widthPx);
  const minT = Math.max(container.top, daysGrid.top, stickyHeaderBottom);
  const maxT = Math.min(
    container.bottom - heightPx,
    daysGrid.bottom - heightPx
  );
  return {
    left: Math.max(minL, Math.min(maxL, left)),
    top: Math.max(minT, Math.min(maxT, top)),
  };
}

/**
 * Converts a time string in "HH:mm" format to total minutes since midnight.
 *
 * Malformed input yields `0` rather than `NaN`, and the result is clamped to
 * the grid range, so a bad value from a consumer can never propagate into
 * layout math as `NaN` or an out-of-range pixel offset.
 *
 * @param hhmm - Time string, e.g. "09:30".
 */
export function hhmmToMinutes(hhmm: string): number {
  const [rawH, rawM] = hhmm.trim().slice(0, 5).split(":");
  // Destructuring defaults only fire on `undefined`, so parse defensively:
  // Number("abc") is NaN, which would otherwise flow straight into CSS.
  const h = Number(rawH);
  const m = Number(rawM);
  const total =
    (Number.isFinite(h) ? h : 0) * 60 + (Number.isFinite(m) ? m : 0);
  if (!Number.isFinite(total)) return 0;
  return Math.max(
    CONSULTATION_GRID_START_MINUTES,
    Math.min(CONSULTATION_GRID_END_MINUTES, total)
  );
}

/**
 * Converts total minutes since midnight to an "HH:mm" string.
 * Capped at 24:00 (1440 minutes).
 * @param total - Minutes since midnight.
 */
export function minutesToHHmm(total: number): string {
  const capped = Math.min(total, 24 * 60);
  const h = Math.floor(capped / 60);
  const m = capped % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * Snaps a minute value down to the nearest snap increment.
 * @param m - Minutes since midnight.
 * @param snap - Snap increment in minutes (e.g. 10, 30, 60).
 */
export function snapMinutesDown(
  m: number,
  snap: number,
  originMinutes: number = CONSULTATION_GRID_START_MINUTES
): number {
  const rel = m - originMinutes;
  const snapped = Math.floor(rel / snap) * snap;
  return originMinutes + snapped;
}

/**
 * Converts minutes since midnight into a vertical pixel offset from the top of
 * the grid.
 *
 * Deliberately proportional rather than snapped to a row index: slots supplied
 * by a consumer need not align to `snapMinutes` (a 09:15 start with a 30-minute
 * snap is perfectly ordinary), and rounding to the nearest row would render
 * them at the wrong time and the wrong height.
 *
 * @param minutes - Minutes since midnight.
 * @param snapMinutes - Snap increment, i.e. the number of minutes one row spans.
 * @param rowHeightPx - Height of a single row in pixels.
 */
export function minutesToOffsetPx(
  minutes: number,
  snapMinutes: number,
  rowHeightPx: number,
  gridStartMinutes: number = CONSULTATION_GRID_START_MINUTES
): number {
  return ((minutes - gridStartMinutes) / snapMinutes) * rowHeightPx;
}

/**
 * Formats minutes since midnight into a display string.
 * Note: 1440 (24*60) is rendered as "24:00" in 24h format to represent
 * end-of-day, since slots can span until midnight.
 * @param minutes - Minutes since midnight.
 * @param timeFormat - Display format: "12" for 12-hour, "24" for 24-hour.
 */
export function formatClock(
  minutes: number,
  timeFormat: "12" | "24"
): { primary: string } {
  if (minutes >= 24 * 60) {
    if (timeFormat === "24") {
      return { primary: "24:00" };
    }
    return { primary: "12:00 AM" };
  }
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (timeFormat === "24") {
    return {
      primary: `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`,
    };
  }
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return {
    primary: `${hour12}:${String(m).padStart(2, "0")} ${period}`,
  };
}

/**
 * A Sunday, used as the anchor for weekday-name lookups.
 * Constructed from local date parts so day arithmetic stays calendar-based.
 */
const WEEKDAY_ANCHOR_SUNDAY = { year: 2024, month: 0, day: 7 } as const;

/** Cache of Intl formatters — constructing one per call is measurably slow. */
const dayNameFormatters = new Map<string, Intl.DateTimeFormat>();
const clockFormatters = new Map<string, Intl.DateTimeFormat>();

/**
 * Returns a locale-aware weekday name.
 *
 * The date is built by adding to the *day component* rather than by adding
 * milliseconds: a raw 24h offset crosses DST boundaries incorrectly in zones
 * that shift during the anchor week, which would yield the wrong weekday.
 *
 * @param dayOfWeek - Day of week (0 = Sunday).
 * @param locale - BCP 47 language tag, e.g. "de-DE".
 * @param format - "short" (e.g. "Sun") or "long" (e.g. "Sunday").
 */
export function getIntlDayName(
  dayOfWeek: DayOfWeek,
  locale: string,
  format: "short" | "long" = "short"
): string {
  const key = `${locale}\u0000${format}`;
  let fmt = dayNameFormatters.get(key);
  if (!fmt) {
    fmt = new Intl.DateTimeFormat(locale, { weekday: format });
    dayNameFormatters.set(key, fmt);
  }
  const { year, month, day } = WEEKDAY_ANCHOR_SUNDAY;
  return fmt.format(new Date(year, month, day + dayOfWeek));
}

/**
 * Locale-aware variant of {@link formatClock}.
 *
 * For 24-hour display it pins `hourCycle: "h23"` rather than `hour12: false`,
 * because some locales render midnight as "24:00" under the latter.
 *
 * @param minutes - Minutes since midnight.
 * @param timeFormat - "12" or "24".
 * @param locale - BCP 47 language tag.
 */
export function formatClockIntl(
  minutes: number,
  timeFormat: "12" | "24",
  locale: string
): { primary: string } {
  // End-of-day is a grid convention, not a clock reading — keep it verbatim so
  // it matches the non-Intl path.
  if (minutes >= CONSULTATION_GRID_END_MINUTES) {
    return formatClock(minutes, timeFormat);
  }

  const key = `${locale}\u0000${timeFormat}`;
  let fmt = clockFormatters.get(key);
  if (!fmt) {
    fmt = new Intl.DateTimeFormat(
      locale,
      timeFormat === "12"
        ? { hour: "numeric", minute: "2-digit", hour12: true }
        : { hour: "2-digit", minute: "2-digit", hourCycle: "h23" }
    );
    clockFormatters.set(key, fmt);
  }

  const { year, month, day } = WEEKDAY_ANCHOR_SUNDAY;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return { primary: fmt.format(new Date(year, month, day, h, m)) };
}

/**
 * Formats a duration in minutes as a human-readable hours label (e.g. "1.5h").
 * @param durationMinutes - Duration in minutes.
 */
export function formatDurationLabel(durationMinutes: number): string {
  const hours = durationMinutes / 60;
  const rounded = Math.round(hours * 10) / 10;
  return `${rounded}h`;
}

/**
 * Returns every day in the inclusive span between two days, in display order.
 *
 * Works in `orderedDays` index space rather than raw day numbers, so a week
 * starting on Monday spans Fri->Sun as three columns rather than wrapping.
 * Handles dragging in either direction.
 *
 * @param startDay - Day the gesture began on.
 * @param endDay - Day the pointer is currently over.
 * @param orderedDays - Days in display order.
 */
export function daysBetween(
  startDay: DayOfWeek,
  endDay: DayOfWeek,
  orderedDays: DayOfWeek[]
): DayOfWeek[] {
  const a = orderedDays.indexOf(startDay);
  const b = orderedDays.indexOf(endDay);
  // A day outside the ordered set would otherwise slice from -1.
  if (a === -1 || b === -1) return a === -1 ? [] : [startDay];
  return orderedDays.slice(Math.min(a, b), Math.max(a, b) + 1);
}

/**
 * Checks whether two time ranges overlap.
 * @param a - First range with `start` and `end` in minutes.
 * @param b - Second range with `start` and `end` in minutes.
 */
export function overlaps(
  a: { start: number; end: number },
  b: { start: number; end: number }
): boolean {
  return a.start < b.end && b.start < a.end;
}

/**
 * Merges slots on the same day that touch or overlap into single slots.
 * Keeps the id of the earliest slot in each merged group.
 */
export function mergeAdjacentSlots(
  slots: AvailabilitySlot[]
): AvailabilitySlot[] {
  const byDay = new Map<DayOfWeek, AvailabilitySlot[]>();
  for (const s of slots) {
    let list = byDay.get(s.dayOfWeek);
    if (!list) {
      list = [];
      byDay.set(s.dayOfWeek, list);
    }
    list.push(s);
  }

  const result: AvailabilitySlot[] = [];
  for (const daySlots of byDay.values()) {
    daySlots.sort(
      (a, b) => hhmmToMinutes(a.startTime) - hhmmToMinutes(b.startTime)
    );
    let current = daySlots[0];
    let curStart = hhmmToMinutes(current.startTime);
    let curEnd = hhmmToMinutes(current.endTime);

    for (let i = 1; i < daySlots.length; i++) {
      const next = daySlots[i];
      const nextStart = hhmmToMinutes(next.startTime);
      const nextEnd = hhmmToMinutes(next.endTime);

      if (nextStart <= curEnd) {
        // Touching or overlapping — merge
        curEnd = Math.max(curEnd, nextEnd);
      } else {
        result.push({
          ...current,
          startTime: minutesToHHmm(curStart),
          endTime: minutesToHHmm(curEnd),
        });
        current = next;
        curStart = nextStart;
        curEnd = nextEnd;
      }
    }
    result.push({
      ...current,
      startTime: minutesToHHmm(curStart),
      endTime: minutesToHHmm(curEnd),
    });
  }
  return result;
}
