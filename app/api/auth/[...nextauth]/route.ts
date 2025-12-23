import NextAuth from 'next-auth';
import { authConfig } from '@/lib/auth';

// Initialize NextAuth with the config
const handler = NextAuth(authConfig);

// Export handlers and auth function
export const { handlers, auth, signIn, signOut } = handler;

export const GET = handlers.GET;
export const POST = handlers.POST;

// Export for use in API routes
export { authConfig as authOptions };

