import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { incrementAndGetMetrics } from '@/lib/metrics';
import { getUserPlanLimits, trackUsage } from '@/lib/subscription';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Provider configuration with fallback
const PROVIDERS = [
  { name: 'groq', model: 'llama-3.3-70b-versatile', envKey: 'GROQ_API_KEY' },
  { name: 'together', model: 'meta-llama/Llama-3.3-70B-Instruct-Turbo', envKey: 'TOGETHER_API_KEY' },
];

// Retry logic with exponential backoff
async function generateWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (err) {
      console.error(`Attempt ${i + 1} failed:`, err);
      if (i === maxRetries - 1) throw err;
      // Exponential backoff: 1s, 2s, 3s
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
  throw new Error('Max retries exceeded');
}

const BASE_SYSTEM_PROMPT = `
You are an expert carousel content strategist for LinkedIn, Instagram, X, newsletters, and pitch decks. 
Convert the provided text into a visually engaging carousel structure.
Return ONLY a valid JSON object with a "slides" array. Do not wrap it in markdown code blocks.

IMPORTANT: Do NOT use markdown syntax in your output. No asterisks (**), no hashtags (###), no underscores for formatting.
`;

const SLIDE_STYLE_PROMPTS = {
  text: `
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
- emoji: DO NOT include emoji. Leave this field empty or omit it entirely.
- chartType: (for chart slides only) "bar", "line", or "pie"
- chartData: (for chart slides only) Array of objects with "name" (string) and "value" (number).

If the content involves statistics, data comparisons, or trends, ALWAYS use a "chart" slide type.

The design style is "Under The Hood", technical but accessible.
Focus on clarity, high value, and depth. Provide comprehensive explanations.
`,

  visual: `
Create VISUAL-FIRST slides designed for executives who prefer diagrams over text.

Each slide should have:
- type: "cover" (only for the first slide), "visual", or "chart"
- title: Short, impactful header (max 5 words)
- subtitle: (for cover only) The main hook
- icon: Choose ONE icon name that represents the slide concept. Pick from: lightbulb, target, rocket, chart-line, users, shield, zap, brain, puzzle, trophy, clock, check-circle, trending-up, layers, git-branch, search, lock, globe, star, heart, flag, compass, anchor, award, battery, bell, bookmark, briefcase, calendar, camera, cloud, code, coffee, cpu, credit-card, database, download, droplet, edit, eye, file, filter, folder, gift, grid, hash, headphones, home, image, inbox, key, layout, link, list, mail, map, maximize, mic, monitor, moon, music, package, paperclip, pause, percent, phone, play, plus, power, printer, radio, refresh, repeat, scissors, send, server, settings, share, shopping-cart, sidebar, sliders, smartphone, speaker, sun, tag, thermometer, thumbs-up, toggle, tool, trash, truck, tv, umbrella, upload, user, video, voicemail, volume, watch, wifi, wind, x-circle, zoom
- content: (for visual slides) Keep it SHORT - maximum 3 bullet points, each under 10 words. Use <ul><li> format.
  - Think "one key insight per slide"
  - Use <strong>text</strong> ONLY for the most critical word in each point
  - NO paragraphs, NO lengthy explanations
- chartType: (for chart slides) "bar", "line", or "pie" 
- chartData: (for chart slides) Array of objects with "name" and "value"

CRITICAL: Visual slides are NOT text-heavy. Each slide communicates ONE powerful idea with:
1. A clear icon representing the concept
2. A punchy title (2-5 words)
3. 2-3 ultra-short bullet points (keywords/phrases, not sentences)

Think like a pitch deck designer - executives should grasp each slide in 3 seconds.
`,

  mixed: `
Create a MIX of visual and text-heavy slides for variety.

Each slide should have:
- type: "cover" (first slide only), "visual" (icon-focused), "content" (text-focused), or "chart"
- title: Short, punchy header (plain text)
- subtitle: (for cover only) The main hook
- icon: (for "visual" type only) Choose ONE icon from: lightbulb, target, rocket, chart-line, users, shield, zap, brain, puzzle, trophy, clock, check-circle, trending-up, layers, git-branch, search, lock, globe, star, heart, flag, compass, anchor, award, briefcase, calendar, cloud, code, cpu, database, download, edit, eye, file, folder, gift, grid, key, layout, link, list, mail, map, maximize, monitor, package, play, plus, power, refresh, settings, share, sliders, sun, tag, thumbs-up, tool, upload, user, video, wifi
- content: HTML string
  - For "visual" type: Maximum 3 SHORT bullet points (under 10 words each) using <ul><li>
  - For "content" type: Detailed paragraphs using <p>, <ul>, <li> with <em> and <strong> for emphasis
- chartType/chartData: For chart slides with statistics

SLIDE PATTERN: Alternate between visual and content slides:
- Slide 1: Cover
- Slide 2: Visual (icon + bullets)
- Slide 3: Content (detailed explanation)
- Slide 4: Visual or Chart
- Slide 5: Content
- ... continue alternating

This creates rhythm - quick visual slides for key points, detailed content slides for depth.
`
};

const getSystemPrompt = (slideStyle: string) => {
  const stylePrompt = SLIDE_STYLE_PROMPTS[slideStyle as keyof typeof SLIDE_STYLE_PROMPTS] || SLIDE_STYLE_PROMPTS.mixed;
  return BASE_SYSTEM_PROMPT + stylePrompt;
};

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

    const { text, slideCount, wordCount, writingStyle, slideStyle = 'mixed', sections = [] } = await request.json();
    const requestedSlideCount = Math.max(3, Math.min(50, Number(slideCount) || 6));
    const combinedText = (text || '').trim();

    const styleInstruction = writingStyle ? `Writing Style: ${writingStyle}.` : '';
    const wordCountInstruction = wordCount 
      ? `STRICTLY follow the word count target: approximately ${wordCount} words per slide. Expand on points to reach this length if necessary.` 
      : `Content MUST be detailed and comprehensive. Target roughly 75-100 words per slide. Avoid short, scanty slides. Use multiple paragraphs if necessary to explain concepts fully.`;

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

    const messages = [
      { role: 'system' as const, content: getSystemPrompt(slideStyle) },
        {
        role: 'user' as const,
          content: `
Here is the content to convert.
Create exactly ${requestedSlideCount} slides unless the content is empty, in which case explain why no slides were generated.
${styleInstruction}
${wordCountInstruction}
${outlineHint}
${combinedText}`,
        },
    ];

    // Try each provider with retry logic
    let completion: any = null;
    let lastError: Error | null = null;

    for (const provider of availableProviders) {
      try {
        if (provider.name === 'groq') {
          const Groq = (await import('groq-sdk')).default;
          const groq = new Groq({ apiKey: process.env[provider.envKey] });
          
          completion = await generateWithRetry(async () => {
            return groq.chat.completions.create({
              messages,
              model: provider.model,
              temperature: 0.3,
              max_tokens: 4096,
              top_p: 1,
              stream: false,
              response_format: { type: 'json_object' },
            });
          });
        } else if (provider.name === 'together') {
          // Together AI uses OpenAI-compatible API
          const OpenAI = (await import('openai')).default;
          const together = new OpenAI({
            apiKey: process.env[provider.envKey],
            baseURL: 'https://api.together.xyz/v1',
          });
          
          completion = await generateWithRetry(async () => {
            return together.chat.completions.create({
              messages,
              model: provider.model,
              temperature: 0.3,
      max_tokens: 4096,
      top_p: 1,
      stream: false,
      response_format: { type: 'json_object' },
    });
          });
        }
        
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
    } catch (e) {
      const cleaned = content.replace(/```json/g, '').replace(/```/g, '');
      jsonResult = JSON.parse(cleaned);
    }

    const trimmedSlides = (jsonResult.slides || []).slice(0, requestedSlideCount);

    // Default icons for visual slides based on common topics
    const defaultIcons = ['lightbulb', 'target', 'rocket', 'star', 'zap', 'brain', 'trophy', 'heart', 'check-circle', 'trending-up'];
    
    // Clean markdown from all text fields
    const slidesWithIds = trimmedSlides.map((slide: any, index: number) => {
      // For visual slideStyle, ensure non-cover slides have type 'visual' and an icon
      let slideType = slide.type;
      let slideIcon = slide.icon;
      
      if (slideStyle === 'visual' && slide.type !== 'cover' && slide.type !== 'chart') {
        slideType = 'visual';
        // Assign a default icon if none provided
        if (!slideIcon) {
          slideIcon = defaultIcons[index % defaultIcons.length];
        }
      }
      
      // For mixed style, ensure visual slides have icons
      if (slideStyle === 'mixed' && slide.type === 'visual' && !slideIcon) {
        slideIcon = defaultIcons[index % defaultIcons.length];
      }
      
      return {
        ...slide,
        type: slideType,
        icon: slideIcon,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        title: stripMarkdown(slide.title || ''),
        subtitle: stripMarkdown(slide.subtitle || ''),
        content: slide.content 
          ? slide.content
              .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>') // Convert **text** to <strong>
              .replace(/\*([^*]+)\*/g, '<em>$1</em>') // Convert *text* to <em>
              .replace(/^#{1,6}\s+(.+)$/gm, '<strong>$1</strong>') // Convert ### headers to bold
          : slide.content,
      };
    });

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
