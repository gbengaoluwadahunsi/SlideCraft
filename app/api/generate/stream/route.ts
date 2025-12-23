import { NextRequest } from 'next/server';
import { streamText } from 'ai';
import { createGroq } from '@ai-sdk/groq';
import { incrementAndGetMetrics } from '@/lib/metrics';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const SYSTEM_PROMPT = `
You are an expert carousel content strategist for LinkedIn, Instagram, X, newsletters, and pitch decks. 
Convert the provided text into a visually engaging carousel structure.
Return ONLY a valid JSON object with a "slides" array. Do not wrap it in markdown code blocks.
Each slide should have:
- type: "cover" (only for the first slide), "content", or "chart"
- title: Short, punchy header
- subtitle: (for cover only) The main hook
- content: (for content slides) HTML string with <p>, <ul>, <li> tags. 
  - Use <em>text</em> for HIGH IMPACT highlights (renders as yellow background).
  - Use <strong>text</strong> for bold emphasis (renders as yellow text).
  - Use <pre><code>...</code></pre> for code snippets.
  - Ensure text is informative and readable.
- emoji: A relevant emoji for content slides.
- chartType: (for chart slides only) "bar", "line", or "pie"
- chartData: (for chart slides only) Array of objects with "name" (string) and "value" (number). Example: [{"name": "Q1", "value": 30}, {"name": "Q2", "value": 50}]

If the content involves statistics, data comparisons, or trends, ALWAYS use a "chart" slide type.

The design style is "Under The Hood", technical but accessible.
Focus on clarity, high value, and depth. Avoid being too scanty.
`;

const OUTLINE_PROMPT = (sections: string[]) => `
When applicable, respect the following outline extracted from the user's document. Treat each bullet as a slide candidate, but feel free to merge or expand if it improves the story:
${sections.map((section, idx) => `${idx + 1}. ${section}`).join('\n')}
`;

export async function POST(request: NextRequest) {
  try {
    const { text, slideCount, wordCount, writingStyle, sections = [] } = await request.json();
    const requestedSlideCount = Math.max(3, Math.min(50, Number(slideCount) || 6));
    const combinedText = (text || '').trim();

    if (!combinedText) {
      return new Response(JSON.stringify({ slides: [] }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      return new Response(
        JSON.stringify({
          error: 'GROQ_API_KEY not configured',
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const groq = createGroq({ apiKey: groqApiKey });

    const styleInstruction = writingStyle ? `Writing Style: ${writingStyle}.` : '';
    const wordCountInstruction = wordCount 
      ? `STRICTLY follow the word count target: approximately ${wordCount} words per slide. Expand on points to reach this length if necessary.` 
      : `Content MUST be detailed and comprehensive. Target roughly 75-100 words per slide. Avoid short, scanty slides. Use multiple paragraphs if necessary to explain concepts fully.`;

    const outlineHint = Array.isArray(sections) && sections.length > 0 ? OUTLINE_PROMPT(sections) : '';

    const result = streamText({
      model: groq('llama-3.3-70b-versatile'),
      system: SYSTEM_PROMPT,
      prompt: `
Here is the content to convert.
Create exactly ${requestedSlideCount} slides unless the content is empty, in which case explain why no slides were generated.
${styleInstruction}
${wordCountInstruction}
${outlineHint}
${combinedText}`,
      temperature: 0.5,
      maxTokens: 4096,
    });

    // Track metrics in background
    incrementAndGetMetrics().catch(console.error);

    return result.toAIStreamResponse();
  } catch (error) {
    console.error('Streaming AI Generation Error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate content' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

