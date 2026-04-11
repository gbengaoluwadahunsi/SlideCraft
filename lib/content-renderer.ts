/**
 * content-renderer.ts
 * 
 * Converts structured AI output into HTML using deterministic templates.
 * Each content block kind has multiple visual VARIANTS so different users
 * see different designs even with the same content type.
 * 
 * The AI no longer writes HTML — this module owns all visual output.
 */

import type { ContentBlock } from './ai-schema';

// ── Color Token Types ────────────────────────────────────────────────────────

export interface ThemeTokens {
  accent: string;       // Primary accent color (hex)
  accent2: string;      // Secondary accent (computed, rotated hue)
  muted: string;        // Muted/body text color
  text: string;         // Primary text color (headings)
  accentBg: string;     // Accent at 6% opacity
  accentBorder: string; // Accent at 15% opacity
}

// ── Variant Types ────────────────────────────────────────────────────────────

type VariantIndex = 0 | 1 | 2;

// ── Helper ───────────────────────────────────────────────────────────────────

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeCodeBlock(code: string): string {
  return escapeHtml(code)
    .replace(/\n/g, '<br/>')
    .replace(/  /g, '&nbsp;&nbsp;');
}

// ── Pattern Renderers ────────────────────────────────────────────────────────
// Each renderer has 2-3 visual variants for design variety.

const renderers: Record<ContentBlock['kind'], (block: ContentBlock, tokens: ThemeTokens, variant: VariantIndex) => string> = {

  // ── Pattern A: Quote + Tip ──────────────────────────────────────────────
  'quote-tip': (block, t, variant) => {
    const b = block as Extract<ContentBlock, { kind: 'quote-tip' }>;
    const variants = [
      // Variant 0: Classic left-border quote + box tip
      `<p style="border-left:3px solid ${t.accent};padding-left:16px;color:${t.muted};font-size:0.92em;line-height:1.75;">${b.quote}</p><div style="background:${t.accentBg};border:1px solid ${t.accentBorder};border-radius:10px;padding:14px 18px;margin-top:16px;color:${t.accent};font-size:0.85em;line-height:1.6;">💡 ${b.tip}</div>`,
      // Variant 1: Full-width quote with bottom accent bar
      `<div style="padding:16px 0;color:${t.muted};font-size:0.92em;line-height:1.75;border-bottom:2px solid ${t.accent};">${b.quote}</div><div style="margin-top:14px;padding:12px 16px;border-radius:8px;background:rgba(0,0,0,0.2);border-left:3px solid ${t.accent};color:${t.accent};font-size:0.85em;line-height:1.6;">⚡ ${b.tip}</div>`,
      // Variant 2: Card-style with accent top border
      `<div style="background:rgba(0,0,0,0.15);border-radius:12px;border-top:3px solid ${t.accent};padding:18px 20px;"><p style="color:${t.muted};font-size:0.92em;line-height:1.75;margin:0;">${b.quote}</p><div style="margin-top:14px;padding-top:12px;border-top:1px solid rgba(255,255,255,0.06);color:${t.accent};font-size:0.85em;line-height:1.6;">💡 ${b.tip}</div></div>`,
    ];
    return variants[variant] || variants[0];
  },

  // ── Pattern B: Icon Cards ───────────────────────────────────────────────
  'icon-cards': (block, t, variant) => {
    const b = block as Extract<ContentBlock, { kind: 'icon-cards' }>;
    const cardRenderers = [
      // Variant 0: Vertical stack with dark cards
      (cards: typeof b.cards) => `<div style="display:flex;flex-direction:column;gap:8px;">${cards.map(c =>
        `<div style="background:rgba(0,0,0,0.25);border:1px solid rgba(255,255,255,0.05);border-radius:10px;padding:12px 16px;display:flex;align-items:flex-start;gap:12px;"><span style="font-size:1.3em;flex-shrink:0;">${c.emoji}</span><div><div style="font-weight:700;color:${t.text};font-size:0.92em;margin-bottom:2px;">${escapeHtml(c.title)}</div><div style="font-family:monospace;font-size:0.72em;color:${t.muted};line-height:1.65;">${escapeHtml(c.description)}</div></div></div>`
      ).join('')}</div>`,
      // Variant 1: Cards with accent left border
      (cards: typeof b.cards) => `<div style="display:flex;flex-direction:column;gap:8px;">${cards.map((c, i) =>
        `<div style="background:rgba(0,0,0,0.18);border-left:3px solid ${i % 2 === 0 ? t.accent : t.accent2};border-radius:0 10px 10px 0;padding:12px 16px;display:flex;align-items:flex-start;gap:12px;"><span style="font-size:1.3em;flex-shrink:0;">${c.emoji}</span><div><div style="font-weight:700;color:${t.text};font-size:0.92em;margin-bottom:2px;">${escapeHtml(c.title)}</div><div style="font-family:monospace;font-size:0.72em;color:${t.muted};line-height:1.65;">${escapeHtml(c.description)}</div></div></div>`
      ).join('')}</div>`,
      // Variant 2: Grid layout (2 columns)
      (cards: typeof b.cards) => `<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">${cards.map(c =>
        `<div style="background:rgba(0,0,0,0.2);border:1px solid rgba(255,255,255,0.05);border-radius:10px;padding:14px;"><div style="font-size:1.5em;margin-bottom:6px;">${c.emoji}</div><div style="font-weight:700;color:${t.text};font-size:0.88em;margin-bottom:4px;">${escapeHtml(c.title)}</div><div style="font-family:monospace;font-size:0.7em;color:${t.muted};line-height:1.6;">${escapeHtml(c.description)}</div></div>`
      ).join('')}</div>`,
    ];
    return cardRenderers[variant]?.(b.cards) || cardRenderers[0](b.cards);
  },

  // ── Pattern C: Numbered List ────────────────────────────────────────────
  'numbered-list': (block, t, variant) => {
    const b = block as Extract<ContentBlock, { kind: 'numbered-list' }>;
    const listRenderers = [
      // Variant 0: Large numbers with accent color
      (items: typeof b.items) => `<div style="display:flex;flex-direction:column;gap:6px;">${items.map((item, i) =>
        `<div style="display:flex;gap:14px;align-items:flex-start;padding:4px 0;"><span style="font-family:var(--font-bebas-neue);font-size:1.6em;line-height:1;color:${t.accent};flex-shrink:0;min-width:28px;">${String(i + 1).padStart(2, '0')}</span><div><div style="font-weight:700;color:${t.text};font-size:0.92em;">${escapeHtml(item.title)}</div><div style="font-family:monospace;font-size:0.7em;color:${t.muted};line-height:1.65;margin-top:1px;">${escapeHtml(item.description)}</div></div></div>`
      ).join('')}</div>`,
      // Variant 1: Circle numbers with card backgrounds
      (items: typeof b.items) => `<div style="display:flex;flex-direction:column;gap:8px;">${items.map((item, i) =>
        `<div style="background:rgba(0,0,0,0.15);border-radius:10px;padding:12px 16px;display:flex;gap:14px;align-items:flex-start;"><div style="width:28px;height:28px;border-radius:50%;background:${t.accent};color:#000;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:0.8em;flex-shrink:0;">${i + 1}</div><div><div style="font-weight:700;color:${t.text};font-size:0.92em;">${escapeHtml(item.title)}</div><div style="font-family:monospace;font-size:0.7em;color:${t.muted};line-height:1.65;margin-top:2px;">${escapeHtml(item.description)}</div></div></div>`
      ).join('')}</div>`,
      // Variant 2: Alternating accent colors
      (items: typeof b.items) => `<div style="display:flex;flex-direction:column;gap:6px;">${items.map((item, i) =>
        `<div style="display:flex;gap:14px;align-items:flex-start;padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.04);"><span style="font-family:var(--font-bebas-neue);font-size:1.6em;line-height:1;color:${i % 2 === 0 ? t.accent : t.accent2};flex-shrink:0;min-width:28px;">${String(i + 1).padStart(2, '0')}</span><div><div style="font-weight:700;color:${t.text};font-size:0.92em;">${escapeHtml(item.title)}</div><div style="font-family:monospace;font-size:0.7em;color:${t.muted};line-height:1.65;margin-top:1px;">${escapeHtml(item.description)}</div></div></div>`
      ).join('')}</div>`,
    ];
    return listRenderers[variant]?.(b.items) || listRenderers[0](b.items);
  },

  // ── Pattern D: Code Block ───────────────────────────────────────────────
  'code-block': (block, t, variant) => {
    const b = block as Extract<ContentBlock, { kind: 'code-block' }>;
    const codeHtml = escapeCodeBlock(b.code);
    const variants = [
      // Variant 0: Classic dark code block
      `<p style="color:${t.muted};font-size:0.9em;line-height:1.75;">${escapeHtml(b.explanation)}</p><div style="background:rgba(0,0,0,0.35);border:1px solid rgba(255,255,255,0.06);border-radius:8px;padding:14px 16px;margin-top:14px;font-family:monospace;font-size:0.72em;line-height:1.7;color:${t.muted};">${codeHtml}</div>`,
      // Variant 1: Code with language badge
      `<p style="color:${t.muted};font-size:0.9em;line-height:1.75;">${escapeHtml(b.explanation)}</p><div style="background:rgba(0,0,0,0.35);border:1px solid rgba(255,255,255,0.06);border-radius:8px;margin-top:14px;overflow:hidden;"><div style="background:${t.accentBg};padding:6px 14px;font-family:monospace;font-size:0.65em;color:${t.accent};border-bottom:1px solid rgba(255,255,255,0.06);">${escapeHtml(b.language)}</div><div style="padding:14px 16px;font-family:monospace;font-size:0.72em;line-height:1.7;color:${t.muted};">${codeHtml}</div></div>`,
      // Variant 2: Bordered with accent top
      `<p style="color:${t.muted};font-size:0.9em;line-height:1.75;">${escapeHtml(b.explanation)}</p><div style="border-top:3px solid ${t.accent};background:rgba(0,0,0,0.3);border-radius:0 0 8px 8px;padding:14px 16px;margin-top:14px;font-family:monospace;font-size:0.72em;line-height:1.7;color:${t.muted};">${codeHtml}</div>`,
    ];
    return variants[variant] || variants[0];
  },

  // ── Pattern E: Pill Tags ────────────────────────────────────────────────
  'pill-tags': (block, t, variant) => {
    const b = block as Extract<ContentBlock, { kind: 'pill-tags' }>;
    const tagStyles = [
      // Variant 0: Ghost pills
      (tag: string) => `<span style="font-family:monospace;font-size:0.7em;padding:5px 12px;border-radius:100px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);color:${t.muted};">${escapeHtml(tag)}</span>`,
      // Variant 1: Accent-tinted pills
      (tag: string) => `<span style="font-family:monospace;font-size:0.7em;padding:5px 12px;border-radius:100px;background:${t.accentBg};border:1px solid ${t.accentBorder};color:${t.accent};">${escapeHtml(tag)}</span>`,
      // Variant 2: Solid accent pills
      (tag: string) => `<span style="font-family:monospace;font-size:0.7em;padding:5px 14px;border-radius:6px;background:rgba(0,0,0,0.25);border:1px solid rgba(255,255,255,0.06);color:${t.text};">${escapeHtml(tag)}</span>`,
    ];
    const renderTag = tagStyles[variant] || tagStyles[0];
    return `<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:14px;">${b.tags.map(renderTag).join('')}</div><p style="color:${t.muted};font-size:0.88em;line-height:1.75;">${escapeHtml(b.summary)}</p>`;
  },

  // ── Pattern F: Stats Grid ──────────────────────────────────────────────
  'stats-grid': (block, t, variant) => {
    const b = block as Extract<ContentBlock, { kind: 'stats-grid' }>;
    const gridRenderers = [
      // Variant 0: 2x2 grid
      (stats: typeof b.stats) => `<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">${stats.map((s, i) =>
        `<div style="background:rgba(0,0,0,0.25);border:1px solid rgba(255,255,255,0.05);border-radius:8px;padding:14px;"><div style="font-family:var(--font-bebas-neue);font-size:2em;line-height:1;color:${i % 2 === 0 ? t.accent : t.accent2};">${escapeHtml(s.value)}</div><div style="font-family:monospace;font-size:0.65em;color:${t.muted};margin-top:4px;line-height:1.5;">${escapeHtml(s.description)}</div></div>`
      ).join('')}</div>`,
      // Variant 1: Horizontal cards with accent border top
      (stats: typeof b.stats) => `<div style="display:flex;flex-direction:column;gap:8px;">${stats.map((s, i) =>
        `<div style="background:rgba(0,0,0,0.2);border-top:2px solid ${i % 2 === 0 ? t.accent : t.accent2};border-radius:0 0 8px 8px;padding:12px 16px;display:flex;align-items:center;gap:16px;"><div style="font-family:var(--font-bebas-neue);font-size:1.8em;line-height:1;color:${i % 2 === 0 ? t.accent : t.accent2};flex-shrink:0;min-width:60px;">${escapeHtml(s.value)}</div><div style="font-family:monospace;font-size:0.68em;color:${t.muted};line-height:1.5;">${escapeHtml(s.description)}</div></div>`
      ).join('')}</div>`,
      // Variant 2: Centered stats in a row
      (stats: typeof b.stats) => `<div style="display:grid;grid-template-columns:repeat(${Math.min(stats.length, 4)}, 1fr);gap:8px;text-align:center;">${stats.map((s, i) =>
        `<div style="padding:12px 8px;"><div style="font-family:var(--font-bebas-neue);font-size:2em;line-height:1;color:${i % 2 === 0 ? t.accent : t.accent2};">${escapeHtml(s.value)}</div><div style="font-family:monospace;font-size:0.62em;color:${t.muted};margin-top:6px;line-height:1.5;">${escapeHtml(s.description)}</div></div>`
      ).join('')}</div>`,
    ];
    return gridRenderers[variant]?.(b.stats) || gridRenderers[0](b.stats);
  },

  // ── Pattern G: Before/After ─────────────────────────────────────────────
  'before-after': (block, t, variant) => {
    const b = block as Extract<ContentBlock, { kind: 'before-after' }>;
    const variants = [
      // Variant 0: Side-by-side columns
      `<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;"><div style="background:rgba(0,0,0,0.2);border-radius:8px;padding:14px;border:1px solid rgba(255,255,255,0.04);"><div style="font-family:monospace;font-size:0.65em;letter-spacing:0.15em;text-transform:uppercase;color:${t.accent2};font-weight:600;margin-bottom:8px;">Before</div><div style="font-family:monospace;font-size:0.7em;color:${t.muted};line-height:1.8;">${b.before.map(item => `❌ ${escapeHtml(item.text)}`).join('<br/>')}</div></div><div style="background:rgba(0,0,0,0.2);border-radius:8px;padding:14px;border:1px solid rgba(255,255,255,0.04);"><div style="font-family:monospace;font-size:0.65em;letter-spacing:0.15em;text-transform:uppercase;color:${t.accent};font-weight:600;margin-bottom:8px;">After</div><div style="font-family:monospace;font-size:0.7em;color:${t.muted};line-height:1.8;">${b.after.map(item => `✅ ${escapeHtml(item.text)}`).join('<br/>')}</div></div></div>`,
      // Variant 1: Stacked with divider
      `<div style="background:rgba(0,0,0,0.15);border-radius:10px;padding:16px;"><div style="margin-bottom:12px;"><div style="font-family:monospace;font-size:0.65em;letter-spacing:0.15em;text-transform:uppercase;color:${t.accent2};font-weight:600;margin-bottom:6px;">❌ Before</div><div style="font-family:monospace;font-size:0.72em;color:${t.muted};line-height:1.8;">${b.before.map(item => escapeHtml(item.text)).join('<br/>')}</div></div><div style="height:1px;background:rgba(255,255,255,0.08);margin:8px 0;"></div><div><div style="font-family:monospace;font-size:0.65em;letter-spacing:0.15em;text-transform:uppercase;color:${t.accent};font-weight:600;margin-bottom:6px;">✅ After</div><div style="font-family:monospace;font-size:0.72em;color:${t.muted};line-height:1.8;">${b.after.map(item => escapeHtml(item.text)).join('<br/>')}</div></div></div>`,
      // Variant 2: Arrow transition style
      `<div style="display:flex;flex-direction:column;gap:6px;">${b.before.map((item, i) =>
        `<div style="display:flex;align-items:center;gap:8px;"><div style="flex:1;background:rgba(0,0,0,0.2);border-radius:6px;padding:8px 12px;font-family:monospace;font-size:0.7em;color:${t.muted};border-left:2px solid ${t.accent2};">${escapeHtml(item.text)}</div><span style="color:${t.accent};font-size:1.2em;">→</span><div style="flex:1;background:rgba(0,0,0,0.2);border-radius:6px;padding:8px 12px;font-family:monospace;font-size:0.7em;color:${t.muted};border-left:2px solid ${t.accent};">${b.after[i] ? escapeHtml(b.after[i].text) : ''}</div></div>`
      ).join('')}</div>`,
    ];
    return variants[variant] || variants[0];
  },

  // ── Pattern H: Arrow List ───────────────────────────────────────────────
  'arrow-list': (block, t, variant) => {
    const b = block as Extract<ContentBlock, { kind: 'arrow-list' }>;
    const listRenderers = [
      // Variant 0: Arrow prefix
      (items: typeof b.items) => `<div style="display:flex;flex-direction:column;gap:6px;">${items.map(item =>
        `<div style="font-family:monospace;font-size:0.75em;color:${t.muted};padding-left:18px;position:relative;line-height:1.75;"><span style="position:absolute;left:0;opacity:0.5;">→</span><strong style="color:${t.text};">${escapeHtml(item.title)}</strong> — ${escapeHtml(item.description)}</div>`
      ).join('')}</div>`,
      // Variant 1: Checkmark with card background
      (items: typeof b.items) => `<div style="display:flex;flex-direction:column;gap:6px;">${items.map(item =>
        `<div style="background:rgba(0,0,0,0.12);border-radius:8px;padding:10px 14px;font-family:monospace;font-size:0.75em;color:${t.muted};line-height:1.75;"><span style="color:${t.accent};margin-right:8px;">✓</span><strong style="color:${t.text};">${escapeHtml(item.title)}</strong> — ${escapeHtml(item.description)}</div>`
      ).join('')}</div>`,
      // Variant 2: Dot indicator with accent line
      (items: typeof b.items) => `<div style="display:flex;flex-direction:column;gap:4px;border-left:2px solid rgba(255,255,255,0.06);padding-left:16px;">${items.map(item =>
        `<div style="font-family:monospace;font-size:0.75em;color:${t.muted};line-height:1.75;position:relative;"><div style="position:absolute;left:-21px;top:8px;width:8px;height:8px;border-radius:50%;background:${t.accent};"></div><strong style="color:${t.text};">${escapeHtml(item.title)}</strong> — ${escapeHtml(item.description)}</div>`
      ).join('')}</div>`,
    ];
    return listRenderers[variant]?.(b.items) || listRenderers[0](b.items);
  },

  // ── Pattern I: Timeline ─────────────────────────────────────────────────
  'timeline': (block, t, variant) => {
    const b = block as Extract<ContentBlock, { kind: 'timeline' }>;
    const timelineRenderers = [
      // Variant 0: Dot + line connector
      (phases: typeof b.phases) => `<div style="display:flex;flex-direction:column;gap:10px;">${phases.map((p, i) =>
        `<div style="display:flex;gap:12px;align-items:flex-start;"><div style="display:flex;flex-direction:column;align-items:center;flex-shrink:0;"><div style="width:10px;height:10px;border-radius:50%;background:${i % 2 === 0 ? t.accent : t.accent2};"></div>${i < phases.length - 1 ? `<div style="width:2px;height:32px;background:rgba(255,255,255,0.08);"></div>` : ''}</div><div><div style="font-weight:700;color:${t.text};font-size:0.88em;">${escapeHtml(p.title)}</div><div style="font-family:monospace;font-size:0.7em;color:${t.muted};line-height:1.65;margin-top:2px;">${escapeHtml(p.description)}</div></div></div>`
      ).join('')}</div>`,
      // Variant 1: Numbered phases with cards
      (phases: typeof b.phases) => `<div style="display:flex;flex-direction:column;gap:8px;">${phases.map((p, i) =>
        `<div style="background:rgba(0,0,0,0.18);border-radius:10px;padding:12px 16px;display:flex;gap:14px;align-items:flex-start;border-left:3px solid ${i % 2 === 0 ? t.accent : t.accent2};"><div style="font-family:var(--font-bebas-neue);font-size:1.4em;color:${i % 2 === 0 ? t.accent : t.accent2};flex-shrink:0;line-height:1;">P${i + 1}</div><div><div style="font-weight:700;color:${t.text};font-size:0.88em;">${escapeHtml(p.title)}</div><div style="font-family:monospace;font-size:0.7em;color:${t.muted};line-height:1.65;margin-top:2px;">${escapeHtml(p.description)}</div></div></div>`
      ).join('')}</div>`,
      // Variant 2: Horizontal progress bar style
      (phases: typeof b.phases) => `<div style="display:flex;flex-direction:column;gap:10px;">${phases.map((p, i) =>
        `<div style="display:flex;gap:12px;align-items:flex-start;"><div style="flex-shrink:0;width:32px;text-align:center;"><div style="width:24px;height:24px;border-radius:6px;background:${t.accentBg};border:1px solid ${t.accentBorder};display:flex;align-items:center;justify-content:center;font-size:0.7em;font-weight:700;color:${t.accent};">${i + 1}</div>${i < phases.length - 1 ? `<div style="width:2px;height:24px;background:${t.accentBorder};margin:4px auto;"></div>` : ''}</div><div><div style="font-weight:700;color:${t.text};font-size:0.88em;">${escapeHtml(p.title)}</div><div style="font-family:monospace;font-size:0.7em;color:${t.muted};line-height:1.65;margin-top:2px;">${escapeHtml(p.description)}</div></div></div>`
      ).join('')}</div>`,
    ];
    return timelineRenderers[variant]?.(b.phases) || timelineRenderers[0](b.phases);
  },

  // ── Pattern J: Highlight Box ────────────────────────────────────────────
  'highlight-box': (block, t, variant) => {
    const b = block as Extract<ContentBlock, { kind: 'highlight-box' }>;
    const variants = [
      // Variant 0: Accent-bordered card
      `<div style="background:${t.accentBg};border:1px solid ${t.accentBorder};border-radius:12px;padding:18px 20px;"><div style="font-family:monospace;font-size:0.65em;letter-spacing:0.15em;text-transform:uppercase;color:${t.accent};font-weight:600;margin-bottom:10px;">⚡ ${escapeHtml(b.label)}</div><div style="color:${t.text};font-size:0.95em;font-weight:700;line-height:1.6;margin-bottom:8px;">${escapeHtml(b.headline)}</div><div style="font-family:monospace;font-size:0.72em;color:${t.muted};line-height:1.7;">${escapeHtml(b.detail)}</div></div>`,
      // Variant 1: Left accent bar with clean layout
      `<div style="border-left:4px solid ${t.accent};padding:16px 20px;background:rgba(0,0,0,0.15);border-radius:0 10px 10px 0;"><div style="font-family:monospace;font-size:0.65em;letter-spacing:0.1em;text-transform:uppercase;color:${t.accent};font-weight:600;margin-bottom:8px;">${escapeHtml(b.label)}</div><div style="color:${t.text};font-size:0.95em;font-weight:700;line-height:1.6;margin-bottom:8px;">${escapeHtml(b.headline)}</div><div style="font-family:monospace;font-size:0.72em;color:${t.muted};line-height:1.7;">${escapeHtml(b.detail)}</div></div>`,
      // Variant 2: Centered with decorative line
      `<div style="text-align:center;padding:16px 20px;"><div style="font-family:monospace;font-size:0.65em;letter-spacing:0.15em;text-transform:uppercase;color:${t.accent};font-weight:600;">⚡ ${escapeHtml(b.label)}</div><div style="width:40px;height:2px;background:${t.accent};margin:10px auto;border-radius:2px;"></div><div style="color:${t.text};font-size:0.95em;font-weight:700;line-height:1.6;margin-bottom:8px;">${escapeHtml(b.headline)}</div><div style="font-family:monospace;font-size:0.72em;color:${t.muted};line-height:1.7;">${escapeHtml(b.detail)}</div></div>`,
    ];
    return variants[variant] || variants[0];
  },

  // ── Pattern K: Metric Callout ───────────────────────────────────────────
  'metric-callout': (block, t, variant) => {
    const b = block as Extract<ContentBlock, { kind: 'metric-callout' }>;
    const variants = [
      // Variant 0: Centered large number
      `<div style="text-align:center;padding:8px 0;"><div style="font-family:var(--font-bebas-neue);font-size:3.5em;line-height:1;color:${t.accent};letter-spacing:-0.02em;">${escapeHtml(b.value)}</div><div style="font-family:monospace;font-size:0.72em;color:${t.muted};margin-top:8px;line-height:1.6;">${escapeHtml(b.description)}</div><div style="width:40px;height:2px;background:${t.accent};margin:12px auto 0;border-radius:2px;opacity:0.5;"></div>${b.source ? `<div style="font-family:monospace;font-size:0.65em;color:${t.muted};margin-top:10px;opacity:0.7;">${escapeHtml(b.source)}</div>` : ''}</div>`,
      // Variant 1: Left-aligned with accent background
      `<div style="display:flex;align-items:center;gap:20px;padding:16px;background:${t.accentBg};border-radius:12px;border:1px solid ${t.accentBorder};"><div style="font-family:var(--font-bebas-neue);font-size:3em;line-height:1;color:${t.accent};flex-shrink:0;">${escapeHtml(b.value)}</div><div><div style="font-family:monospace;font-size:0.72em;color:${t.muted};line-height:1.6;">${escapeHtml(b.description)}</div>${b.source ? `<div style="font-family:monospace;font-size:0.62em;color:${t.muted};margin-top:6px;opacity:0.6;">${escapeHtml(b.source)}</div>` : ''}</div></div>`,
      // Variant 2: Badge-style number
      `<div style="text-align:center;padding:12px 0;"><div style="display:inline-block;background:${t.accentBg};border:2px solid ${t.accent};border-radius:16px;padding:12px 28px;"><div style="font-family:var(--font-bebas-neue);font-size:3em;line-height:1;color:${t.accent};">${escapeHtml(b.value)}</div></div><div style="font-family:monospace;font-size:0.72em;color:${t.muted};margin-top:12px;line-height:1.6;">${escapeHtml(b.description)}</div>${b.source ? `<div style="font-family:monospace;font-size:0.62em;color:${t.muted};margin-top:8px;opacity:0.6;">${escapeHtml(b.source)}</div>` : ''}</div>`,
    ];
    return variants[variant] || variants[0];
  },

  // ── Pattern L: Quote Card ──────────────────────────────────────────────
  'quote-card': (block, t, variant) => {
    const b = block as Extract<ContentBlock, { kind: 'quote-card' }>;
    const variants = [
      // Variant 0: Dark card with large quote mark
      `<div style="background:rgba(0,0,0,0.2);border-radius:12px;padding:20px;border:1px solid rgba(255,255,255,0.04);position:relative;"><div style="font-size:2em;color:${t.accent};opacity:0.3;line-height:1;margin-bottom:6px;">"</div><div style="color:${t.text};font-size:0.95em;font-style:italic;line-height:1.7;">${escapeHtml(b.quote)}</div><div style="margin-top:12px;display:flex;align-items:center;gap:8px;"><div style="width:28px;height:2px;background:${t.accent};border-radius:2px;"></div><div style="font-family:monospace;font-size:0.68em;color:${t.muted};">${escapeHtml(b.attribution)}</div></div></div>`,
      // Variant 1: Centered with accent borders
      `<div style="text-align:center;padding:20px;border-top:2px solid ${t.accent};border-bottom:2px solid ${t.accent};"><div style="font-size:1.8em;color:${t.accent};opacity:0.25;line-height:1;margin-bottom:8px;">"</div><div style="color:${t.text};font-size:0.95em;font-style:italic;line-height:1.8;padding:0 8px;">${escapeHtml(b.quote)}</div><div style="margin-top:14px;font-family:monospace;font-size:0.68em;color:${t.muted};">${escapeHtml(b.attribution)}</div></div>`,
      // Variant 2: Left-border with gradient
      `<div style="border-left:4px solid ${t.accent};padding:16px 20px;background:linear-gradient(135deg, rgba(0,0,0,0.15), rgba(0,0,0,0.05));border-radius:0 10px 10px 0;"><div style="color:${t.text};font-size:0.95em;font-style:italic;line-height:1.7;">"${escapeHtml(b.quote)}"</div><div style="margin-top:10px;font-family:monospace;font-size:0.68em;color:${t.muted};">${escapeHtml(b.attribution)}</div></div>`,
    ];
    return variants[variant] || variants[0];
  },

  // ── Pattern M: Paragraph ────────────────────────────────────────────────
  'paragraph': (block, t, variant) => {
    const b = block as Extract<ContentBlock, { kind: 'paragraph' }>;
    const variants = [
      // Variant 0: Simple styled paragraph
      `<p style="color:${t.muted};font-size:0.92em;line-height:1.8;">${escapeHtml(b.text)}</p>`,
      // Variant 1: With accent first-letter
      `<p style="color:${t.muted};font-size:0.92em;line-height:1.8;"><span style="font-size:1.4em;font-weight:700;color:${t.accent};margin-right:2px;">${b.text.charAt(0)}</span>${escapeHtml(b.text.slice(1))}</p>`,
      // Variant 2: Indented with left line
      `<div style="border-left:2px solid rgba(255,255,255,0.08);padding-left:16px;"><p style="color:${t.muted};font-size:0.92em;line-height:1.8;">${escapeHtml(b.text)}</p></div>`,
    ];
    return variants[variant] || variants[0];
  },
};

// ── Main Render Function ─────────────────────────────────────────────────────

/**
 * Renders a structured ContentBlock into HTML using the specified visual variant.
 * 
 * @param block - The structured content block from AI output
 * @param tokens - Theme color tokens
 * @param variant - Visual variant index (0, 1, or 2) for design variety
 */
export function renderContentBlock(
  block: ContentBlock,
  tokens: ThemeTokens,
  variant: VariantIndex = 0,
): string {
  const renderer = renderers[block.kind];
  if (!renderer) {
    // Fallback: render as paragraph
    return `<p style="color:${tokens.muted};font-size:0.92em;line-height:1.8;">${JSON.stringify(block)}</p>`;
  }
  return renderer(block, tokens, variant);
}

/**
 * Applies emphasis formatting to a title by wrapping the emphasisWord in <em> tags.
 */
export function applyTitleEmphasis(title: string, emphasisWord?: string): string {
  if (!emphasisWord) return title;
  // Case-insensitive replacement of the first occurrence
  const regex = new RegExp(`(${emphasisWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'i');
  return title.replace(regex, '<em>$1</em>');
}
