import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface ChatCompletion {
  choices: Array<{
    message: {
      content: string | null;
    };
  }>;
}

type AiProvider =
  | { name: 'gemini'; model: string; envKey: 'GOOGLE_API_KEY'; type: 'gemini' }
  | { name: 'groq'; model: string; envKey: 'GROQ_API_KEY'; baseURL: string; type: 'openai-compatible' };

const PROVIDERS = [
  { name: 'gemini', model: 'gemini-2.0-flash', envKey: 'GOOGLE_API_KEY', type: 'gemini' },
  { name: 'groq', model: 'llama-3.3-70b-versatile', envKey: 'GROQ_API_KEY', baseURL: 'https://api.groq.com/openai/v1', type: 'openai-compatible' },
] satisfies AiProvider[];

async function runProviderCompletion(
  provider: AiProvider,
  messages: Array<{ role: 'system' | 'user'; content: string }>,
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
        temperature: 0.6,
        maxOutputTokens: 2500,
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
    temperature: 0.6,
    max_tokens: 2500,
    response_format: { type: 'json_object' },
  });
}

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (entry.count >= 10) return false;
  entry.count++;
  return true;
}

function hexToRgba(hex: string, alpha: number): string {
  const h = (hex || '#000000').replace('#', '').padEnd(6, '0');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function rotateHue(hex: string, degrees: number): string {
  const h = (hex || '#000000').replace('#', '').padEnd(6, '0');
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
  const h = (backgroundColor || '#0B0F19').replace('#', '').padEnd(6, '0');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.5 ? '#9BA8C0' : '#64748b';
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

const PATTERN_DEFINITIONS = `
IMPORTANT: Use these exact color tokens in your HTML — they will be replaced with the user's theme colors:
- {{ACCENT}} = primary accent color
- {{ACCENT2}} = secondary accent (complementary color)
- {{MUTED}} = muted/body text color
- {{TEXT}} = primary text color (headings)
- {{ACCENT_BG}} = accent at 6% opacity for backgrounds
- {{ACCENT_BORDER}} = accent at 15% opacity for borders

PATTERN A: "Quote + Tip" — definitions, core concepts
<p style="border-left:3px solid {{ACCENT}};padding-left:16px;color:{{MUTED}};font-size:0.92em;line-height:1.75;">3-4 sentence explanation of the concept. Include context, why it matters, how it connects.</p><div style="background:{{ACCENT_BG}};border:1px solid {{ACCENT_BORDER}};border-radius:10px;padding:14px 18px;margin-top:16px;color:{{ACCENT}};font-size:0.85em;line-height:1.6;">💡 Concrete, actionable insight tied to the content above.</div>

PATTERN B: "Icon Cards" — problems, features, pain points (3-4 cards required)
<div style="display:flex;flex-direction:column;gap:8px;"><div style="background:rgba(0,0,0,0.25);border:1px solid rgba(255,255,255,0.05);border-radius:10px;padding:12px 16px;display:flex;align-items:flex-start;gap:12px;"><span style="font-size:1.3em;flex-shrink:0;">📦</span><div><div style="font-weight:700;color:{{TEXT}};font-size:0.92em;margin-bottom:2px;">Card Title</div><div style="font-family:monospace;font-size:0.72em;color:{{MUTED}};line-height:1.65;">1-2 sentence description for this card.</div></div></div><!-- repeat for 3-4 cards --></div>

PATTERN C: "Numbered List" — principles, rules, steps (3-5 items)
<div style="display:flex;flex-direction:column;gap:6px;"><div style="display:flex;gap:14px;align-items:flex-start;padding:4px 0;"><span style="font-family:var(--font-bebas-neue);font-size:1.6em;line-height:1;color:{{ACCENT}};flex-shrink:0;min-width:28px;">01</span><div><div style="font-weight:700;color:{{TEXT}};font-size:0.92em;">Title</div><div style="font-family:monospace;font-size:0.7em;color:{{MUTED}};line-height:1.65;margin-top:1px;">Explanation.</div></div></div><!-- repeat for each item --></div>

PATTERN F: "Stats Grid" — metrics, numbers (4 cards in 2x2)
<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;"><div style="background:rgba(0,0,0,0.25);border:1px solid rgba(255,255,255,0.05);border-radius:8px;padding:14px;"><div style="font-family:var(--font-bebas-neue);font-size:2em;line-height:1;color:{{ACCENT}};">47%</div><div style="font-family:monospace;font-size:0.65em;color:{{MUTED}};margin-top:4px;line-height:1.5;">What this number means.</div></div><!-- repeat 4 total --></div>

PATTERN G: "Before/After" — comparisons (3-4 items per column)
<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;"><div style="background:rgba(0,0,0,0.2);border-radius:8px;padding:14px;border:1px solid rgba(255,255,255,0.04);"><div style="font-family:monospace;font-size:0.65em;letter-spacing:0.15em;text-transform:uppercase;color:{{ACCENT2}};font-weight:600;margin-bottom:8px;">Before</div><div style="font-family:monospace;font-size:0.7em;color:{{MUTED}};line-height:1.8;">❌ Problem 1<br/>❌ Problem 2<br/>❌ Problem 3</div></div><div style="background:rgba(0,0,0,0.2);border-radius:8px;padding:14px;border:1px solid rgba(255,255,255,0.04);"><div style="font-family:monospace;font-size:0.65em;letter-spacing:0.15em;text-transform:uppercase;color:{{ACCENT}};font-weight:600;margin-bottom:8px;">After</div><div style="font-family:monospace;font-size:0.7em;color:{{MUTED}};line-height:1.8;">✅ Solution 1<br/>✅ Solution 2<br/>✅ Solution 3</div></div></div>

PATTERN H: "Arrow List" — checklists, do's & don'ts (4-6 items)
<div style="display:flex;flex-direction:column;gap:6px;"><div style="font-family:monospace;font-size:0.75em;color:{{MUTED}};padding-left:18px;position:relative;line-height:1.75;"><span style="position:absolute;left:0;opacity:0.5;">→</span><strong style="color:{{TEXT}};">Item</strong> — brief explanation</div><!-- repeat 4-6 items --></div>

PATTERN I: "Timeline" — phases, roadmaps (3-4 phases)
<div style="display:flex;flex-direction:column;gap:10px;"><div style="display:flex;gap:12px;align-items:flex-start;"><div style="display:flex;flex-direction:column;align-items:center;flex-shrink:0;"><div style="width:10px;height:10px;border-radius:50%;background:{{ACCENT}};"></div><div style="width:2px;height:32px;background:rgba(255,255,255,0.08);"></div></div><div><div style="font-weight:700;color:{{TEXT}};font-size:0.88em;">Phase Title</div><div style="font-family:monospace;font-size:0.7em;color:{{MUTED}};line-height:1.65;margin-top:2px;">Description.</div></div></div><!-- repeat for each phase --></div>

PATTERN J: "Highlight Box" — key takeaways, summaries
<div style="background:{{ACCENT_BG}};border:1px solid {{ACCENT_BORDER}};border-radius:12px;padding:18px 20px;"><div style="font-family:monospace;font-size:0.65em;letter-spacing:0.15em;text-transform:uppercase;color:{{ACCENT}};font-weight:600;margin-bottom:10px;">⚡ Key Takeaway</div><div style="color:{{TEXT}};font-size:0.95em;font-weight:700;line-height:1.6;margin-bottom:8px;">Main insight in one strong sentence.</div><div style="font-family:monospace;font-size:0.72em;color:{{MUTED}};line-height:1.7;">2-3 supporting sentences. Explain WHY it matters and WHAT to do about it.</div></div>

PATTERN K: "Metric Callout" — single standout number
<div style="text-align:center;padding:8px 0;"><div style="font-family:var(--font-bebas-neue);font-size:3.5em;line-height:1;color:{{ACCENT}};letter-spacing:-0.02em;">73%</div><div style="font-family:monospace;font-size:0.72em;color:{{MUTED}};margin-top:8px;line-height:1.6;">What this metric represents and why it matters.</div><div style="width:40px;height:2px;background:{{ACCENT}};margin:12px auto 0;border-radius:2px;opacity:0.5;"></div><div style="font-family:monospace;font-size:0.65em;color:{{MUTED}};margin-top:10px;opacity:0.7;">Source or context</div></div>

PATTERN L: "Quote Card" — quotes, testimonials
<div style="background:rgba(0,0,0,0.2);border-radius:12px;padding:20px;border:1px solid rgba(255,255,255,0.04);position:relative;"><div style="font-size:2em;color:{{ACCENT}};opacity:0.3;line-height:1;margin-bottom:6px;">"</div><div style="color:{{TEXT}};font-size:0.95em;font-style:italic;line-height:1.7;">The quoted text goes here. Keep it punchy and memorable.</div><div style="margin-top:12px;display:flex;align-items:center;gap:8px;"><div style="width:28px;height:2px;background:{{ACCENT}};border-radius:2px;"></div><div style="font-family:monospace;font-size:0.68em;color:{{MUTED}};">— Attribution</div></div></div>
`;

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!checkRateLimit(session.user.id)) {
    return NextResponse.json({ error: 'Too many requests. Please wait a minute.' }, { status: 429 });
  }

  try {
    const {
      slideTitle,
      slideContent,
      slideLabel,
      slideIndex,
      totalSlides,
      carouselTopic,
      pattern,
      instruction,
      slideType,
      infographicLayout,
      // Theme colors from the frontend
      accentColor,
      textColor,
      backgroundColor,
    } = await request.json();

    const isVisualSlide = slideType === 'visual';

    const availableProviders = PROVIDERS.filter(p => process.env[p.envKey]);
    if (availableProviders.length === 0) {
      return NextResponse.json({ error: 'No AI provider configured' }, { status: 500 });
    }

    const isFirst = slideIndex === 0;
    const isLast = slideIndex === totalSlides - 1;

    const refinementBlock = instruction
      ? `\nUSER REFINEMENT REQUEST: "${instruction}"\nApply this specific change to the slide while keeping it on-topic and well-formatted.`
      : '\nMake it BETTER — punchier title, richer content, better formatting with a fully-filled pattern.';

    // Keep the full current content as context (strip only for display in the prompt, not processing)
    const currentContentPreview = slideContent
      ? slideContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 600)
      : '(empty)';

    const systemPrompt = isVisualSlide
      ? `You are a carousel content expert. Your job is to regenerate a single VISUAL/INFOGRAPHIC slide.
Return ONLY valid JSON with exactly these fields: { "title", "content", "slideLabel", "infographicLayout" }.
- "content" must be a clean <ul> list: <ul><li>Short insight (5-12 words)</li><li>Another point</li></ul>
- "infographicLayout" must be one of: cards-grid, timeline, process-steps, cycle, icon-cards, numbered-list, feature-list, pyramid, comparison, checklist
- Do NOT use the HTML patterns below. Use ONLY <ul><li> format for content.
- Use <em>keyword</em> in the title to highlight ONE key word.`
      : `You are a carousel content expert. Your job is to regenerate a single slide.
Return ONLY valid JSON with exactly these fields: { "title", "content", "slideLabel" }.
Do NOT use markdown. Only HTML in the content field.
Use the HTML patterns below — pick the one that best fits the slide content.
Every pattern must be FULLY FILLED — no half-empty cards or placeholder text.
Use <em>keyword</em> in the title to highlight ONE key word.

${PATTERN_DEFINITIONS}`;

    const visualSlideInstructions = isVisualSlide ? `
IMPORTANT: This is a VISUAL/INFOGRAPHIC slide. Generate content as a clean <ul> list with <li> items.
- Each <li> should be a short, standalone insight (5-12 words max).
- Do NOT use the HTML patterns A-L. Use ONLY <ul><li>item text</li></ul> format.
- Return "infographicLayout": "${infographicLayout || 'cards-grid'}" in your JSON response.
- Example: <ul><li>First key insight here</li><li>Second key point</li><li>Third takeaway</li></ul>` : '';

    const userPrompt = `Regenerate this single slide. Return JSON: { "title", "content", "slideLabel"${isVisualSlide ? ', "infographicLayout"' : ''} }.

CONTEXT: Slide ${slideIndex + 1} of ${totalSlides} in a carousel about "${carouselTopic}".
${isFirst ? 'This is the COVER slide. Title should be a powerful 6-8 word hook. Content can be empty or a short subtitle.' : ''}
${isLast ? 'This is the CTA slide. Summarize the key insight + clear call-to-action.' : ''}

CURRENT SLIDE:
- Title: ${slideTitle || '(none)'}
- Label: ${slideLabel || '(none)'}
- Current content summary: ${currentContentPreview}

INSTRUCTIONS:
- Keep the same topic/theme.${refinementBlock}
${isVisualSlide ? visualSlideInstructions : `- Preferred pattern: ${pattern || 'Choose the most fitting pattern from A-L above'}
- Use color tokens: {{ACCENT}}, {{ACCENT2}}, {{MUTED}}, {{TEXT}}, {{ACCENT_BG}}, {{ACCENT_BORDER}}
- Do NOT use markdown. Only HTML.`}
- The content must be FULLY FILLED — no empty items or stub text.
- Return ONLY the JSON object, no code blocks or extra text.`;

    let completion: ChatCompletion | null = null;
    for (const provider of availableProviders) {
      try {
        completion = await runProviderCompletion(provider, [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ]);
        if (completion) break;
      } catch (err) {
        console.error(`Provider ${provider.name} failed for single slide:`, (err as Error).message?.substring(0, 100));
        continue;
      }
    }

    if (!completion) {
      return NextResponse.json({ error: 'All providers failed' }, { status: 500 });
    }

    const raw = completion.choices[0]?.message?.content || '{}';
    let result;
    try {
      result = JSON.parse(raw);
    } catch {
      const cleaned = raw.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      result = JSON.parse(cleaned);
    }

    let resolvedContent = result.content || slideContent;

    // For content slides only: resolve color tokens in the HTML
    if (!isVisualSlide && result.content) {
      const ac = accentColor || '#00D4FF';
      const ac2 = rotateHue(ac, 150);
      const mt = deriveMutedColor(backgroundColor || '#0B0F19');
      const tx = textColor || '#EEF2FF';
      resolvedContent = replaceColorTokens(result.content, ac, ac2, mt, tx);
    }

    return NextResponse.json({
      title: result.title || slideTitle,
      content: resolvedContent,
      slideLabel: result.slideLabel || slideLabel,
      // Return infographic layout so frontend can re-extract infographicData
      ...(isVisualSlide && { infographicLayout: result.infographicLayout || infographicLayout || 'cards-grid' }),
    });
  } catch (error) {
    console.error('Single slide generation error:', error);
    return NextResponse.json({ error: 'Failed to regenerate slide' }, { status: 500 });
  }
}
