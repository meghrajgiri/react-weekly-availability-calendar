import type { AvailabilitySlot } from "./types";

/**
 * End-of-day interop.
 *
 * A slot that runs to midnight ends at `"24:00"`. That is deliberate and
 * matches ISO 8601, which allows hour 24 as the *end* of an interval: it is the
 * only representation that survives a round trip. `"00:00"` would parse back to
 * minute 0, making the end earlier than the start so the slot is rejected and
 * disappears; `"23:59"` silently loses a minute.
 *
 * Some stores reject hour 24 — SQL `TIME`, and most date parsers. Convert at
 * that boundary, where you know the string is an end time, and convert back on
 * the way in.
 */

const DAY_END = "24:00";
const MIDNIGHT = "00:00";

/**
 * Rewrites `"24:00"` end times to `"00:00"` for storage that rejects hour 24.
 *
 * Only the end time is touched, and only when it is exactly end-of-day.
 *
 * @example
 * await db.saveAvailability(toStorageSlots(slots));
 */
export function toStorageSlots<T extends AvailabilitySlot>(slots: T[]): T[] {
  return slots.map((s) =>
    s.endTime === DAY_END ? { ...s, endTime: MIDNIGHT } : s
  );
}

/**
 * Reverses {@link toStorageSlots}.
 *
 * A `"00:00"` end is only meaningful as end-of-day — a zero-length slot is not
 * representable — so it is unambiguous to restore.
 *
 * @example
 * const slots = fromStorageSlots(await db.loadAvailability());
 */
export function fromStorageSlots<T extends AvailabilitySlot>(slots: T[]): T[] {
  return slots.map((s) =>
    s.endTime === MIDNIGHT ? { ...s, endTime: DAY_END } : s
  );
}
