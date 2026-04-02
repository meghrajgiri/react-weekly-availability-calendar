# react-weekly-availability-calendar

A customizable, draggable weekly availability calendar component for React. Create, resize, and move time slots with zero external styling dependencies.

## Features

- Drag to create, resize, and move availability slots
- Blocked time slots with striped overlay
- Fully customizable via `theme`, `classNames`, or render props
- Zero external dependencies (only `react` and `react-dom` as peer deps)
- Styles auto-injected at runtime — no CSS import needed
- SSR safe
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

| Prop | Type | Default | Description |
|---|---|---|---|
| `slots` | `AvailabilitySlot[]` | **required** | Current availability slots |
| `onSlotsChange` | `(next: AvailabilitySlot[]) => void` | **required** | Called when slots are created, moved, resized, or removed |
| `blockedSlots` | `BlockedSlot[]` | `[]` | Non-interactive blocked time ranges |
| `snapMinutes` | `10 \| 30 \| 60` | **required** | Grid snap increment |
| `timeFormat` | `"12" \| "24"` | **required** | Time display format |
| `readOnly` | `boolean` | `false` | Disable all interactions |
| `startDay` | `DayOfWeek` (0-6) | `0` (Sunday) | First day of the week |
| `dayLabelFormat` | `"short" \| "long" \| (day) => string` | `"short"` | Day header labels |
| `gridLineStyle` | `"solid" \| "dashed" \| "dotted"` | `"dashed"` | Snap grid line style |
| `theme` | `CalendarTheme` | — | Color overrides |
| `classNames` | `CalendarClassNames` | — | CSS class overrides per part |
| `renderSlot` | `(slot, info) => ReactNode` | — | Custom slot content |
| `renderBlockedSlot` | `(slot) => ReactNode` | — | Custom blocked slot content |
| `className` | `string` | — | Root element class |
| `style` | `CSSProperties` | — | Root element inline styles |

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
      <strong>{startLabel} - {endLabel}</strong>
      <span>{durationLabel}</span>
    </div>
  )}
  renderBlockedSlot={(slot) => (
    <span>{slot.label}</span>
  )}
  // ...
/>
```

## Types

```ts
type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

interface AvailabilitySlot {
  id: number | string;
  dayOfWeek: DayOfWeek;
  startTime: string; // "HH:mm"
  endTime: string;   // "HH:mm"
}

interface BlockedSlot {
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  label: string;
}
```

## Notes

- **End-of-day slots**: Slots ending at midnight display as `24:00` in 24-hour format (not `00:00`) to clearly represent end-of-day rather than start-of-day.
- **SSR safe**: All DOM access is guarded. Works with Next.js, Remix, etc.
- **No CSS import needed**: Styles are auto-injected via a `<style>` tag on first render.

## License

MIT
