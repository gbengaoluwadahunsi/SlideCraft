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
Convert the provided text into a visually engaging carousel structure that will WOW audiences.
Return ONLY a valid JSON object with a "slides" array. Do not wrap it in markdown code blocks.

IMPORTANT: Do NOT use markdown syntax in your output. No asterisks (**), no hashtags (###), no underscores for formatting.

CRITICAL: Create slides that are visually stunning, engaging, and professional. Think about:
- Compelling headlines that grab attention
- Clear, scannable content structure
- Visual variety and rhythm
- Professional yet modern design aesthetic
- High-impact messaging that stands out
`;

const SLIDE_STYLE_PROMPTS = {
  text: `
Each slide should have:
- type: "cover" (only for the first slide), "content", or "chart"
- title: Short, punchy header (plain text, no markdown)
- subtitle: (for cover only) The main hook (plain text, no markdown)
- content: (for content slides) HTML string with rich formatting options:
  
  AVAILABLE TEXT FORMATTING (use these HTML tags):
  - <strong>text</strong> - Bold text (renders in accent color)
  - <em>text</em> - Highlighted/emphasized text (yellow background)
  - <u>text</u> - Underlined text
  - <s>text</s> - Strikethrough text
  - <sup>text</sup> - Superscript (for footnotes, math like x²)
  - <sub>text</sub> - Subscript (for chemical formulas like H₂O)
  - <span style="text-transform: uppercase">TEXT</span> - All caps for impact
  - <span style="font-size: 24px">text</span> - Larger text for emphasis
  - <span style="letter-spacing: 0.1em">text</span> - Spaced out text
  - <span style="text-shadow: 2px 2px 4px rgba(0,0,0,0.5)">text</span> - Shadow effect
  - <a href="url">link text</a> - Clickable links
  - <p>, <ul>, <li> - Paragraphs and lists
  - <pre><code>...</code></pre> - Code snippets
  
  NEVER use markdown like ** or ### - use HTML tags instead.
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
    * <p>, <ul>, <li> - Structure
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
      includeStats = false
    } = await request.json();
    const requestedSlideCount = Math.max(3, Math.min(50, Number(slideCount) || 6));
    const combinedText = (text || '').trim();

    const styleInstruction = writingStyle ? `Writing Style: ${writingStyle}.` : '';
    const wordCountInstruction = wordCount 
      ? `STRICTLY follow the word count target: approximately ${wordCount} words per slide. Expand on points to reach this length if necessary.` 
      : `Content MUST be detailed and comprehensive. Target roughly 75-100 words per slide. Avoid short, scanty slides. Use multiple paragraphs if necessary to explain concepts fully.`;
    
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

    const messages = [
      { role: 'system' as const, content: getSystemPrompt(slideStyle) },
        {
        role: 'user' as const,
          content: `
Here is the content to convert.
Create exactly ${requestedSlideCount} slides unless the content is empty, in which case explain why no slides were generated.
${styleInstruction}
${wordCountInstruction}
${languageInstruction}
${toneInstruction}
${featuresInstruction}
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
      // Generate individual 3D icons for infographic items if it's a visual slide
      let infographicIcons: string[] = [];
      if (slideStyle === 'visual' || (slideStyle === 'mixed' && slide.type === 'visual')) {
        const items = slide.content ? 
          slide.content.match(/<li[^>]*>([^<]+)<\/li>/gi)?.map((li: string) => li.replace(/<\/?[^>]+>/g, '').trim()) || [] 
          : [];
          
        infographicIcons = items.map((item: string) => {
          const prompt = `3D isometric icon for ${item}, high quality, clean white background, vibrant colors, minimalist design, ${accentColor} accent`;
          return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=256&height=256&nologo=true&model=flux`;
        });
      }

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
      
      // Skip background image for first slide (index === 0)
      if (slideType !== 'chart' && index !== 0 && (slideStyle === 'visual' || slideStyle === 'mixed')) {
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
            extractedColors = await extractColorsFromImageUrl(backgroundImage);
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
          ? slide.content
              .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
              .replace(/\*([^*]+)\*/g, '<em>$1</em>')
              .replace(/^#{1,6}\s+(.+)$/gm, '<strong>$1</strong>')
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
