import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { AgentOrchestrator } from '@/lib/agents/orchestrator';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { topic, slideCount, writingStyle, enhance, designReview } = await request.json();

    if (!topic) {
      return NextResponse.json(
        { error: 'Topic is required' },
        { status: 400 }
      );
    }

    const orchestrator = new AgentOrchestrator();
    
    const result = await orchestrator.executeWorkflow({
      topic,
      slideCount: slideCount || 6,
      writingStyle: writingStyle || 'Professional',
      enhance: enhance || false,
      designReview: designReview || false,
    });

    // Add IDs to slides
    const slidesWithIds = (result.slides || []).map((slide: any) => ({
      ...slide,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    }));

    return NextResponse.json({
      research: result.research,
      slides: slidesWithIds,
      enhanced: result.enhanced,
      designRecommendations: result.designRecommendations,
    });
  } catch (error) {
    console.error('Agent workflow error:', error);
    return NextResponse.json(
      { error: 'Failed to execute workflow' },
      { status: 500 }
    );
  }
}


