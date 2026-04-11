'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';

export interface BrandSettings {
  handle: string;
  category: string;
  fontFamily: string;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  logoUrl: string | null;
}

export function useBrandSettings() {
  const [brandSettings, setBrandSettings] = useState<BrandSettings>({
    handle: '@yourhandle',
    category: 'Education',
    fontFamily: 'var(--font-inter)',
    backgroundColor: '#0B0F19',
    textColor: '#ffffff',
    accentColor: '#ffd700',
    logoUrl: null,
  });

  const updateBrandSettings = useCallback((updates: Partial<BrandSettings>) => {
    setBrandSettings(prev => ({ ...prev, ...updates }));
  }, []);

  return {
    brandSettings,
    setBrandSettings,
    updateBrandSettings,
  };
}
