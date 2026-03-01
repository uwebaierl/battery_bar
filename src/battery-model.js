const UNAVAILABLE_STATES = new Set(["", "unknown", "unavailable", "none", "null", "nan"]);
const formatterCache = new Map();
const DEFAULT_METRIC_ICONS = {
  soc: "mdi:battery-medium",
  energy: "mdi:home-battery-outline",
  temperature: "mdi:thermometer",
  voltage: "mdi:sine-wave",
};

export function collectRelevantEntities(config) {
  const entities = config?.entities || {};
  return Object.values(entities)
    .filter((entityId) => typeof entityId === "string" && entityId.length > 0);
}

export function computeEntitySignature(hass, entityIds) {
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

export function buildCardModel(config, hass) {
  const entities = config?.entities || {};
  const decimals = config?.decimals || {};

  return {
    summary: {
      primary: buildMetricView(hass, entities.summary_soc, "soc", decimals.soc, "Total state of charge"),
      chips: [
        buildMetricView(hass, entities.summary_energy, "energy", decimals.energy, "Available energy"),
        buildMetricView(
          hass,
          entities.summary_device_temperature,
          "temperature",
          decimals.temperature,
          "Device temperature",
        ),
      ],
    },
    battery1: {
      primary: buildMetricView(hass, entities.battery1_soc, "soc", decimals.soc, "Battery 1 state of charge"),
      chips: [
        buildMetricView(hass, entities.battery1_voltage, "voltage", decimals.voltage, "Battery 1 total voltage"),
        buildMetricView(hass, entities.battery1_temp, "temperature", decimals.temperature, "Battery 1 max cell temperature"),
      ],
    },
    battery2: {
      primary: buildMetricView(hass, entities.battery2_soc, "soc", decimals.soc, "Battery 2 state of charge"),
      chips: [
        buildMetricView(hass, entities.battery2_voltage, "voltage", decimals.voltage, "Battery 2 total voltage"),
        buildMetricView(hass, entities.battery2_temp, "temperature", decimals.temperature, "Battery 2 max cell temperature"),
      ],
    },
  };
}

function buildMetricView(hass, entityId, kind, decimals, fallbackLabel) {
  const stateObj = entityId ? hass?.states?.[entityId] : null;
  const friendlyName = stateObj?.attributes?.friendly_name || fallbackLabel;
  const value = formatMetricValue(stateObj, kind, decimals);

  return {
    entityId: entityId || "",
    icon: resolveMetricIcon(stateObj, kind),
    value,
    title: entityId ? `${friendlyName}: ${value}` : fallbackLabel,
    available: Boolean(entityId),
  };
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

function formatMetricValue(stateObj, kind, decimals) {
  if (!stateObj) {
    return "—";
  }

  const raw = `${stateObj.state ?? ""}`.trim();
  if (isUnavailable(raw)) {
    return "—";
  }

  const numeric = parseNumericState(raw);
  if (numeric === null) {
    return raw;
  }

  if (kind === "soc") {
    return `${formatNumber(numeric, decimals)}%`;
  }

  const unit = `${stateObj.attributes?.unit_of_measurement ?? ""}`.trim();
  const suffix = unit ? ` ${unit}` : "";
  return `${formatNumber(numeric, decimals)}${suffix}`;
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

function formatNumber(value, decimals) {
  const key = `${decimals}`;
  let formatter = formatterCache.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
    formatterCache.set(key, formatter);
  }
  return formatter.format(value);
}

function isUnavailable(raw) {
  return UNAVAILABLE_STATES.has(`${raw ?? ""}`.trim().toLowerCase());
}
