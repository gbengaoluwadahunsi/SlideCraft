import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Helper to strip markdown from text
function stripMarkdown(text: string): string {
  if (!text) return text;
  return text
    .replace(/^#{1,6}\s+/gm, '') // Remove markdown headers
    .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold **text**
    .replace(/\*([^*]+)\*/g, '$1') // Remove italic *text*
    .replace(/__([^_]+)__/g, '$1') // Remove bold __text__
    .replace(/_([^_]+)_/g, '$1') // Remove italic _text_
    .trim();
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { topic, depth = 'quick', sources = 5, refinement, previousResearch, history } = await request.json();

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

    // Build messages array - include history for refinements
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      {
        role: 'system',
        content: `You are a research assistant that provides accurate, up-to-date information on various topics. Focus on facts, trends, and actionable insights.

IMPORTANT: Write in plain text only. Do NOT use any markdown formatting like:
- No asterisks (**text** or *text*)
- No hashtags for headers (### or ##)
- No underscores (__text__ or _text_)
Just use plain text paragraphs with clear section titles on their own lines.`,
      },
    ];

    if (refinement && previousResearch) {
      // This is a refinement request - add context
      messages.push({
        role: 'user',
        content: `Research the following topic comprehensively: "${topic}"`,
      });
      messages.push({
        role: 'assistant',
        content: previousResearch,
      });
      
      // Add any previous conversation history
      if (history && Array.isArray(history)) {
        history.forEach((msg: { role: 'user' | 'assistant'; content: string }) => {
          if (msg.role === 'user' || msg.role === 'assistant') {
            messages.push({
              role: msg.role,
              content: msg.content,
            });
          }
        });
      }
      
      // Add the refinement request
      messages.push({
        role: 'user',
        content: `Based on the research above, please: ${refinement}

Continue to use plain text only - no markdown formatting.`,
      });
    } else {
      // Initial research request
      const researchPrompt = `Research the following topic comprehensively: "${topic}"

Provide:
1. Key insights and main points
2. Recent trends or developments
3. Important statistics or data
4. Expert opinions or perspectives
5. Practical applications or examples

${depth === 'comprehensive' ? 'Be thorough and detailed. Include multiple perspectives.' : 'Be concise but informative.'}`;

      messages.push({ role: 'user', content: researchPrompt });
    }

    const completion = await groq.chat.completions.create({
      messages,
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      max_tokens: 3000,
    });

    const researchContent = completion.choices[0]?.message?.content || '';

    // Extract key points
    const keyPointsPrompt = `Extract the main key points from this research:\n\n${researchContent}\n\nReturn as a numbered list of the most important insights (5-8 points). Use plain text only - NO markdown formatting.`;

    const keyPointsCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'user', content: keyPointsPrompt },
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      max_tokens: 1000,
    });

    const keyPoints = keyPointsCompletion.choices[0]?.message?.content || '';

    // Clean any remaining markdown from the output
    const cleanedResearch = stripMarkdown(researchContent);
    const cleanedKeyPoints = keyPoints
      .split('\n')
      .filter(line => line.trim().length > 0)
      .map(line => stripMarkdown(line));

    return NextResponse.json({
      research: cleanedResearch,
      keyPoints: cleanedKeyPoints,
      topic,
      isRefinement: !!refinement,
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


