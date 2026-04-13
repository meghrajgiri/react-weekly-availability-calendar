import type { CSSProperties, MouseEvent, ReactNode } from "react";

/** Days of the week: 0 = Sunday, 1 = Monday, ..., 6 = Saturday */
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface AvailabilitySlot {
  id: number | string;
  dayOfWeek: DayOfWeek;
  /** Start time in "HH:mm" format (24-hour) */
  startTime: string;
  /** End time in "HH:mm" format (24-hour) */
  endTime: string;
}

export interface BlockedSlot {
  dayOfWeek: DayOfWeek;
  /** Start time in "HH:mm" format (24-hour) */
  startTime: string;
  /** End time in "HH:mm" format (24-hour) */
  endTime: string;
  label: string;
}

/** Info passed to custom slot renderers */
export interface SlotRenderInfo {
  startLabel: string;
  endLabel: string;
  durationLabel: string;
  isCompact: boolean;
}

/** Theme object for visual customization */
export interface CalendarTheme {
  /** Background of the calendar body/grid */
  calendarBackground?: string;
  /** Border color for grid, cells, slots */
  borderColor?: string;

  /** Weekday header row background */
  headerBackground?: string;
  /** Weekday header text color */
  headerTextColor?: string;

  /** Time label text color (left column) */
  timeLabelColor?: string;

  /** Grid line color */
  gridLineColor?: string;

  /** Availability slot background */
  slotBackground?: string;
  /** Availability slot text color */
  slotTextColor?: string;
  /** Availability slot border color */
  slotBorderColor?: string;

  /** Blocked slot background (behind stripes) */
  blockedBackground?: string;
  /** Blocked slot text color */
  blockedTextColor?: string;
  /** Blocked slot border color */
  blockedBorderColor?: string;
  /** Blocked slot stripe color */
  blockedStripeColor?: string;

  /** Create-preview (drag-to-create) background */
  previewBackground?: string;
  /** Create-preview border color */
  previewBorderColor?: string;
}

/** Class name overrides for individual calendar parts */
export interface CalendarClassNames {
  /** Root wrapper */
  root?: string;
  /** Outer grid container (border, rounded) */
  gridContainer?: string;
  /** Weekday header row */
  header?: string;
  /** Individual weekday header cell */
  headerCell?: string;
  /** Time label text (left column) */
  timeLabel?: string;
  /** Individual day column */
  dayColumn?: string;
  /** Availability slot block */
  slot?: string;
  /** Slot remove (X) button */
  slotRemoveButton?: string;
  /** Blocked slot block */
  blockedSlot?: string;
  /** Drag-to-create preview */
  createPreview?: string;
  /** Move ghost (floating slot while dragging) */
  moveGhost?: string;
  /** Hour grid line */
  hourLine?: string;
  /** Sub-hour (snap) grid line */
  subHourLine?: string;
}

export interface AvailabilityCalendarProps {
  slots: AvailabilitySlot[];
  onSlotsChange: (next: AvailabilitySlot[]) => void;
  blockedSlots?: BlockedSlot[];
  snapMinutes: 10 | 30 | 60;
  timeFormat: "12" | "24";
  readOnly?: boolean;

  /** Which day starts the week (default: 0 = Sunday) */
  startDay?: DayOfWeek;
  /** Day label format: "short" = Sun, "long" = Sunday, or a custom function */
  dayLabelFormat?: "short" | "long" | ((day: DayOfWeek) => string);
  /** Style for snap-increment grid lines (default: "dashed") */
  gridLineStyle?: "solid" | "dashed" | "dotted";

  /** Theme overrides for colors */
  theme?: CalendarTheme;
  /** Class name overrides for individual parts (great for Tailwind) */
  classNames?: CalendarClassNames;

  /** Custom render for availability slot content. Return ReactNode to replace default UI. */
  renderSlot?: (slot: AvailabilitySlot, info: SlotRenderInfo) => ReactNode;
  /** Custom render for blocked slot content. Return ReactNode to replace default UI. */
  renderBlockedSlot?: (slot: BlockedSlot) => ReactNode;

  /**
   * Fired when a slot is clicked without being dragged.
   * Useful for opening detail modals or secondary actions.
   * Also fires in `readOnly` mode so consumers can still respond to clicks.
   */
  onSlotClick?: (slot: AvailabilitySlot, event: MouseEvent) => void;

  /** Additional CSS class name(s) for the root element */
  className?: string;
  /** Inline styles for the root element */
  style?: CSSProperties;
}

export type CreateDrag = {
  kind: "create";
  dayOfWeek: DayOfWeek;
  startRow: number;
  currentRow: number;
  pointerId: number;
  columnEl: HTMLElement;
};

export type ResizeDrag = {
  kind: "resize";
  slotId: number | string;
  edge: "start" | "end";
  dayOfWeek: DayOfWeek;
  pointerId: number;
  columnEl: HTMLElement;
};

export type MoveDrag = {
  kind: "move";
  slotId: number | string;
  dayOfWeek: DayOfWeek;
  pointerId: number;
  columnEl: HTMLElement;
  initialStartM: number;
  initialEndM: number;
  grabOffsetX: number;
  grabOffsetY: number;
  widthPx: number;
  heightPx: number;
};
