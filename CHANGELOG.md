# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.6.1] - 2026-09-06

### Fixed

- The package no longer ships a stray `dist/index.css` and its sourcemap.
  Extracting the stylesheet in 1.5.2 made esbuild emit a standalone CSS
  file as well as inlining it, and nothing referenced it — the styles are
  injected at runtime and `exports` only maps the JS — so 32 kB of dead
  weight went into every install of 1.5.2 and 1.6.0. The build now removes
  it, and fails loudly if the inlined copy ever goes missing.
- The documentation site is properly responsive on phones. The brand
  wrapped to two lines in the header, which doubled its height and squeezed
  the theme toggle to 10px wide, and the page scrolled horizontally at
  320px. Controls now meet the 44px touch target on coarse pointers, the
  install command stays on one row, and the hero is tightened so the live
  demo is reachable rather than buried under a screenful of type.
- Site demos open on working hours instead of midnight, so the first thing
  visible is slots rather than empty night rows. The code samples were
  updated to match, so what is shown is still what you would copy.

## [1.6.0] - 2026-09-06

### Added

- `onSlotsChange` receives a second argument describing what the edit did:
  `{ created, updated, removed }`. Consumers can issue targeted writes
  instead of re-saving the whole week or diffing the array themselves.
  Purely additive — ignore it and the callback behaves as before.

  A merge is reported as an update plus a removal, since the surviving slot
  grows and the absorbed id ceases to exist. That is precisely the case a
  hand-rolled diff tends to get wrong.
- Tooltips. Slots and blocked ranges now carry a native `title` describing
  the day, time range and duration. A slot at a small snap increment can be
  a couple of rows tall, where its own labels are unreadable, and long
  blocked labels are truncated. `slotTooltip` and `blockedSlotTooltip`
  override the text; returning `null` suppresses it.
- `SlotChanges` is exported.

### Fixed

- `removeSlot` and the create preview are memoised. Both were rebuilt every
  render, which defeated the model memoisation added in 1.5.2.

## [1.5.2] - 2026-09-06

### Changed

- The bundle is 16% smaller: 76.6 KB to 64.2 KB for ESM, 13.4 KB gzipped.
  Treeshaking had been disabled since 1.0.1 because tsup's treeshake step
  strips banners and the `"use client"` directive has to survive. The
  directive is now prepended after the build instead, so both work.
- Styles moved out of a 635-line template literal into a real `styles.css`,
  which editors, Prettier and stylelint can all understand. It is still
  inlined into the bundle and injected at runtime, so consumers import no
  stylesheet.
- Pointer gestures share one `trackPointerGesture` helper rather than each
  drag repeating its own listener registration, pointer-id filtering and
  teardown. Removes four near-identical blocks and the class of bug they
  invite, where a gesture outlives the pointer that started it.
- The model returned by `useAvailabilityCalendar` is memoised, so the grid
  and drag ghost can be memoised in turn.
- Removed the monthly-downloads badge from the README.
- Internal types (`DurationLimits`, `HistoryState`, `HistoryAction`) are no
  longer exported.

## [1.5.1] - 2026-09-06

### Fixed

- Screen-reader announcements no longer report raw data. Moving a slot
  across days announced `Moved to day 3` rather than naming the day, and
  every time was announced as 24-hour `HH:mm` regardless of `timeFormat`
  and `locale` — so a 12-hour German calendar displayed `2:30 PM` and said
  `14:30`. Announcements now use the same day labels and clock formatting
  as the calendar itself.
- A repeated identical announcement is spoken again. Setting the same
  message twice bailed out of the re-render, so the live region never
  changed and stayed silent — holding an arrow key against a blocked slot
  announced once and then nothing, which is indistinguishable from the
  component hanging.

### Changed

- Documented that slots which touch or overlap are merged, and that a merge
  keeps the earliest slot's fields including its `id`. This is the most
  surprising behaviour in the API and it was documented nowhere
  user-facing.
- Added TSDoc to `slots`, `onSlotsChange`, `snapMinutes` and `timeFormat`.
  The four required props were the only undocumented ones, and since the
  Storybook API table is generated from TSDoc they rendered blank.
- Declared `engines.node >= 18`; CI now also builds the docs site and
  Storybook, which previously could break without failing a required check.

## [1.5.0] - 2026-09-06

### Added

- `disabledDays` marks days that cannot be edited, e.g. `[0, 6]` for
  weekends. Nothing can be created, moved, resized or removed there by
  pointer or keyboard. Existing slots on a disabled day still render, so the
  data stays visible and is never rewritten; they simply lose their controls,
  and the column is striped and marked `aria-disabled`.
- `minSlotMinutes` and `maxSlotMinutes` constrain slot length. Gestures are
  clamped rather than discarded: a drag shorter than the minimum grows to
  meet it where there is room, and one longer than the maximum is trimmed, so
  an imprecise gesture still produces a slot instead of nothing. Keyboard
  resizing stops at the same limits. The minimum can never fall below
  `snapMinutes`, which is the shortest slot the grid can represent.
- `theme.disabledStripeColor` for styling disabled columns.

## [1.4.1] - 2026-09-06

### Fixed

- Accessibility violations reported by axe, three of them introduced by the
  keyboard support in 1.3.0.

  - Day columns were focusable buttons that contained the slot buttons, and
    slots were buttons containing their own remove button. Nesting interactive
    controls confuses screen readers and keyboard focus. Columns are now
    labelled groups, editable slots are groups of controls, and slot creation
    moved to a real button — hidden until focused — that sits alongside the
    slots rather than wrapping them.
  - Day columns in `readOnly` mode carried an `aria-label` with no role, which
    ARIA prohibits.
  - The scrolling grid region was not reachable by keyboard, so content out of
    view could not be scrolled to.
  - Blocked-slot labels sit on a striped gradient, which made their contrast
    ratio neither computable nor reliable. The text now has its own solid
    backdrop.

  axe now runs against the component in CI across five configurations, so these
  cannot regress unnoticed.

### Changed

- Gridlines are drawn once across the grid instead of being repeated inside
  every day column - 86 percent fewer nodes, from 1008 to 144 for a full day
  at a ten-minute snap. The rules are horizontal and were identical in all
  seven columns, so the repetition bought nothing.

  Rendering is unchanged: the shared layer sits beneath the columns, so their
  vertical borders still paint over it, and slots and blocked ranges still
  paint above.

## [1.4.0] - 2026-09-06

### Added

- `toStorageSlots` and `fromStorageSlots` for stores that reject hour 24.
  A slot running to midnight ends at `"24:00"`, which is deliberate and matches
  ISO 8601 — and is the only representation that round-trips. `"00:00"` parses
  back to minute 0, putting the end before the start so the slot is rejected and
  disappears; `"23:59"` loses a minute. These helpers convert at the storage
  boundary instead, where the string is known to be an end time.
- `DAY_START_MINUTES` and `DAY_END_MINUTES`, replacing the
  `CONSULTATION_GRID_*` constants. The old names referred to a domain this
  package has nothing to do with.

### Deprecated

- `CONSULTATION_GRID_START_MINUTES` and `CONSULTATION_GRID_END_MINUTES`. They
  remain exported as aliases of the new names, so existing imports keep
  working; they will be removed in a future major version.

## [1.3.0] - 2026-09-06

### Added

- Full keyboard operation. The calendar previously failed WCAG 2.1.1: slots
  could be focused and activated, but not created, moved, resized or removed
  without a pointer.

  - A focused day column takes <kbd>Enter</kbd> or <kbd>Space</kbd> to add a
    slot at the earliest free time on that day.
  - A focused slot takes arrows to move, <kbd>Shift</kbd> with arrows to resize
    from the end edge, and <kbd>Delete</kbd> or <kbd>Backspace</kbd> to remove.
  - Every change is announced in a polite live region, and a move that would
    collide is refused and announced rather than silently dropped.

  The calendar deliberately does not adopt ARIA's `grid` role. That role
  requires `row`/`gridcell` descendants across the whole surface — over a
  thousand cells at a ten-minute snap — which would leave a screen-reader user
  traversing all of them to reach a handful of slots. Slots and columns are
  exposed as labelled buttons instead.

## [1.2.2] - 2026-09-06

### Fixed

- Pointer position now resolves to the correct day column at every width.
  `dayIndexFromClientX` divided the days-grid element's width by seven, but
  below the 768px breakpoint the columns are pinned to a fixed width while the
  grid element still stretches to fill its parent. The buckets then stopped
  lining up with the real columns and a pointer over one day resolved to the
  previous one — drifting a full column by the fourth. It now hit-tests the
  column elements directly.

  Found by the new interaction tests, not by inspection.

### Changed

- Internal: added 14 interaction tests running in real Chromium via Vitest
  browser mode, covering drag to create, move, resize, multi-day spans,
  removal, click-versus-drag and hour-range clipping. jsdom cannot test this
  component — it returns zeros from `getBoundingClientRect`, which every drag
  calculation here depends on.

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

[Unreleased]: https://github.com/meghrajgiri/react-weekly-availability-calendar/compare/v1.6.1...HEAD
[1.6.1]: https://github.com/meghrajgiri/react-weekly-availability-calendar/compare/v1.6.0...v1.6.1
[1.6.0]: https://github.com/meghrajgiri/react-weekly-availability-calendar/compare/v1.5.2...v1.6.0
[1.5.2]: https://github.com/meghrajgiri/react-weekly-availability-calendar/compare/v1.5.1...v1.5.2
[1.5.1]: https://github.com/meghrajgiri/react-weekly-availability-calendar/compare/v1.5.0...v1.5.1
[1.5.0]: https://github.com/meghrajgiri/react-weekly-availability-calendar/compare/v1.4.1...v1.5.0
[1.4.1]: https://github.com/meghrajgiri/react-weekly-availability-calendar/compare/v1.4.0...v1.4.1
[1.4.0]: https://github.com/meghrajgiri/react-weekly-availability-calendar/compare/v1.3.0...v1.4.0
[1.3.0]: https://github.com/meghrajgiri/react-weekly-availability-calendar/compare/v1.2.2...v1.3.0
[1.2.2]: https://github.com/meghrajgiri/react-weekly-availability-calendar/compare/v1.2.1...v1.2.2
[1.2.1]: https://github.com/meghrajgiri/react-weekly-availability-calendar/compare/v1.2.0...v1.2.1
[1.2.0]: https://github.com/meghrajgiri/react-weekly-availability-calendar/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/meghrajgiri/react-weekly-availability-calendar/compare/v1.0.2...v1.1.0
[1.0.2]: https://github.com/meghrajgiri/react-weekly-availability-calendar/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/meghrajgiri/react-weekly-availability-calendar/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/meghrajgiri/react-weekly-availability-calendar/releases/tag/v1.0.0
[0.1.2]: https://github.com/meghrajgiri/react-weekly-availability-calendar/releases/tag/v0.1.2
