import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { incrementAndGetMetrics } from '@/lib/metrics';
import { getUserPlanLimits, trackUsage } from '@/lib/subscription';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// In-memory burst rate limiter: max 5 requests per user per 60 seconds
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 60_000;
const RATE_LIMIT_MAX = 5;

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count++;
  return true;
}

// Provider configuration — Groq primary, OpenRouter (Gemini) fallback
const PROVIDERS = [
  { name: 'groq', model: 'llama-3.3-70b-versatile', envKey: 'GROQ_API_KEY', baseURL: 'https://api.groq.com/openai/v1' },
  { name: 'openrouter', model: 'google/gemini-2.0-flash-001', envKey: 'OPENROUTER_API_KEY', baseURL: 'https://openrouter.ai/api/v1' },
];

// Retry logic — skip immediately on rate limits (don't waste time retrying)
async function generateWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 2
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (err: any) {
      const msg = err?.message || '';
      const status = err?.status || err?.statusCode || 0;
      // Don't retry rate limits or auth errors — fail fast to next provider
      if (status === 429 || status === 401 || status === 403 || msg.includes('rate_limit') || msg.includes('quota')) {
        throw err;
      }
      console.error(`Attempt ${i + 1} failed:`, msg.substring(0, 200));
      if (i === maxRetries - 1) throw err;
      await new Promise(r => setTimeout(r, 500 * (i + 1)));
    }
  }
  throw new Error('Max retries exceeded');
}

const BASE_SYSTEM_PROMPT = `
You are the world's best carousel content strategist. You create carousels that get 3-5x more engagement than average.
Return ONLY a valid JSON object with a "slides" array. No markdown code blocks.
Do NOT use markdown syntax (**bold**, ###, __underline__). Only HTML.

ENGAGEMENT-OPTIMIZED SLIDE SEQUENCE (data-backed):

SLIDE 1 — THE HOOK (most important slide, determines 80% of performance):
- Title: 6-8 words MAX. Benefit-driven. Create an open loop or curiosity gap.
- Patterns that work: bold claim, surprising stat, contrarian take, "how to" promise, numbered list tease ("7 mistakes killing your...").
- Use <em>keyword</em> to visually anchor ONE power word.
- Subtitle: 1 sentence expanding the hook. Must make them NEED to swipe.

SLIDE 2 — CONTEXT / CREDIBILITY:
- Build urgency. Use a stat, quote, or pain point that proves the topic matters.
- Pattern F (Stats Grid), K (Metric Callout), or L (Quote Card) work great here.

SLIDES 3 to N-2 — VALUE DELIVERY (the meat):
- ONE idea per slide. Each slide must teach or reveal something.
- Write at Grade 7-8 reading level. Short sentences (under 12 words). Conversational tone.
- Use rich HTML patterns — Icon Cards, Numbered Lists, Code Blocks, Timelines, etc.
- VARY the pattern every slide. Never use the same layout twice in a row.
- Each pattern must be FULLY FILLED (3-4 cards for Icon Cards, 3-5 items for lists, 4 stats for grids).

SLIDE N-1 — PROOF / SUMMARY:
- Reinforce value with a highlight box, stats recap, or key takeaway.
- Pattern J (Highlight Box) or F (Stats Grid) work best.

SLIDE N — CTA (call to action):
- Summarize the key insight in one punchy sentence.
- Clear CTA: follow, save, share, comment, or visit a link.
- Make it feel like a satisfying ending, not an abrupt stop.

CONTENT DENSITY RULES:
- PRESERVE source material depth. Reformat into patterns, don't summarize away.
- Every pattern must be completely filled. A half-empty card grid looks broken.
- If source has 4 points under a heading, show all 4 — don't collapse to 1.
- Icon Cards: 3-4 cards, each with title + 1-2 sentence description.
- Numbered Lists: 3-5 items, each with title + explanation.
- Stats Grid: 4 cards with number + description.
- Before/After: 3-4 items per column.
- Quote + Tip: Full paragraph (3-4 sentences) + actionable tip.
- Code Blocks: 8-15 lines of real code + explanation.
`;

const TEXT_PATTERN_DEFINITIONS = `
IMPORTANT: Use these exact color tokens in your HTML. They will be replaced with the user's theme colors:
- {{ACCENT}} = primary accent color
- {{ACCENT2}} = secondary accent (for contrast, e.g. "before" column)
- {{MUTED}} = muted/body text color
- {{TEXT}} = primary text color (headings)
- {{ACCENT_BG}} = accent at 6% opacity for backgrounds (use as-is, it will be computed)
- {{ACCENT_BORDER}} = accent at 15% opacity for borders (use as-is, it will be computed)

PATTERN A: "Quote + Tip" — for definitions, core concepts, key explanations
<p style="border-left:3px solid {{ACCENT}};padding-left:16px;color:{{MUTED}};font-size:0.92em;line-height:1.75;">Write a full paragraph here — 3-4 sentences that explain the concept in depth. Don't just write one line. The reader should walk away understanding the idea after reading this block. Include context, why it matters, and how it connects to the bigger picture.</p><div style="background:{{ACCENT_BG}};border:1px solid {{ACCENT_BORDER}};border-radius:10px;padding:14px 18px;margin-top:16px;color:{{ACCENT}};font-size:0.85em;line-height:1.6;">💡 A concrete, actionable insight — not generic advice. Tie it to the content above.</div>

PATTERN B: "Icon Cards" — for problems, pain points, features (MUST have 3-4 cards)
<div style="display:flex;flex-direction:column;gap:8px;"><div style="background:rgba(0,0,0,0.25);border:1px solid rgba(255,255,255,0.05);border-radius:10px;padding:12px 16px;display:flex;align-items:flex-start;gap:12px;"><span style="font-size:1.3em;flex-shrink:0;">📦</span><div><div style="font-weight:700;color:{{TEXT}};font-size:0.92em;margin-bottom:2px;">Card Title</div><div style="font-family:monospace;font-size:0.72em;color:{{MUTED}};line-height:1.65;">1-2 sentence description explaining THIS specific point. Don't leave this empty.</div></div></div><div style="background:rgba(0,0,0,0.25);border:1px solid rgba(255,255,255,0.05);border-radius:10px;padding:12px 16px;display:flex;align-items:flex-start;gap:12px;"><span style="font-size:1.3em;flex-shrink:0;">⚡</span><div><div style="font-weight:700;color:{{TEXT}};font-size:0.92em;margin-bottom:2px;">Second Card</div><div style="font-family:monospace;font-size:0.72em;color:{{MUTED}};line-height:1.65;">Another 1-2 sentence description with real detail from the source.</div></div></div><div style="background:rgba(0,0,0,0.25);border:1px solid rgba(255,255,255,0.05);border-radius:10px;padding:12px 16px;display:flex;align-items:flex-start;gap:12px;"><span style="font-size:1.3em;flex-shrink:0;">🔧</span><div><div style="font-weight:700;color:{{TEXT}};font-size:0.92em;margin-bottom:2px;">Third Card</div><div style="font-family:monospace;font-size:0.72em;color:{{MUTED}};line-height:1.65;">Same here — every card needs both a title AND a meaningful description.</div></div></div></div>
ALWAYS include 3-4 cards. Each card MUST have a title AND a 1-2 sentence description. Use relevant emoji per card.

PATTERN C: "Numbered List" — for principles, rules, steps (MUST have 3-5 items)
<div style="display:flex;flex-direction:column;gap:6px;"><div style="display:flex;gap:14px;align-items:flex-start;padding:4px 0;"><span style="font-family:var(--font-bebas-neue);font-size:1.6em;line-height:1;color:{{ACCENT}};flex-shrink:0;min-width:28px;">01</span><div><div style="font-weight:700;color:{{TEXT}};font-size:0.92em;">First Principle Title</div><div style="font-family:monospace;font-size:0.7em;color:{{MUTED}};line-height:1.65;margin-top:1px;">1-2 sentence explanation of this principle with real detail.</div></div></div><div style="display:flex;gap:14px;align-items:flex-start;padding:4px 0;"><span style="font-family:var(--font-bebas-neue);font-size:1.6em;line-height:1;color:{{ACCENT}};flex-shrink:0;min-width:28px;">02</span><div><div style="font-weight:700;color:{{TEXT}};font-size:0.92em;">Second Principle Title</div><div style="font-family:monospace;font-size:0.7em;color:{{MUTED}};line-height:1.65;margin-top:1px;">Another explanation — don't just repeat the title.</div></div></div><div style="display:flex;gap:14px;align-items:flex-start;padding:4px 0;"><span style="font-family:var(--font-bebas-neue);font-size:1.6em;line-height:1;color:{{ACCENT}};flex-shrink:0;min-width:28px;">03</span><div><div style="font-weight:700;color:{{TEXT}};font-size:0.92em;">Third Principle Title</div><div style="font-family:monospace;font-size:0.7em;color:{{MUTED}};line-height:1.65;margin-top:1px;">Keep going — each item must have both title and explanation.</div></div></div></div>
ALWAYS include 3-5 numbered items. Each item MUST have a title AND a description.

PATTERN D: "Code Block" — for technical content, implementation details, examples
<p style="color:{{MUTED}};font-size:0.9em;line-height:1.75;">Explanation text.</p><div style="background:rgba(0,0,0,0.35);border:1px solid rgba(255,255,255,0.06);border-radius:8px;padding:14px 16px;margin-top:14px;font-family:monospace;font-size:0.72em;line-height:1.7;color:{{MUTED}};"><span style="color:#5A6580;">// comment</span><br/><span style="color:{{ACCENT}};">keyword</span> <span style="color:{{ACCENT2}};">functionName</span>() {<br/>&nbsp;&nbsp;code here;<br/>}</div>

PATTERN E: "Pill Tags" — for best practices, key terms, quick lists
<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:14px;"><span style="font-family:monospace;font-size:0.7em;padding:5px 12px;border-radius:100px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);color:{{MUTED}};">Tag One</span></div><p style="color:{{MUTED}};font-size:0.88em;line-height:1.75;">Summary text.</p>
Repeat <span> for each tag.

PATTERN F: "Stats Grid" — for metrics, numbers, data highlights (MUST have 4 cards in 2x2)
<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;"><div style="background:rgba(0,0,0,0.25);border:1px solid rgba(255,255,255,0.05);border-radius:8px;padding:14px;"><div style="font-family:var(--font-bebas-neue);font-size:2em;line-height:1;color:{{ACCENT}};">47%</div><div style="font-family:monospace;font-size:0.65em;color:{{MUTED}};margin-top:4px;line-height:1.5;">What this number means in context — 1-2 sentences.</div></div><div style="background:rgba(0,0,0,0.25);border:1px solid rgba(255,255,255,0.05);border-radius:8px;padding:14px;"><div style="font-family:var(--font-bebas-neue);font-size:2em;line-height:1;color:{{ACCENT2}};">3.2x</div><div style="font-family:monospace;font-size:0.65em;color:{{MUTED}};margin-top:4px;line-height:1.5;">Explanation of what this metric represents.</div></div><div style="background:rgba(0,0,0,0.25);border:1px solid rgba(255,255,255,0.05);border-radius:8px;padding:14px;"><div style="font-family:var(--font-bebas-neue);font-size:2em;line-height:1;color:{{ACCENT}};">12K+</div><div style="font-family:monospace;font-size:0.65em;color:{{MUTED}};margin-top:4px;line-height:1.5;">Context for this number and why it matters.</div></div><div style="background:rgba(0,0,0,0.25);border:1px solid rgba(255,255,255,0.05);border-radius:8px;padding:14px;"><div style="font-family:var(--font-bebas-neue);font-size:2em;line-height:1;color:{{ACCENT2}};">98%</div><div style="font-family:monospace;font-size:0.65em;color:{{MUTED}};margin-top:4px;line-height:1.5;">Describe the significance of this stat.</div></div></div>
ALWAYS include 4 stat cards with REAL numbers, labels, AND 1-2 sentence descriptions.

PATTERN G: "Before/After" — for comparisons, transformations (MUST have 3-4 items per column)
<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;"><div style="background:rgba(0,0,0,0.2);border-radius:8px;padding:14px;border:1px solid rgba(255,255,255,0.04);"><div style="font-family:monospace;font-size:0.65em;letter-spacing:0.15em;text-transform:uppercase;color:{{ACCENT2}};font-weight:600;margin-bottom:8px;">Before</div><div style="font-family:monospace;font-size:0.7em;color:{{MUTED}};line-height:1.8;">❌ First problem or old approach<br/>❌ Second problem or limitation<br/>❌ Third pain point or issue</div></div><div style="background:rgba(0,0,0,0.2);border-radius:8px;padding:14px;border:1px solid rgba(255,255,255,0.04);"><div style="font-family:monospace;font-size:0.65em;letter-spacing:0.15em;text-transform:uppercase;color:{{ACCENT}};font-weight:600;margin-bottom:8px;">After</div><div style="font-family:monospace;font-size:0.7em;color:{{MUTED}};line-height:1.8;">✅ First improvement or new approach<br/>✅ Second benefit or capability<br/>✅ Third advantage or result</div></div></div>
ALWAYS include 3-4 items per column with real contrasting content.

PATTERN H: "Arrow List" — for checklists, pitfalls, future items (MUST have 4-6 items)
<div style="display:flex;flex-direction:column;gap:6px;"><div style="font-family:monospace;font-size:0.75em;color:{{MUTED}};padding-left:18px;position:relative;line-height:1.75;"><span style="position:absolute;left:0;opacity:0.5;">→</span><strong style="color:{{TEXT}};">Item title</strong> — brief explanation of this point</div><div style="font-family:monospace;font-size:0.75em;color:{{MUTED}};padding-left:18px;position:relative;line-height:1.75;"><span style="position:absolute;left:0;opacity:0.5;">→</span><strong style="color:{{TEXT}};">Second item</strong> — another meaningful point with detail</div><div style="font-family:monospace;font-size:0.75em;color:{{MUTED}};padding-left:18px;position:relative;line-height:1.75;"><span style="position:absolute;left:0;opacity:0.5;">→</span><strong style="color:{{TEXT}};">Third item</strong> — keep going, each line needs substance</div><div style="font-family:monospace;font-size:0.75em;color:{{MUTED}};padding-left:18px;position:relative;line-height:1.75;"><span style="position:absolute;left:0;opacity:0.5;">→</span><strong style="color:{{TEXT}};">Fourth item</strong> — end with a complete list</div></div>
ALWAYS include 4-6 items. Each item should have a bold title + brief explanation.

PATTERN I: "Timeline" — for chronological progressions, phases, roadmaps (MUST have 3-4 phases)
<div style="display:flex;flex-direction:column;gap:10px;"><div style="display:flex;gap:12px;align-items:flex-start;"><div style="display:flex;flex-direction:column;align-items:center;flex-shrink:0;"><div style="width:10px;height:10px;border-radius:50%;background:{{ACCENT}};"></div><div style="width:2px;height:32px;background:rgba(255,255,255,0.08);"></div></div><div><div style="font-weight:700;color:{{TEXT}};font-size:0.88em;">Phase 1 Title</div><div style="font-family:monospace;font-size:0.7em;color:{{MUTED}};line-height:1.65;margin-top:2px;">1-2 sentence description of what happens in this phase.</div></div></div><div style="display:flex;gap:12px;align-items:flex-start;"><div style="display:flex;flex-direction:column;align-items:center;flex-shrink:0;"><div style="width:10px;height:10px;border-radius:50%;background:{{ACCENT2}};"></div><div style="width:2px;height:32px;background:rgba(255,255,255,0.08);"></div></div><div><div style="font-weight:700;color:{{TEXT}};font-size:0.88em;">Phase 2 Title</div><div style="font-family:monospace;font-size:0.7em;color:{{MUTED}};line-height:1.65;margin-top:2px;">Another description — keep them substantive, not one-word placeholders.</div></div></div><div style="display:flex;gap:12px;align-items:flex-start;"><div style="display:flex;flex-direction:column;align-items:center;flex-shrink:0;"><div style="width:10px;height:10px;border-radius:50%;background:{{ACCENT}};"></div></div><div><div style="font-weight:700;color:{{TEXT}};font-size:0.88em;">Phase 3 Title</div><div style="font-family:monospace;font-size:0.7em;color:{{MUTED}};line-height:1.65;margin-top:2px;">Final phase with real content explaining what it involves.</div></div></div></div>
ALWAYS include 3-4 timeline phases. Each MUST have a title AND 1-2 sentence description.

PATTERN J: "Highlight Box" — for key takeaways, important callouts, summaries
<div style="background:{{ACCENT_BG}};border:1px solid {{ACCENT_BORDER}};border-radius:12px;padding:18px 20px;"><div style="font-family:monospace;font-size:0.65em;letter-spacing:0.15em;text-transform:uppercase;color:{{ACCENT}};font-weight:600;margin-bottom:10px;">⚡ Key Takeaway</div><div style="color:{{TEXT}};font-size:0.95em;font-weight:700;line-height:1.6;margin-bottom:8px;">The main insight stated clearly in one strong sentence.</div><div style="font-family:monospace;font-size:0.72em;color:{{MUTED}};line-height:1.7;">2-3 sentences of supporting detail that expand on the insight. Explain WHY it matters, WHO it affects, and WHAT to do about it. Don't leave this section thin.</div></div>

PATTERN K: "Metric Callout" — for a single big number with context
<div style="text-align:center;padding:8px 0;"><div style="font-family:var(--font-bebas-neue);font-size:3.5em;line-height:1;color:{{ACCENT}};letter-spacing:-0.02em;">73%</div><div style="font-family:monospace;font-size:0.72em;color:{{MUTED}};margin-top:8px;line-height:1.6;">What this metric represents and why it matters.</div><div style="width:40px;height:2px;background:{{ACCENT}};margin:12px auto 0;border-radius:2px;opacity:0.5;"></div><div style="font-family:monospace;font-size:0.65em;color:{{MUTED}};margin-top:10px;opacity:0.7;">Source or context</div></div>

PATTERN L: "Quote Card" — for powerful quotes, testimonials, expert opinions
<div style="background:rgba(0,0,0,0.2);border-radius:12px;padding:20px;border:1px solid rgba(255,255,255,0.04);position:relative;"><div style="font-size:2em;color:{{ACCENT}};opacity:0.3;line-height:1;margin-bottom:6px;">"</div><div style="color:{{TEXT}};font-size:0.95em;font-style:italic;line-height:1.7;">The quoted text goes here. Keep it punchy and memorable.</div><div style="margin-top:12px;display:flex;align-items:center;gap:8px;"><div style="width:28px;height:2px;background:{{ACCENT}};border-radius:2px;"></div><div style="font-family:monospace;font-size:0.68em;color:{{MUTED}};">— Attribution Name</div></div></div>
`;

const ALL_CONTENT_PATTERNS = ['A','B','C','D','E','F','G','H','I','J','K','L'] as const;
const NON_TECHNICAL_PATTERNS = ['A','B','C','E','F','G','H','I','J','K','L'] as const;

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generatePatternOrder(slideCount: number, existingOrder?: string[], hasCode?: boolean): string[] {
  if (existingOrder && existingOrder.length >= slideCount - 2) {
    return existingOrder.slice(0, slideCount - 2);
  }

  const contentSlideCount = slideCount - 2; // minus cover and CTA
  const pool = [...ALL_CONTENT_PATTERNS];
  const order: string[] = [];

  // For code-heavy content, reserve ~30-40% of slots for Pattern D
  const codeSlotCount = hasCode ? Math.max(2, Math.floor(contentSlideCount * 0.35)) : 0;
  const codeSlotIndices = new Set<number>();
  if (codeSlotCount > 0) {
    const indices = Array.from({ length: contentSlideCount }, (_, i) => i);
    const shuffledIndices = shuffleArray(indices);
    for (let i = 0; i < codeSlotCount; i++) {
      codeSlotIndices.add(shuffledIndices[i]);
    }
  }

  for (let i = 0; i < contentSlideCount; i++) {
    if (codeSlotIndices.has(i) && order[order.length - 1] !== 'D') {
      order.push('D');
    } else {
      const available = pool.filter(p => p !== order[order.length - 1]);
      const shuffled = shuffleArray(available);
      order.push(shuffled[0]);
    }
  }
  return order;
}

function buildSlideStructure(patternOrder: string[]): string {
  return `PATTERN SELECTION — match content type to the BEST visual pattern:
  • Definition / explanation → A (Quote + Tip)
  • List of features / problems / pain points → B (Icon Cards)
  • Steps / rules / principles → C (Numbered List)
  • Code / technical implementation → D (Code Block)
  • Tags / keywords / quick list → E (Pill Tags)
  • Multiple stats / metrics → F (Stats Grid)
  • Comparison / before vs after → G (Before/After)
  • Checklist / do's & don'ts → H (Arrow List)
  • Phases / roadmap / timeline → I (Timeline)
  • Key takeaway / summary → J (Highlight Box)
  • Single standout metric → K (Metric Callout)
  • Quote / testimonial → L (Quote Card)

LAYOUT RULES:
1. Never repeat the same pattern on consecutive slides.
2. Use 5+ different patterns across the carousel.
3. Content dictates pattern — don't force a layout that doesn't fit.
4. Suggested variety: ${patternOrder.join(', ')}`;
}

const SLIDE_STYLE_PROMPTS = {
  text: (patternOrder: string[]) => `
Each slide should have:
- type: "cover" (only for the first slide), "content", or "chart"
- title: Short, punchy header. Use <em>keyword</em> to highlight ONE key word in the accent color (not italic). Example: "Why This <em>Matters</em>"
- subtitle: (for cover only) The main hook
- slideLabel: A short 1-2 word category label for the slide. Examples: "Definition", "The Problem", "Foundation", "Pattern", "Deep Dive", "Impact", "Comparison", "Watch Out", "Framework", "What's Next", "Takeaway"
- content: (for content slides) Use the RICH HTML DESIGN PATTERNS below based on slide role.
- emoji: DO NOT include emoji. Leave this field empty or omit it entirely.
- chartType: (for chart slides only) "bar", "line", or "pie"
- chartData: (for chart slides only) Array of objects with "name" (string) and "value" (number).

CRITICAL: If the content involves statistics, data comparisons, or numeric trends, use a "chart" slide type with proper chartData.

RICH HTML DESIGN PATTERNS — USE THESE FOR content FIELD:
${TEXT_PATTERN_DEFINITIONS}

${buildSlideStructure(patternOrder)}

NEVER use plain paragraphs or raw text. ALWAYS use one of the 12 HTML patterns above.
NEVER use markdown. Only HTML.
NEVER return an empty slide. Every content slide MUST have a non-empty title AND content with a proper pattern.
EVERY pattern must be FULLY FILLED — a half-empty grid or single-card list looks broken.

CODE RULES (non-negotiable for technical content):
- NEVER reduce a code snippet to a one-liner like "const x = {...};" or "function foo() {...}". That is USELESS.
- Include at least 8-15 lines of the actual code. Show the real logic, not a stub.
- If a code snippet is too long for one slide, split it across 2 slides: Part 1 and Part 2. Use the title to indicate this (e.g. "App Shell — Routing" and "App Shell — Navigation").
- A brief 1-2 sentence explanation ABOVE the code block is good. But the code itself must be substantial and readable.
- Preserve variable names, function names, imports, and structure from the original source.
- Use <br/> for line breaks and &nbsp; for indentation inside the Pattern D code block.
`,

  visual: `
Create INFOGRAPHIC-STYLE slides that are visually structured and information-dense but easy to scan.

Each slide should have:
- type: "cover" (only for the first slide), "visual", "chart"
- title: Short, impactful header (max 5 words). Can use text effects:
  - <span style="text-transform: uppercase">TITLE</span> for impact
  - <span style="letter-spacing: 0.15em">T I T L E</span> for elegant spacing
- subtitle: (for cover only) The main hook
- icon: Choose ONE icon name from Phosphor icons: lightbulb, target, rocket, users, shield, brain, trophy, clock, star, heart, fire, globe, lightning, chart, book, leaf, gift, sun, moon, camera, phone, calendar, bell, gear, flag, key, lock, cloud, database, cpu, battery, wifi, shopping-cart, credit-card, wallet, package, truck, airplane, train, bicycle, tree, paint-brush, code, music, video, coffee, sparkle, trending-up, check-circle, activity, heartbeat, first-aid, and more
- content: (for visual slides) Provide 3-5 distinct bullet points using <ul><li> format. DO NOT wrap in <p> tags.
  - Each bullet should be EXTREMELY SHORT (max 10 words).
  - Each bullet should be a clear, standalone insight or step.
  - Keep content plain text inside <li> tags for visual slides.
  - Example: <ul><li>Make SMART Goals</li><li>Set Realistic Targets</li><li>Create an Action Plan</li></ul>
- infographicLayout: (for visual slides) Suggest the MOST FITTING layout from: "cards-grid", "timeline", "process-steps", "cycle", "icon-cards", "numbered-list", "feature-list", "pyramid", "comparison", "checklist"
  - Use "process-steps" ONLY for step-by-step how-to content (max 5 steps)
  - Use "timeline" for chronological/sequential information
  - Use "cycle" for circular/repeating processes
  - Use "icon-cards" for tips/hacks/quick points (3-6 items)
  - Use "cards-grid" for general concepts/ideas
  - Use "numbered-list" for ordered lists
  - Use "feature-list" for benefits/features (2 columns)
  - VARY the layouts across slides - don't use the same layout repeatedly
- chartType: (for chart slides with data) "bar", "line", or "pie" 
- chartData: (for chart slides) Array of objects with "name" and "value". Example: [{"name": "Revenue", "value": 50000}]

IMPORTANT TYPE SELECTION:
- Use "chart" type for: statistics, comparisons with numbers, data trends, survey results, performance metrics
- Use "visual" type for: processes, timelines, tips, features, steps, concepts, ideas

"visual" slides will be rendered as interactive INFOGRAPHICS (timelines, process steps, cycle diagrams).
"chart" slides will be rendered as professional chart images using QuickChart.io.

CRITICAL FOR VISUAL SLIDES:
- ALWAYS provide content as a clean <ul> list with <li> items
- Each <li> should contain 5-10 words maximum
- Do NOT use nested <p> tags
- Example format:
  <ul><li>Make SMART Goals</li><li>Set Realistic Targets</li><li>Create an Action Plan</li><li>Establish a Support System</li><li>Review and Adjust Regularly</li></ul>
`,

  mixed: `
Create a MIX of visual infographics and text-heavy slides for variety.

Each slide should have:
- type: "cover" (first slide only), "visual" (infographic), "content" (text-focused), or "chart"
- title: Short, punchy header. For impact, can use:
  - <span style="text-transform: uppercase">TITLE</span> for bold statements
  - <span style="letter-spacing: 0.1em">Elegant Title</span> for spaced effect
- subtitle: (for cover only) The main hook
- icon: (for "visual" type) Choose ONE Phosphor icon
- content: 
  - For "visual" type: Clean <ul><li> list with 3-5 short items (5-10 words each)
  - For "content" type: Rich formatted text using these HTML options:
    * <strong>bold</strong> - Bold emphasis (accent color)
    * <em>highlight</em> - Yellow background highlight
    * <u>underline</u> - Underlined text
    * <s>strikethrough</s> - Crossed out text
    * <sup>superscript</sup> - For x², footnotes
    * <sub>subscript</sub> - For H₂O, chemical formulas
    * <span style="font-size: 20px">larger</span> - Size variations
    * <a href="url">links</a> - Clickable links
    * <p> - Paragraphs
    * <ul><li>item</li></ul> - Bullet lists (for tips, features, benefits)
    * <ol><li>item</li></ol> - Numbered lists (for step-by-step guides, rankings)
- infographicLayout: (for visual slides) VARY the layouts - use different styles for each visual slide
- chartType/chartData: For chart slides with statistics

SLIDE PATTERN - Alternate types for variety:
- Slide 1: Cover
- Slide 2: Visual (infographic - use cards-grid or icon-cards)
- Slide 3: Content (detailed text with rich formatting)
- Slide 4: Visual (infographic - use timeline or process-steps)
- Slide 5: Content or Chart (if data available)
- Slide 6: Visual (infographic - use cycle or feature-list)
- Continue alternating with DIFFERENT infographic layouts each time

CRITICAL: Never use the same infographicLayout twice in a row. Ensure visual variety!
`
};

const CREATIVE_ANGLES = [
  'Use unexpected analogies and metaphors to explain concepts. Compare ideas to everyday life situations.',
  'Lead with contrarian takes. Challenge common assumptions before revealing the real insight.',
  'Use storytelling structure. Open with a relatable scenario, build tension, then deliver the payoff.',
  'Focus on concrete numbers and specifics. Replace vague claims with exact figures, timelines, and benchmarks.',
  'Write in a conversational, first-person tone. Use "you" and "I" to create intimacy with the reader.',
  'Structure around common mistakes. Frame each slide as a pitfall + the smarter alternative.',
  'Use the "before vs. after" framing throughout. Show the transformation for each point.',
  'Lead with questions that create curiosity gaps. Each slide title should make readers need the answer.',
  'Frame everything as insider knowledge. Use phrases like "most people don\'t know" and "the hidden truth".',
  'Use mini case studies and real-world examples. Every point should reference a specific company, person, or event.',
  'Build a progressive framework. Each slide adds one layer, so by the end the reader has a complete mental model.',
  'Use pattern interrupts — alternate between bold claims, data points, stories, and direct advice.',
];

const getSystemPrompt = (slideStyle: string, patternOrder: string[], creativeAngleIndex?: number) => {
  const idx = (typeof creativeAngleIndex === 'number' && creativeAngleIndex >= 0 && creativeAngleIndex < CREATIVE_ANGLES.length)
    ? creativeAngleIndex
    : Math.floor(Math.random() * CREATIVE_ANGLES.length);
  const angle = CREATIVE_ANGLES[idx];
  const creativeSeed = `\n\nCREATIVE DIRECTION (make this carousel unique):\n${angle}\n`;

  let prompt: string;
  if (slideStyle === 'text') {
    prompt = BASE_SYSTEM_PROMPT + creativeSeed + SLIDE_STYLE_PROMPTS.text(patternOrder);
  } else {
    const stylePrompt = SLIDE_STYLE_PROMPTS[slideStyle as keyof typeof SLIDE_STYLE_PROMPTS];
    if (typeof stylePrompt === 'function') {
      prompt = BASE_SYSTEM_PROMPT + creativeSeed + stylePrompt(patternOrder);
    } else {
      prompt = BASE_SYSTEM_PROMPT + creativeSeed + (stylePrompt || SLIDE_STYLE_PROMPTS.mixed);
    }
  }
  return { prompt, creativeAngleIndex: idx };
};

interface ContentAnalysis {
  hasCode: boolean;
  codeBlocks: string[];
  hasStats: boolean;
  stats: string[];
  hasQuotes: boolean;
  quotes: string[];
  hasList: boolean;
  hasComparison: boolean;
  sectionHeadings: string[];
  estimatedTopic: string;
  contentType: 'technical' | 'business' | 'educational' | 'opinion' | 'howto' | 'general';
}

function analyzeContent(text: string): ContentAnalysis {
  // Extract code blocks (markdown fenced + indented)
  const codeBlockRegex = /```[\w]*\n([\s\S]*?)```/g;
  const codeBlocks: string[] = [];
  let match;
  while ((match = codeBlockRegex.exec(text)) !== null) {
    codeBlocks.push(match[1].trim());
  }

  // Extract stats/numbers
  const statRegex = /(\d{1,3}(?:,\d{3})*(?:\.\d+)?)\s*(%|percent|million|billion|x faster|ms|seconds|hours|users|times)/gi;
  const stats: string[] = [];
  while ((match = statRegex.exec(text)) !== null) {
    stats.push(match[0]);
  }

  // Extract quotes
  const quoteRegex = /[""]([^""]{20,})[""]/g;
  const quotes: string[] = [];
  while ((match = quoteRegex.exec(text)) !== null) {
    quotes.push(match[1].trim());
  }

  // Extract section headings
  const headingRegex = /^#{1,3}\s+(.+)$/gm;
  const sectionHeadings: string[] = [];
  while ((match = headingRegex.exec(text)) !== null) {
    sectionHeadings.push(match[1].trim());
  }

  const hasComparison = /\bvs\.?\b|before\s*(?:\/|and|&)\s*after|compare|comparison|difference|alternative/i.test(text);
  const hasList = /^\s*[-*•]\s+/m.test(text) || /^\s*\d+\.\s+/m.test(text);

  // Determine content type
  let contentType: ContentAnalysis['contentType'] = 'general';
  if (codeBlocks.length >= 2 || /\b(API|function|import|export|const|class|interface|module|npm|webpack|docker|git)\b/i.test(text)) {
    contentType = 'technical';
  } else if (/\b(step|how to|guide|tutorial|instructions|recipe)\b/i.test(text)) {
    contentType = 'howto';
  } else if (/\b(revenue|ROI|market|growth|strategy|KPI|OKR|stakeholder|pipeline)\b/i.test(text)) {
    contentType = 'business';
  } else if (/\b(learn|teach|course|lesson|student|concept|theory|principle)\b/i.test(text)) {
    contentType = 'educational';
  } else if (/\b(I think|I believe|in my opinion|my experience|hot take)\b/i.test(text)) {
    contentType = 'opinion';
  }

  // Estimate topic from first heading or first sentence
  const estimatedTopic = sectionHeadings[0] || text.split(/[.\n]/)[0]?.trim().substring(0, 80) || 'Topic';

  return {
    hasCode: codeBlocks.length > 0,
    codeBlocks: codeBlocks.slice(0, 15),
    hasStats: stats.length > 0,
    stats: stats.slice(0, 10),
    hasQuotes: quotes.length > 0,
    quotes: quotes.slice(0, 5),
    hasList,
    hasComparison,
    sectionHeadings: sectionHeadings.slice(0, 20),
    estimatedTopic,
    contentType,
  };
}

function buildContentBrief(analysis: ContentAnalysis): string {
  const parts: string[] = [];
  parts.push(`CONTENT ANALYSIS (pre-scanned — use this to make better decisions):`);
  parts.push(`- Topic: "${analysis.estimatedTopic}"`);
  parts.push(`- Content type: ${analysis.contentType.toUpperCase()}`);

  if (analysis.sectionHeadings.length > 0) {
    parts.push(`- Sections found: ${analysis.sectionHeadings.map((h, i) => `${i + 1}. ${h}`).join(', ')}`);
  }

  if (analysis.hasCode) {
    parts.push(`- CODE BLOCKS FOUND: ${analysis.codeBlocks.length} code snippets detected. You MUST include these using Pattern D. Here are the first lines of each:`);
    analysis.codeBlocks.forEach((block, i) => {
      const preview = block.split('\n').slice(0, 3).join(' | ');
      parts.push(`  Code ${i + 1}: ${preview}`);
    });
  }

  if (analysis.hasStats) {
    parts.push(`- STATISTICS FOUND: ${analysis.stats.join(', ')}. Use Pattern F or K for these.`);
  }

  if (analysis.hasQuotes) {
    parts.push(`- QUOTES FOUND: ${analysis.quotes.length} quotes. Use Pattern L for these.`);
  }

  if (analysis.hasComparison) {
    parts.push(`- COMPARISON DETECTED: Use Pattern G (Before/After) for comparison sections.`);
  }

  if (analysis.hasList) {
    parts.push(`- LISTS DETECTED: Use Pattern B (Icon Cards) or Pattern C (Numbered List) for list sections.`);
  }

  return parts.join('\n');
}

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function replaceColorTokens(html: string, accent: string, accent2: string, muted: string, text: string): string {
  if (!html) return html;
  return html
    .replace(/\{\{ACCENT_BG\}\}/g, hexToRgba(accent, 0.06))
    .replace(/\{\{ACCENT_BORDER\}\}/g, hexToRgba(accent, 0.15))
    .replace(/\{\{ACCENT2\}\}/g, accent2)
    .replace(/\{\{ACCENT\}\}/g, accent)
    .replace(/\{\{MUTED\}\}/g, muted)
    .replace(/\{\{TEXT\}\}/g, text);
}

// Helper to strip markdown from text
function stripMarkdown(text: string): string {
  if (!text) return text;
  return text
    .replace(/^#{1,6}\s+/gm, '') // Remove markdown headers (### Header)
    .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold **text**
    .replace(/\*([^*]+)\*/g, '$1') // Remove italic *text*
    .replace(/__([^_]+)__/g, '$1') // Remove bold __text__
    .replace(/_([^_]+)_/g, '$1') // Remove italic _text_
    .replace(/~~([^~]+)~~/g, '$1') // Remove strikethrough
    .replace(/`([^`]+)`/g, '$1') // Remove inline code
    .replace(/^\s*[-*+]\s+/gm, '• ') // Convert markdown list to bullet
    .replace(/^\s*\d+\.\s+/gm, '') // Remove numbered list prefixes
    .trim();
}

const OUTLINE_PROMPT = (sections: string[]) => `
When applicable, respect the following outline extracted from the user's document. Treat each bullet as a slide candidate, but feel free to merge or expand if it improves the story:
${sections.map((section, idx) => `${idx + 1}. ${section}`).join('\n')}
`;

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!checkRateLimit(session.user.id)) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait a minute before generating again.' },
        { status: 429 }
      );
    }

    // Check AI generation limit
    const limits = await getUserPlanLimits(session.user.id);
    const usage = await trackUsage(session.user.id, 'ai_generation', 0);
    
    if (!usage.canUse) {
      return NextResponse.json(
        { 
          error: 'AI generation limit reached',
          message: `You've used all ${limits.maxAiGenerations} AI generations this month. Upgrade to Pro for unlimited AI generations.`,
          limit: limits.maxAiGenerations,
          current: usage.current
        },
        { status: 403 }
      );
    }

    // Track AI generation
    await trackUsage(session.user.id, 'ai_generation', 1);

    const { 
      text, 
      slideCount, 
      wordCount, 
      writingStyle, 
      slideStyle = 'mixed', 
      sections = [],
      language = 'en',
      tone = 'neutral',
      autoHashtags = false,
      smartColors = false,
      accessibility = false,
      includeStats = false,
      patternOrder: incomingPatternOrder,
      creativeAngle: incomingCreativeAngle,
    } = await request.json();
    const requestedSlideCount = Math.max(3, Math.min(50, Number(slideCount) || 6));
    const rawText = (text || '').trim();

    // Cap source content to ~12K chars (~3K tokens) to stay within token budgets
    // For very long articles, keep the first part (intro + key sections) and summarize
    const maxSourceChars = Math.min(12000, 2000 * requestedSlideCount);
    const combinedText = rawText.length > maxSourceChars
      ? rawText.slice(0, maxSourceChars) + '\n\n[Content truncated for processing — focus on the sections above.]'
      : rawText;

    // Analyze content to make smarter pattern and prompt decisions
    const contentAnalysis = analyzeContent(combinedText);
    const contentBrief = buildContentBrief(contentAnalysis);

    const patternOrder = generatePatternOrder(
      requestedSlideCount,
      Array.isArray(incomingPatternOrder) ? incomingPatternOrder : undefined,
      contentAnalysis.hasCode,
    );

    const styleInstruction = writingStyle ? `Writing Style: ${writingStyle}.` : '';
    const wordCountInstruction = wordCount
      ? `Target approximately ${wordCount} words per slide. Fill every HTML pattern completely.`
      : `Fill every pattern completely — 3-4 cards for Icon Cards, 3-5 items for Numbered Lists, 4 stats for Stats Grid, etc. No half-filled patterns.`;
    
    // Language instruction
    const languageNames: Record<string, string> = {
      'en': 'English', 'es': 'Spanish', 'fr': 'French', 'de': 'German', 'it': 'Italian',
      'pt': 'Portuguese', 'zh': 'Chinese', 'ja': 'Japanese', 'ko': 'Korean', 'ar': 'Arabic',
      'hi': 'Hindi', 'ru': 'Russian', 'nl': 'Dutch', 'sv': 'Swedish', 'pl': 'Polish'
    };
    const languageInstruction = language !== 'en' ? `IMPORTANT: Generate all content in ${languageNames[language] || 'the specified language'}. All text, titles, and content must be in this language.` : '';
    
    // Tone instruction
    const toneInstruction = tone !== 'neutral' ? `Tone: Write in a ${tone} tone throughout.` : '';
    
    // Additional feature instructions
    const featureInstructions = [];
    if (autoHashtags) {
      featureInstructions.push('Add relevant hashtags at the end of each slide where appropriate.');
    }
    if (includeStats) {
      featureInstructions.push('Include data, statistics, and numbers to support key points where relevant.');
    }
    if (accessibility) {
      featureInstructions.push('Ensure all text has sufficient contrast (WCAG AA compliance). Use clear, readable fonts and avoid color-only information.');
    }
    const featuresInstruction = featureInstructions.length > 0 ? featureInstructions.join(' ') : '';

    if (!combinedText) {
      return NextResponse.json({ slides: [] });
    }

    // Check for available API keys
    const availableProviders = PROVIDERS.filter(p => process.env[p.envKey]);

    if (availableProviders.length === 0) {
      return NextResponse.json({
        slides: [
          {
            type: 'cover',
            title: 'MISSING API KEY',
            subtitle: 'Please provide a GROQ_API_KEY or TOGETHER_API_KEY in your .env file.',
          },
          {
            type: 'content',
            title: 'Configuration Needed',
            content: '<p>1. Create a .env.local file</p><p>2. Add GROQ_API_KEY=your_key_here</p><p>3. Restart the server</p>',
            emoji: '⚙️'
          }
        ]
      });
    }

    const outlineHint = Array.isArray(sections) && sections.length > 0 ? OUTLINE_PROMPT(sections) : '';

    const { prompt: systemPrompt, creativeAngleIndex: usedCreativeAngle } = getSystemPrompt(
      slideStyle,
      patternOrder,
      typeof incomingCreativeAngle === 'number' ? incomingCreativeAngle : undefined
    );

    const messages = [
      { role: 'system' as const, content: systemPrompt },
        {
        role: 'user' as const,
          content: `
${contentBrief}

Create exactly ${requestedSlideCount} slides from the content below.
${styleInstruction}
${wordCountInstruction}
${languageInstruction}
${toneInstruction}
${featuresInstruction}
${outlineHint}

REMINDERS:
- Use the HTML design patterns from the system prompt. Pick the pattern that fits each slide's content.
- For lists, use the pattern HTML (Icon Cards, Numbered List, Arrow List) — NOT raw <ul>/<ol>.
${contentAnalysis.hasCode ? `- This content has ${contentAnalysis.codeBlocks.length} code snippets. Include them using Pattern D with 8-15 lines of actual code per slide. NEVER stub code as "const x = {...}".` : ''}
${contentAnalysis.hasStats ? `- Include these statistics: ${contentAnalysis.stats.slice(0, 5).join(', ')}. Use Pattern F or K.` : ''}

SOURCE CONTENT:
${combinedText}`,
        },
    ];

    // Scale max_tokens to slide count — each rich HTML slide needs ~600-800 tokens
    const outputTokens = Math.min(Math.max(requestedSlideCount * 800, 4096), 16384);

    // Try each provider with retry logic
    let completion: any = null;
    let lastError: Error | null = null;

    for (const provider of availableProviders) {
      try {
        const OpenAI = (await import('openai')).default;
        const client = new OpenAI({
          apiKey: process.env[provider.envKey],
          baseURL: provider.baseURL,
        });

        completion = await generateWithRetry(async () => {
          return client.chat.completions.create({
            model: provider.model,
            messages,
            temperature: 0.7,
            max_tokens: outputTokens,
            response_format: { type: 'json_object' },
          });
        });

        if (completion) {
          console.log(`Successfully generated with provider: ${provider.name}`);
          break;
        }
      } catch (err) {
        lastError = err as Error;
        console.error(`Provider ${provider.name} failed:`, err);
        continue;
      }
    }

    if (!completion) {
      throw lastError || new Error('All providers failed');
    }

    const content = completion.choices[0]?.message?.content || '{}';

    let jsonResult;
    try {
      jsonResult = JSON.parse(content);
    } catch {
      // Try cleaning markdown wrappers
      let cleaned = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      try {
        jsonResult = JSON.parse(cleaned);
      } catch {
        // Truncated JSON — try to salvage by finding the last complete slide
        const lastBrace = cleaned.lastIndexOf('}');
        if (lastBrace > 0) {
          cleaned = cleaned.substring(0, lastBrace + 1);
          // Close any open arrays/objects
          const openBrackets = (cleaned.match(/\[/g) || []).length - (cleaned.match(/\]/g) || []).length;
          const openBraces = (cleaned.match(/\{/g) || []).length - (cleaned.match(/\}/g) || []).length;
          cleaned += ']'.repeat(Math.max(0, openBrackets)) + '}'.repeat(Math.max(0, openBraces));
          try {
            jsonResult = JSON.parse(cleaned);
            console.log('Recovered truncated JSON — some slides may be missing');
          } catch {
            jsonResult = { slides: [] };
          }
        } else {
          jsonResult = { slides: [] };
        }
      }
    }

    const trimmedSlides = (jsonResult.slides || []).slice(0, requestedSlideCount);

    // Fetch user's brand settings for enhanced styling
    let brandSettings: any = null;
    try {
      const { initDB, getPool } = await import('@/lib/db');
      await initDB();
      const db = getPool();
      const result = await db.query(
        'SELECT brand_settings FROM user_settings WHERE user_id = $1',
        [session.user.id]
      );
      if (result.rows.length > 0) {
        brandSettings = result.rows[0].brand_settings || {};
      }
    } catch (err) {
      console.log('Could not fetch brand settings, using defaults');
    }

    // Default brand colors if not available
    const accentColor = brandSettings?.accentColor || '#ffd700';
    const backgroundColor = brandSettings?.backgroundColor || '#0B0F19';
    const textColor = brandSettings?.textColor || '#ffffff';
    const fontFamily = brandSettings?.fontFamily || 'var(--font-inter)';

    // Default icons for visual slides based on common topics
    const defaultIcons = ['lightbulb', 'target', 'rocket', 'star', 'zap', 'brain', 'trophy', 'heart', 'check-circle', 'trending-up'];
    
    // Photo filter presets for background images (professional, modern, engaging)
    const photoFilters = [
      'brightness(1.1) contrast(1.15) saturate(1.1)',
      'brightness(1.05) contrast(1.1) saturate(1.2)',
      'brightness(1.08) contrast(1.2) saturate(0.95)',
      'brightness(1.1) contrast(1.05) saturate(1.15)',
      'brightness(1.12) contrast(1.18) saturate(1.05)',
    ];

    // Text animation options
    const textAnimations = ['fadeIn', 'slideUp', 'zoomIn', 'slideRight', 'bounce'];
    
    // Box shadow presets for depth and visual appeal
    const boxShadows = [
      '0 4px 20px rgba(0, 0, 0, 0.3)',
      '0 8px 30px rgba(0, 0, 0, 0.4)',
      '0 6px 25px rgba(0, 0, 0, 0.35)',
      '0 10px 40px rgba(0, 0, 0, 0.45)',
      '0 5px 20px rgba(0, 0, 0, 0.3)',
    ];

    // Helper function to generate background image URL
    const generateBackgroundImage = async (slideTitle: string, slideContent: string, index: number): Promise<string | null> => {
      try {
        // Create a descriptive prompt for the background
        const contentText = slideContent 
          ? slideContent.replace(/<[^>]+>/g, ' ').substring(0, 100)
          : slideTitle;
        
        const themeWords = (slideTitle + ' ' + contentText)
          .replace(/[^\w\s]/g, '')
          .split(/\s+/)
          .filter((w: string) => w.length > 3)
          .slice(0, 5)
          .join(' ');
        
        const imagePrompt = `Professional abstract background for ${themeWords}, modern minimalist design, ${accentColor} accent colors, high quality, 4k, studio lighting`;
        const encodedPrompt = encodeURIComponent(imagePrompt);
        const seed = (Date.now() + index) % 10000;
        
        return `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1080&height=1080&nologo=true&model=flux&seed=${seed}`;
      } catch (err) {
        console.log('Background image generation failed:', err);
        return null;
      }
    };

    // Helper function to extract colors from image URL (client-side will do actual extraction)
    const extractColorsFromImageUrl = async (imageUrl: string): Promise<string[]> => {
      // This is a placeholder - actual extraction happens client-side
      // Returns common vibrant colors that work well with images
      return [accentColor, '#4A90E2', '#50C878', '#FF6B6B', '#FFD93D'];
    };

    // Process slides with all enhancements - automatically applying:
    // - Brand colors and fonts from user settings
    // - AI-generated background images for visual appeal
    // - Professional photo filters for depth
    // - Text animations for engagement
    // - Box shadows and borders for modern styling
    // - Text opacity and overlay effects for readability
    // - Infographic layouts for visual slides
    // - Smart color extraction from images (if enabled)
    // - Bulk apply settings (if enabled)
    const slidesWithIds = await Promise.all(trimmedSlides.map(async (slide: any, index: number) => {
      // Skip 3D icon generation for speed - use default icons instead
      // Icon generation adds significant latency per slide
      let infographicIcons: string[] = [];
      // Icons are now handled client-side or use default icon set

      // For visual slideStyle, ensure non-cover slides have type 'visual' and an icon
      let slideType = slide.type;
      let slideIcon = slide.icon;
      
      if (slideStyle === 'visual' && slide.type !== 'cover' && slide.type !== 'chart') {
        slideType = 'visual';
        if (!slideIcon) {
          slideIcon = defaultIcons[index % defaultIcons.length];
        }
      }
      
      if (slideStyle === 'mixed' && slide.type === 'visual' && !slideIcon) {
        slideIcon = defaultIcons[index % defaultIcons.length];
      }

      // Generate background image for visual appeal (skip for chart slides and first slide)
      let backgroundImage: string | null = null;
      let backgroundImageFilter: string = '';
      let extractedColors: string[] = [];
      
      // Skip background image generation by default for speed
      // Only generate if explicitly requested (smartColors enabled or visual style specifically requests it)
      // Background images add 2-5 seconds per slide, so we skip them for the "fast" experience
      if (false && slideType !== 'chart' && index !== 0 && (slideStyle === 'visual' || slideStyle === 'mixed')) {
        // Generate background for visual slides (but not the first slide)
        if (slideType === 'visual') {
          backgroundImage = await generateBackgroundImage(
            slide.title || '',
            slide.content || '',
            index
          );
          // Apply a professional filter
          backgroundImageFilter = photoFilters[index % photoFilters.length];
          
          // Extract colors from image if smartColors is enabled
          if (smartColors && backgroundImage) {
            extractedColors = await extractColorsFromImageUrl(backgroundImage!);
          }
        }
      }

      // Determine text animation based on slide type and position
      const textAnimation = slideType === 'cover' 
        ? 'zoomIn' 
        : textAnimations[index % textAnimations.length];

      // Don't apply box shadow or borders to text elements - removed for cleaner look
      const boxShadow = undefined;
      const borderRadius = undefined;

      // Set text opacity for layered effects (slightly reduced on background images)
      const textOpacity = backgroundImage ? 0.95 : 1;

      // Apply brand colors, or use extracted colors if smartColors is enabled
      let slideAccentColor = accentColor;
      let slideBackgroundColor = backgroundColor;
      const slideTextColor = textColor;
      const slideFontFamily = fontFamily;
      
      // If smart color extraction is enabled and we have extracted colors, use them
      if (smartColors && extractedColors.length > 0) {
        slideAccentColor = extractedColors[0]; // Use primary extracted color
        // Optionally adjust background based on extracted colors
        if (extractedColors.length > 1) {
          // Use a darker version of extracted color for background
          slideBackgroundColor = extractedColors[1];
        }
      }

      // Set background overlay opacity for better text readability on images
      const backgroundOverlayOpacity = backgroundImage ? 0.3 : 0;

      // Extract infographic data for visual slides
      let infographicData: any = undefined;
      if (slideType === 'visual' && slide.content) {
        // Extract items from <li> tags
        const items = slide.content.match(/<li[^>]*>([^<]+)<\/li>/gi)?.map((li: string) => 
          li.replace(/<\/?[^>]+>/g, '').trim()
        ) || [];
        
        if (items.length > 0) {
          // Map infographicLayout from AI response to our supported layouts
          const layoutMap: Record<string, string> = {
            'cards-grid': 'cards-grid',
            'timeline': 'timeline',
            'process-steps': 'process-steps',
            'cycle': 'cycle',
            'icon-cards': 'icon-cards',
            'numbered-list': 'numbered-list',
            'feature-list': 'feature-list',
            'pyramid': 'pyramid',
            'comparison': 'comparison',
            'checklist': 'checklist',
          };
          
          const infographicLayout = slide.infographicLayout || 'cards-grid';
          const mappedLayout = layoutMap[infographicLayout] || 'cards-grid';
          
          infographicData = {
            items,
            layout: mappedLayout as any,
          };
        }
      }

      return {
        ...slide,
        type: slideType,
        icon: slideIcon,
        infographicIcons,
        infographicData,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        title: stripMarkdown(slide.title || ''),
        subtitle: stripMarkdown(slide.subtitle || ''),
        content: slide.content 
          ? (() => {
              let processed = slide.content;
              
              // First, preserve existing HTML lists and tables by temporarily replacing them
              const listPlaceholders: string[] = [];
              const tablePlaceholders: string[] = [];
              
              // Store HTML lists
              processed = processed.replace(/<ul[^>]*>[\s\S]*?<\/ul>/gi, (match: string) => {
                listPlaceholders.push(match);
                return `__LIST_PLACEHOLDER_${listPlaceholders.length - 1}__`;
              });
              
              processed = processed.replace(/<ol[^>]*>[\s\S]*?<\/ol>/gi, (match: string) => {
                listPlaceholders.push(match);
                return `__LIST_PLACEHOLDER_${listPlaceholders.length - 1}__`;
              });
              
              // Store HTML tables
              processed = processed.replace(/<table[^>]*>[\s\S]*?<\/table>/gi, (match: string) => {
                tablePlaceholders.push(match);
                return `__TABLE_PLACEHOLDER_${tablePlaceholders.length - 1}__`;
              });
              
              // Now process markdown formatting
              processed = processed
                .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
                .replace(/\*([^*]+)\*/g, '<em>$1</em>')
                .replace(/^#{1,6}\s+(.+)$/gm, '<strong>$1</strong>')
                // Convert markdown lists to HTML (only if not already HTML)
                .replace(/^[-*+]\s+(.+)$/gm, '<li>$1</li>');
              
              // Wrap orphaned <li> tags in <ul>
              processed = processed.replace(/(<li>.*?<\/li>\s*)+/g, (match: string) => {
                if (!match.includes('<ul>') && !match.includes('<ol>')) {
                  return '<ul>' + match + '</ul>';
                }
                return match;
              });
              
              // Restore HTML lists
              listPlaceholders.forEach((list, index) => {
                processed = processed.replace(`__LIST_PLACEHOLDER_${index}__`, list);
              });
              
              // Restore HTML tables
              tablePlaceholders.forEach((table, index) => {
                processed = processed.replace(`__TABLE_PLACEHOLDER_${index}__`, table);
              });
              
              // Replace color tokens with the slide's actual accent colors
              const ac = slideAccentColor || '#00D4FF';
              const ac2 = slideAccentColor === '#E8FF47' ? '#FF4D6D' : '#E8FF47';
              const mt = '#9BA8C0';
              const tx = slideTextColor || '#EEF2FF';
              processed = replaceColorTokens(processed, ac, ac2, mt, tx);
              
              return processed;
            })()
          : slide.content,
        // Apply all enhanced features
        backgroundImage,
        backgroundImageFilter,
        backgroundOverlayOpacity,
        accentColor: slideAccentColor,
        backgroundColor: slideBackgroundColor,
        textColor: slideTextColor,
        fontFamily: slideFontFamily,
        textOpacity,
        boxShadow,
        borderRadius,
        textAnimation, // Store animation type for frontend to apply
        extractedColors: smartColors ? extractedColors : undefined, // Store extracted colors for reference
      };
    }));

    // Bulk apply settings to all slides if enabled
    if (smartColors || accessibility || includeStats) {
      // Apply consistent styling across all slides
      slidesWithIds.forEach((slide: any, index: number) => {
        // If bulk apply is enabled, ensure consistency
        if (index > 0 && slidesWithIds[0]) {
          const firstSlide = slidesWithIds[0];
          
          // Apply consistent colors if smartColors extracted colors from first slide
          if (smartColors && firstSlide.extractedColors && firstSlide.extractedColors.length > 0) {
            slide.accentColor = firstSlide.extractedColors[index % firstSlide.extractedColors.length] || slide.accentColor;
          }
          
          // Apply accessibility settings consistently
          if (accessibility) {
            // Ensure WCAG AA contrast (dark background with light text or vice versa)
            if (!slide.backgroundImage) {
              // For solid backgrounds, ensure good contrast
              slide.textColor = '#ffffff'; // High contrast white text
              slide.backgroundColor = slide.backgroundColor || '#0B0F19'; // Dark background
            }
            // Ensure text opacity is high for readability
            slide.textOpacity = Math.max(slide.textOpacity || 1, 0.95);
          }
        }
      });
    }

    // Post-processing: validate and clean slides
    const validatedSlides = slidesWithIds.filter((slide: any) => {
      // Remove slides with no title AND no content
      const hasTitle = slide.title && slide.title.trim().length > 0;
      const contentText = (slide.content || '').replace(/<[^>]*>/g, '').trim();
      const hasContent = contentText.length > 5;
      const isCover = slide.type === 'cover';
      return hasTitle || hasContent || isCover;
    });

    incrementAndGetMetrics().catch(console.error);

    return NextResponse.json({ slides: validatedSlides, patternOrder, creativeAngle: usedCreativeAngle });
  } catch (error) {
    console.error('AI Generation Error:', error);
    const errMsg = (error as Error)?.message || '';
    
    if (errMsg.includes('rate_limit') || errMsg.includes('429')) {
      const retryMatch = errMsg.match(/try again in ([^.]+)/i);
      const retryIn = retryMatch ? retryMatch[1] : 'a few minutes';
      return NextResponse.json(
        { error: `Rate limit reached. Please try again in ${retryIn}. Add a free GEMINI_API_KEY from ai.google.dev as a fallback.` },
        { status: 429 },
      );
    }
    
    if (errMsg.includes('json_validate_failed')) {
      return NextResponse.json(
        { error: 'The AI response was too large and got truncated. Try reducing the number of slides or shortening the source content.' },
        { status: 500 },
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to generate content. Please try again.' },
      { status: 500 },
    );
  }
}
