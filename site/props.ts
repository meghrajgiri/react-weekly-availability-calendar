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
    name: "startHour",
    type: "number",
    def: "0",
    desc: "First hour shown on the grid (0-23). Presentational only — slots outside stay in your data.",
  },
  {
    name: "endHour",
    type: "number",
    def: "24",
    desc: "Last hour shown on the grid (1-24, greater than startHour).",
  },
  {
    name: "locale",
    type: "string",
    def: "—",
    desc: "BCP 47 tag (e.g. de-DE) for day names and time labels, via Intl.",
  },
  {
    name: "multiDayCreate",
    type: "boolean",
    def: "false",
    desc: "Let one drag create the same range across several day columns.",
  },
  {
    name: "theme",
    type: "CalendarTheme",
    def: "—",
    desc: "Colour overrides. Pass the exported darkTheme preset for dark mode.",
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
