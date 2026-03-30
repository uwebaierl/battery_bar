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
} from "./_shared/config-cleanup.js";
import { blendHex, pickBestTextColor } from "./_shared/color.js";
import {
  buildColorOverrideEditorState,
  hasColorOverrides,
  normalizeTrackBlendOverrideValue,
  pickMappedStringValues,
  registerCustomCardMetadata,
  resolveEditorBackgroundColor,
  syncEditorFormsHass,
} from "./_shared/editor.js";
import { openMoreInfo } from "./_shared/interaction.js";
import { computeEntitySignature } from "./_shared/signature.js";
import {
  BATTERY2_ENTITY_KEYS,
  CARD_ELEMENT_TAG,
  CARD_NAME,
  CARD_TYPE,
  DEFAULT_CONFIG,
  REQUIRED_ENTITY_KEYS,
} from "./constants.js";
import {
  BATTERY_CONFIG_CLEANUP_STEPS,
  BATTERY_EDITOR_CLEANUP_STEPS,
} from "./migrations.js";
import { normalizeConfig, validateConfig } from "./validate.js";
import {
  buildBackgroundColorField,
  buildBoxNumberSelector,
  buildColorTextSelector,
  buildSliderNumberSelector,
  EDITOR_SCHEMA_RANGE_BAR_HEIGHT,
  EDITOR_SCHEMA_RANGE_CORNER_RADIUS,
  EDITOR_SCHEMA_RANGE_TRACK_BLEND,
} from "./_shared/editor-schema.js";
import {
  buildCardPreviewMarkup,
  buildCardPreviewStyles,
  hasRequiredEntityValues,
  syncCardPreviewVisibility,
} from "./_shared/preview.js";
import {
  applyEditorIncomingConfig,
  commitEditorRawConfig,
  createEditorCleanupState,
  ensureSingleFormEditor,
  renderSingleFormEditor,
} from "./_shared/editor-controller.js";
import {
  applyMetricButtonState,
  buildMetricButtonMarkup,
} from "./_shared/metric-button.js";
import {
  CHIP_ICON_TINT,
  CHIP_ICON_Y_OFFSET,
  CHIP_FONT_PX,
  CHIP_METRIC_FONT_WEIGHT,
  CHIP_METRIC_GAP_PX,
  CHIP_ICON_SCALE,
  DEFAULT_TEXT_COLOR,
  DEFAULT_TRACK_COLOR,
  FIXED_LINE_GAP_PX,
  FOCUS_RING_OUTLINE,
  FOCUS_RING_RADIUS_PX,
  PRIMARY_ICON_TINT,
  PRIMARY_ICON_SCALE,
  PRIMARY_METRIC_FONT_PX,
  PRIMARY_METRIC_GAP_PX,
  PRIMARY_METRIC_LETTER_SPACING,
  PRIMARY_METRIC_LINE_HEIGHT,
  PRIMARY_METRIC_FONT_WEIGHT,
  SECONDARY_METRIC_GAP_PX,
  THREE_COLUMN_TEMPLATE,
} from "./_shared/layout-tokens.js";

const COLOR_EASING = "cubic-bezier(0.22, 1, 0.36, 1)";
const COLOR_TRANSITION = `260ms ${COLOR_EASING}`;
const PRIMARY_SETTLE_DURATION_MS = 220;
const EDITOR_ELEMENT_TAG = "battery-bar-editor";
const CARD_DESCRIPTION = "Battery Bar: compact battery summary and status card for Home Assistant.";
const BATTERY_COLOR_FIELD_MAP = {
  track: ["track"],
  text_light: ["text_light", "text"],
  text_dark: ["text_dark", "text"],
  divider: ["divider"],
  energy_storage_in: ["energy_storage_in"],
  energy_storage_out: ["energy_storage_out"],
  home_load: ["home_load"],
};

export class BatteryBarCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = null;
    this._hass = null;
    this._rendered = false;
    this._lastSignature = "";
    this._refs = null;
    this._showPreviewPlaceholder = false;
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
      if (!this._showPreviewPlaceholder) {
        this._renderModel();
      }
    }
  }

  disconnectedCallback() {
    if (this._refs?.shell) {
      this._refs.shell.removeEventListener("click", this._onClick);
    }
  }

  setConfig(config) {
    const cleanup = runConfigCleanup(config, BATTERY_CONFIG_CLEANUP_STEPS);
    const incomingType = cleanup.config?.type || config?.type || CARD_TYPE;
    if (incomingType !== CARD_TYPE) {
      throw new Error(`Card type must be '${CARD_TYPE}'.`);
    }
    const normalized = normalizeConfig(cleanup.config);
    const hasRequiredEntities = hasRequiredEntityValues(
      normalized.entities,
      resolveRequiredBatteryKeys(normalized.battery_count),
    );
    if (hasRequiredEntities) {
      validateConfig(normalized);
    }
    this._config = normalized;
    this._lastSignature = "";

    this._ensureRendered();
    this._syncPreviewPlaceholder(!hasRequiredEntities);
    this._applyTheme();
    if (!this._showPreviewPlaceholder) {
      this._renderModel();
    }
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._config) {
      return;
    }
    if (this._showPreviewPlaceholder) {
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
          ${buildCardPreviewMarkup(CARD_DESCRIPTION)}
          <div class="card-content">
            <section class="section section--summary" aria-label="Battery summary">
              <div class="primary-row">
                ${buildMetricButtonMarkup("summary-primary", true)}
              </div>
              <div class="chip-row chip-row--summary">
                ${buildMetricButtonMarkup("summary-energy", false)}
                ${buildMetricButtonMarkup("summary-device-temperature", false)}
              </div>
            </section>

            <section class="section section--battery" aria-label="Battery 1">
              <div class="primary-row">
                ${buildMetricButtonMarkup("battery1-primary", true)}
              </div>
              <div class="chip-row chip-row--battery">
                ${buildMetricButtonMarkup("battery1-voltage", false)}
                ${buildMetricButtonMarkup("battery1-temp", false)}
              </div>
            </section>

            <section class="section section--battery" aria-label="Battery 2">
              <div class="primary-row">
                ${buildMetricButtonMarkup("battery2-primary", true)}
              </div>
              <div class="chip-row chip-row--battery">
                ${buildMetricButtonMarkup("battery2-voltage", false)}
                ${buildMetricButtonMarkup("battery2-temp", false)}
              </div>
            </section>
          </div>
        </div>
      </ha-card>
      ${styles()}
    `;

    this._refs = {
      shell: this.shadowRoot.querySelector(".shell"),
      previewPlaceholder: this.shadowRoot.querySelector(".card-preview-placeholder"),
      content: this.shadowRoot.querySelector(".card-content"),
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

  _syncPreviewPlaceholder(showPlaceholder) {
    this._showPreviewPlaceholder = showPlaceholder === true;
    syncCardPreviewVisibility(
      this._refs?.previewPlaceholder,
      [this._refs?.content],
      this._showPreviewPlaceholder,
    );
  }

  _renderModel() {
    const config = this._config || DEFAULT_CONFIG;
    const model = buildCardModel(config, this._hass);
    const singleBattery = config.battery_count === 1;

    this.style.setProperty("--card-columns", THREE_COLUMN_TEMPLATE);
    if (this._refs.battery1Section) {
      this._refs.battery1Section.style.gridColumn = singleBattery ? "2 / 4" : "";
    }
    if (this._refs.battery2Section) {
      this._refs.battery2Section.style.display = singleBattery ? "none" : "";
    }

    applyMetricButtonState(this._hass, this._refs.summaryPrimary, model.summary.primary, buildMetricOptions(true));
    applyMetricButtonState(this._hass, this._refs.summaryEnergy, model.summary.chips[0], buildMetricOptions());
    applyMetricButtonState(this._hass, this._refs.summaryDeviceTemperature, model.summary.chips[1], buildMetricOptions());
    applyMetricButtonState(this._hass, this._refs.battery1Primary, model.battery1.primary, buildMetricOptions(true));
    applyMetricButtonState(this._hass, this._refs.battery1Voltage, model.battery1.chips[0], buildMetricOptions());
    applyMetricButtonState(this._hass, this._refs.battery1Temp, model.battery1.chips[1], buildMetricOptions());
    if (model.battery2) {
      applyMetricButtonState(this._hass, this._refs.battery2Primary, model.battery2.primary, buildMetricOptions(true));
      applyMetricButtonState(this._hass, this._refs.battery2Voltage, model.battery2.chips[0], buildMetricOptions());
      applyMetricButtonState(this._hass, this._refs.battery2Temp, model.battery2.chips[1], buildMetricOptions());
    }
  }

  _applyTheme() {
    const config = this._config || normalizeConfig(BatteryBarCard.getStubConfig());
    const colors = config.colors;
    const trackBackground = resolveTrackBackground(config, this._hass);
    const textColor = pickBestTextColor(trackBackground, colors.text_light, colors.text_dark);

    this.style.setProperty("--card-bar-height", `${config.bar_height}px`);
    this.style.setProperty("--card-radius", `${config.corner_radius}px`);
    this.style.setProperty("--card-bg", config.background_transparent ? "transparent" : colors.background);
    this.style.setProperty("--card-track", trackBackground);
    this.style.setProperty("--card-text", textColor);
    this.style.setProperty("--card-line-gap", `${FIXED_LINE_GAP_PX}px`);
    this.style.setProperty("--card-primary-font", PRIMARY_METRIC_FONT_PX);
    this.style.setProperty("--card-chip-font", CHIP_FONT_PX);
    this.style.setProperty("--card-divider", colors.divider);
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
    this._cleanupState = createEditorCleanupState();
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
    const cleanup = applyEditorIncomingConfig(
      this,
      config,
      BATTERY_EDITOR_CLEANUP_STEPS,
      CARD_TYPE,
      normalizeColorPresetName,
      normalizeConfig,
    );
    this._render();
    if (cleanup.changed) {
      queueConfigCleanup(this, this._rawConfig, this._cleanupState);
    }
  }

  _render() {
    this._form = ensureSingleFormEditor(this, this._onFormValueChanged);
    if (!this._form) {
      return;
    }
    renderSingleFormEditor(
      this,
      () => normalizeConfig(BatteryBarCard.getStubConfig()),
      buildEditorFormSchema,
      buildBatteryEditorFormData,
    );
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
        ...pickMappedStringValues(this._config?.colors, BATTERY_COLOR_FIELD_MAP),
        ...(hadOverrides ? pickMappedStringValues(value.colors, BATTERY_COLOR_FIELD_MAP) : {}),
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

    commitEditorRawConfig(this, nextRaw, normalizeConfig);
    this._render();
    emitConfigChanged(this, this._rawConfig);
  }

}

function styles() {
  return `
    <style>
      :host {
        display: block;
        --card-bar-height: ${DEFAULT_CONFIG.bar_height}px;
        --card-radius: ${DEFAULT_CONFIG.corner_radius}px;
        --card-bg: transparent;
        --card-track: ${DEFAULT_TRACK_COLOR};
        --card-columns: ${THREE_COLUMN_TEMPLATE};
        --card-text: ${DEFAULT_TEXT_COLOR};
        --card-line-gap: ${FIXED_LINE_GAP_PX}px;
        --card-primary-font: ${PRIMARY_METRIC_FONT_PX};
        --card-chip-font: ${CHIP_FONT_PX};
        --card-chip-font-weight: ${CHIP_METRIC_FONT_WEIGHT};
        --card-primary-gap: ${PRIMARY_METRIC_GAP_PX}px;
        --card-secondary-gap: ${SECONDARY_METRIC_GAP_PX}px;
        --card-chip-gap: ${CHIP_METRIC_GAP_PX}px;
        --card-focus-outline: ${FOCUS_RING_OUTLINE};
        --card-focus-radius: ${FOCUS_RING_RADIUS_PX}px;
        --card-primary-line-height: ${PRIMARY_METRIC_LINE_HEIGHT};
        --card-primary-letter-spacing: ${PRIMARY_METRIC_LETTER_SPACING};
        --card-primary-icon-tint: ${PRIMARY_ICON_TINT}%;
        --card-chip-icon-tint: ${CHIP_ICON_TINT}%;
        --card-chip-icon-offset-y: ${CHIP_ICON_Y_OFFSET};
        --card-divider: #f4f7fa;
        color: var(--card-text);
      }

      * {
        box-sizing: border-box;
      }

      ha-card {
        background: var(--card-bg);
        color: var(--card-text);
        transition: background-color ${COLOR_TRANSITION}, color ${COLOR_TRANSITION};
        box-shadow: none !important;
        border: 0 !important;
      }

      .shell {
        width: 100%;
        display: block;
      }

      ${buildCardPreviewStyles("--card-bar-height")}

      .card-content {
        width: 100%;
        height: 100%;
        display: grid;
        grid-template-columns: var(--card-columns);
        align-items: stretch;
        grid-column: 1 / -1;
        height: var(--card-bar-height);
        background: var(--card-track);
        color: var(--card-text);
        transition: background-color ${COLOR_TRANSITION}, color ${COLOR_TRANSITION};
        border-radius: var(--card-radius);
        overflow: hidden;
      }

      .card-content[hidden] {
        display: none !important;
      }

      .section {
        min-width: 0;
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: var(--card-line-gap);
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
        background: color-mix(in srgb, var(--card-divider) 34%, transparent);
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
        gap: var(--card-secondary-gap);
      }

      .metric-button {
        min-width: 0;
        padding: 0;
        margin: 0;
        border: 0;
        background: transparent;
        color: var(--card-text);
        font: inherit;
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
        font-variant-numeric: tabular-nums;
      }

      .metric-button:focus-visible {
        outline: var(--card-focus-outline);
        outline-offset: 2px;
        border-radius: var(--card-focus-radius);
      }

      .metric-button:disabled {
        cursor: default;
      }

      .metric-button--primary {
        max-width: 100%;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: var(--card-primary-gap);
      }

      .metric-button--chip {
        max-width: 100%;
        display: inline-flex;
        align-items: center;
        gap: var(--card-chip-gap);
        line-height: 1;
        position: relative;
      }

      .chip-row--battery .metric-button--chip + .metric-button--chip {
        margin-left: var(--card-secondary-gap);
      }

      .metric-icon {
        flex: 0 0 auto;
        display: block;
        align-self: center;
        margin: 0;
        padding: 0;
        vertical-align: middle;
        line-height: 1;
        --icon-primary-color: currentColor;
      }

      .metric-icon--primary {
        width: calc(var(--card-primary-font) * ${PRIMARY_ICON_SCALE});
        height: calc(var(--card-primary-font) * ${PRIMARY_ICON_SCALE});
        --mdc-icon-size: calc(var(--card-primary-font) * ${PRIMARY_ICON_SCALE});
        color: color-mix(in srgb, currentColor var(--card-primary-icon-tint), transparent);
      }

      .metric-icon--chip {
        width: auto;
        height: auto;
        --mdc-icon-size: calc(var(--card-chip-font) * ${CHIP_ICON_SCALE});
        color: color-mix(in srgb, currentColor var(--card-chip-icon-tint), transparent);
        transform: translateY(var(--card-chip-icon-offset-y));
      }

      .metric-text {
        min-width: 0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .metric-button--primary .metric-text {
        font-size: var(--card-primary-font);
        font-weight: ${PRIMARY_METRIC_FONT_WEIGHT};
        line-height: var(--card-primary-line-height);
        letter-spacing: var(--card-primary-letter-spacing);
      }

      .metric-button--chip .metric-text {
        display: block;
        font-size: var(--card-chip-font);
        font-weight: var(--card-chip-font-weight);
        line-height: 1;
        align-self: center;
      }
    </style>
  `;
}

export function registerCard() {
  if (!customElements.get(CARD_ELEMENT_TAG)) {
    customElements.define(CARD_ELEMENT_TAG, BatteryBarCard);
  }

  registerCustomCardMetadata(
    CARD_ELEMENT_TAG,
    CARD_NAME,
    CARD_DESCRIPTION,
  );
}

function buildMetricOptions(settleOnChange = false) {
  return {
    defaultAriaLabel: "Battery metric",
    settleOnChange,
    settleDurationMs: PRIMARY_SETTLE_DURATION_MS,
    settleEasing: COLOR_EASING,
  };
}

function resolveRequiredBatteryKeys(batteryCount) {
  return Number(batteryCount) === 2
    ? [...REQUIRED_ENTITY_KEYS, ...BATTERY2_ENTITY_KEYS]
    : REQUIRED_ENTITY_KEYS;
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
  return [
    {
      type: "expandable",
      title: "Layout & Motion",
      schema: [
        { name: "battery_count", label: "Number of battery segments", required: true, selector: buildBoxNumberSelector({ min: 1, max: 2, step: 1 }) },
        { name: "bar_height", label: "Bar height (px)", required: true, selector: buildSliderNumberSelector(EDITOR_SCHEMA_RANGE_BAR_HEIGHT) },
        { name: "corner_radius", label: "Corner radius (px)", required: true, selector: buildSliderNumberSelector(EDITOR_SCHEMA_RANGE_CORNER_RADIUS) },
        {
          type: "grid",
          name: "colors",
          schema: [buildBackgroundColorField()],
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
  return [
    { name: "track", label: "Base track color", required: false, selector: buildColorTextSelector() },
    { name: "text_light", label: "Light text and icon color", required: false, selector: buildColorTextSelector() },
    { name: "text_dark", label: "Dark text and icon color", required: false, selector: buildColorTextSelector() },
    { name: "divider", label: "Divider line color", required: false, selector: buildColorTextSelector() },
    { name: "energy_storage_in", label: "Battery charge color", required: false, selector: buildColorTextSelector() },
    { name: "energy_storage_out", label: "Battery discharge color", required: false, selector: buildColorTextSelector() },
    { name: "home_load", label: "Idle state color", required: false, selector: buildColorTextSelector() },
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
      selector: buildSliderNumberSelector(EDITOR_SCHEMA_RANGE_TRACK_BLEND),
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
    ...buildColorOverrideEditorState(config, rawConfig, BATTERY_COLOR_FIELD_MAP, DEFAULT_CONFIG.colors.background),
  };
}
