import {
  BATTERY2_ENTITY_KEYS,
  CARD_TYPE,
  COLOR_KEYS,
  DEFAULT_CONFIG,
  REQUIRED_ENTITY_KEYS,
} from "./constants.js";
import {
  isKnownColorPreset,
  mergeColorPresetTokens,
  resolveColorPresetTrackBlend,
} from "./_shared/color-presets.js";
import {
  normalizeEntity,
  normalizeMappedStringValues,
  normalizeObjectInput,
  normalizeOptionalEntity,
  normalizeString,
  validateCardType,
  validateColorPresetValue,
  validateConfigObject,
  validateIntegerRange,
  validateOptionalEntityMap,
  validateRange,
  validateRequiredColorMap,
  validateRequiredEntityMap,
} from "./_shared/validation.js";

const BATTERY_COLOR_OVERRIDE_MAP = {
  track: ["track"],
  text_light: ["text_light", "text"],
  text_dark: ["text_dark", "text"],
  divider: ["divider"],
  energy_storage_in: ["energy_storage_in", "battery_charge"],
  energy_storage_out: ["energy_storage_out", "battery_discharge"],
  home_load: ["home_load", "battery_idle"],
};

export function validateConfig(config) {
  validateConfigObject(config);
  validateCardType(config, CARD_TYPE);

  validateIntegerRange(config.battery_count, "battery_count", 1, 2);
  validateRange(config.bar_height, "bar_height", 24, 72);
  validateRange(config.corner_radius, "corner_radius", 0, 30);
  validateRange(config.track_blend, "track_blend", 0.1, 0.4);
  validateColorPresetValue(config.color_preset, isKnownColorPreset);

  if (typeof config.background_transparent !== "boolean") {
    throw new Error("background_transparent must be true or false.");
  }

  validateRequiredEntityMap(config.entities, REQUIRED_ENTITY_KEYS);
  if (config.battery_count === 2) {
    for (const key of BATTERY2_ENTITY_KEYS) {
      const value = config.entities?.[key];
      if (typeof value !== "string" || value.trim().length === 0) {
        throw new Error(`entities.${key} must be a non-empty entity id string when battery_count is 2.`);
      }
    }
  } else {
    validateOptionalEntityMap(config.entities, BATTERY2_ENTITY_KEYS);
  }

  validateRequiredColorMap(config.colors, COLOR_KEYS);
}

export function normalizeConfig(config) {
  const source = config && typeof config === "object" ? config : {};
  const batteryCount = source.battery_count === undefined
    ? DEFAULT_CONFIG.battery_count
    : Number(source.battery_count);
  const entitiesInput = normalizeObjectInput(source.entities);
  const colorsInput = normalizeObjectInput(source.colors);

  return {
    type: CARD_TYPE,
    color_preset: source.color_preset === undefined ? DEFAULT_CONFIG.color_preset : source.color_preset,
    battery_count: batteryCount,
    bar_height: source.bar_height === undefined ? DEFAULT_CONFIG.bar_height : Number(source.bar_height),
    corner_radius: source.corner_radius === undefined ? DEFAULT_CONFIG.corner_radius : Number(source.corner_radius),
    track_blend: source.track_blend === undefined
      ? resolveColorPresetTrackBlend(source.color_preset, DEFAULT_CONFIG.track_blend)
      : Number(source.track_blend),
    background_transparent: source.background_transparent === undefined
      ? DEFAULT_CONFIG.background_transparent
      : source.background_transparent,
    entities: {
      battery_charge: normalizeEntity(entitiesInput.battery_charge),
      battery_discharge: normalizeEntity(entitiesInput.battery_discharge),
      summary_soc: normalizeEntity(entitiesInput.summary_soc),
      summary_energy: normalizeEntity(entitiesInput.summary_energy),
      summary_device_temperature: normalizeEntity(entitiesInput.summary_device_temperature),
      battery1_soc: normalizeEntity(entitiesInput.battery1_soc),
      battery1_temp: normalizeEntity(entitiesInput.battery1_temp),
      battery1_voltage: normalizeEntity(entitiesInput.battery1_voltage),
      battery2_soc: batteryCount === 2
        ? normalizeEntity(entitiesInput.battery2_soc)
        : normalizeOptionalEntity(entitiesInput.battery2_soc),
      battery2_temp: batteryCount === 2
        ? normalizeEntity(entitiesInput.battery2_temp)
        : normalizeOptionalEntity(entitiesInput.battery2_temp),
      battery2_voltage: batteryCount === 2
        ? normalizeEntity(entitiesInput.battery2_voltage)
        : normalizeOptionalEntity(entitiesInput.battery2_voltage),
    },
    colors: {
      background: normalizeString(colorsInput.background, DEFAULT_CONFIG.colors.background),
      ...mergeColorPresetTokens(
        source.color_preset,
        {},
        normalizeMappedStringValues(colorsInput, BATTERY_COLOR_OVERRIDE_MAP, null),
      ),
    },
  };
}
