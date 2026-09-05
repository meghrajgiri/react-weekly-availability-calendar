# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[Unreleased]: https://github.com/meghrajgiri/react-weekly-availability-calendar/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/meghrajgiri/react-weekly-availability-calendar/releases/tag/v1.0.0
[0.1.2]: https://github.com/meghrajgiri/react-weekly-availability-calendar/releases/tag/v0.1.2
