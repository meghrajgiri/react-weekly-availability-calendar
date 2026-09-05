import { useState } from "react";
import { createRoot } from "react-dom/client";
import {
  AvailabilityCalendar,
  darkTheme,
  useAvailabilityHistory,
} from "../src";
import type { AvailabilitySlot, BlockedSlot } from "../src";

const initialSlots: AvailabilitySlot[] = [
  { id: 1, dayOfWeek: 1, startTime: "09:00", endTime: "12:00" },
  { id: 2, dayOfWeek: 3, startTime: "14:00", endTime: "17:00" },
  { id: 3, dayOfWeek: 5, startTime: "10:00", endTime: "13:00" },
];

const blockedSlots: BlockedSlot[] = [
  { dayOfWeek: 2, startTime: "12:00", endTime: "13:00", label: "Lunch" },
  { dayOfWeek: 4, startTime: "12:00", endTime: "13:00", label: "Lunch" },
];

function DefaultExample() {
  const [slots, setSlots] = useState<AvailabilitySlot[]>(initialSlots);

  return (
    <div>
      <h2 style={{ margin: "0 0 0.75rem", fontSize: 18, fontWeight: 600 }}>
        Default
      </h2>
      <div style={{ height: "60vh" }}>
        <AvailabilityCalendar
          slots={slots}
          onSlotsChange={setSlots}
          blockedSlots={blockedSlots}
          snapMinutes={30}
          timeFormat="12"
        />
      </div>
    </div>
  );
}

function CustomizedExample() {
  const [slots, setSlots] = useState<AvailabilitySlot[]>(initialSlots);

  return (
    <div>
      <h2 style={{ margin: "0 0 0.75rem", fontSize: 18, fontWeight: 600 }}>
        Customized
      </h2>
      <div style={{ height: "60vh" }}>
        <AvailabilityCalendar
          slots={slots}
          onSlotsChange={setSlots}
          blockedSlots={blockedSlots}
          snapMinutes={30}
          timeFormat="24"
          startDay={1}
          dayLabelFormat="long"
          gridLineStyle="dotted"
          theme={{
            calendarBackground: "#1e1e2e",
            borderColor: "#45475a",
            headerBackground: "#313244",
            headerTextColor: "#cdd6f4",
            timeLabelColor: "#a6adc8",
            gridLineColor: "#45475a",
            slotBackground: "#89b4fa",
            slotTextColor: "#1e1e2e",
            slotBorderColor: "#74c7ec",
            blockedBackground: "#45475a",
            blockedTextColor: "#f38ba8",
            blockedBorderColor: "#f38ba8",
            blockedStripeColor: "rgba(243,139,168,0.25)",
            previewBackground: "rgba(137,180,250,0.3)",
            previewBorderColor: "#89b4fa",
          }}
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
      </div>
    </div>
  );
}

function ClassNamesExample() {
  const [slots, setSlots] = useState<AvailabilitySlot[]>(initialSlots);

  return (
    <div>
      <h2 style={{ margin: "0 0 0.75rem", fontSize: 18, fontWeight: 600 }}>
        classNames (CSS / Tailwind friendly)
      </h2>
      <div style={{ height: "60vh" }}>
        <AvailabilityCalendar
          slots={slots}
          onSlotsChange={setSlots}
          blockedSlots={blockedSlots}
          snapMinutes={30}
          timeFormat="12"
          startDay={0}
          dayLabelFormat="short"
          gridLineStyle="dotted"
          classNames={{
            gridContainer: "my-grid",
            header: "my-header",
            headerCell: "my-header-cell",
            timeLabel: "my-time",
            dayColumn: "my-day-col",
            slot: "my-slot",
            slotRemoveButton: "my-remove-btn",
            blockedSlot: "my-blocked",
            createPreview: "my-preview",
            moveGhost: "my-ghost",
            hourLine: "my-hour",
            subHourLine: "my-sub-hour",
          }}
        />
      </div>
    </div>
  );
}

function OnSlotClickExample() {
  const [slots, setSlots] = useState<AvailabilitySlot[]>(initialSlots);
  const [lastClicked, setLastClicked] = useState<AvailabilitySlot | null>(null);

  return (
    <div>
      <h2 style={{ margin: "0 0 0.75rem", fontSize: 18, fontWeight: 600 }}>
        onSlotClick
      </h2>
      <p style={{ margin: "0 0 0.75rem", color: "#6b7280", fontSize: 13 }}>
        Click a slot (without dragging) to select it. Dragging still moves the
        slot as usual.
      </p>
      {lastClicked && (
        <div style={{ margin: "0 0 0.75rem", fontSize: 13 }}>
          Clicked slot {String(lastClicked.id)}: {lastClicked.startTime}–
          {lastClicked.endTime}
        </div>
      )}
      <div style={{ height: "60vh" }}>
        <AvailabilityCalendar
          slots={slots}
          onSlotsChange={setSlots}
          blockedSlots={blockedSlots}
          snapMinutes={30}
          timeFormat="12"
          onSlotClick={(slot) => setLastClicked(slot)}
        />
      </div>
    </div>
  );
}

const coloredSlots: AvailabilitySlot[] = [
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

function DarkThemeExample() {
  const [slots, setSlots] = useState<AvailabilitySlot[]>(coloredSlots);

  return (
    <div>
      <h2 style={{ margin: "0 0 0.75rem", fontSize: 18, fontWeight: 600 }}>
        darkTheme preset + per-slot colors
      </h2>
      <p style={{ margin: "0 0 0.75rem", color: "#6b7280", fontSize: 13 }}>
        Three slots set their own <code>color</code>; Tuesday&apos;s has none
        and falls back to the theme. Drag one to confirm the ghost keeps its
        color.
      </p>
      <div style={{ height: "60vh" }}>
        <AvailabilityCalendar
          slots={slots}
          onSlotsChange={setSlots}
          blockedSlots={blockedSlots}
          snapMinutes={30}
          timeFormat="12"
          theme={darkTheme}
        />
      </div>
    </div>
  );
}

function LocaleExample() {
  const [slots, setSlots] = useState<AvailabilitySlot[]>(initialSlots);

  return (
    <div>
      <h2 style={{ margin: "0 0 0.75rem", fontSize: 18, fontWeight: 600 }}>
        locale
      </h2>
      <p style={{ margin: "0 0 0.75rem", color: "#6b7280", fontSize: 13 }}>
        German day names and 24-hour times via <code>Intl</code>. Note the
        default <code>dayLabelFormat=&quot;short&quot;</code> is localized too.
      </p>
      <div style={{ height: "60vh" }}>
        <AvailabilityCalendar
          slots={slots}
          onSlotsChange={setSlots}
          blockedSlots={blockedSlots}
          snapMinutes={30}
          timeFormat="24"
          locale="de-DE"
          startDay={1}
        />
      </div>
    </div>
  );
}

function MultiDayExample() {
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);

  return (
    <div>
      <h2 style={{ margin: "0 0 0.75rem", fontSize: 18, fontWeight: 600 }}>
        multiDayCreate
      </h2>
      <p style={{ margin: "0 0 0.75rem", color: "#6b7280", fontSize: 13 }}>
        Drag diagonally across columns to create the same range on each day. Try
        a drag that starts or ends on Sunday — the preview should cover every
        column the commit will fill.
      </p>
      <div style={{ height: "60vh" }}>
        <AvailabilityCalendar
          slots={slots}
          onSlotsChange={setSlots}
          blockedSlots={blockedSlots}
          snapMinutes={30}
          timeFormat="12"
          multiDayCreate
        />
      </div>
    </div>
  );
}

function UndoRedoExample() {
  const {
    slots,
    onSlotsChange,
    undo,
    redo,
    reset,
    canUndo,
    canRedo,
    undoCount,
  } = useAvailabilityHistory(initialSlots);

  const btn = {
    padding: "4px 10px",
    marginRight: 8,
    fontSize: 13,
    cursor: "pointer",
  } as const;

  return (
    <div>
      <h2 style={{ margin: "0 0 0.75rem", fontSize: 18, fontWeight: 600 }}>
        useAvailabilityHistory
      </h2>
      <div style={{ margin: "0 0 0.75rem" }}>
        <button style={btn} onClick={undo} disabled={!canUndo}>
          Undo
        </button>
        <button style={btn} onClick={redo} disabled={!canRedo}>
          Redo
        </button>
        <button style={btn} onClick={() => reset(initialSlots)}>
          Reset
        </button>
        <span style={{ color: "#6b7280", fontSize: 13 }}>
          {undoCount} step{undoCount === 1 ? "" : "s"} in history
        </span>
      </div>
      <div style={{ height: "60vh" }}>
        <AvailabilityCalendar
          slots={slots}
          onSlotsChange={onSlotsChange}
          blockedSlots={blockedSlots}
          snapMinutes={30}
          timeFormat="12"
        />
      </div>
    </div>
  );
}

function App() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "3rem" }}>
      <DefaultExample />
      <UndoRedoExample />
      <MultiDayExample />
      <LocaleExample />
      <DarkThemeExample />
      <OnSlotClickExample />
      <CustomizedExample />
      <ClassNamesExample />
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
