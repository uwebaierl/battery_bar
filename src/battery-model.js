import { resolveEntityStatus } from "./_shared/availability.js";
import { formatEntityStateValue } from "./_shared/entity-format.js";

const DEFAULT_METRIC_ICONS = {
  soc: "mdi:battery-medium",
  energy: "mdi:home-battery-outline",
  temperature: "mdi:thermometer",
  voltage: "mdi:sine-wave",
};

export function collectRelevantEntities(config) {
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

export function buildCardModel(config, hass) {
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
