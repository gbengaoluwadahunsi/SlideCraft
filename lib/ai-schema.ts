/**
 * ai-schema.ts
 * 
 * Strict schemas for AI output. The AI generates ONLY structured JSON —
 * no HTML, no layout decisions. This eliminates the "same design for everyone"
 * problem and prevents formatting breakage.
 */

import { z } from 'zod';

// ── Content Block Types ──────────────────────────────────────────────────────
// Each block type represents a semantic content structure.
// The layout router + renderer handle the visual representation.

export const QuoteTipBlockSchema = z.object({
  kind: z.literal('quote-tip'),
  quote: z.string().min(20).describe('Full paragraph (3-4 sentences) explaining the concept in depth'),
  tip: z.string().min(10).describe('Concrete, actionable insight tied to the content above'),
});

export const IconCardsBlockSchema = z.object({
  kind: z.literal('icon-cards'),
  cards: z.array(z.object({
    emoji: z.string().describe('A single relevant emoji'),
    title: z.string().max(60).describe('Card title'),
    description: z.string().min(20).describe('1-2 sentence description with real detail'),
  })).min(3).max(4),
});

export const NumberedListBlockSchema = z.object({
  kind: z.literal('numbered-list'),
  items: z.array(z.object({
    title: z.string().max(60).describe('Principle/step title'),
    description: z.string().min(20).describe('1-2 sentence explanation with real detail'),
  })).min(3).max(5),
});

export const CodeBlockSchema = z.object({
  kind: z.literal('code-block'),
  explanation: z.string().min(10).describe('Brief explanation of what the code does'),
  code: z.string().min(20).describe('8-15 lines of real code'),
  language: z.string().default('javascript').describe('Programming language'),
});

export const PillTagsBlockSchema = z.object({
  kind: z.literal('pill-tags'),
  tags: z.array(z.string().max(30)).min(3).max(8),
  summary: z.string().min(20).describe('Summary text explaining the tags'),
});

export const StatsGridBlockSchema = z.object({
  kind: z.literal('stats-grid'),
  stats: z.array(z.object({
    value: z.string().max(20).describe('The stat number, e.g. "47%", "3.2x", "12K+"'),
    label: z.string().max(40).describe('Short label for the stat'),
    description: z.string().min(15).describe('1-2 sentence context for this number'),
  })).min(3).max(4),
});

export const BeforeAfterBlockSchema = z.object({
  kind: z.literal('before-after'),
  before: z.array(z.object({
    text: z.string().min(5).describe('Problem or old approach'),
  })).min(3).max(4),
  after: z.array(z.object({
    text: z.string().min(5).describe('Improvement or new approach'),
  })).min(3).max(4),
});

export const ArrowListBlockSchema = z.object({
  kind: z.literal('arrow-list'),
  items: z.array(z.object({
    title: z.string().max(60).describe('Item title'),
    description: z.string().min(10).describe('Brief explanation of this point'),
  })).min(4).max(6),
});

export const TimelineBlockSchema = z.object({
  kind: z.literal('timeline'),
  phases: z.array(z.object({
    title: z.string().max(60).describe('Phase name'),
    description: z.string().min(15).describe('1-2 sentence description of this phase'),
  })).min(3).max(5),
});

export const HighlightBoxBlockSchema = z.object({
  kind: z.literal('highlight-box'),
  label: z.string().max(30).default('Key Takeaway').describe('Short label, e.g. "Key Takeaway", "Pro Tip"'),
  headline: z.string().min(10).describe('The main insight in one strong sentence'),
  detail: z.string().min(20).describe('2-3 sentences of supporting detail'),
});

export const MetricCalloutBlockSchema = z.object({
  kind: z.literal('metric-callout'),
  value: z.string().max(20).describe('The big number, e.g. "73%"'),
  description: z.string().min(15).describe('What this metric represents'),
  source: z.string().max(60).optional().describe('Attribution or source'),
});

export const QuoteCardBlockSchema = z.object({
  kind: z.literal('quote-card'),
  quote: z.string().min(15).describe('The quoted text — punchy and memorable'),
  attribution: z.string().max(60).describe('Who said it, e.g. "— Steve Jobs"'),
});

export const ParagraphBlockSchema = z.object({
  kind: z.literal('paragraph'),
  text: z.string().min(30).describe('A rich paragraph of content (3-5 sentences)'),
});

// Union of all content block types
export const ContentBlockSchema = z.discriminatedUnion('kind', [
  QuoteTipBlockSchema,
  IconCardsBlockSchema,
  NumberedListBlockSchema,
  CodeBlockSchema,
  PillTagsBlockSchema,
  StatsGridBlockSchema,
  BeforeAfterBlockSchema,
  ArrowListBlockSchema,
  TimelineBlockSchema,
  HighlightBoxBlockSchema,
  MetricCalloutBlockSchema,
  QuoteCardBlockSchema,
  ParagraphBlockSchema,
]);

// ── Slide Schema ─────────────────────────────────────────────────────────────
// The AI outputs an array of these. No HTML, no colors, no fonts — just content.

export const AISlideSchema = z.object({
  role: z.enum(['hook', 'context', 'value', 'proof', 'cta']).describe(
    'Semantic role: hook (cover), context (credibility), value (main content), proof (summary), cta (call to action)'
  ),
  title: z.string().max(80).describe('Short, punchy title. 6-8 words max'),
  emphasisWord: z.string().max(30).optional().describe('ONE key word from the title to highlight in accent color'),
  subtitle: z.string().max(120).optional().describe('For hook/cover slides only — the main hook'),
  slideLabel: z.string().max(20).optional().describe('1-2 word category label, e.g. "Definition", "The Problem", "Framework"'),
  content: ContentBlockSchema.describe('Structured content block — choose the kind that best fits this slide'),
  icon: z.string().max(30).optional().describe('Phosphor icon name for visual slides, e.g. "lightbulb", "target", "rocket"'),
});

export const AIOutputSchema = z.object({
  slides: z.array(AISlideSchema).min(3).max(100),
});

// ── Type Exports ─────────────────────────────────────────────────────────────

export type ContentBlock = z.infer<typeof ContentBlockSchema>;
export type AISlide = z.infer<typeof AISlideSchema>;
export type AIOutput = z.infer<typeof AIOutputSchema>;
export type ContentBlockKind = ContentBlock['kind'];

// ── Prompt Schema Description ────────────────────────────────────────────────
// This is what we include in the AI prompt so the model knows the expected format.

export const SCHEMA_DESCRIPTION = `
You MUST return a JSON object matching this EXACT schema. ONLY JSON, no markdown, no code fences.

{
  "slides": [
    {
      "role": "hook" | "context" | "value" | "proof" | "cta",
      "title": "Short punchy title (6-8 words)",
      "emphasisWord": "ONE key word from the title to visually highlight",
      "subtitle": "(hook/cta slides only) The main hook or closing statement",
      "slideLabel": "1-2 word label, e.g. 'Definition', 'The Problem'",
      "icon": "(optional) Phosphor icon name: lightbulb, target, rocket, users, shield, brain, trophy, clock, star, heart, fire, globe, zap, chart, book, leaf, gift, sun, trending-up, check-circle, etc.",
      "content": { ONE of the content block types below }
    }
  ]
}

CONTENT BLOCK TYPES — pick the one that BEST fits each slide's content:

1. "quote-tip" — for definitions, core concepts, key explanations
   { "kind": "quote-tip", "quote": "Full paragraph (3-4 sentences)", "tip": "Actionable insight" }

2. "icon-cards" — for problems, pain points, features (3-4 cards)
   { "kind": "icon-cards", "cards": [{ "emoji": "📦", "title": "Card Title", "description": "1-2 sentences" }, ...] }

3. "numbered-list" — for principles, rules, steps (3-5 items)
   { "kind": "numbered-list", "items": [{ "title": "Step Title", "description": "1-2 sentences" }, ...] }

4. "code-block" — for technical content with actual code
   { "kind": "code-block", "explanation": "What it does", "code": "actual\\ncode\\nhere", "language": "javascript" }

5. "pill-tags" — for best practices, key terms, quick lists
   { "kind": "pill-tags", "tags": ["Tag One", "Tag Two", ...], "summary": "Summary text" }

6. "stats-grid" — for metrics, numbers, data highlights (3-4 stats)
   { "kind": "stats-grid", "stats": [{ "value": "47%", "label": "Label", "description": "Context" }, ...] }

7. "before-after" — for comparisons, transformations
   { "kind": "before-after", "before": [{ "text": "Old way" }, ...], "after": [{ "text": "New way" }, ...] }

8. "arrow-list" — for checklists, pitfalls, action items (4-6 items)
   { "kind": "arrow-list", "items": [{ "title": "Item", "description": "Brief explanation" }, ...] }

9. "timeline" — for phases, roadmaps, chronological progressions (3-5 phases)
   { "kind": "timeline", "phases": [{ "title": "Phase 1", "description": "What happens" }, ...] }

10. "highlight-box" — for key takeaways, important callouts
    { "kind": "highlight-box", "label": "Key Takeaway", "headline": "Main insight", "detail": "Supporting detail" }

11. "metric-callout" — for a single standout metric
    { "kind": "metric-callout", "value": "73%", "description": "What it means", "source": "Optional source" }

12. "quote-card" — for powerful quotes, testimonials
    { "kind": "quote-card", "quote": "The quoted text", "attribution": "— Who said it" }

13. "paragraph" — for rich prose when no structured format fits
    { "kind": "paragraph", "text": "A rich paragraph of 3-5 sentences" }

RULES:
- First slide MUST have role "hook". Last slide MUST have role "cta".
- NEVER repeat the same content block kind on consecutive slides.
- Use at least 4 DIFFERENT content block kinds across the carousel.
- Every field must contain REAL, SPECIFIC content — no placeholders.
- Fill every block completely: icon-cards = 3-4 cards, stats-grid = 3-4 stats, etc.
- Choose the content block that genuinely fits the slide's content, not randomly.
`;
