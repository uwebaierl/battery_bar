import { syncEntityIcon } from "./editor.js";

export function applyMetricButtonState(hass, button, metric, options = {}) {
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
  button.setAttribute("aria-label", metric?.title || options.defaultAriaLabel || "Metric");
  button.hidden = Boolean(options.hideWhenUnavailable && !metric?.configured);

  const iconEl = button.querySelector(".metric-icon");
  if (iconEl) {
    syncEntityIcon(iconEl, hass, metric?.stateObj || null);
  }

  if (options.settleOnChange && shouldAnimateMetricValueSettle(previousValue, nextValue)) {
    animateMetricButtonSettle(
      button,
      options.settleDurationMs ?? 220,
      options.settleEasing ?? "cubic-bezier(0.22, 1, 0.36, 1)",
    );
  }
}

export function buildMetricButtonMarkup(ref, primary) {
  const buttonClass = primary ? "metric-button metric-button--primary" : "metric-button metric-button--chip";
  const iconClass = primary ? "metric-icon metric-icon--primary" : "metric-icon metric-icon--chip";
  return `
    <button class="${buttonClass}" data-ref="${ref}" type="button">
      <ha-state-icon class="${iconClass}" hidden></ha-state-icon>
      <span class="metric-text">—</span>
    </button>
  `;
}

export function syncMetricButtonRowVisibility(row, ...buttons) {
  if (!row) {
    return;
  }
  const hasVisibleButton = buttons.some((button) => button && button.hidden !== true);
  row.hidden = !hasVisibleButton;
}

function shouldAnimateMetricValueSettle(previousValue, nextValue) {
  return Boolean(previousValue)
    && previousValue !== nextValue
    && previousValue !== "—"
    && nextValue !== "—";
}

function animateMetricButtonSettle(button, duration, easing) {
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
      duration,
      easing,
      fill: "none",
    },
  );
  animation.id = "primary-settle";
}
