import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getUserPlan } from '@/lib/subscription';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json({ error: 'Payment provider not configured' }, { status: 500 });
    }

    const userPlan = await getUserPlan(session.user.id);
    const subscriptionCode = userPlan.paystackSubscriptionCode;
    const emailToken = userPlan.paystackEmailToken;

    if (!subscriptionCode || !emailToken) {
      return NextResponse.json(
        { error: 'No active subscription found to cancel' },
        { status: 400 }
      );
    }

    const resp = await fetch('https://api.paystack.co/subscription/disable', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${secretKey}`,
      },
      body: JSON.stringify({
        code: subscriptionCode,
        token: emailToken,
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error('Paystack cancel subscription failed:', errText);
      return NextResponse.json({ error: 'Failed to cancel subscription' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Subscription canceled' });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
}
