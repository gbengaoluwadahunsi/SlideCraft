import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slides, platform = 'LinkedIn', targetAudience } = await request.json();

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

    // Analyze carousel for performance prediction
    const analysisPrompt = `Analyze this carousel for ${platform} and predict its performance:

Slides:
${slides.map((s: any, i: number) => 
  `Slide ${i + 1}: ${s.title || 'Untitled'}
  Content: ${(s.content || s.subtitle || '').substring(0, 200)}...`
).join('\n\n')}

${targetAudience ? `Target Audience: ${targetAudience}` : ''}

Provide a performance prediction in JSON format:
{
  "engagementScore": 0-100,
  "predictedMetrics": {
    "likes": "estimated range",
    "shares": "estimated range",
    "comments": "estimated range",
    "views": "estimated range"
  },
  "strengths": ["list of what works well"],
  "weaknesses": ["list of potential issues"],
  "recommendations": ["actionable improvements"],
  "bestPostingTime": "suggested time",
  "hashtagSuggestions": ["relevant hashtags"],
  "riskFactors": ["things that might hurt performance"],
  "viralPotential": "low|medium|high with explanation"
}

Return ONLY valid JSON, no markdown.`;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are a social media analytics expert with deep knowledge of content performance on LinkedIn, Instagram, and X. Provide accurate, data-driven predictions.',
        },
        { role: 'user', content: analysisPrompt },
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3, // Lower for more consistent predictions
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0]?.message?.content || '{}';
    let prediction;
    
    try {
      prediction = JSON.parse(content);
    } catch (e) {
      const cleaned = content.replace(/```json/g, '').replace(/```/g, '');
      prediction = JSON.parse(cleaned);
    }

    return NextResponse.json({ prediction });
  } catch (error) {
    console.error('Performance prediction error:', error);
    return NextResponse.json(
      { error: 'Failed to predict performance' },
      { status: 500 }
    );
  }
}


