import { useCallback, useMemo } from "react";

import { ROW_HEIGHT_PX, getDayLabel, getOrderedDays } from "./constants";
import { getRowTopBorderClassName } from "./row-styles";
import { formatClock, formatClockIntl } from "./utils";
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
  locale,
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
    () => orderedDays.map((d) => getDayLabel(d, dayLabelFormat, locale)),
    [orderedDays, dayLabelFormat, locale],
  );

  const removeSlot = (id: number | string) => {
    if (readOnly) return;
    const next = slots.filter((s) => s.id !== id);
    slotsRef.current = next;
    onSlotsChange(next);
  };

  const timeLabels = useMemo(() => {
    const labels: (string | null)[] = [];
    const formatter = locale
      ? (m: number) => formatClockIntl(m, timeFormat, locale).primary
      : (m: number) => formatClock(m, timeFormat).primary;
    for (let i = 0; i < totalRows; i++) {
      const m = rowToMinutes(i);
      const isHour = m % 60 === 0;
      labels.push(isHour ? formatter(m) : null);
    }
    return labels;
  }, [totalRows, rowToMinutes, timeFormat, locale]);

  const rowTopBorderClass = useCallback(
    (rowIndex: number) =>
      getRowTopBorderClassName(
        rowIndex,
        snapMinutes,
        gridLineStyle,
        userClassNames?.hourLine,
        userClassNames?.subHourLine,
      ),
    [
      snapMinutes,
      gridLineStyle,
      userClassNames?.hourLine,
      userClassNames?.subHourLine,
    ],
  );

  const createPreview =
    drag?.kind === "create"
      ? {
          // Support both single-day and multi-day previews
          dayOfWeek: drag.dayOfWeek,
          daysRange:
            drag.startDayOfWeek && drag.currentDayOfWeek
              ? {
                  start: drag.startDayOfWeek,
                  end: drag.currentDayOfWeek,
                  orderedDays,
                }
              : undefined,
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
    locale,
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
