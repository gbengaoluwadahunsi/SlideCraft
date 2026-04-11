import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface UnsplashPhoto {
  id: string;
  urls: {
    thumb: string;
    small: string;
    regular: string;
    full: string;
  };
  alt_description: string | null;
  description: string | null;
  color: string;
  user: {
    name: string;
    username: string;
    links: { html: string };
  };
  width: number;
  height: number;
  links: { download: string; html: string; download_location: string };
}

interface UnsplashResponse {
  results: UnsplashPhoto[];
  total: number;
  total_pages: number;
}

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
      console.warn('UNSPLASH_ACCESS_KEY environment variable is not set');
      return NextResponse.json(
        { 
          error: 'Image search temporarily unavailable',
          message: 'Please add images via URL or upload instead',
          photos: [],
          total: 0,
          totalPages: 0,
          page: 1
        },
        { status: 200 } // Return 200 instead of 503 to prevent error logs
      );
    }

    const unsplashUrl = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&page=${page}&per_page=${perPage}&orientation=squarish`;
    
    const response = await fetch(unsplashUrl, {
      headers: {
        'Authorization': `Client-ID ${unsplashAccessKey}`,
      },
    });

    if (!response.ok) {
      console.error(`Unsplash API returned status: ${response.status}`);
      return NextResponse.json(
        { 
          error: 'Image search temporarily unavailable',
          message: 'Please add images via URL or upload instead',
          photos: [],
          total: 0,
          totalPages: 0,
          page: 1
        },
        { status: 200 }
      );
    }

    const data = await response.json() as UnsplashResponse;

    // Transform the response to only include what we need
    const photos = data.results.map((photo) => ({
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
      { 
        error: 'Image search failed',
        message: 'Please try again or add images via URL or upload',
        photos: [],
        total: 0,
        totalPages: 0,
        page: 1
      },
      { status: 200 } // Return 200 to prevent error cascade
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



