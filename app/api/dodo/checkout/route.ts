import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PRODUCT_IDS: Record<string, string | undefined> = {
  starter: process.env.DODO_STARTER_PRODUCT_ID,
  pro: process.env.DODO_PRO_PRODUCT_ID,
};

const checkoutRequestSchema = z.object({
  plan: z.enum(['starter', 'pro']),
});

export async function POST(request: NextRequest) {
  if (process.env.DODO_CHECKOUT_ENABLED !== 'true') {
    return NextResponse.json({ error: 'Checkout disabled', url: null }, { status: 200 });
  }

  if (process.env.NEXT_PHASE === 'phase-production-build') {
    return NextResponse.json({ error: 'Checkout disabled during build', url: null }, { status: 200 });
  }

  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: 'Unauthorized', url: null }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON', url: null }, { status: 400 });
  }

  const validation = checkoutRequestSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json({ error: 'Invalid plan', url: null }, { status: 400 });
  }

  const plan = validation.data.plan;
  const productId = PRODUCT_IDS[plan];
  if (!productId) {
    return NextResponse.json({ error: 'Product ID not configured', url: null }, { status: 500 });
  }

  const apiKey = process.env.DODO_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Dodo API key not configured', url: null }, { status: 500 });
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
      return NextResponse.json({ error: 'Failed to create checkout session', url: null }, { status: 500 });
    }

    const data = await resp.json() as { checkout_url?: string; url?: string };
    const url = data.checkout_url || data.url;
    if (!url) {
      return NextResponse.json({ error: 'Checkout URL not returned', url: null }, { status: 500 });
    }

    return NextResponse.json({ url });
  } catch (error) {
    console.error('Dodo checkout error:', error);
    return NextResponse.json({ error: 'Failed to create checkout session', url: null }, { status: 500 });
  }
}
