import NextAuth, { type NextAuthConfig } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { getPool } from './db';
import bcrypt from 'bcryptjs';

// Validate required environment variables
if (!process.env.AUTH_SECRET && !process.env.NEXTAUTH_SECRET) {
  console.warn('⚠️  AUTH_SECRET or NEXTAUTH_SECRET is not set. Authentication may not work properly.');
}

// Check if Google OAuth credentials are configured
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const isGoogleConfigured = googleClientId && googleClientSecret;

if (!isGoogleConfigured) {
  console.warn('⚠️  Google OAuth is not configured. GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set in your .env.local file.');
}

const authConfig: NextAuthConfig = {
  trustHost: true,
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  basePath: '/api/auth',
  providers: [
    // Only add Google provider if credentials are configured
    ...(isGoogleConfigured ? [
      GoogleProvider({
        clientId: googleClientId!,
        clientSecret: googleClientSecret!,
      })
    ] : []),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const db = getPool();
        const result = await db.query(
          'SELECT id, email, name, password_hash, email_verified FROM users WHERE email = $1',
          [credentials.email]
        );

        if (result.rows.length === 0) {
          return null;
        }

        const user = result.rows[0];
        
        // OAuth users don't have password_hash
        if (!user.password_hash) {
          return null;
        }

        const isValid = await bcrypt.compare(credentials.password, user.password_hash);

        if (!isValid) {
          return null;
        }

        // Check if email is verified
        // Only block if explicitly set to false (new users who haven't verified)
        // NULL or true values allow login (existing users are grandfathered in)
        if (user.email_verified === false) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name
        };
      }
    })
  ],
  session: {
    strategy: 'jwt'
  },
  pages: {
    signIn: '/login',
    signUp: '/register'
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google') {
        const db = getPool();
        const email = user.email;
        
        if (!email) return false;

        // Check if user exists
        const existingUser = await db.query(
          'SELECT id FROM users WHERE email = $1',
          [email]
        );

        if (existingUser.rows.length === 0) {
          // Create new user for OAuth - OAuth users are automatically verified
          const result = await db.query(
            'INSERT INTO users (email, name, password_hash, provider, email_verified) VALUES ($1, $2, $3, $4, $5) RETURNING id',
            [email, user.name || null, null, account.provider, true] // OAuth users don't have password and are auto-verified
          );
          user.id = result.rows[0].id;
        } else {
          // Update provider if not set and verify email for OAuth users
          await db.query(
            'UPDATE users SET provider = $1, email_verified = TRUE WHERE id = $2',
            [account.provider, existingUser.rows[0].id]
          );
          user.id = existingUser.rows[0].id;
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
      }
      if (account) {
        token.provider = account.provider;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    }
  }
};

// Initialize NextAuth with the config and export auth utilities
export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);

// Export config for backward compatibility
export { authConfig };

