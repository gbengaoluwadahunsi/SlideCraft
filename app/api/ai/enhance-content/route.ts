import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Helper to convert markdown to HTML
function markdownToHtml(text: string): string {
  return text
    // Convert **bold** to <strong>
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    // Convert *italic* to <em>
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    // Convert __bold__ to <strong>
    .replace(/__([^_]+)__/g, '<strong>$1</strong>')
    // Convert _italic_ to <em>
    .replace(/_([^_]+)_/g, '<em>$1</em>')
    // Remove hashtags at end (keep content clean for slides)
    .replace(/\s*#\w+/g, '')
    // Convert line breaks to <br> or wrap in <p>
    .split('\n\n').filter(p => p.trim()).map(p => `<p>${p.trim()}</p>`).join('')
    // Clean up any remaining single newlines within paragraphs
    .replace(/\n/g, ' ')
    .trim();
}

const ENHANCEMENT_PROMPTS = {
  rewrite: `Rewrite the following content to be clearer, more engaging, and better structured. 
Maintain the original meaning and key points, but improve flow, readability, and impact. 
IMPORTANT: Return plain text only. Do NOT use markdown formatting (no asterisks, no hashtags, no bullet points).
Use simple emphasis by capitalizing key words if needed.
Return only the improved content, no explanations.`,
  
  tone: (targetTone: string) => `Adjust the tone of the following content to be ${targetTone}. 
Maintain the core message but change the style and voice accordingly. 
IMPORTANT: Return plain text only. Do NOT use markdown formatting (no asterisks, no hashtags).
Return only the adjusted content.`,
  
  seo: (platform: string) => `Optimize the following content for ${platform} engagement. 
Make it more engaging by:
- Using power words and emotional triggers
- Creating compelling hooks
- Improving readability and flow
- Adding strategic emphasis on key points

IMPORTANT RULES:
- Return plain text only
- Do NOT use markdown formatting (no ** asterisks, no # hashtags)
- Do NOT add hashtags at the end
- Keep it concise and impactful for carousel slides
Return only the optimized content.`,
  
  hook: `Create a compelling hook for the following content. 
The hook should be attention-grabbing, create curiosity, and make people want to read more.
IMPORTANT: Return plain text only. No markdown, no asterisks, no hashtags.
Return only the hook (1-2 sentences max).`,
  
  cta: `Create an effective call-to-action for the following content.
Make it clear, actionable, and compelling. 
IMPORTANT: Return plain text only. No markdown formatting.
Return only the CTA (1 sentence).`,
};

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { content, action, targetAudience, targetTone, slides } = await request.json();

    // Support batch mode (slides array) or single content mode
    const isBatchMode = Array.isArray(slides) && slides.length > 0;

    if (!isBatchMode && (!content || !action)) {
      return NextResponse.json(
        { error: 'Content and action are required' },
        { status: 400 }
      );
    }

    if (isBatchMode && !action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      );
    }

    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      return NextResponse.json(
        { error: 'AI service not configured' },
        { status: 503 }
      );
    }

    const Groq = (await import('groq-sdk')).default;
    const groq = new Groq({ apiKey: groqApiKey });

    let systemPrompt = ENHANCEMENT_PROMPTS[action as keyof typeof ENHANCEMENT_PROMPTS];
    
    if (typeof systemPrompt === 'function') {
      systemPrompt = systemPrompt(targetTone || targetAudience || 'general');
    }

    // Batch mode: enhance all slides at once
    if (isBatchMode) {
      const batchPrompt = `You are enhancing content for a carousel presentation with ${slides.length} slides.
For each slide, apply the enhancement while maintaining consistency across the carousel.

${systemPrompt}

IMPORTANT: Return a JSON array with the enhanced content for each slide in the same order.
Format: ["enhanced content for slide 1", "enhanced content for slide 2", ...]
Return ONLY the JSON array, no explanation.

Slides to enhance:
${slides.map((slide: any, i: number) => `
Slide ${i + 1} (${slide.type}):
- Title: ${slide.title || '(none)'}
- Subtitle: ${slide.subtitle || '(none)'}
- Content: ${slide.content || '(none)'}
`).join('\n')}`;

      const completion = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: 'You enhance carousel content while maintaining flow and consistency across slides. Always return valid JSON arrays.' },
          { role: 'user', content: batchPrompt },
        ],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.7,
        max_tokens: 4000,
        response_format: { type: 'json_object' },
      });

      const responseText = completion.choices[0]?.message?.content || '{}';
      let enhancedSlides;
      
      try {
        const parsed = JSON.parse(responseText);
        // Handle both { slides: [...] } and direct array format
        enhancedSlides = Array.isArray(parsed) ? parsed : (parsed.slides || parsed.enhanced || Object.values(parsed)[0]);
        
        if (!Array.isArray(enhancedSlides)) {
          throw new Error('Invalid response format');
        }
        
        // Map back to slide structure with enhanced content
        enhancedSlides = slides.map((slide: any, i: number) => {
          const enhanced = enhancedSlides[i];
          if (typeof enhanced === 'string') {
            // Simple string - apply to content or title
            return {
              ...slide,
              content: slide.content ? markdownToHtml(enhanced) : slide.content,
              title: !slide.content && slide.title ? markdownToHtml(enhanced) : slide.title,
            };
          } else if (typeof enhanced === 'object') {
            // Object with title/content/subtitle
            return {
              ...slide,
              title: enhanced.title ? markdownToHtml(enhanced.title) : slide.title,
              subtitle: enhanced.subtitle ? markdownToHtml(enhanced.subtitle) : slide.subtitle,
              content: enhanced.content ? markdownToHtml(enhanced.content) : slide.content,
            };
          }
          return slide;
        });
      } catch (e) {
        console.error('Failed to parse batch response:', e);
        return NextResponse.json(
          { error: 'Failed to process batch enhancement' },
          { status: 500 }
        );
      }

      return NextResponse.json({ 
        enhancedSlides,
        originalSlides: slides,
        batchMode: true
      });
    }

    // Single content mode (original behavior)
    const userPrompt = action === 'hook' || action === 'cta' 
      ? content 
      : `Content to enhance:\n\n${content}\n\n${targetAudience ? `Target audience: ${targetAudience}` : ''}`;

    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 2000,
    });

    let enhancedContent = completion.choices[0]?.message?.content || content;
    
    // Clean up any markdown that slipped through and convert to HTML
    enhancedContent = markdownToHtml(enhancedContent.trim());

    return NextResponse.json({ 
      enhancedContent,
      originalContent: content 
    });
  } catch (error) {
    console.error('Content enhancement error:', error);
    return NextResponse.json(
      { error: 'Failed to enhance content' },
      { status: 500 }
    );
  }
}


