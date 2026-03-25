import { isUnavailableState } from "./availability.js";

export function formatEntityStateValue(hass, stateObj, overrideState) {
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
