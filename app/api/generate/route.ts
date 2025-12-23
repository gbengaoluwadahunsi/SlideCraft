import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { incrementAndGetMetrics } from '@/lib/metrics';
import { getUserPlanLimits, trackUsage } from '@/lib/subscription';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SYSTEM_PROMPT = `
You are an expert carousel content strategist for LinkedIn, Instagram, X, newsletters, and pitch decks. 
Convert the provided text into a visually engaging carousel structure.
Return ONLY a valid JSON object with a "slides" array. Do not wrap it in markdown code blocks.

IMPORTANT: Do NOT use markdown syntax in your output. No asterisks (**), no hashtags (###), no underscores for formatting.

Each slide should have:
- type: "cover" (only for the first slide), "content", or "chart"
- title: Short, punchy header (plain text, no markdown)
- subtitle: (for cover only) The main hook (plain text, no markdown)
- content: (for content slides) HTML string with <p>, <ul>, <li> tags. 
  - Use <em>text</em> for HIGH IMPACT highlights (renders as yellow background).
  - Use <strong>text</strong> for bold emphasis (renders as yellow text).
  - Use <pre><code>...</code></pre> for code snippets.
  - Ensure text is informative and readable.
  - NEVER use markdown like ** or ### - use HTML tags instead.
- emoji: A relevant emoji for content slides.
- chartType: (for chart slides only) "bar", "line", or "pie"
- chartData: (for chart slides only) Array of objects with "name" (string) and "value" (number). Example: [{"name": "Q1", "value": 30}, {"name": "Q2", "value": 50}]

If the content involves statistics, data comparisons, or trends, ALWAYS use a "chart" slide type.

The design style is "Under The Hood", technical but accessible.
Focus on clarity, high value, and depth. Avoid being too scanty.
`;

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

    const Groq = (await import('groq-sdk')).default;

    const { text, slideCount, wordCount, writingStyle, sections = [] } = await request.json();
    const requestedSlideCount = Math.max(3, Math.min(50, Number(slideCount) || 6));
    const combinedText = (text || '').trim();

    const styleInstruction = writingStyle ? `Writing Style: ${writingStyle}.` : '';
    const wordCountInstruction = wordCount 
      ? `STRICTLY follow the word count target: approximately ${wordCount} words per slide. Expand on points to reach this length if necessary.` 
      : `Content MUST be detailed and comprehensive. Target roughly 75-100 words per slide. Avoid short, scanty slides. Use multiple paragraphs if necessary to explain concepts fully.`;

    if (!combinedText) {
      return NextResponse.json({ slides: [] });
    }

    const groqApiKey = process.env.GROQ_API_KEY;

    if (!groqApiKey) {
      return NextResponse.json({
        slides: [
          {
            type: 'cover',
            title: 'MISSING API KEY',
            subtitle: 'Please provide a GROQ_API_KEY in your .env file.',
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

    const groq = new Groq({ apiKey: groqApiKey });

    const outlineHint = Array.isArray(sections) && sections.length > 0 ? OUTLINE_PROMPT(sections) : '';

    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `
Here is the content to convert.
Create exactly ${requestedSlideCount} slides unless the content is empty, in which case explain why no slides were generated.
${styleInstruction}
${wordCountInstruction}
${outlineHint}
${combinedText}`,
        },
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.5,
      max_tokens: 4096,
      top_p: 1,
      stream: false,
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0]?.message?.content || '{}';

    let jsonResult;
    try {
      jsonResult = JSON.parse(content);
    } catch (e) {
      const cleaned = content.replace(/```json/g, '').replace(/```/g, '');
      jsonResult = JSON.parse(cleaned);
    }

    const trimmedSlides = (jsonResult.slides || []).slice(0, requestedSlideCount);

    // Clean markdown from all text fields
    const slidesWithIds = trimmedSlides.map((slide: any) => ({
      ...slide,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      title: stripMarkdown(slide.title || ''),
      subtitle: stripMarkdown(slide.subtitle || ''),
      content: slide.content 
        ? slide.content
            .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>') // Convert **text** to <strong>
            .replace(/\*([^*]+)\*/g, '<em>$1</em>') // Convert *text* to <em>
            .replace(/^#{1,6}\s+(.+)$/gm, '<strong>$1</strong>') // Convert ### headers to bold
        : slide.content,
    }));

    incrementAndGetMetrics().catch(console.error);

    return NextResponse.json({ slides: slidesWithIds });
  } catch (error) {
    console.error('AI Generation Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate content' },
      { status: 500 },
    );
  }
}
