import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { getPool, initDB } from '@/lib/db';

// POST - Import a project from JSON
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await initDB();
    const db = getPool();

    const { name, slides, options } = await request.json();

    if (!name || !slides || !Array.isArray(slides)) {
      return NextResponse.json(
        { error: 'Invalid project data. Name and slides array are required.' },
        { status: 400 }
      );
    }

    const result = await db.query(
      `INSERT INTO projects (user_id, name, slides, options)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, slides, options, created_at, updated_at`,
      [session.user.id, name, JSON.stringify(slides), JSON.stringify(options || {})]
    );

    return NextResponse.json({
      project: {
        ...result.rows[0],
        slides: typeof result.rows[0].slides === 'string' ? JSON.parse(result.rows[0].slides) : result.rows[0].slides,
        options: typeof result.rows[0].options === 'string' ? JSON.parse(result.rows[0].options) : result.rows[0].options
      }
    });
  } catch (error) {
    console.error('Import project error:', error);
    return NextResponse.json(
      { error: 'Failed to import project' },
      { status: 500 }
    );
  }
}

