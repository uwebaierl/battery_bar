import { clamp } from "./math.js";

export function buildSmoothSegmentGradient(centerColor, prevColor, nextColor) {
  const leftBoundary = prevColor ? mixHex(prevColor, centerColor, 0.5) : centerColor;
  const rightBoundary = nextColor ? mixHex(centerColor, nextColor, 0.5) : centerColor;
  return `linear-gradient(90deg, ${leftBoundary} 0%, ${centerColor} 30%, ${centerColor} 70%, ${rightBoundary} 100%)`;
}

export function buildSegmentBackground(centerColor, prevColor, nextColor, fadeBetweenSegments = true) {
  if (fadeBetweenSegments === false) {
    return centerColor;
  }
  return buildSmoothSegmentGradient(centerColor, prevColor, nextColor);
}

export function blendHex(baseHex, accentHex, blendAmount) {
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

export function mixHex(aHex, bHex, ratio) {
  const a = parseHex(aHex);
  const b = parseHex(bHex);
  const t = clamp(0, Number(ratio) || 0, 1);
  return toHex({
    r: (a.r * (1 - t)) + (b.r * t),
    g: (a.g * (1 - t)) + (b.g * t),
    b: (a.b * (1 - t)) + (b.b * t),
  });
}

export function normalizeHexColor(value, fallback) {
  const raw = String(value ?? "").trim();
  if (/^#[0-9A-Fa-f]{6}$/.test(raw)) {
    return raw.toUpperCase();
  }
  return String(fallback || "#000000").toUpperCase();
}

export function pickBestTextColor(backgroundHex, lightTextHex, darkTextHex) {
  const background = normalizeHexColor(backgroundHex, "#000000");
  const light = normalizeHexColor(lightTextHex, "#FFFFFF");
  const dark = normalizeHexColor(darkTextHex, "#000000");

  return contrastRatio(background, light) >= contrastRatio(background, dark) ? light : dark;
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

function contrastRatio(aHex, bHex) {
  const a = relativeLuminance(aHex);
  const b = relativeLuminance(bHex);
  const lighter = Math.max(a, b);
  const darker = Math.min(a, b);
  return (lighter + 0.05) / (darker + 0.05);
}

function relativeLuminance(hex) {
  const rgb = parseHex(hex);
  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map((channel) => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return (0.2126 * r) + (0.7152 * g) + (0.0722 * b);
}
