import type { DayOfWeek } from "./types";
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
 * Returns the display label for a day.
 *
 * Resolution order: a custom function always wins; otherwise a `locale`
 * selects `Intl` weekday names at the requested width; otherwise the built-in
 * English tables are used.
 *
 * @param day - Day of the week.
 * @param format - "short", "long", or a custom function.
 * @param locale - Optional BCP 47 tag. Applies to both widths.
 */
export function getDayLabel(
  day: DayOfWeek,
  format: "short" | "long" | ((d: DayOfWeek) => string),
  locale?: string
): string {
  if (typeof format === "function") return format(day);
  if (locale) return getIntlDayName(day, locale, format);
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
