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
    id: 'pitch-deck',
    name: 'Pitch Deck',
    category: 'Bold',
    backgroundColor: '#F2F0E5',
    textColor: '#333333',
    accentColor: '#D52028',
    fontFamily: 'var(--font-inter)',
    previewColors: ['#F2F0E5', '#D52028'],
    fontScale: 1.3,
    textAlign: 'center',
    elementOrder: ['title', 'content', 'media'],
    designStyle: 'bold'
  },

  // --- DARK MODE ---
  {
    id: 'teal-gradient',
    name: 'Teal Gradient',
    category: 'Dark Mode',
    backgroundColor: '#000000',
    textColor: '#ffffff',
    accentColor: '#14b8a6',
    fontFamily: 'var(--font-inter)',
    previewColors: ['#000000', '#14b8a6'],
    fontScale: 1.2,
    textAlign: 'center',
    elementOrder: ['title', 'content', 'media'],
    designStyle: 'modern'
  },
  {
    id: 'portfolio-minimal',
    name: 'Portfolio Minimal',
    category: 'Minimalist',
    backgroundColor: '#ffffff',
    textColor: '#1a1a1a',
    accentColor: '#6b7280',
    fontFamily: 'var(--font-inter)',
    previewColors: ['#ffffff', '#6b7280'],
    fontScale: 1.1,
    textAlign: 'center',
    elementOrder: ['title', 'content', 'media'],
    designStyle: 'minimal'
  }
];
