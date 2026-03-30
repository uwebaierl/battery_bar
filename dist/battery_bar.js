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

  return hass.formatEntityState(stateObj, String(raw));
}

/* src/battery-model.js */
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
      primary: buildMetricView(hass, entities.summary_soc),
      chips: [
        buildMetricView(hass, entities.summary_energy),
        buildMetricView(hass, entities.summary_device_temperature),
      ],
    },
    battery1: {
      primary: buildMetricView(hass, entities.battery1_soc),
      chips: [
        buildMetricView(hass, entities.battery1_voltage),
        buildMetricView(hass, entities.battery1_temp),
      ],
    },
    battery2: batteryCount === 2
      ? {
        primary: buildMetricView(hass, entities.battery2_soc),
        chips: [
          buildMetricView(hass, entities.battery2_voltage),
          buildMetricView(hass, entities.battery2_temp),
        ],
      }
      : null,
  };
}

function buildMetricView(hass, entityId) {
  const stateObj = entityId ? hass?.states?.[entityId] : null;
  const status = resolveEntityStatus(entityId, stateObj);
  const label = `${stateObj?.attributes?.friendly_name ?? ""}`.trim() || `${entityId ?? ""}`.trim();
  const value = formatMetricValue(hass, stateObj);

  return {
    entityId: status === "ready" ? entityId || "" : "",
    stateObj: stateObj || null,
    value,
    title: buildMetricTitle(label, value, status),
    available: status === "ready",
    configured: status !== "omitted",
    status,
  };
}

function buildMetricTitle(label, value, status) {
  if (status === "ready") {
    return label ? `${label}: ${value}` : value;
  }
  if (status === "omitted") {
    return "";
  }
  return label ? `${label}: unavailable` : "unavailable";
}

function formatMetricValue(hass, stateObj) {
  return formatEntityStateValue(hass, stateObj);
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

/* src/_shared/editor.js */
function buildBasicEditorStyles() {
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

function syncEntityIcon(iconEl, hass, stateObj) {
  if (!iconEl) {
    return;
  }

  if (stateObj) {
    iconEl.hass = hass || null;
    iconEl.stateObj = stateObj;
    iconEl.state = stateObj;
    iconEl.hidden = false;
    return;
  }

  iconEl.hass = hass || null;
  iconEl.stateObj = null;
  iconEl.state = null;
  iconEl.hidden = true;
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

function pickMappedStringValues(sourceValue, fieldMap, fallback = "") {
  const source = isPlainObjectEditorValue(sourceValue) ? sourceValue : {};
  const normalizedFallback = typeof fallback === "string" ? fallback : "";

  return Object.entries(fieldMap || {}).reduce((result, [key, candidates]) => {
    result[key] = findFirstStringValue(source, candidates, normalizedFallback);
    return result;
  }, {});
}

function pickBackgroundColor(colors, defaultBackground = "#000000") {
  if (!isPlainObjectEditorValue(colors) || typeof colors.background !== "string" || colors.background.trim().length === 0) {
    return {};
  }

  const background = colors.background.trim();
  if (background.toUpperCase() === String(defaultBackground || "#000000").toUpperCase()) {
    return {};
  }
  return { background };
}

function resolveEditorBackgroundColor(formColors, fallbackColors, defaultBackground = "#000000") {
  if (isPlainObjectEditorValue(formColors) && Object.prototype.hasOwnProperty.call(formColors, "background")) {
    return pickBackgroundColor(formColors, defaultBackground);
  }
  return pickBackgroundColor(fallbackColors, defaultBackground);
}

function resolveEditorTrackBlend(rawConfig, fallback, min = 0.1, max = 0.4) {
  return normalizeBoundedNumber(rawConfig?.track_blend, fallback, min, max);
}

function normalizeTrackBlendOverrideValue(value, fallback, min = 0.1, max = 0.4) {
  return normalizeBoundedNumber(value, fallback, min, max);
}

function hasColorOverrides(rawConfig) {
  const colors = rawConfig?.colors;
  const hasTokenOverrides = isPlainObjectEditorValue(colors)
    && Object.entries(colors).some(
      ([key, value]) => key !== "background" && typeof value === "string" && value.trim().length > 0,
    );
  const trackBlend = Number(rawConfig?.track_blend);
  return hasTokenOverrides || Number.isFinite(trackBlend);
}

function buildColorOverrideEditorState(config, rawConfig, fieldMap, defaultBackground = "#000000") {
  return {
    use_color_overrides: hasColorOverrides(rawConfig),
    track_blend: resolveEditorTrackBlend(rawConfig, config?.track_blend),
    colors: {
      ...pickBackgroundColor(rawConfig?.colors, defaultBackground),
      ...pickMappedStringValues(rawConfig?.colors, fieldMap),
    },
  };
}

function findFirstStringValue(source, candidates, fallback) {
  const keys = Array.isArray(candidates) ? candidates : [candidates];
  for (const candidate of keys) {
    if (typeof source[candidate] === "string" && source[candidate].trim().length > 0) {
      return source[candidate].trim();
    }
  }
  return fallback;
}

function normalizeBoundedNumber(value, fallback, min, max) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  return clamp(min, numeric, max);
}

function isPlainObjectEditorValue(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
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

/* src/_shared/layout-tokens.js */
const DEFAULT_BAR_HEIGHT_PX = 56;
const DEFAULT_RADIUS_PX = 28;
const DEFAULT_TRACK_COLOR = "#eaecef";
const DEFAULT_TEXT_COLOR = "#2e2e2e";
const THREE_COLUMN_TEMPLATE = "minmax(0, 1.12fr) minmax(0, 1fr) minmax(0, 1fr)";
const FIXED_LINE_GAP_PX = 4;
const PRIMARY_METRIC_FONT_PX = "15px";
const PRIMARY_METRIC_FONT_WEIGHT = 500;
const CHIP_FONT_PX = "12px";
const CHIP_METRIC_FONT_WEIGHT = 400;
const PRIMARY_METRIC_GAP_PX = 5;
const SECONDARY_METRIC_GAP_PX = 10;
const CHIP_METRIC_GAP_PX = 3;
const FOCUS_RING_OUTLINE = "2px solid var(--primary-color, #03a9f4)";
const FOCUS_RING_RADIUS_PX = 8;
const PRIMARY_METRIC_LINE_HEIGHT = 1.05;
const PRIMARY_METRIC_LETTER_SPACING = "-0.02em";
const PRIMARY_ICON_SCALE = 0.92;
const CHIP_ICON_SCALE = 0.9;
const PRIMARY_ICON_TINT = 88;
const CHIP_ICON_TINT = 82;
const CHIP_ICON_Y_OFFSET = "0.01em";

/* src/constants.js */
const CARD_ELEMENT_TAG = "battery-bar";
const CARD_TYPE = "custom:battery-bar";
const CARD_NAME = "Battery Bar";

const DEFAULT_CONFIG = {
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

/* src/_shared/legacy-config.js */
function migrateLegacyColorConfig(config, colorAliases, options = {}) {
  if (!config || typeof config !== "object" || !config.colors || typeof config.colors !== "object") {
    return config;
  }

  const colors = config.colors;
  const nextColors = {
    ...colors,
  };
  let changed = false;

  for (const [nextKey, legacyKeys] of Object.entries(colorAliases || {})) {
    changed = moveLegacyColor(nextColors, legacyKeys, nextKey) || changed;
  }

  if (options.migrateTextPair !== false) {
    const legacyTextKey = options.legacyTextKey || "text";
    if (!nextColors.text_light && typeof colors[legacyTextKey] === "string") {
      nextColors.text_light = colors[legacyTextKey];
      changed = true;
    }
    if (!nextColors.text_dark && typeof colors[legacyTextKey] === "string") {
      nextColors.text_dark = colors[legacyTextKey];
      changed = true;
    }
  }

  const keysToRemove = new Set();
  for (const legacyKeys of Object.values(colorAliases || {})) {
    const keys = Array.isArray(legacyKeys) ? legacyKeys : [legacyKeys];
    for (const key of keys) {
      if (typeof key === "string" && key.length > 0) {
        keysToRemove.add(key);
      }
    }
  }
  if (options.migrateTextPair !== false) {
    keysToRemove.add(options.legacyTextKey || "text");
  }

  for (const key of keysToRemove) {
    if (key in nextColors) {
      delete nextColors[key];
      changed = true;
    }
  }

  if (!changed) {
    return config;
  }

  return {
    ...config,
    colors: nextColors,
  };
}

function migrateObjectKey(config, legacyKey, nextKey) {
  if (!config || typeof config !== "object" || !(legacyKey in config) || nextKey in config) {
    return config;
  }

  const next = {
    ...config,
    [nextKey]: isPlainObjectLegacyValue(config[legacyKey]) ? { ...config[legacyKey] } : config[legacyKey],
  };
  delete next[legacyKey];
  return next;
}

function moveLegacyColor(colors, legacyKeys, nextKey) {
  if (!colors || typeof colors !== "object") {
    return false;
  }

  const keys = Array.isArray(legacyKeys) ? legacyKeys : [legacyKeys];
  for (const legacyKey of keys) {
    if (!colors[nextKey] && typeof colors[legacyKey] === "string") {
      colors[nextKey] = colors[legacyKey];
      return true;
    }
  }

  return false;
}

function isPlainObjectLegacyValue(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

/* src/migrations.js */
const BATTERY_CONFIG_CLEANUP_STEPS = [
  migrateLegacyBatteryColors,
];

const BATTERY_EDITOR_CLEANUP_STEPS = [
  migrateLegacyBatteryColors,
];

function migrateLegacyBatteryColors(config) {
  return migrateLegacyColorConfig(config, {
    energy_storage_in: "battery_charge",
    energy_storage_out: "battery_discharge",
    home_load: "battery_idle",
  });
}

/* src/_shared/validation.js */
function validateConfigObject(config) {
  if (!config || typeof config !== "object") {
    throw new Error("Invalid configuration.");
  }
}

function validateCardType(config, cardType) {
  if (config.type !== cardType) {
    throw new Error(`Card type must be '${cardType}'.`);
  }
}

function validateRange(value, key, min, max) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < min || numeric > max) {
    throw new Error(`${key} must be a number between ${min} and ${max}.`);
  }
}

function validateOptionalRange(value, key, min, max) {
  if (value === undefined) {
    return;
  }
  validateRange(value, key, min, max);
}

function validateIntegerRange(value, key, min, max) {
  const numeric = Number(value);
  if (!Number.isInteger(numeric) || numeric < min || numeric > max) {
    throw new Error(`${key} must be an integer between ${min} and ${max}.`);
  }
}

function validateBoolean(value, key) {
  if (typeof value !== "boolean") {
    throw new Error(`${key} must be true or false.`);
  }
}

function validateOptionalBoolean(value, key) {
  if (value === undefined) {
    return;
  }
  validateBoolean(value, key);
}

function validateColorPresetValue(value, isKnownColorPreset) {
  if (value === undefined) {
    return;
  }
  if (typeof value !== "string" || typeof isKnownColorPreset !== "function" || !isKnownColorPreset(value)) {
    throw new Error("color_preset must be a supported preset name.");
  }
}

function validateRequiredStringMap(values, keys, prefix) {
  if (!values || typeof values !== "object") {
    throw new Error(`${prefix} must be an object.`);
  }

  for (const key of keys) {
    const value = values[key];
    if (typeof value !== "string" || value.trim().length === 0) {
      throw new Error(`${prefix}.${key} must be a non-empty string.`);
    }
  }
}

function validateRequiredEntityMap(values, keys) {
  if (!values || typeof values !== "object") {
    throw new Error("entities must be an object.");
  }

  for (const key of keys) {
    const value = values[key];
    if (typeof value !== "string" || value.trim().length === 0) {
      throw new Error(`entities.${key} must be a non-empty entity id string.`);
    }
  }
}

function validateOptionalEntityMap(values, keys) {
  if (!values || typeof values !== "object") {
    throw new Error("entities must be an object.");
  }

  for (const key of keys) {
    const value = values[key];
    if (value !== undefined && value !== null && typeof value !== "string") {
      throw new Error(`entities.${key} must be an entity id string when set.`);
    }
  }
}

function validateRequiredColorMap(values, keys) {
  if (!values || typeof values !== "object") {
    throw new Error("colors must be an object.");
  }

  for (const key of keys) {
    const value = values[key];
    if (typeof value !== "string" || value.trim().length === 0) {
      throw new Error(`colors.${key} must be a non-empty color string.`);
    }
  }
}

function normalizeObjectInput(value) {
  return value && typeof value === "object" ? value : {};
}

function normalizeString(value, fallback = "") {
  if (typeof value !== "string" || value.trim().length === 0) {
    return fallback;
  }
  return value.trim();
}

function normalizeEntity(value) {
  return normalizeString(value, "");
}

function normalizeOptionalEntity(value) {
  return normalizeString(value, "");
}

function normalizeMappedStringValues(sourceValue, fieldMap, fallback = null) {
  const source = normalizeObjectInput(sourceValue);

  return Object.entries(fieldMap || {}).reduce((result, [key, candidates]) => {
    result[key] = normalizeCandidateValue(source, candidates, fallback);
    return result;
  }, {});
}

function normalizeCandidateValue(source, candidates, fallback) {
  const keys = Array.isArray(candidates) ? candidates : [candidates];
  for (const candidate of keys) {
    if (typeof source[candidate] === "string" && source[candidate].trim().length > 0) {
      return source[candidate].trim();
    }
  }
  return fallback;
}

/* src/validate.js */
const BATTERY_COLOR_OVERRIDE_MAP = {
  track: ["track"],
  text_light: ["text_light", "text"],
  text_dark: ["text_dark", "text"],
  divider: ["divider"],
  energy_storage_in: ["energy_storage_in", "battery_charge"],
  energy_storage_out: ["energy_storage_out", "battery_discharge"],
  home_load: ["home_load", "battery_idle"],
};

function validateConfig(config) {
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

function normalizeConfig(config) {
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

/* src/_shared/editor-schema.js */
const EDITOR_SCHEMA_RANGE_BAR_HEIGHT = Object.freeze({
  min: 24,
  max: 72,
  step: 1,
});

const EDITOR_SCHEMA_RANGE_CORNER_RADIUS = Object.freeze({
  min: 0,
  max: 30,
  step: 1,
});

const EDITOR_SCHEMA_RANGE_TRACK_BLEND = Object.freeze({
  min: 0.1,
  max: 0.4,
  step: 0.01,
});

const EDITOR_SCHEMA_RANGE_ROW_GAP = Object.freeze({
  min: 0,
  max: 4,
  step: 0.1,
});

const EDITOR_SCHEMA_RANGE_SPRING_STIFFNESS = Object.freeze({
  min: 80,
  max: 420,
  step: 1,
});

const EDITOR_SCHEMA_RANGE_SPRING_DAMPING = Object.freeze({
  min: 10,
  max: 60,
  step: 1,
});

const EDITOR_SCHEMA_RANGE_VALUE_TWEEN_MS = Object.freeze({
  min: 150,
  max: 250,
  step: 1,
});

const EDITOR_SCHEMA_RANGE_VISIBILITY_THRESHOLD = Object.freeze({
  min: 0,
  max: 5000,
  step: 1,
});

function buildColorTextSelector() {
  return { text: {} };
}

function buildSliderNumberSelector(range) {
  return {
    number: {
      min: range.min,
      max: range.max,
      step: range.step,
      mode: "slider",
    },
  };
}

function buildBoxNumberSelector(range) {
  return {
    number: {
      min: range.min,
      max: range.max,
      step: range.step,
      mode: "box",
    },
  };
}

function buildBackgroundColorField(label = "Card background color") {
  return {
    name: "background",
    label,
    required: false,
    selector: buildColorTextSelector(),
  };
}

/* src/_shared/preview.js */
function buildCardPreviewMarkup(description) {
  return `
    <div class="card-preview-placeholder" hidden>
      <p class="card-preview-placeholder__text">${description}</p>
    </div>
  `;
}

function buildCardPreviewStyles(heightCssVarName) {
  return `
      .card-preview-placeholder {
        grid-column: 1 / -1;
        min-height: var(${heightCssVarName});
        display: flex;
        align-items: center;
        justify-content: center;
        justify-self: center;
        max-width: 100%;
        padding: 16px 20px;
        text-align: center;
      }

      .card-preview-placeholder[hidden] {
        display: none;
      }

      .card-preview-placeholder__text {
        margin: 0;
        color: var(--primary-text-color);
        font-size: 15px;
        line-height: 1.35;
      }
  `;
}

function syncCardPreviewVisibility(previewPlaceholderEl, contentElements, showPlaceholder) {
  if (previewPlaceholderEl) {
    previewPlaceholderEl.hidden = showPlaceholder !== true;
  }

  for (const element of contentElements || []) {
    if (element) {
      element.hidden = showPlaceholder === true;
    }
  }
}

function hasRequiredEntityValues(entities, requiredKeys) {
  return (requiredKeys || []).every((key) => {
    const value = entities?.[key];
    return typeof value === "string" && value.trim().length > 0;
  });
}

/* src/_shared/editor-controller.js */
function createEditorCleanupState() {
  return {
    pendingKey: "",
    lastAppliedKey: "",
  };
}

function applyEditorIncomingConfig(host, incomingConfig, cleanupSteps, cardType, normalizeColorPresetName, normalizeConfig) {
  const incoming = isPlainObjectEditorControllerValue(incomingConfig) ? incomingConfig : {};
  const cleanup = runConfigCleanup(incoming, cleanupSteps);
  host._rawConfig = {
    ...cleanup.config,
    type: cleanup.config.type || incoming.type || cardType,
  };
  host._rawConfig.color_preset = normalizeColorPresetName(host._rawConfig.color_preset);
  host._config = normalizeConfig(host._rawConfig);
  return cleanup;
}

function commitEditorRawConfig(host, nextRawConfig, normalizeConfig) {
  host._rawConfig = nextRawConfig;
  host._config = normalizeConfig(host._rawConfig);
}

function ensureSingleFormEditor(host, onValueChanged) {
  if (!host.shadowRoot) {
    return null;
  }

  if (!host._form) {
    host.shadowRoot.innerHTML = `
      <div class="editor-shell">
        <ha-form class="editor-form"></ha-form>
      </div>
      ${buildBasicEditorStyles()}
    `;
    host._form = host.shadowRoot.querySelector(".editor-form");
    host._form?.addEventListener("value-changed", onValueChanged);
  }

  return host._form || null;
}

function renderSingleFormEditor(host, buildFallbackConfig, buildSchema, buildData) {
  const form = host._form;
  if (!form) {
    return;
  }

  const config = host._config || buildFallbackConfig();
  form.hass = host._hass;
  form.schema = buildSchema(config, host._rawConfig);
  form.data = buildData(config, host._rawConfig);
  form.computeLabel = (schema) => schema.label || schema.name || "";
}

function isPlainObjectEditorControllerValue(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

/* src/_shared/metric-button.js */
function applyMetricButtonState(hass, button, metric, options = {}) {
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
  button.setAttribute("aria-label", metric?.title || options.defaultAriaLabel || "Metric");
  button.hidden = Boolean(options.hideWhenUnavailable && !metric?.configured);

  const iconEl = button.querySelector(".metric-icon");
  if (iconEl) {
    syncEntityIcon(iconEl, hass, metric?.stateObj || null);
  }

  if (options.settleOnChange && shouldAnimateMetricValueSettle(previousValue, nextValue)) {
    animateMetricButtonSettle(
      button,
      options.settleDurationMs ?? 220,
      options.settleEasing ?? "cubic-bezier(0.22, 1, 0.36, 1)",
    );
  }
}

function buildMetricButtonMarkup(ref, primary) {
  const buttonClass = primary ? "metric-button metric-button--primary" : "metric-button metric-button--chip";
  const iconClass = primary ? "metric-icon metric-icon--primary" : "metric-icon metric-icon--chip";
  return `
    <button class="${buttonClass}" data-ref="${ref}" type="button">
      <ha-state-icon class="${iconClass}" hidden></ha-state-icon>
      <span class="metric-text">—</span>
    </button>
  `;
}

function syncMetricButtonRowVisibility(row, ...buttons) {
  if (!row) {
    return;
  }
  const hasVisibleButton = buttons.some((button) => button && button.hidden !== true);
  row.hidden = !hasVisibleButton;
}

function shouldAnimateMetricValueSettle(previousValue, nextValue) {
  return Boolean(previousValue)
    && previousValue !== nextValue
    && previousValue !== "—"
    && nextValue !== "—";
}

function animateMetricButtonSettle(button, duration, easing) {
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
      duration,
      easing,
      fill: "none",
    },
  );
  animation.id = "primary-settle";
}

/* src/battery-bar-card.js */
const COLOR_EASING = "cubic-bezier(0.22, 1, 0.36, 1)";
const COLOR_TRANSITION = `260ms ${COLOR_EASING}`;
const PRIMARY_SETTLE_DURATION_MS = 220;
const EDITOR_ELEMENT_TAG = "battery-bar-editor";
const CARD_DESCRIPTION = "Battery Bar: compact battery summary and status card for Home Assistant.";
const BATTERY_COLOR_FIELD_MAP = {
  track: ["track"],
  text_light: ["text_light", "text"],
  text_dark: ["text_dark", "text"],
  divider: ["divider"],
  energy_storage_in: ["energy_storage_in"],
  energy_storage_out: ["energy_storage_out"],
  home_load: ["home_load"],
};

class BatteryBarCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = null;
    this._hass = null;
    this._rendered = false;
    this._lastSignature = "";
    this._refs = null;
    this._showPreviewPlaceholder = false;
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
      if (!this._showPreviewPlaceholder) {
        this._renderModel();
      }
    }
  }

  disconnectedCallback() {
    if (this._refs?.shell) {
      this._refs.shell.removeEventListener("click", this._onClick);
    }
  }

  setConfig(config) {
    const cleanup = runConfigCleanup(config, BATTERY_CONFIG_CLEANUP_STEPS);
    const incomingType = cleanup.config?.type || config?.type || CARD_TYPE;
    if (incomingType !== CARD_TYPE) {
      throw new Error(`Card type must be '${CARD_TYPE}'.`);
    }
    const normalized = normalizeConfig(cleanup.config);
    const hasRequiredEntities = hasRequiredEntityValues(
      normalized.entities,
      resolveRequiredBatteryKeys(normalized.battery_count),
    );
    if (hasRequiredEntities) {
      validateConfig(normalized);
    }
    this._config = normalized;
    this._lastSignature = "";

    this._ensureRendered();
    this._syncPreviewPlaceholder(!hasRequiredEntities);
    this._applyTheme();
    if (!this._showPreviewPlaceholder) {
      this._renderModel();
    }
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._config) {
      return;
    }
    if (this._showPreviewPlaceholder) {
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
          ${buildCardPreviewMarkup(CARD_DESCRIPTION)}
          <div class="card-content">
            <section class="section section--summary" aria-label="Battery summary">
              <div class="primary-row">
                ${buildMetricButtonMarkup("summary-primary", true)}
              </div>
              <div class="chip-row chip-row--summary">
                ${buildMetricButtonMarkup("summary-energy", false)}
                ${buildMetricButtonMarkup("summary-device-temperature", false)}
              </div>
            </section>

            <section class="section section--battery" aria-label="Battery 1">
              <div class="primary-row">
                ${buildMetricButtonMarkup("battery1-primary", true)}
              </div>
              <div class="chip-row chip-row--battery">
                ${buildMetricButtonMarkup("battery1-voltage", false)}
                ${buildMetricButtonMarkup("battery1-temp", false)}
              </div>
            </section>

            <section class="section section--battery" aria-label="Battery 2">
              <div class="primary-row">
                ${buildMetricButtonMarkup("battery2-primary", true)}
              </div>
              <div class="chip-row chip-row--battery">
                ${buildMetricButtonMarkup("battery2-voltage", false)}
                ${buildMetricButtonMarkup("battery2-temp", false)}
              </div>
            </section>
          </div>
        </div>
      </ha-card>
      ${styles()}
    `;

    this._refs = {
      shell: this.shadowRoot.querySelector(".shell"),
      previewPlaceholder: this.shadowRoot.querySelector(".card-preview-placeholder"),
      content: this.shadowRoot.querySelector(".card-content"),
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

  _syncPreviewPlaceholder(showPlaceholder) {
    this._showPreviewPlaceholder = showPlaceholder === true;
    syncCardPreviewVisibility(
      this._refs?.previewPlaceholder,
      [this._refs?.content],
      this._showPreviewPlaceholder,
    );
  }

  _renderModel() {
    const config = this._config || DEFAULT_CONFIG;
    const model = buildCardModel(config, this._hass);
    const singleBattery = config.battery_count === 1;

    this.style.setProperty("--card-columns", THREE_COLUMN_TEMPLATE);
    if (this._refs.battery1Section) {
      this._refs.battery1Section.style.gridColumn = singleBattery ? "2 / 4" : "";
    }
    if (this._refs.battery2Section) {
      this._refs.battery2Section.style.display = singleBattery ? "none" : "";
    }

    applyMetricButtonState(this._hass, this._refs.summaryPrimary, model.summary.primary, buildMetricOptions(true));
    applyMetricButtonState(this._hass, this._refs.summaryEnergy, model.summary.chips[0], buildMetricOptions());
    applyMetricButtonState(this._hass, this._refs.summaryDeviceTemperature, model.summary.chips[1], buildMetricOptions());
    applyMetricButtonState(this._hass, this._refs.battery1Primary, model.battery1.primary, buildMetricOptions(true));
    applyMetricButtonState(this._hass, this._refs.battery1Voltage, model.battery1.chips[0], buildMetricOptions());
    applyMetricButtonState(this._hass, this._refs.battery1Temp, model.battery1.chips[1], buildMetricOptions());
    if (model.battery2) {
      applyMetricButtonState(this._hass, this._refs.battery2Primary, model.battery2.primary, buildMetricOptions(true));
      applyMetricButtonState(this._hass, this._refs.battery2Voltage, model.battery2.chips[0], buildMetricOptions());
      applyMetricButtonState(this._hass, this._refs.battery2Temp, model.battery2.chips[1], buildMetricOptions());
    }
  }

  _applyTheme() {
    const config = this._config || normalizeConfig(BatteryBarCard.getStubConfig());
    const colors = config.colors;
    const trackBackground = resolveTrackBackground(config, this._hass);
    const textColor = pickBestTextColor(trackBackground, colors.text_light, colors.text_dark);

    this.style.setProperty("--card-bar-height", `${config.bar_height}px`);
    this.style.setProperty("--card-radius", `${config.corner_radius}px`);
    this.style.setProperty("--card-bg", config.background_transparent ? "transparent" : colors.background);
    this.style.setProperty("--card-track", trackBackground);
    this.style.setProperty("--card-text", textColor);
    this.style.setProperty("--card-line-gap", `${FIXED_LINE_GAP_PX}px`);
    this.style.setProperty("--card-primary-font", PRIMARY_METRIC_FONT_PX);
    this.style.setProperty("--card-chip-font", CHIP_FONT_PX);
    this.style.setProperty("--card-divider", colors.divider);
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
    this._cleanupState = createEditorCleanupState();
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
    const cleanup = applyEditorIncomingConfig(
      this,
      config,
      BATTERY_EDITOR_CLEANUP_STEPS,
      CARD_TYPE,
      normalizeColorPresetName,
      normalizeConfig,
    );
    this._render();
    if (cleanup.changed) {
      queueConfigCleanup(this, this._rawConfig, this._cleanupState);
    }
  }

  _render() {
    this._form = ensureSingleFormEditor(this, this._onFormValueChanged);
    if (!this._form) {
      return;
    }
    renderSingleFormEditor(
      this,
      () => normalizeConfig(BatteryBarCard.getStubConfig()),
      buildEditorFormSchema,
      buildBatteryEditorFormData,
    );
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
        ...pickMappedStringValues(this._config?.colors, BATTERY_COLOR_FIELD_MAP),
        ...(hadOverrides ? pickMappedStringValues(value.colors, BATTERY_COLOR_FIELD_MAP) : {}),
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

    commitEditorRawConfig(this, nextRaw, normalizeConfig);
    this._render();
    emitConfigChanged(this, this._rawConfig);
  }

}

function styles() {
  return `
    <style>
      :host {
        display: block;
        --card-bar-height: ${DEFAULT_CONFIG.bar_height}px;
        --card-radius: ${DEFAULT_CONFIG.corner_radius}px;
        --card-bg: transparent;
        --card-track: ${DEFAULT_TRACK_COLOR};
        --card-columns: ${THREE_COLUMN_TEMPLATE};
        --card-text: ${DEFAULT_TEXT_COLOR};
        --card-line-gap: ${FIXED_LINE_GAP_PX}px;
        --card-primary-font: ${PRIMARY_METRIC_FONT_PX};
        --card-chip-font: ${CHIP_FONT_PX};
        --card-chip-font-weight: ${CHIP_METRIC_FONT_WEIGHT};
        --card-primary-gap: ${PRIMARY_METRIC_GAP_PX}px;
        --card-secondary-gap: ${SECONDARY_METRIC_GAP_PX}px;
        --card-chip-gap: ${CHIP_METRIC_GAP_PX}px;
        --card-focus-outline: ${FOCUS_RING_OUTLINE};
        --card-focus-radius: ${FOCUS_RING_RADIUS_PX}px;
        --card-primary-line-height: ${PRIMARY_METRIC_LINE_HEIGHT};
        --card-primary-letter-spacing: ${PRIMARY_METRIC_LETTER_SPACING};
        --card-primary-icon-tint: ${PRIMARY_ICON_TINT}%;
        --card-chip-icon-tint: ${CHIP_ICON_TINT}%;
        --card-chip-icon-offset-y: ${CHIP_ICON_Y_OFFSET};
        --card-divider: #f4f7fa;
        color: var(--card-text);
      }

      * {
        box-sizing: border-box;
      }

      ha-card {
        background: var(--card-bg);
        color: var(--card-text);
        transition: background-color ${COLOR_TRANSITION}, color ${COLOR_TRANSITION};
        box-shadow: none !important;
        border: 0 !important;
      }

      .shell {
        width: 100%;
        display: block;
      }

      ${buildCardPreviewStyles("--card-bar-height")}

      .card-content {
        width: 100%;
        height: 100%;
        display: grid;
        grid-template-columns: var(--card-columns);
        align-items: stretch;
        grid-column: 1 / -1;
        height: var(--card-bar-height);
        background: var(--card-track);
        color: var(--card-text);
        transition: background-color ${COLOR_TRANSITION}, color ${COLOR_TRANSITION};
        border-radius: var(--card-radius);
        overflow: hidden;
      }

      .card-content[hidden] {
        display: none !important;
      }

      .section {
        min-width: 0;
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: var(--card-line-gap);
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
        background: color-mix(in srgb, var(--card-divider) 34%, transparent);
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
        gap: var(--card-secondary-gap);
      }

      .metric-button {
        min-width: 0;
        padding: 0;
        margin: 0;
        border: 0;
        background: transparent;
        color: var(--card-text);
        font: inherit;
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
        font-variant-numeric: tabular-nums;
      }

      .metric-button:focus-visible {
        outline: var(--card-focus-outline);
        outline-offset: 2px;
        border-radius: var(--card-focus-radius);
      }

      .metric-button:disabled {
        cursor: default;
      }

      .metric-button--primary {
        max-width: 100%;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: var(--card-primary-gap);
      }

      .metric-button--chip {
        max-width: 100%;
        display: inline-flex;
        align-items: center;
        gap: var(--card-chip-gap);
        line-height: 1;
        position: relative;
      }

      .chip-row--battery .metric-button--chip + .metric-button--chip {
        margin-left: var(--card-secondary-gap);
      }

      .metric-icon {
        flex: 0 0 auto;
        display: block;
        align-self: center;
        margin: 0;
        padding: 0;
        vertical-align: middle;
        line-height: 1;
        --icon-primary-color: currentColor;
      }

      .metric-icon--primary {
        width: calc(var(--card-primary-font) * ${PRIMARY_ICON_SCALE});
        height: calc(var(--card-primary-font) * ${PRIMARY_ICON_SCALE});
        --mdc-icon-size: calc(var(--card-primary-font) * ${PRIMARY_ICON_SCALE});
        color: color-mix(in srgb, currentColor var(--card-primary-icon-tint), transparent);
      }

      .metric-icon--chip {
        width: auto;
        height: auto;
        --mdc-icon-size: calc(var(--card-chip-font) * ${CHIP_ICON_SCALE});
        color: color-mix(in srgb, currentColor var(--card-chip-icon-tint), transparent);
        transform: translateY(var(--card-chip-icon-offset-y));
      }

      .metric-text {
        min-width: 0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .metric-button--primary .metric-text {
        font-size: var(--card-primary-font);
        font-weight: ${PRIMARY_METRIC_FONT_WEIGHT};
        line-height: var(--card-primary-line-height);
        letter-spacing: var(--card-primary-letter-spacing);
      }

      .metric-button--chip .metric-text {
        display: block;
        font-size: var(--card-chip-font);
        font-weight: var(--card-chip-font-weight);
        line-height: 1;
        align-self: center;
      }
    </style>
  `;
}

function registerCard() {
  if (!customElements.get(CARD_ELEMENT_TAG)) {
    customElements.define(CARD_ELEMENT_TAG, BatteryBarCard);
  }

  registerCustomCardMetadata(
    CARD_ELEMENT_TAG,
    CARD_NAME,
    CARD_DESCRIPTION,
  );
}

function buildMetricOptions(settleOnChange = false) {
  return {
    defaultAriaLabel: "Battery metric",
    settleOnChange,
    settleDurationMs: PRIMARY_SETTLE_DURATION_MS,
    settleEasing: COLOR_EASING,
  };
}

function resolveRequiredBatteryKeys(batteryCount) {
  return Number(batteryCount) === 2
    ? [...REQUIRED_ENTITY_KEYS, ...BATTERY2_ENTITY_KEYS]
    : REQUIRED_ENTITY_KEYS;
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
  return [
    {
      type: "expandable",
      title: "Layout & Motion",
      schema: [
        { name: "battery_count", label: "Number of battery segments", required: true, selector: buildBoxNumberSelector({ min: 1, max: 2, step: 1 }) },
        { name: "bar_height", label: "Bar height (px)", required: true, selector: buildSliderNumberSelector(EDITOR_SCHEMA_RANGE_BAR_HEIGHT) },
        { name: "corner_radius", label: "Corner radius (px)", required: true, selector: buildSliderNumberSelector(EDITOR_SCHEMA_RANGE_CORNER_RADIUS) },
        {
          type: "grid",
          name: "colors",
          schema: [buildBackgroundColorField()],
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
  return [
    { name: "track", label: "Base track color", required: false, selector: buildColorTextSelector() },
    { name: "text_light", label: "Light text and icon color", required: false, selector: buildColorTextSelector() },
    { name: "text_dark", label: "Dark text and icon color", required: false, selector: buildColorTextSelector() },
    { name: "divider", label: "Divider line color", required: false, selector: buildColorTextSelector() },
    { name: "energy_storage_in", label: "Battery charge color", required: false, selector: buildColorTextSelector() },
    { name: "energy_storage_out", label: "Battery discharge color", required: false, selector: buildColorTextSelector() },
    { name: "home_load", label: "Idle state color", required: false, selector: buildColorTextSelector() },
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
      selector: buildSliderNumberSelector(EDITOR_SCHEMA_RANGE_TRACK_BLEND),
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
    ...buildColorOverrideEditorState(config, rawConfig, BATTERY_COLOR_FIELD_MAP, DEFAULT_CONFIG.colors.background),
  };
}

/* src/index.js */
registerCard();
