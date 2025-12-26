"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { usePathname } from 'next/navigation';

export interface AppContextState {
  // Current location
  currentPage: string;
  currentSection: string;
  
  // User actions
  currentAction: string | null;
  lastAction: string | null;
  actionTimestamp: number | null;
  
  // User state
  isFirstTimeUser: boolean;
  hasCompletedOnboarding: boolean;
  slideCount: number;
  hasExported: boolean;
  
  // Engagement
  timeOnCurrentPage: number;
  idleTime: number;
  isIdle: boolean;
}

interface AppContextValue extends AppContextState {
  // Actions
  setCurrentSection: (section: string) => void;
  setCurrentAction: (action: string | null) => void;
  setSlideCount: (count: number) => void;
  markExported: () => void;
  completeOnboarding: () => void;
  
  // Helpers
  getContextSummary: () => string;
  getProactiveTip: () => ProactiveTip | null;
  dismissTip: (tipId: string) => void;
}

export interface ProactiveTip {
  id: string;
  message: string;
  action?: string;
  actionLabel?: string;
  priority: number;
}

const AppContext = createContext<AppContextValue | null>(null);

const PAGE_NAMES: Record<string, string> = {
  '/': 'Landing Page',
  '/dashboard': 'Carousel Editor',
  '/dashboard/billing': 'Billing & Subscription',
  '/login': 'Login Page',
  '/register': 'Registration Page',
  '/pricing': 'Pricing Page',
  '/templates': 'Templates Gallery',
};

const SECTION_NAMES: Record<string, string> = {
  'editor': 'editing slides',
  'templates': 'browsing templates',
  'ai-generate': 'using AI generation',
  'ai-tools': 'using AI tools',
  'export': 'exporting carousel',
  'settings': 'adjusting settings',
  'slides-panel': 'managing slides',
  'properties': 'editing properties',
  'theme': 'customizing theme',
};

const ACTION_NAMES: Record<string, string> = {
  'editing-text': 'editing text',
  'editing-title': 'editing the title',
  'adding-slide': 'adding a new slide',
  'deleting-slide': 'deleting a slide',
  'uploading-image': 'uploading an image',
  'changing-color': 'changing colors',
  'selecting-template': 'selecting a template',
  'generating-ai': 'generating with AI',
  'exporting': 'exporting the carousel',
};

export function AppContextProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  
  const [state, setState] = useState<AppContextState>({
    currentPage: '',
    currentSection: '',
    currentAction: null,
    lastAction: null,
    actionTimestamp: null,
    isFirstTimeUser: true,
    hasCompletedOnboarding: false,
    slideCount: 0,
    hasExported: false,
    timeOnCurrentPage: 0,
    idleTime: 0,
    isIdle: false,
  });
  
  const [dismissedTips, setDismissedTips] = useState<Set<string>>(new Set());
  const [pageStartTime, setPageStartTime] = useState(Date.now());
  const lastActivityTimeRef = useRef(Date.now());

  // Load persisted state
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const stored = localStorage.getItem('carouslk_user_state');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setState(prev => ({
          ...prev,
          isFirstTimeUser: parsed.isFirstTimeUser ?? true,
          hasCompletedOnboarding: parsed.hasCompletedOnboarding ?? false,
          hasExported: parsed.hasExported ?? false,
        }));
      } catch (e) {
        console.error('Failed to parse stored state:', e);
      }
    }
    
    const dismissedStr = localStorage.getItem('carouslk_dismissed_tips');
    if (dismissedStr) {
      try {
        setDismissedTips(new Set(JSON.parse(dismissedStr)));
      } catch (e) {
        console.error('Failed to parse dismissed tips:', e);
      }
    }
  }, []);

  // Persist state changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    localStorage.setItem('carouslk_user_state', JSON.stringify({
      isFirstTimeUser: state.isFirstTimeUser,
      hasCompletedOnboarding: state.hasCompletedOnboarding,
      hasExported: state.hasExported,
    }));
  }, [state.isFirstTimeUser, state.hasCompletedOnboarding, state.hasExported]);

  // Track page changes
  useEffect(() => {
    const pageName = PAGE_NAMES[pathname] || pathname;
    setState(prev => ({ ...prev, currentPage: pageName, currentSection: '' }));
    setPageStartTime(Date.now());
    
    // Mark as not first time after visiting dashboard
    if (pathname === '/dashboard') {
      setState(prev => ({ ...prev, isFirstTimeUser: false }));
    }
  }, [pathname]);

  // Track time on page and idle time
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const lastActivity = lastActivityTimeRef.current;
      setState(prev => ({
        ...prev,
        timeOnCurrentPage: Math.floor((now - pageStartTime) / 1000),
        idleTime: Math.floor((now - lastActivity) / 1000),
        isIdle: (now - lastActivity) > 30000, // 30 seconds
      }));
    }, 1000);
    
    return () => clearInterval(interval);
  }, [pageStartTime]);

  // Track user activity
  useEffect(() => {
    const handleActivity = () => {
      lastActivityTimeRef.current = Date.now();
    };
    
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);
    window.addEventListener('touchstart', handleActivity);
    
    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
    };
  }, []);

  const setCurrentSection = useCallback((section: string) => {
    setState(prev => ({ ...prev, currentSection: section }));
  }, []);

  const setCurrentAction = useCallback((action: string | null) => {
    setState(prev => ({
      ...prev,
      lastAction: prev.currentAction,
      currentAction: action,
      actionTimestamp: action ? Date.now() : null,
    }));
  }, []);

  const setSlideCount = useCallback((count: number) => {
    setState(prev => ({ ...prev, slideCount: count }));
  }, []);

  const markExported = useCallback(() => {
    setState(prev => ({ ...prev, hasExported: true }));
  }, []);

  const completeOnboarding = useCallback(() => {
    setState(prev => ({ ...prev, hasCompletedOnboarding: true }));
  }, []);

  const dismissTip = useCallback((tipId: string) => {
    setDismissedTips(prev => {
      const next = new Set(prev);
      next.add(tipId);
      localStorage.setItem('carouslk_dismissed_tips', JSON.stringify([...next]));
      return next;
    });
  }, []);

  const getContextSummary = useCallback((): string => {
    const parts: string[] = [];
    
    parts.push(`User is on: ${state.currentPage}`);
    
    if (state.currentSection) {
      const sectionName = SECTION_NAMES[state.currentSection] || state.currentSection;
      parts.push(`Currently: ${sectionName}`);
    }
    
    if (state.currentAction) {
      const actionName = ACTION_NAMES[state.currentAction] || state.currentAction;
      parts.push(`Action: ${actionName}`);
    }
    
    if (state.slideCount > 0) {
      parts.push(`Has ${state.slideCount} slide${state.slideCount > 1 ? 's' : ''}`);
    }
    
    if (state.isFirstTimeUser) {
      parts.push('This is a new user');
    }
    
    if (!state.hasExported) {
      parts.push('Has not exported yet');
    }
    
    if (state.isIdle) {
      parts.push(`User has been idle for ${state.idleTime} seconds`);
    }
    
    return parts.join('. ') + '.';
  }, [state]);

  const getProactiveTip = useCallback((): ProactiveTip | null => {
    // Priority-ordered tips based on context
    const tips: ProactiveTip[] = [];
    
    // First-time user on dashboard
    if (state.currentPage === 'Carousel Editor' && state.isFirstTimeUser && !state.hasCompletedOnboarding) {
      tips.push({
        id: 'welcome',
        message: "Welcome! 👋 I'm here to help you create your first carousel. Want a quick tour?",
        action: 'tour',
        actionLabel: 'Show me around',
        priority: 100,
      });
    }
    
    // Idle on editor with no slides
    if (state.currentPage === 'Carousel Editor' && state.isIdle && state.slideCount <= 1) {
      tips.push({
        id: 'idle-suggest-ai',
        message: "Need inspiration? Try AI Generate to create a carousel from any topic! ✨",
        action: 'ai-generate',
        actionLabel: 'Try AI Generate',
        priority: 80,
      });
    }
    
    // Been on editor for a while without exporting
    if (state.currentPage === 'Carousel Editor' && state.timeOnCurrentPage > 300 && !state.hasExported && state.slideCount >= 2) {
      tips.push({
        id: 'suggest-export',
        message: "Your carousel is looking great! Ready to export it? 📥",
        action: 'export',
        actionLabel: 'Export now',
        priority: 70,
      });
    }
    
    // On templates section
    if (state.currentSection === 'templates') {
      tips.push({
        id: 'templates-tip',
        message: "Pro tip: Click any template to instantly apply it to your carousel!",
        priority: 50,
      });
    }
    
    // Editing text for first time
    if (state.currentAction === 'editing-text' && state.isFirstTimeUser) {
      tips.push({
        id: 'text-formatting',
        message: "Select any text to see formatting options like bold, colors, and fonts!",
        priority: 60,
      });
    }
    
    // Filter out dismissed tips and return highest priority
    const availableTips = tips.filter(tip => !dismissedTips.has(tip.id));
    
    if (availableTips.length === 0) return null;
    
    return availableTips.sort((a, b) => b.priority - a.priority)[0];
  }, [state, dismissedTips]);

  const value: AppContextValue = {
    ...state,
    setCurrentSection,
    setCurrentAction,
    setSlideCount,
    markExported,
    completeOnboarding,
    getContextSummary,
    getProactiveTip,
    dismissTip,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppContextProvider');
  }
  return context;
}

// Optional hook that doesn't throw - for components outside provider
export function useAppContextSafe() {
  return useContext(AppContext);
}

