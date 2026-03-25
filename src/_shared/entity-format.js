import { isUnavailableState } from "./availability.js";

export function formatEntityStateValue(hass, stateObj, overrideState) {
  if (!stateObj) {
    return "—";
  }

  const raw = overrideState ?? stateObj.state;
  if (isUnavailableState(raw)) {
    return "—";
  }

  return hass.formatEntityState(stateObj, String(raw));
}
