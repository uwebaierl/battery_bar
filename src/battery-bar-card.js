import { buildCardModel, collectRelevantEntities } from "./battery-model.js";
import {
  getColorPresetOptions,
  normalizeColorPresetName,
} from "./_shared/color-presets.js";
import {
  emitConfigChanged,
  flushConfigCleanup,
  queueConfigCleanup,
  runConfigCleanup,
  createRemovePathsCleanup,
} from "./_shared/config-cleanup.js";
import { blendHex, pickBestTextColor } from "./_shared/color.js";
import { openMoreInfo } from "./_shared/interaction.js";
import { computeEntitySignature } from "./_shared/signature.js";
import {
  CARD_ELEMENT_TAG,
  CARD_NAME,
  CARD_TYPE,
  DEFAULT_CONFIG,
} from "./constants.js";
import { normalizeConfig, validateConfig } from "./validate.js";

const FIXED_LINE_GAP_PX = 3;
const COLOR_EASING = "cubic-bezier(0.22, 1, 0.36, 1)";
const COLOR_TRANSITION = `260ms ${COLOR_EASING}`;
const PRIMARY_SETTLE_DURATION_MS = 220;
const EDITOR_ELEMENT_TAG = "battery-bar-editor";
const CONFIG_CLEANUP_STEPS = [
  migrateLegacyBatteryColors,
];
const EDITOR_CLEANUP_STEPS = [
  createRemovePathsCleanup(["decimals"]),
  migrateLegacyBatteryColors,
];

export class BatteryBarCard extends HTMLElement {
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
    if (!customElements.get(EDITOR_ELEMENT_TAG)) {
      customElements.define(EDITOR_ELEMENT_TAG, BatteryBarEditor);
    }
    return document.createElement(EDITOR_ELEMENT_TAG);
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
    const cleanup = runConfigCleanup(config, CONFIG_CLEANUP_STEPS);
    const normalized = normalizeConfig(cleanup.config);
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
    const trackBackground = resolveTrackBackground(config, this._hass);
    const textColor = pickBestTextColor(trackBackground, colors.text_light, colors.text_dark);

    this.style.setProperty("--bb-bar-height", `${config.bar_height}px`);
    this.style.setProperty("--bb-radius", `${config.corner_radius}px`);
    this.style.setProperty("--bb-card-bg", config.background_transparent ? "transparent" : colors.background);
    this.style.setProperty("--bb-track-bg", trackBackground);
    this.style.setProperty("--bb-text", textColor);
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
    openMoreInfo(this, this._hass, entityId);
  }
}

class BatteryBarEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = null;
    this._rawConfig = null;
    this._hass = null;
    this._form = null;
    this._cleanupState = {
      pendingKey: "",
      lastAppliedKey: "",
    };
    this._onFormValueChanged = (event) => this._handleFormValueChangedEvent(event);
  }

  set hass(hass) {
    this._hass = hass;
    syncEditorFormsHass([this._form], hass);
  }

  connectedCallback() {
    this._render();
    flushConfigCleanup(this, this._cleanupState);
  }

  disconnectedCallback() {
    this._form?.removeEventListener("value-changed", this._onFormValueChanged);
  }

  setConfig(config) {
    const incoming = config && typeof config === "object" ? config : {};
    const cleanup = runConfigCleanup(incoming, EDITOR_CLEANUP_STEPS);
    this._rawConfig = {
      ...cleanup.config,
      type: cleanup.config.type || incoming.type || CARD_TYPE,
    };
    this._rawConfig.color_preset = normalizeColorPresetName(this._rawConfig.color_preset);
    this._config = normalizeConfig(this._rawConfig);
    this._render();
    if (cleanup.changed) {
      queueConfigCleanup(this, this._rawConfig, this._cleanupState);
    }
  }

  _render() {
    if (!this.shadowRoot) {
      return;
    }

    if (!this._form) {
      this.shadowRoot.innerHTML = `
        <div class="editor-shell">
          <ha-form class="editor-form"></ha-form>
        </div>
        ${editorStyles()}
      `;
      this._form = this.shadowRoot.querySelector(".editor-form");
      this._form?.addEventListener("value-changed", this._onFormValueChanged);
    }

    if (!this._form) {
      return;
    }
    const config = this._config || normalizeConfig(BatteryBarCard.getStubConfig());
    this._form.hass = this._hass;
    this._form.schema = buildEditorFormSchema(config, this._rawConfig);
    this._form.data = buildBatteryEditorFormData(config, this._rawConfig);
    this._form.computeLabel = (schema) => schema.label || schema.name || "";
  }

  _handleFormValueChangedEvent(event) {
    event.stopPropagation();
    const value = event?.detail?.value;
    if (!value || typeof value !== "object") {
      return;
    }

    const useOverrides = value.use_color_overrides === true;
    const hadOverrides = hasColorOverrides(this._rawConfig);
    const nextRaw = {
      ...(this._rawConfig || {}),
      ...value,
      type: CARD_TYPE,
      color_preset: normalizeColorPresetName(value.color_preset ?? this._rawConfig?.color_preset),
    };
    delete nextRaw.use_color_overrides;

    if (useOverrides) {
      nextRaw.colors = {
        ...resolveEditorBackgroundColor(value.colors, this._rawConfig?.colors),
        ...pickBatteryColorOverrides(this._config?.colors || DEFAULT_CONFIG.colors),
        ...(hadOverrides ? pickBatteryEditorColorOverrides(value.colors) : {}),
      };
      nextRaw.track_blend = normalizeTrackBlendOverrideValue(
        value.track_blend,
        this._config?.track_blend ?? DEFAULT_CONFIG.track_blend,
      );
    } else {
      nextRaw.colors = {
        ...resolveEditorBackgroundColor(value.colors, this._rawConfig?.colors),
      };
      delete nextRaw.track_blend;
      if (Object.keys(nextRaw.colors).length === 0) {
        delete nextRaw.colors;
      }
    }

    this._rawConfig = nextRaw;
    this._config = normalizeConfig(this._rawConfig);

    this._render();
    emitConfigChanged(this, this._rawConfig);
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

export function registerCard() {
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
    return blendHex(colors.track, colors.energy_storage_out, config?.track_blend);
  }

  if (chargeValue > 0) {
    return blendHex(colors.track, colors.energy_storage_in, config?.track_blend);
  }

  return blendHex(colors.track, colors.home_load, config?.track_blend);
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

function buildTopFormSchema() {
  const colorSelector = { text: {} };

  return [
    {
      type: "expandable",
      title: "Layout & Motion",
      schema: [
        { name: "battery_count", label: "Number of battery segments", required: true, selector: { number: { min: 1, max: 2, step: 1, mode: "box" } } },
        { name: "bar_height", label: "Bar height (px)", required: true, selector: { number: { min: 24, max: 72, step: 1, mode: "slider" } } },
        { name: "corner_radius", label: "Corner radius (px)", required: true, selector: { number: { min: 0, max: 30, step: 1, mode: "slider" } } },
        {
          type: "grid",
          name: "colors",
          schema: [
            { name: "background", label: "Card background color", required: false, selector: colorSelector },
          ],
        },
        { name: "background_transparent", label: "Use transparent card background", selector: { boolean: {} } },
      ],
    },
  ];
}

function buildBottomFormSchema(config) {
  const entitySelector = { entity: { domain: ["sensor", "input_number"] } };
  const batteryCount = Number(config?.battery_count) === 1 ? 1 : 2;
  const battery2Fields = batteryCount === 2
    ? [
      { name: "battery2_soc", label: "Battery 2 top row SoC entity", required: true, selector: entitySelector },
      { name: "battery2_voltage", label: "Battery 2 second row voltage entity", required: true, selector: entitySelector },
      { name: "battery2_temp", label: "Battery 2 second row temperature entity", required: true, selector: entitySelector },
    ]
    : [];

  return [
    {
      type: "expandable",
      title: "Entities",
      name: "entities",
      schema: [
        { name: "battery_charge", label: "Charge power entity", required: true, selector: entitySelector },
        { name: "battery_discharge", label: "Discharge power entity", required: true, selector: entitySelector },
        { name: "summary_soc", label: "Summary top row SoC entity", required: true, selector: entitySelector },
        { name: "summary_energy", label: "Summary second row energy entity", required: true, selector: entitySelector },
        { name: "summary_device_temperature", label: "Summary second row temperature entity", required: true, selector: entitySelector },
        { name: "battery1_soc", label: "Battery 1 top row SoC entity", required: true, selector: entitySelector },
        { name: "battery1_voltage", label: "Battery 1 second row voltage entity", required: true, selector: entitySelector },
        { name: "battery1_temp", label: "Battery 1 second row temperature entity", required: true, selector: entitySelector },
        ...battery2Fields,
      ],
    },
  ];
}

function buildColorOverridesGridSchema() {
  const colorSelector = { text: {} };

  return [
    { name: "track", label: "Base track color", required: false, selector: colorSelector },
    { name: "text_light", label: "Light text and icon color", required: false, selector: colorSelector },
    { name: "text_dark", label: "Dark text and icon color", required: false, selector: colorSelector },
    { name: "divider", label: "Divider line color", required: false, selector: colorSelector },
    { name: "energy_storage_in", label: "Battery charge color", required: false, selector: colorSelector },
    { name: "energy_storage_out", label: "Battery discharge color", required: false, selector: colorSelector },
    { name: "home_load", label: "Idle state color", required: false, selector: colorSelector },
  ];
}

function buildColorSectionSchema(showOverrides) {
  const schema = [
    {
      name: "color_preset",
      label: "Color preset",
      required: false,
      selector: {
        select: {
          mode: "dropdown",
          options: getColorPresetOptions(),
        },
      },
    },
    {
      name: "use_color_overrides",
      label: "Use custom color overrides",
      required: false,
      selector: { boolean: {} },
    },
  ];

  if (showOverrides) {
    schema.push({
      name: "track_blend",
      label: "Track blend",
      required: false,
      selector: { number: { min: 0.1, max: 0.4, step: 0.01, mode: "slider" } },
    });
    schema.push({
      type: "grid",
      name: "colors",
      schema: buildColorOverridesGridSchema(),
    });
  }

  return [
    {
      type: "expandable",
      title: "Colors",
      schema,
    },
  ];
}

function buildEditorFormSchema(config, rawConfig) {
  return [
    ...buildTopFormSchema(),
    ...buildColorSectionSchema(hasColorOverrides(rawConfig)),
    ...buildBottomFormSchema(config),
  ];
}

function buildBatteryEditorFormData(config, rawConfig) {
  return {
    ...config,
    use_color_overrides: hasColorOverrides(rawConfig),
    track_blend: resolveEditorTrackBlend(rawConfig, config.track_blend),
    colors: {
      ...pickBackgroundColor(rawConfig?.colors),
      ...pickBatteryEditorColorOverrides(rawConfig?.colors),
    },
  };
}

function buildTopFormData(config) {
  return {
    battery_count: config.battery_count,
    bar_height: config.bar_height,
    corner_radius: config.corner_radius,
    background_transparent: config.background_transparent,
    colors: pickBackgroundColor(config?.colors),
  };
}

function hasColorOverrides(config) {
  const colors = config?.colors;
  const hasTokenOverrides = Boolean(colors)
    && typeof colors === "object"
    && Object.entries(colors).some(
      ([key, value]) => key !== "background" && typeof value === "string" && value.trim().length > 0,
    );
  const trackBlend = Number(config?.track_blend);
  return hasTokenOverrides || Number.isFinite(trackBlend);
}

function editorStyles() {
  return `
    <style>
      .editor-shell {
        display: grid;
        gap: 12px;
      }
    </style>
  `;
}

function syncEditorFormsHass(forms, hass) {
  for (const form of forms) {
    if (form) {
      form.hass = hass;
    }
  }
}

function pickBatteryColorOverrides(colors) {
  const source = colors && typeof colors === "object" ? colors : {};
  return {
    track: source.track || DEFAULT_CONFIG.colors.track,
    text_light: source.text_light || source.text || DEFAULT_CONFIG.colors.text_light,
    text_dark: source.text_dark || source.text || DEFAULT_CONFIG.colors.text_dark,
    divider: source.divider || DEFAULT_CONFIG.colors.divider,
    energy_storage_in: source.energy_storage_in || DEFAULT_CONFIG.colors.energy_storage_in,
    energy_storage_out: source.energy_storage_out || DEFAULT_CONFIG.colors.energy_storage_out,
    home_load: source.home_load || DEFAULT_CONFIG.colors.home_load,
  };
}

function pickBatteryEditorColorOverrides(colors) {
  const source = colors && typeof colors === "object" ? colors : {};
  return {
    track: source.track || "",
    text_light: source.text_light || source.text || "",
    text_dark: source.text_dark || source.text || "",
    divider: source.divider || "",
    energy_storage_in: source.energy_storage_in || "",
    energy_storage_out: source.energy_storage_out || "",
    home_load: source.home_load || "",
  };
}

function pickBackgroundColor(colors) {
  if (!colors || typeof colors !== "object" || typeof colors.background !== "string" || colors.background.trim().length === 0) {
    return {};
  }
  const background = colors.background.trim();
  if (background.toUpperCase() === DEFAULT_CONFIG.colors.background) {
    return {};
  }
  return { background };
}

function resolveEditorBackgroundColor(formColors, fallbackColors) {
  if (formColors && typeof formColors === "object" && Object.prototype.hasOwnProperty.call(formColors, "background")) {
    return pickBackgroundColor(formColors);
  }
  return pickBackgroundColor(fallbackColors);
}

function resolveEditorTrackBlend(rawConfig, fallback) {
  const trackBlend = Number(rawConfig?.track_blend);
  if (!Number.isFinite(trackBlend)) {
    return fallback;
  }
  return Math.min(0.4, Math.max(0.1, trackBlend));
}

function normalizeTrackBlendOverrideValue(value, fallback) {
  const trackBlend = Number(value);
  if (!Number.isFinite(trackBlend)) {
    return fallback;
  }
  return Math.min(0.4, Math.max(0.1, trackBlend));
}

function migrateLegacyBatteryColors(config) {
  if (!config || typeof config !== "object" || !config.colors || typeof config.colors !== "object") {
    return config;
  }

  const colors = config.colors;
  const nextColors = {
    ...colors,
  };

  let changed = false;

  if (!nextColors.energy_storage_in && typeof colors.battery_charge === "string") {
    nextColors.energy_storage_in = colors.battery_charge;
    changed = true;
  }
  if (!nextColors.energy_storage_out && typeof colors.battery_discharge === "string") {
    nextColors.energy_storage_out = colors.battery_discharge;
    changed = true;
  }
  if (!nextColors.home_load && typeof colors.battery_idle === "string") {
    nextColors.home_load = colors.battery_idle;
    changed = true;
  }
  if (!nextColors.text_light && typeof colors.text === "string") {
    nextColors.text_light = colors.text;
    changed = true;
  }
  if (!nextColors.text_dark && typeof colors.text === "string") {
    nextColors.text_dark = colors.text;
    changed = true;
  }

  if ("battery_charge" in nextColors) {
    delete nextColors.battery_charge;
    changed = true;
  }
  if ("battery_discharge" in nextColors) {
    delete nextColors.battery_discharge;
    changed = true;
  }
  if ("battery_idle" in nextColors) {
    delete nextColors.battery_idle;
    changed = true;
  }
  if ("text" in nextColors) {
    delete nextColors.text;
    changed = true;
  }

  if (!changed) {
    return config;
  }

  return {
    ...config,
    colors: nextColors,
  };
}
