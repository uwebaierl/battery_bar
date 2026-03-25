import { migrateLegacyColorConfig } from "./_shared/legacy-config.js";

export const BATTERY_CONFIG_CLEANUP_STEPS = [
  migrateLegacyBatteryColors,
];

export const BATTERY_EDITOR_CLEANUP_STEPS = [
  migrateLegacyBatteryColors,
];

export function migrateLegacyBatteryColors(config) {
  return migrateLegacyColorConfig(config, {
    energy_storage_in: "battery_charge",
    energy_storage_out: "battery_discharge",
    home_load: "battery_idle",
  });
}
