import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

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
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
  throw new Error('Max retries exceeded');
}

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

    // Check for available API keys
    const availableProviders = PROVIDERS.filter(p => process.env[p.envKey]);
    if (availableProviders.length === 0) {
      return NextResponse.json(
        { error: 'AI service not configured' },
        { status: 503 }
      );
    }

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

    // Helper to call LLM with fallback
    async function callLLM(
      msgs: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
      maxTokens: number = 3000
    ): Promise<string> {
      for (const provider of availableProviders) {
        try {
          let completion: any;
          
          if (provider.name === 'groq') {
            const Groq = (await import('groq-sdk')).default;
            const groq = new Groq({ apiKey: process.env[provider.envKey] });
            
            completion = await generateWithRetry(async () => {
              return groq.chat.completions.create({
                messages: msgs,
                model: provider.model,
                temperature: 0.3,
                max_tokens: maxTokens,
              });
            });
          } else if (provider.name === 'together') {
            const OpenAI = (await import('openai')).default;
            const together = new OpenAI({
              apiKey: process.env[provider.envKey],
              baseURL: 'https://api.together.xyz/v1',
            });
            
            completion = await generateWithRetry(async () => {
              return together.chat.completions.create({
                messages: msgs,
                model: provider.model,
                temperature: 0.3,
                max_tokens: maxTokens,
              });
            });
          }
          
          if (completion) {
            return completion.choices[0]?.message?.content || '';
          }
        } catch (err) {
          console.error(`Provider ${provider.name} failed:`, err);
          continue;
        }
      }
      throw new Error('All providers failed');
    }

    const researchContent = await callLLM(messages, 3000);

    // Extract key points
    const keyPointsPrompt = `Extract the main key points from this research:\n\n${researchContent}\n\nReturn as a numbered list of the most important insights (5-8 points). Use plain text only - NO markdown formatting.`;

    const keyPoints = await callLLM([{ role: 'user', content: keyPointsPrompt }], 1000);

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


