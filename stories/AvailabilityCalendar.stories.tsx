import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { AvailabilityCalendar, darkTheme } from "../src";
import type { AvailabilitySlot } from "../src";
import { blocked, colouredSlots, slots } from "./shared";

/**
 * A draggable weekly availability grid.
 *
 * Every story below is live: drag empty space to create a slot, drag a slot to
 * move it, drag its edges to resize, and press × to remove it.
 *
 * The **Controls** and **Docs** tabs are generated from `AvailabilityCalendarProps`
 * in `src/types.ts`, so this page is the canonical prop reference — it cannot
 * drift from the source.
 */
const meta = {
  title: "AvailabilityCalendar",
  component: AvailabilityCalendar,
  tags: ["autodocs"],
  args: {
    snapMinutes: 30,
    timeFormat: "12",
    blockedSlots: blocked,
    slots,
    // Required by the props type. The render wrapper below owns the real
    // state and forwards here, so stories never have to supply it.
    onSlotsChange: () => {},
  },
  argTypes: {
    snapMinutes: { control: { type: "inline-radio" }, options: [10, 30, 60] },
    timeFormat: { control: { type: "inline-radio" }, options: ["12", "24"] },
    startDay: {
      control: { type: "select" },
      options: [0, 1, 2, 3, 4, 5, 6],
    },
    dayLabelFormat: {
      control: { type: "inline-radio" },
      options: ["short", "long"],
    },
    gridLineStyle: {
      control: { type: "inline-radio" },
      options: ["solid", "dashed", "dotted"],
    },
    startHour: { control: { type: "range", min: 0, max: 23, step: 1 } },
    endHour: { control: { type: "range", min: 1, max: 24, step: 1 } },
    slots: { control: false },
    onSlotsChange: { control: false },
    renderSlot: { control: false },
    renderBlockedSlot: { control: false },
    theme: { control: false },
    classNames: { control: false },
  },
  /** Every story is controlled, so the wrapper owns the slot state. */
  render: function Render(args) {
    const [current, setCurrent] = useState<AvailabilitySlot[]>(
      args.slots ?? slots
    );
    return (
      <AvailabilityCalendar
        {...args}
        slots={current}
        onSlotsChange={(next) => {
          setCurrent(next);
          args.onSlotsChange?.(next);
        }}
      />
    );
  },
} satisfies Meta<typeof AvailabilityCalendar>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The default grid: full day, 30-minute snap, 12-hour clock. */
export const Default: Story = {
  args: { slots },
};

/**
 * `startHour` and `endHour` narrow the grid to the hours you schedule in.
 *
 * Presentational only — slots outside the range stay in your data and are
 * clipped from the view, never moved. Try dragging the range sliders in
 * **Controls**.
 */
export const WorkingHours: Story = {
  args: { slots, startHour: 8, endHour: 20 },
};

/** `snapMinutes` controls the grid increment and the smallest slot you can draw. */
export const TenMinuteSnap: Story = {
  args: { slots, snapMinutes: 10, startHour: 9, endHour: 13 },
};

/** Per-slot `color` overrides the theme for that slot only, ghost included. */
export const PerSlotColors: Story = {
  args: { slots: colouredSlots },
};

/** The exported `darkTheme` preset. Spread it to override individual keys. */
export const DarkTheme: Story = {
  args: { slots, theme: darkTheme },
  parameters: { backgrounds: { default: "dark" } },
};

/** `locale` drives day names and times through `Intl`, at both label widths. */
export const Localised: Story = {
  args: { slots, locale: "de-DE", timeFormat: "24", startDay: 1 },
};

/** One drag lays the same range across every column it covers. Opt-in. */
export const MultiDayCreate: Story = {
  args: { slots: [], multiDayCreate: true },
};

/** Display-only. `onSlotClick` still fires, so details views keep working. */
export const ReadOnly: Story = {
  args: { slots, readOnly: true },
};

/** Blocked ranges are non-interactive and drawn with a striped overlay. */
export const BlockedSlots: Story = {
  args: {
    slots: [],
    blockedSlots: [
      { dayOfWeek: 1, startTime: "12:00", endTime: "13:00", label: "Lunch" },
      { dayOfWeek: 2, startTime: "09:00", endTime: "10:30", label: "Standup" },
      { dayOfWeek: 3, startTime: "15:00", endTime: "18:00", label: "Focus" },
    ],
    startHour: 8,
    endHour: 20,
  },
};

/** Replace slot contents entirely with `renderSlot` / `renderBlockedSlot`. */
export const CustomRendering: Story = {
  args: {
    slots,
    timeFormat: "24",
    startDay: 1,
    dayLabelFormat: "long",
    gridLineStyle: "dotted",
    renderSlot: (_slot, info) => (
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
    ),
    renderBlockedSlot: (slot) => (
      <span
        style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase" }}
      >
        {slot.label}
      </span>
    ),
  },
};

/** Per-part class names, for Tailwind or plain CSS. */
export const ClassNames: Story = {
  args: {
    slots,
    classNames: {
      gridContainer: "sb-grid",
      slot: "sb-slot",
      header: "sb-header",
    },
  },
};

/**
 * Fully operable without a pointer.
 *
 * Tab to a day column and press Enter to add a slot. Tab to a slot, then use
 * arrows to move it, Shift with arrows to resize, and Delete to remove it.
 * Each change is announced in a live region.
 */
export const KeyboardOperation: Story = {
  args: { slots, startHour: 9, endHour: 17 },
};
