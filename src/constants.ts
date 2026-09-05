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

/**
 * Start of the *day* in minutes since midnight.
 *
 * An absolute bound, not the visible window — see `startHour`. Time parsing and
 * clamping stay anchored here so a slot outside the visible range remains valid
 * data rather than being rewritten.
 */
export const DAY_START_MINUTES = 0;

/** End of the day in minutes since midnight (24:00 = 1440). Absolute, as above. */
export const DAY_END_MINUTES = 24 * 60;

/**
 * @deprecated Renamed to {@link DAY_START_MINUTES}. The old name referred to a
 * domain this package has nothing to do with. Kept as an alias; it will be
 * removed in a future major version.
 */
export const CONSULTATION_GRID_START_MINUTES = DAY_START_MINUTES;

/**
 * @deprecated Renamed to {@link DAY_END_MINUTES}. Kept as an alias; it will be
 * removed in a future major version.
 */
export const CONSULTATION_GRID_END_MINUTES = DAY_END_MINUTES;

/** Default visible range: the whole day. */
export const DEFAULT_START_HOUR = 0;
export const DEFAULT_END_HOUR = 24;

/**
 * Validates and normalises the visible hour range into minutes.
 *
 * Falls back to the full day if the range is inverted, out of bounds, or not
 * finite, and warns in development: silently rendering an empty or negative
 * grid would be far harder for a consumer to diagnose.
 */
export function resolveHourRange(
  startHour: number,
  endHour: number
): { startMinutes: number; endMinutes: number } {
  const valid =
    Number.isFinite(startHour) &&
    Number.isFinite(endHour) &&
    startHour >= 0 &&
    endHour <= 24 &&
    startHour < endHour;

  if (!valid) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        `[react-weekly-availability-calendar] Invalid hour range ` +
          `{ startHour: ${startHour}, endHour: ${endHour} }. ` +
          `Expected 0 <= startHour < endHour <= 24. Falling back to the full day.`
      );
    }
    return { startMinutes: DAY_START_MINUTES, endMinutes: DAY_END_MINUTES };
  }
  return { startMinutes: startHour * 60, endMinutes: endHour * 60 };
}

/** Height of each grid row in pixels. */
export const ROW_HEIGHT_PX = 24;

/** Width ratio of the move ghost relative to the original slot. */
export const MOVE_GHOST_WIDTH_RATIO = 0.8;

/** Height of the calendar header row (day labels) in pixels. */
export const CALENDAR_HEADER_ROW_PX = 45;
