import { NextRequest, NextResponse } from 'next/server';
import { getPool, initDB } from '@/lib/db';

// Admin secret key for protecting admin endpoints
// Set this in your environment variables
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'your-super-secret-admin-key';

function verifyAdminAccess(request: NextRequest): boolean {
  const authHeader = request.headers.get('x-admin-secret');
  return authHeader === ADMIN_SECRET;
}

// GET - List all admin emails
export async function GET(request: NextRequest) {
  if (!verifyAdminAccess(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await initDB();
    const db = getPool();
    
    const result = await db.query(
      'SELECT id, email, note, created_at FROM admin_emails ORDER BY created_at DESC'
    );
    
    return NextResponse.json({ adminEmails: result.rows });
  } catch (error) {
    console.error('Failed to fetch admin emails:', error);
    return NextResponse.json(
      { error: 'Failed to fetch admin emails' },
      { status: 500 }
    );
  }
}

// POST - Add new admin email
export async function POST(request: NextRequest) {
  if (!verifyAdminAccess(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await initDB();
    const db = getPool();
    
    const { email, note } = await request.json();
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existing = await db.query(
      'SELECT id FROM admin_emails WHERE LOWER(email) = LOWER($1)',
      [email]
    );
    
    if (existing.rows.length > 0) {
      return NextResponse.json(
        { error: 'Email already exists in admin list' },
        { status: 400 }
      );
    }

    const result = await db.query(
      'INSERT INTO admin_emails (email, note) VALUES ($1, $2) RETURNING id, email, note, created_at',
      [email.toLowerCase().trim(), note || null]
    );
    
    return NextResponse.json({ 
      adminEmail: result.rows[0],
      message: 'Admin email added successfully' 
    });
  } catch (error) {
    console.error('Failed to add admin email:', error);
    return NextResponse.json(
      { error: 'Failed to add admin email' },
      { status: 500 }
    );
  }
}

// DELETE - Remove admin email
export async function DELETE(request: NextRequest) {
  if (!verifyAdminAccess(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await initDB();
    const db = getPool();
    
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const id = searchParams.get('id');
    
    if (!email && !id) {
      return NextResponse.json(
        { error: 'Email or ID is required' },
        { status: 400 }
      );
    }

    let result;
    if (id) {
      result = await db.query(
        'DELETE FROM admin_emails WHERE id = $1 RETURNING id, email',
        [id]
      );
    } else {
      result = await db.query(
        'DELETE FROM admin_emails WHERE LOWER(email) = LOWER($1) RETURNING id, email',
        [email]
      );
    }
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Admin email not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ 
      message: 'Admin email removed successfully',
      removed: result.rows[0]
    });
  } catch (error) {
    console.error('Failed to remove admin email:', error);
    return NextResponse.json(
      { error: 'Failed to remove admin email' },
      { status: 500 }
    );
  }
}
















