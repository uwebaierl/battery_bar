# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog and this project uses Semantic Versioning.

## [Unreleased]

### Changed
- Removed the forced full-width preview placeholder wrapper so the chooser/editor description centers correctly.
- Shortened the chooser/editor preview description so Battery Bar aligns more evenly with the other card previews.
- Fixed the incomplete-config preview so Battery Bar now shows only the centered description text instead of text plus an empty bar shell.
- Fixed the chooser/editor preview refactor so the normal Battery Bar layout keeps its full-width section grid instead of collapsing into a broken wrapped column.
- Aligned the incomplete-config chooser/editor preview with the other cards and moved repeated editor color-state and selector-range helpers into shared workspace modules.
- Removed prefilled example entity ids, removed hardcoded metric fallback labels/titles, and made preset colors the only semantic color baseline outside explicit manual overrides.
- Removed the remaining legacy decimal cleanup and raw-state formatting fallback so displayed values now rely only on Home Assistant's entity formatting.
- Removed hardcoded battery metric icon fallbacks so visible icons now always come from the configured Home Assistant entities.
- Stopped persisting default `colors.background` in YAML from the visual editor when no explicit background override is set.
- Updated the shared `Industrial`, `Coffee`, `Ocean`, and `Forest` preset palettes, including their `text_light` and `text_dark` values.
- Added shared `text_light` and `text_dark` color tokens with automatic contrast-based text selection, while migrating legacy `colors.text` overrides to both tokens.
- Seed the manual color override fields with the currently effective hex values when color overrides are enabled in the visual editor.
- Merged the editor `Colors` section into the same Home Assistant `ha-form` panel stack as the other sections so section spacing now matches the native expandable layout.
- Finalized the shared preset labels and token values for `Industrial`, `Coffee`, `Ocean`, and `Forest`; `Classic` remains unchanged.
- Fixed the editor so `colors.background` stays independent from manual semantic color overrides and no longer flips the override toggle on by itself.
- Restored `track_blend` as an optional manual override, exposed it in the Colors section when custom overrides are enabled, and kept the `0.10..0.40` range.
- Normalized unavailable metric handling so configured sensors stay visible as `—` and only ready metrics open Home Assistant `more-info`.
- Switched value formatting to Home Assistant's native entity formatter and removed the card-specific decimal controls from docs/editor output.
- Made `battery_count: 1` a true single-battery mode so Battery 2 entities are no longer required by validation, normalization, or the editor.
- Added shared `color_preset` support with `preset_1` matching the current/default Battery Bar palette.
- Manual `colors.*` entries now override the selected preset instead of being ignored.
- Added a `Use custom color overrides` toggle in the Colors section that seeds the current colors when enabled and removes stored overrides when disabled.
- Moved the color controls into a dedicated second Colors section in the visual editor and renamed the preset labels to `Classic`, `Utility`, `Solar Warm`, `Ocean`, and `Forest`.
- Removed the required markers from the color preset and manual color fields in the visual editor.
- Refactored Battery Bar colors to use the shared global semantic tokens (`energy_storage_in`, `energy_storage_out`, `home_load`, etc.) instead of card-specific preset keys.
- Added automatic migration for legacy `colors.battery_charge`, `colors.battery_discharge`, and `colors.battery_idle` overrides.
- Replaced `preset_2` to `preset_5` with new cohesive palettes: Utility, Solar Warm, Ocean, and Forest. `preset_1` remains unchanged.
- Removed `background` from shared presets and moved background editing into the Layout & Motion section of the editor.

## [1.2.0] - 2026-03-14

### Changed
- Refactored the Lovelace editor to use Home Assistant's native `ha-form` rendering (removed custom editor CSS/markup).
- Updated editor field labels to short, descriptive wording across layout, colors, decimals, and entities.
- Added configurable `colors.divider` for segment separators (YAML + editor + runtime).
- Switched divider rendering to use `colors.divider` instead of deriving from track/text colors.
- Set top-row primary font size to a fixed `17px`.
- Set second-row chip font size to a fixed `12px`.
- Updated README examples/options to document `colors.divider`.
- Updated README combined setup section to link both companion cards (PowerFlow Bar + House Energy Bar).
- Replaced `battery_bar_combined_01.png` with the newer combined screenshot used by House Energy Bar.
- Changed default `background_transparent` to `true` in code and docs.
- Removed the `Screenshots` heading from README while keeping images in place.

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
