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
  background_transparent: true,
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
    divider: "#F4F7FA",
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
const COLOR_KEYS = ["background", "track", "text", "divider", "battery_charge", "battery_discharge", "battery_idle"];

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
      divider: normalizeColor(colorsInput.divider, DEFAULT_CONFIG.colors.divider),
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
const EDITOR_NUMBER_FIELDS = [
  { key: "battery_count", label: "Battery count", min: 1, max: 2, step: 1, integer: true, mode: "box" },
  { key: "bar_height", label: "Bar height", min: 24, max: 72, step: 1, integer: true, mode: "slider" },
  { key: "corner_radius", label: "Corner radius", min: 0, max: 30, step: 1, integer: true, mode: "slider" },
  { key: "track_blend", label: "Track blend", min: 0.15, max: 0.3, step: 0.01, mode: "slider" },
];
const EDITOR_NUMBER_FIELD_BY_KEY = Object.fromEntries(
  EDITOR_NUMBER_FIELDS.map((field) => [field.key, field]),
);
const EDITOR_BOOLEAN_FIELDS = [
  { key: "background_transparent", label: "Transparent background" },
];
const DECIMAL_FIELD_ORDER = [...DECIMAL_KEYS];
const ENTITY_SECTION_DEFS = [
  {
    id: "summary",
    title: "Summary",
    note: "Includes the system-level values plus the charge and discharge sensors used for the dynamic track color.",
    fields: [
      { key: "battery_charge", label: "Battery Charge" },
      { key: "battery_discharge", label: "Battery Discharge" },
      { key: "summary_soc", label: "Summary SoC" },
      { key: "summary_energy", label: "Summary Energy" },
      { key: "summary_device_temperature", label: "Device Temperature" },
    ],
  },
  {
    id: "batteries",
    title: "Batteries",
    note: "Battery 2 values remain configurable even when battery_count is set to 1.",
    groups: [
      {
        title: "Battery 1",
        fields: [
          { key: "battery1_soc", label: "Battery 1 SoC" },
          { key: "battery1_voltage", label: "Battery 1 Voltage" },
          { key: "battery1_temp", label: "Battery 1 Temperature" },
        ],
      },
      {
        title: "Battery 2",
        fields: [
          { key: "battery2_soc", label: "Battery 2 SoC" },
          { key: "battery2_voltage", label: "Battery 2 Voltage" },
          { key: "battery2_temp", label: "Battery 2 Temperature" },
        ],
      },
    ],
  },
];
const EDITOR_ENTITY_FIELDS = ENTITY_SECTION_DEFS.flatMap((section) => [
  ...(section.fields || []),
  ...((section.groups || []).flatMap((group) => group.fields)),
]);
const FIELD_HELP = {
  battery_count: "Show one or two battery columns.",
  bar_height: "Card row height in px.",
  corner_radius: "Corner radius of the bar container.",
  track_blend: "Blend factor between the base track and charge/discharge state colors.",
  background_transparent: "Makes the card background transparent and keeps only the track visible.",
  soc: "Decimal precision for summary and battery SoC values.",
  energy: "Decimal precision for summary energy.",
  temperature: "Decimal precision for summary and battery temperature values.",
  voltage: "Decimal precision for battery voltage values.",
  background: "Outer card background color.",
  track: "Base track color before state blending.",
  text: "Text and icon color.",
  divider: "Divider color between the three segments.",
  battery_charge: "Track accent color while charging.",
  battery_discharge: "Track accent color while discharging.",
  battery_idle: "Track accent color while idle.",
};

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

  static async getConfigElement() {
    if (!customElements.get("battery-bar-editor")) {
      customElements.define("battery-bar-editor", BatteryBarEditor);
    }
    return document.createElement("battery-bar-editor");
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
    this.style.setProperty("--bb-primary-font-summary", "17px");
    this.style.setProperty("--bb-primary-font-battery", "17px");
    this.style.setProperty("--bb-chip-font", "12px");
    this.style.setProperty("--bb-divider", colors.divider);
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

class BatteryBarEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = null;
    this._hass = null;
    this._rendered = false;
    this._refs = null;
    this._entityPickers = {};
    this._numberSelectors = {};
    this._booleanSelectors = {};
    this._inlineErrors = {};
    this._sectionCards = {};
    this._onFormChange = (event) => this._handleFormChange(event);
    this._onFormInput = (event) => this._handleFormInput(event);
    this._onValueChanged = (event) => this._handleValueChangedEvent(event);
  }

  set hass(hass) {
    this._hass = hass;
    this._syncSelectorHass();
  }

  connectedCallback() {
    this._render();
    if (this._config) {
      this._syncFormFromConfig();
      this._emitConfigAsync(this._config);
    }
  }

  disconnectedCallback() {
    const form = this._refs?.form;
    if (form) {
      form.removeEventListener("change", this._onFormChange);
      form.removeEventListener("input", this._onFormInput);
    }
    if (this.shadowRoot) {
      this.shadowRoot.removeEventListener("value-changed", this._onValueChanged);
    }
  }

  setConfig(config) {
    const incoming = config && typeof config === "object" ? config : {};
    this._config = normalizeEditorConfig({
      ...incoming,
      type: incoming.type || CARD_TYPE,
    });
    this._render();
    this._syncFormFromConfig();
    this._emitConfigAsync(this._config);
  }

  _emitConfigAsync(config) {
    if (!this.isConnected) {
      return;
    }
    emitConfigChanged(this, config);
  }

  _render() {
    if (!this.shadowRoot) {
      return;
    }
    if (!this._rendered) {
      this.shadowRoot.innerHTML = buildEditorMarkup();
      const form = this.shadowRoot.querySelector("form");
      if (form) {
        form.addEventListener("change", this._onFormChange);
        form.addEventListener("input", this._onFormInput);
      }
      this.shadowRoot.addEventListener("value-changed", this._onValueChanged);
      this._refs = { form, validation: this.shadowRoot.querySelector("#entity-validation") };
      this._buildEntityPickers();
      this._buildNumberSelectors();
      this._buildBooleanSelectors();
      this._collectEditorRefs();
      this._rendered = true;
    }
    this._syncSelectorHass();
  }

  _collectEditorRefs() {
    this._inlineErrors = {};
    this._sectionCards = {};
    for (const section of ENTITY_SECTION_DEFS) {
      this._sectionCards[section.id] = this.shadowRoot.querySelector(`[data-entity-card="${section.id}"]`);
    }
    for (const field of EDITOR_ENTITY_FIELDS) {
      this._inlineErrors[field.key] = this.shadowRoot.querySelector(`[data-inline-error="${field.key}"]`);
    }
  }

  _buildEntityPickers() {
    if (!this.shadowRoot) {
      return;
    }
    for (const field of EDITOR_ENTITY_FIELDS) {
      const slot = this.shadowRoot.querySelector(`[data-entity-slot="${field.key}"]`);
      if (!slot) {
        continue;
      }
      const picker = document.createElement("ha-selector");
      picker.dataset.entityKey = field.key;
      picker.configPath = `entities.${field.key}`;
      picker.selector = { entity: { domain: ["sensor", "input_number"] } };
      picker.value = "";
      slot.appendChild(picker);
      this._entityPickers[field.key] = picker;
    }
  }

  _buildNumberSelectors() {
    if (!this.shadowRoot) {
      return;
    }
    for (const field of EDITOR_NUMBER_FIELDS) {
      const slot = this.shadowRoot.querySelector(`[data-number-slot="${field.key}"]`);
      if (!slot) {
        continue;
      }
      const selector = document.createElement("ha-selector");
      selector.dataset.numberKey = field.key;
      selector.configPath = field.key;
      selector.selector = {
        number: {
          min: field.min,
          max: field.max,
          step: field.step,
          mode: field.mode || "slider",
        },
      };
      selector.value = DEFAULT_CONFIG[field.key];
      slot.appendChild(selector);
      this._numberSelectors[field.key] = selector;
    }

    for (const key of DECIMAL_FIELD_ORDER) {
      const slot = this.shadowRoot.querySelector(`[data-decimal-slot="${key}"]`);
      if (!slot) {
        continue;
      }
      const selector = document.createElement("ha-selector");
      selector.dataset.decimalKey = key;
      selector.configPath = `decimals.${key}`;
      selector.selector = {
        number: {
          min: 0,
          max: 2,
          step: 1,
          mode: "box",
        },
      };
      selector.value = DEFAULT_CONFIG.decimals[key];
      slot.appendChild(selector);
      this._numberSelectors[`decimals.${key}`] = selector;
    }
  }

  _buildBooleanSelectors() {
    if (!this.shadowRoot) {
      return;
    }
    for (const field of EDITOR_BOOLEAN_FIELDS) {
      const slot = this.shadowRoot.querySelector(`[data-boolean-slot="${field.key}"]`);
      if (!slot) {
        continue;
      }
      const selector = document.createElement("ha-selector");
      selector.dataset.booleanKey = field.key;
      selector.configPath = field.key;
      selector.selector = { boolean: {} };
      selector.value = Boolean(DEFAULT_CONFIG[field.key]);
      slot.appendChild(selector);
      this._booleanSelectors[field.key] = selector;
    }
  }

  _syncSelectorHass() {
    for (const picker of Object.values(this._entityPickers)) {
      picker.hass = this._hass;
    }
    for (const selector of Object.values(this._numberSelectors)) {
      selector.hass = this._hass;
    }
    for (const selector of Object.values(this._booleanSelectors)) {
      selector.hass = this._hass;
    }
  }

  _syncFormFromConfig() {
    if (!this.shadowRoot || !this._config) {
      return;
    }
    const cfg = this._config;

    for (const field of EDITOR_NUMBER_FIELDS) {
      const selector = this._numberSelectors[field.key];
      if (selector) {
        selector.value = cfg[field.key];
      }
    }

    for (const key of DECIMAL_FIELD_ORDER) {
      const selector = this._numberSelectors[`decimals.${key}`];
      if (selector) {
        selector.value = cfg.decimals?.[key] ?? DEFAULT_CONFIG.decimals[key];
      }
    }

    for (const field of EDITOR_ENTITY_FIELDS) {
      const picker = this._entityPickers[field.key];
      if (picker) {
        picker.value = String(cfg.entities?.[field.key] ?? DEFAULT_CONFIG.entities[field.key] ?? "");
      }
    }

    for (const field of EDITOR_BOOLEAN_FIELDS) {
      const selector = this._booleanSelectors[field.key];
      if (selector) {
        selector.value = Boolean(cfg[field.key]);
      }
    }

    for (const key of COLOR_KEYS) {
      setInputValue(this.shadowRoot, `colors.${key}`, normalizeHexColor(cfg.colors?.[key], DEFAULT_CONFIG.colors[key]));
    }

    this._updateValidationUI(cfg);
  }

  _handleFormChange(event) {
    const target = event?.target;
    if (!(target instanceof HTMLInputElement)) {
      return;
    }
    if (target.name?.startsWith("colors.")) {
      const colorKey = target.name.replace("colors.", "");
      const normalized = normalizeHexColor(target.value, DEFAULT_CONFIG.colors[colorKey] || "#000000");
      target.value = normalized;
      this._updateConfigPath(target.name, normalized);
    }
  }

  _handleFormInput(event) {
    const target = event?.target;
    if (!(target instanceof HTMLInputElement)) {
      return;
    }
    if (target.name?.startsWith("colors.")) {
      const colorKey = target.name.replace("colors.", "");
      const normalized = normalizeHexColor(target.value, DEFAULT_CONFIG.colors[colorKey] || "#000000");
      target.value = normalized;
      this._updateConfigPath(target.name, normalized);
    }
  }

  _handleValueChangedEvent(event) {
    const pathNodes = typeof event?.composedPath === "function" ? event.composedPath() : [];
    const source = pathNodes.find((node) => node && typeof node === "object" && node.configPath);
    const path = source?.configPath;
    if (!path) {
      return;
    }

    let value = event?.detail?.value;
    if (value === undefined) {
      value = source?.value;
    }

    if (EDITOR_NUMBER_FIELD_BY_KEY[path]) {
      const field = EDITOR_NUMBER_FIELD_BY_KEY[path];
      const numeric = parseNumberRange(value, DEFAULT_CONFIG[path], field.min, field.max, field.integer === true);
      this._updateConfigPath(path, numeric);
      return;
    }

    if (path.startsWith("decimals.")) {
      const decimalKey = path.replace("decimals.", "");
      const numeric = parseNumberRange(value, DEFAULT_CONFIG.decimals[decimalKey], 0, 2, true);
      this._updateConfigPath(path, numeric);
      return;
    }

    if (path.startsWith("entities.")) {
      const text = String(value ?? "").trim();
      this._updateConfigPath(path, text.length > 0 ? text : undefined);
      return;
    }

    this._updateConfigPath(path, value);
  }

  _updateConfigPath(path, value) {
    const next = cloneDeep(this._config);
    setPathValue(next, path, value);
    this._config = normalizeEditorConfig(next);
    this._syncFormFromConfig();
    this._emitConfigAsync(this._config);
  }

  _updateValidationUI(config) {
    const fieldErrors = {};
    for (const key of ENTITY_KEYS) {
      if (!config.entities?.[key] || typeof config.entities[key] !== "string" || config.entities[key].trim().length === 0) {
        fieldErrors[key] = "Missing entity.";
      }
    }

    for (const section of ENTITY_SECTION_DEFS) {
      const fields = [
        ...(section.fields || []),
        ...((section.groups || []).flatMap((group) => group.fields)),
      ];
      const hasError = fields.some((field) => Boolean(fieldErrors[field.key]));
      const card = this._sectionCards[section.id];
      if (card) {
        card.classList.toggle("invalid", hasError);
        if (hasError && "open" in card) {
          card.open = true;
        }
      }
      for (const field of fields) {
        const inlineError = this._inlineErrors[field.key];
        if (inlineError) {
          inlineError.textContent = fieldErrors[field.key] || "";
        }
      }
    }

    if (!this._refs?.validation) {
      return;
    }
    const missing = ENTITY_KEYS.filter((key) => fieldErrors[key]);
    if (missing.length === 0) {
      this._refs.validation.hidden = true;
      this._refs.validation.textContent = "";
      return;
    }
    this._refs.validation.hidden = false;
    this._refs.validation.textContent = `Missing entities: ${missing.join(", ")}.`;
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
        --bb-primary-font-summary: 17px;
        --bb-primary-font-battery: 17px;
        --bb-chip-font: 12px;
        --bb-divider: #f4f7fa;
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

function buildEditorMarkup() {
  return `
    <style>
      :host {
        display: block;
      }

      .editor {
        padding: 12px;
        display: grid;
        gap: 12px;
      }

      .section {
        border: 1px solid var(--divider-color, rgba(127, 127, 127, 0.3));
        border-radius: 10px;
        padding: 12px;
        display: grid;
        gap: 10px;
      }

      .section h3 {
        margin: 0;
        font-size: 14px;
        font-weight: 600;
      }

      .section summary {
        list-style: none;
        cursor: pointer;
      }

      .section summary::-webkit-details-marker {
        display: none;
      }

      .section-summary {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
      }

      .section-summary::after {
        content: "▾";
        opacity: 0.7;
        font-size: 12px;
      }

      details.section:not([open]) .section-summary::after {
        content: "▸";
      }

      .section-content {
        display: grid;
        gap: 12px;
        margin-top: 12px;
      }

      .section-note {
        margin: 0;
        font-size: 12px;
        color: var(--secondary-text-color, #8f97a3);
      }

      .validation {
        font-size: 12px;
        line-height: 1.35;
        color: var(--error-color, #db4437);
        background: color-mix(in srgb, var(--error-color, #db4437) 12%, transparent);
        border: 1px solid color-mix(in srgb, var(--error-color, #db4437) 35%, transparent);
        border-radius: 8px;
        padding: 8px 10px;
      }

      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 10px 12px;
      }

      .entity-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
        gap: 10px 12px;
      }

      .entity-card {
        border: 1px solid var(--divider-color, rgba(127, 127, 127, 0.3));
        border-radius: 10px;
        padding: 0;
        display: grid;
        gap: 0;
        overflow: hidden;
      }

      .entity-card > summary {
        list-style: none;
      }

      .entity-card > summary::-webkit-details-marker {
        display: none;
      }

      .entity-summary {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        padding: 10px;
        cursor: pointer;
        background: color-mix(in srgb, var(--primary-text-color, #fff) 4%, transparent);
      }

      .entity-summary::after {
        content: "▾";
        opacity: 0.7;
        font-size: 12px;
      }

      .entity-card:not([open]) .entity-summary::after {
        content: "▸";
      }

      .entity-content {
        display: grid;
        gap: 8px;
        padding: 10px;
      }

      .entity-subsection {
        display: grid;
        gap: 8px;
      }

      .entity-subsection + .entity-subsection {
        padding-top: 10px;
        border-top: 1px solid color-mix(in srgb, var(--divider-color, rgba(127, 127, 127, 0.3)) 70%, transparent);
      }

      .entity-title {
        margin: 0;
        font-size: 13px;
        font-weight: 600;
      }

      .entity-subtitle {
        margin: 0;
        font-size: 12px;
        font-weight: 600;
        color: var(--primary-text-color, inherit);
      }

      .entity-hint {
        margin: 0;
        font-size: 12px;
        color: var(--secondary-text-color, #8f97a3);
      }

      .entity-picker-slot {
        min-height: 56px;
      }

      .entity-inline-error {
        margin: 0;
        min-height: 16px;
        font-size: 12px;
        color: var(--error-color, #db4437);
      }

      .entity-card.invalid {
        border-color: color-mix(in srgb, var(--error-color, #db4437) 55%, transparent);
      }

      .field {
        display: grid;
        gap: 6px;
        min-width: 0;
      }

      .field-meta {
        display: grid;
        gap: 2px;
      }

      .field-label {
        font-size: 12px;
        color: var(--secondary-text-color, #8f97a3);
      }

      .field-label-strong {
        font-size: 12px;
        font-weight: 600;
        color: var(--primary-text-color, inherit);
      }

      .field input[type="color"] {
        padding: 0;
        min-height: 36px;
        width: 100%;
        box-sizing: border-box;
        border: 1px solid var(--divider-color, rgba(127, 127, 127, 0.3));
        border-radius: 8px;
        background: transparent;
      }

      .selector-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
        gap: 10px 12px;
      }

      .selector-slot {
        min-height: 56px;
      }

      .field-help {
        margin: 0;
        font-size: 12px;
        color: var(--secondary-text-color, #8f97a3);
      }
    </style>
    <form class="editor">
      <details class="section">
        <summary class="section-summary">
          <h3>Layout & Styling</h3>
        </summary>
        <div class="section-content">
          <div class="selector-grid">
            ${EDITOR_NUMBER_FIELDS.filter((field) => field.key !== "battery_count").map((field) => buildNumberSelectorSlot(field)).join("")}
            ${EDITOR_BOOLEAN_FIELDS.map((field) => buildBooleanSelectorSlot(field)).join("")}
          </div>
          <div class="grid">
            ${COLOR_KEYS.map((key) => buildColorField(`colors.${key}`, colorFieldLabel(key), FIELD_HELP[key] || "")).join("")}
          </div>
        </div>
      </details>

      <details class="section">
        <summary class="section-summary">
          <h3>Decimals</h3>
        </summary>
        <div class="section-content">
          <div class="selector-grid">
            ${DECIMAL_FIELD_ORDER.map((key) => buildDecimalSelectorSlot(key)).join("")}
          </div>
        </div>
      </details>

      <section class="section">
        <h3>Entities</h3>
        <p class="section-note">Summary has its own section. Battery 1 and Battery 2 are grouped together to match the card layout.</p>
        <div id="entity-validation" class="validation" hidden></div>
        <div class="entity-grid">
          ${ENTITY_SECTION_DEFS.map((section) => buildEntitySectionCard(section)).join("")}
        </div>
      </section>
    </form>
  `;
}

function buildNumberSelectorSlot(field) {
  return `
    <div class="field">
      <div class="field-meta">
        <span class="field-label-strong">${field.label}</span>
        <p class="field-help">${FIELD_HELP[field.key] || ""}</p>
      </div>
      <div class="selector-slot" data-number-slot="${field.key}"></div>
    </div>
  `;
}

function buildBooleanSelectorSlot(field) {
  return `
    <div class="field">
      <div class="field-meta">
        <span class="field-label-strong">${field.label}</span>
        <p class="field-help">${FIELD_HELP[field.key] || ""}</p>
      </div>
      <div class="selector-slot" data-boolean-slot="${field.key}"></div>
    </div>
  `;
}

function buildDecimalSelectorSlot(key) {
  return `
    <div class="field">
      <div class="field-meta">
        <span class="field-label-strong">${decimalFieldLabel(key)}</span>
        <p class="field-help">${FIELD_HELP[key] || ""}</p>
      </div>
      <div class="selector-slot" data-decimal-slot="${key}"></div>
    </div>
  `;
}

function buildEntitySectionCard(section) {
  if (section.id === "batteries") {
    return buildBatteryEntitySectionCard(section);
  }

  const note = section.note ? `<p class="entity-hint">${section.note}</p>` : "";
  const directFields = (section.fields || []).map((field) => buildEntityFieldBlock(field)).join("");
  const groupedFields = (section.groups || []).map((group) => `
    <div class="entity-subsection">
      <h5 class="entity-subtitle">${group.title}</h5>
      <div class="grid">
        ${group.fields.map((field) => buildEntityFieldBlock(field)).join("")}
      </div>
    </div>
  `).join("");

  return `
    <details class="entity-card" data-entity-card="${section.id}">
      <summary class="entity-summary">
        <h4 class="entity-title">${section.title}</h4>
      </summary>
      <div class="entity-content">
        ${note}
        ${directFields}
        ${groupedFields}
      </div>
    </details>
  `;
}

function buildBatteryEntitySectionCard(section) {
  const note = section.note ? `<p class="entity-hint">${section.note}</p>` : "";
  const [battery1Group, battery2Group] = section.groups || [];

  return `
    <details class="entity-card" data-entity-card="${section.id}">
      <summary class="entity-summary">
        <h4 class="entity-title">${section.title}</h4>
      </summary>
      <div class="entity-content">
        ${note}
        <div class="entity-subsection">
          ${buildNumberSelectorSlot(EDITOR_NUMBER_FIELD_BY_KEY.battery_count)}
        </div>
        <div class="entity-subsection">
          <div class="grid">
            ${(battery1Group?.fields || []).map((field) => buildEntityFieldBlock(field)).join("")}
          </div>
        </div>
        <div class="entity-subsection">
          <div class="grid">
            ${(battery2Group?.fields || []).map((field) => buildEntityFieldBlock(field)).join("")}
          </div>
        </div>
      </div>
    </details>
  `;
}

function buildEntityFieldBlock(field) {
  return `
    <div class="field">
      <div class="field-meta">
        <span class="field-label-strong">${field.label}</span>
      </div>
      <div class="entity-picker-slot" data-entity-slot="${field.key}"></div>
      <p class="entity-inline-error" data-inline-error="${field.key}"></p>
    </div>
  `;
}

function buildColorField(name, label, helpText = "") {
  return `
    <label class="field">
      <div class="field-meta">
        <span class="field-label-strong">${label}</span>
        ${helpText ? `<p class="field-help">${helpText}</p>` : ""}
      </div>
      <input type="color" name="${name}" />
    </label>
  `;
}

function colorFieldLabel(key) {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function decimalFieldLabel(key) {
  return `${key.charAt(0).toUpperCase()}${key.slice(1)} decimals`;
}

function setInputValue(root, name, value) {
  const input = root.querySelector(`input[name="${name}"]`);
  if (!input) {
    return;
  }
  input.value = String(value ?? "");
}

function parseNumberRange(raw, fallback, min, max, integer) {
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  const bounded = clamp(min, parsed, max);
  if (integer) {
    return Math.round(bounded);
  }
  return bounded;
}

function normalizeHexColor(value, fallback) {
  const raw = String(value ?? "").trim();
  if (/^#[0-9A-Fa-f]{6}$/.test(raw)) {
    return raw.toUpperCase();
  }
  return String(fallback || "#000000").toUpperCase();
}

function normalizeEditorConfig(config) {
  const normalized = normalizeConfig(config);
  return {
    ...normalized,
    type: CARD_TYPE,
    entities: { ...normalized.entities },
    decimals: { ...normalized.decimals },
    colors: { ...normalized.colors },
  };
}

function cloneDeep(value) {
  return JSON.parse(JSON.stringify(value));
}

function setPathValue(config, path, value) {
  if (!path || typeof path !== "string" || !config || typeof config !== "object") {
    return;
  }

  const parts = path.split(".");
  if (parts.length === 1) {
    if (value === undefined) {
      delete config[parts[0]];
    } else {
      config[parts[0]] = value;
    }
    return;
  }

  let target = config;
  for (let i = 0; i < (parts.length - 1); i += 1) {
    const key = parts[i];
    if (!target[key] || typeof target[key] !== "object") {
      target[key] = {};
    }
    target = target[key];
  }

  const leaf = parts[parts.length - 1];
  if (value === undefined) {
    delete target[leaf];
  } else {
    target[leaf] = value;
  }

  pruneEmptyPath(config, parts);
}

function pruneEmptyPath(config, parts) {
  for (let i = parts.length - 1; i > 0; i -= 1) {
    const parentPath = parts.slice(0, i);
    const parent = getPathValue(config, parentPath);
    if (!parent || typeof parent !== "object" || Object.keys(parent).length > 0) {
      continue;
    }

    const container = i === 1 ? config : getPathValue(config, parts.slice(0, i - 1));
    if (container && typeof container === "object") {
      delete container[parts[i - 1]];
    }
  }
}

function getPathValue(config, parts) {
  let value = config;
  for (const part of parts) {
    if (!value || typeof value !== "object") {
      return undefined;
    }
    value = value[part];
  }
  return value;
}

function emitConfigChanged(node, config) {
  node.dispatchEvent(new CustomEvent("config-changed", {
    detail: { config },
    bubbles: true,
    composed: true,
  }));
}

/* src/index.js */
registerCard();
