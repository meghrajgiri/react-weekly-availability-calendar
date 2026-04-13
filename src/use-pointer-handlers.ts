import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import type {
  AvailabilitySlot,
  DayOfWeek,
  CreateDrag,
  MoveDrag,
  ResizeDrag,
} from "./types";

import {
  CONSULTATION_GRID_END_MINUTES,
  CONSULTATION_GRID_START_MINUTES,
  ROW_HEIGHT_PX,
} from "./constants";
import {
  dayIndexFromClientX,
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
  snapMinutes: 10 | 30 | 60;
  totalRows: number;
  orderedDays: DayOfWeek[];
  rowToMinutes: (rowIndex: number) => number;
  clientYToRow: (clientY: number, columnEl: HTMLElement) => number;
  onSlotsChange: (next: AvailabilitySlot[]) => void;
  onSlotClick?: (slot: AvailabilitySlot, event: React.MouseEvent) => void;
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
  snapMinutes,
  totalRows,
  orderedDays,
  rowToMinutes,
  clientYToRow,
  onSlotsChange,
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
  const onSlotClickRef = useRef(onSlotClick);
  onSlotClickRef.current = onSlotClick;

  const lockCalendarTouchScroll = useCallback(() => {
    calendarScrollRef.current?.style.setProperty("touch-action", "none");
  }, []);

  const unlockCalendarTouchScroll = useCallback(() => {
    calendarScrollRef.current?.style.removeProperty("touch-action");
  }, []);

  const handleGridPointerDown = useCallback(
    (dayOfWeek: DayOfWeek, e: React.PointerEvent<HTMLDivElement>) => {
      if (readOnly) return;
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
        startRow,
        currentRow: startRow,
        pointerId,
        columnEl: col,
      });

      const ac = new AbortController();
      const { signal } = ac;

      const endDrag = () => {
        ac.abort();
        unlockCalendarTouchScroll();
        try {
          col.releasePointerCapture(pointerId);
        } catch {}

        setDrag(null);
      };

      const onMove = (ev: PointerEvent) => {
        if (ev.pointerId !== pointerId) return;
        ev.preventDefault();
        const r = clientYToRow(ev.clientY, col);
        setDrag((prev) =>
          prev &&
          prev.kind === "create" &&
          prev.pointerId === pointerId &&
          prev.dayOfWeek === dayOfWeek
            ? { ...prev, currentRow: r }
            : prev
        );
      };

      const onUp = (ev: PointerEvent) => {
        if (ev.pointerId !== pointerId) return;

        const row = clientYToRow(ev.clientY, col);
        const low = Math.min(startRow, row);
        const high = Math.max(startRow, row);
        const startM = rowToMinutes(low);
        const endM = Math.min(
          CONSULTATION_GRID_END_MINUTES,
          rowToMinutes(high + 1)
        );
        if (endM > startM && canPlaceRef.current(dayOfWeek, startM, endM)) {
          const prev = slotsRef.current;
          const next = mergeAdjacentSlots([
            ...prev,
            {
              id: newTempAvailabilitySlotId(),
              dayOfWeek,
              startTime: minutesToHHmm(startM),
              endTime: minutesToHHmm(endM),
            },
          ]);
          slotsRef.current = next;
          onSlotsChange(next);
        }
        endDrag();
      };

      const moveOpts: AddEventListenerOptions = {
        signal,
        capture: true,
        passive: false,
      };
      const endOpts: AddEventListenerOptions = { signal, capture: true };
      document.addEventListener("pointermove", onMove, moveOpts);
      document.addEventListener("pointerup", onUp, endOpts);
      document.addEventListener("pointercancel", onUp, endOpts);
    },
    [
      readOnly,
      clientYToRow,
      rowToMinutes,
      onSlotsChange,
      lockCalendarTouchScroll,
      unlockCalendarTouchScroll,
      canPlaceRef,
      slotsRef,
    ]
  );

  const handleResizePointerDown = useCallback(
    (
      slot: AvailabilitySlot,
      edge: "start" | "end",
      e: React.PointerEvent
    ) => {
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

      const ac = new AbortController();
      const { signal } = ac;

      const endResize = () => {
        ac.abort();
        unlockCalendarTouchScroll();
        try {
          col.releasePointerCapture(pointerId);
        } catch {}

        setDrag(null);
      };

      const onMove = (ev: PointerEvent) => {
        if (ev.pointerId !== pointerId) return;
        ev.preventDefault();
        const row = clientYToRow(ev.clientY, col);
        const prev = slotsRef.current;
        const current = prev.find((s) => s.id === slot.id);
        if (!current) return;
        let startM = hhmmToMinutes(current.startTime);
        let endM = hhmmToMinutes(current.endTime);

        if (edge === "start") {
          let newStart = snapMinutesDown(rowToMinutes(row), snapMinutes);
          newStart = Math.max(
            CONSULTATION_GRID_START_MINUTES,
            Math.min(newStart, endM - snapMinutes)
          );
          if (!canPlaceRef.current(slot.dayOfWeek, newStart, endM, slot.id)) {
            return;
          }
          startM = newStart;
        } else {
          let newEnd =
            snapMinutesDown(rowToMinutes(row + 1), snapMinutes) ||
            rowToMinutes(row + 1);
          newEnd = Math.min(CONSULTATION_GRID_END_MINUTES, newEnd);
          newEnd = Math.max(newEnd, startM + snapMinutes);
          newEnd = Math.min(CONSULTATION_GRID_END_MINUTES, newEnd);
          if (!canPlaceRef.current(slot.dayOfWeek, startM, newEnd, slot.id)) {
            return;
          }
          endM = newEnd;
        }

        const next = mergeAdjacentSlots(prev.map((s) =>
          s.id === slot.id
            ? {
                ...s,
                startTime: minutesToHHmm(startM),
                endTime: minutesToHHmm(endM),
              }
            : s
        ));
        slotsRef.current = next;
        onSlotsChange(next);
      };

      const onUp = (ev: PointerEvent) => {
        if (ev.pointerId !== pointerId) return;
        endResize();
      };

      const moveOpts: AddEventListenerOptions = {
        signal,
        capture: true,
        passive: false,
      };
      const endOpts: AddEventListenerOptions = { signal, capture: true };
      document.addEventListener("pointermove", onMove, moveOpts);
      document.addEventListener("pointerup", onUp, endOpts);
      document.addEventListener("pointercancel", onUp, endOpts);
    },
    [
      readOnly,
      clientYToRow,
      rowToMinutes,
      snapMinutes,
      onSlotsChange,
      lockCalendarTouchScroll,
      unlockCalendarTouchScroll,
      canPlaceRef,
      slotsRef,
    ]
  );

  const handleSlotMovePointerDown = useCallback(
    (
      slot: AvailabilitySlot,
      e: React.PointerEvent<HTMLDivElement>
    ) => {
      if (readOnly) {
        // Read-only calendars still surface clicks so consumers can open
        // details modals or inspect the slot.
        if (onSlotClickRef.current) {
          onSlotClickRef.current(slot, e as unknown as React.MouseEvent);
        }
        return;
      }
      if (e.pointerType === "mouse" && e.button !== 0) return;

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

      const cal = calendarContainerRef.current;
      if (cal) cal.style.cursor = "grabbing";
      for (const el of document.querySelectorAll("[data-day-column-body]")) {
        (el as HTMLElement).style.cursor = "grabbing";
      }

      const ac = new AbortController();
      const { signal } = ac;

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
        for (const el of document.querySelectorAll("[data-day-column-body]")) {
          (el as HTMLElement).style.removeProperty("cursor");
        }
        ac.abort();
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

        const gridRange =
          CONSULTATION_GRID_END_MINUTES - CONSULTATION_GRID_START_MINUTES;
        const clampedDur = Math.min(dur, gridRange);

        let newStartM = rowToMinutes(row);
        let newEndM = newStartM + clampedDur;

        if (newEndM > CONSULTATION_GRID_END_MINUTES) {
          newEndM = CONSULTATION_GRID_END_MINUTES;
          newStartM = newEndM - clampedDur;
        }
        if (newStartM < CONSULTATION_GRID_START_MINUTES) {
          newStartM = CONSULTATION_GRID_START_MINUTES;
          newEndM = newStartM + clampedDur;
        }

        if (!canPlaceRef.current(newDay, newStartM, newEndM, slot.id)) {
          return;
        }

        const prev = slotsRef.current;
        const next = mergeAdjacentSlots(prev.map((s) =>
          s.id === slot.id
            ? {
                ...s,
                dayOfWeek: newDay,
                startTime: minutesToHHmm(newStartM),
                endTime: minutesToHHmm(newEndM),
              }
            : s
        ));
        slotsRef.current = next;
        onSlotsChange(next);
      };

      const onMove = (ev: PointerEvent) => {
        if (ev.pointerId !== pointerId) return;
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
        if (ev.pointerId !== pointerId) return;
        if (didMove) {
          const last = movePendingPointerRef.current;
          const cx = last?.x ?? ev.clientX;
          const cy = last?.y ?? ev.clientY;
          commitPlacement(cx, cy);
        } else if (onSlotClickRef.current) {
          // Pointer barely moved — treat as a click.
          onSlotClickRef.current(slot, e as unknown as React.MouseEvent);
        }
        endMove();
      };

      const moveOpts: AddEventListenerOptions = {
        signal,
        capture: true,
        passive: false,
      };
      const endOpts: AddEventListenerOptions = { signal, capture: true };
      document.addEventListener("pointermove", onMove, moveOpts);
      document.addEventListener("pointerup", onUp, endOpts);
      document.addEventListener("pointercancel", onUp, endOpts);
    },
    [
      readOnly,
      onSlotsChange,
      rowToMinutes,
      totalRows,
      orderedDays,
      lockCalendarTouchScroll,
      unlockCalendarTouchScroll,
      canPlaceRef,
      slotsRef,
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
