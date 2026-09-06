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
import { useCalendarGrid } from "./use-grid";

import type {
  AvailabilityCalendarProps,
  BlockedSlot,
  DayOfWeek,
} from "./types";

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
  disabledDays,
  minSlotMinutes,
  maxSlotMinutes,
  startHour = DEFAULT_START_HOUR,
  endHour = DEFAULT_END_HOUR,
  locale,
  classNames: userClassNames,
  renderSlot,
  renderBlockedSlot,
  onSlotClick,
}: AvailabilityCalendarProps) {
  // Stable identities so the placement callbacks are not rebuilt every render.
  const disabledDaySet = useMemo(
    () => new Set(disabledDays ?? []),
    [disabledDays]
  );
  // A slot can never be shorter than one row, whatever the caller asks for.
  const minDuration = Math.max(snapMinutes, minSlotMinutes ?? snapMinutes);
  const maxDuration = maxSlotMinutes ?? Number.POSITIVE_INFINITY;

  const { startMinutes, endMinutes } = useMemo(
    () => resolveHourRange(startHour, endHour),
    [startHour, endHour]
  );

  const { totalRows, rowToMinutes, minutesToPx, clientYToRow } =
    useCalendarGrid(snapMinutes, startMinutes, endMinutes);

  const orderedDays = useMemo(() => getOrderedDays(startDay), [startDay]);

  const { slotsRef, canPlaceRef } = useAvailabilityCalendarPlacement({
    slots,
    blockedSlots,
    startMinutes,
    endMinutes,
    disabledDays: disabledDaySet,
    minSlotMinutes: minDuration,
    maxSlotMinutes: maxDuration,
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
    disabledDays: disabledDaySet,
    minSlotMinutes: minDuration,
    maxSlotMinutes: maxDuration,
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

  const formatDayLabel = useCallback(
    (day: DayOfWeek) => getDayLabel(day, dayLabelFormat, locale),
    [dayLabelFormat, locale]
  );

  const dayLabels = useMemo(
    () => orderedDays.map(formatDayLabel),
    [orderedDays, formatDayLabel]
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

  const { handleSlotKeyDown, addSlotToDay, announcement } =
    useAvailabilityCalendarKeyboard({
      readOnly,
      snapMinutes,
      bounds: { startMinutes, endMinutes },
      disabledDays: disabledDaySet,
      minSlotMinutes: minDuration,
      maxSlotMinutes: maxDuration,
      orderedDays,
      formatTime,
      formatDayLabel,
      slots,
      blockedSlots,
      onSlotsChange,
      canPlaceRef,
    });

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

  // Memoised so the grid and ghost can be memoised in turn: an object
  // rebuilt every render defeats any comparison downstream.
  return useMemo(
    () => ({
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
      disabledDays: disabledDaySet,
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
      addSlotToDay,
      announcement,
      removeSlot,
    }),
    [
      addSlotToDay,
      announcement,
      blockedSlots,
      calendarContainerRef,
      calendarScrollRef,
      createPreview,
      dayLabels,
      daysGridRef,
      disabledDaySet,
      drag,
      endMinutes,
      formatTime,
      gridLineStyle,
      handleGridPointerDown,
      handleResizePointerDown,
      handleSlotKeyDown,
      handleSlotMovePointerDown,
      locale,
      minutesToPx,
      moveGhostSlot,
      movePointerWorld,
      onSlotClick,
      orderedDays,
      readOnly,
      removeSlot,
      renderBlockedSlot,
      renderSlot,
      rowToMinutes,
      rowTopBorderClass,
      slots,
      snapMinutes,
      startMinutes,
      timeFormat,
      timeLabels,
      totalRows,
      userClassNames,
    ]
  );
}

/** The full model returned by `useAvailabilityCalendar`, consumed by grid and ghost components. */
export type AvailabilityCalendarModel = ReturnType<
  typeof useAvailabilityCalendar
>;
