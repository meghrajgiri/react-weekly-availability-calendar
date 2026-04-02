import { useCallback, useMemo } from "react";

import { ROW_HEIGHT_PX, getDayLabel, getOrderedDays } from "./constants";
import { getRowTopBorderClassName } from "./row-styles";
import { formatClock } from "./utils";
import { useAvailabilityCalendarPlacement } from "./use-placement";
import { useAvailabilityCalendarPointerHandlers } from "./use-pointer-handlers";
import { useConsultationGrid } from "./use-grid";

import type { AvailabilityCalendarProps } from "./types";

/**
 * Core orchestration hook for the availability calendar.
 * Composes grid math, placement validation, pointer handlers,
 * and derived state (time labels, day labels, preview, ghost slot).
 * Returns the full model consumed by grid and ghost components.
 */
export function useAvailabilityCalendar({
  slots,
  onSlotsChange,
  blockedSlots = [],
  snapMinutes,
  timeFormat,
  readOnly = false,
  startDay = 0,
  dayLabelFormat = "short",
  gridLineStyle = "dashed",
  classNames: userClassNames,
  renderSlot,
  renderBlockedSlot,
}: AvailabilityCalendarProps) {
  const { totalRows, rowToMinutes, minutesToRowIndex, clientYToRow } =
    useConsultationGrid(snapMinutes);

  const orderedDays = useMemo(() => getOrderedDays(startDay), [startDay]);

  const { slotsRef, canPlaceRef } = useAvailabilityCalendarPlacement({
    slots,
    blockedSlots,
  });

  const {
    drag,
    movePointerWorld,
    calendarContainerRef,
    calendarScrollRef,
    daysGridRef,
    handleGridPointerDown,
    handleResizePointerDown,
    handleSlotMovePointerDown,
  } = useAvailabilityCalendarPointerHandlers({
    readOnly,
    snapMinutes,
    totalRows,
    orderedDays,
    rowToMinutes,
    clientYToRow,
    onSlotsChange,
    slotsRef,
    canPlaceRef,
  });

  const dayLabels = useMemo(
    () => orderedDays.map((d) => getDayLabel(d, dayLabelFormat)),
    [orderedDays, dayLabelFormat]
  );

  const removeSlot = (id: number | string) => {
    if (readOnly) return;
    const next = slots.filter((s) => s.id !== id);
    slotsRef.current = next;
    onSlotsChange(next);
  };

  const timeLabels = useMemo(() => {
    const labels: (string | null)[] = [];
    for (let i = 0; i < totalRows; i++) {
      const m = rowToMinutes(i);
      const isHour = m % 60 === 0;
      labels.push(isHour ? formatClock(m, timeFormat).primary : null);
    }
    return labels;
  }, [totalRows, rowToMinutes, timeFormat]);

  const rowTopBorderClass = useCallback(
    (rowIndex: number) =>
      getRowTopBorderClassName(
        rowIndex,
        snapMinutes,
        gridLineStyle,
        userClassNames?.hourLine,
        userClassNames?.subHourLine
      ),
    [snapMinutes, gridLineStyle, userClassNames?.hourLine, userClassNames?.subHourLine]
  );

  const createPreview =
    drag?.kind === "create"
      ? {
          dayOfWeek: drag.dayOfWeek,
          top: Math.min(drag.startRow, drag.currentRow) * ROW_HEIGHT_PX,
          height:
            (Math.abs(drag.currentRow - drag.startRow) + 1) * ROW_HEIGHT_PX,
        }
      : null;

  const moveGhostSlot =
    movePointerWorld && drag?.kind === "move"
      ? (slots.find((s) => s.id === drag.slotId) ?? null)
      : null;

  return {
    readOnly,
    snapMinutes,
    timeFormat,
    gridLineStyle,
    orderedDays,
    dayLabels,
    userClassNames,
    renderSlot,
    renderBlockedSlot,
    slots,
    blockedSlots,
    drag,
    movePointerWorld,
    calendarContainerRef,
    calendarScrollRef,
    daysGridRef,
    totalRows,
    rowToMinutes,
    minutesToRowIndex,
    timeLabels,
    rowTopBorderClass,
    createPreview,
    moveGhostSlot,
    handleGridPointerDown,
    handleResizePointerDown,
    handleSlotMovePointerDown,
    removeSlot,
  };
}

/** The full model returned by `useAvailabilityCalendar`, consumed by grid and ghost components. */
export type AvailabilityCalendarModel = ReturnType<
  typeof useAvailabilityCalendar
>;
