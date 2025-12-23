import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slides, currentSettings } = await request.json();

    if (!slides || !Array.isArray(slides)) {
      return NextResponse.json(
        { error: 'Slides array is required' },
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

    // Analyze slides and provide design suggestions
    const analysisPrompt = `Analyze the following carousel slides and provide design suggestions:

${slides.map((s: any, i: number) => 
  `Slide ${i + 1}: ${s.title || 'Untitled'} - ${s.type || 'content'}`
).join('\n')}

Current settings:
- Background: ${currentSettings?.backgroundColor || '#0B0F19'}
- Text: ${currentSettings?.textColor || '#ffffff'}
- Accent: ${currentSettings?.accentColor || '#ffd700'}
- Font: ${currentSettings?.fontFamily || 'Inter'}

Provide suggestions in JSON format:
{
  "colorSuggestions": {
    "backgroundColor": "suggested color with reasoning",
    "textColor": "suggested color with reasoning",
    "accentColor": "suggested color with reasoning"
  },
  "layoutSuggestions": [
    {
      "slideIndex": 0,
      "suggestion": "layout improvement",
      "reason": "why this helps"
    }
  ],
  "fontSuggestions": {
    "recommendedFont": "font name",
    "reason": "why this font works better"
  },
  "accessibility": {
    "contrastScore": "score",
    "issues": ["list of accessibility issues"],
    "fixes": ["suggested fixes"]
  },
  "overallScore": "1-10 rating with explanation"
}

Return ONLY valid JSON, no markdown.`;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are a design expert specializing in social media carousel design. Provide actionable, specific design recommendations.',
        },
        { role: 'user', content: analysisPrompt },
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.5,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0]?.message?.content || '{}';
    let suggestions;
    
    try {
      suggestions = JSON.parse(content);
    } catch (e) {
      const cleaned = content.replace(/```json/g, '').replace(/```/g, '');
      suggestions = JSON.parse(cleaned);
    }

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error('Design suggestions error:', error);
    return NextResponse.json(
      { error: 'Failed to generate design suggestions' },
      { status: 500 }
    );
  }
}


