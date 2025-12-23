import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { sendEmail } from '@/lib/email';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type ReminderRow = {
  email: string;
  plan: string;
  current_period_end: Date | null;
  trial_end: Date | null;
};

export async function GET(_req: NextRequest) {
  const db = getPool();

  // Fetch subscriptions that renew within 5 days or trial ends within 5 days
  const { rows } = await db.query<ReminderRow>(
    `
      SELECT u.email, s.plan, s.current_period_end, s.trial_end
      FROM subscriptions s
      JOIN users u ON u.id = s.user_id
      WHERE s.status IN ('active', 'trialing')
        AND (
          (s.current_period_end IS NOT NULL AND s.current_period_end BETWEEN NOW() AND NOW() + INTERVAL '5 days')
          OR (s.trial_end IS NOT NULL AND s.trial_end BETWEEN NOW() AND NOW() + INTERVAL '5 days')
        )
    `
  );

  let sent = 0;
  for (const row of rows) {
    const planLabel =
      row.plan === 'starter'
        ? 'Starter'
        : row.plan === 'pro'
        ? 'Pro'
        : row.plan === 'enterprise'
        ? 'Enterprise'
        : row.plan;

    const renewalDate = row.current_period_end
      ? new Date(row.current_period_end).toLocaleDateString()
      : null;
    const trialDate = row.trial_end ? new Date(row.trial_end).toLocaleDateString() : null;

    const isTrialEnding = row.trial_end && (!row.current_period_end || row.trial_end < row.current_period_end);

    const subject = isTrialEnding
      ? `Your ${planLabel} trial ends soon`
      : `Your ${planLabel} renews soon`;

    const text = isTrialEnding
      ? `Hi, your ${planLabel} trial will end on ${trialDate}. To keep access, ensure your payment details are up to date.`
      : `Hi, your ${planLabel} plan will renew on ${renewalDate}. If needed, update your payment method before renewal.`;

    try {
      await sendEmail({
        to: row.email,
        subject,
        text,
      });
      sent++;
    } catch (err) {
      console.error('Reminder email failed for', row.email, err);
    }
  }

  return NextResponse.json({ sent, total: rows.length });
}

