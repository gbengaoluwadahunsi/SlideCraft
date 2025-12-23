import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Streaming is deprecated - use /api/generate instead
export async function POST() {
  // Return 501 Not Implemented so clients fall back to regular endpoint
  return NextResponse.json(
    { error: 'Streaming not available. Use /api/generate instead.' },
    { status: 501 }
  );
}

