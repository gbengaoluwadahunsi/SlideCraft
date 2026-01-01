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

    const { slideContent, style = 'professional', brandColors = [], preferPremium = false, model = 'flux' } = await request.json();

    if (!slideContent) {
      return NextResponse.json(
        { error: 'Slide content is required' },
        { status: 400 }
      );
    }

    // Build a SHORT image prompt (long URLs fail!)
    // Extract key theme words only
    const themeWords = slideContent
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter((w: string) => w.length > 3)
      .slice(0, 5)
      .join(' ');
    
    const imagePrompt = `High-end 3D minimalist infographic element for ${themeWords}, professional digital art, clean studio lighting, isometric view, vibrant colors, white background, high resolution 4k`;
    
    // PRIORITY 1: Pollinations.ai - FREE AI image generation
    if (!preferPremium) {
      const encodedPrompt = encodeURIComponent(imagePrompt);
      const seed = Date.now() % 10000;
      const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&nologo=true&model=flux&seed=${seed}`;
      
      return NextResponse.json({ 
        imageUrl: pollinationsUrl,
        source: 'pollinations',
        model: 'turbo',
        cost: 'free'
      });
    }

    // PRIORITY 2: Unsplash API - FREE stock photos (requires API key)
    const unsplashAccessKey = process.env.UNSPLASH_ACCESS_KEY;
    if (unsplashAccessKey && !preferPremium) {
      try {
        // Extract keywords from content
        const keywords = slideContent
          .toLowerCase()
          .replace(/[^\w\s]/g, '')
          .split(/\s+/)
          .filter((word: string) => word.length > 3)
          .slice(0, 3)
          .join(',');
        
        const unsplashUrl = `https://api.unsplash.com/photos/random?query=${encodeURIComponent(keywords || 'business professional')}&orientation=squarish&client_id=${unsplashAccessKey}`;
        const unsplashResponse = await fetch(unsplashUrl);
        
        if (unsplashResponse.ok) {
          const data = await unsplashResponse.json();
          if (data.urls?.regular) {
            // Trigger download endpoint (required by Unsplash API guidelines)
            if (data.links?.download_location) {
              fetch(`${data.links.download_location}&client_id=${unsplashAccessKey}`).catch(() => {});
            }
            
            return NextResponse.json({ 
              imageUrl: data.urls.regular,
              source: 'unsplash',
              // Attribution required by Unsplash
              attribution: {
                name: data.user?.name,
                username: data.user?.username,
                link: data.user?.links?.html,
                unsplashLink: data.links?.html
              },
              cost: 'free'
            });
          }
        }
      } catch (unsplashError) {
        console.log('Unsplash failed, trying fallback...', unsplashError);
      }
    }

    // PRIORITY 3: OpenAI DALL-E 3 - PREMIUM option (paid, requires API key)
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (openaiApiKey) {
      try {
        const OpenAI = (await import('openai')).default;
        const openai = new OpenAI({ apiKey: openaiApiKey });

        const response = await openai.images.generate({
          model: 'dall-e-3',
          prompt: imagePrompt,
          size: '1024x1024',
          quality: 'standard',
          n: 1,
        });

        const imageUrl = response.data[0]?.url;
        if (imageUrl) {
          return NextResponse.json({ 
            imageUrl,
            source: 'dall-e-3',
            cost: 'premium'
          });
        }
      } catch (openaiError) {
        console.log('OpenAI DALL-E failed:', openaiError);
      }
    }

    // Final fallback: Return a Pollinations URL anyway (it usually works)
    const fallbackPrompt = encodeURIComponent(`Professional abstract minimalist business background image, theme: ${slideContent}, modern geometric design`);
    return NextResponse.json({ 
      imageUrl: `https://image.pollinations.ai/prompt/${fallbackPrompt}?width=1024&height=1024&nologo=true&model=flux`,
      source: 'pollinations',
      model: 'flux',
      cost: 'free'
    });

  } catch (error) {
    console.error('Image generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate image' },
      { status: 500 }
    );
  }
}


