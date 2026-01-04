import { NextRequest, NextResponse } from 'next/server';
import { getPool, initDB } from '@/lib/db';

// Admin secret key for protecting admin endpoints
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'your-super-secret-admin-key';

function verifyAdminAccess(request: NextRequest): boolean {
  const authHeader = request.headers.get('x-admin-secret');
  return authHeader === ADMIN_SECRET;
}

// GET - List all registered users
export async function GET(request: NextRequest) {
  if (!verifyAdminAccess(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await initDB();
    const db = getPool();
    
    const result = await db.query(`
      SELECT 
        id, 
        email, 
        name, 
        provider,
        email_verified,
        plan,
        subscription_status,
        created_at,
        updated_at
      FROM users 
      ORDER BY created_at DESC
    `);
    
    // Get total count
    const countResult = await db.query('SELECT COUNT(*) as total FROM users');
    const total = parseInt(countResult.rows[0].total, 10);
    
    // Get stats
    const statsResult = await db.query(`
      SELECT 
        COUNT(*) FILTER (WHERE email_verified = true) as verified_count,
        COUNT(*) FILTER (WHERE provider = 'google') as google_users,
        COUNT(*) FILTER (WHERE provider IS NULL OR provider = 'credentials') as email_users,
        COUNT(*) FILTER (WHERE plan = 'free' OR plan IS NULL) as free_users,
        COUNT(*) FILTER (WHERE plan = 'pro') as pro_users,
        COUNT(*) FILTER (WHERE plan = 'enterprise') as enterprise_users,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as new_this_week,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as new_this_month
      FROM users
    `);
    
    return NextResponse.json({ 
      users: result.rows,
      total,
      stats: statsResult.rows[0]
    });
  } catch (error) {
    console.error('Failed to fetch users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}














