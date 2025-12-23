import { handlers, authConfig } from '@/lib/auth';

// Export handlers for the route
export const GET = handlers.GET;
export const POST = handlers.POST;

// Export for use in API routes
export { authConfig as authOptions };
