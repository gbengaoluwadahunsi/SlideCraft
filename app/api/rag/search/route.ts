import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { getPool, initDB } from '@/lib/db';
import { generateEmbedding, cosineSimilarity } from '@/lib/embeddings';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { query, limit = 5, userId } = await request.json();

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    await initDB();
    const db = getPool();

    // Generate embedding for the query
    const queryEmbedding = await generateEmbedding(query);

    // Check if pgvector is available
    const hasPgVector = await checkPgVector(db);

    let results;

    if (hasPgVector) {
      // Use pgvector for efficient similarity search
      results = await db.query(
        `SELECT 
          ce.id,
          ce.content,
          ce.metadata,
          ce.project_id,
          p.name as project_name,
          ce.created_at,
          1 - (ce.embedding <=> $1::vector) as similarity
        FROM carousel_embeddings ce
        LEFT JOIN projects p ON ce.project_id = p.id
        WHERE ce.user_id = $2
        ORDER BY ce.embedding <=> $1::vector
        LIMIT $3`,
        [JSON.stringify(queryEmbedding), userId || session.user.id, limit]
      );
    } else {
      // Fallback: fetch all and calculate similarity in memory
      const allEmbeddings = await db.query(
        `SELECT 
          ce.id,
          ce.content,
          ce.metadata,
          ce.project_id,
          p.name as project_name,
          ce.created_at,
          ce.embedding
        FROM carousel_embeddings ce
        LEFT JOIN projects p ON ce.project_id = p.id
        WHERE ce.user_id = $1
        LIMIT 100`,
        [userId || session.user.id]
      );

      // Calculate similarities
      const withSimilarity = allEmbeddings.rows.map((row: any) => {
        let embedding: number[] = [];
        try {
          embedding = typeof row.embedding === 'string' 
            ? JSON.parse(row.embedding) 
            : row.embedding;
        } catch {
          embedding = [];
        }
        
        const similarity = embedding.length > 0 
          ? cosineSimilarity(queryEmbedding, embedding)
          : 0;

        return {
          ...row,
          similarity,
          embedding: undefined, // Remove from response
        };
      });

      // Sort by similarity and limit
      results = {
        rows: withSimilarity
          .sort((a, b) => b.similarity - a.similarity)
          .slice(0, limit),
      };
    }

    return NextResponse.json({
      results: results.rows.map((row: any) => ({
        id: row.id,
        content: row.content,
        metadata: row.metadata,
        projectId: row.project_id,
        projectName: row.project_name,
        similarity: row.similarity,
        createdAt: row.created_at,
      })),
    });
  } catch (error) {
    console.error('RAG search error:', error);
    return NextResponse.json(
      { error: 'Failed to search' },
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


