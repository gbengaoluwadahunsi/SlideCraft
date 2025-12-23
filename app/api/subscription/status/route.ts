import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/api/auth/[...nextauth]/route';
import { getUserPlan, getCurrentUsage, getUserPlanLimits } from '@/lib/subscription';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [userPlan, usage, limits] = await Promise.all([
      getUserPlan(session.user.id),
      getCurrentUsage(session.user.id),
      getUserPlanLimits(session.user.id),
    ]);

    return NextResponse.json({
      plan: userPlan.plan,
      status: userPlan.status,
      startDate: userPlan.startDate,
      endDate: userPlan.endDate,
      trialEndDate: userPlan.trialEndDate,
      usage,
      limits,
      isActive: userPlan.status === 'active' || userPlan.status === 'trialing',
    });
  } catch (error) {
    console.error('Subscription status error:', error);
    return NextResponse.json(
      { error: 'Failed to get subscription status' },
      { status: 500 }
    );
  }
}


