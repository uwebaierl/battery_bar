import { resolveEntityStatus } from "./_shared/availability.js";
import { formatEntityStateValue } from "./_shared/entity-format.js";

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
