import { XIcon } from "./icons";
import { cn, slotColorVars } from "./cn";
import { CALENDAR_HEADER_ROW_PX, ROW_HEIGHT_PX } from "./constants";
import { formatDurationLabel, hhmmToMinutes } from "./utils";

import type { DayOfWeek } from "./types";
import type { AvailabilityCalendarModel } from "./use-availability-calendar";

/**
 * Renders the calendar grid: time column, day headers, slots, blocked slots,
 * and gridlines.
 *
 * Accessibility note: the root is a labelled `group`, not a `grid`. The ARIA
 * grid role requires `row`/`gridcell` descendants and two-dimensional
 * arrow-key navigation; announcing a grid while offering nothing navigable is
 * worse for screen-reader users than announcing a plain labelled group. Slots
 * expose `role="button"` individually when `onSlotClick` makes them
 * activatable. Full grid semantics arrive with keyboard navigation.
 */
export function AvailabilityCalendarGrid({
  model,
}: {
  model: AvailabilityCalendarModel;
}) {
  const {
    calendarContainerRef,
    calendarScrollRef,
    daysGridRef,
    readOnly,
    drag,
    totalRows,
    disabledDays,
    startMinutes,
    endMinutes,
    rowTopBorderClass,
    timeLabels,
    createPreview,
    blockedSlots,
    minutesToPx,
    slots,
    formatTime,
    orderedDays,
    dayLabels,
    userClassNames: cx,
    renderSlot,
    renderBlockedSlot,
    onSlotClick,
    handleGridPointerDown,
    handleResizePointerDown,
    handleSlotMovePointerDown,
    handleSlotKeyDown,
    addSlotToDay,
    announcement,
    removeSlot,
  } = model;

  return (
    <div
      ref={calendarContainerRef}
      // Not role="grid": that requires row/gridcell descendants and arrow-key
      // navigation, which land with keyboard support. See the note above.
      role="group"
      aria-label="Weekly availability calendar"
      className={cn(
        "ac-grid-container",
        !readOnly && drag?.kind === "move" && "ac-grid-container--grabbing",
        cx?.gridContainer
      )}
    >
      <div className="ac-sr-only" role="status" aria-live="polite">
        {announcement}
      </div>
      <div
        ref={calendarScrollRef}
        className="ac-grid-scroll"
        // A scrollable region has to be focusable, or a keyboard user cannot
        // scroll to content that is out of view.
        tabIndex={0}
      >
        <div className="ac-grid-inner">
          {/* Time column */}
          <div className="ac-time-column">
            <div
              className="ac-time-header"
              style={{ height: CALENDAR_HEADER_ROW_PX }}
              aria-hidden
            />
            <div
              className="ac-time-body"
              style={{ height: totalRows * ROW_HEIGHT_PX }}
            >
              {timeLabels.map((label, i) =>
                label ? (
                  <div
                    key={`time-label-${i}`}
                    className={cn("ac-time-label", cx?.timeLabel)}
                    style={{
                      top: i * ROW_HEIGHT_PX,
                      height: ROW_HEIGHT_PX,
                    }}
                  >
                    <span>{label}</span>
                  </div>
                ) : null
              )}
            </div>
          </div>

          {/* Days area */}
          <div className="ac-days-area">
            {/* Header */}
            <div className={cn("ac-days-header", cx?.header)}>
              <div className="ac-days-grid">
                {dayLabels.map((label, i) => (
                  <div
                    key={orderedDays[i]}
                    className={cn("ac-day-header-cell", cx?.headerCell)}
                    style={{ height: CALENDAR_HEADER_ROW_PX }}
                  >
                    {label}
                  </div>
                ))}
              </div>
            </div>

            {/* Body grid */}
            <div
              ref={daysGridRef}
              className="ac-days-grid"
              data-calendar-days-grid
            >
              {/*
                Gridlines are horizontal and identical in every column, so they
                are drawn once across the whole grid rather than repeated per
                column — 7x fewer nodes, and 1008 of them at a ten-minute snap.
                Painted beneath the columns so their vertical borders still sit
                on top, which keeps the rendering identical.
              */}
              <div
                className="ac-gridlines"
                aria-hidden
                style={{ height: totalRows * ROW_HEIGHT_PX }}
              >
                {Array.from({ length: totalRows }).map((_, i) => (
                  <div
                    key={i}
                    className={rowTopBorderClass(i)}
                    style={{ top: i * ROW_HEIGHT_PX, height: 0 }}
                  />
                ))}
              </div>
              {orderedDays.map((dayOfWeek: DayOfWeek, colIndex) => {
                const dayDisabled = disabledDays.has(dayOfWeek);
                // A disabled day is inert: nothing can be created, moved,
                // resized or removed there, though existing slots still show.
                const inert = readOnly || dayDisabled;
                return (
                  <div
                    key={dayOfWeek}
                    className={cn("ac-day-column", cx?.dayColumn)}
                  >
                    <div
                      data-day-column-body
                      // A labelled group, deliberately not a control. It contains
                      // the slot buttons, and nesting interactive elements
                      // confuses screen readers and keyboard focus. Creation is
                      // handled by the sibling button below.
                      role="group"
                      aria-label={
                        dayDisabled
                          ? `${dayLabels[colIndex]}, unavailable`
                          : dayLabels[colIndex]
                      }
                      aria-disabled={dayDisabled || undefined}
                      className={cn(
                        "ac-day-body",
                        dayDisabled && "ac-day-body--disabled",
                        !inert &&
                          (drag?.kind === "move"
                            ? "ac-day-body--grabbing"
                            : "ac-day-body--crosshair"),
                        drag?.kind === "create" && "ac-day-body--touch-none"
                      )}
                      style={{ height: totalRows * ROW_HEIGHT_PX }}
                      onPointerDown={(e) => handleGridPointerDown(dayOfWeek, e)}
                    >
                      {!inert && (
                        <button
                          type="button"
                          data-add-slot
                          className="ac-add-slot"
                          // Hidden until focused, so it is available to keyboard
                          // users without adding visual noise for everyone else.
                          onClick={() => addSlotToDay(dayOfWeek)}
                          onPointerDown={(e) => e.stopPropagation()}
                        >
                          {`Add availability to ${dayLabels[colIndex]}`}
                        </button>
                      )}
                      {/* Create preview */}
                      {createPreview &&
                        createPreview.days.includes(dayOfWeek) && (
                          <div
                            className={cn(
                              "ac-create-preview",
                              cx?.createPreview
                            )}
                            style={{
                              top: createPreview.top,
                              height: createPreview.height,
                            }}
                          />
                        )}

                      {/* Blocked slots */}
                      {blockedSlots
                        .filter((b) => b.dayOfWeek === dayOfWeek)
                        .map((b, blockedIndex) => {
                          // Clip to the visible window rather than letting the
                          // block spill outside it. Data is never modified — a
                          // slot outside the range is simply not drawn.
                          const sm = Math.max(
                            startMinutes,
                            hhmmToMinutes(b.startTime)
                          );
                          const em = Math.min(
                            endMinutes,
                            hhmmToMinutes(b.endTime)
                          );
                          if (em <= sm) return null;
                          const top = minutesToPx(sm);
                          const h = minutesToPx(em) - minutesToPx(sm);
                          if (h <= 0) return null;

                          const defaultContent = (
                            <span
                              className={cn(
                                "ac-blocked-label",
                                h >= ROW_HEIGHT_PX * 2
                                  ? "ac-blocked-label--sm"
                                  : "ac-blocked-label--xs"
                              )}
                            >
                              {b.label}
                            </span>
                          );

                          return (
                            <div
                              key={`blocked-${dayOfWeek}-${blockedIndex}`}
                              className={cn("ac-blocked-slot", cx?.blockedSlot)}
                              style={{
                                top,
                                height: Math.max(h, ROW_HEIGHT_PX),
                              }}
                            >
                              {renderBlockedSlot
                                ? renderBlockedSlot(b)
                                : defaultContent}
                            </div>
                          );
                        })}

                      {/* Availability slots */}
                      {slots
                        .filter((s) => s.dayOfWeek === dayOfWeek)
                        .map((s) => {
                          const sm = hhmmToMinutes(s.startTime);
                          const em = hhmmToMinutes(s.endTime);
                          // Geometry is clipped to the visible window; the labels
                          // below still report the slot's real times, so a
                          // partially visible slot never misstates its data.
                          const visibleStart = Math.max(startMinutes, sm);
                          const visibleEnd = Math.min(endMinutes, em);
                          if (visibleEnd <= visibleStart) return null;
                          const top = minutesToPx(visibleStart);
                          const h =
                            minutesToPx(visibleEnd) - minutesToPx(visibleStart);
                          const dur = em - sm;
                          const startLbl = formatTime(sm);
                          const endLbl = formatTime(em);
                          const slotHeight = Math.max(h, ROW_HEIGHT_PX);
                          const isCompactSlot = slotHeight < ROW_HEIGHT_PX * 2;
                          const durationLabel = formatDurationLabel(dur);

                          const defaultContent = isCompactSlot ? (
                            <div className="ac-slot-content-compact">
                              <p>
                                {startLbl} – {endLbl}{" "}
                                <span className="ac-slot-duration">
                                  {durationLabel}
                                </span>
                              </p>
                            </div>
                          ) : (
                            <>
                              <div className="ac-slot-top-row">
                                <span className="ac-slot-time">{startLbl}</span>
                              </div>
                              <div className="ac-slot-bottom-row">
                                <span className="ac-slot-time">{endLbl}</span>
                                <span className="ac-slot-duration">
                                  {durationLabel}
                                </span>
                              </div>
                            </>
                          );

                          const customContent = renderSlot
                            ? renderSlot(s, {
                                startLabel: startLbl,
                                endLabel: endLbl,
                                durationLabel,
                                isCompact: isCompactSlot,
                              })
                            : null;

                          const handleSlotKeyboardActivate = onSlotClick
                            ? (e: React.KeyboardEvent<HTMLDivElement>) => {
                                // Only fire when the slot itself is focused —
                                // Enter on the inner remove button must
                                // activate the button.
                                if (e.target !== e.currentTarget) return;
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  onSlotClick(s, e.nativeEvent);
                                }
                              }
                            : undefined;
                          return (
                            <div
                              key={String(s.id)}
                              data-availability-block
                              // Focusable whenever it can be acted on: edited,
                              // or activated via onSlotClick in readOnly mode.
                              tabIndex={
                                !inert || handleSlotKeyboardActivate
                                  ? 0
                                  : undefined
                              }
                              // An editable slot contains its own remove button,
                              // so it is a group of controls, not a control —
                              // nesting interactive elements confuses screen
                              // readers and keyboard focus. In readOnly mode
                              // there are no children to nest, so the more
                              // descriptive button role applies.
                              role={
                                inert
                                  ? handleSlotKeyboardActivate
                                    ? "button"
                                    : undefined
                                  : "group"
                              }
                              aria-label={
                                !inert || handleSlotKeyboardActivate
                                  ? `${dayLabels[colIndex]}, ${startLbl} to ${endLbl}.` +
                                    (inert
                                      ? ""
                                      : " Arrow keys move, Shift with arrows resizes, Delete removes.")
                                  : undefined
                              }
                              className={cn(
                                "ac-slot",
                                !inert && "ac-slot--interactive",
                                isCompactSlot
                                  ? "ac-slot--compact"
                                  : "ac-slot--tall",
                                drag?.kind === "move" &&
                                  drag.slotId === s.id &&
                                  "ac-slot--hidden",
                                cx?.slot
                              )}
                              style={{
                                top,
                                height: slotHeight,
                                ...slotColorVars(s.color),
                              }}
                              onPointerDown={(e) =>
                                handleSlotMovePointerDown(s, e)
                              }
                              onKeyDown={(e) => {
                                // Editing shortcuts win; activation only fires
                                // when nothing else claimed the key.
                                if (!inert && handleSlotKeyDown(s, e)) {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  return;
                                }
                                handleSlotKeyboardActivate?.(e);
                              }}
                            >
                              {!inert && (
                                <>
                                  <button
                                    type="button"
                                    className={cn(
                                      "ac-slot-remove-btn",
                                      isCompactSlot
                                        ? "ac-slot-remove-btn--compact"
                                        : "ac-slot-remove-btn--tall",
                                      cx?.slotRemoveButton
                                    )}
                                    aria-label="Remove slot"
                                    onPointerDown={(ev) => ev.stopPropagation()}
                                    onClick={() => removeSlot(s.id)}
                                  >
                                    <XIcon />
                                  </button>
                                  <div
                                    data-slot-resize="start"
                                    // Pointer-only until keyboard resize exists.
                                    aria-hidden
                                    className="ac-slot-resize ac-slot-resize--start"
                                    onPointerDown={(ev) =>
                                      handleResizePointerDown(s, "start", ev)
                                    }
                                  />
                                  <div
                                    data-slot-resize="end"
                                    aria-hidden
                                    className="ac-slot-resize ac-slot-resize--end"
                                    onPointerDown={(ev) =>
                                      handleResizePointerDown(s, "end", ev)
                                    }
                                  />
                                </>
                              )}
                              {customContent ?? defaultContent}
                            </div>
                          );
                        })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
