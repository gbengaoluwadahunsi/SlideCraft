import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getPool, initDB } from '@/lib/db';
import { getUserPlanLimits, trackUsage } from '@/lib/subscription';

// POST - Duplicate a project
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: projectId } = await params;

    await initDB();
    const db = getPool();

    // Get the original project
    const original = await db.query(
      `SELECT * FROM projects WHERE id = $1 AND user_id = $2`,
      [projectId, session.user.id]
    );

    if (original.rows.length === 0) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Check project limit
    const limits = await getUserPlanLimits(session.user.id);
    const usage = await trackUsage(session.user.id, 'project_creation', 0);
    
    if (!usage.canUse) {
      return NextResponse.json(
        { 
          error: 'Project limit reached',
          message: `You've reached your limit of ${limits.maxProjects} projects. Upgrade to Pro for unlimited projects.`,
          limit: limits.maxProjects,
          current: usage.current
        },
        { status: 403 }
      );
    }

    // Track project creation
    await trackUsage(session.user.id, 'project_creation', 1);

    const originalProject = original.rows[0];
    const newName = `${originalProject.name} (Copy)`;

    // Create the duplicate
    const result = await db.query(
      `INSERT INTO projects (user_id, name, slides, options)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, slides, options, created_at, updated_at`,
      [session.user.id, newName, originalProject.slides, originalProject.options]
    );

    const newProject = result.rows[0];

    return NextResponse.json({ 
      project: {
        id: newProject.id,
        name: newProject.name,
        slides: typeof newProject.slides === 'string' ? JSON.parse(newProject.slides) : newProject.slides,
        options: typeof newProject.options === 'string' ? JSON.parse(newProject.options) : newProject.options,
        createdAt: newProject.created_at,
        updatedAt: newProject.updated_at
      }
    });
  } catch (error) {
    console.error('Duplicate project error:', error);
    return NextResponse.json(
      { error: 'Failed to duplicate project' },
      { status: 500 }
    );
  }
}











