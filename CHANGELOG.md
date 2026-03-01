# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog and this project uses Semantic Versioning.

## [Unreleased]

### Added
- Added `battery_count` with support for one-battery and two-battery layouts.
- Kept the summary column width fixed when rendering the one-battery layout.

### Changed
- Refreshed the README installation instructions with recommended HACS, manual HACS, and manual installation flows.

## [0.1.0] - 2026-03-01

### Added

- Initial public release of Battery Bar.
- Compact three-column battery status card for Home Assistant dashboards.
- Nested configuration for entity mappings, decimals, and colors.
- Per-value `more-info` actions and graceful handling for missing or unavailable entity states.
