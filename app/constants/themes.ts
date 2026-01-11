export interface Theme {
  id: string;
  name: string;
  category: 'Professional' | 'Bold' | 'Minimalist' | 'Dark Mode' | 'Educational Templates' | 'Premium';
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  fontFamily: string;
  previewColors: string[];
  defaultCategory?: string;
  isFullTemplate?: boolean;
  templateSlides?: any[];
  // Unique design properties
  fontScale?: number;
  textAlign?: 'left' | 'center' | 'right';
  elementOrder?: string[];
  designStyle?: 'minimal' | 'bold' | 'elegant' | 'modern' | 'classic';
}

export const THEMES: Theme[] = [
  // --- MINIMALIST ---
  {
    id: 'nordic-frost',
    name: 'Nordic Frost',
    category: 'Minimalist',
    backgroundColor: '#f1f5f9',
    textColor: '#1e293b',
    accentColor: '#3b82f6',
    fontFamily: 'var(--font-inter)',
    previewColors: ['#f1f5f9', '#3b82f6'],
    fontScale: 1.0,
    textAlign: 'left',
    elementOrder: ['title', 'content', 'media'],
    designStyle: 'minimal'
  },

  // --- PROFESSIONAL ---
  {
    id: 'clean-studio',
    name: 'Clean Studio',
    category: 'Professional',
    backgroundColor: '#ffffff',
    textColor: '#1a1a1a',
    accentColor: '#2563eb',
    fontFamily: 'var(--font-inter)',
    previewColors: ['#ffffff', '#2563eb'],
    fontScale: 1.1,
    textAlign: 'center',
    elementOrder: ['title', 'content', 'media'],
    designStyle: 'elegant'
  },
  {
    id: 'corporate-blue',
    name: 'Corporate Blue',
    category: 'Professional',
    backgroundColor: '#1e3a8a',
    textColor: '#ffffff',
    accentColor: '#60a5fa',
    fontFamily: 'var(--font-inter)',
    previewColors: ['#1e3a8a', '#60a5fa'],
    fontScale: 1.2,
    textAlign: 'left',
    elementOrder: ['emoji', 'title', 'content', 'media'],
    designStyle: 'bold'
  },

  // --- DARK MODE ---
  {
    id: 'midnight-gold',
    name: 'Midnight Gold',
    category: 'Dark Mode',
    backgroundColor: '#0B0F19',
    textColor: '#ffffff',
    accentColor: '#ffd700',
    fontFamily: 'var(--font-inter)',
    previewColors: ['#0B0F19', '#ffd700'],
    defaultCategory: 'UNDER THE HOOD',
    fontScale: 1.15,
    textAlign: 'center',
    elementOrder: ['title', 'subtitle', 'content', 'media'],
    designStyle: 'modern'
  },
  {
    id: 'deep-ocean',
    name: 'Deep Ocean',
    category: 'Dark Mode',
    backgroundColor: '#0f172a',
    textColor: '#e2e8f0',
    accentColor: '#38bdf8',
    fontFamily: 'var(--font-inter)',
    previewColors: ['#0f172a', '#38bdf8'],
    fontScale: 1.0,
    textAlign: 'right',
    elementOrder: ['content', 'title', 'media'],
    designStyle: 'classic'
  }
];
