import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getPool, initDB } from '@/lib/db';
import { getUserPlanLimits, trackUsage } from '@/lib/subscription';
import { v4 as uuidv4 } from 'uuid';

// GET - List all projects for the user
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await initDB();
    const db = getPool();

    const result = await db.query(
      `SELECT id, name, created_at, updated_at, last_auto_saved_at, is_shared
       FROM projects 
       WHERE user_id = $1 
       ORDER BY updated_at DESC`,
      [session.user.id]
    );

    // Map snake_case to camelCase for frontend
    const projects = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      lastAutoSavedAt: row.last_auto_saved_at,
      isShared: row.is_shared
    }));

    return NextResponse.json({ projects });
  } catch (error) {
    console.error('Get projects error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

// POST - Create a new project
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await initDB();
    const db = getPool();

    const { name, slides, options } = await request.json();

    if (!name || !slides) {
      return NextResponse.json(
        { error: 'Name and slides are required' },
        { status: 400 }
      );
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

    const result = await db.query(
      `INSERT INTO projects (user_id, name, slides, options)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, slides, options, created_at, updated_at`,
      [session.user.id, name, JSON.stringify(slides), JSON.stringify(options || {})]
    );

    return NextResponse.json({ project: result.rows[0] });
  } catch (error) {
    console.error('Create project error:', error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}

