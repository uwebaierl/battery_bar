# Battery Bar

<img style="max-width: 1000px; width: 100%; height: auto;" alt="Battery Bar Overview" src="https://raw.githubusercontent.com/uwebaierl/battery_bar/main/docs/images/battery_bar_01.png" />
<img style="max-width: 1000px; width: 100%; height: auto;" alt="Battery Bar Editor" src="https://raw.githubusercontent.com/uwebaierl/battery_bar/main/docs/images/battery_bar_02.png" />

Battery Bar is a compact Home Assistant Lovelace custom card that displays a summary battery state plus two individual battery columns in a fixed-height bar layout.

## Features

- Summary-first battery overview with support for one or two battery columns
- Primary SoC values with compact secondary metrics for energy, voltage, and temperature
- Shared preset-based color themes with optional manual overrides
- Built-in visual editor for layout, colors, and entities
- Clickable values that open Home Assistant `more-info`
- Missing or unavailable configured entities stay visible as `—` instead of showing misleading fallback values
- Uses Home Assistant's native localized state formatting
- Adjustable height and corner radius to fit compact dashboard layouts
- Adjustable height and corner radius to match [Bubble Card](https://github.com/Clooos/Bubble-Card) layouts cleanly

## Combined Setup

Battery Bar works well together with [PowerFlow Bar](https://github.com/uwebaierl/powerflow_bar) and [House Energy Bar](https://github.com/uwebaierl/house_energy_bar) when you want a compact 3-card energy stack.

<img style="max-width: 1000px; width: 100%; height: auto;" alt="Battery Bar 3-card combined setup" src="https://raw.githubusercontent.com/uwebaierl/battery_bar/main/docs/images/battery_bar_combined_01.png" />

For the complete setup, also see:

- [PowerFlow Bar](https://github.com/uwebaierl/powerflow_bar) for PV, battery, home, and grid flow.
- [House Energy Bar](https://github.com/uwebaierl/house_energy_bar) for daily consumed/saved/returned totals.

## Installation

### HACS (Recommended)

- Add this repository via the link in Home Assistant.

[![Open your Home Assistant instance and open this repository inside HACS.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=uwebaierl&repository=battery_bar&category=plugin)

- **Battery Bar** should now be available in HACS. Click `INSTALL`.
- The Lovelace resource is usually added automatically.
- Reload the Home Assistant frontend if prompted.

### HACS (manual)

1. Ensure HACS is installed.
2. Open HACS and add `https://github.com/uwebaierl/battery_bar` as a custom repository.
3. Select category `Dashboard`.
4. Search for **Battery Bar** and install it.
5. Reload resources if prompted.

If HACS does not add the resource automatically, add this Dashboard resource manually:

```yaml
url: /hacsfiles/battery_bar/battery_bar.js
type: module
```

### Manual Installation

1. Download `battery_bar.js` from the [Releases](../../releases) page.
2. Upload it to `www/community/battery_bar/` in your Home Assistant config directory.
3. Add this resource in Dashboard configuration:

```yaml
url: /local/community/battery_bar/battery_bar.js
type: module
```

## Full Example

```yaml
type: custom:battery-bar
battery_count: 2
bar_height: 56
corner_radius: 28
background_transparent: true
color_preset: preset_1
track_blend: 0.2
entities:
  battery_charge: sensor.battery_charge_power
  battery_discharge: sensor.battery_discharge_power
  summary_soc: sensor.battery_system_soc
  summary_energy: sensor.battery_available_energy
  summary_device_temperature: sensor.battery_device_temperature
  battery1_soc: sensor.battery_1_soc
  battery1_temp: sensor.battery_1_max_cell_temperature
  battery1_voltage: sensor.battery_1_total_voltage
  battery2_soc: sensor.battery_2_soc
  battery2_temp: sensor.battery_2_max_cell_temperature
  battery2_voltage: sensor.battery_2_total_voltage
colors:
  background: "#000000"
  track: "#EAECEF"
  text_light: "#F4F7FA"
  text_dark: "#2E2E2E"
  divider: "#DBDDE0"
  energy_storage_in: "#4CAF8E"
  energy_storage_out: "#2E8B75"
  home_load: "#9FA8B2"
```

## Options

| Option                                | Default           | Notes                                                                 |
| ------------------------------------- | ----------------- | --------------------------------------------------------------------- |
| `type`                                | required          | Must be `custom:battery-bar`                                          |
| `battery_count`                       | `2`               | Set to `1` for true single-battery mode; Battery 2 entities then become optional |
| `bar_height`                          | `56`              | Clamp range `24..72`                                                  |
| `corner_radius`                       | `28`              | Clamp range `0..30`                                                   |
| `background_transparent`              | `true`            | Transparent background when enabled                                   |
| `color_preset`                        | `preset_1`        | Global semantic preset baseline shared across all three cards         |
| `track_blend`                         | preset-dependent  | Range `0.10..0.40`; optional manual override for track/color mixing   |
| `entities.*`                          | defaults provided | Entity mapping for charge/discharge, summary, and both batteries      |
| `entities.summary_device_temperature` | default sensor    | Device temperature shown next to summary energy                       |
| `entities.battery2_*`                 | default sensors   | Required only when `battery_count` is `2`; optional in single-battery mode |
| `colors.background`                   | `#000000`         | Outer card background                                                 |
| `colors.track`                        | `#EAECEF`         | Base track color before charge/discharge blending                     |
| `colors.text_light`                   | `#F4F7FA`         | Light text/icon color used when it gives better contrast              |
| `colors.text_dark`                    | `#2E2E2E`         | Dark text/icon color used when it gives better contrast               |
| `colors.divider`                      | `#DBDDE0`         | Divider color between Summary, Battery 1, and Battery 2               |
| `colors.energy_storage_in`            | `#4CAF8E`         | Battery charging accent blended into the track                        |
| `colors.energy_storage_out`           | `#2E8B75`         | Battery discharging accent blended into the track                     |
| `colors.home_load`                    | `#9FA8B2`         | Neutral/idle accent blended into the track when charge and discharge are `0` |

Track color priority: `energy_storage_out` > `energy_storage_in` > `home_load`.

Color resolution priority for preset-controlled colors: built-in fallback < selected `color_preset` < manual `colors.*` overrides.

Legacy `colors.text` is still accepted and is migrated to both `colors.text_light` and `colors.text_dark`.

`colors.background` stays separate from presets and controls only the outer card background. In the visual editor it is only written to YAML when you explicitly set a non-default background override.

In the visual editor, `Use custom color overrides` turns manual semantic colors and `track_blend` on or off. Background stays independent in `Layout & Motion`, so changing the card background does not activate manual color overrides or block presets.

Preset styles: `preset_1` Classic, `preset_2` Industrial, `preset_3` Coffee, `preset_4` Ocean, `preset_5` Forest.

## Development

Run commands from `battery_bar/`:

```bash
npm run build
npm run check:syntax
```
