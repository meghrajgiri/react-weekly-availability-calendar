import { useCallback, useState } from "react";

import {
  describeSlot,
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
  /** Formats a time for announcements, matching what is shown on screen. */
  formatTime: (minutes: number) => string;
  /** Resolves a day's display label, honouring `dayLabelFormat` and `locale`. */
  formatDayLabel: (day: DayOfWeek) => string;
  slots: AvailabilitySlot[];
  blockedSlots: BlockedSlot[];
  emitChange: (previous: AvailabilitySlot[], next: AvailabilitySlot[]) => void;
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
  formatTime,
  formatDayLabel,
  slots,
  blockedSlots,
  emitChange,
  canPlaceRef,
}: UseKeyboardHandlersParams) {
  // Announced politely so a screen reader reports the result of each edit;
  // without it, keyboard changes are completely silent.
  //
  // The counter matters: setting the same string twice bails out of the
  // re-render, the DOM text never changes, and aria-live stays quiet. Holding
  // an arrow key against a blocked slot would then announce once and go silent,
  // which is indistinguishable from the app hanging. A zero-width space,
  // toggled on each message, keeps the text technically different without
  // being spoken.
  const [announced, setAnnounced] = useState({ text: "", n: 0 });
  const setAnnouncement = useCallback(
    (text: string) => setAnnounced((prev) => ({ text, n: prev.n + 1 })),
    []
  );
  const announcement = announced.text + (announced.n % 2 === 0 ? "" : "\u200B");

  /** Formats a range the way the calendar displays it, not as raw HH:mm. */
  const describeRange = useCallback(
    (startTime: string, endTime: string) =>
      `${formatTime(hhmmToMinutes(startTime))} to ${formatTime(
        hhmmToMinutes(endTime)
      )}`,
    [formatTime]
  );

  const commit = useCallback(
    (next: AvailabilitySlot[], message: string) => {
      emitChange(slots, mergeAdjacentSlots(next));
      setAnnouncement(message);
    },
    [emitChange, slots, setAnnouncement]
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
    [slots, canPlaceRef, commit, setAnnouncement]
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
              `Resized to ${describeRange(next.startTime, next.endTime)}`
            );
          } else {
            const next = shiftSlotTime(slot, dir * snapMinutes, bounds);
            if (!next) return true;
            applyToSlot(
              slot,
              next,
              `Moved to ${describeRange(next.startTime, next.endTime)}`
            );
          }
          return true;
        }
        case "ArrowLeft":
        case "ArrowRight": {
          const dir = e.key === "ArrowRight" ? 1 : -1;
          const day = shiftSlotDay(slot, dir, orderedDays);
          if (day === null) return true;
          applyToSlot(
            slot,
            { dayOfWeek: day },
            `Moved to ${formatDayLabel(day)}`
          );
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
    [
      readOnly,
      snapMinutes,
      bounds,
      minSlotMinutes,
      maxSlotMinutes,
      orderedDays,
      slots,
      applyToSlot,
      commit,
      describeRange,
      formatDayLabel,
    ]
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
        setAnnouncement(`${formatDayLabel(dayOfWeek)} is not available`);
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
        setAnnouncement(`No free time on ${formatDayLabel(dayOfWeek)}`);
        return;
      }

      commit(
        [...slots, { id: newTempAvailabilitySlotId(), dayOfWeek, ...range }],
        `Slot added. ${describeSlot(
          formatDayLabel(dayOfWeek),
          formatTime(hhmmToMinutes(range.startTime)),
          formatTime(hhmmToMinutes(range.endTime))
        )}`
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
      setAnnouncement,
      formatTime,
      formatDayLabel,
    ]
  );

  return { handleSlotKeyDown, addSlotToDay, announcement };
}
