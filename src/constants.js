export const CARD_ELEMENT_TAG = "battery-bar";
export const CARD_TYPE = "custom:battery-bar";
export const CARD_NAME = "Battery Bar";

export const DEFAULT_CONFIG = {
  type: CARD_TYPE,
  color_preset: "preset_1",
  battery_count: 2,
  bar_height: 56,
  corner_radius: 28,
  track_blend: 0.2,
  background_transparent: true,
  entities: {
    battery_charge: "sensor.battery_charge_power",
    battery_discharge: "sensor.battery_discharge_power",
    summary_soc: "sensor.battery_system_soc",
    summary_energy: "sensor.battery_available_energy",
    summary_device_temperature: "sensor.battery_device_temperature",
    battery1_soc: "sensor.battery_1_soc",
    battery1_temp: "sensor.battery_1_max_cell_temperature",
    battery1_voltage: "sensor.battery_1_total_voltage",
    battery2_soc: "sensor.battery_2_soc",
    battery2_temp: "sensor.battery_2_max_cell_temperature",
    battery2_voltage: "sensor.battery_2_total_voltage",
  },
  colors: {
    background: "#000000",
    track: "#EAECEF",
    text_light: "#F4F7FA",
    text_dark: "#2E2E2E",
    divider: "#DBDDE0",
    energy_storage_in: "#4CAF8E",
    energy_storage_out: "#2E8B75",
    home_load: "#9FA8B2",
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
