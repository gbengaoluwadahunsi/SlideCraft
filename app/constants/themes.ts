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
  {
    id: 'startup-orange',
    name: 'Startup Energy',
    category: 'Professional',
    backgroundColor: '#ea580c',
    textColor: '#ffffff',
    accentColor: '#fef08a',
    fontFamily: 'var(--font-inter)',
    previewColors: ['#ea580c', '#fef08a']
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
    id: 'miami-vice',
    name: 'Miami Vice',
    category: 'Bold',
    backgroundColor: '#ec4899',
    textColor: '#ffffff',
    accentColor: '#06b6d4',
    fontFamily: 'var(--font-oswald)',
    previewColors: ['#ec4899', '#06b6d4']
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
    id: 'nordic-frost',
    name: 'Nordic Frost',
    category: 'Minimalist',
    backgroundColor: '#f1f5f9',
    textColor: '#1e293b',
    accentColor: '#3b82f6',
    fontFamily: 'var(--font-inter)',
    previewColors: ['#f1f5f9', '#3b82f6']
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
  },
  {
    id: 'carbon-fiber',
    name: 'Carbon Fiber',
    category: 'Dark Mode',
    backgroundColor: '#18181b',
    textColor: '#fafafa',
    accentColor: '#f97316',
    fontFamily: 'var(--font-inter)',
    previewColors: ['#18181b', '#f97316']
  },

  // --- PREMIUM ---
  {
    id: 'rose-gold-luxury',
    name: 'Rose Gold Luxury',
    category: 'Premium',
    backgroundColor: '#1a1a1a',
    textColor: '#ffffff',
    accentColor: '#e0a899',
    fontFamily: 'var(--font-playfair)',
    previewColors: ['#1a1a1a', '#e0a899']
  },
  {
    id: 'champagne-elite',
    name: 'Champagne Elite',
    category: 'Premium',
    backgroundColor: '#f5f2e9',
    textColor: '#2c2416',
    accentColor: '#c4a962',
    fontFamily: 'var(--font-playfair)',
    previewColors: ['#f5f2e9', '#c4a962']
  },
  {
    id: 'royal-emerald',
    name: 'Royal Emerald',
    category: 'Premium',
    backgroundColor: '#0f3d3e',
    textColor: '#e8f5e9',
    accentColor: '#4ade80',
    fontFamily: 'var(--font-playfair)',
    previewColors: ['#0f3d3e', '#4ade80']
  },
  {
    id: 'platinum-edge',
    name: 'Platinum Edge',
    category: 'Premium',
    backgroundColor: '#e5e7eb',
    textColor: '#111827',
    accentColor: '#6366f1',
    fontFamily: 'var(--font-inter)',
    previewColors: ['#e5e7eb', '#6366f1']
  },
  {
    id: 'navy-executive',
    name: 'Navy Executive',
    category: 'Premium',
    backgroundColor: '#1e293b',
    textColor: '#f1f5f9',
    accentColor: '#fbbf24',
    fontFamily: 'var(--font-playfair)',
    previewColors: ['#1e293b', '#fbbf24']
  },

  // --- PREMIUM DESIGN TEMPLATES ---
  {
    id: 'apple-keynote-minimal-template',
    name: '🍎 Apple Keynote',
    category: 'Educational Templates',
    backgroundColor: '#FFFFFF',
    textColor: '#000000',
    accentColor: '#000000',
    fontFamily: 'var(--font-inter)',
    previewColors: ['#FFFFFF', '#000000'],
    isFullTemplate: true
  },
  {
    id: 'brutalist-raw-template',
    name: '⬛ Brutalist',
    category: 'Educational Templates',
    backgroundColor: '#000000',
    textColor: '#FFFFFF',
    accentColor: '#FFFF00',
    fontFamily: 'var(--font-oswald)',
    previewColors: ['#000000', '#FFFF00'],
    isFullTemplate: true
  },
  {
    id: 'vogue-editorial-template',
    name: '📰 Editorial',
    category: 'Educational Templates',
    backgroundColor: '#FFFFFF',
    textColor: '#000000',
    accentColor: '#DC143C',
    fontFamily: 'var(--font-playfair)',
    previewColors: ['#FFFFFF', '#DC143C'],
    isFullTemplate: true
  },
  {
    id: 'neon-cyberpunk-template',
    name: '🌃 Neon Tokyo',
    category: 'Educational Templates',
    backgroundColor: '#0A0E27',
    textColor: '#00FFFF',
    accentColor: '#FF00FF',
    fontFamily: 'var(--font-roboto-mono)',
    previewColors: ['#0A0E27', '#FF00FF'],
    isFullTemplate: true
  },
  {
    id: 'startup-pitch-template',
    name: '🚀 Startup Pitch',
    category: 'Educational Templates',
    backgroundColor: '#FFFFFF',
    textColor: '#000000',
    accentColor: '#FF6154',
    fontFamily: 'var(--font-inter)',
    previewColors: ['#FFFFFF', '#FF6154'],
    isFullTemplate: true
  },

  // --- EDUCATIONAL TEMPLATES ---
  {
    id: 'bold-light-education-template',
    name: '📊 Bold Educational (Light)',
    category: 'Educational Templates',
    backgroundColor: '#E8E8E8',
    textColor: '#000000',
    accentColor: '#FFA500',
    fontFamily: 'var(--font-oswald)',
    previewColors: ['#E8E8E8', '#FFA500'],
    isFullTemplate: true
  },
  {
    id: 'marketing-psychology-template',
    name: '🧠 Marketing Psychology',
    category: 'Educational Templates',
    backgroundColor: '#FFFFFF',
    textColor: '#000000',
    accentColor: '#00D4FF',
    fontFamily: 'var(--font-oswald)',
    previewColors: ['#FFFFFF', '#00D4FF'],
    isFullTemplate: true
  },
  {
    id: 'productivity-hacks-template',
    name: '⚡ Productivity Hacks',
    category: 'Educational Templates',
    backgroundColor: '#FFF9F5',
    textColor: '#000000',
    accentColor: '#FF3B30',
    fontFamily: 'var(--font-oswald)',
    previewColors: ['#FFF9F5', '#FF3B30'],
    isFullTemplate: true
  },
  {
    id: 'social-media-growth-template',
    name: '📱 Social Media Growth',
    category: 'Educational Templates',
    backgroundColor: '#F0FFF4',
    textColor: '#000000',
    accentColor: '#34C759',
    fontFamily: 'var(--font-oswald)',
    previewColors: ['#F0FFF4', '#34C759'],
    isFullTemplate: true
  },
  {
    id: 'personal-branding-template',
    name: '⭐ Personal Branding',
    category: 'Educational Templates',
    backgroundColor: '#FFF5F7',
    textColor: '#000000',
    accentColor: '#FF2D55',
    fontFamily: 'var(--font-oswald)',
    previewColors: ['#FFF5F7', '#FF2D55'],
    isFullTemplate: true
  }
];
