import { getPool } from './db';

const RATE_LIMIT_WINDOW = 60_000; // 60 seconds
const RATE_LIMIT_MAX = 5;

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const memoryCache = new Map<string, RateLimitEntry>();

export function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  
  // Check memory cache first (fast path for single-instance deployments)
  const cached = memoryCache.get(userId);
  if (cached && now <= cached.resetAt) {
    if (cached.count >= RATE_LIMIT_MAX) return false;
    cached.count++;
    return true;
  }
  
  // Create new entry or reset expired one
  memoryCache.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
  return true;
}

export async function checkRateLimitWithDB(userId: string): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const now = Date.now();
  const db = getPool();
  
  try {
    const result = await db.query(
      `INSERT INTO rate_limits (user_id, count, window_start, updated_at)
       VALUES ($1, 1, $2, NOW())
       ON CONFLICT (user_id) 
       DO UPDATE SET 
         count = CASE 
           WHEN rate_limits.window_start + interval '1 minute' > NOW() 
           THEN rate_limits.count + 1 
           ELSE 1 
         END,
         window_start = CASE 
           WHEN rate_limits.window_start + interval '1 minute' > NOW() 
           THEN rate_limits.window_start 
           ELSE NOW() 
         END,
         updated_at = NOW()
       RETURNING count, window_start`,
      [userId, new Date(now)]
    );
    
    const row = result.rows[0];
    const count = row.count;
    const resetAt = new Date(row.window_start).getTime() + RATE_LIMIT_WINDOW;
    const remaining = Math.max(0, RATE_LIMIT_MAX - count);
    
    return {
      allowed: count <= RATE_LIMIT_MAX,
      remaining,
      resetAt,
    };
  } catch {
    // Fallback to memory-only rate limiting if DB fails
    const cached = memoryCache.get(userId);
    if (cached && now <= cached.resetAt) {
      const remaining = Math.max(0, RATE_LIMIT_MAX - cached.count);
      return {
        allowed: cached.count < RATE_LIMIT_MAX,
        remaining,
        resetAt: cached.resetAt,
      };
    }
    
    memoryCache.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return {
      allowed: true,
      remaining: RATE_LIMIT_MAX - 1,
      resetAt: now + RATE_LIMIT_WINDOW,
    };
  }
}

export async function initRateLimitDB(): Promise<void> {
  const db = getPool();
  
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS rate_limits (
        user_id VARCHAR(255) PRIMARY KEY,
        count INTEGER DEFAULT 1,
        window_start TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_rate_limits_window 
      ON rate_limits(window_start)
    `);
  } catch (err) {
    console.warn('Failed to init rate_limits table:', err);
  }
}
