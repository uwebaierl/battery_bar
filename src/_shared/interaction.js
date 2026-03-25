export function openMoreInfo(host, hass, entityId) {
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
