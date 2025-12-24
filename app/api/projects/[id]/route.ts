import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getPool, initDB } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

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

    const result = await db.query(
      `SELECT id, name, slides, options, created_at, updated_at, is_shared, share_token
       FROM projects 
       WHERE id = $1 AND (user_id = $2 OR is_shared = TRUE)`,
      [id, session.user.id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
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

    // Verify ownership
    const ownershipCheck = await db.query(
      'SELECT id FROM projects WHERE id = $1 AND user_id = $2',
      [id, session.user.id]
    );

    if (ownershipCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const { name, slides, options, saveHistory = false } = await request.json();

    // Save to history if requested (for undo/redo)
    if (saveHistory) {
      const currentProject = await db.query(
        'SELECT slides, options FROM projects WHERE id = $1',
        [id]
      );
      
      if (currentProject.rows.length > 0) {
        await db.query(
          `INSERT INTO project_history (project_id, slides, options)
           VALUES ($1, $2, $3)`,
          [
            id,
            currentProject.rows[0].slides,
            currentProject.rows[0].options
          ]
        );
      }
    }

    const updateFields: string[] = [];
    const updateValues: any[] = [];
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

    updateFields.push(`updated_at = NOW()`);
    updateValues.push(id);

    const result = await db.query(
      `UPDATE projects 
       SET ${updateFields.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING id, name, slides, options, updated_at`,
      updateValues
    );

    return NextResponse.json({
      project: {
        ...result.rows[0],
        slides: typeof result.rows[0].slides === 'string' ? JSON.parse(result.rows[0].slides) : result.rows[0].slides,
        options: typeof result.rows[0].options === 'string' ? JSON.parse(result.rows[0].options) : result.rows[0].options
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

