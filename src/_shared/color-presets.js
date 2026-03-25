export const COLOR_TOKEN_KEYS = [
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

export const COLOR_PRESETS = {
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

export function getColorPresetOptions() {
  return PRESET_OPTIONS.map((option) => ({ ...option }));
}

export function isKnownColorPreset(presetName) {
  return Boolean(COLOR_PRESETS[presetName]);
}

export function normalizeColorPresetName(presetName) {
  return isKnownColorPreset(presetName) ? presetName : "preset_1";
}

export function resolveColorPresetTokens(presetName) {
  const normalizedName = normalizeColorPresetName(presetName);
  return {
    ...pickColorTokens(COLOR_PRESETS[normalizedName] || {}),
  };
}

export function mergeColorPresetTokens(presetName, fallbackTokens, manualOverrides) {
  const presetTokens = resolveColorPresetTokens(presetName);
  return {
    ...(fallbackTokens || {}),
    ...presetTokens,
    ...filterDefinedEntries(manualOverrides),
  };
}

export function resolveColorPresetTrackBlend(presetName, fallbackTrackBlend) {
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
