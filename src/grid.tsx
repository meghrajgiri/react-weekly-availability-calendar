import { XIcon } from "./icons";
import { cn } from "./cn";
import {
  CALENDAR_HEADER_ROW_PX,
  ROW_HEIGHT_PX,
} from "./constants";
import {
  formatClock,
  formatDurationLabel,
  hhmmToMinutes,
} from "./utils";

import type { DayOfWeek } from "./types";
import type { AvailabilityCalendarModel } from "./use-availability-calendar";

/** Renders the calendar grid: time column, day headers, slots, blocked slots, and gridlines. */
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
    rowTopBorderClass,
    timeLabels,
    createPreview,
    blockedSlots,
    minutesToRowIndex,
    slots,
    timeFormat,
    orderedDays,
    dayLabels,
    userClassNames: cx,
    renderSlot,
    renderBlockedSlot,
    onSlotClick,
    handleGridPointerDown,
    handleResizePointerDown,
    handleSlotMovePointerDown,
    removeSlot,
  } = model;

  return (
    <div
      ref={calendarContainerRef}
      role="grid"
      aria-label="Weekly availability calendar"
      className={cn(
        "ac-grid-container",
        !readOnly && drag?.kind === "move" && "ac-grid-container--grabbing",
        cx?.gridContainer
      )}
    >
      <div ref={calendarScrollRef} className="ac-grid-scroll">
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
            <div ref={daysGridRef} className="ac-days-grid" data-calendar-days-grid>
              {orderedDays.map((dayOfWeek: DayOfWeek, colIndex) => (
                <div key={dayOfWeek} className={cn("ac-day-column", cx?.dayColumn)}>
                  <div
                    data-day-column-body
                    aria-label={dayLabels[colIndex]}
                    className={cn(
                      "ac-day-body",
                      !readOnly &&
                        (drag?.kind === "move"
                          ? "ac-day-body--grabbing"
                          : "ac-day-body--crosshair"),
                      drag?.kind === "create" && "ac-day-body--touch-none"
                    )}
                    style={{ height: totalRows * ROW_HEIGHT_PX }}
                    onPointerDown={(e) => handleGridPointerDown(dayOfWeek, e)}
                  >
                    {/* Row gridlines */}
                    {Array.from({ length: totalRows }).map((_, i) => (
                      <div
                        key={i}
                        className={rowTopBorderClass(i)}
                        style={{
                          top: i * ROW_HEIGHT_PX,
                          height: 0,
                        }}
                      />
                    ))}

                    {/* Create preview */}
                    {createPreview &&
                      createPreview.dayOfWeek === dayOfWeek && (
                        <div
                          className={cn("ac-create-preview", cx?.createPreview)}
                          style={{
                            top: createPreview.top,
                            height: createPreview.height,
                          }}
                        />
                      )}

                    {/* Blocked slots */}
                    {blockedSlots
                      .filter((b) => b.dayOfWeek === dayOfWeek)
                      .map((b) => {
                        const sm = hhmmToMinutes(b.startTime);
                        const em = hhmmToMinutes(b.endTime);
                        const top = minutesToRowIndex(sm) * ROW_HEIGHT_PX;
                        const h =
                          (minutesToRowIndex(em) - minutesToRowIndex(sm)) *
                          ROW_HEIGHT_PX;
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
                            key={`${b.label}-${sm}`}
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
                        const top = minutesToRowIndex(sm) * ROW_HEIGHT_PX;
                        const h =
                          (minutesToRowIndex(em) - minutesToRowIndex(sm)) *
                          ROW_HEIGHT_PX;
                        const dur = em - sm;
                        const startLbl = formatClock(sm, timeFormat).primary;
                        const endLbl = formatClock(em, timeFormat).primary;
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
                            tabIndex={handleSlotKeyboardActivate ? 0 : undefined}
                            role={handleSlotKeyboardActivate ? "button" : undefined}
                            aria-label={
                              handleSlotKeyboardActivate
                                ? `Slot ${startLbl} to ${endLbl} on ${dayLabels[colIndex]}`
                                : undefined
                            }
                            className={cn(
                              "ac-slot",
                              !readOnly && "ac-slot--interactive",
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
                            }}
                            onPointerDown={(e) =>
                              handleSlotMovePointerDown(s, e)
                            }
                            onKeyDown={handleSlotKeyboardActivate}
                          >
                            {!readOnly && (
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
                                  onPointerDown={(ev) =>
                                    ev.stopPropagation()
                                  }
                                  onClick={() => removeSlot(s.id)}
                                >
                                  <XIcon />
                                </button>
                                <div
                                  data-slot-resize="start"
                                  role="separator"
                                  aria-label="Resize slot start"
                                  className="ac-slot-resize ac-slot-resize--start"
                                  onPointerDown={(ev) =>
                                    handleResizePointerDown(s, "start", ev)
                                  }
                                />
                                <div
                                  data-slot-resize="end"
                                  role="separator"
                                  aria-label="Resize slot end"
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
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
