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

    // Build the image prompt (avoid word "carousel" - AI interprets it as merry-go-round!)
    const imagePrompt = `Professional, modern abstract image for social media slide background. Theme: ${slideContent}. Style: ${style}. ${brandColors.length > 0 ? `Colors: ${brandColors.join(', ')}.` : ''} Clean, minimalist, business context. No text, no people, no brands. Visual metaphors and geometric shapes.`;

    // PRIORITY 1: Pollinations.ai - FREE AI image generation (no API key needed!)
    // Available models: flux (best), turbo (fast), zimage, gptimage, seedream
    // Note: Pollinations generates images lazily when URL is accessed - no need to verify
    if (!preferPremium) {
      // Pollinations.ai generates images via URL - encode the prompt
      // Keep prompt short to avoid URL length issues
      const shortPrompt = imagePrompt.slice(0, 500);
      const encodedPrompt = encodeURIComponent(shortPrompt);
      // Use the specified model (default: flux - most popular and highest quality)
      const validModels = ['flux', 'turbo', 'zimage', 'gptimage', 'seedream'];
      const selectedModel = validModels.includes(model) ? model : 'flux';
      const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&nologo=true&model=${selectedModel}`;
      
      // Return URL directly - Pollinations generates images on-demand when URL is accessed
      return NextResponse.json({ 
        imageUrl: pollinationsUrl,
        source: 'pollinations',
        model: selectedModel,
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


