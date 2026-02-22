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
        { error: 'No subscription found to resume' },
        { status: 400 }
      );
    }

    const resp = await fetch('https://api.paystack.co/subscription/enable', {
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
      console.error('Paystack resume subscription failed:', errText);
      return NextResponse.json({ error: 'Failed to resume subscription' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Subscription resumed' });
  } catch (error) {
    console.error('Resume subscription error:', error);
    return NextResponse.json(
      { error: 'Failed to resume subscription' },
      { status: 500 }
    );
  }
}
