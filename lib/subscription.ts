import { getPool } from './db';

async function retryDatabaseOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 100
): Promise<T> {
  let lastError: Error | undefined;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      const isConnectionError = 
        lastError.message.includes('Connection terminated') ||
        lastError.message.includes('Client has encountered a connection error') ||
        lastError.message.includes('Connection closed unexpectedly') ||
        lastError.message.includes('ECONNREFUSED') ||
        lastError.message.includes('ETIMEDOUT');
      
      if (isConnectionError && attempt < maxRetries - 1) {
        console.warn(`Database connection error on attempt ${attempt + 1}, retrying...`, lastError.message);
        await new Promise(resolve => setTimeout(resolve, delayMs * (attempt + 1)));
        continue;
      }
      throw lastError;
    }
  }
  
  throw lastError || new Error('Operation failed');
}

export async function isAdminEmail(email: string): Promise<boolean> {
  return retryDatabaseOperation(async () => {
    const db = getPool();
    const result = await db.query(
      'SELECT id FROM admin_emails WHERE LOWER(email) = LOWER($1)',
      [email]
    );
    return result.rows.length > 0;
  });
}

export async function getUserEmail(userId: string): Promise<string | null> {
  return retryDatabaseOperation(async () => {
    const db = getPool();
    const result = await db.query('SELECT email FROM users WHERE id = $1', [userId]);
    return result.rows[0]?.email || null;
  });
}

export type Plan = 'free' | 'starter' | 'pro' | 'enterprise';
export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete' | 'incomplete_expired';

export interface UserPlan {
  plan: Plan;
  status: SubscriptionStatus;
  startDate: Date | null;
  endDate: Date | null;
  trialEndDate: Date | null;
  paystackCustomerCode: string | null;
  paystackSubscriptionCode: string | null;
  paystackEmailToken: string | null;
}

export interface PlanLimits {
  maxProjects: number;
  maxExports: number;
  maxAiGenerations: number;
  canCustomizeBrand: boolean;
  canCustomizeBrandColors: boolean;
  canUploadLogo: boolean;
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
    canCustomizeBrandColors: true,
    canUploadLogo: false,
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

export async function getUserPlan(userId: string): Promise<UserPlan> {
  return retryDatabaseOperation(async () => {
    const db = getPool();
    const result = await db.query(
      `SELECT email, plan, subscription_status, subscription_start_date, subscription_end_date, 
              trial_end_date, paystack_customer_code, paystack_subscription_code, paystack_email_token
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
        paystackCustomerCode: null,
        paystackSubscriptionCode: null,
        paystackEmailToken: null,
      };
    }

    const row = result.rows[0];
    
    const isAdmin = await isAdminEmail(row.email);
    if (isAdmin) {
      return {
        plan: 'enterprise',
        status: 'active',
        startDate: null,
        endDate: null,
        trialEndDate: null,
        paystackCustomerCode: null,
        paystackSubscriptionCode: null,
        paystackEmailToken: null,
      };
    }

    return {
      plan: (row.plan || 'free') as Plan,
      status: (row.subscription_status || 'active') as SubscriptionStatus,
      startDate: row.subscription_start_date,
      endDate: row.subscription_end_date,
      trialEndDate: row.trial_end_date,
      paystackCustomerCode: row.paystack_customer_code,
      paystackSubscriptionCode: row.paystack_subscription_code,
      paystackEmailToken: row.paystack_email_token,
    };
  });
}

export async function isSubscriptionActive(userId: string): Promise<boolean> {
  const userPlan = await getUserPlan(userId);
  
  if (userPlan.plan === 'free') {
    return true;
  }

  if (userPlan.status === 'active' || userPlan.status === 'trialing') {
    if (userPlan.endDate && new Date(userPlan.endDate) < new Date()) {
      return false;
    }
    return true;
  }

  return false;
}

export async function getUserPlanLimits(userId: string): Promise<PlanLimits> {
  const userPlan = await getUserPlan(userId);
  const isActive = await isSubscriptionActive(userId);
  
  const effectivePlan = isActive ? userPlan.plan : 'free';
  return PLAN_LIMITS[effectivePlan];
}

export async function updateUserPlan(
  userId: string,
  plan: Plan,
  status: SubscriptionStatus,
  paystackCustomerCode?: string,
  paystackSubscriptionCode?: string,
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
         paystack_customer_code = COALESCE($6, paystack_customer_code),
         paystack_subscription_code = COALESCE($7, paystack_subscription_code),
         updated_at = NOW()
     WHERE id = $8`,
    [plan, status, startDate || null, endDate || null, trialEndDate || null, 
     paystackCustomerCode || null, paystackSubscriptionCode || null, userId]
  );

  if (paystackSubscriptionCode) {
    await db.query(
      `INSERT INTO subscriptions (user_id, plan, status, paystack_subscription_code, paystack_customer_code, 
                                  current_period_start, current_period_end, trial_start, trial_end)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (paystack_subscription_code) 
       DO UPDATE SET 
         plan = $2,
         status = $3,
         current_period_start = $6,
         current_period_end = $7,
         trial_start = $8,
         trial_end = $9,
         updated_at = NOW()`,
      [userId, plan, status, paystackSubscriptionCode, paystackCustomerCode || null,
       startDate || null, endDate || null, trialEndDate ? new Date(trialEndDate.getTime() - 14 * 24 * 60 * 60 * 1000) : null, trialEndDate || null]
    );
  }
}

export async function trackUsage(
  userId: string,
  usageType: 'export' | 'ai_generation' | 'project_creation',
  increment: number = 1
): Promise<{ current: number; limit: number; canUse: boolean }> {
  return retryDatabaseOperation(async () => {
    const db = getPool();
    const limits = await getUserPlanLimits(userId);
    
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    let result = await db.query(
      `SELECT usage_count FROM subscription_usage 
       WHERE user_id = $1 AND usage_type = $2 AND period_start = $3`,
      [userId, usageType, periodStart]
    );

    let currentCount = 0;
    if (result.rows.length > 0) {
      currentCount = result.rows[0].usage_count || 0;
    }

    let limit: number;
    if (usageType === 'export') {
      limit = limits.maxExports;
    } else if (usageType === 'ai_generation') {
      limit = limits.maxAiGenerations;
    } else {
      limit = limits.maxProjects;
    }

    const isUnlimited = !Number.isFinite(limit) || limit === Infinity;
    const canUse = isUnlimited || currentCount < limit;

    if (canUse && increment > 0) {
      const dbLimit = isUnlimited ? null : limit;
      await db.query(
        `INSERT INTO subscription_usage (user_id, usage_type, usage_count, limit_count, period_start, period_end)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (user_id, usage_type, period_start)
         DO UPDATE SET usage_count = subscription_usage.usage_count + $3, updated_at = NOW()`,
        [userId, usageType, increment, dbLimit, periodStart, new Date(now.getFullYear(), now.getMonth() + 1, 0)]
      );
      currentCount += increment;
    }

    return {
      current: currentCount,
      limit: isUnlimited ? Infinity : limit,
      canUse: isUnlimited || currentCount < limit,
    };
  });
}

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
