import {
  DEFAULT_BAR_HEIGHT_PX,
  DEFAULT_RADIUS_PX,
} from "./_shared/layout-tokens.js";

export const CARD_ELEMENT_TAG = "battery-bar";
export const CARD_TYPE = "custom:battery-bar";
export const CARD_NAME = "Battery Bar";

export const DEFAULT_CONFIG = {
  type: CARD_TYPE,
  color_preset: "preset_1",
  battery_count: 2,
  bar_height: DEFAULT_BAR_HEIGHT_PX,
  corner_radius: DEFAULT_RADIUS_PX,
  track_blend: 0.2,
  background_transparent: true,
  entities: {
    battery_charge: "",
    battery_discharge: "",
    summary_soc: "",
    summary_energy: "",
    summary_device_temperature: "",
    battery1_soc: "",
    battery1_temp: "",
    battery1_voltage: "",
    battery2_soc: "",
    battery2_temp: "",
    battery2_voltage: "",
  },
  colors: {
    background: "#000000",
  },
};

export const REQUIRED_ENTITY_KEYS = [
  "battery_charge",
  "battery_discharge",
  "summary_soc",
  "summary_energy",
  "summary_device_temperature",
  "battery1_soc",
  "battery1_temp",
  "battery1_voltage",
];
export const BATTERY2_ENTITY_KEYS = [
  "battery2_soc",
  "battery2_temp",
  "battery2_voltage",
];
export const ENTITY_KEYS = [...REQUIRED_ENTITY_KEYS, ...BATTERY2_ENTITY_KEYS];
export const COLOR_KEYS = [
  "background",
  "track",
  "text_light",
  "text_dark",
  "divider",
  "energy_storage_in",
  "energy_storage_out",
  "home_load",
];
