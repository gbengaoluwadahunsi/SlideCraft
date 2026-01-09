import { Pool } from 'pg';

let pool: Pool | null = null;

export function getPool() {
  if (!pool) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL not set');
    }
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      },
      max: 10, // Reduced pool size for better connection management
      idleTimeoutMillis: 60000, // Close idle clients after 60 seconds
      connectionTimeoutMillis: 30000, // Increased timeout to 30 seconds
      keepAlive: true, // Keep TCP connection alive
      keepAliveInitialDelayMillis: 5000, // Faster keepalive probe
      statement_timeout: 30000, // Query timeout 30 seconds
    });
    
    // Handle pool errors to prevent crashes
    pool.on('error', (err) => {
      console.error('Unexpected error on idle database client', err);
      // Reset pool on critical errors
      if (err.message.includes('Connection terminated')) {
        pool = null;
      }
    });
  }
  return pool;
}

// Helper function to execute query with retry
export async function queryWithRetry<T>(
  queryFn: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  let lastError: Error | null = null;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await queryFn();
    } catch (err: any) {
      lastError = err;
      console.error(`Database query attempt ${i + 1} failed:`, err.message);
      
      // Reset pool on connection errors
      if (err.message.includes('Connection terminated') || 
          err.message.includes('timeout') ||
          err.message.includes('ECONNREFUSED')) {
        pool = null;
      }
      
      if (i < maxRetries - 1) {
        // Wait before retry: 1s, 2s, 3s
        await new Promise(r => setTimeout(r, 1000 * (i + 1)));
      }
    }
  }
  throw lastError;
}

// Initialize database schema
export async function initDB() {
  const db = getPool();
  
  try {
    // Users table
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255),
        password_hash VARCHAR(255),
        provider VARCHAR(50),
        email_verified BOOLEAN DEFAULT FALSE,
        verification_token VARCHAR(255),
        verification_token_expires TIMESTAMP,
        reset_token VARCHAR(255),
        reset_token_expires TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    
    // Add new columns if they don't exist (for existing databases)
    await db.query(`
      DO $$ 
      BEGIN
        -- Add email_verified column if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'users' AND column_name = 'email_verified') THEN
          ALTER TABLE users ADD COLUMN email_verified BOOLEAN;
          -- Auto-verify existing users (they were created before verification was required)
          UPDATE users SET email_verified = TRUE WHERE email_verified IS NULL;
        END IF;
        
        ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token VARCHAR(255);
        ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token_expires TIMESTAMP;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255);
        ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMP;
        
        -- Subscription fields
        ALTER TABLE users ADD COLUMN IF NOT EXISTS plan VARCHAR(50) DEFAULT 'free';
        ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50) DEFAULT 'active';
        ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_start_date TIMESTAMP;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMP;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255);
        ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(255);
        ALTER TABLE users ADD COLUMN IF NOT EXISTS trial_end_date TIMESTAMP;
      END $$;
    `);
    
    // Ensure existing users without email_verified set are verified (grandfathered in)
    await db.query(`
      UPDATE users 
      SET email_verified = TRUE 
      WHERE email_verified IS NULL;
    `);

    // Projects table
    await db.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        slides JSONB NOT NULL,
        options JSONB DEFAULT '{}',
        is_shared BOOLEAN DEFAULT FALSE,
        share_token VARCHAR(255) UNIQUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        last_auto_saved_at TIMESTAMP
      );
    `);

    // Project history for undo/redo
    await db.query(`
      CREATE TABLE IF NOT EXISTS project_history (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
        slides JSONB NOT NULL,
        options JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Indexes for performance
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
      CREATE INDEX IF NOT EXISTS idx_projects_share_token ON projects(share_token);
      CREATE INDEX IF NOT EXISTS idx_project_history_project_id ON project_history(project_id);
    `);

    // User settings table for brand preferences
    await db.query(`
      CREATE TABLE IF NOT EXISTS user_settings (
        user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        brand_settings JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Index for user settings
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);
    `);

    // Subscriptions table for detailed tracking
    await db.query(`
      CREATE TABLE IF NOT EXISTS subscriptions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        plan VARCHAR(50) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'active',
        stripe_subscription_id VARCHAR(255) UNIQUE,
        stripe_customer_id VARCHAR(255),
        current_period_start TIMESTAMP,
        current_period_end TIMESTAMP,
        cancel_at_period_end BOOLEAN DEFAULT FALSE,
        canceled_at TIMESTAMP,
        trial_start TIMESTAMP,
        trial_end TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Subscription usage tracking
    await db.query(`
      CREATE TABLE IF NOT EXISTS subscription_usage (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        subscription_id UUID REFERENCES subscriptions(id) ON DELETE CASCADE,
        usage_type VARCHAR(50) NOT NULL,
        usage_count INTEGER DEFAULT 0,
        limit_count INTEGER,
        period_start TIMESTAMP,
        period_end TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, usage_type, period_start)
      );
    `);

    // Payment history
    await db.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
        stripe_payment_intent_id VARCHAR(255) UNIQUE,
        amount INTEGER NOT NULL,
        currency VARCHAR(10) DEFAULT 'usd',
        status VARCHAR(50) NOT NULL,
        plan VARCHAR(50) NOT NULL,
        billing_period_start TIMESTAMP,
        billing_period_end TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Indexes for subscriptions
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
      CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);
      CREATE INDEX IF NOT EXISTS idx_subscription_usage_user_id ON subscription_usage(user_id);
      CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
      CREATE INDEX IF NOT EXISTS idx_payments_stripe_payment_intent_id ON payments(stripe_payment_intent_id);
    `);

    // Metrics table (if not exists from previous setup)
    await db.query(`
      CREATE TABLE IF NOT EXISTS daily_metrics (
        date DATE PRIMARY KEY,
        count INTEGER DEFAULT 0
      );
    `);

    // Enable pgvector extension for RAG (if available)
    try {
      await db.query(`CREATE EXTENSION IF NOT EXISTS vector;`);
    } catch (err) {
      console.warn('pgvector extension not available. RAG features will use alternative approach.');
    }

    // Vector embeddings table for RAG
    await db.query(`
      CREATE TABLE IF NOT EXISTS carousel_embeddings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        embedding vector(1536), -- OpenAI embedding dimension
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Index for vector similarity search (if pgvector is available)
    try {
      await db.query(`
        CREATE INDEX IF NOT EXISTS idx_carousel_embeddings_vector 
        ON carousel_embeddings 
        USING ivfflat (embedding vector_cosine_ops)
        WITH (lists = 100);
      `);
    } catch (err) {
      // If pgvector not available, create regular index
      await db.query(`
        CREATE INDEX IF NOT EXISTS idx_carousel_embeddings_user_id 
        ON carousel_embeddings(user_id);
      `);
    }

    // Indexes for RAG
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_carousel_embeddings_project_id 
      ON carousel_embeddings(project_id);
    `);

    // Admin emails table - emails with unlimited free access
    await db.query(`
      CREATE TABLE IF NOT EXISTS admin_emails (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        note VARCHAR(500),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Index for admin emails lookup
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_admin_emails_email ON admin_emails(email);
    `);

    // Short URLs table for video links in exported PDFs
    await db.query(`
      CREATE TABLE IF NOT EXISTS short_urls (
        id VARCHAR(10) PRIMARY KEY,
        original_url TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        clicks INTEGER DEFAULT 0
      );
    `);

    // Index for short URLs
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_short_urls_created_at ON short_urls(created_at);
    `);
  } catch (err) {
    console.error('Failed to init database schema:', err);
    throw err;
  }
}

