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

    const { topic, depth = 'quick', sources = 5 } = await request.json();

    if (!topic) {
      return NextResponse.json(
        { error: 'Topic is required' },
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

    // Use AI to research the topic
    const researchPrompt = `Research the following topic comprehensively: "${topic}"

Provide:
1. Key insights and main points
2. Recent trends or developments
3. Important statistics or data
4. Expert opinions or perspectives
5. Practical applications or examples

${depth === 'comprehensive' ? 'Be thorough and detailed. Include multiple perspectives.' : 'Be concise but informative.'}

Format as a structured research summary that can be used to create engaging carousel content.`;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are a research assistant that provides accurate, up-to-date information on various topics. Focus on facts, trends, and actionable insights.',
        },
        { role: 'user', content: researchPrompt },
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3, // Lower temperature for more factual responses
      max_tokens: 3000,
    });

    const researchContent = completion.choices[0]?.message?.content || '';

    // Extract key points
    const keyPointsPrompt = `Extract the main key points from this research:\n\n${researchContent}\n\nReturn as a numbered list of the most important insights.`;

    const keyPointsCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'user', content: keyPointsPrompt },
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      max_tokens: 1000,
    });

    const keyPoints = keyPointsCompletion.choices[0]?.message?.content || '';

    return NextResponse.json({
      research: researchContent,
      keyPoints: keyPoints.split('\n').filter(line => line.trim().length > 0),
      topic,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Research error:', error);
    return NextResponse.json(
      { error: 'Failed to research topic' },
      { status: 500 }
    );
  }
}


