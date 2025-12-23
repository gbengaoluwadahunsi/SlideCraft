import { NextRequest, NextResponse } from 'next/server';
import { getPool, initDB } from '@/lib/db';

// This endpoint fixes existing users who were created before email verification
// It auto-verifies them so they can continue using the app
export async function POST(request: NextRequest) {
  try {
    await initDB();
    const db = getPool();
    
    // Auto-verify all existing users who don't have email_verified set or have it as false
    // This is a one-time migration for users created before verification was required
    const result = await db.query(`
      UPDATE users 
      SET email_verified = TRUE 
      WHERE email_verified IS NULL OR email_verified = FALSE;
    `);

    return NextResponse.json({
      message: 'Existing users have been auto-verified',
      updated: result.rowCount
    });
  } catch (error) {
    console.error('Fix existing users error:', error);
    return NextResponse.json(
      { error: 'Failed to fix existing users' },
      { status: 500 }
    );
  }
}

