/* Battery Bar - generated file. Do not edit directly. */
/* src/_shared/availability.js */
const UNAVAILABLE_STATES = new Set(["", "unknown", "unavailable", "none", "null", "nan"]);

function isUnavailableState(raw) {
  return UNAVAILABLE_STATES.has(`${raw ?? ""}`.trim().toLowerCase());
}

function resolveEntityStatus(entityId, stateObj) {
  if (!entityId) {
    return "omitted";
  }
  if (!stateObj) {
    return "missing";
  }

  const rawState = `${stateObj.state ?? ""}`.trim();
  return isUnavailableState(rawState) ? "unavailable" : "ready";
}

/* src/_shared/entity-format.js */
function formatEntityStateValue(hass, stateObj, overrideState) {
  if (!stateObj) {
    return "—";
  }

  const raw = overrideState ?? stateObj.state;
  if (isUnavailableState(raw)) {
    return "—";
  }

  if (typeof hass?.formatEntityState === "function") {
    try {
      return hass.formatEntityState(stateObj, String(raw));
    } catch (_error) {
      // Fall back to a basic raw-state formatter for older HA versions.
    }
  }

  return fallbackFormatEntityState(stateObj, raw);
}

function fallbackFormatEntityState(stateObj, raw) {
  const text = String(raw ?? "").trim();
  if (!text) {
    return "—";
  }

  const unit = `${stateObj.attributes?.unit_of_measurement ?? ""}`.trim();
  return unit ? `${text} ${unit}` : text;
}

/* src/battery-model.js */
const DEFAULT_METRIC_ICONS = {
  soc: "mdi:battery-medium",
  energy: "mdi:home-battery-outline",
  temperature: "mdi:thermometer",
  voltage: "mdi:sine-wave",
};

function collectRelevantEntities(config) {
  const entities = config?.entities || {};
  const ids = [
    entities.battery_charge,
    entities.battery_discharge,
    entities.summary_soc,
    entities.summary_energy,
    entities.summary_device_temperature,
    entities.battery1_soc,
    entities.battery1_temp,
    entities.battery1_voltage,
  ];

  if ((config?.battery_count || 2) === 2) {
    ids.push(
      entities.battery2_soc,
      entities.battery2_temp,
      entities.battery2_voltage,
    );
  }

  return ids
    .filter((entityId) => typeof entityId === "string" && entityId.length > 0);
}

function buildCardModel(config, hass) {
  const entities = config?.entities || {};
  const batteryCount = config?.battery_count || 2;

  return {
    summary: {
      primary: buildMetricView(hass, entities.summary_soc, "soc", "Total state of charge"),
      chips: [
        buildMetricView(hass, entities.summary_energy, "energy", "Available energy"),
        buildMetricView(
          hass,
          entities.summary_device_temperature,
          "temperature",
          "Device temperature",
        ),
      ],
    },
    battery1: {
      primary: buildMetricView(hass, entities.battery1_soc, "soc", "Battery 1 state of charge"),
      chips: [
        buildMetricView(hass, entities.battery1_voltage, "voltage", "Battery 1 total voltage"),
        buildMetricView(hass, entities.battery1_temp, "temperature", "Battery 1 max cell temperature"),
      ],
    },
    battery2: batteryCount === 2
      ? {
        primary: buildMetricView(hass, entities.battery2_soc, "soc", "Battery 2 state of charge"),
        chips: [
          buildMetricView(hass, entities.battery2_voltage, "voltage", "Battery 2 total voltage"),
          buildMetricView(hass, entities.battery2_temp, "temperature", "Battery 2 max cell temperature"),
        ],
      }
      : null,
  };
}

function buildMetricView(hass, entityId, kind, fallbackLabel) {
  const stateObj = entityId ? hass?.states?.[entityId] : null;
  const status = resolveEntityStatus(entityId, stateObj);
  const friendlyName = stateObj?.attributes?.friendly_name || fallbackLabel;
  const value = formatMetricValue(hass, stateObj);

  return {
    entityId: status === "ready" ? entityId || "" : "",
    icon: resolveMetricIcon(stateObj, kind),
    value,
    title: buildMetricTitle(friendlyName, fallbackLabel, value, status),
    available: status === "ready",
    configured: status !== "omitted",
    status,
  };
}

function buildMetricTitle(friendlyName, fallbackLabel, value, status) {
  if (status === "ready") {
    return `${friendlyName}: ${value}`;
  }
  if (status === "omitted") {
    return fallbackLabel;
  }
  return `${friendlyName}: unavailable`;
}

function resolveMetricIcon(stateObj, kind) {
  const explicitIcon = `${stateObj?.attributes?.icon ?? ""}`.trim();
  if (explicitIcon) {
    return explicitIcon;
  }
  if (kind === "soc") {
    return resolveSocIcon(stateObj?.state);
  }
  return DEFAULT_METRIC_ICONS[kind] || "";
}

function resolveSocIcon(rawState) {
  const numeric = parseNumericState(rawState);
  if (numeric === null) {
    return DEFAULT_METRIC_ICONS.soc;
  }

  if (numeric >= 95) {
    return "mdi:battery";
  }
  if (numeric <= 5) {
    return "mdi:battery-outline";
  }

  const bucket = Math.min(90, Math.max(10, Math.round(numeric / 10) * 10));
  return `mdi:battery-${bucket}`;
}

function formatMetricValue(hass, stateObj) {
  return formatEntityStateValue(hass, stateObj);
}

function parseNumericState(raw) {
  const trimmed = `${raw ?? ""}`.trim();
  if (!trimmed) {
    return null;
  }

  const direct = Number(trimmed);
  if (Number.isFinite(direct)) {
    return direct;
  }

  const normalized = trimmed.replace(",", ".");
  const match = normalized.match(/^-?\d+(?:\.\d+)?/);
  if (!match) {
    return null;
  }

  const parsed = Number(match[0]);
  return Number.isFinite(parsed) ? parsed : null;
}

/* src/_shared/color-presets.js */
const COLOR_TOKEN_KEYS = [
  "track",
  "text_light",
  "text_dark",
  "divider",
  "energy_source",
  "energy_storage_in",
  "energy_storage_out",
  "energy_storage_supply",
  "home_load",
  "grid_import",
  "grid_export",
];

const PRESET_OPTIONS = [
  { value: "preset_1", label: "Classic" },
  { value: "preset_2", label: "Industrial" },
  { value: "preset_3", label: "Coffee" },
  { value: "preset_4", label: "Ocean" },
  { value: "preset_5", label: "Forest" },
];

const COLOR_PRESETS = {
  preset_1: {
    track: "#EAECEF",
    text_light: "#F4F7FA",
    text_dark: "#2E2E2E",
    divider: "#DBDDE0",
    energy_source: "#E6C86E",
    energy_storage_in: "#4CAF8E",
    energy_storage_out: "#2E8B75",
    energy_storage_supply: "#5B9BCF",
    home_load: "#9FA8B2",
    grid_import: "#C99A6A",
    grid_export: "#8C6BB3",
    track_blend: 0.15,
  },
  preset_2: {
    track: "#888888",
    text_light: "#F5F5F5",
    text_dark: "#2A2A2A",
    divider: "#BBBBBB",
    energy_source: "#EEEEEE",
    energy_storage_in: "#DDDDDD",
    energy_storage_out: "#CCCCCC",
    energy_storage_supply: "#E4E4E4",
    home_load: "#BBBBBB",
    grid_import: "#AAAAAA",
    grid_export: "#F4F4F4",
    track_blend: 0.20,
  },
  preset_3: {
    track: "#8B5A34",
    text_light: "#FDF4EC",
    text_dark: "#2E1A08",
    divider: "#D0A77C",
    energy_source: "#F8E8D8",
    energy_storage_in: "#F0DAC5",
    energy_storage_out: "#E8CBAE",
    energy_storage_supply: "#F4E2CE",
    home_load: "#E2BC95",
    grid_import: "#D0A77C",
    grid_export: "#FDF6F0",
    track_blend: 0.22,
  },
  preset_4: {
    track: "#2E6A8A",
    text_light: "#EDF7FF",
    text_dark: "#0D2E3F",
    divider: "#6DA9C7",
    energy_source: "#C3EBFF",
    energy_storage_in: "#A0CEE5",
    energy_storage_out: "#7FB6D2",
    energy_storage_supply: "#B4DAF0",
    home_load: "#6DA9C7",
    grid_import: "#5B96B4",
    grid_export: "#D8F1FF",
    track_blend: 0.20,
  },
  preset_5: {
    track: "#4A7D52",
    text_light: "#F2FAF3",
    text_dark: "#1A3320",
    divider: "#C8E1CC",
    energy_source: "#E8F4EA",
    energy_storage_in: "#D2E7D6",
    energy_storage_out: "#B8D8BE",
    energy_storage_supply: "#DEEEE1",
    home_load: "#C8E1CC",
    grid_import: "#A8CAB0",
    grid_export: "#F2FAF3",
    track_blend: 0.20,
  },
};

function getColorPresetOptions() {
  return PRESET_OPTIONS.map((option) => ({ ...option }));
}

function isKnownColorPreset(presetName) {
  return Boolean(COLOR_PRESETS[presetName]);
}

function normalizeColorPresetName(presetName) {
  return isKnownColorPreset(presetName) ? presetName : "preset_1";
}

function resolveColorPresetTokens(presetName) {
  const normalizedName = normalizeColorPresetName(presetName);
  return {
    ...pickColorTokens(COLOR_PRESETS[normalizedName] || {}),
  };
}

function mergeColorPresetTokens(presetName, fallbackTokens, manualOverrides) {
  const presetTokens = resolveColorPresetTokens(presetName);
  return {
    ...(fallbackTokens || {}),
    ...presetTokens,
    ...filterDefinedEntries(manualOverrides),
  };
}

function resolveColorPresetTrackBlend(presetName, fallbackTrackBlend) {
  const normalizedName = normalizeColorPresetName(presetName);
  const trackBlend = COLOR_PRESETS[normalizedName]?.track_blend;
  return Number.isFinite(trackBlend) ? trackBlend : fallbackTrackBlend;
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function filterDefinedEntries(value) {
  if (!isPlainObject(value)) {
    return {};
  }

  return Object.entries(value).reduce((result, [key, entry]) => {
    if (entry !== undefined && entry !== null) {
      result[key] = entry;
    }
    return result;
  }, {});
}

function pickColorTokens(preset) {
  return COLOR_TOKEN_KEYS.reduce((result, key) => {
    if (preset[key] !== undefined) {
      result[key] = preset[key];
    }
    return result;
  }, {});
}

/* src/_shared/config-cleanup.js */
function createRemovePathsCleanup(paths) {
  const normalizedPaths = Array.isArray(paths) ? paths : [];
  return (config) => removeConfigPaths(config, normalizedPaths);
}

function runConfigCleanup(config, steps) {
  const source = isObject(config) ? cloneConfig(config) : {};
  let next = source;

  for (const step of Array.isArray(steps) ? steps : []) {
    if (typeof step !== "function") {
      continue;
    }
    const candidate = step(next);
    if (isObject(candidate)) {
      next = candidate;
    }
  }

  return {
    config: next,
    changed: computeConfigCleanupKey(source) !== computeConfigCleanupKey(next),
  };
}

function queueConfigCleanup(host, config, state) {
  if (!host || !isObject(config) || !isObject(state)) {
    return;
  }

  const cleanupKey = computeConfigCleanupKey(config);
  if (!cleanupKey || state.pendingKey === cleanupKey || state.lastAppliedKey === cleanupKey) {
    return;
  }

  state.pendingKey = cleanupKey;
  state.pendingConfig = config;
  flushConfigCleanup(host, state);
}

function emitConfigChanged(host, config) {
  if (!host || !isObject(config)) {
    return;
  }

  host.dispatchEvent(new CustomEvent("config-changed", {
    detail: { config },
    bubbles: true,
    composed: true,
  }));
}

function computeConfigCleanupKey(config) {
  if (!isObject(config)) {
    return "";
  }
  return JSON.stringify(config);
}

function flushConfigCleanup(host, state) {
  if (!host || !isObject(state) || !state.pendingKey || !isObject(state.pendingConfig) || !host.isConnected) {
    return;
  }

  const cleanupKey = state.pendingKey;
  queueMicrotask(() => {
    if (!host.isConnected || state.pendingKey !== cleanupKey || !isObject(state.pendingConfig)) {
      return;
    }

    const config = state.pendingConfig;
    state.pendingKey = "";
    state.pendingConfig = null;
    state.lastAppliedKey = cleanupKey;
    emitConfigChanged(host, config);
  });
}

function removeConfigPaths(config, paths) {
  let next = config;

  for (const path of paths) {
    const segments = normalizePath(path);
    if (segments.length === 0) {
      continue;
    }
    next = removeConfigPath(next, segments);
  }

  return next;
}

function removeConfigPath(config, segments) {
  if (!isObject(config) || segments.length === 0) {
    return config;
  }

  const [segment, ...rest] = segments;
  if (!(segment in config)) {
    return config;
  }

  if (rest.length === 0) {
    const next = { ...config };
    delete next[segment];
    return next;
  }

  const child = config[segment];
  if (!isObject(child)) {
    return config;
  }

  const nextChild = removeConfigPath(child, rest);
  if (nextChild === child) {
    return config;
  }

  return {
    ...config,
    [segment]: nextChild,
  };
}

function normalizePath(path) {
  if (Array.isArray(path)) {
    return path.filter((segment) => typeof segment === "string" && segment.length > 0);
  }
  if (typeof path !== "string" || path.trim().length === 0) {
    return [];
  }
  return path.split(".").map((segment) => segment.trim()).filter(Boolean);
}

function cloneConfig(config) {
  if (typeof structuredClone === "function") {
    return structuredClone(config);
  }
  return JSON.parse(JSON.stringify(config));
}

function isObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

/* src/_shared/math.js */
function clamp(min, value, max) {
  return Math.max(min, Math.min(max, value));
}

/* src/_shared/color.js */
function buildSmoothSegmentGradient(centerColor, prevColor, nextColor) {
  const leftBoundary = prevColor ? mixHex(prevColor, centerColor, 0.5) : centerColor;
  const rightBoundary = nextColor ? mixHex(centerColor, nextColor, 0.5) : centerColor;
  return `linear-gradient(90deg, ${leftBoundary} 0%, ${centerColor} 30%, ${centerColor} 70%, ${rightBoundary} 100%)`;
}

function buildSegmentBackground(centerColor, prevColor, nextColor, fadeBetweenSegments = true) {
  if (fadeBetweenSegments === false) {
    return centerColor;
  }
  return buildSmoothSegmentGradient(centerColor, prevColor, nextColor);
}

function blendHex(baseHex, accentHex, blendAmount) {
  const base = parseHex(baseHex);
  const accent = parseHex(accentHex);
  const blend = clamp(0, Number(blendAmount) || 0, 1);
  const keep = 1 - blend;

  return toHex({
    r: Math.round((base.r * blend) + (accent.r * keep)),
    g: Math.round((base.g * blend) + (accent.g * keep)),
    b: Math.round((base.b * blend) + (accent.b * keep)),
  });
}

function mixHex(aHex, bHex, ratio) {
  const a = parseHex(aHex);
  const b = parseHex(bHex);
  const t = clamp(0, Number(ratio) || 0, 1);
  return toHex({
    r: (a.r * (1 - t)) + (b.r * t),
    g: (a.g * (1 - t)) + (b.g * t),
    b: (a.b * (1 - t)) + (b.b * t),
  });
}

function normalizeHexColor(value, fallback) {
  const raw = String(value ?? "").trim();
  if (/^#[0-9A-Fa-f]{6}$/.test(raw)) {
    return raw.toUpperCase();
  }
  return String(fallback || "#000000").toUpperCase();
}

function pickBestTextColor(backgroundHex, lightTextHex, darkTextHex) {
  const background = normalizeHexColor(backgroundHex, "#000000");
  const light = normalizeHexColor(lightTextHex, "#FFFFFF");
  const dark = normalizeHexColor(darkTextHex, "#000000");

  return contrastRatio(background, light) >= contrastRatio(background, dark) ? light : dark;
}

function parseHex(hex) {
  const cleaned = String(hex || "").trim();
  const value = /^#[0-9A-Fa-f]{6}$/.test(cleaned) ? cleaned.slice(1) : "000000";
  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16),
  };
}

function toHex(rgb) {
  const r = clamp(0, Math.round(rgb.r), 255).toString(16).padStart(2, "0");
  const g = clamp(0, Math.round(rgb.g), 255).toString(16).padStart(2, "0");
  const b = clamp(0, Math.round(rgb.b), 255).toString(16).padStart(2, "0");
  return `#${r}${g}${b}`;
}

function contrastRatio(aHex, bHex) {
  const a = relativeLuminance(aHex);
  const b = relativeLuminance(bHex);
  const lighter = Math.max(a, b);
  const darker = Math.min(a, b);
  return (lighter + 0.05) / (darker + 0.05);
}

function relativeLuminance(hex) {
  const rgb = parseHex(hex);
  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map((channel) => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return (0.2126 * r) + (0.7152 * g) + (0.0722 * b);
}

/* src/_shared/interaction.js */
function openMoreInfo(host, hass, entityId) {
  if (!entityId) {
    return;
  }

  if (typeof hass?.moreInfo === "function") {
    hass.moreInfo(entityId);
    return;
  }

  const moreInfo = new Event("hass-more-info", {
    bubbles: true,
    composed: true,
  });
  moreInfo.detail = { entityId };
  host.dispatchEvent(moreInfo);
}

/* src/_shared/signature.js */
function computeEntitySignature(hass, entityIds) {
  return entityIds
    .map((entityId) => {
      const state = hass?.states?.[entityId];
      if (!state) {
        return `${entityId}:missing`;
      }
      const unit = state.attributes?.unit_of_measurement ?? "";
      return `${entityId}:${state.state}:${unit}`;
    })
    .join("|");
}

/* src/constants.js */
const CARD_ELEMENT_TAG = "battery-bar";
const CARD_TYPE = "custom:battery-bar";
const CARD_NAME = "Battery Bar";

const DEFAULT_CONFIG = {
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

const REQUIRED_ENTITY_KEYS = [
  "battery_charge",
  "battery_discharge",
  "summary_soc",
  "summary_energy",
  "summary_device_temperature",
  "battery1_soc",
  "battery1_temp",
  "battery1_voltage",
];
const BATTERY2_ENTITY_KEYS = [
  "battery2_soc",
  "battery2_temp",
  "battery2_voltage",
];
const ENTITY_KEYS = [...REQUIRED_ENTITY_KEYS, ...BATTERY2_ENTITY_KEYS];
const COLOR_KEYS = [
  "background",
  "track",
  "text_light",
  "text_dark",
  "divider",
  "energy_storage_in",
  "energy_storage_out",
  "home_load",
];

/* src/validate.js */
function validateConfig(config) {
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

function normalizeConfig(config) {
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

/* src/battery-bar-card.js */
const FIXED_LINE_GAP_PX = 3;
const COLOR_EASING = "cubic-bezier(0.22, 1, 0.36, 1)";
const COLOR_TRANSITION = `260ms ${COLOR_EASING}`;
const PRIMARY_SETTLE_DURATION_MS = 220;
const EDITOR_ELEMENT_TAG = "battery-bar-editor";
const CONFIG_CLEANUP_STEPS = [
  migrateLegacyBatteryColors,
];
const EDITOR_CLEANUP_STEPS = [
  createRemovePathsCleanup(["decimals"]),
  migrateLegacyBatteryColors,
];

class BatteryBarCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = null;
    this._hass = null;
    this._rendered = false;
    this._lastSignature = "";
    this._refs = null;
    this._onClick = (event) => this._handleClick(event);
  }

  static getStubConfig() {
    const { type: _ignoredType, ...rest } = DEFAULT_CONFIG;
    return structuredClone ? structuredClone(rest) : JSON.parse(JSON.stringify(rest));
  }

  static async getConfigElement() {
    if (!customElements.get(EDITOR_ELEMENT_TAG)) {
      customElements.define(EDITOR_ELEMENT_TAG, BatteryBarEditor);
    }
    return document.createElement(EDITOR_ELEMENT_TAG);
  }

  connectedCallback() {
    this._ensureRendered();
    this._refs.shell.addEventListener("click", this._onClick);
    if (this._config) {
      this._applyTheme();
      this._renderModel();
    }
  }

  disconnectedCallback() {
    if (this._refs?.shell) {
      this._refs.shell.removeEventListener("click", this._onClick);
    }
  }

  setConfig(config) {
    const cleanup = runConfigCleanup(config, CONFIG_CLEANUP_STEPS);
    const normalized = normalizeConfig(cleanup.config);
    validateConfig(normalized);
    this._config = normalized;
    this._lastSignature = "";

    this._ensureRendered();
    this._applyTheme();
    this._renderModel();
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._config) {
      return;
    }

    this._ensureRendered();

    const relevant = collectRelevantEntities(this._config);
    const signature = computeEntitySignature(hass, relevant);
    if (signature === this._lastSignature) {
      return;
    }

    this._lastSignature = signature;
    this._applyTheme();
    this._renderModel();
  }

  getCardSize() {
    return 1;
  }

  _ensureRendered() {
    if (this._rendered) {
      return;
    }
    this._renderStatic();
    this._rendered = true;
  }

  _renderStatic() {
    this.shadowRoot.innerHTML = `
      <ha-card>
        <div class="shell">
          <section class="section section--summary" aria-label="Battery summary">
            <div class="primary-row">
              ${buildMetricButton("summary-primary", true)}
            </div>
            <div class="chip-row chip-row--summary">
              ${buildMetricButton("summary-energy", false)}
              ${buildMetricButton("summary-device-temperature", false)}
            </div>
          </section>

          <section class="section section--battery" aria-label="Battery 1">
            <div class="primary-row">
              ${buildMetricButton("battery1-primary", true)}
            </div>
            <div class="chip-row chip-row--battery">
              ${buildMetricButton("battery1-voltage", false)}
              ${buildMetricButton("battery1-temp", false)}
            </div>
          </section>

          <section class="section section--battery" aria-label="Battery 2">
            <div class="primary-row">
              ${buildMetricButton("battery2-primary", true)}
            </div>
            <div class="chip-row chip-row--battery">
              ${buildMetricButton("battery2-voltage", false)}
              ${buildMetricButton("battery2-temp", false)}
            </div>
          </section>
        </div>
      </ha-card>
      ${styles()}
    `;

    this._refs = {
      shell: this.shadowRoot.querySelector(".shell"),
      battery1Section: this.shadowRoot.querySelector('[aria-label="Battery 1"]'),
      battery2Section: this.shadowRoot.querySelector('[aria-label="Battery 2"]'),
      summaryPrimary: this.shadowRoot.querySelector('[data-ref="summary-primary"]'),
      summaryEnergy: this.shadowRoot.querySelector('[data-ref="summary-energy"]'),
      summaryDeviceTemperature: this.shadowRoot.querySelector('[data-ref="summary-device-temperature"]'),
      battery1Primary: this.shadowRoot.querySelector('[data-ref="battery1-primary"]'),
      battery1Temp: this.shadowRoot.querySelector('[data-ref="battery1-temp"]'),
      battery1Voltage: this.shadowRoot.querySelector('[data-ref="battery1-voltage"]'),
      battery2Primary: this.shadowRoot.querySelector('[data-ref="battery2-primary"]'),
      battery2Temp: this.shadowRoot.querySelector('[data-ref="battery2-temp"]'),
      battery2Voltage: this.shadowRoot.querySelector('[data-ref="battery2-voltage"]'),
    };
  }

  _renderModel() {
    const config = this._config || DEFAULT_CONFIG;
    const model = buildCardModel(config, this._hass);
    const singleBattery = config.battery_count === 1;

    this.style.setProperty("--bb-columns", "minmax(0, 1.12fr) minmax(0, 1fr) minmax(0, 1fr)");
    if (this._refs.battery1Section) {
      this._refs.battery1Section.style.gridColumn = singleBattery ? "2 / 4" : "";
    }
    if (this._refs.battery2Section) {
      this._refs.battery2Section.style.display = singleBattery ? "none" : "";
    }

    applyMetric(this._refs.summaryPrimary, model.summary.primary, { settleOnChange: true });
    applyMetric(this._refs.summaryEnergy, model.summary.chips[0]);
    applyMetric(this._refs.summaryDeviceTemperature, model.summary.chips[1]);
    applyMetric(this._refs.battery1Primary, model.battery1.primary, { settleOnChange: true });
    applyMetric(this._refs.battery1Voltage, model.battery1.chips[0]);
    applyMetric(this._refs.battery1Temp, model.battery1.chips[1]);
    if (model.battery2) {
      applyMetric(this._refs.battery2Primary, model.battery2.primary, { settleOnChange: true });
      applyMetric(this._refs.battery2Voltage, model.battery2.chips[0]);
      applyMetric(this._refs.battery2Temp, model.battery2.chips[1]);
    }
  }

  _applyTheme() {
    const config = this._config || DEFAULT_CONFIG;
    const colors = config.colors || DEFAULT_CONFIG.colors;
    const trackBackground = resolveTrackBackground(config, this._hass);
    const textColor = pickBestTextColor(trackBackground, colors.text_light, colors.text_dark);

    this.style.setProperty("--bb-bar-height", `${config.bar_height}px`);
    this.style.setProperty("--bb-radius", `${config.corner_radius}px`);
    this.style.setProperty("--bb-card-bg", config.background_transparent ? "transparent" : colors.background);
    this.style.setProperty("--bb-track-bg", trackBackground);
    this.style.setProperty("--bb-text", textColor);
    this.style.setProperty("--bb-line-gap", `${FIXED_LINE_GAP_PX}px`);
    this.style.setProperty("--bb-primary-font-summary", "17px");
    this.style.setProperty("--bb-primary-font-battery", "17px");
    this.style.setProperty("--bb-chip-font", "12px");
    this.style.setProperty("--bb-divider", colors.divider);
  }

  _handleClick(event) {
    const button = event.target?.closest?.(".metric-button");
    if (!button || !this._refs?.shell?.contains(button)) {
      return;
    }

    const entityId = button.dataset.entityId;
    if (!entityId) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    openMoreInfo(this, this._hass, entityId);
  }
}

class BatteryBarEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = null;
    this._rawConfig = null;
    this._hass = null;
    this._form = null;
    this._cleanupState = {
      pendingKey: "",
      lastAppliedKey: "",
    };
    this._onFormValueChanged = (event) => this._handleFormValueChangedEvent(event);
  }

  set hass(hass) {
    this._hass = hass;
    syncEditorFormsHass([this._form], hass);
  }

  connectedCallback() {
    this._render();
    flushConfigCleanup(this, this._cleanupState);
  }

  disconnectedCallback() {
    this._form?.removeEventListener("value-changed", this._onFormValueChanged);
  }

  setConfig(config) {
    const incoming = config && typeof config === "object" ? config : {};
    const cleanup = runConfigCleanup(incoming, EDITOR_CLEANUP_STEPS);
    this._rawConfig = {
      ...cleanup.config,
      type: cleanup.config.type || incoming.type || CARD_TYPE,
    };
    this._rawConfig.color_preset = normalizeColorPresetName(this._rawConfig.color_preset);
    this._config = normalizeConfig(this._rawConfig);
    this._render();
    if (cleanup.changed) {
      queueConfigCleanup(this, this._rawConfig, this._cleanupState);
    }
  }

  _render() {
    if (!this.shadowRoot) {
      return;
    }

    if (!this._form) {
      this.shadowRoot.innerHTML = `
        <div class="editor-shell">
          <ha-form class="editor-form"></ha-form>
        </div>
        ${editorStyles()}
      `;
      this._form = this.shadowRoot.querySelector(".editor-form");
      this._form?.addEventListener("value-changed", this._onFormValueChanged);
    }

    if (!this._form) {
      return;
    }
    const config = this._config || normalizeConfig(BatteryBarCard.getStubConfig());
    this._form.hass = this._hass;
    this._form.schema = buildEditorFormSchema(config, this._rawConfig);
    this._form.data = buildBatteryEditorFormData(config, this._rawConfig);
    this._form.computeLabel = (schema) => schema.label || schema.name || "";
  }

  _handleFormValueChangedEvent(event) {
    event.stopPropagation();
    const value = event?.detail?.value;
    if (!value || typeof value !== "object") {
      return;
    }

    const useOverrides = value.use_color_overrides === true;
    const hadOverrides = hasColorOverrides(this._rawConfig);
    const nextRaw = {
      ...(this._rawConfig || {}),
      ...value,
      type: CARD_TYPE,
      color_preset: normalizeColorPresetName(value.color_preset ?? this._rawConfig?.color_preset),
    };
    delete nextRaw.use_color_overrides;

    if (useOverrides) {
      nextRaw.colors = {
        ...resolveEditorBackgroundColor(value.colors, this._rawConfig?.colors),
        ...pickBatteryColorOverrides(this._config?.colors || DEFAULT_CONFIG.colors),
        ...(hadOverrides ? pickBatteryEditorColorOverrides(value.colors) : {}),
      };
      nextRaw.track_blend = normalizeTrackBlendOverrideValue(
        value.track_blend,
        this._config?.track_blend ?? DEFAULT_CONFIG.track_blend,
      );
    } else {
      nextRaw.colors = {
        ...resolveEditorBackgroundColor(value.colors, this._rawConfig?.colors),
      };
      delete nextRaw.track_blend;
      if (Object.keys(nextRaw.colors).length === 0) {
        delete nextRaw.colors;
      }
    }

    this._rawConfig = nextRaw;
    this._config = normalizeConfig(this._rawConfig);

    this._render();
    emitConfigChanged(this, this._rawConfig);
  }

}

function applyMetric(button, metric, options = {}) {
  if (!button) {
    return;
  }

  const nextValue = metric?.value || "—";
  const previousValue = button.dataset.metricValue || "";
  const valueEl = button.querySelector(".metric-text");
  if (valueEl) {
    valueEl.textContent = nextValue;
  }

  button.dataset.metricValue = nextValue;
  button.dataset.entityId = metric?.entityId || "";
  button.disabled = !metric?.available;
  button.title = metric?.title || "";
  button.setAttribute("aria-label", metric?.title || "Battery metric");

  const iconEl = button.querySelector(".metric-icon");
  if (iconEl) {
    const icon = metric?.icon || "";
    if (icon) {
      iconEl.setAttribute("icon", icon);
      iconEl.hidden = false;
    } else {
      iconEl.removeAttribute("icon");
      iconEl.hidden = true;
    }
  }

  if (options.settleOnChange && shouldAnimatePrimarySettle(previousValue, nextValue)) {
    animatePrimarySettle(button);
  }
}

function buildMetricButton(ref, primary) {
  const buttonClass = primary ? "metric-button metric-button--primary" : "metric-button metric-button--chip";
  const iconClass = primary ? "metric-icon metric-icon--primary" : "metric-icon metric-icon--chip";
  return `
    <button class="${buttonClass}" data-ref="${ref}" type="button">
      <ha-icon class="${iconClass}" hidden></ha-icon>
      <span class="metric-text">—</span>
    </button>
  `;
}

function shouldAnimatePrimarySettle(previousValue, nextValue) {
  return Boolean(previousValue)
    && previousValue !== nextValue
    && previousValue !== "—"
    && nextValue !== "—";
}

function animatePrimarySettle(button) {
  if (!button?.animate) {
    return;
  }
  button.getAnimations().forEach((animation) => {
    if (animation.id === "primary-settle") {
      animation.cancel();
    }
  });
  const animation = button.animate(
    [
      { transform: "translateY(1.5px)", opacity: 0.84 },
      { transform: "translateY(0)", opacity: 1 },
    ],
    {
      duration: PRIMARY_SETTLE_DURATION_MS,
      easing: COLOR_EASING,
      fill: "none",
    },
  );
  animation.id = "primary-settle";
}

function styles() {
  return `
    <style>
      :host {
        display: block;
        --bb-bar-height: 56px;
        --bb-radius: 28px;
        --bb-card-bg: transparent;
        --bb-track-bg: #eaecef;
        --bb-columns: minmax(0, 1.12fr) minmax(0, 1fr) minmax(0, 1fr);
        --bb-text: #2e2e2e;
        --bb-line-gap: 3px;
        --bb-primary-font-summary: 17px;
        --bb-primary-font-battery: 17px;
        --bb-chip-font: 12px;
        --bb-divider: #f4f7fa;
        color: var(--bb-text);
      }

      * {
        box-sizing: border-box;
      }

      ha-card {
        background: var(--bb-card-bg);
        color: var(--bb-text);
        transition: background-color ${COLOR_TRANSITION}, color ${COLOR_TRANSITION};
        box-shadow: none !important;
        border: 0 !important;
      }

      .shell {
        width: 100%;
        height: var(--bb-bar-height);
        display: grid;
        grid-template-columns: var(--bb-columns);
        align-items: stretch;
        background: var(--bb-track-bg);
        color: var(--bb-text);
        transition: background-color ${COLOR_TRANSITION}, color ${COLOR_TRANSITION};
        border-radius: var(--bb-radius);
        overflow: hidden;
      }

      .section {
        min-width: 0;
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: var(--bb-line-gap);
        padding: 0 10px;
        position: relative;
      }

      .section + .section::before {
        content: "";
        position: absolute;
        left: 0;
        top: 18%;
        width: 1px;
        height: 64%;
        background: color-mix(in srgb, var(--bb-divider) 34%, transparent);
      }

      .section--summary {
        align-items: center;
        text-align: center;
      }

      .section--battery {
        align-items: center;
      }

      .primary-row,
      .chip-row {
        width: 100%;
        min-width: 0;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .chip-row--battery {
        gap: 0;
      }

      .chip-row--summary {
        gap: 10px;
      }

      .metric-button {
        min-width: 0;
        padding: 0;
        margin: 0;
        border: 0;
        background: transparent;
        color: var(--bb-text);
        font: inherit;
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
        font-variant-numeric: tabular-nums;
      }

      .metric-button:focus-visible {
        outline: 2px solid var(--primary-color, #03a9f4);
        outline-offset: 2px;
        border-radius: 8px;
      }

      .metric-button:disabled {
        cursor: default;
      }

      .metric-button--primary {
        max-width: 100%;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 5px;
      }

      .metric-button--chip {
        max-width: 100%;
        display: inline-flex;
        align-items: center;
        gap: 3px;
        line-height: 1;
        position: relative;
      }

      .chip-row--battery .metric-button--chip + .metric-button--chip {
        margin-left: 10px;
      }

      .metric-icon {
        flex: 0 0 auto;
        display: block;
        align-self: center;
        margin: 0;
        padding: 0;
        vertical-align: middle;
        line-height: 1;
      }

      .metric-icon--primary {
        width: calc(var(--bb-primary-font-battery) * 0.92);
        height: calc(var(--bb-primary-font-battery) * 0.92);
        --mdc-icon-size: calc(var(--bb-primary-font-battery) * 0.92);
        color: color-mix(in srgb, currentColor 88%, transparent);
      }

      .section--summary .metric-icon--primary {
        width: calc(var(--bb-primary-font-summary) * 0.92);
        height: calc(var(--bb-primary-font-summary) * 0.92);
        --mdc-icon-size: calc(var(--bb-primary-font-summary) * 0.92);
      }

      .metric-icon--chip {
        width: auto;
        height: auto;
        --mdc-icon-size: calc(var(--bb-chip-font) * 0.9);
        color: color-mix(in srgb, currentColor 82%, transparent);
        transform: translateY(0.01em);
      }

      .metric-text {
        min-width: 0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .metric-button--primary .metric-text {
        font-weight: 700;
        line-height: 1.05;
        letter-spacing: -0.02em;
      }

      .section--summary .metric-button--primary .metric-text {
        font-size: var(--bb-primary-font-summary);
      }

      .section--battery .metric-button--primary .metric-text {
        font-size: var(--bb-primary-font-battery);
      }

      .metric-button--chip .metric-text {
        display: block;
        font-size: var(--bb-chip-font);
        font-weight: 400;
        line-height: 1;
        align-self: center;
      }
    </style>
  `;
}

function registerCustomCardMetadata(type, name, description) {
  window.customCards = window.customCards || [];
  if (window.customCards.some((item) => item.type === type)) {
    return;
  }
  window.customCards.push({
    type,
    name,
    description,
    preview: true,
  });
}

function registerCard() {
  if (!customElements.get(CARD_ELEMENT_TAG)) {
    customElements.define(CARD_ELEMENT_TAG, BatteryBarCard);
  }

  registerCustomCardMetadata(
    CARD_ELEMENT_TAG,
    CARD_NAME,
    "Battery Bar: compact summary and dual battery status card for Home Assistant.",
  );
}

function resolveTrackBackground(config, hass) {
  const entities = config?.entities || {};
  const colors = config?.colors || DEFAULT_CONFIG.colors;
  const chargeValue = readNumericState(hass, entities.battery_charge);
  const dischargeValue = readNumericState(hass, entities.battery_discharge);

  if (dischargeValue > chargeValue && dischargeValue > 0) {
    return blendHex(colors.track, colors.energy_storage_out, config?.track_blend);
  }

  if (chargeValue > 0) {
    return blendHex(colors.track, colors.energy_storage_in, config?.track_blend);
  }

  return blendHex(colors.track, colors.home_load, config?.track_blend);
}

function readNumericState(hass, entityId) {
  const raw = `${hass?.states?.[entityId]?.state ?? ""}`.trim();
  if (!raw) {
    return 0;
  }

  const direct = Number(raw);
  if (Number.isFinite(direct)) {
    return direct;
  }

  const normalized = raw.replace(",", ".");
  const match = normalized.match(/-?\d+(?:\.\d+)?/);
  if (!match) {
    return 0;
  }

  const parsed = Number(match[0]);
  return Number.isFinite(parsed) ? parsed : 0;
}

function buildTopFormSchema() {
  const colorSelector = { text: {} };

  return [
    {
      type: "expandable",
      title: "Layout & Motion",
      schema: [
        { name: "battery_count", label: "Number of battery segments", required: true, selector: { number: { min: 1, max: 2, step: 1, mode: "box" } } },
        { name: "bar_height", label: "Bar height (px)", required: true, selector: { number: { min: 24, max: 72, step: 1, mode: "slider" } } },
        { name: "corner_radius", label: "Corner radius (px)", required: true, selector: { number: { min: 0, max: 30, step: 1, mode: "slider" } } },
        {
          type: "grid",
          name: "colors",
          schema: [
            { name: "background", label: "Card background color", required: false, selector: colorSelector },
          ],
        },
        { name: "background_transparent", label: "Use transparent card background", selector: { boolean: {} } },
      ],
    },
  ];
}

function buildBottomFormSchema(config) {
  const entitySelector = { entity: { domain: ["sensor", "input_number"] } };
  const batteryCount = Number(config?.battery_count) === 1 ? 1 : 2;
  const battery2Fields = batteryCount === 2
    ? [
      { name: "battery2_soc", label: "Battery 2 top row SoC entity", required: true, selector: entitySelector },
      { name: "battery2_voltage", label: "Battery 2 second row voltage entity", required: true, selector: entitySelector },
      { name: "battery2_temp", label: "Battery 2 second row temperature entity", required: true, selector: entitySelector },
    ]
    : [];

  return [
    {
      type: "expandable",
      title: "Entities",
      name: "entities",
      schema: [
        { name: "battery_charge", label: "Charge power entity", required: true, selector: entitySelector },
        { name: "battery_discharge", label: "Discharge power entity", required: true, selector: entitySelector },
        { name: "summary_soc", label: "Summary top row SoC entity", required: true, selector: entitySelector },
        { name: "summary_energy", label: "Summary second row energy entity", required: true, selector: entitySelector },
        { name: "summary_device_temperature", label: "Summary second row temperature entity", required: true, selector: entitySelector },
        { name: "battery1_soc", label: "Battery 1 top row SoC entity", required: true, selector: entitySelector },
        { name: "battery1_voltage", label: "Battery 1 second row voltage entity", required: true, selector: entitySelector },
        { name: "battery1_temp", label: "Battery 1 second row temperature entity", required: true, selector: entitySelector },
        ...battery2Fields,
      ],
    },
  ];
}

function buildColorOverridesGridSchema() {
  const colorSelector = { text: {} };

  return [
    { name: "track", label: "Base track color", required: false, selector: colorSelector },
    { name: "text_light", label: "Light text and icon color", required: false, selector: colorSelector },
    { name: "text_dark", label: "Dark text and icon color", required: false, selector: colorSelector },
    { name: "divider", label: "Divider line color", required: false, selector: colorSelector },
    { name: "energy_storage_in", label: "Battery charge color", required: false, selector: colorSelector },
    { name: "energy_storage_out", label: "Battery discharge color", required: false, selector: colorSelector },
    { name: "home_load", label: "Idle state color", required: false, selector: colorSelector },
  ];
}

function buildColorSectionSchema(showOverrides) {
  const schema = [
    {
      name: "color_preset",
      label: "Color preset",
      required: false,
      selector: {
        select: {
          mode: "dropdown",
          options: getColorPresetOptions(),
        },
      },
    },
    {
      name: "use_color_overrides",
      label: "Use custom color overrides",
      required: false,
      selector: { boolean: {} },
    },
  ];

  if (showOverrides) {
    schema.push({
      name: "track_blend",
      label: "Track blend",
      required: false,
      selector: { number: { min: 0.1, max: 0.4, step: 0.01, mode: "slider" } },
    });
    schema.push({
      type: "grid",
      name: "colors",
      schema: buildColorOverridesGridSchema(),
    });
  }

  return [
    {
      type: "expandable",
      title: "Colors",
      schema,
    },
  ];
}

function buildEditorFormSchema(config, rawConfig) {
  return [
    ...buildTopFormSchema(),
    ...buildColorSectionSchema(hasColorOverrides(rawConfig)),
    ...buildBottomFormSchema(config),
  ];
}

function buildBatteryEditorFormData(config, rawConfig) {
  return {
    ...config,
    use_color_overrides: hasColorOverrides(rawConfig),
    track_blend: resolveEditorTrackBlend(rawConfig, config.track_blend),
    colors: {
      ...pickBackgroundColor(rawConfig?.colors),
      ...pickBatteryEditorColorOverrides(rawConfig?.colors),
    },
  };
}

function buildTopFormData(config) {
  return {
    battery_count: config.battery_count,
    bar_height: config.bar_height,
    corner_radius: config.corner_radius,
    background_transparent: config.background_transparent,
    colors: pickBackgroundColor(config?.colors),
  };
}

function hasColorOverrides(config) {
  const colors = config?.colors;
  const hasTokenOverrides = Boolean(colors)
    && typeof colors === "object"
    && Object.entries(colors).some(
      ([key, value]) => key !== "background" && typeof value === "string" && value.trim().length > 0,
    );
  const trackBlend = Number(config?.track_blend);
  return hasTokenOverrides || Number.isFinite(trackBlend);
}

function editorStyles() {
  return `
    <style>
      .editor-shell {
        display: grid;
        gap: 12px;
      }
    </style>
  `;
}

function syncEditorFormsHass(forms, hass) {
  for (const form of forms) {
    if (form) {
      form.hass = hass;
    }
  }
}

function pickBatteryColorOverrides(colors) {
  const source = colors && typeof colors === "object" ? colors : {};
  return {
    track: source.track || DEFAULT_CONFIG.colors.track,
    text_light: source.text_light || source.text || DEFAULT_CONFIG.colors.text_light,
    text_dark: source.text_dark || source.text || DEFAULT_CONFIG.colors.text_dark,
    divider: source.divider || DEFAULT_CONFIG.colors.divider,
    energy_storage_in: source.energy_storage_in || DEFAULT_CONFIG.colors.energy_storage_in,
    energy_storage_out: source.energy_storage_out || DEFAULT_CONFIG.colors.energy_storage_out,
    home_load: source.home_load || DEFAULT_CONFIG.colors.home_load,
  };
}

function pickBatteryEditorColorOverrides(colors) {
  const source = colors && typeof colors === "object" ? colors : {};
  return {
    track: source.track || "",
    text_light: source.text_light || source.text || "",
    text_dark: source.text_dark || source.text || "",
    divider: source.divider || "",
    energy_storage_in: source.energy_storage_in || "",
    energy_storage_out: source.energy_storage_out || "",
    home_load: source.home_load || "",
  };
}

function pickBackgroundColor(colors) {
  if (!colors || typeof colors !== "object" || typeof colors.background !== "string" || colors.background.trim().length === 0) {
    return {};
  }
  const background = colors.background.trim();
  if (background.toUpperCase() === DEFAULT_CONFIG.colors.background) {
    return {};
  }
  return { background };
}

function resolveEditorBackgroundColor(formColors, fallbackColors) {
  if (formColors && typeof formColors === "object" && Object.prototype.hasOwnProperty.call(formColors, "background")) {
    return pickBackgroundColor(formColors);
  }
  return pickBackgroundColor(fallbackColors);
}

function resolveEditorTrackBlend(rawConfig, fallback) {
  const trackBlend = Number(rawConfig?.track_blend);
  if (!Number.isFinite(trackBlend)) {
    return fallback;
  }
  return Math.min(0.4, Math.max(0.1, trackBlend));
}

function normalizeTrackBlendOverrideValue(value, fallback) {
  const trackBlend = Number(value);
  if (!Number.isFinite(trackBlend)) {
    return fallback;
  }
  return Math.min(0.4, Math.max(0.1, trackBlend));
}

function migrateLegacyBatteryColors(config) {
  if (!config || typeof config !== "object" || !config.colors || typeof config.colors !== "object") {
    return config;
  }

  const colors = config.colors;
  const nextColors = {
    ...colors,
  };

  let changed = false;

  if (!nextColors.energy_storage_in && typeof colors.battery_charge === "string") {
    nextColors.energy_storage_in = colors.battery_charge;
    changed = true;
  }
  if (!nextColors.energy_storage_out && typeof colors.battery_discharge === "string") {
    nextColors.energy_storage_out = colors.battery_discharge;
    changed = true;
  }
  if (!nextColors.home_load && typeof colors.battery_idle === "string") {
    nextColors.home_load = colors.battery_idle;
    changed = true;
  }
  if (!nextColors.text_light && typeof colors.text === "string") {
    nextColors.text_light = colors.text;
    changed = true;
  }
  if (!nextColors.text_dark && typeof colors.text === "string") {
    nextColors.text_dark = colors.text;
    changed = true;
  }

  if ("battery_charge" in nextColors) {
    delete nextColors.battery_charge;
    changed = true;
  }
  if ("battery_discharge" in nextColors) {
    delete nextColors.battery_discharge;
    changed = true;
  }
  if ("battery_idle" in nextColors) {
    delete nextColors.battery_idle;
    changed = true;
  }
  if ("text" in nextColors) {
    delete nextColors.text;
    changed = true;
  }

  if (!changed) {
    return config;
  }

  return {
    ...config,
    colors: nextColors,
  };
}

/* src/index.js */
registerCard();
