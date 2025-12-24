import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getPool, initDB } from '@/lib/db';

// POST - Auto-save a project (lightweight, no history)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await initDB();
    const db = getPool();

    // Verify ownership
    const ownershipCheck = await db.query(
      'SELECT id FROM projects WHERE id = $1 AND user_id = $2',
      [id, session.user.id]
    );

    if (ownershipCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const { slides, options } = await request.json();

    await db.query(
      `UPDATE projects 
       SET slides = $1, options = $2, last_auto_saved_at = NOW(), updated_at = NOW()
       WHERE id = $3`,
      [JSON.stringify(slides), JSON.stringify(options || {}), id]
    );

    return NextResponse.json({ message: 'Auto-saved successfully' });
  } catch (error) {
    console.error('Auto-save error:', error);
    return NextResponse.json(
      { error: 'Failed to auto-save' },
      { status: 500 }
    );
  }
}

