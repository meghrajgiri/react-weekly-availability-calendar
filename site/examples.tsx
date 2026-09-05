import { useState } from "react";

import {
  AvailabilityCalendar,
  darkTheme,
  useAvailabilityHistory,
} from "../src";
import type { AvailabilitySlot, BlockedSlot } from "../src";

export const seedSlots: AvailabilitySlot[] = [
  { id: 1, dayOfWeek: 1, startTime: "09:00", endTime: "12:00" },
  { id: 2, dayOfWeek: 3, startTime: "14:00", endTime: "17:00" },
  { id: 3, dayOfWeek: 5, startTime: "10:00", endTime: "13:00" },
];

export const seedBlocked: BlockedSlot[] = [
  { dayOfWeek: 2, startTime: "12:00", endTime: "13:00", label: "Lunch" },
  { dayOfWeek: 4, startTime: "12:00", endTime: "13:00", label: "Lunch" },
];

const colouredSlots: AvailabilitySlot[] = [
  {
    id: 1,
    dayOfWeek: 1,
    startTime: "09:00",
    endTime: "12:00",
    color: "#f59e0b",
  },
  {
    id: 2,
    dayOfWeek: 3,
    startTime: "14:00",
    endTime: "17:00",
    color: "#10b981",
  },
  {
    id: 3,
    dayOfWeek: 5,
    startTime: "10:00",
    endTime: "13:00",
    color: "#ec4899",
  },
  { id: 4, dayOfWeek: 2, startTime: "15:00", endTime: "16:30" },
];

/** One entry per demo on the page. Adding a new one is a single object. */
export interface Example {
  id: string;
  title: string;
  blurb: string;
  code: string;
  render: (dark: boolean) => React.ReactNode;
}

function Basic({ dark }: { dark: boolean }) {
  const [slots, setSlots] = useState<AvailabilitySlot[]>(seedSlots);
  return (
    <AvailabilityCalendar
      slots={slots}
      onSlotsChange={setSlots}
      blockedSlots={seedBlocked}
      snapMinutes={30}
      timeFormat="12"
      theme={dark ? darkTheme : undefined}
    />
  );
}

function ReadOnly({ dark }: { dark: boolean }) {
  const [slots, setSlots] = useState<AvailabilitySlot[]>(seedSlots);
  return (
    <AvailabilityCalendar
      slots={slots}
      onSlotsChange={setSlots}
      blockedSlots={seedBlocked}
      snapMinutes={30}
      timeFormat="12"
      readOnly
      theme={dark ? darkTheme : undefined}
    />
  );
}

function Coloured({ dark }: { dark: boolean }) {
  const [slots, setSlots] = useState<AvailabilitySlot[]>(colouredSlots);
  return (
    <AvailabilityCalendar
      slots={slots}
      onSlotsChange={setSlots}
      blockedSlots={seedBlocked}
      snapMinutes={30}
      timeFormat="12"
      theme={dark ? darkTheme : undefined}
    />
  );
}

function Localised({ dark }: { dark: boolean }) {
  const [slots, setSlots] = useState<AvailabilitySlot[]>(seedSlots);
  return (
    <AvailabilityCalendar
      slots={slots}
      onSlotsChange={setSlots}
      blockedSlots={seedBlocked}
      snapMinutes={30}
      timeFormat="24"
      locale="de-DE"
      startDay={1}
      theme={dark ? darkTheme : undefined}
    />
  );
}

function MultiDay({ dark }: { dark: boolean }) {
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  return (
    <AvailabilityCalendar
      slots={slots}
      onSlotsChange={setSlots}
      blockedSlots={seedBlocked}
      snapMinutes={30}
      timeFormat="12"
      multiDayCreate
      theme={dark ? darkTheme : undefined}
    />
  );
}

function CustomRender({ dark }: { dark: boolean }) {
  const [slots, setSlots] = useState<AvailabilitySlot[]>(seedSlots);
  return (
    <AvailabilityCalendar
      slots={slots}
      onSlotsChange={setSlots}
      blockedSlots={seedBlocked}
      snapMinutes={30}
      timeFormat="24"
      startDay={1}
      dayLabelFormat="long"
      gridLineStyle="dotted"
      theme={dark ? darkTheme : undefined}
      renderSlot={(_slot, info) => (
        <div style={{ padding: "2px 4px", fontSize: 11 }}>
          <strong>
            {info.startLabel} – {info.endLabel}
          </strong>
          {!info.isCompact && (
            <>
              <br />
              <span style={{ opacity: 0.8 }}>{info.durationLabel}</span>
            </>
          )}
        </div>
      )}
      renderBlockedSlot={(slot) => (
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.5px",
            textTransform: "uppercase",
          }}
        >
          {slot.label}
        </span>
      )}
    />
  );
}

/** Examples that need controls above the calendar render their own wrapper. */
function ClickToInspect({ dark }: { dark: boolean }) {
  const [slots, setSlots] = useState<AvailabilitySlot[]>(seedSlots);
  const [last, setLast] = useState<AvailabilitySlot | null>(null);
  return (
    <>
      <div className="example-controls">
        {last
          ? `Slot ${String(last.id)} — ${last.startTime}–${last.endTime}`
          : "Click a slot without dragging, or focus one and press Enter."}
      </div>
      <div className="example-body">
        <AvailabilityCalendar
          slots={slots}
          onSlotsChange={setSlots}
          blockedSlots={seedBlocked}
          snapMinutes={30}
          timeFormat="12"
          onSlotClick={(slot) => setLast(slot)}
          theme={dark ? darkTheme : undefined}
        />
      </div>
    </>
  );
}

function UndoRedo({ dark }: { dark: boolean }) {
  const {
    slots,
    onSlotsChange,
    undo,
    redo,
    reset,
    canUndo,
    canRedo,
    undoCount,
  } = useAvailabilityHistory(seedSlots);
  return (
    <>
      <div className="example-controls">
        <button className="ctl" onClick={undo} disabled={!canUndo}>
          Undo
        </button>
        <button className="ctl" onClick={redo} disabled={!canRedo}>
          Redo
        </button>
        <button className="ctl" onClick={() => reset(seedSlots)}>
          Reset
        </button>
        <span>
          {undoCount} step{undoCount === 1 ? "" : "s"} recorded
        </span>
      </div>
      <div className="example-body">
        <AvailabilityCalendar
          slots={slots}
          onSlotsChange={onSlotsChange}
          blockedSlots={seedBlocked}
          snapMinutes={30}
          timeFormat="12"
          theme={dark ? darkTheme : undefined}
        />
      </div>
    </>
  );
}

/** Wraps a plain calendar demo in the standard fixed-height body. */
const body =
  (C: (p: { dark: boolean }) => React.ReactNode) => (dark: boolean) => (
    <div className="example-body">
      <C dark={dark} />
    </div>
  );

export const examples: Example[] = [
  {
    id: "basic",
    title: "Basic",
    blurb:
      "Drag empty space to create, drag a slot to move it, drag an edge to resize, × to remove.",
    code: `const [slots, setSlots] = useState<AvailabilitySlot[]>([
  { id: 1, dayOfWeek: 1, startTime: "09:00", endTime: "12:00" },
]);

<AvailabilityCalendar
  slots={slots}
  onSlotsChange={setSlots}
  blockedSlots={[
    { dayOfWeek: 2, startTime: "12:00", endTime: "13:00", label: "Lunch" },
  ]}
  snapMinutes={30}
  timeFormat="12"
/>`,
    render: body(Basic),
  },
  {
    id: "colors",
    title: "Per-slot colors",
    blurb:
      "Give a slot its own color. Tuesday's has none and falls back to the theme. Drag one — the ghost keeps its color.",
    code: `const slots = [
  { id: 1, dayOfWeek: 1, startTime: "09:00", endTime: "12:00", color: "#f59e0b" },
  { id: 2, dayOfWeek: 3, startTime: "14:00", endTime: "17:00", color: "#10b981" },
  { id: 4, dayOfWeek: 2, startTime: "15:00", endTime: "16:30" }, // theme default
];`,
    render: body(Coloured),
  },
  {
    id: "undo",
    title: "useAvailabilityHistory",
    blurb:
      "Undo and redo around the controlled slots. Make a few edits, then step back through them.",
    code: `const { slots, onSlotsChange, undo, redo, canUndo, canRedo } =
  useAvailabilityHistory(initialSlots);

<button onClick={undo} disabled={!canUndo}>Undo</button>
<button onClick={redo} disabled={!canRedo}>Redo</button>

<AvailabilityCalendar
  slots={slots}
  onSlotsChange={onSlotsChange}
  snapMinutes={30}
  timeFormat="12"
/>`,
    render: (dark) => <UndoRedo dark={dark} />,
  },
  {
    id: "multiday",
    title: "multiDayCreate",
    blurb:
      "Drag diagonally across columns to create the same range on every day it covers. Try starting on Sunday.",
    code: `<AvailabilityCalendar
  slots={slots}
  onSlotsChange={setSlots}
  snapMinutes={30}
  timeFormat="12"
  multiDayCreate
/>`,
    render: body(MultiDay),
  },
  {
    id: "locale",
    title: "locale",
    blurb:
      "German day names and 24-hour times through Intl. Applies to short labels too, not just long ones.",
    code: `<AvailabilityCalendar
  slots={slots}
  onSlotsChange={setSlots}
  snapMinutes={30}
  timeFormat="24"
  locale="de-DE"
  startDay={1}
/>`,
    render: body(Localised),
  },
  {
    id: "readonly",
    title: "readOnly",
    blurb:
      "Display availability without letting anyone edit it. onSlotClick still fires.",
    code: `<AvailabilityCalendar
  slots={slots}
  onSlotsChange={setSlots}
  snapMinutes={30}
  timeFormat="12"
  readOnly
/>`,
    render: body(ReadOnly),
  },
  {
    id: "onslotclick",
    title: "onSlotClick",
    blurb:
      "Fires on press-and-release under 4px of movement, and on Enter or Space when a slot is focused.",
    code: `<AvailabilityCalendar
  slots={slots}
  onSlotsChange={setSlots}
  snapMinutes={30}
  timeFormat="12"
  onSlotClick={(slot, event) => openDetails(slot)}
/>`,
    render: (dark) => <ClickToInspect dark={dark} />,
  },
  {
    id: "custom",
    title: "renderSlot",
    blurb:
      "Replace slot and blocked-slot contents entirely. Also shows startDay, long labels and dotted gridlines.",
    code: `<AvailabilityCalendar
  slots={slots}
  onSlotsChange={setSlots}
  snapMinutes={30}
  timeFormat="24"
  startDay={1}
  dayLabelFormat="long"
  gridLineStyle="dotted"
  renderSlot={(slot, info) => (
    <div>
      <strong>{info.startLabel} – {info.endLabel}</strong>
      {!info.isCompact && <span>{info.durationLabel}</span>}
    </div>
  )}
/>`,
    render: body(CustomRender),
  },
];
