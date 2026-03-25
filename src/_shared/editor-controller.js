import {
  buildBasicEditorStyles,
} from "./editor.js";
import {
  runConfigCleanup,
} from "./config-cleanup.js";

export function createEditorCleanupState() {
  return {
    pendingKey: "",
    lastAppliedKey: "",
  };
}

export function applyEditorIncomingConfig(host, incomingConfig, cleanupSteps, cardType, normalizeColorPresetName, normalizeConfig) {
  const incoming = isPlainObjectEditorControllerValue(incomingConfig) ? incomingConfig : {};
  const cleanup = runConfigCleanup(incoming, cleanupSteps);
  host._rawConfig = {
    ...cleanup.config,
    type: cleanup.config.type || incoming.type || cardType,
  };
  host._rawConfig.color_preset = normalizeColorPresetName(host._rawConfig.color_preset);
  host._config = normalizeConfig(host._rawConfig);
  return cleanup;
}

export function commitEditorRawConfig(host, nextRawConfig, normalizeConfig) {
  host._rawConfig = nextRawConfig;
  host._config = normalizeConfig(host._rawConfig);
}

export function ensureSingleFormEditor(host, onValueChanged) {
  if (!host.shadowRoot) {
    return null;
  }

  if (!host._form) {
    host.shadowRoot.innerHTML = `
      <div class="editor-shell">
        <ha-form class="editor-form"></ha-form>
      </div>
      ${buildBasicEditorStyles()}
    `;
    host._form = host.shadowRoot.querySelector(".editor-form");
    host._form?.addEventListener("value-changed", onValueChanged);
  }

  return host._form || null;
}

export function renderSingleFormEditor(host, buildFallbackConfig, buildSchema, buildData) {
  const form = host._form;
  if (!form) {
    return;
  }

  const config = host._config || buildFallbackConfig();
  form.hass = host._hass;
  form.schema = buildSchema(config, host._rawConfig);
  form.data = buildData(config, host._rawConfig);
  form.computeLabel = (schema) => schema.label || schema.name || "";
}

function isPlainObjectEditorControllerValue(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
