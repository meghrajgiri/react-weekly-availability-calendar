import type { CalendarTheme } from "./types";

/**
 * Dark theme preset.
 *
 * Spread or pass directly into the `theme` prop. Every value is a plain CSS
 * colour, so individual entries can be overridden by merging:
 *
 * @example
 * <AvailabilityCalendar theme={darkTheme} {...props} />
 *
 * @example
 * // Override one colour while keeping the rest of the preset.
 * <AvailabilityCalendar
 *   theme={{ ...darkTheme, slotBackground: "#a78bfa" }}
 *   {...props}
 * />
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
