import { cn } from "./cn";
import { AvailabilityCalendarGrid } from "./grid";
import { injectStyles } from "./inject-styles";
import { AvailabilityCalendarMoveGhost } from "./move-ghost";
import { useAvailabilityCalendar } from "./use-availability-calendar";

import type { AvailabilityCalendarProps, CalendarTheme } from "./types";
import type { CSSProperties } from "react";

/** Converts a `CalendarTheme` object into CSS custom property overrides. */
function themeToVars(theme: CalendarTheme | undefined): CSSProperties {
  if (!theme) return {};
  const vars: Record<string, string> = {};

  if (theme.calendarBackground) {
    vars["--ac-card"] = theme.calendarBackground;
    vars["--ac-bg"] = theme.calendarBackground;
  }
  if (theme.borderColor) vars["--ac-border"] = theme.borderColor;

  if (theme.headerBackground) vars["--ac-header-bg"] = theme.headerBackground;
  if (theme.headerTextColor) vars["--ac-header-fg"] = theme.headerTextColor;

  if (theme.timeLabelColor) vars["--ac-time-label-fg"] = theme.timeLabelColor;

  if (theme.gridLineColor) vars["--ac-grid-line"] = theme.gridLineColor;

  if (theme.slotBackground) vars["--ac-accent"] = theme.slotBackground;
  if (theme.slotTextColor) vars["--ac-accent-fg"] = theme.slotTextColor;
  if (theme.slotBorderColor) vars["--ac-slot-border"] = theme.slotBorderColor;

  if (theme.blockedBackground)
    vars["--ac-blocked-bg"] = theme.blockedBackground;
  if (theme.blockedTextColor)
    vars["--ac-blocked-fg"] = theme.blockedTextColor;
  if (theme.blockedBorderColor)
    vars["--ac-blocked-border"] = theme.blockedBorderColor;
  if (theme.blockedStripeColor)
    vars["--ac-blocked-stripe"] = theme.blockedStripeColor;

  if (theme.previewBackground)
    vars["--ac-preview-bg"] = theme.previewBackground;
  if (theme.previewBorderColor)
    vars["--ac-preview-border"] = theme.previewBorderColor;

  return vars as CSSProperties;
}

/**
 * Weekly availability calendar component.
 * Renders an interactive 7-day time grid where users can create,
 * drag, resize, and remove availability slots.
 */
export function AvailabilityCalendar({
  className,
  style,
  theme,
  classNames: userClassNames,
  ...props
}: AvailabilityCalendarProps) {
  injectStyles();
  const model = useAvailabilityCalendar({ ...props, classNames: userClassNames });

  return (
    <div
      className={cn("ac-root", userClassNames?.root, className)}
      style={{ ...themeToVars(theme), ...style }}
    >
      <AvailabilityCalendarGrid model={model} />
      <AvailabilityCalendarMoveGhost model={model} />
    </div>
  );
}
