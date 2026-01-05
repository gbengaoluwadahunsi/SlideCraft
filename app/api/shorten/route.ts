import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

// Generate a random short ID (6 characters)
function generateShortId(): string {
  const chars = 'abcdefghijkmnpqrstuvwxyz23456789'; // Removed confusing chars like l, 1, 0, o
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();
    
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const db = getPool();
    
    // Check if URL already has a short link
    const existing = await db.query(
      'SELECT id FROM short_urls WHERE original_url = $1',
      [url]
    );
    
    if (existing.rows.length > 0) {
      const shortId = existing.rows[0].id;
      const baseUrl = process.env.NEXTAUTH_URL || 'https://carouslk.com';
      return NextResponse.json({ 
        shortUrl: `${baseUrl}/v/${shortId}`,
        shortId 
      });
    }
    
    // Generate new short ID (with collision check)
    let shortId = generateShortId();
    let attempts = 0;
    
    while (attempts < 5) {
      try {
        await db.query(
          'INSERT INTO short_urls (id, original_url) VALUES ($1, $2)',
          [shortId, url]
        );
        break;
      } catch (err: any) {
        if (err.code === '23505') { // Unique violation
          shortId = generateShortId();
          attempts++;
        } else {
          throw err;
        }
      }
    }
    
    const baseUrl = process.env.NEXTAUTH_URL || 'https://carouslk.com';
    return NextResponse.json({ 
      shortUrl: `${baseUrl}/v/${shortId}`,
      shortId 
    });
    
  } catch (error) {
    console.error('Shorten URL error:', error);
    return NextResponse.json({ error: 'Failed to shorten URL' }, { status: 500 });
  }
}




