import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PRODUCT_IDS: Record<string, string | undefined> = {
  starter: process.env.DODO_STARTER_PRODUCT_ID,
  pro: process.env.DODO_PRO_PRODUCT_ID,
};

export async function POST(request: NextRequest) {
  // Allow disabling checkout in build/local by not setting DODO_CHECKOUT_ENABLED=true
  if (process.env.DODO_CHECKOUT_ENABLED !== 'true') {
    return NextResponse.json({ error: 'Checkout disabled', url: null }, { status: 200 });
  }

  // Avoid hitting external APIs during build-time page data collection
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return NextResponse.json({ error: 'Checkout disabled during build', url: null }, { status: 200 });
  }

  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: 'Unauthorized', url: null }, { status: 200 });
  }

  let body: any = {};
  try {
    body = await request.json();
  } catch (err) {
    // ignore malformed JSON, will fail validation below
  }

  const plan = body?.plan?.toLowerCase?.();
  if (!plan || !['starter', 'pro'].includes(plan)) {
    return NextResponse.json({ error: 'Invalid plan', url: null }, { status: 200 });
  }

  const productId = PRODUCT_IDS[plan];
  if (!productId) {
    return NextResponse.json({ error: 'Product ID not configured', url: null }, { status: 200 });
  }

  const apiKey = process.env.DODO_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Dodo API key not configured', url: null }, { status: 200 });
  }

  const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard?payment=success`;

  try {
    const resp = await fetch('https://api.dodopayments.com/checkouts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        product_cart: [{ product_id: productId, quantity: 1 }],
        customer: {
          email: session.user.email,
          name: session.user.name || session.user.email,
        },
        return_url: returnUrl,
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error('Dodo checkout create failed:', errText);
      return NextResponse.json({ error: 'Failed to create checkout session', url: null }, { status: 200 });
    }

    const data = await resp.json();
    const url = data.checkout_url || data.url;
    if (!url) {
      return NextResponse.json({ error: 'Checkout URL not returned', url: null }, { status: 200 });
    }

    return NextResponse.json({ url });
  } catch (error) {
    console.error('Dodo checkout error:', error);
    return NextResponse.json({ error: 'Failed to create checkout session', url: null }, { status: 200 });
  }
}

