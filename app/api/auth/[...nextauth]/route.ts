import { handlers } from '@/lib/auth';

// Next.js 16 route handlers only allow GET/POST etc. — auth config is in @/lib/auth as authConfig
export const GET = handlers.GET;
export const POST = handlers.POST;
