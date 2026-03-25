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
  normalizeColorPresetName,
  resolveColorPresetTrackBlend,
} from "./_shared/color-presets.js";

export function validateConfig(config) {
  if (!config || typeof config !== "object") {
    throw new Error("Invalid configuration.");
  }

  if (config.type !== CARD_TYPE) {
    throw new Error(`Card type must be '${CARD_TYPE}'.`);
  }

  validateIntegerRange(config.battery_count, "battery_count", 1, 2);
  validateRange(config.bar_height, "bar_height", 24, 72);
  validateRange(config.corner_radius, "corner_radius", 0, 30);
  validateRange(config.track_blend, "track_blend", 0.1, 0.4);
  validateColorPreset(config.color_preset);

  if (typeof config.background_transparent !== "boolean") {
    throw new Error("background_transparent must be true or false.");
  }

  if (!config.entities || typeof config.entities !== "object") {
    throw new Error("entities must be an object.");
  }
  for (const key of REQUIRED_ENTITY_KEYS) {
    const value = config.entities[key];
    if (typeof value !== "string" || value.trim().length === 0) {
      throw new Error(`entities.${key} must be a non-empty entity id string.`);
    }
  }
  if (config.battery_count === 2) {
    for (const key of BATTERY2_ENTITY_KEYS) {
      const value = config.entities[key];
      if (typeof value !== "string" || value.trim().length === 0) {
        throw new Error(`entities.${key} must be a non-empty entity id string when battery_count is 2.`);
      }
    }
  } else {
    for (const key of BATTERY2_ENTITY_KEYS) {
      const value = config.entities[key];
      if (value !== undefined && value !== null && typeof value !== "string") {
        throw new Error(`entities.${key} must be an entity id string when set.`);
      }
    }
  }

  if (!config.colors || typeof config.colors !== "object") {
    throw new Error("colors must be an object.");
  }
  for (const key of COLOR_KEYS) {
    const value = config.colors[key];
    if (typeof value !== "string" || value.trim().length === 0) {
      throw new Error(`colors.${key} must be a non-empty color string.`);
    }
  }
}

export function normalizeConfig(config) {
  const source = config && typeof config === "object" ? config : {};
  const batteryCount = clampInteger(source.battery_count, 1, 2, DEFAULT_CONFIG.battery_count);
  const entitiesInput = source.entities && typeof source.entities === "object" ? source.entities : {};
  const colorsInput = source.colors && typeof source.colors === "object" ? source.colors : {};

  return {
    type: CARD_TYPE,
    color_preset: normalizeColorPresetName(source.color_preset),
    battery_count: batteryCount,
    bar_height: clampNumber(source.bar_height, 24, 72, DEFAULT_CONFIG.bar_height),
    corner_radius: clampNumber(source.corner_radius, 0, 30, DEFAULT_CONFIG.corner_radius),
    track_blend: clampNumber(
      source.track_blend,
      0.1,
      0.4,
      resolveColorPresetTrackBlend(source.color_preset, DEFAULT_CONFIG.track_blend),
    ),
    background_transparent: typeof source.background_transparent === "boolean"
      ? source.background_transparent
      : DEFAULT_CONFIG.background_transparent,
    entities: {
      battery_charge: normalizeEntity(entitiesInput.battery_charge, DEFAULT_CONFIG.entities.battery_charge),
      battery_discharge: normalizeEntity(entitiesInput.battery_discharge, DEFAULT_CONFIG.entities.battery_discharge),
      summary_soc: normalizeEntity(entitiesInput.summary_soc, DEFAULT_CONFIG.entities.summary_soc),
      summary_energy: normalizeEntity(entitiesInput.summary_energy, DEFAULT_CONFIG.entities.summary_energy),
      summary_device_temperature: normalizeEntity(
        entitiesInput.summary_device_temperature,
        DEFAULT_CONFIG.entities.summary_device_temperature,
      ),
      battery1_soc: normalizeEntity(entitiesInput.battery1_soc, DEFAULT_CONFIG.entities.battery1_soc),
      battery1_temp: normalizeEntity(entitiesInput.battery1_temp, DEFAULT_CONFIG.entities.battery1_temp),
      battery1_voltage: normalizeEntity(entitiesInput.battery1_voltage, DEFAULT_CONFIG.entities.battery1_voltage),
      battery2_soc: batteryCount === 2
        ? normalizeEntity(entitiesInput.battery2_soc, DEFAULT_CONFIG.entities.battery2_soc)
        : normalizeOptionalEntity(entitiesInput.battery2_soc),
      battery2_temp: batteryCount === 2
        ? normalizeEntity(entitiesInput.battery2_temp, DEFAULT_CONFIG.entities.battery2_temp)
        : normalizeOptionalEntity(entitiesInput.battery2_temp),
      battery2_voltage: batteryCount === 2
        ? normalizeEntity(entitiesInput.battery2_voltage, DEFAULT_CONFIG.entities.battery2_voltage)
        : normalizeOptionalEntity(entitiesInput.battery2_voltage),
    },
    colors: mergeColorPresetTokens(
      source.color_preset,
      DEFAULT_CONFIG.colors,
      normalizeColorOverrides(colorsInput),
    ),
  };
}

function validateRange(value, key, min, max) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < min || n > max) {
    throw new Error(`${key} must be a number between ${min} and ${max}.`);
  }
}

function validateIntegerRange(value, key, min, max) {
  const n = Number(value);
  if (!Number.isInteger(n) || n < min || n > max) {
    throw new Error(`${key} must be an integer between ${min} and ${max}.`);
  }
}

function clampNumber(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, n));
}

function clampInteger(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isInteger(n)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, n));
}

function validateColorPreset(value) {
  if (value === undefined) {
    return;
  }
  if (!isKnownColorPreset(value)) {
    throw new Error("color_preset must be a supported preset name.");
  }
}

function normalizeColor(value, fallback) {
  if (typeof value !== "string" || value.trim().length === 0) {
    return fallback;
  }
  return value.trim();
}

function normalizeEntity(value, fallback) {
  if (typeof value !== "string" || value.trim().length === 0) {
    return fallback;
  }
  return value.trim();
}

function normalizeOptionalEntity(value) {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim();
}

function normalizeColorOverrides(colorsInput) {
  return {
    background: normalizeColor(colorsInput.background, null),
    track: normalizeColor(colorsInput.track, null),
    text_light: normalizeColor(colorsInput.text_light ?? colorsInput.text, null),
    text_dark: normalizeColor(colorsInput.text_dark ?? colorsInput.text, null),
    divider: normalizeColor(colorsInput.divider, null),
    energy_storage_in: normalizeColor(
      colorsInput.energy_storage_in ?? colorsInput.battery_charge,
      null,
    ),
    energy_storage_out: normalizeColor(
      colorsInput.energy_storage_out ?? colorsInput.battery_discharge,
      null,
    ),
    home_load: normalizeColor(
      colorsInput.home_load ?? colorsInput.battery_idle,
      null,
    ),
  };
}
