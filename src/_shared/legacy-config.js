export function migrateLegacyColorConfig(config, colorAliases, options = {}) {
  if (!config || typeof config !== "object" || !config.colors || typeof config.colors !== "object") {
    return config;
  }

  const colors = config.colors;
  const nextColors = {
    ...colors,
  };
  let changed = false;

  for (const [nextKey, legacyKeys] of Object.entries(colorAliases || {})) {
    changed = moveLegacyColor(nextColors, legacyKeys, nextKey) || changed;
  }

  if (options.migrateTextPair !== false) {
    const legacyTextKey = options.legacyTextKey || "text";
    if (!nextColors.text_light && typeof colors[legacyTextKey] === "string") {
      nextColors.text_light = colors[legacyTextKey];
      changed = true;
    }
    if (!nextColors.text_dark && typeof colors[legacyTextKey] === "string") {
      nextColors.text_dark = colors[legacyTextKey];
      changed = true;
    }
  }

  const keysToRemove = new Set();
  for (const legacyKeys of Object.values(colorAliases || {})) {
    const keys = Array.isArray(legacyKeys) ? legacyKeys : [legacyKeys];
    for (const key of keys) {
      if (typeof key === "string" && key.length > 0) {
        keysToRemove.add(key);
      }
    }
  }
  if (options.migrateTextPair !== false) {
    keysToRemove.add(options.legacyTextKey || "text");
  }

  for (const key of keysToRemove) {
    if (key in nextColors) {
      delete nextColors[key];
      changed = true;
    }
  }

  if (!changed) {
    return config;
  }

  return {
    ...config,
    colors: nextColors,
  };
}

export function migrateObjectKey(config, legacyKey, nextKey) {
  if (!config || typeof config !== "object" || !(legacyKey in config) || nextKey in config) {
    return config;
  }

  const next = {
    ...config,
    [nextKey]: isPlainObjectLegacyValue(config[legacyKey]) ? { ...config[legacyKey] } : config[legacyKey],
  };
  delete next[legacyKey];
  return next;
}

export function moveLegacyColor(colors, legacyKeys, nextKey) {
  if (!colors || typeof colors !== "object") {
    return false;
  }

  const keys = Array.isArray(legacyKeys) ? legacyKeys : [legacyKeys];
  for (const legacyKey of keys) {
    if (!colors[nextKey] && typeof colors[legacyKey] === "string") {
      colors[nextKey] = colors[legacyKey];
      return true;
    }
  }

  return false;
}

function isPlainObjectLegacyValue(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
