import { getPool } from './db';

// Check if an email is in the admin list (unlimited free access)
export async function isAdminEmail(email: string): Promise<boolean> {
  const db = getPool();
  const result = await db.query(
    'SELECT id FROM admin_emails WHERE LOWER(email) = LOWER($1)',
    [email]
  );
  return result.rows.length > 0;
}

// Get user email by ID
export async function getUserEmail(userId: string): Promise<string | null> {
  const db = getPool();
  const result = await db.query('SELECT email FROM users WHERE id = $1', [userId]);
  return result.rows[0]?.email || null;
}

export type Plan = 'free' | 'starter' | 'pro' | 'enterprise';
export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete' | 'incomplete_expired';

export interface UserPlan {
  plan: Plan;
  status: SubscriptionStatus;
  startDate: Date | null;
  endDate: Date | null;
  trialEndDate: Date | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
}

export interface PlanLimits {
  maxProjects: number;
  maxExports: number;
  maxAiGenerations: number;
  canCustomizeBrand: boolean;      // Full brand customization (legacy, kept for compatibility)
  canCustomizeBrandColors: boolean; // Colors, fonts, handle - available to all
  canUploadLogo: boolean;           // Logo upload - paid only
  canShareProjects: boolean;
  hasAdvancedAi: boolean;
  hasPremiumTemplates: boolean;
}

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  free: {
    maxProjects: 5,
    maxExports: 5,
    maxAiGenerations: 5,
    canCustomizeBrand: false,
    canCustomizeBrandColors: true,  // Free users CAN customize colors/fonts
    canUploadLogo: false,            // Free users CANNOT upload logo
    canShareProjects: false,
    hasAdvancedAi: false,
    hasPremiumTemplates: false,
  },
  starter: {
    maxProjects: Infinity,
    maxExports: Infinity,
    maxAiGenerations: 20,
    canCustomizeBrand: true,
    canCustomizeBrandColors: true,
    canUploadLogo: true,
    canShareProjects: true,
    hasAdvancedAi: false,
    hasPremiumTemplates: true,
  },
  pro: {
    maxProjects: Infinity,
    maxExports: Infinity,
    maxAiGenerations: Infinity,
    canCustomizeBrand: true,
    canCustomizeBrandColors: true,
    canUploadLogo: true,
    canShareProjects: true,
    hasAdvancedAi: true,
    hasPremiumTemplates: true,
  },
  enterprise: {
    maxProjects: Infinity,
    maxExports: Infinity,
    maxAiGenerations: Infinity,
    canCustomizeBrand: true,
    canCustomizeBrandColors: true,
    canUploadLogo: true,
    canShareProjects: true,
    hasAdvancedAi: true,
    hasPremiumTemplates: true,
  },
};

// Get user's current plan
export async function getUserPlan(userId: string): Promise<UserPlan> {
  const db = getPool();
  const result = await db.query(
    `SELECT email, plan, subscription_status, subscription_start_date, subscription_end_date, 
            trial_end_date, stripe_customer_id, stripe_subscription_id
     FROM users WHERE id = $1`,
    [userId]
  );

  if (result.rows.length === 0) {
    return {
      plan: 'free',
      status: 'active',
      startDate: null,
      endDate: null,
      trialEndDate: null,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
    };
  }

  const row = result.rows[0];
  
  // Check if user is an admin (unlimited free access)
  const isAdmin = await isAdminEmail(row.email);
  if (isAdmin) {
    return {
      plan: 'enterprise',
      status: 'active',
      startDate: null,
      endDate: null,
      trialEndDate: null,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
    };
  }

  return {
    plan: (row.plan || 'free') as Plan,
    status: (row.subscription_status || 'active') as SubscriptionStatus,
    startDate: row.subscription_start_date,
    endDate: row.subscription_end_date,
    trialEndDate: row.trial_end_date,
    stripeCustomerId: row.stripe_customer_id,
    stripeSubscriptionId: row.stripe_subscription_id,
  };
}

// Check if user's subscription is active
export async function isSubscriptionActive(userId: string): Promise<boolean> {
  const userPlan = await getUserPlan(userId);
  
  if (userPlan.plan === 'free') {
    return true; // Free plan is always "active"
  }

  if (userPlan.status === 'active' || userPlan.status === 'trialing') {
    // Check if subscription hasn't expired
    if (userPlan.endDate && new Date(userPlan.endDate) < new Date()) {
      return false;
    }
    return true;
  }

  return false;
}

// Get plan limits for user
export async function getUserPlanLimits(userId: string): Promise<PlanLimits> {
  const userPlan = await getUserPlan(userId);
  const isActive = await isSubscriptionActive(userId);
  
  // If subscription is not active, downgrade to free
  const effectivePlan = isActive ? userPlan.plan : 'free';
  return PLAN_LIMITS[effectivePlan];
}

// Update user's plan
export async function updateUserPlan(
  userId: string,
  plan: Plan,
  status: SubscriptionStatus,
  stripeCustomerId?: string,
  stripeSubscriptionId?: string,
  startDate?: Date,
  endDate?: Date,
  trialEndDate?: Date
): Promise<void> {
  const db = getPool();
  
  await db.query(
    `UPDATE users 
     SET plan = $1, 
         subscription_status = $2,
         subscription_start_date = $3,
         subscription_end_date = $4,
         trial_end_date = $5,
         stripe_customer_id = COALESCE($6, stripe_customer_id),
         stripe_subscription_id = COALESCE($7, stripe_subscription_id),
         updated_at = NOW()
     WHERE id = $8`,
    [plan, status, startDate || null, endDate || null, trialEndDate || null, 
     stripeCustomerId || null, stripeSubscriptionId || null, userId]
  );

  // Also create/update subscription record
  if (stripeSubscriptionId) {
    await db.query(
      `INSERT INTO subscriptions (user_id, plan, status, stripe_subscription_id, stripe_customer_id, 
                                  current_period_start, current_period_end, trial_start, trial_end)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (stripe_subscription_id) 
       DO UPDATE SET 
         plan = $2,
         status = $3,
         current_period_start = $6,
         current_period_end = $7,
         trial_start = $8,
         trial_end = $9,
         updated_at = NOW()`,
      [userId, plan, status, stripeSubscriptionId, stripeCustomerId || null,
       startDate || null, endDate || null, trialEndDate ? new Date(trialEndDate.getTime() - 14 * 24 * 60 * 60 * 1000) : null, trialEndDate || null]
    );
  }
}

// Track usage (exports, AI generations, etc.)
export async function trackUsage(
  userId: string,
  usageType: 'export' | 'ai_generation' | 'project_creation',
  increment: number = 1
): Promise<{ current: number; limit: number; canUse: boolean }> {
  const db = getPool();
  const limits = await getUserPlanLimits(userId);
  
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1); // Start of current month
  
  // Get or create usage record
  let result = await db.query(
    `SELECT usage_count FROM subscription_usage 
     WHERE user_id = $1 AND usage_type = $2 AND period_start = $3`,
    [userId, usageType, periodStart]
  );

  let currentCount = 0;
  if (result.rows.length > 0) {
    currentCount = result.rows[0].usage_count || 0;
  }

  // Determine limit based on usage type
  let limit: number;
  if (usageType === 'export') {
    limit = limits.maxExports;
  } else if (usageType === 'ai_generation') {
    limit = limits.maxAiGenerations;
  } else {
    limit = limits.maxProjects;
  }

  const canUse = limit === Infinity || currentCount < limit;

  if (canUse && increment > 0) {
    // Update or insert usage
    await db.query(
      `INSERT INTO subscription_usage (user_id, usage_type, usage_count, limit_count, period_start, period_end)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (user_id, usage_type, period_start)
       DO UPDATE SET usage_count = subscription_usage.usage_count + $3, updated_at = NOW()`,
      [userId, usageType, increment, limit, periodStart, new Date(now.getFullYear(), now.getMonth() + 1, 0)]
    );
    currentCount += increment;
  }

  return {
    current: currentCount,
    limit,
    canUse: limit === Infinity || currentCount < limit,
  };
}

// Get current usage
export async function getCurrentUsage(userId: string): Promise<{
  exports: { current: number; limit: number };
  aiGenerations: { current: number; limit: number };
  projects: { current: number; limit: number };
}> {
  const db = getPool();
  const limits = await getUserPlanLimits(userId);
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [exportsResult, aiResult, projectsResult] = await Promise.all([
    db.query(
      `SELECT usage_count FROM subscription_usage 
       WHERE user_id = $1 AND usage_type = 'export' AND period_start = $2`,
      [userId, periodStart]
    ),
    db.query(
      `SELECT usage_count FROM subscription_usage 
       WHERE user_id = $1 AND usage_type = 'ai_generation' AND period_start = $2`,
      [userId, periodStart]
    ),
    db.query(
      `SELECT COUNT(*) as count FROM projects WHERE user_id = $1`,
      [userId]
    ),
  ]);

  return {
    exports: {
      current: exportsResult.rows[0]?.usage_count || 0,
      limit: limits.maxExports,
    },
    aiGenerations: {
      current: aiResult.rows[0]?.usage_count || 0,
      limit: limits.maxAiGenerations,
    },
    projects: {
      current: parseInt(projectsResult.rows[0]?.count || '0'),
      limit: limits.maxProjects,
    },
  };
}


