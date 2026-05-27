import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { incrementAndGetMetrics } from '@/lib/metrics';
import { getUserPlanLimits, trackUsage } from '@/lib/subscription';
import { checkRateLimitWithDB, initRateLimitDB } from '@/lib/rate-limit';
import { generateRequestSchema } from '@/lib/schemas';
import { initDB } from '@/lib/db';
import { SlideData } from '@/lib/types';
import { SCHEMA_DESCRIPTION, AIOutputSchema, type AISlide, type ContentBlock } from '@/lib/ai-schema';
import { renderContentBlock, applyTitleEmphasis, type ThemeTokens } from '@/lib/content-renderer';
import { routeLayouts, generateDesignSeed, type LayoutDecision } from '@/lib/layout-router';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ── Types ────────────────────────────────────────────────────────────────────

interface ChatCompletionChoice {
  message: {
    content: string | null;
  };
}

interface ChatCompletion {
  choices: ChatCompletionChoice[];
}

type AiProvider =
  | { name: 'gemini'; model: string; envKey: 'GOOGLE_API_KEY'; type: 'gemini' }
  | { name: 'groq'; model: string; envKey: 'GROQ_API_KEY'; baseURL: string; type: 'openai-compatible' };

interface BrandSettings {
  accentColor?: string;
  backgroundColor?: string;
  textColor?: string;
  fontFamily?: string;
  logoUrl?: string;
}

// ── Provider Configuration ───────────────────────────────────────────────────

const PROVIDERS = [
  { name: 'gemini', model: 'gemini-2.0-flash', envKey: 'GOOGLE_API_KEY', type: 'gemini' },
  { name: 'groq', model: 'llama-3.3-70b-versatile', envKey: 'GROQ_API_KEY', baseURL: 'https://api.groq.com/openai/v1', type: 'openai-compatible' },
] satisfies AiProvider[];

// ── Retry Logic ──────────────────────────────────────────────────────────────

interface ApiError extends Error {
  status?: number;
  statusCode?: number;
}

async function generateWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 2
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (err) {
      const error = err as ApiError;
      const msg = error?.message || '';
      const status = error.status || error.statusCode || 0;
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

async function runProviderCompletion(
  provider: AiProvider,
  messages: Array<{ role: 'system' | 'user'; content: string }>,
  outputTokens: number,
): Promise<ChatCompletion> {
  if (provider.type === 'gemini') {
    const { GoogleGenerativeAI } = await import('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env[provider.envKey] || '');
    const model = genAI.getGenerativeModel({
      model: provider.model,
      systemInstruction: messages.find(message => message.role === 'system')?.content,
    });

    const result = await model.generateContent({
      contents: messages
        .filter(message => message.role !== 'system')
        .map(message => ({
          role: 'user',
          parts: [{ text: message.content }],
        })),
      generationConfig: {
        temperature: 0.55,
        maxOutputTokens: outputTokens,
        responseMimeType: 'application/json',
      },
    });

    return {
      choices: [{ message: { content: result.response.text() } }],
    };
  }

  const OpenAI = (await import('openai')).default;
  const client = new OpenAI({
    apiKey: process.env[provider.envKey],
    baseURL: provider.baseURL,
  });

  return client.chat.completions.create({
    model: provider.model,
    messages,
    temperature: 0.45,
    max_tokens: outputTokens,
    response_format: { type: 'json_object' },
  });
}

// ── System Prompt (Schema-First — NO HTML) ───────────────────────────────────

const BASE_SYSTEM_PROMPT = `
You are an expert carousel content strategist. Your job is to turn the user's source (article, document, or link) into a clear, engaging carousel using STRUCTURED JSON.

PRIMARY GOAL:
- Read and understand the full source. The carousel must match the topic, message, and content type of the original.
- Do not add code examples unless the source itself contains code or technical implementation.
- Match the tone and depth of the source. One idea per slide; each slide must add real value.

CRITICAL RULES:
1. Return ONLY a valid JSON object with a "slides" array. No markdown, no code fences, no extra text.
2. EVERY slide must have REAL, SPECIFIC content from the source — no placeholders, no filler.
3. Fill every content block completely: icon-cards = 3-4 cards each with description, stats-grid = 3-4 stats, etc.
4. Return ONLY as many slides as you can fill with real content.
5. Do not invent precise statistics, fake customer quotes, fake testimonials, fake named people, or fake case studies. If the user gives a brief topic, use practical examples and label them as examples instead of pretending they are proven facts.

ENGAGEMENT-OPTIMIZED SLIDE SEQUENCE:

SLIDE 1 — THE HOOK (role: "hook"):
- Title: 6-8 words MAX. Benefit-driven. Create curiosity.
- Set emphasisWord to ONE power word from the title.
- Subtitle: 1 sentence expanding the hook.
- Content block: Use "paragraph" with one short supporting sentence. Keep the cover clean and scannable.
- VARY the hook style:
  1. NUMBER HOOK: "X things/ways/mistakes that outcome"
  2. QUESTION HOOK: An open question
  3. BOLD CLAIM: A contrarian statement
  4. HOW-TO PROMISE: Outcome-first
  5. STAT HOOK: A surprising number
  6. STORY HOOK: First-person, relatable

SLIDE 2 — CONTEXT (role: "context"):
- Build urgency. Use a stat, quote, or pain point.
- Best content blocks: stats-grid, metric-callout, or quote-card.

SLIDES 3 to N-2 — VALUE (role: "value"):
- ONE idea per slide. Each must teach or reveal something.
- Write at Grade 7-8 reading level. Short sentences. Conversational tone.
- VARY the content block kind every slide. Never use the same kind consecutively.
- Choose the content block that genuinely fits: lists → numbered-list, features → icon-cards, data → stats-grid, etc.

SLIDE N-1 — PROOF (role: "proof"):
- Reinforce with a highlight-box, stats recap, or key takeaway.

SLIDE N — CTA (role: "cta"):
- Summarize the key insight in one punchy sentence.
- Clear call-to-action: follow, save, share.

CONTENT DENSITY (critical):
- NEVER one-line content. Every field must be substantial.
- icon-cards: each card = title + 2-3 full sentences in description.
- numbered-list: each item = title + 2-3 sentences.
- stats-grid: each stat = value + 1-2 sentence description.
- Pull specifics from the source: numbers, names, quotes, examples.

${SCHEMA_DESCRIPTION}
`;

// ── Creative Angles ──────────────────────────────────────────────────────────

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

// ── Content Analysis ─────────────────────────────────────────────────────────

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
  const codeBlockRegex = /```[\w]*\n([\s\S]*?)```/g;
  const codeBlocks: string[] = [];
  let match;
  while ((match = codeBlockRegex.exec(text)) !== null) {
    codeBlocks.push(match[1].trim());
  }

  const statRegex = /(\d{1,3}(?:,\d{3})*(?:\.\d+)?)\s*(%|percent|million|billion|x faster|ms|seconds|hours|users|times)/gi;
  const stats: string[] = [];
  while ((match = statRegex.exec(text)) !== null) {
    stats.push(match[0]);
  }

  const quoteRegex = /["""]([^"""]{20,})["""]/g;
  const quotes: string[] = [];
  while ((match = quoteRegex.exec(text)) !== null) {
    quotes.push(match[1].trim());
  }

  const headingRegex = /^#{1,3}\s+(.+)$/gm;
  const sectionHeadings: string[] = [];
  while ((match = headingRegex.exec(text)) !== null) {
    sectionHeadings.push(match[1].trim());
  }

  const hasComparison = /\bvs\.?\b|before\s*(?:\/|and|&)\s*after|compare|comparison|difference|alternative/i.test(text);
  const hasList = /^\s*[-*•]\s+/m.test(text) || /^\s*\d+\.\s+/m.test(text);

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
  parts.push(`CONTENT ANALYSIS (pre-scanned — use this to make better content block choices):`);
  parts.push(`- Topic: "${analysis.estimatedTopic}"`);
  parts.push(`- Content type: ${analysis.contentType.toUpperCase()}`);

  if (analysis.sectionHeadings.length > 0) {
    parts.push(`- Sections found: ${analysis.sectionHeadings.map((h, i) => `${i + 1}. ${h}`).join(', ')}`);
  }

  if (analysis.hasCode) {
    parts.push(`- CODE FOUND: ${analysis.codeBlocks.length} code snippets. Use "code-block" content blocks for these.`);
    analysis.codeBlocks.slice(0, 3).forEach((block, i) => {
      const preview = block.split('\n').slice(0, 3).join(' | ');
      parts.push(`  Code ${i + 1}: ${preview}`);
    });
  } else {
    parts.push(`- NO CODE in source. Do NOT use "code-block" content blocks.`);
  }

  if (analysis.hasStats) {
    parts.push(`- STATISTICS: ${analysis.stats.join(', ')}. Use "stats-grid" or "metric-callout" for these.`);
  }

  if (analysis.hasQuotes) {
    parts.push(`- QUOTES: ${analysis.quotes.length} found. Use "quote-card" for these.`);
  }

  if (analysis.hasComparison) {
    parts.push(`- COMPARISON DETECTED: Use "before-after" content block.`);
  }

  if (analysis.hasList) {
    parts.push(`- LISTS DETECTED: Use "icon-cards" or "numbered-list" content blocks.`);
  }

  return parts.join('\n');
}

// ── Color Utilities ──────────────────────────────────────────────────────────

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function rotateHue(hex: string, degrees: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16) / 255;
  const g = parseInt(h.substring(2, 4), 16) / 255;
  const b = parseInt(h.substring(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let hDeg = 0, s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) hDeg = ((g - b) / d + (g < b ? 6 : 0)) * 60;
    else if (max === g) hDeg = ((b - r) / d + 2) * 60;
    else hDeg = ((r - g) / d + 4) * 60;
  }
  hDeg = (hDeg + degrees + 360) % 360;
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1; if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };
  let r2, g2, b2;
  if (s === 0) {
    r2 = g2 = b2 = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    const h1 = hDeg / 360;
    r2 = hue2rgb(p, q, h1 + 1/3);
    g2 = hue2rgb(p, q, h1);
    b2 = hue2rgb(p, q, h1 - 1/3);
  }
  const toHex = (x: number) => Math.round(x * 255).toString(16).padStart(2, '0');
  return `#${toHex(r2)}${toHex(g2)}${toHex(b2)}`;
}

function deriveMutedColor(backgroundColor: string): string {
  const h = backgroundColor.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.5 ? '#9BA8C0' : '#64748b';
}

function buildThemeTokens(accent: string, backgroundColor: string, textColor: string): ThemeTokens {
  return {
    accent,
    accent2: rotateHue(accent, 150),
    muted: deriveMutedColor(backgroundColor),
    text: textColor,
    accentBg: hexToRgba(accent, 0.06),
    accentBorder: hexToRgba(accent, 0.15),
  };
}

// ── Outline Prompt ───────────────────────────────────────────────────────────

const OUTLINE_PROMPT = (sections: string[]) => `
When applicable, respect the following outline extracted from the user's document. Treat each bullet as a slide candidate, but feel free to merge or expand if it improves the story:
${sections.map((section, idx) => `${idx + 1}. ${section}`).join('\n')}
`;

// ── Infographic Data Extraction ──────────────────────────────────────────────
// For 'visual' slide types, extract structured items for the Infographic component.

function extractInfographicData(
  aiSlide: AISlide,
): { items: string[]; layout: string } | undefined {
  const kind = aiSlide.content.kind;

  const layoutMap: Record<string, string> = {
    'icon-cards': 'icon-cards',
    'numbered-list': 'numbered-list',
    'timeline': 'timeline',
    'stats-grid': 'metrics-row',
    'arrow-list': 'checklist',
  };

  const layout = layoutMap[kind] || 'cards-grid';
  let items: string[] = [];

  switch (kind) {
    case 'icon-cards': {
      const block = aiSlide.content as Extract<ContentBlock, { kind: 'icon-cards' }>;
      items = block.cards.map(c => `${c.emoji} ${c.title}: ${c.description}`);
      break;
    }
    case 'numbered-list': {
      const block = aiSlide.content as Extract<ContentBlock, { kind: 'numbered-list' }>;
      items = block.items.map(item => `${item.title}: ${item.description}`);
      break;
    }
    case 'timeline': {
      const block = aiSlide.content as Extract<ContentBlock, { kind: 'timeline' }>;
      items = block.phases.map(p => `${p.title}: ${p.description}`);
      break;
    }
    case 'stats-grid': {
      const block = aiSlide.content as Extract<ContentBlock, { kind: 'stats-grid' }>;
      items = block.stats.map(s => `${s.value} — ${s.description}`);
      break;
    }
    case 'arrow-list': {
      const block = aiSlide.content as Extract<ContentBlock, { kind: 'arrow-list' }>;
      items = block.items.map(item => `${item.title}: ${item.description}`);
      break;
    }
    default:
      return undefined;
  }

  if (items.length === 0) return undefined;
  return { items: items.slice(0, 8), layout };
}

// ── Main POST Handler ────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Initialize rate limiting table
    await initRateLimitDB();
    await initDB();
    
    // Use database-backed rate limiting with memory fallback
    const rateLimitResult = await checkRateLimitWithDB(session.user.id);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { 
          error: 'Too many requests', 
          message: 'Please wait a minute before generating again.',
          retryAfter: Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000)
        },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000)) } }
      );
    }

    // Validate request body with Zod
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }

    const normalizedBody = body && typeof body === 'object' && !Array.isArray(body)
      ? {
          ...(body as Record<string, unknown>),
          text: (body as Record<string, unknown>).text ?? (body as Record<string, unknown>).prompt,
          slideCount: (body as Record<string, unknown>).slideCount ?? (body as Record<string, unknown>).numSlides,
        }
      : body;

    const validationResult = generateRequestSchema.safeParse(normalizedBody);
    if (!validationResult.success) {
      const errorDetails = validationResult.error.issues.map((err) => ({
        path: err.path.join('.'),
        message: err.message,
      }));
      return NextResponse.json(
        { error: 'Validation failed', details: errorDetails },
        { status: 400 }
      );
    }
    
    // Use validated data (fixes double request.json() bug)
    const validated = validationResult.data;
    const { 
      text, 
      slideCount, 
      wordCount, 
      platformTarget = 'Auto',
      outputPreset = 'General Carousel',
      writingStyle, 
      slideStyle = 'mixed', 
      sections = [],
      language = 'en',
      tone = 'neutral',
      autoHashtags = false,
      smartColors = false,
      accessibility = false,
      includeStats = false,
      creativeAngle: incomingCreativeAngle,
      accentColor: requestAccentColor,
      textColor: requestTextColor,
      backgroundColor: requestBackgroundColor,
      audience = '',
      goal = '',
    } = validated;

    const requestedSlideCount = Math.max(3, Math.min(100, Number(slideCount) || 6));
    const rawText = (text || '').trim();

    // Cap source content to ~12K chars (~3K tokens)
    const maxSourceChars = Math.min(12000, 2000 * requestedSlideCount);
    const combinedText = rawText.length > maxSourceChars
      ? rawText.slice(0, maxSourceChars) + '\n\n[Content truncated for processing — focus on the sections above.]'
      : rawText;

    // Detect thin-content inputs
    const inputWordCount = combinedText.split(/\s+/).filter((w: string) => w.length > 0).length;
    const isThinContent = inputWordCount < 120;
    const thinContentInstruction = isThinContent
      ? `IMPORTANT: The user provided a brief topic prompt (${inputWordCount} words). Treat this as a TOPIC SEED and generate a full, authoritative, information-dense carousel using your own knowledge. Add real statistics, expert insights, and concrete examples.`
      : '';

    // Analyze content for smarter AI guidance
    const contentAnalysis = analyzeContent(combinedText);
    const contentBrief = buildContentBrief(contentAnalysis);

    // Pick creative angle
    const creativeAngleIndex = (typeof incomingCreativeAngle === 'number' && incomingCreativeAngle >= 0 && incomingCreativeAngle < CREATIVE_ANGLES.length)
      ? incomingCreativeAngle
      : Math.floor(Math.random() * CREATIVE_ANGLES.length);
    const creativeAngle = CREATIVE_ANGLES[creativeAngleIndex];
    const creativeSeed = `\n\nCREATIVE DIRECTION (make this carousel unique):\n${creativeAngle}\n`;

    // Build instructions
    const styleInstruction = writingStyle ? `Writing Style: ${writingStyle}.` : '';
    const platformInstructions: Record<string, string> = {
      Auto: 'Platform: General carousel. Make it useful across LinkedIn, Instagram, and PDF sharing.',
      LinkedIn: 'Platform: LinkedIn. Use professional framing, stronger hooks, specific insights, and credible takeaways. Avoid slang-heavy captions.',
      Instagram: 'Platform: Instagram. Use shorter punchier slides, simple language, save-worthy tips, and visual rhythm. Keep each slide easy to scan on mobile.',
      'Sales Deck': 'Platform: Sales deck. Focus on pain, solution, proof, objections, benefits, and a clear CTA. Make each slide useful in a sales conversation.',
      Education: 'Platform: Education. Teach step-by-step with definitions, examples, recap slides, and beginner-friendly explanations.',
    };
    const presetInstructions: Record<string, string> = {
      'General Carousel': 'Preset: General Carousel. Prioritize clarity, practical value, and broad audience fit.',
      'Authority LinkedIn': 'Preset: Authority LinkedIn. Produce thought-leadership content with a strong point of view, comparison slides, metric/proof slides, checklists, and a memorable final takeaway.',
      Educational: 'Preset: Educational. Teach the topic clearly with examples, frameworks, and practical application.',
      Sales: 'Preset: Sales. Make the value proposition clear, persuasive, and action-oriented without sounding spammy.',
      'Founder LinkedIn': 'Preset: Founder LinkedIn. Use founder/operator language, lessons learned, sharp opinions, and business context.',
      'Tips/Listicle': 'Preset: Tips/Listicle. Create save-worthy practical tips with clear numbering and direct language.',
    };
    const targetInstruction = `${platformInstructions[platformTarget] || platformInstructions.Auto}\n${presetInstructions[outputPreset] || presetInstructions['General Carousel']}`;
    const wordCountInstruction = wordCount
      ? `Target approximately ${wordCount} words per slide.`
      : `Aim for dense content: at least 40-60 words per content slide.`;
    
    const languageNames: Record<string, string> = {
      'en': 'English', 'es': 'Spanish', 'fr': 'French', 'de': 'German', 'it': 'Italian',
      'pt': 'Portuguese', 'zh': 'Chinese', 'ja': 'Japanese', 'ko': 'Korean', 'ar': 'Arabic',
      'hi': 'Hindi', 'ru': 'Russian', 'nl': 'Dutch', 'sv': 'Swedish', 'pl': 'Polish'
    };
    const languageInstruction = language !== 'en' ? `IMPORTANT: Generate all content in ${languageNames[language] || 'the specified language'}.` : '';
    const toneInstruction = tone !== 'neutral' ? `Tone: Write in a ${tone} tone throughout.` : '';
    
    const featureInstructions = [];
    if (autoHashtags) featureInstructions.push('Add relevant hashtags at the end of descriptions where appropriate.');
    if (includeStats) featureInstructions.push('Include data, statistics, and numbers to support key points.');
    if (accessibility) featureInstructions.push('Use clear, simple language. Ensure all content is easy to understand.');
    const featuresInstruction = featureInstructions.join(' ');

    if (!combinedText) {
      return NextResponse.json({ slides: [] });
    }

    // Check AI generation limit after request validation so bad payloads do not consume quota.
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

    // Check for available API keys
    const availableProviders = PROVIDERS.filter(p => process.env[p.envKey]);
    if (availableProviders.length === 0) {
      return NextResponse.json({
        slides: [
          { type: 'cover', title: 'MISSING API KEY', subtitle: 'Add GOOGLE_API_KEY or GROQ_API_KEY to .env.' },
          { type: 'content', title: 'Configuration Needed', content: '<p>1. Open your .env file</p><p>2. Add GOOGLE_API_KEY for Gemini</p><p>3. Optionally add GROQ_API_KEY as fallback</p><p>4. Restart the server</p>', emoji: '⚙️' }
        ]
      });
    }

    const outlineHint = Array.isArray(sections) && sections.length > 0 ? OUTLINE_PROMPT(sections) : '';
    const audienceGoal = [audience, goal].filter(Boolean).join('. ');
    const contextInstruction = audienceGoal
      ? `CONTEXT (tailor depth, examples, and tone): Audience / use case — ${audienceGoal}.`
      : '';

    // Build the system prompt — lean and schema-focused
    const systemPrompt = BASE_SYSTEM_PROMPT + creativeSeed + (
      contentAnalysis.hasCode
        ? `\nCODE RULES: The source contains ${contentAnalysis.codeBlocks.length} code snippets. Use "code-block" content blocks to present actual code. Include 8-15 lines of real code per block.\n`
        : `\nDo NOT use "code-block" content blocks. The source has no code.\n`
    );

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      {
        role: 'user' as const,
        content: `
${contentBrief}
${thinContentInstruction ? `\n${thinContentInstruction}\n` : ''}
${contextInstruction ? `\n${contextInstruction}\n` : ''}
Create exactly ${requestedSlideCount} slides from the content below.
${targetInstruction}
${styleInstruction}
${wordCountInstruction}
${languageInstruction}
${toneInstruction}
${featuresInstruction}
${outlineHint}

DEPTH REQUIREMENT (critical):
- Every slide must feel substantial. Fill every content block completely.
- If a slide would be thin, expand it using the source before moving on.
- Make the carousel platform-ready: clear hook, logical slide-to-slide flow, useful examples, and a final CTA or takeaway.
- Prefer concrete claims, numbers, examples, and named steps over generic advice.
- Only use numbers, quotes, names, and case-study details when they come from the source or are widely known. Otherwise use non-fabricated practical examples.
- Do not write vague filler like "unlock your potential", "game changer", or "revolutionize" unless the source requires it.

REMINDERS:
- Return ONLY valid JSON matching the schema. No HTML, no markdown.
- Deliver exactly ${requestedSlideCount} slides with structured content blocks.
- NEVER use the same content block kind on consecutive slides.
${contentAnalysis.hasCode ? `- Include code snippets using "code-block" kind with 8-15 lines of actual code.` : '- The source has NO code. Do NOT use "code-block" kind.'}
${contentAnalysis.hasStats ? `- Include these stats: ${contentAnalysis.stats.slice(0, 5).join(', ')}. Use "stats-grid" or "metric-callout".` : ''}

SOURCE CONTENT:
${combinedText}`,
      },
    ];

    // Token budget
    const outputTokens = Math.min(Math.max(requestedSlideCount * 1200, 6000), 32768);

    // ── Call AI Providers ──────────────────────────────────────────────────
    let completion: ChatCompletion | null = null;
    let lastError: Error | null = null;
    let providerUsed: AiProvider['name'] | null = null;
    let fallbackUsed = false;

    for (const provider of availableProviders) {
      try {
        completion = await generateWithRetry(async () => {
          return runProviderCompletion(provider, messages, outputTokens);
        });

        if (completion) {
          providerUsed = provider.name;
          fallbackUsed = availableProviders[0]?.name !== provider.name;
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

    // ── Parse AI Response ─────────────────────────────────────────────────
    const content = completion.choices[0]?.message?.content || '{}';

    let jsonResult: unknown;
    try {
      jsonResult = JSON.parse(content);
    } catch {
      let cleaned = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      try {
        jsonResult = JSON.parse(cleaned);
      } catch {
        // Truncated JSON — try to salvage
        const lastBrace = cleaned.lastIndexOf('}');
        if (lastBrace > 0) {
          cleaned = cleaned.substring(0, lastBrace + 1);
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

    // ── Validate Against Schema ───────────────────────────────────────────
    const parseResult = AIOutputSchema.safeParse(jsonResult);
    let aiSlides: AISlide[];

    if (parseResult.success) {
      aiSlides = parseResult.data.slides.slice(0, requestedSlideCount);
      console.log(`Schema validation passed: ${aiSlides.length} slides`);
    } else {
      // Graceful fallback: try to extract slides even if schema doesn't fully match
      console.warn('Schema validation failed, attempting graceful extraction:', parseResult.error.issues.slice(0, 5));
      const raw = jsonResult as Record<string, unknown>;
      const rawSlides = Array.isArray(raw?.slides) ? raw.slides : [];
      aiSlides = rawSlides.slice(0, requestedSlideCount).map((slide: Record<string, unknown>) => {
        // Best-effort mapping for slides that don't fully conform
        return {
          role: (slide.role as AISlide['role']) || 'value',
          title: String(slide.title || 'Untitled'),
          emphasisWord: slide.emphasisWord as string | undefined,
          subtitle: slide.subtitle as string | undefined,
          slideLabel: slide.slideLabel as string | undefined,
          icon: slide.icon as string | undefined,
          content: (slide.content && typeof slide.content === 'object' && 'kind' in (slide.content as Record<string, unknown>))
            ? slide.content as ContentBlock
            : { kind: 'paragraph' as const, text: String(slide.content || slide.title || '') },
        } as AISlide;
      }).filter((s: AISlide) => s.title && s.title !== 'Untitled');
    }

    if (aiSlides.length === 0) {
      return NextResponse.json({ slides: [] });
    }

    // ── Fetch Brand Settings ──────────────────────────────────────────────
    let brandSettings: BrandSettings | null = null;
    try {
      const { getPool } = await import('@/lib/db');
      const db = getPool();
      const result = await db.query(
        'SELECT brand_settings FROM user_settings WHERE user_id = $1',
        [session.user.id]
      );
      if (result.rows.length > 0) {
        brandSettings = result.rows[0].brand_settings || {};
      }
    } catch {
      console.log('Could not fetch brand settings, using defaults');
    }

    const accentColor = requestAccentColor || brandSettings?.accentColor || '#ffd700';
    const backgroundColor = requestBackgroundColor || brandSettings?.backgroundColor || '#0B0F19';
    const textColor = requestTextColor || brandSettings?.textColor || '#ffffff';
    const fontFamily = brandSettings?.fontFamily || 'var(--font-inter)';

    // ── Build Theme Tokens ────────────────────────────────────────────────
    const tokens = buildThemeTokens(accentColor, backgroundColor, textColor);

    // ── Route Layouts ─────────────────────────────────────────────────────
    // Each user/project gets a different design seed → different visual variants
    const designSeed = generateDesignSeed(session.user.id);
    const layoutDecisions = routeLayouts(aiSlides, designSeed, slideStyle as 'text' | 'visual' | 'mixed');

    // ── Render Slides ─────────────────────────────────────────────────────
    const defaultIcons = ['lightbulb', 'target', 'rocket', 'star', 'zap', 'brain', 'trophy', 'heart', 'check-circle', 'trending-up'];
    const textAnimations = ['fadeIn', 'slideUp', 'zoomIn', 'slideRight', 'bounce'];

    const slidesWithIds: Partial<SlideData>[] = aiSlides.map((aiSlide, index) => {
      const decision: LayoutDecision = layoutDecisions[index] || { variant: 0, slideType: 'content', useInfographic: false };

      // Render structured content → HTML
      const renderedContent = renderContentBlock(aiSlide.content, tokens, decision.variant);

      // Apply title emphasis
      const processedTitle = applyTitleEmphasis(aiSlide.title, aiSlide.emphasisWord);

      // Determine slide type
      const slideType = decision.slideType;

      // Icon for visual slides
      let slideIcon = aiSlide.icon;
      if (slideType === 'visual' && !slideIcon) {
        slideIcon = defaultIcons[index % defaultIcons.length];
      }

      // Infographic data for visual slides
      let infographicData: Partial<SlideData>['infographicData'] = undefined;
      if (decision.useInfographic) {
        const extracted = extractInfographicData(aiSlide);
        if (extracted) {
          infographicData = {
            items: extracted.items,
            layout: extracted.layout as 'cards-grid' | 'timeline' | 'process-steps',
          };
        }
      }

      // Text animation
      const textAnimation = slideType === 'cover'
        ? 'zoomIn'
        : textAnimations[index % textAnimations.length];

      return {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        type: slideType,
        title: processedTitle,
        subtitle: aiSlide.subtitle || '',
        content: renderedContent,
        icon: slideIcon,
        infographicData,
        slideLabel: aiSlide.slideLabel,
        accentColor,
        backgroundColor,
        textColor,
        fontFamily,
        fontScale: slideType === 'cover' ? 0.95 : 0.86,
        textAnimation,
        mediaType: null,
        mediaAspectRatio: 16 / 9,
        mediaWidthPercent: 100,
        mediaAlignment: 'center' as const,
        elementOrder: ['title', 'content', 'media'],
        customBlocks: [],
        slidePadding: slideType === 'cover' ? 88 : 96,
        slideJustify: slideType === 'cover' ? 'center' : 'center',
        textOpacity: 1,
      };
    });

    // ── Accessibility Pass ────────────────────────────────────────────────
    if (accessibility) {
      slidesWithIds.forEach((slide) => {
        if (!slide.backgroundImage) {
          slide.textColor = '#ffffff';
          slide.backgroundColor = slide.backgroundColor || '#0B0F19';
        }
        slide.textOpacity = Math.max(slide.textOpacity || 1, 0.95);
      });
    }

    // ── Validate: Drop empty slides ───────────────────────────────────────
    const validatedSlides = slidesWithIds.filter((slide) => {
      const titleText = (slide.title || '').replace(/<[^>]*>/g, '').trim();
      const contentText = (slide.content || '').replace(/<[^>]*>/g, '').trim();
      const hasTitle = titleText.length > 0;
      const hasContent = contentText.length > 15;
      const isCover = slide.type === 'cover';
      if (isCover) return hasTitle;
      return hasTitle && hasContent;
    });

    await trackUsage(session.user.id, 'ai_generation', 1);
    incrementAndGetMetrics().catch(console.error);

    return NextResponse.json({
      slides: validatedSlides,
      creativeAngle: creativeAngleIndex,
      providerUsed,
      fallbackUsed,
    });
  } catch (error) {
    console.error('AI Generation Error:', error);
    const errMsg = (error as Error)?.message || '';
    
    if (errMsg.includes('rate_limit') || errMsg.includes('429')) {
      const retryMatch = errMsg.match(/try again in ([^.]+)/i);
      const retryIn = retryMatch ? retryMatch[1] : 'a few minutes';
      return NextResponse.json(
        { error: `Rate limit reached. Please try again in ${retryIn}. Add GROQ_API_KEY as a fallback if Gemini is rate limited.` },
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
