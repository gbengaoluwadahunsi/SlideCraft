export interface Theme {
  id: string;
  name: string;
  category: 'Professional' | 'Bold' | 'Minimalist' | 'Dark Mode';
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  fontFamily: string;
  previewColors: string[];
  defaultCategory?: string;
}

export const THEMES: Theme[] = [
  // --- PROFESSIONAL ---
  {
    id: 'corporate-blue',
    name: 'Corporate Blue',
    category: 'Professional',
    backgroundColor: '#1e3a8a',
    textColor: '#ffffff',
    accentColor: '#60a5fa',
    fontFamily: 'var(--font-inter)',
    previewColors: ['#1e3a8a', '#60a5fa']
  },
  {
    id: 'finance-green',
    name: 'Finance Green',
    category: 'Professional',
    backgroundColor: '#064e3b',
    textColor: '#ffffff',
    accentColor: '#34d399',
    fontFamily: 'var(--font-inter)',
    previewColors: ['#064e3b', '#34d399']
  },
  {
    id: 'consult-grey',
    name: 'Consultant Grey',
    category: 'Professional',
    backgroundColor: '#374151',
    textColor: '#ffffff',
    accentColor: '#9ca3af',
    fontFamily: 'var(--font-playfair)',
    previewColors: ['#374151', '#9ca3af']
  },
  {
    id: 'tech-indigo',
    name: 'Tech Indigo',
    category: 'Professional',
    backgroundColor: '#312e81',
    textColor: '#ffffff',
    accentColor: '#818cf8',
    fontFamily: 'var(--font-inter)',
    previewColors: ['#312e81', '#818cf8']
  },
  {
    id: 'clean-studio',
    name: 'Clean Studio',
    category: 'Professional',
    backgroundColor: '#ffffff',
    textColor: '#1a1a1a',
    accentColor: '#2563eb',
    fontFamily: 'var(--font-inter)',
    previewColors: ['#ffffff', '#2563eb']
  },

  // --- BOLD ---
  {
    id: 'electric-violet',
    name: 'Electric Violet',
    category: 'Bold',
    backgroundColor: '#4c1d95',
    textColor: '#ffffff',
    accentColor: '#f472b6',
    fontFamily: 'var(--font-oswald)',
    previewColors: ['#4c1d95', '#f472b6']
  },
  {
    id: 'cyberpunk-neon',
    name: 'Neon Nights',
    category: 'Bold',
    backgroundColor: '#090014',
    textColor: '#e0e7ff',
    accentColor: '#00ff9d',
    fontFamily: 'var(--font-oswald)',
    previewColors: ['#090014', '#00ff9d']
  },
  {
    id: 'hot-red',
    name: 'Red Alert',
    category: 'Bold',
    backgroundColor: '#7f1d1d',
    textColor: '#ffffff',
    accentColor: '#fca5a5',
    fontFamily: 'var(--font-oswald)',
    previewColors: ['#7f1d1d', '#fca5a5']
  },
  {
    id: 'sun-yellow',
    name: 'Sunshine',
    category: 'Bold',
    backgroundColor: '#facc15',
    textColor: '#000000',
    accentColor: '#000000',
    fontFamily: 'var(--font-inter)',
    previewColors: ['#facc15', '#000000']
  },
  {
    id: 'retro-pop',
    name: 'Retro Pop',
    category: 'Bold',
    backgroundColor: '#fef08a',
    textColor: '#be123c',
    accentColor: '#1e40af',
    fontFamily: 'var(--font-permanent-marker)',
    previewColors: ['#fef08a', '#be123c']
  },
  {
    id: 'tech-under-hood',
    name: 'Tech (Under Hood)',
    category: 'Bold',
    backgroundColor: '#0B0F19',
    textColor: '#ffffff',
    accentColor: '#ffd700',
    fontFamily: 'var(--font-inter)',
    previewColors: ['#0B0F19', '#ffd700'],
    defaultCategory: 'UNDER THE HOOD'
  },

  // --- MINIMALIST ---
  {
    id: 'editorial-cream',
    name: 'Editorial',
    category: 'Minimalist',
    backgroundColor: '#fdfbf7',
    textColor: '#2d2a26',
    accentColor: '#d946ef',
    fontFamily: 'var(--font-playfair)',
    previewColors: ['#fdfbf7', '#d946ef']
  },
  {
    id: 'mono-white',
    name: 'Monochrome',
    category: 'Minimalist',
    backgroundColor: '#ffffff',
    textColor: '#000000',
    accentColor: '#525252',
    fontFamily: 'var(--font-inter)',
    previewColors: ['#ffffff', '#000000']
  },
  {
    id: 'sage-calm',
    name: 'Sage Calm',
    category: 'Minimalist',
    backgroundColor: '#f0fdf4',
    textColor: '#166534',
    accentColor: '#15803d',
    fontFamily: 'var(--font-playfair)',
    previewColors: ['#f0fdf4', '#166534']
  },
  {
    id: 'paper-warm',
    name: 'Paper Warm',
    category: 'Minimalist',
    backgroundColor: '#fffbeb',
    textColor: '#78350f',
    accentColor: '#d97706',
    fontFamily: 'var(--font-inter)',
    previewColors: ['#fffbeb', '#d97706']
  },
  {
    id: 'slate-soft',
    name: 'Slate Soft',
    category: 'Minimalist',
    backgroundColor: '#f8fafc',
    textColor: '#334155',
    accentColor: '#64748b',
    fontFamily: 'var(--font-inter)',
    previewColors: ['#f8fafc', '#64748b']
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
  },
  {
    id: 'hacker-terminal',
    name: 'Hacker Terminal',
    category: 'Dark Mode',
    backgroundColor: '#0c0c0c',
    textColor: '#cccccc',
    accentColor: '#22c55e',
    fontFamily: 'var(--font-roboto-mono)',
    previewColors: ['#0c0c0c', '#22c55e']
  },
  {
    id: 'luxe-black',
    name: 'Luxe Black',
    category: 'Dark Mode',
    backgroundColor: '#000000',
    textColor: '#ffffff',
    accentColor: '#eab308',
    fontFamily: 'var(--font-playfair)',
    previewColors: ['#000000', '#eab308']
  },
  {
    id: 'deep-ocean',
    name: 'Deep Ocean',
    category: 'Dark Mode',
    backgroundColor: '#0f172a',
    textColor: '#e2e8f0',
    accentColor: '#38bdf8',
    fontFamily: 'var(--font-inter)',
    previewColors: ['#0f172a', '#38bdf8']
  },
  {
    id: 'purple-haze',
    name: 'Purple Haze',
    category: 'Dark Mode',
    backgroundColor: '#2e1065',
    textColor: '#f3e8ff',
    accentColor: '#c084fc',
    fontFamily: 'var(--font-inter)',
    previewColors: ['#2e1065', '#c084fc']
  }
];
