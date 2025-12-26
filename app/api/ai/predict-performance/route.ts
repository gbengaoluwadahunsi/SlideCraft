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

    // Check for available API keys
    const availableProviders = PROVIDERS.filter(p => process.env[p.envKey]);
    if (availableProviders.length === 0) {
      return NextResponse.json(
        { error: 'AI service not configured' },
        { status: 503 }
      );
    }

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

    let content = '{}';
    
    for (const provider of availableProviders) {
      try {
        let completion: any;
        
        if (provider.name === 'groq') {
          const Groq = (await import('groq-sdk')).default;
          const groq = new Groq({ apiKey: process.env[provider.envKey] });
          
          completion = await generateWithRetry(async () => {
            return groq.chat.completions.create({
              messages: [
                {
                  role: 'system',
                  content: 'You are a social media analytics expert with deep knowledge of content performance on LinkedIn, Instagram, and X. Provide accurate, data-driven predictions.',
                },
                { role: 'user', content: analysisPrompt },
              ],
              model: provider.model,
              temperature: 0.3,
              max_tokens: 2000,
              response_format: { type: 'json_object' },
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
              messages: [
                {
                  role: 'system',
                  content: 'You are a social media analytics expert with deep knowledge of content performance on LinkedIn, Instagram, and X. Provide accurate, data-driven predictions.',
                },
                { role: 'user', content: analysisPrompt },
              ],
              model: provider.model,
              temperature: 0.3,
              max_tokens: 2000,
              response_format: { type: 'json_object' },
            });
          });
        }
        
        if (completion) {
          content = completion.choices[0]?.message?.content || '{}';
          break;
        }
      } catch (err) {
        console.error(`Provider ${provider.name} failed:`, err);
        continue;
      }
    }
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


