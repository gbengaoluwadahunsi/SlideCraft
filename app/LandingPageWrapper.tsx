'use client';

import dynamic from 'next/dynamic';

// Dynamic import with SSR disabled to prevent hydration mismatches
// caused by Framer Motion animations and browser extensions
const LandingPageClient = dynamic(() => import('./LandingPageClient'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="animate-pulse">
        <div className="w-8 h-8 bg-[#ffd700] rounded-lg"></div>
      </div>
    </div>
  ),
});

export default function LandingPageWrapper() {
  return <LandingPageClient />;
}












