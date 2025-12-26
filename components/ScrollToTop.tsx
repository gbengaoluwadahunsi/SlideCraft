"use client";

import { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

export const ScrollToTop = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    toggleVisibility(); // Check initial scroll position
    
    return () => {
      window.removeEventListener('scroll', toggleVisibility);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  // Don't render anything on server or before mount to avoid hydration mismatch
  if (!isMounted || !isVisible) {
    return null;
  }

  return (
    <button
      onClick={scrollToTop}
      className="fixed bottom-4 right-4 md:bottom-8 md:right-8 z-[60] p-3 rounded-full bg-[#ffd700] text-black shadow-xl transition-all hover:scale-110 hover:bg-yellow-400 active:scale-95 animate-in fade-in slide-in-from-bottom-4"
      title="Scroll to Top"
      suppressHydrationWarning
    >
      <ArrowUp size={24} />
    </button>
  );
};

