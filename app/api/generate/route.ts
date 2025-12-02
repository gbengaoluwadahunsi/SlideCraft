import { NextRequest, NextResponse } from 'next/server';
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
  - Keep text concise and readable.
- emoji: A relevant emoji for content slides.
- chartType: (for chart slides only) "bar", "line", or "pie"
- chartData: (for chart slides only) Array of objects with "name" (string) and "value" (number). Example: [{"name": "Q1", "value": 30}, {"name": "Q2", "value": 50}]

If the content involves statistics, data comparisons, or trends, ALWAYS use a "chart" slide type.

The design style is "Under The Hood", technical but accessible.
Focus on clarity, brevity, and value.
`;

export async function POST(request: NextRequest) {
  try {
    // Dynamic import of Groq
    const Groq = (await import('groq-sdk')).default;
    
    const { text } = await request.json();

    // Check for API Key (strictly from env)
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

    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Here is the content to convert:\n${text}` }
      ],
      model: "llama-3.3-70b-versatile", // Using the latest Llama 3.3 70B model
      temperature: 0.5,
      max_tokens: 4096,
      top_p: 1,
      stream: false,
      response_format: { type: "json_object" } // Enforce JSON mode
    });

    const content = completion.choices[0]?.message?.content || "{}";
    
    let jsonResult;
    try {
        jsonResult = JSON.parse(content);
    } catch (e) {
        // Fallback cleanup if model returns markdown
        const cleaned = content.replace(/```json/g, '').replace(/```/g, '');
        jsonResult = JSON.parse(cleaned);
    }

    // Add IDs to slides
    const slidesWithIds = (jsonResult.slides || []).map((slide: any) => ({
      ...slide,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
    }));

    // Fire and forget metric increment
    incrementAndGetMetrics().catch(console.error);

    return NextResponse.json({ slides: slidesWithIds });

  } catch (error) {
    console.error('AI Generation Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate content' },
      { status: 500 }
    );
  }
}
