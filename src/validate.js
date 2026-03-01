import { CARD_TYPE, COLOR_KEYS, DECIMAL_KEYS, DEFAULT_CONFIG, ENTITY_KEYS } from "./constants.js";

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
  validateRange(config.track_blend, "track_blend", 0.15, 0.3);

  if (typeof config.background_transparent !== "boolean") {
    throw new Error("background_transparent must be true or false.");
  }

  if (!config.entities || typeof config.entities !== "object") {
    throw new Error("entities must be an object.");
  }
  for (const key of ENTITY_KEYS) {
    const value = config.entities[key];
    if (typeof value !== "string" || value.trim().length === 0) {
      throw new Error(`entities.${key} must be a non-empty entity id string.`);
    }
  }

  if (!config.decimals || typeof config.decimals !== "object") {
    throw new Error("decimals must be an object.");
  }
  for (const key of DECIMAL_KEYS) {
    validateIntegerRange(config.decimals[key], `decimals.${key}`, 0, 2);
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
  const entitiesInput = source.entities && typeof source.entities === "object" ? source.entities : {};
  const decimalsInput = source.decimals && typeof source.decimals === "object" ? source.decimals : {};
  const colorsInput = source.colors && typeof source.colors === "object" ? source.colors : {};

  return {
    type: CARD_TYPE,
    battery_count: clampInteger(source.battery_count, 1, 2, DEFAULT_CONFIG.battery_count),
    bar_height: clampNumber(source.bar_height, 24, 72, DEFAULT_CONFIG.bar_height),
    corner_radius: clampNumber(source.corner_radius, 0, 30, DEFAULT_CONFIG.corner_radius),
    track_blend: clampNumber(source.track_blend, 0.15, 0.3, DEFAULT_CONFIG.track_blend),
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
      battery2_soc: normalizeEntity(entitiesInput.battery2_soc, DEFAULT_CONFIG.entities.battery2_soc),
      battery2_temp: normalizeEntity(entitiesInput.battery2_temp, DEFAULT_CONFIG.entities.battery2_temp),
      battery2_voltage: normalizeEntity(entitiesInput.battery2_voltage, DEFAULT_CONFIG.entities.battery2_voltage),
    },
    decimals: {
      soc: clampDecimal(decimalsInput.soc, DEFAULT_CONFIG.decimals.soc),
      energy: clampDecimal(decimalsInput.energy, DEFAULT_CONFIG.decimals.energy),
      temperature: clampDecimal(decimalsInput.temperature, DEFAULT_CONFIG.decimals.temperature),
      voltage: clampDecimal(decimalsInput.voltage, DEFAULT_CONFIG.decimals.voltage),
    },
    colors: {
      background: normalizeColor(colorsInput.background, DEFAULT_CONFIG.colors.background),
      track: normalizeColor(colorsInput.track, DEFAULT_CONFIG.colors.track),
      text: normalizeColor(colorsInput.text, DEFAULT_CONFIG.colors.text),
      battery_charge: normalizeColor(colorsInput.battery_charge, DEFAULT_CONFIG.colors.battery_charge),
      battery_discharge: normalizeColor(colorsInput.battery_discharge, DEFAULT_CONFIG.colors.battery_discharge),
      battery_idle: normalizeColor(colorsInput.battery_idle, DEFAULT_CONFIG.colors.battery_idle),
    },
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

function clampDecimal(value, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) {
    return fallback;
  }
  return Math.min(2, Math.max(0, Math.round(n)));
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
