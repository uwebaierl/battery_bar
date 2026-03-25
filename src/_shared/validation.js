export function validateConfigObject(config) {
  if (!config || typeof config !== "object") {
    throw new Error("Invalid configuration.");
  }
}

export function validateCardType(config, cardType) {
  if (config.type !== cardType) {
    throw new Error(`Card type must be '${cardType}'.`);
  }
}

export function validateRange(value, key, min, max) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < min || numeric > max) {
    throw new Error(`${key} must be a number between ${min} and ${max}.`);
  }
}

export function validateOptionalRange(value, key, min, max) {
  if (value === undefined) {
    return;
  }
  validateRange(value, key, min, max);
}

export function validateIntegerRange(value, key, min, max) {
  const numeric = Number(value);
  if (!Number.isInteger(numeric) || numeric < min || numeric > max) {
    throw new Error(`${key} must be an integer between ${min} and ${max}.`);
  }
}

export function validateBoolean(value, key) {
  if (typeof value !== "boolean") {
    throw new Error(`${key} must be true or false.`);
  }
}

export function validateOptionalBoolean(value, key) {
  if (value === undefined) {
    return;
  }
  validateBoolean(value, key);
}

export function validateColorPresetValue(value, isKnownColorPreset) {
  if (value === undefined) {
    return;
  }
  if (typeof value !== "string" || typeof isKnownColorPreset !== "function" || !isKnownColorPreset(value)) {
    throw new Error("color_preset must be a supported preset name.");
  }
}

export function validateRequiredStringMap(values, keys, prefix) {
  if (!values || typeof values !== "object") {
    throw new Error(`${prefix} must be an object.`);
  }

  for (const key of keys) {
    const value = values[key];
    if (typeof value !== "string" || value.trim().length === 0) {
      throw new Error(`${prefix}.${key} must be a non-empty string.`);
    }
  }
}

export function validateRequiredEntityMap(values, keys) {
  if (!values || typeof values !== "object") {
    throw new Error("entities must be an object.");
  }

  for (const key of keys) {
    const value = values[key];
    if (typeof value !== "string" || value.trim().length === 0) {
      throw new Error(`entities.${key} must be a non-empty entity id string.`);
    }
  }
}

export function validateOptionalEntityMap(values, keys) {
  if (!values || typeof values !== "object") {
    throw new Error("entities must be an object.");
  }

  for (const key of keys) {
    const value = values[key];
    if (value !== undefined && value !== null && typeof value !== "string") {
      throw new Error(`entities.${key} must be an entity id string when set.`);
    }
  }
}

export function validateRequiredColorMap(values, keys) {
  if (!values || typeof values !== "object") {
    throw new Error("colors must be an object.");
  }

  for (const key of keys) {
    const value = values[key];
    if (typeof value !== "string" || value.trim().length === 0) {
      throw new Error(`colors.${key} must be a non-empty color string.`);
    }
  }
}

export function normalizeObjectInput(value) {
  return value && typeof value === "object" ? value : {};
}

export function normalizeString(value, fallback = "") {
  if (typeof value !== "string" || value.trim().length === 0) {
    return fallback;
  }
  return value.trim();
}

export function normalizeEntity(value) {
  return normalizeString(value, "");
}

export function normalizeOptionalEntity(value) {
  return normalizeString(value, "");
}

export function normalizeMappedStringValues(sourceValue, fieldMap, fallback = null) {
  const source = normalizeObjectInput(sourceValue);

  return Object.entries(fieldMap || {}).reduce((result, [key, candidates]) => {
    result[key] = normalizeCandidateValue(source, candidates, fallback);
    return result;
  }, {});
}

function normalizeCandidateValue(source, candidates, fallback) {
  const keys = Array.isArray(candidates) ? candidates : [candidates];
  for (const candidate of keys) {
    if (typeof source[candidate] === "string" && source[candidate].trim().length > 0) {
      return source[candidate].trim();
    }
  }
  return fallback;
}
