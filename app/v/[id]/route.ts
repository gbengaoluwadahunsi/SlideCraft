import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    const db = getPool();
    
    // Get the original URL
    const result = await db.query(
      'SELECT original_url FROM short_urls WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return NextResponse.redirect(new URL('/?error=link-not-found', request.url));
    }
    
    const originalUrl = result.rows[0].original_url;
    
    // Update click count (non-blocking)
    db.query('UPDATE short_urls SET clicks = clicks + 1 WHERE id = $1', [id])
      .catch(err => console.error('Failed to update click count:', err));
    
    // Redirect to original URL
    return NextResponse.redirect(originalUrl);
    
  } catch (error) {
    console.error('Short URL redirect error:', error);
    return NextResponse.redirect(new URL('/?error=redirect-failed', request.url));
  }
}






