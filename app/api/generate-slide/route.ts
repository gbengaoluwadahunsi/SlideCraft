import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PROVIDERS = [
  { name: 'groq', model: 'llama-3.3-70b-versatile', envKey: 'GROQ_API_KEY', baseURL: 'https://api.groq.com/openai/v1' },
  { name: 'openrouter', model: 'google/gemini-2.0-flash-001', envKey: 'OPENROUTER_API_KEY', baseURL: 'https://openrouter.ai/api/v1' },
];

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

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!checkRateLimit(session.user.id)) {
    return NextResponse.json({ error: 'Too many requests. Please wait a minute.' }, { status: 429 });
  }

  try {
    const { slideTitle, slideContent, slideLabel, slideIndex, totalSlides, carouselTopic, pattern, instruction } = await request.json();

    const availableProviders = PROVIDERS.filter(p => process.env[p.envKey]);
    if (availableProviders.length === 0) {
      return NextResponse.json({ error: 'No AI provider configured' }, { status: 500 });
    }

    const isFirst = slideIndex === 0;
    const isLast = slideIndex === totalSlides - 1;

    const refinementBlock = instruction
      ? `\nUSER REFINEMENT REQUEST: "${instruction}"\nApply this specific change to the slide while keeping it on-topic and well-formatted.`
      : '\nMake it BETTER — punchier title, richer content, better formatting.';

    const prompt = `You are a carousel content expert. Regenerate ONLY this single slide. Return valid JSON with exactly these fields: { "title", "content", "slideLabel" }.

CONTEXT: This is slide ${slideIndex + 1} of ${totalSlides} in a carousel about "${carouselTopic}".
${isFirst ? 'This is the COVER slide. Make the title a powerful 6-8 word hook with <em> highlight. Content can be empty.' : ''}
${isLast ? 'This is the CTA slide. Summarize the key insight + clear call-to-action.' : ''}

CURRENT SLIDE:
- Title: ${slideTitle || '(none)'}
- Label: ${slideLabel || '(none)'}
- Content: ${slideContent ? slideContent.replace(/<[^>]*>/g, ' ').substring(0, 300) : '(empty)'}

INSTRUCTIONS:
- Keep the same topic/theme.${refinementBlock}
- Use this HTML pattern for the content field: ${pattern || 'B (Icon Cards with 3-4 cards)'}
- Use these color tokens: {{ACCENT}}, {{ACCENT2}}, {{MUTED}}, {{TEXT}}, {{ACCENT_BG}}, {{ACCENT_BORDER}}
- Do NOT use markdown. Only HTML.
- The content must be FULLY FILLED — no half-empty patterns.
- Title should use <em>keyword</em> to highlight one key word.
- Return ONLY the JSON object, no code blocks.`;

    let completion: any = null;
    for (const provider of availableProviders) {
      try {
        const OpenAI = (await import('openai')).default;
        const client = new OpenAI({ apiKey: process.env[provider.envKey], baseURL: provider.baseURL });
        completion = await client.chat.completions.create({
          model: provider.model,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.5,
          max_tokens: 2048,
          response_format: { type: 'json_object' },
        });
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

    return NextResponse.json({
      title: result.title || slideTitle,
      content: result.content || slideContent,
      slideLabel: result.slideLabel || slideLabel,
    });
  } catch (error) {
    console.error('Single slide generation error:', error);
    return NextResponse.json({ error: 'Failed to regenerate slide' }, { status: 500 });
  }
}
