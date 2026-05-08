import type { DayOfWeek, CalendarTheme } from "./types";
import { getIntlDayName } from "./utils";

/** Short day-of-week labels (e.g. "Sun", "Mon"). */
export const DAY_SHORT: Record<DayOfWeek, string> = {
  0: "Sun",
  1: "Mon",
  2: "Tue",
  3: "Wed",
  4: "Thu",
  5: "Fri",
  6: "Sat",
};

/** Full day-of-week labels (e.g. "Sunday", "Monday"). */
export const DAY_LONG: Record<DayOfWeek, string> = {
  0: "Sunday",
  1: "Monday",
  2: "Tuesday",
  3: "Wednesday",
  4: "Thursday",
  5: "Friday",
  6: "Saturday",
};

/**
 * Returns days of the week ordered starting from the given day.
 * @param startDay - The day to start the week on (0 = Sunday).
 */
export function getOrderedDays(startDay: DayOfWeek): DayOfWeek[] {
  return Array.from({ length: 7 }, (_, i) => ((startDay + i) % 7) as DayOfWeek);
}

/**
 * Returns the display label for a day, based on the chosen format.
 * Supports custom functions, built-in labels, or locale-aware Intl formatting.
 * @param day - Day of the week.
 * @param format - "short", "long", custom function, or undefined (uses locale)
 * @param locale - Optional BCP47 locale tag for Intl formatting
 */
export function getDayLabel(
  day: DayOfWeek,
  format?: "short" | "long" | ((d: DayOfWeek) => string),
  locale?: string,
): string {
  if (typeof format === "function") return format(day);
  if (locale && format !== "short" && format !== "long") {
    // Use Intl if locale is provided and format is not explicitly set
    return getIntlDayName(day, locale, "short");
  }
  if (locale && format === "long") {
    return getIntlDayName(day, locale, "long");
  }
  return format === "long" ? DAY_LONG[day] : DAY_SHORT[day];
}

/** Start of the calendar grid in minutes since midnight. */
export const CONSULTATION_GRID_START_MINUTES = 0;

/** End of the calendar grid in minutes since midnight (24:00 = 1440). */
export const CONSULTATION_GRID_END_MINUTES = 24 * 60;

/** Height of each grid row in pixels. */
export const ROW_HEIGHT_PX = 24;

/** Width ratio of the move ghost relative to the original slot. */
export const MOVE_GHOST_WIDTH_RATIO = 0.8;

/** Height of the calendar header row (day labels) in pixels. */
export const CALENDAR_HEADER_ROW_PX = 45;

/**
 * Dark theme preset for the calendar component.
 * Spread this into the `theme` prop to enable dark mode.
 *
 * @example
 * <AvailabilityCalendar theme={darkTheme} {...otherProps} />
 */
export const darkTheme: CalendarTheme = {
  calendarBackground: "#1f2937",
  borderColor: "#374151",
  headerBackground: "#111827",
  headerTextColor: "#f3f4f6",
  timeLabelColor: "#d1d5db",
  gridLineColor: "#374151",
  slotBackground: "#3b82f6",
  slotTextColor: "#f3f4f6",
  slotBorderColor: "#1e40af",
  blockedBackground: "#6b7280",
  blockedTextColor: "#f9fafb",
  blockedBorderColor: "#4b5563",
  blockedStripeColor: "#4b5563",
  previewBackground: "rgba(59, 130, 246, 0.3)",
  previewBorderColor: "#3b82f6",
};
