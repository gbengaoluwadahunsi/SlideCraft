import { SlideData } from '@/lib/types';

export interface Theme {
  id: string;
  name: string;
  category: 'Professional' | 'Bold' | 'Minimalist' | 'Dark Mode' | 'Educational Templates' | 'Premium' | 'High-Converting';
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  fontFamily: string;
  previewColors: string[];
  defaultCategory?: string;
  isFullTemplate?: boolean;
  templateSlides?: SlideData[];
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
  },

  // --- HIGH-CONVERTING (Carousel Templates) ---
  {
    id: 'hook-story-template',
    name: 'Hook + Story',
    category: 'High-Converting',
    backgroundColor: '#0A1628',
    textColor: '#FFFFFF',
    accentColor: '#FF6B35',
    fontFamily: 'var(--font-oswald)',
    previewColors: ['#0A1628', '#FF6B35'],
    fontScale: 1.4,
    textAlign: 'center',
    elementOrder: ['title', 'subtitle', 'media'],
    designStyle: 'bold',
    isFullTemplate: true,
  },
  {
    id: 'listicle-template',
    name: 'Listicle',
    category: 'High-Converting',
    backgroundColor: '#FFFFFF',
    textColor: '#1A1A2E',
    accentColor: '#7C3AED',
    fontFamily: 'var(--font-inter)',
    previewColors: ['#FFFFFF', '#7C3AED'],
    fontScale: 1.2,
    textAlign: 'left',
    elementOrder: ['title', 'content', 'media'],
    designStyle: 'modern',
    isFullTemplate: true,
  },
  {
    id: 'data-driven-template',
    name: 'Data-Driven',
    category: 'High-Converting',
    backgroundColor: '#0F172A',
    textColor: '#F0FDF4',
    accentColor: '#06D6A0',
    fontFamily: 'var(--font-inter)',
    previewColors: ['#0F172A', '#06D6A0'],
    fontScale: 1.5,
    textAlign: 'center',
    elementOrder: ['title', 'content', 'media'],
    designStyle: 'bold',
    isFullTemplate: true,
  },
  {
    id: 'before-after-template',
    name: 'Before / After',
    category: 'High-Converting',
    backgroundColor: '#111827',
    textColor: '#F9FAFB',
    accentColor: '#F43F5E',
    fontFamily: 'var(--font-inter)',
    previewColors: ['#111827', '#F43F5E', '#10B981'],
    fontScale: 1.3,
    textAlign: 'center',
    elementOrder: ['title', 'content', 'media'],
    designStyle: 'bold',
    isFullTemplate: true,
  },
  {
    id: 'step-by-step-template',
    name: 'Step-by-Step',
    category: 'High-Converting',
    backgroundColor: '#1E1B4B',
    textColor: '#E0E7FF',
    accentColor: '#3B82F6',
    fontFamily: 'var(--font-inter)',
    previewColors: ['#1E1B4B', '#3B82F6'],
    fontScale: 1.2,
    textAlign: 'left',
    elementOrder: ['title', 'content', 'media'],
    designStyle: 'modern',
    isFullTemplate: true,
  },

  // --- PREMIUM ---
  {
    id: 'neon-tech',
    name: 'Neon Tech',
    category: 'Premium',
    backgroundColor: '#06080F',
    textColor: '#EEF2FF',
    accentColor: '#E8FF47',
    fontFamily: 'var(--font-epilogue)',
    previewColors: ['#06080F', '#E8FF47', '#00D4FF', '#FF4D6D'],
    fontScale: 1.15,
    textAlign: 'left',
    elementOrder: ['emoji', 'title', 'content', 'media'],
    designStyle: 'bold',
    isFullTemplate: true,
  },
  {
    id: 'dev-carousel-template',
    name: 'Dev Carousel',
    category: 'Premium',
    backgroundColor: '#0D1120',
    textColor: '#EEF2FF',
    accentColor: '#E8FF47',
    fontFamily: 'var(--font-epilogue)',
    previewColors: ['#0D1120', '#E8FF47', '#FF4D6D', '#00D4FF', '#FF9500'],
    fontScale: 1.1,
    textAlign: 'left',
    elementOrder: ['title', 'content', 'media'],
    designStyle: 'bold',
    isFullTemplate: true,
  },
];
