import { auth } from '@/app/api/auth/[...nextauth]/route';

// Helper function to get session in App Router API routes
export async function getSession() {
  return await auth();
}

