import { createPortal } from "react-dom";

import { cn } from "./cn";
import {
  CALENDAR_HEADER_ROW_PX,
  MOVE_GHOST_WIDTH_RATIO,
  ROW_HEIGHT_PX,
} from "./constants";
import {
  clampGhostToGridArea,
  formatClock,
  formatDurationLabel,
  hhmmToMinutes,
} from "./utils";

import type { AvailabilityCalendarModel } from "./use-availability-calendar";

/** Renders the floating ghost slot that follows the pointer during a move drag. Portaled to document.body. */
export function AvailabilityCalendarMoveGhost({
  model,
}: {
  model: AvailabilityCalendarModel;
}) {
  const {
    movePointerWorld,
    drag,
    moveGhostSlot,
    calendarScrollRef,
    daysGridRef,
    timeFormat,
    userClassNames: cx,
    renderSlot,
  } = model;

  if (
    !movePointerWorld ||
    drag?.kind !== "move" ||
    !moveGhostSlot ||
    typeof document === "undefined"
  ) {
    return null;
  }

  return createPortal(
    (() => {
      const sm = hhmmToMinutes(moveGhostSlot.startTime);
      const em = hhmmToMinutes(moveGhostSlot.endTime);
      const dur = em - sm;
      const startLbl = formatClock(sm, timeFormat).primary;
      const endLbl = formatClock(em, timeFormat).primary;
      const slotHeight = drag.heightPx;
      const isCompactSlot = slotHeight < ROW_HEIGHT_PX * 2;
      const durationLabel = formatDurationLabel(dur);
      const ghostWidthPx = drag.widthPx * MOVE_GHOST_WIDTH_RATIO;
      const ghostInsetX = (drag.widthPx - ghostWidthPx) / 2;
      const ghostGrabOffsetX = drag.grabOffsetX - ghostInsetX;
      const containerRect =
        calendarScrollRef.current?.getBoundingClientRect();
      const daysGridRect = daysGridRef.current?.getBoundingClientRect();
      const { left: ghostLeft, top: ghostTop } =
        containerRect && daysGridRect
          ? clampGhostToGridArea(
              movePointerWorld.x,
              movePointerWorld.y,
              ghostGrabOffsetX,
              drag.grabOffsetY,
              ghostWidthPx,
              drag.heightPx,
              containerRect,
              daysGridRect,
              CALENDAR_HEADER_ROW_PX
            )
          : {
              left: movePointerWorld.x - drag.grabOffsetX + ghostInsetX,
              top: movePointerWorld.y - drag.grabOffsetY,
            };

      const customContent = renderSlot
        ? renderSlot(moveGhostSlot, {
            startLabel: startLbl,
            endLabel: endLbl,
            durationLabel,
            isCompact: isCompactSlot,
          })
        : null;

      const defaultContent = isCompactSlot ? (
        <div className="ac-ghost-content-compact">
          <p>
            {startLbl} – {endLbl}{" "}
            <span className="ac-slot-duration">{durationLabel}</span>
          </p>
        </div>
      ) : (
        <>
          <div className="ac-ghost-top-row">
            <span className="ac-slot-time">{startLbl}</span>
          </div>
          <div className="ac-ghost-bottom-row">
            <span className="ac-slot-time">{endLbl}</span>
            <span className="ac-slot-duration">{durationLabel}</span>
          </div>
        </>
      );

      return (
        <div
          className={cn(
            "ac-move-ghost",
            isCompactSlot ? "ac-move-ghost--compact" : "ac-move-ghost--tall",
            cx?.moveGhost
          )}
          style={{
            left: ghostLeft,
            top: ghostTop,
            width: ghostWidthPx,
            height: drag.heightPx,
          }}
        >
          {customContent ?? defaultContent}
        </div>
      );
    })(),
    document.body
  );
}
