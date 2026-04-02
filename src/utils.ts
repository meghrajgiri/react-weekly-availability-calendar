import type { DayOfWeek } from "./types";
import { CONSULTATION_GRID_START_MINUTES } from "./constants";

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
  const gridBodyTop = daysGrid.top + headerRowPx;
  const minL = Math.max(container.left, daysGrid.left);
  const maxL = Math.min(container.right - widthPx, daysGrid.right - widthPx);
  const minT = Math.max(container.top, gridBodyTop);
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
 * @param hhmm - Time string, e.g. "09:30".
 */
export function hhmmToMinutes(hhmm: string): number {
  const [h = 0, m = 0] = hhmm.trim().slice(0, 5).split(":").map(Number);
  return h * 60 + m;
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
export function snapMinutesDown(m: number, snap: number): number {
  const rel = m - CONSULTATION_GRID_START_MINUTES;
  const snapped = Math.floor(rel / snap) * snap;
  return CONSULTATION_GRID_START_MINUTES + snapped;
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
 * Formats a duration in minutes as a human-readable hours label (e.g. "1.5h").
 * @param durationMinutes - Duration in minutes.
 */
export function formatDurationLabel(durationMinutes: number): string {
  const hours = durationMinutes / 60;
  const rounded = Math.round(hours * 10) / 10;
  return `${rounded}h`;
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
