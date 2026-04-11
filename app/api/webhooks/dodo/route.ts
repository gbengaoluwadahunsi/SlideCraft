import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getPool } from '@/lib/db';
import { updateUserPlan, Plan, SubscriptionStatus } from '@/lib/subscription';
import { sendEmail } from '@/lib/email';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface DodoWebhookData {
  product_id?: string;
  product?: { id: string; name: string };
  product_name?: string;
  product_name_raw?: string;
  amount?: number;
  total_amount?: number;
  customer?: { email?: string };
  email?: string;
  next_billing_date?: string;
  next_billing_at?: string;
  cancel_at_next_billing_date?: boolean;
}

interface DodoWebhookEvent {
  type?: string;
  data?: DodoWebhookData;
}

function verifySignature(rawBody: string, req: NextRequest): boolean {
  const secret = process.env.DODO_WEBHOOK_SECRET || process.env.DODO_WEBHOOK_SECRET_LOCAL;
  if (!secret) return false;

  const signatureHeader = req.headers.get('x-dodo-signature') || req.headers.get('x-dodopayments-signature');
  const timestamp = req.headers.get('x-dodo-timestamp');
  if (!signatureHeader || !timestamp) return false;

  const expected = crypto.createHmac('sha256', secret).update(`${timestamp}.${rawBody}`).digest('hex');

  const safeEqual = (a: string, b: string) => a.length === b.length && crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));

  return safeEqual(signatureHeader, expected);
}

function resolvePlan(data: DodoWebhookData): Plan | null {
  const productId = data?.product_id || data?.product?.id;
  const productName = (data?.product_name || data?.product?.name || '').toLowerCase();
  const amount = data?.amount ?? data?.total_amount ?? null;

  if (productId && process.env.DODO_STARTER_PRODUCT_ID && productId === process.env.DODO_STARTER_PRODUCT_ID) return 'starter';
  if (productId && process.env.DODO_PRO_PRODUCT_ID && productId === process.env.DODO_PRO_PRODUCT_ID) return 'pro';
  if (productName.includes('starter')) return 'starter';
  if (productName.includes('pro')) return 'pro';
  if (typeof amount === 'number') {
    if (amount <= 1200) return 'starter';
    if (amount > 1200) return 'pro';
  }
  return null;
}

async function findUserIdByEmail(email: string): Promise<string | null> {
  const db = getPool();
  const res = await db.query('SELECT id FROM users WHERE lower(email) = lower($1) LIMIT 1', [email]);
  return res.rows?.[0]?.id || null;
}

async function sendLifecycleEmail(params: { email: string; type: 'renewed' | 'failed' | 'on_hold' | 'cancel_at_period_end'; plan: Plan; nextBillingDate?: string | null }) {
  const { email, type, plan, nextBillingDate } = params;
  const planLabel = plan === 'starter' ? 'Starter' : plan === 'pro' ? 'Pro' : plan;
  const nextDateText = nextBillingDate ? `Next billing date: ${new Date(nextBillingDate).toLocaleDateString()}` : '';

  if (type === 'renewed') {
    await sendEmail({ to: email, subject: `Your ${planLabel} plan is active`, text: `Thanks for your payment. Your ${planLabel} plan is active. ${nextDateText}` });
  }
  if (type === 'failed' || type === 'on_hold') {
    await sendEmail({ to: email, subject: `Action needed: update payment for ${planLabel}`, text: `We couldn't process your payment for the ${planLabel} plan. Please update your payment method. ${nextDateText}` });
  }
  if (type === 'cancel_at_period_end') {
    await sendEmail({ to: email, subject: `Your ${planLabel} plan will end at period end`, text: `Your ${planLabel} plan is set to end at period end. ${nextDateText}` });
  }
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  if (!verifySignature(rawBody, req)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  let event: DodoWebhookEvent;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const type = event?.type;
  const data = event?.data || {};
  const customer = data?.customer || {};
  const email = customer.email || data?.email;
  const nextBillingDate = data?.next_billing_date || data?.next_billing_at || null;
  const cancelAtPeriodEnd = data?.cancel_at_next_billing_date || false;

  const relevantTypes = new Set(['subscription.active', 'subscription.renewed', 'subscription.on_hold', 'subscription.updated', 'payment.failed']);
  if (!relevantTypes.has(type || '')) {
    return NextResponse.json({ received: true });
  }

  if (!email) {
    console.error('Dodo webhook: missing customer email');
    return NextResponse.json({ error: 'Missing customer email' }, { status: 400 });
  }

  const userId = await findUserIdByEmail(email);
  if (!userId) {
    console.error('Dodo webhook: user not found for email', email);
    return NextResponse.json({ received: true });
  }

  const plan = resolvePlan(data);
  if (!plan) {
    console.error('Dodo webhook: could not resolve plan for data', data);
    return NextResponse.json({ received: true });
  }

  let status: SubscriptionStatus = 'active';
  if (type === 'subscription.on_hold' || type === 'payment.failed') {
    status = 'past_due';
  }

  try {
    await updateUserPlan(userId, plan, status);

    try {
      if (status === 'active' && (type === 'subscription.active' || type === 'subscription.renewed')) {
        await sendLifecycleEmail({ email, type: 'renewed', plan, nextBillingDate });
      }
      if (type === 'payment.failed') {
        await sendLifecycleEmail({ email, type: 'failed', plan, nextBillingDate });
      }
      if (type === 'subscription.on_hold') {
        await sendLifecycleEmail({ email, type: 'on_hold', plan, nextBillingDate });
      }
      if (type === 'subscription.updated' && cancelAtPeriodEnd) {
        await sendLifecycleEmail({ email, type: 'cancel_at_period_end', plan, nextBillingDate });
      }
    } catch (emailErr) {
      console.error('Dodo webhook: email send failed', emailErr);
    }
  } catch (err) {
    console.error('Dodo webhook: failed to update user plan', err);
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
