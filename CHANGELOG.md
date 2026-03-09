# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog and this project uses Semantic Versioning.

## [Unreleased]

### Changed
- Added configurable `colors.divider` for segment separators (YAML + editor + runtime).
- Switched divider rendering to use `colors.divider` instead of deriving from track/text colors.
- Set top-row primary font size to a fixed `17px`.
- Set second-row chip font size to a fixed `12px`.
- Updated README examples/options to document `colors.divider`.
- Updated README combined setup section to link both companion cards (PowerFlow Bar + House Energy Bar).
- Replaced `battery_bar_combined_01.png` with the newer combined screenshot used by House Energy Bar.

## [1.1.0] - 2026-03-04

### Changed
- Added a built-in Lovelace editor with separate Summary and Batteries sections.
- Grouped Battery 1 and Battery 2 settings into one editor section with shared structure.
- Added editor controls for layout, colors, decimals, and battery count.
- Kept the editor aligned with the existing nested YAML structure for `entities`, `decimals`, and `colors`.
- Updated documentation to reflect editor support.

## [1.0.1] - 2026-03-02

### Changed
- Updated README screenshots to use absolute raw GitHub image URLs for better compatibility with HACS rendering.

## [1.0.0] - 2026-03-02

### Added
- Added `battery_count` with support for one-battery and two-battery layouts.
- Kept the summary column width fixed when rendering the one-battery layout.
- Added summary device temperature and dynamic track styling for charge, discharge, and idle states.

### Changed
- Refreshed the README installation instructions with recommended HACS, manual HACS, and manual installation flows.
- Added README screenshots and fixed text color application in the card.

## [0.1.0] - 2026-03-01

### Added

- Initial public release of Battery Bar.
- Compact three-column battery status card for Home Assistant dashboards.
- Nested configuration for entity mappings, decimals, and colors.
- Per-value `more-info` actions and graceful handling for missing or unavailable entity states.
