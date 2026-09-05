import { useCallback } from "react";

import { hhmmToMinutes, overlaps } from "./utils";
import { useLatestRef } from "./use-latest-ref";

import type {
  AvailabilityCalendarProps,
  BlockedSlot,
  DayOfWeek,
} from "./types";

/** Stable identity for the default `blockedSlots` — see use-availability-calendar. */
const NO_BLOCKED_SLOTS: BlockedSlot[] = [];

/**
 * Hook that manages slot placement validation.
 * Tracks current slots via a ref and provides a `canPlace` function
 * that checks for overlaps with existing slots and blocked slots.
 */
export function useAvailabilityCalendarPlacement({
  slots,
  blockedSlots = NO_BLOCKED_SLOTS,
  startMinutes,
  endMinutes,
  disabledDays,
  minSlotMinutes,
  maxSlotMinutes,
}: Pick<AvailabilityCalendarProps, "slots" | "blockedSlots"> & {
  startMinutes: number;
  endMinutes: number;
  disabledDays: ReadonlySet<DayOfWeek>;
  minSlotMinutes: number;
  maxSlotMinutes: number;
}) {
  // Updated in an effect, not during render: the pointer handlers also write to
  // this ref mid-drag, so a render that React discards must not be able to
  // clobber it with slots that were never committed.
  const slotsRef = useLatestRef(slots);

  /**
   * Returns all occupied time ranges for a given day,
   * optionally excluding a slot by ID (used during move/resize).
   */
  const availabilityForDay = useCallback(
    (day: number, excludeId?: number | string) => {
      const list: { start: number; end: number }[] = [];
      for (const s of slotsRef.current) {
        if (s.dayOfWeek !== day) continue;
        if (excludeId !== undefined && s.id === excludeId) continue;
        list.push({
          start: hhmmToMinutes(s.startTime),
          end: hhmmToMinutes(s.endTime),
        });
      }
      for (const b of blockedSlots) {
        if (b.dayOfWeek !== day) continue;
        list.push({
          start: hhmmToMinutes(b.startTime),
          end: hhmmToMinutes(b.endTime),
        });
      }
      return list;
    },
    [blockedSlots, slotsRef]
  );

  /**
   * Checks whether a slot can be placed at the given day and time range
   * without overlapping existing slots or blocked slots.
   */
  const canPlace = useCallback(
    (
      day: number,
      startM: number,
      endM: number,
      excludeId?: number | string
    ): boolean => {
      // Bounds are the *visible* window: a slot cannot be dragged outside it.
      if (startM < startMinutes) return false;
      if (endM > endMinutes) return false;
      if (endM <= startM) return false;
      // A disabled day accepts nothing at all.
      if (disabledDays.has(day as DayOfWeek)) return false;
      // Duration limits. Callers clamp before proposing, so reaching here
      // means the range genuinely cannot be made to fit.
      const duration = endM - startM;
      if (duration < minSlotMinutes) return false;
      if (duration > maxSlotMinutes) return false;
      const candidate = { start: startM, end: endM };
      for (const o of availabilityForDay(day, excludeId)) {
        if (overlaps(candidate, o)) return false;
      }
      return true;
    },
    [
      availabilityForDay,
      startMinutes,
      endMinutes,
      disabledDays,
      minSlotMinutes,
      maxSlotMinutes,
    ]
  );

  const canPlaceRef = useLatestRef(canPlace);

  return {
    slotsRef,
    canPlaceRef,
  };
}
