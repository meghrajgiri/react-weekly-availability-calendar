import { useCallback, useMemo } from "react";

import {
  DEFAULT_END_HOUR,
  DEFAULT_START_HOUR,
  ROW_HEIGHT_PX,
  getDayLabel,
  getOrderedDays,
  resolveHourRange,
} from "./constants";
import { getRowTopBorderClassName } from "./row-styles";
import { daysBetween, formatClock, formatClockIntl } from "./utils";
import { useAvailabilityCalendarPlacement } from "./use-placement";
import { useAvailabilityCalendarPointerHandlers } from "./use-pointer-handlers";
import { useAvailabilityCalendarKeyboard } from "./use-keyboard-handlers";
import { useConsultationGrid } from "./use-grid";

import type { AvailabilityCalendarProps, BlockedSlot } from "./types";

/**
 * Stable identity for the default `blockedSlots`. A `= []` default parameter
 * allocates a fresh array on every render, which invalidates every downstream
 * `useCallback`/`useMemo` that depends on it.
 */
const NO_BLOCKED_SLOTS: BlockedSlot[] = [];

/**
 * Core orchestration hook for the availability calendar.
 * Composes grid math, placement validation, pointer handlers,
 * and derived state (time labels, day labels, preview, ghost slot).
 * Returns the full model consumed by grid and ghost components.
 */
export function useAvailabilityCalendar({
  slots,
  onSlotsChange,
  blockedSlots = NO_BLOCKED_SLOTS,
  snapMinutes,
  timeFormat,
  readOnly = false,
  startDay = 0,
  dayLabelFormat = "short",
  gridLineStyle = "dashed",
  multiDayCreate = false,
  startHour = DEFAULT_START_HOUR,
  endHour = DEFAULT_END_HOUR,
  locale,
  classNames: userClassNames,
  renderSlot,
  renderBlockedSlot,
  onSlotClick,
}: AvailabilityCalendarProps) {
  const { startMinutes, endMinutes } = useMemo(
    () => resolveHourRange(startHour, endHour),
    [startHour, endHour]
  );

  const { totalRows, rowToMinutes, minutesToPx, clientYToRow } =
    useConsultationGrid(snapMinutes, startMinutes, endMinutes);

  const orderedDays = useMemo(() => getOrderedDays(startDay), [startDay]);

  const { slotsRef, canPlaceRef } = useAvailabilityCalendarPlacement({
    slots,
    blockedSlots,
    startMinutes,
    endMinutes,
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
    multiDayCreate,
    startMinutes,
    endMinutes,
    snapMinutes,
    totalRows,
    orderedDays,
    rowToMinutes,
    clientYToRow,
    onSlotsChange,
    onSlotClick,
    slotsRef,
    canPlaceRef,
  });

  const { handleSlotKeyDown, handleColumnKeyDown, announcement } =
    useAvailabilityCalendarKeyboard({
      readOnly,
      snapMinutes,
      bounds: { startMinutes, endMinutes },
      orderedDays,
      slots,
      blockedSlots,
      onSlotsChange,
      canPlaceRef,
    });

  const dayLabels = useMemo(
    () => orderedDays.map((d) => getDayLabel(d, dayLabelFormat, locale)),
    [orderedDays, dayLabelFormat, locale]
  );

  const removeSlot = (id: number | string) => {
    if (readOnly) return;
    const next = slots.filter((s) => s.id !== id);
    slotsRef.current = next;
    onSlotsChange(next);
  };

  const formatTime = useCallback(
    (minutes: number) =>
      locale
        ? formatClockIntl(minutes, timeFormat, locale).primary
        : formatClock(minutes, timeFormat).primary,
    [timeFormat, locale]
  );

  const timeLabels = useMemo(() => {
    const labels: (string | null)[] = [];
    for (let i = 0; i < totalRows; i++) {
      const m = rowToMinutes(i);
      const isHour = m % 60 === 0;
      labels.push(isHour ? formatTime(m) : null);
    }
    return labels;
  }, [totalRows, rowToMinutes, formatTime]);

  const rowTopBorderClass = useCallback(
    (rowIndex: number) =>
      getRowTopBorderClassName(
        rowIndex,
        snapMinutes,
        gridLineStyle,
        userClassNames?.hourLine,
        userClassNames?.subHourLine,
        startMinutes
      ),
    [
      snapMinutes,
      gridLineStyle,
      userClassNames?.hourLine,
      userClassNames?.subHourLine,
      startMinutes,
    ]
  );

  const createPreview =
    drag?.kind === "create"
      ? {
          // Every day the preview covers. Computed as an explicit list rather
          // than a truthiness check on the two endpoints: Sunday is 0, so
          // `startDay && currentDay` would silently collapse any span touching
          // Sunday back to a single day while the commit still created the
          // full range.
          days: daysBetween(drag.dayOfWeek, drag.currentDayOfWeek, orderedDays),
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
    formatTime,
    gridLineStyle,
    orderedDays,
    dayLabels,
    userClassNames,
    renderSlot,
    renderBlockedSlot,
    onSlotClick,
    slots,
    blockedSlots,
    drag,
    movePointerWorld,
    calendarContainerRef,
    calendarScrollRef,
    daysGridRef,
    totalRows,
    startMinutes,
    endMinutes,
    rowToMinutes,
    minutesToPx,
    timeLabels,
    rowTopBorderClass,
    createPreview,
    moveGhostSlot,
    handleGridPointerDown,
    handleResizePointerDown,
    handleSlotMovePointerDown,
    handleSlotKeyDown,
    handleColumnKeyDown,
    announcement,
    removeSlot,
  };
}

/** The full model returned by `useAvailabilityCalendar`, consumed by grid and ghost components. */
export type AvailabilityCalendarModel = ReturnType<
  typeof useAvailabilityCalendar
>;
