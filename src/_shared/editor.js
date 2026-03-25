import { clamp } from "./math.js";

export function buildBasicEditorStyles() {
  return `
    <style>
      .editor-shell {
        display: grid;
        gap: 12px;
      }
    </style>
  `;
}

export function syncEditorFormsHass(forms, hass) {
  for (const form of forms) {
    if (form) {
      form.hass = hass;
    }
  }
}

export function syncEntityIcon(iconEl, hass, stateObj) {
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

export function registerCustomCardMetadata(type, name, description) {
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

export function pickMappedStringValues(sourceValue, fieldMap, fallback = "") {
  const source = isPlainObjectEditorValue(sourceValue) ? sourceValue : {};
  const normalizedFallback = typeof fallback === "string" ? fallback : "";

  return Object.entries(fieldMap || {}).reduce((result, [key, candidates]) => {
    result[key] = findFirstStringValue(source, candidates, normalizedFallback);
    return result;
  }, {});
}

export function pickBackgroundColor(colors, defaultBackground = "#000000") {
  if (!isPlainObjectEditorValue(colors) || typeof colors.background !== "string" || colors.background.trim().length === 0) {
    return {};
  }

  const background = colors.background.trim();
  if (background.toUpperCase() === String(defaultBackground || "#000000").toUpperCase()) {
    return {};
  }
  return { background };
}

export function resolveEditorBackgroundColor(formColors, fallbackColors, defaultBackground = "#000000") {
  if (isPlainObjectEditorValue(formColors) && Object.prototype.hasOwnProperty.call(formColors, "background")) {
    return pickBackgroundColor(formColors, defaultBackground);
  }
  return pickBackgroundColor(fallbackColors, defaultBackground);
}

export function resolveEditorTrackBlend(rawConfig, fallback, min = 0.1, max = 0.4) {
  return normalizeBoundedNumber(rawConfig?.track_blend, fallback, min, max);
}

export function normalizeTrackBlendOverrideValue(value, fallback, min = 0.1, max = 0.4) {
  return normalizeBoundedNumber(value, fallback, min, max);
}

export function hasColorOverrides(rawConfig) {
  const colors = rawConfig?.colors;
  const hasTokenOverrides = isPlainObjectEditorValue(colors)
    && Object.entries(colors).some(
      ([key, value]) => key !== "background" && typeof value === "string" && value.trim().length > 0,
    );
  const trackBlend = Number(rawConfig?.track_blend);
  return hasTokenOverrides || Number.isFinite(trackBlend);
}

export function buildColorOverrideEditorState(config, rawConfig, fieldMap, defaultBackground = "#000000") {
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
