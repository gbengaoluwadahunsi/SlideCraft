import { NextRequest, NextResponse } from 'next/server';
import { getPool, initDB } from '@/lib/db';

// GET - Load a shared project by token
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    await initDB();
    const db = getPool();

    const result = await db.query(
      `SELECT id, name, slides, options, created_at, updated_at
       FROM projects 
       WHERE share_token = $1 AND is_shared = TRUE`,
      [params.token]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Shared project not found' }, { status: 404 });
    }

    const project = result.rows[0];
    return NextResponse.json({
      project: {
        ...project,
        slides: typeof project.slides === 'string' ? JSON.parse(project.slides) : project.slides,
        options: typeof project.options === 'string' ? JSON.parse(project.options) : project.options
      }
    });
  } catch (error) {
    console.error('Get shared project error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shared project' },
      { status: 500 }
    );
  }
}

