import { cn } from "./cn";
import { CONSULTATION_GRID_START_MINUTES } from "./constants";

/**
 * Returns the CSS class name(s) for a grid row's top border.
 * Hour lines get a solid style; sub-hour lines use the configured `gridLineStyle`.
 * @param rowIndex - Zero-based row index.
 * @param snapMinutes - Snap increment in minutes.
 * @param gridLineStyle - Style for sub-hour lines ("solid", "dashed", or "dotted").
 * @param hourLineClassName - Optional custom class for hour lines.
 * @param subHourLineClassName - Optional custom class for sub-hour lines.
 */
export function getRowTopBorderClassName(
  rowIndex: number,
  snapMinutes: number,
  gridLineStyle: "solid" | "dashed" | "dotted" = "dashed",
  hourLineClassName?: string,
  subHourLineClassName?: string
): string {
  const mins = CONSULTATION_GRID_START_MINUTES + rowIndex * snapMinutes;
  const isHourLine = mins % 60 === 0;
  return cn(
    "ac-row-border",
    rowIndex > 0 &&
      (isHourLine
        ? cn("ac-row-border--hour", hourLineClassName)
        : cn(
            `ac-row-border--sub ac-row-border--${gridLineStyle}`,
            subHourLineClassName
          ))
  );
}
