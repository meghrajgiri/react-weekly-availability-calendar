import { useCallback, useEffect, useRef, useState } from "react";

import type {
  AvailabilitySlot,
  DayOfWeek,
  CreateDrag,
  MoveDrag,
  ResizeDrag,
} from "./types";

import { ROW_HEIGHT_PX } from "./constants";
import { trackPointerGesture } from "./pointer-gesture";
import { useLatestRef } from "./use-latest-ref";
import {
  dayIndexFromClientX,
  daysBetween,
  hhmmToMinutes,
  mergeAdjacentSlots,
  minutesToHHmm,
  newTempAvailabilitySlotId,
  snapMinutesDown,
} from "./utils";

/** Pointer displacement below which a slot pointerdown→up is treated as a click. */
const CLICK_MOVEMENT_THRESHOLD_PX = 4;

/** Parameters for the pointer handlers hook. */
interface UseAvailabilityCalendarPointerHandlersParams {
  readOnly: boolean;
  multiDayCreate: boolean;
  /** Visible window, in minutes since midnight. */
  startMinutes: number;
  endMinutes: number;
  disabledDays: ReadonlySet<DayOfWeek>;
  minSlotMinutes: number;
  maxSlotMinutes: number;
  snapMinutes: 10 | 30 | 60;
  totalRows: number;
  orderedDays: DayOfWeek[];
  rowToMinutes: (rowIndex: number) => number;
  clientYToRow: (clientY: number, columnEl: HTMLElement) => number;
  /** Emits an edit along with the state it replaced, for the change delta. */
  emitChange: (previous: AvailabilitySlot[], next: AvailabilitySlot[]) => void;
  onSlotClick?: (
    slot: AvailabilitySlot,
    event: PointerEvent | KeyboardEvent
  ) => void;
  slotsRef: { current: AvailabilitySlot[] };
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
 * Hook that manages all pointer interactions: drag-to-create, resize, and move.
 * Handles pointer capture, touch scroll locking, and RAF-throttled ghost positioning.
 */
export function useAvailabilityCalendarPointerHandlers({
  readOnly,
  multiDayCreate,
  startMinutes,
  endMinutes,
  disabledDays,
  minSlotMinutes,
  maxSlotMinutes,
  snapMinutes,
  totalRows,
  orderedDays,
  rowToMinutes,
  clientYToRow,
  emitChange,
  onSlotClick,
  slotsRef,
  canPlaceRef,
}: UseAvailabilityCalendarPointerHandlersParams) {
  const [drag, setDrag] = useState<CreateDrag | ResizeDrag | MoveDrag | null>(
    null
  );

  const [movePointerWorld, setMovePointerWorld] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const moveGhostRafRef = useRef<number | null>(null);
  const movePendingPointerRef = useRef<{ x: number; y: number } | null>(null);

  const daysGridRef = useRef<HTMLDivElement | null>(null);
  const calendarContainerRef = useRef<HTMLDivElement | null>(null);
  const calendarScrollRef = useRef<HTMLDivElement | null>(null);

  // Keep the latest callback in a ref so we don't need to re-bind pointer
  // handlers every time the consumer passes a new `onSlotClick` identity.
  const onSlotClickRef = useLatestRef(onSlotClick);

  const lockCalendarTouchScroll = useCallback(() => {
    calendarScrollRef.current?.style.setProperty("touch-action", "none");
  }, []);

  const unlockCalendarTouchScroll = useCallback(() => {
    calendarScrollRef.current?.style.removeProperty("touch-action");
  }, []);

  const handleGridPointerDown = useCallback(
    (dayOfWeek: DayOfWeek, e: React.PointerEvent<HTMLDivElement>) => {
      if (readOnly) return;
      if (disabledDays.has(dayOfWeek)) return;
      if (e.pointerType === "mouse" && e.button !== 0) return;

      const rawTarget = e.target;
      if (!(rawTarget instanceof Element)) return;
      if (rawTarget.closest("[data-availability-block]")) return;

      e.preventDefault();

      const col = e.currentTarget;
      const pointerId = e.pointerId;
      const startRow = clientYToRow(e.clientY, col);

      lockCalendarTouchScroll();

      try {
        col.setPointerCapture(pointerId);
      } catch {}

      setDrag({
        kind: "create",
        dayOfWeek,
        currentDayOfWeek: dayOfWeek,
        startRow,
        currentRow: startRow,
        pointerId,
        columnEl: col,
      });

      let stopGesture = () => {};

      const endDrag = () => {
        stopGesture();
        unlockCalendarTouchScroll();
        try {
          col.releasePointerCapture(pointerId);
        } catch {}

        setDrag(null);
      };

      const onMove = (ev: PointerEvent) => {
        ev.preventDefault();
        const r = clientYToRow(ev.clientY, col);
        const grid = daysGridRef.current;
        const currentDay =
          multiDayCreate && grid
            ? dayIndexFromClientX(ev.clientX, grid, orderedDays)
            : dayOfWeek;
        setDrag((prev) =>
          prev &&
          prev.kind === "create" &&
          prev.pointerId === pointerId &&
          prev.dayOfWeek === dayOfWeek
            ? { ...prev, currentRow: r, currentDayOfWeek: currentDay }
            : prev
        );
      };

      const onUp = (ev: PointerEvent) => {
        const row = clientYToRow(ev.clientY, col);
        const low = Math.min(startRow, row);
        const high = Math.max(startRow, row);
        const startM = rowToMinutes(low);
        // Clamp the gesture into the allowed range instead of discarding it:
        // a flick shorter than the minimum grows, an over-long sweep trims.
        const rawEnd = Math.min(endMinutes, rowToMinutes(high + 1));
        const clamped = Math.min(
          Math.max(rawEnd - startM, minSlotMinutes),
          maxSlotMinutes
        );
        const endM = Math.min(endMinutes, startM + clamped);
        if (endM > startM) {
          const grid = daysGridRef.current;
          const endDay =
            multiDayCreate && grid
              ? dayIndexFromClientX(ev.clientX, grid, orderedDays)
              : dayOfWeek;
          // Single-day drags still resolve to exactly [dayOfWeek].
          const targetDays = daysBetween(dayOfWeek, endDay, orderedDays);

          const created: AvailabilitySlot[] = [];
          for (const day of targetDays) {
            // Skip days where the range collides; the rest still land, so a
            // multi-day sweep is not lost to one blocked column.
            if (!canPlaceRef.current(day, startM, endM)) continue;
            created.push({
              id: newTempAvailabilitySlotId(),
              dayOfWeek: day,
              startTime: minutesToHHmm(startM),
              endTime: minutesToHHmm(endM),
            });
          }

          if (created.length > 0) {
            const prev = slotsRef.current;
            const next = mergeAdjacentSlots([...prev, ...created]);
            slotsRef.current = next;
            emitChange(prev, next);
          }
        }
        endDrag();
      };

      stopGesture = trackPointerGesture(pointerId, { onMove, onEnd: onUp });
    },
    [
      readOnly,
      multiDayCreate,
      endMinutes,
      disabledDays,
      minSlotMinutes,
      maxSlotMinutes,
      clientYToRow,
      rowToMinutes,
      emitChange,
      lockCalendarTouchScroll,
      unlockCalendarTouchScroll,
      canPlaceRef,
      slotsRef,
      orderedDays,
      daysGridRef,
    ]
  );

  const handleResizePointerDown = useCallback(
    (slot: AvailabilitySlot, edge: "start" | "end", e: React.PointerEvent) => {
      if (readOnly) return;
      if (e.pointerType === "mouse" && e.button !== 0) return;
      e.stopPropagation();
      e.preventDefault();
      const col = (e.currentTarget as HTMLElement).closest(
        "[data-day-column-body]"
      ) as HTMLElement | null;
      if (!col) return;

      lockCalendarTouchScroll();

      const pointerId = e.pointerId;
      // Tracks whether the gesture actually changed anything, so a stray
      // press on a handle does not trigger a merge of untouched slots.
      let didResize = false;
      try {
        col.setPointerCapture(pointerId);
      } catch {}

      setDrag({
        kind: "resize",
        slotId: slot.id,
        edge,
        dayOfWeek: slot.dayOfWeek,
        pointerId,
        columnEl: col,
      });

      let stopGesture = () => {};

      const endResize = () => {
        stopGesture();
        unlockCalendarTouchScroll();
        try {
          col.releasePointerCapture(pointerId);
        } catch {}

        setDrag(null);
      };

      const onMove = (ev: PointerEvent) => {
        ev.preventDefault();
        const row = clientYToRow(ev.clientY, col);
        const prev = slotsRef.current;
        const current = prev.find((s) => s.id === slot.id);
        if (!current) return;
        let startM = hhmmToMinutes(current.startTime);
        let endM = hhmmToMinutes(current.endTime);

        if (edge === "start") {
          let newStart = snapMinutesDown(
            rowToMinutes(row),
            snapMinutes,
            startMinutes
          );
          newStart = Math.max(
            startMinutes,
            Math.min(newStart, endM - snapMinutes)
          );
          if (!canPlaceRef.current(slot.dayOfWeek, newStart, endM, slot.id)) {
            return;
          }
          startM = newStart;
        } else {
          // `rowToMinutes` already returns a multiple of `snapMinutes`, so no
          // further snapping is needed here.
          let newEnd = rowToMinutes(row + 1);
          newEnd = Math.min(endMinutes, newEnd);
          newEnd = Math.max(newEnd, startM + snapMinutes);
          newEnd = Math.min(endMinutes, newEnd);
          if (!canPlaceRef.current(slot.dayOfWeek, startM, newEnd, slot.id)) {
            return;
          }
          endM = newEnd;
        }

        // Deliberately NOT merged here. Merging mid-drag can fold this slot
        // into an adjacent one, and the merge keeps only the earliest slot's
        // id — so the id this gesture is tracking would disappear and every
        // subsequent pointermove would fail to find its subject, freezing the
        // drag. Merging happens once, on pointerup.
        const next = prev.map((s) =>
          s.id === slot.id
            ? {
                ...s,
                startTime: minutesToHHmm(startM),
                endTime: minutesToHHmm(endM),
              }
            : s
        );
        didResize = true;
        slotsRef.current = next;
        emitChange(prev, next);
      };

      const onUp = () => {
        if (didResize) {
          const beforeMerge = slotsRef.current;
          const merged = mergeAdjacentSlots(beforeMerge);
          slotsRef.current = merged;
          emitChange(beforeMerge, merged);
        }
        endResize();
      };

      stopGesture = trackPointerGesture(pointerId, { onMove, onEnd: onUp });
    },
    [
      readOnly,
      startMinutes,
      endMinutes,
      clientYToRow,
      rowToMinutes,
      snapMinutes,
      emitChange,
      lockCalendarTouchScroll,
      unlockCalendarTouchScroll,
      canPlaceRef,
      slotsRef,
    ]
  );

  const handleSlotMovePointerDown = useCallback(
    (slot: AvailabilitySlot, e: React.PointerEvent<HTMLDivElement>) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;

      if (readOnly) {
        // Read-only calendars still surface clicks so consumers can open
        // detail modals or inspect the slot. We use the same
        // pointerup + movement-threshold pattern as the drag path so a
        // touch-scroll over a slot on mobile does not accidentally fire
        // the handler.
        if (!onSlotClickRef.current) return;

        const pointerId = e.pointerId;
        const pointerDownClientX = e.clientX;
        const pointerDownClientY = e.clientY;
        let didMove = false;
        // Declared here because this branch returns before the drag path's own.
        let stopGesture = () => {};

        stopGesture = trackPointerGesture(pointerId, {
          onMove: (ev) => {
            if (didMove) return;
            const dx = ev.clientX - pointerDownClientX;
            const dy = ev.clientY - pointerDownClientY;
            if (dx * dx + dy * dy > CLICK_MOVEMENT_THRESHOLD_PX ** 2) {
              didMove = true;
            }
          },
          onEnd: (ev) => {
            stopGesture();
            if (!didMove && onSlotClickRef.current) {
              onSlotClickRef.current(slot, ev);
            }
          },
        });
        return;
      }

      const raw = e.target;
      if (!(raw instanceof Element)) return;
      if (raw.closest("button")) return;
      if (raw.closest("[data-slot-resize]")) return;

      e.preventDefault();
      e.stopPropagation();

      const col = (e.currentTarget as HTMLElement).closest(
        "[data-day-column-body]"
      ) as HTMLElement | null;
      if (!col) return;

      lockCalendarTouchScroll();

      const slotEl = e.currentTarget as HTMLElement;
      const slotRect = slotEl.getBoundingClientRect();
      const grabOffsetY = e.clientY - slotRect.top;
      const grabOffsetX = e.clientX - slotRect.left;

      const pointerId = e.pointerId;
      const initialStartM = hhmmToMinutes(slot.startTime);
      const initialEndM = hhmmToMinutes(slot.endTime);
      const pointerDownClientX = e.clientX;
      const pointerDownClientY = e.clientY;
      let didMove = false;

      try {
        col.setPointerCapture(pointerId);
      } catch {}

      movePendingPointerRef.current = { x: e.clientX, y: e.clientY };
      setMovePointerWorld({ x: e.clientX, y: e.clientY });

      setDrag({
        kind: "move",
        slotId: slot.id,
        dayOfWeek: slot.dayOfWeek,
        pointerId,
        columnEl: col,
        initialStartM,
        initialEndM,
        grabOffsetX,
        grabOffsetY,
        widthPx: slotRect.width,
        heightPx: slotRect.height,
      });

      // Scoped to this calendar's own grid: a document-wide query would also
      // restyle any other <AvailabilityCalendar> mounted on the page.
      const dayColumnEls = (): HTMLElement[] =>
        Array.from(
          daysGridRef.current?.querySelectorAll<HTMLElement>(
            "[data-day-column-body]"
          ) ?? []
        );

      const cal = calendarContainerRef.current;
      if (cal) cal.style.cursor = "grabbing";
      for (const el of dayColumnEls()) {
        el.style.cursor = "grabbing";
      }

      let stopGesture = () => {};

      const flushMoveGhostRaf = () => {
        if (moveGhostRafRef.current !== null) {
          cancelAnimationFrame(moveGhostRafRef.current);
          moveGhostRafRef.current = null;
        }
      };

      const endMove = () => {
        flushMoveGhostRaf();
        movePendingPointerRef.current = null;
        setMovePointerWorld(null);
        const calEl = calendarContainerRef.current;
        if (calEl) calEl.style.removeProperty("cursor");
        for (const el of dayColumnEls()) {
          el.style.removeProperty("cursor");
        }
        stopGesture();
        unlockCalendarTouchScroll();
        try {
          col.releasePointerCapture(pointerId);
        } catch {}

        setDrag(null);
      };

      const scheduleGhostPosition = (clientX: number, clientY: number) => {
        movePendingPointerRef.current = { x: clientX, y: clientY };
        if (moveGhostRafRef.current !== null) return;
        moveGhostRafRef.current = requestAnimationFrame(() => {
          moveGhostRafRef.current = null;
          const p = movePendingPointerRef.current;
          if (p) {
            setMovePointerWorld({ x: p.x, y: p.y });
          }
        });
      };

      const commitPlacement = (clientX: number, clientY: number) => {
        const grid = daysGridRef.current;
        if (!grid) return;

        const firstBody = grid.querySelector("[data-day-column-body]");
        if (!(firstBody instanceof HTMLElement)) return;

        const bodyTop = firstBody.getBoundingClientRect().top;
        const newDay = dayIndexFromClientX(clientX, grid, orderedDays);
        const dur = initialEndM - initialStartM;

        const desiredSlotTop = clientY - grabOffsetY;
        let row = Math.floor((desiredSlotTop - bodyTop) / ROW_HEIGHT_PX);
        row = Math.max(0, Math.min(totalRows - 1, row));

        const gridRange = endMinutes - startMinutes;
        const clampedDur = Math.min(dur, gridRange);

        let newStartM = rowToMinutes(row);
        let newEndM = newStartM + clampedDur;

        if (newEndM > endMinutes) {
          newEndM = endMinutes;
          newStartM = newEndM - clampedDur;
        }
        if (newStartM < startMinutes) {
          newStartM = startMinutes;
          newEndM = newStartM + clampedDur;
        }

        if (!canPlaceRef.current(newDay, newStartM, newEndM, slot.id)) {
          return;
        }

        const prev = slotsRef.current;
        const next = mergeAdjacentSlots(
          prev.map((s) =>
            s.id === slot.id
              ? {
                  ...s,
                  dayOfWeek: newDay,
                  startTime: minutesToHHmm(newStartM),
                  endTime: minutesToHHmm(newEndM),
                }
              : s
          )
        );
        slotsRef.current = next;
        emitChange(prev, next);
      };

      const onMove = (ev: PointerEvent) => {
        ev.preventDefault();
        if (!didMove) {
          const dx = ev.clientX - pointerDownClientX;
          const dy = ev.clientY - pointerDownClientY;
          if (dx * dx + dy * dy > CLICK_MOVEMENT_THRESHOLD_PX ** 2) {
            didMove = true;
          }
        }
        scheduleGhostPosition(ev.clientX, ev.clientY);
      };

      const onUp = (ev: PointerEvent) => {
        if (didMove) {
          const last = movePendingPointerRef.current;
          const cx = last?.x ?? ev.clientX;
          const cy = last?.y ?? ev.clientY;
          commitPlacement(cx, cy);
        } else if (onSlotClickRef.current) {
          // Pointer barely moved — treat as a click. Pass the native
          // pointerup event so consumers get the actual click coordinates
          // rather than the cached pointerdown event.
          onSlotClickRef.current(slot, ev);
        }
        endMove();
      };

      stopGesture = trackPointerGesture(pointerId, { onMove, onEnd: onUp });
    },
    [
      readOnly,
      startMinutes,
      endMinutes,
      emitChange,
      rowToMinutes,
      totalRows,
      orderedDays,
      lockCalendarTouchScroll,
      unlockCalendarTouchScroll,
      canPlaceRef,
      slotsRef,
      onSlotClickRef,
    ]
  );

  useEffect(() => {
    return () => {
      if (moveGhostRafRef.current !== null) {
        cancelAnimationFrame(moveGhostRafRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (drag === null) return;
    const blockScroll = (e: TouchEvent) => {
      e.preventDefault();
    };
    document.addEventListener("touchmove", blockScroll, { passive: false });
    return () => {
      document.removeEventListener("touchmove", blockScroll);
    };
  }, [drag]);

  return {
    drag,
    movePointerWorld,
    calendarContainerRef,
    calendarScrollRef,
    daysGridRef,
    handleGridPointerDown,
    handleResizePointerDown,
    handleSlotMovePointerDown,
  };
}
