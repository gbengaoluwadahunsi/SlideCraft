import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    const db = getPool();

    // Find user with valid reset token
    const result = await db.query(
      'SELECT id FROM users WHERE reset_token = $1 AND reset_token_expires > NOW()',
      [token]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }

    const userId = result.rows[0].id;

    // Hash new password
    const passwordHash = await bcrypt.hash(password, 10);

    // Update password and clear reset token
    await db.query(
      'UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL, updated_at = NOW() WHERE id = $2',
      [passwordHash, userId]
    );

    return NextResponse.json({
      message: 'Password has been reset successfully'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: 'Failed to reset password' },
      { status: 500 }
    );
  }
}








