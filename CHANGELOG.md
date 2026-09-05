# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.2.1] - 2026-09-06

### Changed

- Documentation is now split by audience, and the API reference is generated
  rather than hand-maintained. Props were previously duplicated across
  `types.ts`, the README table and the docs site, and had begun to drift;
  Storybook derives them from the types, TSDoc included, so they cannot fall
  out of sync. The README keeps what it is, install and quick start, and links
  out for the full reference.

No runtime changes — the published bundle is byte-identical to 1.2.0.

## [1.2.0] - 2026-09-05

### Added

- `startHour` and `endHour` props to narrow the visible grid to the hours you
  actually schedule in. The default is unchanged (the full day), so existing
  usage is unaffected.

  This is presentational only: slots outside the range stay in your data
  untouched. They are clipped from the view rather than moved or rewritten, and
  a slot straddling the boundary renders its visible portion while its labels
  keep reporting its real start and end. Dragging is confined to the visible
  window.

  An invalid range — inverted, out of bounds, or not a number — falls back to
  the full day and warns in development, rather than silently rendering an
  empty grid.

## [1.1.0] - 2026-09-05

### Added

- `darkTheme` — a ready-made `CalendarTheme` preset, so dark mode no longer
  means hand-writing fifteen colour values. It composes: spread it and override
  individual keys.
- Per-slot `color` on `AvailabilitySlot`. Overrides `theme.slotBackground` for
  that slot only, and follows the slot into the drag ghost.
- `locale` prop. A BCP 47 tag drives `Intl` formatting for weekday headers, the
  time gutter, slot labels and the drag ghost. Applies to both `"short"` and
  `"long"` day labels; a custom `dayLabelFormat` function still takes
  precedence.
- `multiDayCreate` prop (opt-in, default `false`). One drag-to-create gesture
  lays the same time range on every day column it covers. Days where the range
  collides are skipped rather than aborting the sweep.
- `useAvailabilityHistory` — undo/redo around the controlled `slots` /
  `onSlotsChange` pair, with a bounded stack (default 50), `reset`, and
  `canUndo`/`canRedo`/`undoCount`/`redoCount`.
- A documentation site under `site/`, deployed to
  ui.meghrajgiri.com/availability-calendar.

### Changed

- `npm run dev` now serves the documentation site. The former `playground/`
  directory has become `site/`, so the demos and the published page are the
  same code.

## [1.0.2] - 2026-09-05

### Fixed

- Slots that do not align to `snapMinutes` now render at their true position
  and height. Positioning rounded to the nearest row, so with a 30-minute snap
  a `09:15`–`09:45` slot was drawn at `09:00`, and a `09:10`–`09:50` slot was
  drawn half again too tall. Consumer data rarely lands on snap boundaries, so
  the calendar could silently misrepresent the times it was given.
- Removed ARIA roles that promised interaction the component does not yet
  offer. The root declared `role="grid"` with no `row`/`gridcell` descendants —
  an invalid structure that announced a grid with nothing navigable inside it —
  and the resize handles declared `role="separator"` despite being unfocusable.
  The root is now a labelled `role="group"` and the handles are `aria-hidden`.
  Slots keep `role="button"` when `onSlotClick` makes them activatable.

### Changed

- Three refs that were assigned during render (`slotsRef`, `canPlaceRef`,
  `onSlotClickRef`) now update in effects. React may discard or replay a
  render, and the pointer handlers write to `slotsRef` mid-drag, so a
  discarded render could clobber in-flight drag state with slots that were
  never committed.

## [1.0.1] - 2026-09-05

### Fixed

- Resizing a slot onto an adjacent one no longer freezes the drag. Slots were
  merged on every pointermove, and a merge keeps only the earliest slot's id —
  so the id the gesture was tracking could vanish mid-drag and every later
  pointermove failed to find its subject. Merging now happens once, on
  pointerup.
- Dragging a slot no longer changes the cursor on *other* `AvailabilityCalendar`
  instances mounted on the same page; the grabbing-cursor sweep is scoped to
  the calendar being dragged.
- `hhmmToMinutes` no longer returns `NaN` for malformed time strings, and now
  clamps its result to the grid range. Previously a bad value from a consumer
  could propagate into layout as `NaN` CSS offsets.
- Blocked slots sharing a label and start time on the same day no longer
  collide on their React key.

### Added

- The published bundles now carry a `"use client"` directive, so the component
  can be imported directly from a Next.js App Router server component.

### Changed

- `blockedSlots` now defaults to a stable array identity instead of a fresh
  `[]` per render, restoring memoization in the placement hook.
- `treeshake` is disabled in the build: tsup's treeshake step strips the
  `"use client"` banner, and it only saved 1-4% on this bundle. Consumers
  still tree-shake via `"sideEffects": false`.
- Internal tooling only: added Prettier, ESLint (with `react-hooks`), Vitest,
  and typecheck coverage for `playground/`. CI now runs typecheck, lint,
  format check, tests, and build on every pull request.
- The publish workflow verifies that the release tag matches
  `package.json`'s version before publishing, and pins npm to a major version.

## [1.0.0]

### Added

- `onSlotClick` callback, fired on pointer activation without a drag
  (under 4px of movement) and on Enter/Space for a focused slot. Also fires
  in `readOnly` mode.

### Changed

- Slots are exposed as `role="button"` with `tabIndex={0}` when `onSlotClick`
  is provided, making them keyboard focusable.

## [0.1.2]

- Initial public releases.

[Unreleased]: https://github.com/meghrajgiri/react-weekly-availability-calendar/compare/v1.2.1...HEAD
[1.2.1]: https://github.com/meghrajgiri/react-weekly-availability-calendar/compare/v1.2.0...v1.2.1
[1.2.0]: https://github.com/meghrajgiri/react-weekly-availability-calendar/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/meghrajgiri/react-weekly-availability-calendar/compare/v1.0.2...v1.1.0
[1.0.2]: https://github.com/meghrajgiri/react-weekly-availability-calendar/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/meghrajgiri/react-weekly-availability-calendar/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/meghrajgiri/react-weekly-availability-calendar/releases/tag/v1.0.0
[0.1.2]: https://github.com/meghrajgiri/react-weekly-availability-calendar/releases/tag/v0.1.2
