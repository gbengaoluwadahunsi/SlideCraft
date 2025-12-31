import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || 'business';
    const page = parseInt(searchParams.get('page') || '1');
    const perPage = parseInt(searchParams.get('per_page') || '20');

    const unsplashAccessKey = process.env.UNSPLASH_ACCESS_KEY;
    
    if (!unsplashAccessKey) {
      return NextResponse.json(
        { error: 'Unsplash API not configured' },
        { status: 503 }
      );
    }

    const unsplashUrl = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&page=${page}&per_page=${perPage}&orientation=squarish`;
    
    const response = await fetch(unsplashUrl, {
      headers: {
        'Authorization': `Client-ID ${unsplashAccessKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Unsplash API error: ${response.status}`);
    }

    const data = await response.json();

    // Transform the response to only include what we need
    const photos = data.results.map((photo: any) => ({
      id: photo.id,
      urls: {
        thumb: photo.urls.thumb,
        small: photo.urls.small,
        regular: photo.urls.regular,
        full: photo.urls.full,
      },
      alt: photo.alt_description || photo.description || 'Unsplash photo',
      color: photo.color,
      user: {
        name: photo.user.name,
        username: photo.user.username,
        link: photo.user.links.html,
      },
      downloadLink: photo.links.download_location,
    }));

    return NextResponse.json({
      photos,
      total: data.total,
      totalPages: data.total_pages,
      page,
    });
  } catch (error) {
    console.error('Unsplash search error:', error);
    return NextResponse.json(
      { error: 'Failed to search photos' },
      { status: 500 }
    );
  }
}

// Trigger download tracking (required by Unsplash API guidelines)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { downloadLink } = await request.json();
    
    if (!downloadLink) {
      return NextResponse.json({ error: 'Download link required' }, { status: 400 });
    }

    const unsplashAccessKey = process.env.UNSPLASH_ACCESS_KEY;
    if (!unsplashAccessKey) {
      return NextResponse.json({ error: 'Unsplash API not configured' }, { status: 503 });
    }

    // Trigger the download endpoint (Unsplash API requirement)
    await fetch(`${downloadLink}&client_id=${unsplashAccessKey}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unsplash download tracking error:', error);
    return NextResponse.json({ success: true }); // Don't fail the user action
  }
}

