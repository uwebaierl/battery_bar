export const EDITOR_SCHEMA_RANGE_BAR_HEIGHT = Object.freeze({
  min: 24,
  max: 72,
  step: 1,
});

export const EDITOR_SCHEMA_RANGE_CORNER_RADIUS = Object.freeze({
  min: 0,
  max: 30,
  step: 1,
});

export const EDITOR_SCHEMA_RANGE_TRACK_BLEND = Object.freeze({
  min: 0.1,
  max: 0.4,
  step: 0.01,
});

export const EDITOR_SCHEMA_RANGE_ROW_GAP = Object.freeze({
  min: 0,
  max: 4,
  step: 0.1,
});

export const EDITOR_SCHEMA_RANGE_SPRING_STIFFNESS = Object.freeze({
  min: 80,
  max: 420,
  step: 1,
});

export const EDITOR_SCHEMA_RANGE_SPRING_DAMPING = Object.freeze({
  min: 10,
  max: 60,
  step: 1,
});

export const EDITOR_SCHEMA_RANGE_VALUE_TWEEN_MS = Object.freeze({
  min: 150,
  max: 250,
  step: 1,
});

export const EDITOR_SCHEMA_RANGE_VISIBILITY_THRESHOLD = Object.freeze({
  min: 0,
  max: 5000,
  step: 1,
});

export function buildColorTextSelector() {
  return { text: {} };
}

export function buildSliderNumberSelector(range) {
  return {
    number: {
      min: range.min,
      max: range.max,
      step: range.step,
      mode: "slider",
    },
  };
}

export function buildBoxNumberSelector(range) {
  return {
    number: {
      min: range.min,
      max: range.max,
      step: range.step,
      mode: "box",
    },
  };
}

export function buildBackgroundColorField(label = "Card background color") {
  return {
    name: "background",
    label,
    required: false,
    selector: buildColorTextSelector(),
  };
}
