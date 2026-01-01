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
  - Example: [{"name": "Q1 Sales", "value": 45000}, {"name": "Q2 Sales", "value": 52000}]
  - ALWAYS provide actual numeric values, not percentages as strings

CRITICAL: If the content involves statistics, data comparisons, or numeric trends, ALWAYS use a "chart" slide type with proper chartData.
Charts will be rendered as professional images using QuickChart.io.

The design style is "Under The Hood", technical but accessible.
Focus on clarity, high value, and depth. Provide comprehensive explanations.
`,

  visual: `
Create INFOGRAPHIC-STYLE slides that are visually structured and information-dense but easy to scan.

Each slide should have:
- type: "cover" (only for the first slide), "visual", "chart"
- title: Short, impactful header (max 5 words)
- subtitle: (for cover only) The main hook
- icon: Choose ONE icon name that best represents the slide concept. We now have 7000+ Phosphor icons! Common ones include: lightbulb, target, rocket, users, shield, brain, trophy, clock, star, heart, fire, globe, lightning, chart, book, leaf, gift, sun, moon, camera, phone, calendar, bell, gear, flag, key, lock, cloud, database, cpu, battery, wifi, shopping-cart, credit-card, wallet, package, truck, airplane, train, bicycle, tree, paint-brush, code, music, video, coffee, sparkle, trending-up, check-circle, activity, heartbeat, first-aid, and thousands more
- content: (for visual slides) Provide 3-5 distinct bullet points using <ul><li> format. DO NOT wrap in <p> tags.
  - Each bullet should be EXTREMELY SHORT (max 10 words).
  - Each bullet should be a clear, standalone insight or step.
  - Do NOT use <strong> or <em> tags in visual slide content - keep it plain text inside <li> tags.
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
- title: Short, punchy header (plain text)
- subtitle: (for cover only) The main hook
- icon: (for "visual" type) Choose ONE Phosphor icon
- content: 
  - For "visual" type: Clean <ul><li> list with 3-5 short items (5-10 words each)
  - For "content" type: Detailed paragraphs using <p>, <ul>, <li> with <em> and <strong> for emphasis
- infographicLayout: (for visual slides) VARY the layouts - use different styles for each visual slide
- chartType/chartData: For chart slides with statistics

SLIDE PATTERN - Alternate types for variety:
- Slide 1: Cover
- Slide 2: Visual (infographic - use cards-grid or icon-cards)
- Slide 3: Content (detailed text)
- Slide 4: Visual (infographic - use timeline or process-steps)
- Slide 5: Content or Chart (if data available)
- Slide 6: Visual (infographic - use cycle or feature-list)
- Continue alternating with DIFFERENT infographic layouts each time

CRITICAL: Never use the same infographicLayout twice in a row. Ensure visual variety!
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
      // Generate individual 3D icons for infographic items if it's a visual slide
      let infographicIcons: string[] = [];
      if (slideStyle === 'visual' || (slideStyle === 'mixed' && slide.type === 'visual')) {
        // We'll extract items from the content for the icons
        const items = slide.content ? 
          slide.content.match(/<li[^>]*>([^<]+)<\/li>/gi)?.map((li: string) => li.replace(/<\/?[^>]+>/g, '').trim()) || [] 
          : [];
          
        infographicIcons = items.map((item: string) => {
          const prompt = `3D isometric icon for ${item}, high quality, clean white background, vibrant colors, minimalist design`;
          return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=256&height=256&nologo=true&model=flux`;
        });
      }

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
        infographicIcons,
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
