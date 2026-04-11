import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getPool, initDB } from '@/lib/db';

// GET - Load a specific project
export async function GET(
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

    // Only allow the project owner to access their project
    // Shared projects should be accessed via the /share/[token] route
    const result = await db.query(
      `SELECT id, user_id, name, slides, options, created_at, updated_at, is_shared, share_token
       FROM projects 
       WHERE id = $1 AND user_id = $2`,
      [id, session.user.id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const project = result.rows[0];
    // Prevent caching to ensure users always see their own fresh data
    return NextResponse.json({
      project: {
        ...project,
        slides: typeof project.slides === 'string' ? JSON.parse(project.slides) : project.slides,
        options: typeof project.options === 'string' ? JSON.parse(project.options) : project.options
      }
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache'
      }
    });
  } catch (error) {
    console.error('Get project error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project' },
      { status: 500 }
    );
  }
}

// PUT - Update a project
export async function PUT(
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

    const { name, slides, options } = await request.json();

    // Single optimized query: update and verify ownership in one operation
    const updateFields: string[] = [];
    const updateValues: unknown[] = [];
    let paramIndex = 1;

    if (name !== undefined) {
      updateFields.push(`name = $${paramIndex++}`);
      updateValues.push(name);
    }

    if (slides !== undefined) {
      updateFields.push(`slides = $${paramIndex++}`);
      updateValues.push(JSON.stringify(slides));
    }

    if (options !== undefined) {
      updateFields.push(`options = $${paramIndex++}`);
      updateValues.push(JSON.stringify(options));
    }

    if (updateFields.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    updateFields.push(`updated_at = NOW()`);
    
    // Combine ownership check with update in single query
    const result = await db.query(
      `UPDATE projects 
       SET ${updateFields.join(', ')}
       WHERE id = $${paramIndex++} AND user_id = $${paramIndex}
       RETURNING id, name, updated_at`,
      [...updateValues, id, session.user.id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Return minimal data for faster response (client already has the slides)
    return NextResponse.json({
      project: {
        id: result.rows[0].id,
        name: result.rows[0].name,
        updatedAt: result.rows[0].updated_at
      }
    });
  } catch (error) {
    console.error('Update project error:', error);
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a project
export async function DELETE(
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

    const result = await db.query(
      'DELETE FROM projects WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, session.user.id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Delete project error:', error);
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    );
  }
}

