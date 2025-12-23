import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { getPool, initDB } from '@/lib/db';

// GET - Get project history for undo/redo
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await initDB();
    const db = getPool();

    // Verify ownership
    const ownershipCheck = await db.query(
      'SELECT id FROM projects WHERE id = $1 AND user_id = $2',
      [params.id, session.user.id]
    );

    if (ownershipCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const { limit = 50 } = Object.fromEntries(new URL(request.url).searchParams);

    const result = await db.query(
      `SELECT id, slides, options, created_at
       FROM project_history
       WHERE project_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [params.id, parseInt(limit as string, 10)]
    );

    const history = result.rows.map(row => ({
      id: row.id,
      slides: typeof row.slides === 'string' ? JSON.parse(row.slides) : row.slides,
      options: typeof row.options === 'string' ? JSON.parse(row.options) : row.options,
      createdAt: row.created_at
    }));

    return NextResponse.json({ history });
  } catch (error) {
    console.error('Get history error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch history' },
      { status: 500 }
    );
  }
}

