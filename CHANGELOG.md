# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed

- `hhmmToMinutes` no longer returns `NaN` for malformed time strings, and now
  clamps its result to the grid range. Previously a bad value from a consumer
  could propagate into layout as `NaN` CSS offsets.

### Changed

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
