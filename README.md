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

## Keyboard

The calendar is fully operable without a pointer.

| Focus        | Key                                          | Action                                     |
| ------------ | -------------------------------------------- | ------------------------------------------ |
| A day column | <kbd>Enter</kbd> / <kbd>Space</kbd>          | Add a slot at the earliest free time       |
| A slot       | <kbd>↑</kbd> / <kbd>↓</kbd>                  | Move earlier / later by one snap increment |
| A slot       | <kbd>←</kbd> / <kbd>→</kbd>                  | Move to the previous / next day            |
| A slot       | <kbd>Shift</kbd> + <kbd>↑</kbd>/<kbd>↓</kbd> | Resize from the end edge                   |
| A slot       | <kbd>Delete</kbd> / <kbd>Backspace</kbd>     | Remove the slot                            |
| A slot       | <kbd>Enter</kbd> / <kbd>Space</kbd>          | Fire `onSlotClick`                         |

Every change is announced in a polite live region. Moves that would collide with
another slot or a blocked range are refused and announced rather than silently
ignored.

The calendar deliberately does **not** use ARIA's `grid` role. That role requires
`row` and `gridcell` descendants across the whole surface — over a thousand cells
at a ten-minute snap — which would leave a screen-reader user traversing all of
them to reach a handful of slots. Slots and day columns are exposed as labelled
buttons instead.

## Slots that touch are merged

When an edit leaves two slots touching or overlapping, they are merged into one.
The merge keeps the fields — **including the `id`** — of the slot that starts
earliest:

```tsx
// before
[
  { id: "a", dayOfWeek: 1, startTime: "09:00", endTime: "10:00" },
  { id: "b", dayOfWeek: 1, startTime: "10:00", endTime: "11:00" },
][
  // after onSlotsChange — one slot, and "b" is gone
  { id: "a", dayOfWeek: 1, startTime: "09:00", endTime: "11:00" }
];
```

This applies to every path: dragging, resizing, and keyboard edits. Treat the
array `onSlotsChange` hands you as a **fresh statement of the week's
availability**, not as a diff against what you passed in — reconciling it by id
will lose merged slots.

## End-of-day slots and storage

A slot running to midnight ends at `"24:00"`. That is deliberate, and matches
ISO 8601, which allows hour 24 as the **end** of an interval. It is also the
only representation that survives a round trip:

| End value | Parses back to | Result                                                        |
| --------- | -------------- | ------------------------------------------------------------- |
| `"24:00"` | 1440           | correct                                                       |
| `"00:00"` | 0              | end is before the start — the slot is rejected and disappears |
| `"23:59"` | 1439           | silently a minute short                                       |

Some stores reject hour 24 — SQL `TIME`, and most date parsers. Convert at that
boundary, where you know the string is an end time:

```tsx
import {
  toStorageSlots,
  fromStorageSlots,
} from "react-weekly-availability-calendar";

await db.save(toStorageSlots(slots)); // "24:00" -> "00:00"
const slots = fromStorageSlots(await db.load()); // "00:00" -> "24:00"
```

Both are pure, leave every other slot untouched, and preserve custom fields.

## Documentation

The full API — every prop, every variant, with live controls — is generated
from the TypeScript types, so it never drifts from the source:

**→ [Storybook: full API reference](https://ui.meghrajgiri.com/availability-calendar/storybook/)**

**→ [Live demo and examples](https://ui.meghrajgiri.com/availability-calendar/)**

### At a glance

|                  |                                                                       |
| ---------------- | --------------------------------------------------------------------- |
| **Required**     | `slots`, `onSlotsChange`, `snapMinutes`, `timeFormat`                 |
| **Range**        | `startHour`, `endHour` — show only the hours you schedule in          |
| **Week**         | `startDay`, `dayLabelFormat`, `locale`, `gridLineStyle`               |
| **Behaviour**    | `readOnly`, `multiDayCreate`, `onSlotClick`, `blockedSlots`           |
| **Limits**       | `disabledDays`, `minSlotMinutes`, `maxSlotMinutes`                    |
| **Styling**      | `theme` (plus the `darkTheme` preset), `classNames`, per-slot `color` |
| **Render props** | `renderSlot`, `renderBlockedSlot`                                     |
| **Hook**         | `useAvailabilityHistory` for undo / redo                              |

Types are exported for all of the above, and every prop carries TSDoc — your
editor will show the same descriptions Storybook does.

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

- **[Live demo and examples](https://ui.meghrajgiri.com/availability-calendar/)**
- **[Storybook — full API reference](https://ui.meghrajgiri.com/availability-calendar/storybook/)**
- [Changelog](./CHANGELOG.md)
- [npm](https://www.npmjs.com/package/react-weekly-availability-calendar)

## Notes

- **End-of-day slots**: Slots ending at midnight display as `24:00` in 24-hour format (not `00:00`) to clearly represent end-of-day rather than start-of-day.
- **SSR safe**: All DOM access is guarded. Works with Next.js, Remix, etc.
- **No CSS import needed**: Styles are auto-injected via a `<style>` tag on first render.

## License

MIT
