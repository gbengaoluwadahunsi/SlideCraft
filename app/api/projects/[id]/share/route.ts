import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getPool, initDB } from '@/lib/db';
import { getUserPlanLimits } from '@/lib/subscription';
import { v4 as uuidv4 } from 'uuid';

// POST - Enable/disable sharing for a project
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

    const { isShared } = await request.json();

    // Check if user can share projects
    if (isShared) {
      const limits = await getUserPlanLimits(session.user.id);
      if (!limits.canShareProjects) {
        return NextResponse.json(
          { 
            error: 'Project sharing not available',
            message: 'Project sharing is only available on Pro and Enterprise plans. Upgrade to share your projects.',
          },
          { status: 403 }
        );
      }
    }

    const shareToken = isShared ? uuidv4() : null;

    const result = await db.query(
      `UPDATE projects 
       SET is_shared = $1, share_token = $2
       WHERE id = $3
       RETURNING share_token`,
      [isShared, shareToken, id]
    );

    return NextResponse.json({
      shareToken: result.rows[0].share_token,
      shareUrl: shareToken ? `${request.nextUrl.origin}/share/${shareToken}` : null
    });
  } catch (error) {
    console.error('Share project error:', error);
    return NextResponse.json(
      { error: 'Failed to update sharing' },
      { status: 500 }
    );
  }
}

