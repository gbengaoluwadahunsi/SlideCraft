import { auth } from '@/lib/auth';

// Helper function to get session in App Router API routes
export async function getSession() {
  return await auth();
}

