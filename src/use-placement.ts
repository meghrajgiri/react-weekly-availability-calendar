import { useCallback, useRef } from "react";

import {
  CONSULTATION_GRID_END_MINUTES,
  CONSULTATION_GRID_START_MINUTES,
} from "./constants";
import { hhmmToMinutes, overlaps } from "./utils";

import type { AvailabilityCalendarProps } from "./types";

/**
 * Hook that manages slot placement validation.
 * Tracks current slots via a ref and provides a `canPlace` function
 * that checks for overlaps with existing slots and blocked slots.
 */
export function useAvailabilityCalendarPlacement({
  slots,
  blockedSlots = [],
}: Pick<AvailabilityCalendarProps, "slots" | "blockedSlots">) {
  const slotsRef = useRef(slots);
  slotsRef.current = slots;

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
    [blockedSlots]
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
      if (startM < CONSULTATION_GRID_START_MINUTES) return false;
      if (endM > CONSULTATION_GRID_END_MINUTES) return false;
      if (endM <= startM) return false;
      const candidate = { start: startM, end: endM };
      for (const o of availabilityForDay(day, excludeId)) {
        if (overlaps(candidate, o)) return false;
      }
      return true;
    },
    [availabilityForDay]
  );

  const canPlaceRef = useRef(canPlace);
  canPlaceRef.current = canPlace;

  return {
    slotsRef,
    canPlaceRef,
  };
}
