import { useCallback, useState } from "react";

import {
  findFreeRange,
  resizeSlotEnd,
  shiftSlotDay,
  shiftSlotTime,
} from "./keyboard";
import {
  hhmmToMinutes,
  mergeAdjacentSlots,
  newTempAvailabilitySlotId,
} from "./utils";

import type { GridBounds } from "./keyboard";
import type { AvailabilitySlot, BlockedSlot, DayOfWeek } from "./types";

/** Default length of a slot created from the keyboard, in minutes. */
const DEFAULT_NEW_SLOT_MINUTES = 60;

interface UseKeyboardHandlersParams {
  readOnly: boolean;
  snapMinutes: number;
  bounds: GridBounds;
  disabledDays: ReadonlySet<DayOfWeek>;
  minSlotMinutes: number;
  maxSlotMinutes: number;
  orderedDays: DayOfWeek[];
  slots: AvailabilitySlot[];
  blockedSlots: BlockedSlot[];
  onSlotsChange: (next: AvailabilitySlot[]) => void;
  canPlaceRef: {
    current: (
      day: number,
      startM: number,
      endM: number,
      excludeId?: number | string
    ) => boolean;
  };
}

/**
 * Keyboard operation of the calendar.
 *
 * Deliberately *not* an ARIA grid. That role requires row/gridcell descendants
 * covering the whole surface — over a thousand cells at a ten-minute snap — and
 * would leave a screen-reader user traversing all of them to reach a handful of
 * slots. WCAG 2.1.1 asks that every function be reachable by keyboard, not that
 * this particular role be used, so slots and columns are exposed as ordinary
 * labelled controls with explicit shortcuts.
 *
 * Slots: arrows move, Shift+arrows resize, Delete/Backspace removes.
 * Day columns: Enter or Space creates a slot at the earliest free time.
 */
export function useAvailabilityCalendarKeyboard({
  readOnly,
  snapMinutes,
  bounds,
  disabledDays,
  minSlotMinutes,
  maxSlotMinutes,
  orderedDays,
  slots,
  blockedSlots,
  onSlotsChange,
  canPlaceRef,
}: UseKeyboardHandlersParams) {
  // Announced politely so a screen reader reports the result of each edit;
  // without it, keyboard changes are completely silent.
  const [announcement, setAnnouncement] = useState("");

  const commit = useCallback(
    (next: AvailabilitySlot[], message: string) => {
      onSlotsChange(mergeAdjacentSlots(next));
      setAnnouncement(message);
    },
    [onSlotsChange]
  );

  /** Applies a proposed change to one slot, if it fits. */
  const applyToSlot = useCallback(
    (
      slot: AvailabilitySlot,
      patch: Partial<AvailabilitySlot>,
      message: string
    ) => {
      const candidate = { ...slot, ...patch };
      const start = hhmmToMinutes(candidate.startTime);
      const end = hhmmToMinutes(candidate.endTime);
      if (!canPlaceRef.current(candidate.dayOfWeek, start, end, slot.id)) {
        setAnnouncement("Blocked — no room there");
        return;
      }
      commit(
        slots.map((s) => (s.id === slot.id ? candidate : s)),
        message
      );
    },
    [slots, canPlaceRef, commit]
  );

  /**
   * Handles a keypress on a focused slot.
   * @returns whether the key was consumed, so the caller can preventDefault.
   */
  const handleSlotKeyDown = useCallback(
    (slot: AvailabilitySlot, e: React.KeyboardEvent): boolean => {
      if (readOnly) return false;

      switch (e.key) {
        case "ArrowUp":
        case "ArrowDown": {
          const dir = e.key === "ArrowDown" ? 1 : -1;
          if (e.shiftKey) {
            const next = resizeSlotEnd(slot, dir * snapMinutes, snapMinutes, {
              ...bounds,
              minSlotMinutes,
              maxSlotMinutes,
            });
            if (!next) return true;
            applyToSlot(
              slot,
              next,
              `Resized to ${next.startTime}–${next.endTime}`
            );
          } else {
            const next = shiftSlotTime(slot, dir * snapMinutes, bounds);
            if (!next) return true;
            applyToSlot(
              slot,
              next,
              `Moved to ${next.startTime}–${next.endTime}`
            );
          }
          return true;
        }
        case "ArrowLeft":
        case "ArrowRight": {
          const dir = e.key === "ArrowRight" ? 1 : -1;
          const day = shiftSlotDay(slot, dir, orderedDays);
          if (day === null) return true;
          applyToSlot(slot, { dayOfWeek: day }, `Moved to day ${day}`);
          return true;
        }
        case "Delete":
        case "Backspace": {
          commit(
            slots.filter((s) => s.id !== slot.id),
            "Slot removed"
          );
          return true;
        }
        default:
          return false;
      }
    },
    [readOnly, snapMinutes, bounds, orderedDays, slots, applyToSlot, commit]
  );

  /**
   * Adds a slot at the earliest free time on a day.
   *
   * Exposed as a plain action rather than a key handler because it is now
   * driven by a real button. The column itself must not be interactive: it
   * contains the slot buttons, and nesting interactive controls confuses
   * screen readers and keyboard focus.
   */
  const addSlotToDay = useCallback(
    (dayOfWeek: DayOfWeek): void => {
      if (readOnly) return;
      if (disabledDays.has(dayOfWeek)) {
        setAnnouncement("That day is not available");
        return;
      }

      const occupied = [
        ...slots.filter((s) => s.dayOfWeek === dayOfWeek),
        ...blockedSlots.filter((b) => b.dayOfWeek === dayOfWeek),
      ].map((s) => ({
        start: hhmmToMinutes(s.startTime),
        end: hhmmToMinutes(s.endTime),
      }));

      const duration = Math.min(
        Math.max(DEFAULT_NEW_SLOT_MINUTES, minSlotMinutes),
        maxSlotMinutes,
        bounds.endMinutes - bounds.startMinutes
      );
      const range = findFreeRange(duration, snapMinutes, bounds, occupied);
      if (!range) {
        setAnnouncement("No free time on that day");
        return;
      }

      commit(
        [...slots, { id: newTempAvailabilitySlotId(), dayOfWeek, ...range }],
        `Slot added, ${range.startTime} to ${range.endTime}`
      );
    },
    [
      readOnly,
      slots,
      blockedSlots,
      snapMinutes,
      bounds,
      disabledDays,
      minSlotMinutes,
      maxSlotMinutes,
      commit,
    ]
  );

  return { handleSlotKeyDown, addSlotToDay, announcement };
}
