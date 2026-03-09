export const CARD_ELEMENT_TAG = "battery-bar";
export const CARD_TYPE = "custom:battery-bar";
export const CARD_NAME = "Battery Bar";

export const DEFAULT_CONFIG = {
  type: CARD_TYPE,
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
  decimals: {
    soc: 0,
    energy: 2,
    temperature: 0,
    voltage: 1,
  },
  colors: {
    background: "#4CAF8E",
    track: "#EAECEF",
    text: "#2E2E2E",
    divider: "#F4F7FA",
    battery_charge: "#4CAF8E",
    battery_discharge: "#2E8B75",
    battery_idle: "#9FA8B2",
  },
};

export const ENTITY_KEYS = [
  "battery_charge",
  "battery_discharge",
  "summary_soc",
  "summary_energy",
  "summary_device_temperature",
  "battery1_soc",
  "battery1_temp",
  "battery1_voltage",
  "battery2_soc",
  "battery2_temp",
  "battery2_voltage",
];

export const DECIMAL_KEYS = ["soc", "energy", "temperature", "voltage"];
export const COLOR_KEYS = ["background", "track", "text", "divider", "battery_charge", "battery_discharge", "battery_idle"];
