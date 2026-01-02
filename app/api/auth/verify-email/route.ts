import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 }
      );
    }

    const db = getPool();

    // Find user with valid verification token
    const result = await db.query(
      'SELECT id, email_verified FROM users WHERE verification_token = $1 AND verification_token_expires > NOW()',
      [token]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Invalid or expired verification token' },
        { status: 400 }
      );
    }

    const user = result.rows[0];

    if (user.email_verified) {
      return NextResponse.json({
        message: 'Email is already verified'
      });
    }

    // Verify email and clear token
    await db.query(
      'UPDATE users SET email_verified = TRUE, verification_token = NULL, verification_token_expires = NULL, updated_at = NOW() WHERE id = $1',
      [user.id]
    );

    return NextResponse.json({
      message: 'Email verified successfully'
    });
  } catch (error) {
    console.error('Verify email error:', error);
    return NextResponse.json(
      { error: 'Failed to verify email' },
      { status: 500 }
    );
  }
}



















