# react-weekly-availability-calendar

A customizable, draggable weekly availability calendar component for React.
Create, resize, and move time slots with zero external styling dependencies.

[![npm](https://img.shields.io/npm/v/react-weekly-availability-calendar?color=4f46e5)](https://www.npmjs.com/package/react-weekly-availability-calendar)
[![npm downloads](https://img.shields.io/npm/dm/react-weekly-availability-calendar?color=4f46e5)](https://www.npmjs.com/package/react-weekly-availability-calendar)
[![license](https://img.shields.io/npm/l/react-weekly-availability-calendar?color=4f46e5)](./LICENSE)

### → [Try the live demo](https://ui.meghrajgiri.com/availability-calendar/)

Dragging is the whole point, so a screenshot undersells it. Every example on
the demo page is interactive — create a slot by dragging on empty space, move
one by dragging it, resize it by its edges.

[<img width="992" alt="Weekly availability calendar with draggable time slots" src="https://github.com/user-attachments/assets/c737831d-cd82-46bf-b870-01b179ac6f43" />](https://ui.meghrajgiri.com/availability-calendar/)

## Features

- Drag to create, resize, and move availability slots
- Blocked time slots with striped overlay
- Multi-day create: one drag lays the same range across several days
- Per-slot colors, plus a built-in `darkTheme` preset
- Locale-aware day names and times via `Intl`
- Undo / redo through the `useAvailabilityHistory` hook
- Fully customizable via `theme`, `classNames`, or render props
- Zero external dependencies (only `react` and `react-dom` as peer deps)
- Styles auto-injected at runtime — no CSS import needed
- SSR safe, and ships a `"use client"` directive for the Next.js App Router
- TypeScript first

## Install

```bash
npm install react-weekly-availability-calendar
```

## Quick Start

```tsx
import { useState } from "react";
import { AvailabilityCalendar } from "react-weekly-availability-calendar";
import type { AvailabilitySlot } from "react-weekly-availability-calendar";

function App() {
  const [slots, setSlots] = useState<AvailabilitySlot[]>([
    { id: 1, dayOfWeek: 1, startTime: "09:00", endTime: "12:00" },
    { id: 2, dayOfWeek: 3, startTime: "14:00", endTime: "17:00" },
  ]);

  return (
    <AvailabilityCalendar
      slots={slots}
      onSlotsChange={setSlots}
      snapMinutes={30}
      timeFormat="12"
    />
  );
}
```

## Props

| Prop                | Type                                   | Default      | Description                                                                   |
| ------------------- | -------------------------------------- | ------------ | ----------------------------------------------------------------------------- |
| `slots`             | `AvailabilitySlot[]`                   | **required** | Current availability slots                                                    |
| `onSlotsChange`     | `(next: AvailabilitySlot[]) => void`   | **required** | Called when slots are created, moved, resized, or removed                     |
| `blockedSlots`      | `BlockedSlot[]`                        | `[]`         | Non-interactive blocked time ranges                                           |
| `snapMinutes`       | `10 \| 30 \| 60`                       | **required** | Grid snap increment                                                           |
| `timeFormat`        | `"12" \| "24"`                         | **required** | Time display format                                                           |
| `readOnly`          | `boolean`                              | `false`      | Disable all interactions                                                      |
| `startDay`          | `DayOfWeek` (0-6)                      | `0` (Sunday) | First day of the week                                                         |
| `dayLabelFormat`    | `"short" \| "long" \| (day) => string` | `"short"`    | Day header labels                                                             |
| `gridLineStyle`     | `"solid" \| "dashed" \| "dotted"`      | `"dashed"`   | Snap grid line style                                                          |
| `startHour`         | `number`                               | `0`          | First hour shown on the grid (0-23)                                           |
| `endHour`           | `number`                               | `24`         | Last hour shown on the grid (1-24, greater than `startHour`)                  |
| `multiDayCreate`    | `boolean`                              | `false`      | Let one drag create the same range across several day columns                 |
| `locale`            | `string`                               | —            | BCP 47 tag (e.g. `"de-DE"`) for day names and time labels                     |
| `theme`             | `CalendarTheme`                        | —            | Color overrides. Pass the exported `darkTheme` preset for dark mode.          |
| `classNames`        | `CalendarClassNames`                   | —            | CSS class overrides per part                                                  |
| `renderSlot`        | `(slot, info) => ReactNode`            | —            | Custom slot content                                                           |
| `renderBlockedSlot` | `(slot) => ReactNode`                  | —            | Custom blocked slot content                                                   |
| `onSlotClick`       | `(slot, event) => void`                | —            | Fires when a slot is clicked without dragging. Also fires in `readOnly` mode. |
| `className`         | `string`                               | —            | Root element class                                                            |
| `style`             | `CSSProperties`                        | —            | Root element inline styles                                                    |

## Customization

### Theme (CSS variables)

```tsx
<AvailabilityCalendar
  theme={{
    calendarBackground: "#1e1e2e",
    headerBackground: "#313244",
    headerTextColor: "#cdd6f4",
    slotBackground: "#89b4fa",
    slotTextColor: "#1e1e2e",
    blockedStripeColor: "rgba(243,139,168,0.25)",
  }}
  // ...
/>
```

### Visible hour range

By default the grid spans the full day. `startHour` and `endHour` narrow it to
the hours you actually schedule in:

```tsx
<AvailabilityCalendar
  startHour={8}
  endHour={20}
  snapMinutes={30}
  timeFormat="12"
  /* ... */
/>
```

This is presentational only. Slots outside the range stay in your data
untouched — they are clipped from the view, never moved or rewritten. A slot
that straddles the boundary renders its visible portion while its labels keep
reporting its real start and end. Dragging is confined to the visible window.

An invalid range (inverted, out of bounds, or not a number) falls back to the
full day and warns in development.

### Multi-day create

With `multiDayCreate`, a single drag creates the same time range on every day
column it covers:

```tsx
<AvailabilityCalendar multiDayCreate /* ... */ />
```

Opt-in by design. Horizontal movement during a create is otherwise ignored, so
enabling this by default would make diagonal drags suddenly produce several
slots. Days where the range would collide with an existing or blocked slot are
skipped, so one busy column doesn't lose the whole sweep.

### Locale

Pass a BCP 47 tag to localize day names and time labels via `Intl`:

```tsx
<AvailabilityCalendar locale="de-DE" dayLabelFormat="short" /* ... */ />
// headers: Mo, Di, Mi, Do, Fr, Sa, So
```

`locale` applies to both `"short"` and `"long"` day labels and to time
formatting. A custom `dayLabelFormat` function still takes precedence. With no
`locale`, built-in English labels are used.

### Dark mode

A `darkTheme` preset ships with the package:

```tsx
import {
  AvailabilityCalendar,
  darkTheme,
} from "react-weekly-availability-calendar";

<AvailabilityCalendar theme={darkTheme} /* ... */ />;

// Override individual colors while keeping the rest of the preset:
<AvailabilityCalendar
  theme={{ ...darkTheme, slotBackground: "#a78bfa" }}
  /* ... */
/>;
```

### Per-slot colors

Give any slot its own background with `color`. It overrides
`theme.slotBackground` for that slot only, and follows the slot into the drag
ghost:

```tsx
const [slots, setSlots] = useState<AvailabilitySlot[]>([
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
]);
```

Any CSS color value works. Note that when two slots merge, the surviving slot
keeps its own color.

### classNames (Tailwind / CSS)

```tsx
<AvailabilityCalendar
  classNames={{
    gridContainer: "rounded-xl shadow-lg",
    header: "bg-indigo-50",
    headerCell: "text-indigo-900 font-semibold uppercase text-xs",
    slot: "bg-indigo-500 text-white rounded-lg shadow-md",
    blockedSlot: "bg-red-50 border-red-300",
    moveGhost: "shadow-2xl",
  }}
  // ...
/>
```

### Custom Slot Rendering

```tsx
<AvailabilityCalendar
  renderSlot={(slot, { startLabel, endLabel, durationLabel }) => (
    <div>
      <strong>
        {startLabel} - {endLabel}
      </strong>
      <span>{durationLabel}</span>
    </div>
  )}
  renderBlockedSlot={(slot) => <span>{slot.label}</span>}
  // ...
/>
```

### Reacting to slot clicks

`onSlotClick` fires when a slot is activated without being dragged. The
callback also fires in `readOnly` mode.

- **Pointer**: pointerdown→pointerup with under 4px of movement. The `event`
  argument is the native pointerup `PointerEvent`.
- **Keyboard**: Enter or Space on a focused slot. The `event` argument is the
  native `KeyboardEvent`. When `onSlotClick` is provided, slots are exposed
  as `role="button"` with `tabIndex={0}` for keyboard focus.

```tsx
<AvailabilityCalendar
  slots={slots}
  onSlotsChange={setSlots}
  snapMinutes={30}
  timeFormat="12"
  onSlotClick={(slot, event) => {
    // 'key' in event narrows to KeyboardEvent in a way that's safe in
    // SSR/JSDOM where the global KeyboardEvent constructor may be undefined.
    if ("key" in event) {
      // activated via Enter or Space
    }
    openSlotModal(slot);
  }}
/>
```

## Undo / redo

`useAvailabilityHistory` wraps the controlled `slots` / `onSlotsChange` pair
with an undo stack:

```tsx
import {
  AvailabilityCalendar,
  useAvailabilityHistory,
} from "react-weekly-availability-calendar";

function Editor() {
  const { slots, onSlotsChange, undo, redo, canUndo, canRedo } =
    useAvailabilityHistory(initialSlots);

  return (
    <>
      <button onClick={undo} disabled={!canUndo}>
        Undo
      </button>
      <button onClick={redo} disabled={!canRedo}>
        Redo
      </button>
      <AvailabilityCalendar
        slots={slots}
        onSlotsChange={onSlotsChange}
        snapMinutes={30}
        timeFormat="12"
      />
    </>
  );
}
```

| Returns                   | Type                 | Description                             |
| ------------------------- | -------------------- | --------------------------------------- |
| `slots`                   | `AvailabilitySlot[]` | Pass to `slots`                         |
| `onSlotsChange`           | `(next) => void`     | Pass to `onSlotsChange`                 |
| `undo` / `redo`           | `() => void`         | No-ops when the matching stack is empty |
| `reset`                   | `(slots) => void`    | Replace the slots and clear both stacks |
| `canUndo` / `canRedo`     | `boolean`            | For disabling controls                  |
| `undoCount` / `redoCount` | `number`             | Retained steps                          |

A second argument caps the stack — `useAvailabilityHistory(initial, { limit: 100 })`.
It defaults to 50, since a single drag emits many changes. Pass `Infinity` to
keep everything.

## Types

```ts
type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

interface AvailabilitySlot {
  id: number | string;
  dayOfWeek: DayOfWeek;
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
  color?: string; // optional per-slot background
}

interface BlockedSlot {
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  label: string;
}
```

## Links

- **[Live demo and docs](https://ui.meghrajgiri.com/availability-calendar/)**
- [Changelog](./CHANGELOG.md)
- [npm](https://www.npmjs.com/package/react-weekly-availability-calendar)

## Notes

- **End-of-day slots**: Slots ending at midnight display as `24:00` in 24-hour format (not `00:00`) to clearly represent end-of-day rather than start-of-day.
- **SSR safe**: All DOM access is guarded. Works with Next.js, Remix, etc.
- **No CSS import needed**: Styles are auto-injected via a `<style>` tag on first render.

## License

MIT
