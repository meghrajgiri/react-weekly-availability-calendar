import { useState } from "react";

import { AvailabilityCalendar } from "../src";
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

/** One entry per demo on the page. Adding a new one is a single object. */
export interface Example {
  id: string;
  title: string;
  blurb: string;
  code: string;
  render: (dark: boolean) => React.ReactNode;
}

/** Shared props so each example only spells out what it is demonstrating. */
function useSlots(initial: AvailabilitySlot[] = seedSlots) {
  return useState<AvailabilitySlot[]>(initial);
}

function Basic({ dark }: { dark: boolean }) {
  const [slots, setSlots] = useSlots();
  return (
    <AvailabilityCalendar
      slots={slots}
      onSlotsChange={setSlots}
      blockedSlots={seedBlocked}
      snapMinutes={30}
      timeFormat="12"
      theme={dark ? DARK : undefined}
    />
  );
}

function ReadOnly({ dark }: { dark: boolean }) {
  const [slots, setSlots] = useSlots();
  return (
    <AvailabilityCalendar
      slots={slots}
      onSlotsChange={setSlots}
      blockedSlots={seedBlocked}
      snapMinutes={30}
      timeFormat="12"
      readOnly
      theme={dark ? DARK : undefined}
    />
  );
}

function ClickToInspect({ dark }: { dark: boolean }) {
  const [slots, setSlots] = useSlots();
  const [last, setLast] = useState<AvailabilitySlot | null>(null);
  return (
    <>
      <div className="example-controls">
        {last
          ? `Slot ${String(last.id)} — ${last.startTime}–${last.endTime}`
          : "Click a slot without dragging."}
      </div>
      <div className="example-body">
        <AvailabilityCalendar
          slots={slots}
          onSlotsChange={setSlots}
          blockedSlots={seedBlocked}
          snapMinutes={30}
          timeFormat="12"
          onSlotClick={(slot) => setLast(slot)}
          theme={dark ? DARK : undefined}
        />
      </div>
    </>
  );
}

function CustomRender({ dark }: { dark: boolean }) {
  const [slots, setSlots] = useSlots();
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
      theme={dark ? DARK : undefined}
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

/**
 * Inline dark palette. Once #13 lands this becomes `import { darkTheme }`,
 * and this constant goes away.
 */
const DARK = {
  calendarBackground: "#151a21",
  borderColor: "#262d38",
  headerBackground: "#0e1116",
  headerTextColor: "#e8ecf1",
  timeLabelColor: "#9aa4b2",
  gridLineColor: "#262d38",
  slotBackground: "#4f46e5",
  slotTextColor: "#f4f4ff",
  slotBorderColor: "#6366f1",
  blockedBackground: "#1d232c",
  blockedTextColor: "#9aa4b2",
  blockedBorderColor: "#333c4a",
  blockedStripeColor: "rgba(148,163,184,0.16)",
  previewBackground: "rgba(99,102,241,0.28)",
  previewBorderColor: "#818cf8",
};

export const examples: Example[] = [
  {
    id: "basic",
    title: "Basic",
    blurb:
      "Drag on empty space to create, drag a slot to move it, drag an edge to resize, × to remove.",
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
    render: (dark) => (
      <div className="example-body">
        <Basic dark={dark} />
      </div>
    ),
  },
  {
    id: "readonly",
    title: "readOnly",
    blurb:
      "Display existing availability without letting anyone edit it. onSlotClick still fires.",
    code: `<AvailabilityCalendar
  slots={slots}
  onSlotsChange={setSlots}
  snapMinutes={30}
  timeFormat="12"
  readOnly
/>`,
    render: (dark) => (
      <div className="example-body">
        <ReadOnly dark={dark} />
      </div>
    ),
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
      "Replace the slot and blocked-slot contents entirely. Also shows startDay, long labels and dotted gridlines.",
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
    render: (dark) => (
      <div className="example-body">
        <CustomRender dark={dark} />
      </div>
    ),
  },
];

export { DARK as demoDarkTheme };
