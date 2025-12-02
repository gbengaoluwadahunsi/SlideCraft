export interface Theme {
  id: string;
  name: string;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  fontFamily: string;
  previewColors: string[];
}

export const THEMES: Theme[] = [
  {
    id: 'modern-dark',
    name: 'Midnight Gold',
    backgroundColor: '#0B0F19',
    textColor: '#ffffff',
    accentColor: '#ffd700',
    fontFamily: 'var(--font-inter)',
    previewColors: ['#0B0F19', '#ffd700']
  },
  {
    id: 'clean-light',
    name: 'Clean Studio',
    backgroundColor: '#ffffff',
    textColor: '#1a1a1a',
    accentColor: '#3b82f6',
    fontFamily: 'var(--font-inter)',
    previewColors: ['#ffffff', '#3b82f6']
  },
  {
    id: 'editorial',
    name: 'Editorial',
    backgroundColor: '#fdfbf7',
    textColor: '#2d2a26',
    accentColor: '#d946ef',
    fontFamily: 'var(--font-playfair)',
    previewColors: ['#fdfbf7', '#d946ef']
  },
  {
    id: 'cyberpunk',
    name: 'Neon Nights',
    backgroundColor: '#090014',
    textColor: '#e0e7ff',
    accentColor: '#00ff9d',
    fontFamily: 'var(--font-oswald)',
    previewColors: ['#090014', '#00ff9d']
  },
  {
    id: 'terminal',
    name: 'Hacker Terminal',
    backgroundColor: '#0c0c0c',
    textColor: '#cccccc',
    accentColor: '#22c55e',
    fontFamily: 'var(--font-roboto-mono)',
    previewColors: ['#0c0c0c', '#22c55e']
  },
  {
    id: 'luxury',
    name: 'Luxe Black',
    backgroundColor: '#000000',
    textColor: '#ffffff',
    accentColor: '#eab308',
    fontFamily: 'var(--font-playfair)',
    previewColors: ['#000000', '#eab308']
  },
  {
    id: 'corporate',
    name: 'Corporate Blue',
    backgroundColor: '#1e3a8a',
    textColor: '#ffffff',
    accentColor: '#60a5fa',
    fontFamily: 'var(--font-inter)',
    previewColors: ['#1e3a8a', '#60a5fa']
  },
  {
    id: 'vibrant',
    name: 'Electric Violet',
    backgroundColor: '#4c1d95',
    textColor: '#ffffff',
    accentColor: '#f472b6',
    fontFamily: 'var(--font-oswald)',
    previewColors: ['#4c1d95', '#f472b6']
  }
];

