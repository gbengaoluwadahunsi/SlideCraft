/**
 * layout-router.ts
 * 
 * Picks visual variants for each slide to maximize design variety.
 * Uses a deterministic seed (project-level or per-generation) so the same
 * user can regenerate and get different layouts, while different users
 * naturally get different combinations.
 * 
 * This module also handles the mapping from AI's semantic slide roles
 * to the SlideData types the frontend expects.
 */

import type { AISlide, ContentBlockKind } from './ai-schema';

// ── Types ────────────────────────────────────────────────────────────────────

export interface LayoutDecision {
  /** The visual variant index (0, 1, or 2) for the content renderer */
  variant: 0 | 1 | 2;
  /** The SlideData.type for the frontend */
  slideType: 'cover' | 'content' | 'chart' | 'visual';
  /** Whether to use infographic mode */
  useInfographic: boolean;
}

// ── Variant Selection ────────────────────────────────────────────────────────

const VARIANT_COUNT = 3;

/**
 * Simple seeded pseudo-random number generator (mulberry32).
 * Deterministic: same seed → same sequence. Different seeds → different layouts.
 */
function createRng(seed: number): () => number {
  let state = seed | 0;
  return () => {
    state = (state + 0x6D2B79F5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Generates a design seed from user/project context.
 * Different users + different timestamps = different layouts.
 */
export function generateDesignSeed(userId?: string, projectId?: string): number {
  const str = `${userId || 'anon'}-${projectId || Date.now()}-${Math.random()}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

// ── Content-Type to Pattern Affinity ─────────────────────────────────────────
// Some content block kinds have natural affinities with certain variant styles.
// This mapping can be extended to influence layout decisions.

const ROLE_TYPE_MAP: Record<AISlide['role'], 'cover' | 'content'> = {
  hook: 'cover',
  context: 'content',
  value: 'content',
  proof: 'content',
  cta: 'content',
};

// Content block kinds that work well in infographic mode
const INFOGRAPHIC_KINDS = new Set<ContentBlockKind>([
  'icon-cards',
  'numbered-list',
  'timeline',
  'stats-grid',
]);

// ── Main Router ──────────────────────────────────────────────────────────────

/**
 * Given an array of AI slides and a design seed, produces a LayoutDecision
 * for each slide that maximizes visual variety.
 * 
 * Rules:
 * 1. Never assign the same variant to consecutive slides
 * 2. Distribute variants roughly evenly across the carousel
 * 3. Cover (hook) slides always get slideType 'cover'
 * 4. Data-heavy content blocks may route to 'visual' with infographic rendering
 */
export function routeLayouts(
  slides: AISlide[],
  seed: number,
  slideStyle: 'text' | 'visual' | 'mixed' = 'mixed',
): LayoutDecision[] {
  const rng = createRng(seed);
  const decisions: LayoutDecision[] = [];
  let lastVariant: number = -1;
  let lastKind: ContentBlockKind | null = null;

  for (let i = 0; i < slides.length; i++) {
    const slide = slides[i];
    const kind = slide.content.kind;

    // ── Determine slide type ──
    let slideType: LayoutDecision['slideType'];
    if (slide.role === 'hook') {
      slideType = 'cover';
    } else if (slideStyle === 'visual' && INFOGRAPHIC_KINDS.has(kind)) {
      slideType = 'visual';
    } else if (slideStyle === 'mixed' && INFOGRAPHIC_KINDS.has(kind) && rng() > 0.4) {
      slideType = 'visual';
    } else {
      slideType = ROLE_TYPE_MAP[slide.role] || 'content';
    }

    // ── Pick variant with anti-repeat logic ──
    let variant: 0 | 1 | 2;
    if (kind === lastKind) {
      // Same content type back-to-back — force a different variant
      const available = [0, 1, 2].filter(v => v !== lastVariant) as (0 | 1 | 2)[];
      variant = available[Math.floor(rng() * available.length)];
    } else {
      // Different content type — any variant, but prefer different from last
      const raw = Math.floor(rng() * VARIANT_COUNT) as 0 | 1 | 2;
      variant = raw === lastVariant
        ? ((raw + 1) % VARIANT_COUNT) as 0 | 1 | 2
        : raw;
    }

    const useInfographic = slideType === 'visual';

    decisions.push({ variant, slideType, useInfographic });
    lastVariant = variant;
    lastKind = kind;
  }

  return decisions;
}

// ── Slide Style Recommendation ───────────────────────────────────────────────

/**
 * Analyzes the AI output to recommend which content blocks are best suited
 * for different rendering modes. This can be used by the frontend to
 * suggest slide style changes.
 */
export function analyzeContentMix(slides: AISlide[]): {
  totalSlides: number;
  infographicCandidates: number;
  textHeavySlides: number;
  recommendedStyle: 'text' | 'visual' | 'mixed';
} {
  let infographicCandidates = 0;
  let textHeavySlides = 0;

  for (const slide of slides) {
    if (INFOGRAPHIC_KINDS.has(slide.content.kind)) {
      infographicCandidates++;
    } else {
      textHeavySlides++;
    }
  }

  const ratio = infographicCandidates / slides.length;
  const recommendedStyle = ratio > 0.7 ? 'visual' : ratio > 0.3 ? 'mixed' : 'text';

  return {
    totalSlides: slides.length,
    infographicCandidates,
    textHeavySlides,
    recommendedStyle,
  };
}
