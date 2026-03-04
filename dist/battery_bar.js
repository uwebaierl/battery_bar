/* Battery Bar - generated file. Do not edit directly. */
/* src/battery-model.js */
const UNAVAILABLE_STATES = new Set(["", "unknown", "unavailable", "none", "null", "nan"]);
const formatterCache = new Map();
const DEFAULT_METRIC_ICONS = {
  soc: "mdi:battery-medium",
  energy: "mdi:home-battery-outline",
  temperature: "mdi:thermometer",
  voltage: "mdi:sine-wave",
};

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

function buildCardModel(config, hass) {
  const entities = config?.entities || {};
  const decimals = config?.decimals || {};
  const batteryCount = config?.battery_count || 2;

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
    battery2: batteryCount === 2
      ? {
        primary: buildMetricView(hass, entities.battery2_soc, "soc", decimals.soc, "Battery 2 state of charge"),
        chips: [
          buildMetricView(hass, entities.battery2_voltage, "voltage", decimals.voltage, "Battery 2 total voltage"),
          buildMetricView(hass, entities.battery2_temp, "temperature", decimals.temperature, "Battery 2 max cell temperature"),
        ],
      }
      : null,
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

/* src/constants.js */
const CARD_ELEMENT_TAG = "battery-bar";
const CARD_TYPE = "custom:battery-bar";
const CARD_NAME = "Battery Bar";

const DEFAULT_CONFIG = {
  type: CARD_TYPE,
  battery_count: 2,
  bar_height: 56,
  corner_radius: 28,
  track_blend: 0.2,
  background_transparent: false,
  entities: {
    battery_charge: "sensor.battery_charge_power",
    battery_discharge: "sensor.battery_discharge_power",
    summary_soc: "sensor.battery_system_soc",
    summary_energy: "sensor.battery_available_energy",
    summary_device_temperature: "sensor.battery_device_temperature",
    battery1_soc: "sensor.battery_1_soc",
    battery1_temp: "sensor.battery_1_max_cell_temperature",
    battery1_voltage: "sensor.battery_1_total_voltage",
    battery2_soc: "sensor.battery_2_soc",
    battery2_temp: "sensor.battery_2_max_cell_temperature",
    battery2_voltage: "sensor.battery_2_total_voltage",
  },
  decimals: {
    soc: 0,
    energy: 2,
    temperature: 0,
    voltage: 1,
  },
  colors: {
    background: "#4CAF8E",
    track: "#EAECEF",
    text: "#2E2E2E",
    battery_charge: "#4CAF8E",
    battery_discharge: "#2E8B75",
    battery_idle: "#9FA8B2",
  },
};

const ENTITY_KEYS = [
  "battery_charge",
  "battery_discharge",
  "summary_soc",
  "summary_energy",
  "summary_device_temperature",
  "battery1_soc",
  "battery1_temp",
  "battery1_voltage",
  "battery2_soc",
  "battery2_temp",
  "battery2_voltage",
];

const DECIMAL_KEYS = ["soc", "energy", "temperature", "voltage"];
const COLOR_KEYS = ["background", "track", "text", "battery_charge", "battery_discharge", "battery_idle"];

/* src/validate.js */
function validateConfig(config) {
  if (!config || typeof config !== "object") {
    throw new Error("Invalid configuration.");
  }

  if (config.type !== CARD_TYPE) {
    throw new Error(`Card type must be '${CARD_TYPE}'.`);
  }

  validateIntegerRange(config.battery_count, "battery_count", 1, 2);
  validateRange(config.bar_height, "bar_height", 24, 72);
  validateRange(config.corner_radius, "corner_radius", 0, 30);
  validateRange(config.track_blend, "track_blend", 0.15, 0.3);

  if (typeof config.background_transparent !== "boolean") {
    throw new Error("background_transparent must be true or false.");
  }

  if (!config.entities || typeof config.entities !== "object") {
    throw new Error("entities must be an object.");
  }
  for (const key of ENTITY_KEYS) {
    const value = config.entities[key];
    if (typeof value !== "string" || value.trim().length === 0) {
      throw new Error(`entities.${key} must be a non-empty entity id string.`);
    }
  }

  if (!config.decimals || typeof config.decimals !== "object") {
    throw new Error("decimals must be an object.");
  }
  for (const key of DECIMAL_KEYS) {
    validateIntegerRange(config.decimals[key], `decimals.${key}`, 0, 2);
  }

  if (!config.colors || typeof config.colors !== "object") {
    throw new Error("colors must be an object.");
  }
  for (const key of COLOR_KEYS) {
    const value = config.colors[key];
    if (typeof value !== "string" || value.trim().length === 0) {
      throw new Error(`colors.${key} must be a non-empty color string.`);
    }
  }
}

function normalizeConfig(config) {
  const source = config && typeof config === "object" ? config : {};
  const entitiesInput = source.entities && typeof source.entities === "object" ? source.entities : {};
  const decimalsInput = source.decimals && typeof source.decimals === "object" ? source.decimals : {};
  const colorsInput = source.colors && typeof source.colors === "object" ? source.colors : {};

  return {
    type: CARD_TYPE,
    battery_count: clampInteger(source.battery_count, 1, 2, DEFAULT_CONFIG.battery_count),
    bar_height: clampNumber(source.bar_height, 24, 72, DEFAULT_CONFIG.bar_height),
    corner_radius: clampNumber(source.corner_radius, 0, 30, DEFAULT_CONFIG.corner_radius),
    track_blend: clampNumber(source.track_blend, 0.15, 0.3, DEFAULT_CONFIG.track_blend),
    background_transparent: typeof source.background_transparent === "boolean"
      ? source.background_transparent
      : DEFAULT_CONFIG.background_transparent,
    entities: {
      battery_charge: normalizeEntity(entitiesInput.battery_charge, DEFAULT_CONFIG.entities.battery_charge),
      battery_discharge: normalizeEntity(entitiesInput.battery_discharge, DEFAULT_CONFIG.entities.battery_discharge),
      summary_soc: normalizeEntity(entitiesInput.summary_soc, DEFAULT_CONFIG.entities.summary_soc),
      summary_energy: normalizeEntity(entitiesInput.summary_energy, DEFAULT_CONFIG.entities.summary_energy),
      summary_device_temperature: normalizeEntity(
        entitiesInput.summary_device_temperature,
        DEFAULT_CONFIG.entities.summary_device_temperature,
      ),
      battery1_soc: normalizeEntity(entitiesInput.battery1_soc, DEFAULT_CONFIG.entities.battery1_soc),
      battery1_temp: normalizeEntity(entitiesInput.battery1_temp, DEFAULT_CONFIG.entities.battery1_temp),
      battery1_voltage: normalizeEntity(entitiesInput.battery1_voltage, DEFAULT_CONFIG.entities.battery1_voltage),
      battery2_soc: normalizeEntity(entitiesInput.battery2_soc, DEFAULT_CONFIG.entities.battery2_soc),
      battery2_temp: normalizeEntity(entitiesInput.battery2_temp, DEFAULT_CONFIG.entities.battery2_temp),
      battery2_voltage: normalizeEntity(entitiesInput.battery2_voltage, DEFAULT_CONFIG.entities.battery2_voltage),
    },
    decimals: {
      soc: clampDecimal(decimalsInput.soc, DEFAULT_CONFIG.decimals.soc),
      energy: clampDecimal(decimalsInput.energy, DEFAULT_CONFIG.decimals.energy),
      temperature: clampDecimal(decimalsInput.temperature, DEFAULT_CONFIG.decimals.temperature),
      voltage: clampDecimal(decimalsInput.voltage, DEFAULT_CONFIG.decimals.voltage),
    },
    colors: {
      background: normalizeColor(colorsInput.background, DEFAULT_CONFIG.colors.background),
      track: normalizeColor(colorsInput.track, DEFAULT_CONFIG.colors.track),
      text: normalizeColor(colorsInput.text, DEFAULT_CONFIG.colors.text),
      battery_charge: normalizeColor(colorsInput.battery_charge, DEFAULT_CONFIG.colors.battery_charge),
      battery_discharge: normalizeColor(colorsInput.battery_discharge, DEFAULT_CONFIG.colors.battery_discharge),
      battery_idle: normalizeColor(colorsInput.battery_idle, DEFAULT_CONFIG.colors.battery_idle),
    },
  };
}

function validateRange(value, key, min, max) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < min || n > max) {
    throw new Error(`${key} must be a number between ${min} and ${max}.`);
  }
}

function validateIntegerRange(value, key, min, max) {
  const n = Number(value);
  if (!Number.isInteger(n) || n < min || n > max) {
    throw new Error(`${key} must be an integer between ${min} and ${max}.`);
  }
}

function clampNumber(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, n));
}

function clampInteger(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isInteger(n)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, n));
}

function clampDecimal(value, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) {
    return fallback;
  }
  return Math.min(2, Math.max(0, Math.round(n)));
}

function normalizeColor(value, fallback) {
  if (typeof value !== "string" || value.trim().length === 0) {
    return fallback;
  }
  return value.trim();
}

function normalizeEntity(value, fallback) {
  if (typeof value !== "string" || value.trim().length === 0) {
    return fallback;
  }
  return value.trim();
}

/* src/battery-bar-card.js */
const FIXED_LINE_GAP_PX = 3;
const COLOR_EASING = "cubic-bezier(0.22, 1, 0.36, 1)";
const COLOR_TRANSITION = `260ms ${COLOR_EASING}`;
const PRIMARY_SETTLE_DURATION_MS = 220;

class BatteryBarCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = null;
    this._hass = null;
    this._rendered = false;
    this._lastSignature = "";
    this._refs = null;
    this._onClick = (event) => this._handleClick(event);
  }

  static getStubConfig() {
    const { type: _ignoredType, ...rest } = DEFAULT_CONFIG;
    return structuredClone ? structuredClone(rest) : JSON.parse(JSON.stringify(rest));
  }

  connectedCallback() {
    this._ensureRendered();
    this._refs.shell.addEventListener("click", this._onClick);
    if (this._config) {
      this._applyTheme();
      this._renderModel();
    }
  }

  disconnectedCallback() {
    if (this._refs?.shell) {
      this._refs.shell.removeEventListener("click", this._onClick);
    }
  }

  setConfig(config) {
    const normalized = normalizeConfig(config);
    validateConfig(normalized);
    this._config = normalized;
    this._lastSignature = "";

    this._ensureRendered();
    this._applyTheme();
    this._renderModel();
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._config) {
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
          <section class="section section--summary" aria-label="Battery summary">
            <div class="primary-row">
              ${buildMetricButton("summary-primary", true)}
            </div>
            <div class="chip-row chip-row--summary">
              ${buildMetricButton("summary-energy", false)}
              ${buildMetricButton("summary-device-temperature", false)}
            </div>
          </section>

          <section class="section section--battery" aria-label="Battery 1">
            <div class="primary-row">
              ${buildMetricButton("battery1-primary", true)}
            </div>
            <div class="chip-row chip-row--battery">
              ${buildMetricButton("battery1-voltage", false)}
              ${buildMetricButton("battery1-temp", false)}
            </div>
          </section>

          <section class="section section--battery" aria-label="Battery 2">
            <div class="primary-row">
              ${buildMetricButton("battery2-primary", true)}
            </div>
            <div class="chip-row chip-row--battery">
              ${buildMetricButton("battery2-voltage", false)}
              ${buildMetricButton("battery2-temp", false)}
            </div>
          </section>
        </div>
      </ha-card>
      ${styles()}
    `;

    this._refs = {
      shell: this.shadowRoot.querySelector(".shell"),
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

  _renderModel() {
    const config = this._config || DEFAULT_CONFIG;
    const model = buildCardModel(config, this._hass);
    const singleBattery = config.battery_count === 1;

    this.style.setProperty("--bb-columns", "minmax(0, 1.12fr) minmax(0, 1fr) minmax(0, 1fr)");
    if (this._refs.battery1Section) {
      this._refs.battery1Section.style.gridColumn = singleBattery ? "2 / 4" : "";
    }
    if (this._refs.battery2Section) {
      this._refs.battery2Section.style.display = singleBattery ? "none" : "";
    }

    applyMetric(this._refs.summaryPrimary, model.summary.primary, { settleOnChange: true });
    applyMetric(this._refs.summaryEnergy, model.summary.chips[0]);
    applyMetric(this._refs.summaryDeviceTemperature, model.summary.chips[1]);
    applyMetric(this._refs.battery1Primary, model.battery1.primary, { settleOnChange: true });
    applyMetric(this._refs.battery1Voltage, model.battery1.chips[0]);
    applyMetric(this._refs.battery1Temp, model.battery1.chips[1]);
    if (model.battery2) {
      applyMetric(this._refs.battery2Primary, model.battery2.primary, { settleOnChange: true });
      applyMetric(this._refs.battery2Voltage, model.battery2.chips[0]);
      applyMetric(this._refs.battery2Temp, model.battery2.chips[1]);
    }
  }

  _applyTheme() {
    const config = this._config || DEFAULT_CONFIG;
    const colors = config.colors || DEFAULT_CONFIG.colors;

    this.style.setProperty("--bb-bar-height", `${config.bar_height}px`);
    this.style.setProperty("--bb-radius", `${config.corner_radius}px`);
    this.style.setProperty("--bb-card-bg", config.background_transparent ? "transparent" : colors.background);
    this.style.setProperty("--bb-track-bg", resolveTrackBackground(config, this._hass));
    this.style.setProperty("--bb-text", colors.text);
    this.style.setProperty("--bb-line-gap", `${FIXED_LINE_GAP_PX}px`);
    this.style.setProperty("--bb-primary-font-summary", `${clamp(16, config.bar_height * 0.33, 20)}px`);
    this.style.setProperty("--bb-primary-font-battery", `${clamp(15, (config.bar_height * 0.33) - 1, 19)}px`);
    this.style.setProperty("--bb-chip-font", `${clamp(10, config.bar_height * 0.19, 12)}px`);
    this.style.setProperty("--bb-divider", blendHex(colors.track, colors.text, 0.92));
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
    if (typeof this._hass?.moreInfo === "function") {
      this._hass.moreInfo(entityId);
      return;
    }

    const moreInfo = new Event("hass-more-info", {
      bubbles: true,
      composed: true,
    });
    moreInfo.detail = { entityId };
    this.dispatchEvent(moreInfo);
  }
}

function applyMetric(button, metric, options = {}) {
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
  button.setAttribute("aria-label", metric?.title || "Battery metric");

  const iconEl = button.querySelector(".metric-icon");
  if (iconEl) {
    const icon = metric?.icon || "";
    if (icon) {
      iconEl.setAttribute("icon", icon);
      iconEl.hidden = false;
    } else {
      iconEl.removeAttribute("icon");
      iconEl.hidden = true;
    }
  }

  if (options.settleOnChange && shouldAnimatePrimarySettle(previousValue, nextValue)) {
    animatePrimarySettle(button);
  }
}

function buildMetricButton(ref, primary) {
  const buttonClass = primary ? "metric-button metric-button--primary" : "metric-button metric-button--chip";
  const iconClass = primary ? "metric-icon metric-icon--primary" : "metric-icon metric-icon--chip";
  return `
    <button class="${buttonClass}" data-ref="${ref}" type="button">
      <ha-icon class="${iconClass}" hidden></ha-icon>
      <span class="metric-text">—</span>
    </button>
  `;
}

function shouldAnimatePrimarySettle(previousValue, nextValue) {
  return Boolean(previousValue)
    && previousValue !== nextValue
    && previousValue !== "—"
    && nextValue !== "—";
}

function animatePrimarySettle(button) {
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
      duration: PRIMARY_SETTLE_DURATION_MS,
      easing: COLOR_EASING,
      fill: "none",
    },
  );
  animation.id = "primary-settle";
}

function styles() {
  return `
    <style>
      :host {
        display: block;
        --bb-bar-height: 56px;
        --bb-radius: 28px;
        --bb-card-bg: transparent;
        --bb-track-bg: #eaecef;
        --bb-columns: minmax(0, 1.12fr) minmax(0, 1fr) minmax(0, 1fr);
        --bb-text: #2e2e2e;
        --bb-line-gap: 3px;
        --bb-primary-font-summary: 19px;
        --bb-primary-font-battery: 18px;
        --bb-chip-font: 11px;
        --bb-divider: rgba(46, 46, 46, 0.12);
        color: var(--bb-text);
      }

      * {
        box-sizing: border-box;
      }

      ha-card {
        background: var(--bb-card-bg);
        color: var(--bb-text);
        transition: background-color ${COLOR_TRANSITION}, color ${COLOR_TRANSITION};
        box-shadow: none !important;
        border: 0 !important;
      }

      .shell {
        width: 100%;
        height: var(--bb-bar-height);
        display: grid;
        grid-template-columns: var(--bb-columns);
        align-items: stretch;
        background: var(--bb-track-bg);
        color: var(--bb-text);
        transition: background-color ${COLOR_TRANSITION}, color ${COLOR_TRANSITION};
        border-radius: var(--bb-radius);
        overflow: hidden;
      }

      .section {
        min-width: 0;
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: var(--bb-line-gap);
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
        background: color-mix(in srgb, var(--bb-divider) 34%, transparent);
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
        gap: 10px;
      }

      .metric-button {
        min-width: 0;
        padding: 0;
        margin: 0;
        border: 0;
        background: transparent;
        color: var(--bb-text);
        font: inherit;
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
        font-variant-numeric: tabular-nums;
      }

      .metric-button:focus-visible {
        outline: 2px solid var(--primary-color, #03a9f4);
        outline-offset: 2px;
        border-radius: 8px;
      }

      .metric-button:disabled {
        cursor: default;
      }

      .metric-button--primary {
        max-width: 100%;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 5px;
      }

      .metric-button--chip {
        max-width: 100%;
        display: inline-flex;
        align-items: center;
        gap: 3px;
        line-height: 1;
        position: relative;
      }

      .chip-row--battery .metric-button--chip + .metric-button--chip {
        margin-left: 10px;
      }

      .metric-icon {
        flex: 0 0 auto;
        display: block;
        align-self: center;
        margin: 0;
        padding: 0;
        vertical-align: middle;
        line-height: 1;
      }

      .metric-icon--primary {
        width: calc(var(--bb-primary-font-battery) * 0.92);
        height: calc(var(--bb-primary-font-battery) * 0.92);
        --mdc-icon-size: calc(var(--bb-primary-font-battery) * 0.92);
        color: color-mix(in srgb, currentColor 88%, transparent);
      }

      .section--summary .metric-icon--primary {
        width: calc(var(--bb-primary-font-summary) * 0.92);
        height: calc(var(--bb-primary-font-summary) * 0.92);
        --mdc-icon-size: calc(var(--bb-primary-font-summary) * 0.92);
      }

      .metric-icon--chip {
        width: auto;
        height: auto;
        --mdc-icon-size: calc(var(--bb-chip-font) * 0.9);
        color: color-mix(in srgb, currentColor 82%, transparent);
        transform: translateY(0.01em);
      }

      .metric-text {
        min-width: 0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .metric-button--primary .metric-text {
        font-weight: 700;
        line-height: 1.05;
        letter-spacing: -0.02em;
      }

      .section--summary .metric-button--primary .metric-text {
        font-size: var(--bb-primary-font-summary);
      }

      .section--battery .metric-button--primary .metric-text {
        font-size: var(--bb-primary-font-battery);
      }

      .metric-button--chip .metric-text {
        display: block;
        font-size: var(--bb-chip-font);
        font-weight: 400;
        line-height: 1;
        align-self: center;
      }
    </style>
  `;
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

function registerCard() {
  if (!customElements.get(CARD_ELEMENT_TAG)) {
    customElements.define(CARD_ELEMENT_TAG, BatteryBarCard);
  }

  registerCustomCardMetadata(
    CARD_ELEMENT_TAG,
    CARD_NAME,
    "Battery Bar: compact summary and dual battery status card for Home Assistant.",
  );
}

function resolveTrackBackground(config, hass) {
  const entities = config?.entities || {};
  const colors = config?.colors || DEFAULT_CONFIG.colors;
  const chargeValue = readNumericState(hass, entities.battery_charge);
  const dischargeValue = readNumericState(hass, entities.battery_discharge);

  if (dischargeValue > chargeValue && dischargeValue > 0) {
    return blendHex(colors.track, colors.battery_discharge, config?.track_blend);
  }

  if (chargeValue > 0) {
    return blendHex(colors.track, colors.battery_charge, config?.track_blend);
  }

  return blendHex(colors.track, colors.battery_idle, config?.track_blend);
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

function clamp(min, value, max) {
  return Math.max(min, Math.min(max, value));
}

/* src/index.js */
registerCard();
