export function createRemovePathsCleanup(paths) {
  const normalizedPaths = Array.isArray(paths) ? paths : [];
  return (config) => removeConfigPaths(config, normalizedPaths);
}

export function runConfigCleanup(config, steps) {
  const source = isObject(config) ? cloneConfig(config) : {};
  let next = source;

  for (const step of Array.isArray(steps) ? steps : []) {
    if (typeof step !== "function") {
      continue;
    }
    const candidate = step(next);
    if (isObject(candidate)) {
      next = candidate;
    }
  }

  return {
    config: next,
    changed: computeConfigCleanupKey(source) !== computeConfigCleanupKey(next),
  };
}

export function queueConfigCleanup(host, config, state) {
  if (!host || !isObject(config) || !isObject(state)) {
    return;
  }

  const cleanupKey = computeConfigCleanupKey(config);
  if (!cleanupKey || state.pendingKey === cleanupKey || state.lastAppliedKey === cleanupKey) {
    return;
  }

  state.pendingKey = cleanupKey;
  state.pendingConfig = config;
  flushConfigCleanup(host, state);
}

export function emitConfigChanged(host, config) {
  if (!host || !isObject(config)) {
    return;
  }

  host.dispatchEvent(new CustomEvent("config-changed", {
    detail: { config },
    bubbles: true,
    composed: true,
  }));
}

export function computeConfigCleanupKey(config) {
  if (!isObject(config)) {
    return "";
  }
  return JSON.stringify(config);
}

export function flushConfigCleanup(host, state) {
  if (!host || !isObject(state) || !state.pendingKey || !isObject(state.pendingConfig) || !host.isConnected) {
    return;
  }

  const cleanupKey = state.pendingKey;
  queueMicrotask(() => {
    if (!host.isConnected || state.pendingKey !== cleanupKey || !isObject(state.pendingConfig)) {
      return;
    }

    const config = state.pendingConfig;
    state.pendingKey = "";
    state.pendingConfig = null;
    state.lastAppliedKey = cleanupKey;
    emitConfigChanged(host, config);
  });
}

function removeConfigPaths(config, paths) {
  let next = config;

  for (const path of paths) {
    const segments = normalizePath(path);
    if (segments.length === 0) {
      continue;
    }
    next = removeConfigPath(next, segments);
  }

  return next;
}

function removeConfigPath(config, segments) {
  if (!isObject(config) || segments.length === 0) {
    return config;
  }

  const [segment, ...rest] = segments;
  if (!(segment in config)) {
    return config;
  }

  if (rest.length === 0) {
    const next = { ...config };
    delete next[segment];
    return next;
  }

  const child = config[segment];
  if (!isObject(child)) {
    return config;
  }

  const nextChild = removeConfigPath(child, rest);
  if (nextChild === child) {
    return config;
  }

  return {
    ...config,
    [segment]: nextChild,
  };
}

function normalizePath(path) {
  if (Array.isArray(path)) {
    return path.filter((segment) => typeof segment === "string" && segment.length > 0);
  }
  if (typeof path !== "string" || path.trim().length === 0) {
    return [];
  }
  return path.split(".").map((segment) => segment.trim()).filter(Boolean);
}

function cloneConfig(config) {
  if (typeof structuredClone === "function") {
    return structuredClone(config);
  }
  return JSON.parse(JSON.stringify(config));
}

function isObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
