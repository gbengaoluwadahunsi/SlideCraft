import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getPool, initDB } from '@/lib/db';
import { generateEmbedding } from '@/lib/embeddings';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { content, projectId, metadata = {} } = await request.json();

    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    await initDB();
    const db = getPool();

    // Generate embedding
    const embedding = await generateEmbedding(content);

    // Check if pgvector is available
    const hasPgVector = await checkPgVector(db);

    if (hasPgVector) {
      // Store with pgvector
      await db.query(
        `INSERT INTO carousel_embeddings (user_id, project_id, content, embedding, metadata)
         VALUES ($1, $2, $3, $4::vector, $5)
         ON CONFLICT DO NOTHING`,
        [
          session.user.id,
          projectId || null,
          content,
          JSON.stringify(embedding),
          JSON.stringify(metadata),
        ]
      );
    } else {
      // Store as JSONB (fallback)
      await db.query(
        `INSERT INTO carousel_embeddings (user_id, project_id, content, embedding, metadata)
         VALUES ($1, $2, $3, $4::jsonb, $5)
         ON CONFLICT DO NOTHING`,
        [
          session.user.id,
          projectId || null,
          content,
          JSON.stringify(embedding),
          JSON.stringify(metadata),
        ]
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('RAG store error:', error);
    return NextResponse.json(
      { error: 'Failed to store embedding' },
      { status: 500 }
    );
  }
}

async function checkPgVector(db: any): Promise<boolean> {
  try {
    const result = await db.query(
      `SELECT EXISTS(
        SELECT 1 FROM pg_extension WHERE extname = 'vector'
      ) as exists`
    );
    return result.rows[0]?.exists || false;
  } catch {
    return false;
  }
}


