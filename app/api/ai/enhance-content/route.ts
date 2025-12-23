import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ENHANCEMENT_PROMPTS = {
  rewrite: `Rewrite the following content to be clearer, more engaging, and better structured. 
Maintain the original meaning and key points, but improve flow, readability, and impact. 
Return only the improved content, no explanations.`,
  
  tone: (targetTone: string) => `Adjust the tone of the following content to be ${targetTone}. 
Maintain the core message but change the style and voice accordingly. 
Return only the adjusted content.`,
  
  seo: (platform: string) => `Optimize the following content for ${platform} algorithm. 
Make it more discoverable by:
- Using relevant keywords naturally
- Creating engaging hooks
- Optimizing for engagement signals
- Adding strategic emphasis points
Return only the optimized content.`,
  
  hook: `Create a compelling hook for the following content. 
The hook should be attention-grabbing, create curiosity, and make people want to read more.
Return only the hook (1-2 sentences max).`,
  
  cta: `Create an effective call-to-action for the following content.
Make it clear, actionable, and compelling. 
Return only the CTA (1 sentence).`,
};

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { content, action, targetAudience, targetTone } = await request.json();

    if (!content || !action) {
      return NextResponse.json(
        { error: 'Content and action are required' },
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

    const enhancedContent = completion.choices[0]?.message?.content || content;

    return NextResponse.json({ 
      enhancedContent: enhancedContent.trim(),
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


