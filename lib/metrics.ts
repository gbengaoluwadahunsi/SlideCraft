import { Pool } from 'pg';

// Use a single pool instance.
// Note: In Next.js dev mode, this might create multiple pools on hot reload,
// but for this scale it's acceptable. In prod it's fine.
let pool: Pool | null = null;

function getPool() {
  if (!pool) {
    if (!process.env.DATABASE_URL) {
      console.warn('DATABASE_URL not set. Metrics will not be persisted to DB.');
      return null;
    }
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false // Required for many hosted Postgres services like Neon
      }
    });
  }
  return pool;
}

// Create the table if it doesn't exist
async function initDB() {
  const db = getPool();
  if (!db) return;
  
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS daily_metrics (
        date DATE PRIMARY KEY,
        count INTEGER DEFAULT 0
      );
    `);
  } catch (err) {
    console.error('Failed to init metrics table:', err);
  }
}

const currentDateKey = () => new Date().toISOString().slice(0, 10);

export async function incrementAndGetMetrics() {
  const db = getPool();
  
  // Fallback to in-memory mock if no DB (or file system logic if we kept it, but simplifying to DB-first)
  if (!db) {
    return { todayCreations: 0, totalCreations: 0 };
  }

  await initDB();
  const todayKey = currentDateKey();

  try {
    // Upsert: Insert 1 for today, or increment if exists
    await db.query(`
      INSERT INTO daily_metrics (date, count)
      VALUES ($1, 1)
      ON CONFLICT (date)
      DO UPDATE SET count = daily_metrics.count + 1;
    `, [todayKey]);

    return getMetricsSummary();
  } catch (error) {
    console.error('Metrics increment failed:', error);
    return { todayCreations: 0, totalCreations: 0 };
  }
}

export async function getMetricsSummary() {
  const db = getPool();
  if (!db) return { todayCreations: 0, totalCreations: 0 };

  await initDB();
  const todayKey = currentDateKey();

  try {
    const todayRes = await db.query('SELECT count FROM daily_metrics WHERE date = $1', [todayKey]);
    const totalRes = await db.query('SELECT SUM(count) as total FROM daily_metrics');

    return {
      todayCreations: parseInt(todayRes.rows[0]?.count || '0', 10),
      totalCreations: parseInt(totalRes.rows[0]?.total || '0', 10),
    };
  } catch (error) {
    console.error('Metrics fetch failed:', error);
    return { todayCreations: 0, totalCreations: 0 };
  }
}
