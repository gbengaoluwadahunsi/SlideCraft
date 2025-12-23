import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

// WARNING: This endpoint deletes ALL users from the database
// Use with caution - this is for development/testing only
export async function GET(request: NextRequest) {
  try {
    const db = getPool();
    
    // Delete all users (cascade will delete associated projects)
    const result = await db.query('DELETE FROM users');
    
    return NextResponse.json({
      message: 'All users have been deleted',
      deleted: result.rowCount
    });
  } catch (error) {
    console.error('Clear all users error:', error);
    return NextResponse.json(
      { error: 'Failed to clear users' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}

