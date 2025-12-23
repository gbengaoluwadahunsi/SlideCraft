import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const db = getPool();
    const result = await db.query(
      'SELECT email_verified FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Return verified status - if NULL, treat as not verified for new users
    // but existing users might have NULL which we'll handle differently
    const emailVerified = result.rows[0].email_verified;
    return NextResponse.json({
      verified: emailVerified === true,
      // Include whether it's explicitly false vs NULL
      status: emailVerified === true ? 'verified' : emailVerified === false ? 'unverified' : 'unknown'
    });
  } catch (error) {
    console.error('Check verification error:', error);
    return NextResponse.json(
      { error: 'Failed to check verification status' },
      { status: 500 }
    );
  }
}

