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

    const { slideContent, style = 'professional', brandColors = [] } = await request.json();

    if (!slideContent) {
      return NextResponse.json(
        { error: 'Slide content is required' },
        { status: 400 }
      );
    }

    // Try OpenAI DALL-E 3 first, fallback to other services
    const openaiApiKey = process.env.OPENAI_API_KEY;
    
    if (openaiApiKey) {
      const OpenAI = (await import('openai')).default;
      const openai = new OpenAI({ apiKey: openaiApiKey });

      // Generate prompt for image
      const imagePrompt = `Create a professional, modern image for a social media carousel slide. 
Content theme: ${slideContent}
Style: ${style}
${brandColors.length > 0 ? `Use colors that complement: ${brandColors.join(', ')}` : ''}
The image should be abstract, clean, and suitable for a business/professional context.
Avoid text, people, or specific brands. Focus on visual metaphors and concepts.`;

      const response = await openai.images.generate({
        model: 'dall-e-3',
        prompt: imagePrompt,
        size: '1024x1024',
        quality: 'standard',
        n: 1,
      });

      const imageUrl = response.data[0]?.url;
      if (imageUrl) {
        return NextResponse.json({ imageUrl });
      }
    }

    // Fallback: Use Unsplash API for relevant images
    const unsplashAccessKey = process.env.UNSPLASH_ACCESS_KEY;
    if (unsplashAccessKey) {
      // Extract keywords from content
      const keywords = slideContent
        .toLowerCase()
        .split(/\s+/)
        .filter(word => word.length > 4)
        .slice(0, 3)
        .join(',');
      
      const unsplashUrl = `https://api.unsplash.com/photos/random?query=${encodeURIComponent(keywords)}&orientation=squarish&client_id=${unsplashAccessKey}`;
      const unsplashResponse = await fetch(unsplashUrl);
      
      if (unsplashResponse.ok) {
        const data = await unsplashResponse.json();
        return NextResponse.json({ 
          imageUrl: data.urls?.regular || data.urls?.full,
          source: 'unsplash',
          attribution: data.user?.name
        });
      }
    }

    return NextResponse.json(
      { error: 'Image generation service not configured. Please set OPENAI_API_KEY or UNSPLASH_ACCESS_KEY' },
      { status: 503 }
    );
  } catch (error) {
    console.error('Image generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate image' },
      { status: 500 }
    );
  }
}


