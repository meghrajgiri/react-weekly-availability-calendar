/** Props table shown on the docs site. Mirrors README.md. */
export interface PropRow {
  name: string;
  type: string;
  def?: string;
  required?: boolean;
  desc: string;
}

export const PROPS: PropRow[] = [
  {
    name: "slots",
    type: "AvailabilitySlot[]",
    required: true,
    desc: "Current availability slots.",
  },
  {
    name: "onSlotsChange",
    type: "(next) => void",
    required: true,
    desc: "Called when slots are created, moved, resized or removed.",
  },
  {
    name: "snapMinutes",
    type: "10 | 30 | 60",
    required: true,
    desc: "Grid snap increment.",
  },
  {
    name: "timeFormat",
    type: '"12" | "24"',
    required: true,
    desc: "Time display format.",
  },
  {
    name: "blockedSlots",
    type: "BlockedSlot[]",
    def: "[]",
    desc: "Non-interactive blocked ranges, drawn with a striped overlay.",
  },
  {
    name: "readOnly",
    type: "boolean",
    def: "false",
    desc: "Disable creating, moving, resizing and removing. onSlotClick still fires.",
  },
  {
    name: "startDay",
    type: "DayOfWeek",
    def: "0",
    desc: "Which day the week starts on. 0 is Sunday.",
  },
  {
    name: "dayLabelFormat",
    type: '"short" | "long" | fn',
    def: '"short"',
    desc: "Day header labels, or a function for full control.",
  },
  {
    name: "gridLineStyle",
    type: '"solid" | "dashed" | "dotted"',
    def: '"dashed"',
    desc: "Style of the sub-hour snap gridlines.",
  },
  {
    name: "theme",
    type: "CalendarTheme",
    def: "—",
    desc: "Colour overrides, applied as CSS custom properties.",
  },
  {
    name: "classNames",
    type: "CalendarClassNames",
    def: "—",
    desc: "Per-part class names. Handy with Tailwind.",
  },
  {
    name: "renderSlot",
    type: "(slot, info) => ReactNode",
    def: "—",
    desc: "Replace the contents of an availability slot.",
  },
  {
    name: "renderBlockedSlot",
    type: "(slot) => ReactNode",
    def: "—",
    desc: "Replace the contents of a blocked slot.",
  },
  {
    name: "onSlotClick",
    type: "(slot, event) => void",
    def: "—",
    desc: "Fires on click without drag, and on Enter or Space when focused.",
  },
  {
    name: "className",
    type: "string",
    def: "—",
    desc: "Class name for the root element.",
  },
  {
    name: "style",
    type: "CSSProperties",
    def: "—",
    desc: "Inline styles for the root element.",
  },
];
