import { hhmmToMinutes, minutesToHHmm } from "./utils";

import type { AvailabilitySlot, DayOfWeek } from "./types";

/** The visible grid window, in minutes since midnight. */
export interface GridBounds {
  startMinutes: number;
  endMinutes: number;
}

/**
 * Shifts a slot earlier or later, keeping its duration.
 *
 * Clamps at the window edges rather than refusing to move, so holding an arrow
 * key parks the slot against the boundary instead of stopping short of it.
 * Returns `null` when the slot is already flush against that edge, which the
 * caller uses to avoid emitting a no-op change.
 */
export function shiftSlotTime(
  slot: AvailabilitySlot,
  deltaMinutes: number,
  bounds: GridBounds
): { startTime: string; endTime: string } | null {
  const start = hhmmToMinutes(slot.startTime);
  const end = hhmmToMinutes(slot.endTime);
  const duration = end - start;

  let nextStart = start + deltaMinutes;
  if (nextStart < bounds.startMinutes) nextStart = bounds.startMinutes;
  if (nextStart + duration > bounds.endMinutes) {
    nextStart = bounds.endMinutes - duration;
  }
  if (nextStart === start) return null;

  return {
    startTime: minutesToHHmm(nextStart),
    endTime: minutesToHHmm(nextStart + duration),
  };
}

/** Duration limits applied on top of the grid window. */
interface DurationLimits {
  minSlotMinutes?: number;
  maxSlotMinutes?: number;
}

/**
 * Grows or shrinks a slot from its end edge.
 *
 * Clamps to the configured duration limits and the grid window, never going
 * below one snap increment. Returns `null` when the edge is already at a limit,
 * so the caller can stay quiet rather than emitting a no-op change.
 */
export function resizeSlotEnd(
  slot: AvailabilitySlot,
  deltaMinutes: number,
  snapMinutes: number,
  bounds: GridBounds & DurationLimits
): { startTime: string; endTime: string } | null {
  const start = hhmmToMinutes(slot.startTime);
  const end = hhmmToMinutes(slot.endTime);

  const min = Math.max(snapMinutes, bounds.minSlotMinutes ?? snapMinutes);
  const max = bounds.maxSlotMinutes ?? Number.POSITIVE_INFINITY;

  let nextEnd = end + deltaMinutes;
  if (nextEnd < start + min) nextEnd = start + min;
  if (nextEnd > start + max) nextEnd = start + max;
  if (nextEnd > bounds.endMinutes) nextEnd = bounds.endMinutes;
  if (nextEnd === end) return null;

  return { startTime: slot.startTime, endTime: minutesToHHmm(nextEnd) };
}

/**
 * Moves a slot sideways by whole day columns, in display order.
 *
 * Works in `orderedDays` index space so a Monday-first week steps
 * Sunday -> Monday rather than wrapping through the middle of the week.
 * Stops at the first and last column instead of wrapping around.
 */
export function shiftSlotDay(
  slot: AvailabilitySlot,
  deltaColumns: number,
  orderedDays: DayOfWeek[]
): DayOfWeek | null {
  const current = orderedDays.indexOf(slot.dayOfWeek);
  if (current === -1) return null;
  const next = Math.max(
    0,
    Math.min(orderedDays.length - 1, current + deltaColumns)
  );
  if (next === current) return null;
  return orderedDays[next];
}

/**
 * Finds the earliest free range of `durationMinutes` on a day.
 *
 * Used by keyboard creation, which has no pointer position to work from and so
 * has to choose a sensible slot itself. Candidates are walked in snap
 * increments from the top of the window; returns `null` if the day is full.
 */
export function findFreeRange(
  durationMinutes: number,
  snapMinutes: number,
  bounds: GridBounds,
  occupied: { start: number; end: number }[]
): { startTime: string; endTime: string } | null {
  const sorted = [...occupied].sort((a, b) => a.start - b.start);
  for (
    let start = bounds.startMinutes;
    start + durationMinutes <= bounds.endMinutes;
    start += snapMinutes
  ) {
    const end = start + durationMinutes;
    const clashes = sorted.some((o) => start < o.end && o.start < end);
    if (!clashes) {
      return { startTime: minutesToHHmm(start), endTime: minutesToHHmm(end) };
    }
  }
  return null;
}

/** Human-readable summary of a slot, for the live region and aria-label. */
export function describeSlot(
  dayLabel: string,
  startLabel: string,
  endLabel: string
): string {
  return `${dayLabel}, ${startLabel} to ${endLabel}`;
}
