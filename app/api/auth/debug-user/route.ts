import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

// Debug endpoint to check user status
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
      'SELECT id, email, email_verified, created_at FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({
        found: false,
        message: 'User not found with this email'
      });
    }

    const user = result.rows[0];
    return NextResponse.json({
      found: true,
      email: user.email,
      email_verified: user.email_verified,
      created_at: user.created_at,
      id: user.id
    });
  } catch (error) {
    console.error('Debug user error:', error);
    return NextResponse.json(
      { error: 'Failed to check user' },
      { status: 500 }
    );
  }
}




