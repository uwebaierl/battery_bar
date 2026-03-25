export const UNAVAILABLE_STATES = new Set(["", "unknown", "unavailable", "none", "null", "nan"]);

export function isUnavailableState(raw) {
  return UNAVAILABLE_STATES.has(`${raw ?? ""}`.trim().toLowerCase());
}

export function resolveEntityStatus(entityId, stateObj) {
  if (!entityId) {
    return "omitted";
  }
  if (!stateObj) {
    return "missing";
  }

  const rawState = `${stateObj.state ?? ""}`.trim();
  return isUnavailableState(rawState) ? "unavailable" : "ready";
}
