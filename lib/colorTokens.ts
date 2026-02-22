/**
 * Color token system for dynamic theme-aware HTML content.
 *
 * AI-generated HTML uses {{ACCENT}}, {{ACCENT2}}, {{MUTED}}, {{TEXT}},
 * {{ACCENT_BG}}, {{ACCENT_BORDER}} tokens. These are replaced at generation
 * time and can be re-mapped when the user switches templates.
 */

const DEFAULT_ACCENT  = '#00D4FF';
const DEFAULT_ACCENT2 = '#E8FF47';
const DEFAULT_MUTED   = '#9BA8C0';
const DEFAULT_TEXT    = '#EEF2FF';

export interface ThemeColors {
  accent: string;
  accent2: string;
  muted: string;
  text: string;
}

export const DEFAULT_THEME_COLORS: ThemeColors = {
  accent: DEFAULT_ACCENT,
  accent2: DEFAULT_ACCENT2,
  muted: DEFAULT_MUTED,
  text: DEFAULT_TEXT,
};

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function escHex(hex: string) {
  return hex.replace('#', '\\#?');
}

/**
 * Build a regex that matches a specific hex color (with or without #) or
 * its rgba() equivalents at common opacities used in the templates.
 */
function buildColorRegex(hex: string): RegExp {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  const hexPat = escHex(hex);
  const rgbaPat = `rgba\\(${r}\\s*,\\s*${g}\\s*,\\s*${b}\\s*,\\s*[\\d.]+\\)`;
  return new RegExp(`(${hexPat}|${rgbaPat})`, 'gi');
}

/**
 * Replace color tokens ({{ACCENT}} etc.) in HTML with concrete color values.
 */
export function replaceTokens(html: string, colors: ThemeColors): string {
  if (!html) return html;
  return html
    .replace(/\{\{ACCENT_BG\}\}/g, hexToRgba(colors.accent, 0.06))
    .replace(/\{\{ACCENT_BORDER\}\}/g, hexToRgba(colors.accent, 0.15))
    .replace(/\{\{ACCENT2\}\}/g, colors.accent2)
    .replace(/\{\{ACCENT\}\}/g, colors.accent)
    .replace(/\{\{MUTED\}\}/g, colors.muted)
    .replace(/\{\{TEXT\}\}/g, colors.text);
}

// Known accent palette used by the AI generation and Dev Carousel template.
// When remapping we always try to replace all of these.
const KNOWN_ACCENTS = ['#00D4FF', '#E8FF47', '#FF4D6D', '#FF9500'];

/**
 * Given HTML that was already resolved with one set of theme colors,
 * swap those old colors for new ones. Handles hex values and their
 * rgba() variants.
 *
 * Also replaces any of the known AI accent palette colors with the
 * new theme's accent / accent2.
 */
export function remapColors(html: string, oldColors: ThemeColors, newColors: ThemeColors): string {
  if (!html) return html;

  // Build a comprehensive replacement map: old → new
  const replacements = new Map<string, string>();

  // Primary mappings
  replacements.set(oldColors.accent.toLowerCase(), newColors.accent);
  replacements.set(oldColors.accent2.toLowerCase(), newColors.accent2);
  replacements.set(oldColors.muted.toLowerCase(), newColors.muted);
  replacements.set(oldColors.text.toLowerCase(), newColors.text);

  // Also map all known AI palette accents → new theme
  KNOWN_ACCENTS.forEach((knownHex, i) => {
    const key = knownHex.toLowerCase();
    if (!replacements.has(key)) {
      // Alternate between accent and accent2
      replacements.set(key, i % 2 === 0 ? newColors.accent : newColors.accent2);
    }
  });

  let result = html;
  for (const [oldHex, newHex] of replacements) {
    if (oldHex === newHex.toLowerCase()) continue;
    const regex = buildColorRegex(oldHex);
    result = result.replace(regex, (match) => {
      if (match.startsWith('rgba')) {
        const alphaMatch = match.match(/,\s*([\d.]+)\s*\)/);
        const alpha = alphaMatch ? parseFloat(alphaMatch[1]) : 1;
        return hexToRgba(newHex, alpha);
      }
      return newHex;
    });
  }

  return result;
}

/**
 * Derive a complementary accent2 from accent. Shifts hue by ~150°.
 */
export function deriveAccent2(accent: string): string {
  const h = accent.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16) / 255;
  const g = parseInt(h.substring(2, 4), 16) / 255;
  const b = parseInt(h.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let hue = 0;
  const sat = max === 0 ? 0 : (max - min) / max;
  const val = max;

  if (max !== min) {
    const d = max - min;
    if (max === r) hue = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) hue = ((b - r) / d + 2) / 6;
    else hue = ((r - g) / d + 4) / 6;
  }

  const newHue = (hue + 0.42) % 1; // ~150° shift
  const newSat = Math.min(sat * 1.1, 1);
  const newVal = Math.min(val * 1.05, 1);

  const hi = Math.floor(newHue * 6);
  const f = newHue * 6 - hi;
  const p = newVal * (1 - newSat);
  const q = newVal * (1 - f * newSat);
  const t = newVal * (1 - (1 - f) * newSat);

  let rr: number, gg: number, bb: number;
  switch (hi % 6) {
    case 0: rr = newVal; gg = t; bb = p; break;
    case 1: rr = q; gg = newVal; bb = p; break;
    case 2: rr = p; gg = newVal; bb = t; break;
    case 3: rr = p; gg = q; bb = newVal; break;
    case 4: rr = t; gg = p; bb = newVal; break;
    default: rr = newVal; gg = p; bb = q; break;
  }

  const toHex = (n: number) => Math.round(n * 255).toString(16).padStart(2, '0');
  return `#${toHex(rr)}${toHex(gg)}${toHex(bb)}`;
}
