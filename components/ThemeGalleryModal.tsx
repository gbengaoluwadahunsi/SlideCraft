'use client';

import React from 'react';
import { Layout, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/Modal';
import { THEMES } from '@/app/constants/themes';
import { BOLD_TEMPLATES } from '@/lib/templates';
import type { SlideData } from '@/lib/types';
import { remapColors, deriveAccent2, DEFAULT_THEME_COLORS, type ThemeColors } from '@/lib/colorTokens';
import type { CarouselTemplate } from '@/lib/templates';

interface BrandSettings {
  handle: string;
  category: string;
  fontFamily: string;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  logoUrl: string | null;
}

interface ThemeGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  setSlides: React.Dispatch<React.SetStateAction<SlideData[]>>;
  brandSettings: BrandSettings;
  setBrandSettings: React.Dispatch<React.SetStateAction<BrandSettings>>;
  authStatus: string;
  addToHistory: (slides: SlideData[]) => void;
  slides: SlideData[];
}

const CATEGORY_LABELS: Record<string, string> = {
  Professional: 'Professional',
  Minimalist: 'Minimalist',
  'Dark Mode': 'Dark Mode',
  Bold: 'Bold',
  Premium: 'Premium',
  'Educational Templates': 'Template',
  'High-Converting': 'High-Converting',
};

export const ThemeGalleryModal = React.memo(function ThemeGalleryModal({
  isOpen,
  onClose,
  setSlides,
  brandSettings,
  setBrandSettings,
  authStatus,
  addToHistory,
  slides,
}: ThemeGalleryModalProps) {
  const handleApplyTheme = (theme: (typeof THEMES)[number]) => {
    const fullTemplate = theme.isFullTemplate
      ? BOLD_TEMPLATES.find((t) => t.id === theme.id.replace('-template', ''))
      : null;

    // Detect the old theme colors from current slides so we can remap content HTML
    const detectOldColors = (s: SlideData): ThemeColors => ({
      accent: s.accentColor || brandSettings.accentColor || DEFAULT_THEME_COLORS.accent,
      accent2: deriveAccent2(s.accentColor || brandSettings.accentColor || DEFAULT_THEME_COLORS.accent),
      muted: DEFAULT_THEME_COLORS.muted,
      text: s.textColor || brandSettings.textColor || DEFAULT_THEME_COLORS.text,
    });

    if (theme.isFullTemplate && fullTemplate) {
      const templateFirst = fullTemplate.slides[0];
      const newColors: ThemeColors = {
        accent: templateFirst.accentColor || DEFAULT_THEME_COLORS.accent,
        accent2: deriveAccent2(templateFirst.accentColor || DEFAULT_THEME_COLORS.accent),
        muted: DEFAULT_THEME_COLORS.muted,
        text: templateFirst.textColor || DEFAULT_THEME_COLORS.text,
      };
      const applyTemplateStyle = (s: SlideData, templateSlide: Omit<SlideData, 'id'>) => {
        const oldColors = detectOldColors(s);
        const remappedContent = s.content ? remapColors(s.content, oldColors, newColors) : s.content;
        return {
          ...s,
          content: remappedContent,
          backgroundColor: templateSlide.backgroundColor,
          textColor: templateSlide.textColor,
          accentColor: templateSlide.accentColor,
          fontFamily: templateSlide.fontFamily,
          fontScale: templateSlide.fontScale,
          titleColor: templateSlide.titleColor ?? s.titleColor,
          slideLabel: templateSlide.slideLabel ?? s.slideLabel,
          slideLabelColor: templateSlide.slideLabelColor ?? s.slideLabelColor,
          glowColor: templateSlide.glowColor ?? s.glowColor,
          glowPosition: templateSlide.glowPosition ?? s.glowPosition,
          borderWidth: templateSlide.borderWidth ?? s.borderWidth,
          borderColor: templateSlide.borderColor ?? s.borderColor,
          borderStyle: templateSlide.borderStyle ?? s.borderStyle,
          borderRadius: templateSlide.borderRadius ?? s.borderRadius,
          slidePadding: templateSlide.slidePadding ?? s.slidePadding,
          showNoise: templateSlide.showNoise ?? s.showNoise,
          backgroundPattern: templateSlide.backgroundPattern ?? s.backgroundPattern,
          slideNumber: undefined,
          totalSlides: undefined,
          elementOrder: templateSlide.elementOrder ?? s.elementOrder,
          slideJustify: templateSlide.slideJustify ?? s.slideJustify,
        };
      };
      setSlides((prevSlides) => {
        const styled = prevSlides.map((s, idx) => {
          const templateSlide = fullTemplate.slides[idx % fullTemplate.slides.length];
          return applyTemplateStyle(s, templateSlide);
        });
        if (fullTemplate.slides.length > prevSlides.length) {
          const extras = fullTemplate.slides.slice(prevSlides.length).map((ts, i) => {
            const newSlide = {
              ...ts,
              id: `slide-${Date.now()}-${prevSlides.length + i}`,
              type: (ts.type || 'content') as SlideData['type'],
              title: ts.title || '',
            } as SlideData;
            return newSlide;
          });
          return [...styled, ...extras];
        }
        return styled;
      });
      const newBrand: BrandSettings = {
        ...brandSettings,
        backgroundColor: templateFirst.backgroundColor ?? brandSettings.backgroundColor,
        textColor: templateFirst.textColor ?? brandSettings.textColor,
        accentColor: templateFirst.accentColor ?? brandSettings.accentColor,
        fontFamily: templateFirst.fontFamily ?? brandSettings.fontFamily,
      };
      setBrandSettings({
        handle: newBrand.handle,
        category: newBrand.category,
        fontFamily: newBrand.fontFamily || 'var(--font-inter)',
        backgroundColor: newBrand.backgroundColor || '#0B0F19',
        textColor: newBrand.textColor || '#ffffff',
        accentColor: newBrand.accentColor || '#ffd700',
        logoUrl: newBrand.logoUrl,
      });
      if (typeof window !== 'undefined' && authStatus !== 'authenticated') {
        localStorage.setItem(
          'carouslk_brand_settings',
          JSON.stringify(newBrand)
        );
      }
      toast.success(`Applied "${theme.name}" styling to your slides!`);
      addToHistory(slides);
    } else {
      // Regular theme — remap the inline HTML content colors
      const newColors: ThemeColors = {
        accent: theme.accentColor || DEFAULT_THEME_COLORS.accent,
        accent2: deriveAccent2(theme.accentColor || DEFAULT_THEME_COLORS.accent),
        muted: DEFAULT_THEME_COLORS.muted,
        text: theme.textColor || DEFAULT_THEME_COLORS.text,
      };
      setSlides((prevSlides) =>
        prevSlides.map((s) => {
          const oldColors = detectOldColors(s);
          const remappedContent = s.content ? remapColors(s.content, oldColors, newColors) : s.content;
          const updatedSlide: SlideData = {
            ...s,
            content: remappedContent,
            backgroundColor: theme.backgroundColor,
            textColor: theme.textColor,
            accentColor: theme.accentColor,
            fontFamily: theme.fontFamily,
            fontScale: theme.fontScale ?? s.fontScale ?? 1,
            textAlign: theme.textAlign ?? s.textAlign ?? 'left',
            elementOrder: theme.elementOrder ?? s.elementOrder,
          };
          if (theme.defaultCategory) {
            updatedSlide.category = theme.defaultCategory;
          }
          return updatedSlide;
        })
      );
      const newBrand = {
        ...brandSettings,
        backgroundColor: theme.backgroundColor,
        textColor: theme.textColor,
        accentColor: theme.accentColor,
        fontFamily: theme.fontFamily,
      };
      setBrandSettings(newBrand);
      if (typeof window !== 'undefined' && authStatus !== 'authenticated') {
        localStorage.setItem(
          'carouslk_brand_settings',
          JSON.stringify(newBrand)
        );
      }
      toast.success(`Applied "${theme.name}" theme with unique design!`);
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Theme Gallery"
      titleIcon={<Layout size={20} />}
      subtitle="Choose from 10 curated themes including high-converting carousel formats"
      size="xl"
    >
      <div className="p-6 flex-1 flex items-center justify-center overflow-hidden">
        <div className="w-full max-w-6xl">
          <div className="grid grid-cols-5 gap-4">
            {THEMES.map((theme) => {
              const fullTemplate = theme.isFullTemplate
                ? BOLD_TEMPLATES.find(
                    (t) => t.id === theme.id.replace('-template', '')
                  )
                : null;

              return (
                <button
                  key={theme.id}
                  onClick={() => handleApplyTheme(theme)}
                  className="group text-left relative bg-[var(--surface-2)] rounded-lg overflow-hidden border-2 border-[var(--border)] hover:border-[var(--accent)] transition-all hover:shadow-xl hover:shadow-[var(--accent-glow)] hover:scale-[1.02]"
                >
                  <div
                    className="aspect-[3/4] p-3 flex flex-col justify-center items-center gap-1.5 relative overflow-hidden"
                    style={{ backgroundColor: theme.backgroundColor }}
                  >
                    <div className="absolute top-1.5 right-1.5">
                      <span className="px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-wider rounded-full bg-black/20 backdrop-blur-sm text-white border border-white/10">
                        {CATEGORY_LABELS[theme.category] || theme.category}
                      </span>
                    </div>

                    <ThemePreview theme={theme} fullTemplate={fullTemplate} />
                  </div>

                  <div className="p-2 bg-[var(--surface-2)] border-t border-[var(--border)]">
                    <div className="text-center">
                      <span className="text-[10px] font-semibold text-white block truncate">
                        {theme.name}
                      </span>
                      <span className="text-[9px] text-[var(--text-muted)] mt-0.5 block truncate">
                        {CATEGORY_LABELS[theme.category] || theme.category}
                      </span>
                    </div>
                    <div className="flex items-center justify-center gap-1 mt-1.5">
                      <span className="text-[9px] text-[var(--accent)] opacity-0 group-hover:opacity-100 transition font-medium">
                        {theme.isFullTemplate ? 'Use' : 'Apply'}
                      </span>
                      <ArrowRight
                        size={12}
                        className="text-[var(--accent)] opacity-0 group-hover:opacity-100 transition transform group-hover:translate-x-0.5"
                      />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </Modal>
  );
});

function ThemePreview({
  theme,
  fullTemplate,
}: {
  theme: (typeof THEMES)[number];
  fullTemplate: CarouselTemplate | null | undefined;
}) {
  const alignClass =
    theme.textAlign === 'center'
      ? 'items-center justify-center text-center'
      : theme.textAlign === 'right'
        ? 'items-end justify-center text-right'
        : 'items-start justify-center text-left';

  const fontSize = `${(theme.fontScale || 1) * 0.875}rem`;

  const linkedInIcons: Record<string, string> = {
    'hook-story-template': '🪝',
    'listicle-template': '📋',
    'data-driven-template': '📊',
    'before-after-template': '🔄',
    'step-by-step-template': '🪜',
  };

  if (theme.category === 'High-Converting' && theme.isFullTemplate) {
    const icon = linkedInIcons[theme.id] || '🔥';
    return (
      <div className={`w-full h-full flex flex-col ${alignClass} space-y-1 px-2`}>
        <div className="text-2xl mb-0.5">{icon}</div>
        <div
          className="text-[10px] font-bold px-1.5 leading-tight"
          style={{ color: theme.accentColor, fontFamily: theme.fontFamily }}
        >
          {theme.name}
        </div>
        <div
          className="text-[8px] opacity-70 px-1.5 leading-snug"
          style={{ color: theme.textColor }}
        >
          {(fullTemplate?.slides[0]?.title || 'Carousel').replace(/<[^>]*>/g, '')}
        </div>
      </div>
    );
  }

  if (theme.isFullTemplate) {
    const rawTitle = fullTemplate?.slides[0]?.title || 'Template';
    const cleanTitle = rawTitle.replace(/<[^>]*>/g, '');
    return (
      <div className={`w-full h-full flex flex-col ${alignClass} space-y-1 px-2`}>
        <div className="text-2xl mb-0.5">{theme.name.split(' ')[0]}</div>
        <div
          className="text-xs font-bold px-1.5"
          style={{ color: theme.textColor, fontFamily: theme.fontFamily }}
        >
          {cleanTitle}
        </div>
        <div
          className="text-[9px] opacity-70 px-1.5"
          style={{ color: theme.textColor }}
        >
          {fullTemplate?.slides.length} slides
        </div>
      </div>
    );
  }

  const previewMap: Record<
    string,
    { title?: string; subtitle?: string; reversed?: boolean }
  > = {
    'nordic-frost': { subtitle: 'Clean minimal design\nwith left alignment' },
    'clean-studio': { subtitle: 'Elegant centered\nprofessional style' },
    'midnight-gold': { subtitle: 'Modern centered\nwith subtitle' },
  };

  const preset = previewMap[theme.id];

  if (theme.id === 'corporate-blue') {
    return (
      <div className={`w-full h-full flex flex-col ${alignClass} space-y-1 px-2`}>
        <div className="text-[8px] mb-0.5 opacity-60" style={{ color: theme.accentColor }}>
          💼
        </div>
        <div className="text-xs font-bold mb-1" style={{ color: theme.textColor, fontFamily: theme.fontFamily, fontSize }}>
          Title
        </div>
        <div className="text-[9px] opacity-80" style={{ color: theme.textColor, fontFamily: theme.fontFamily }}>
          Bold corporate<br />with emoji support
        </div>
      </div>
    );
  }

  if (theme.id === 'deep-ocean') {
    return (
      <div className={`w-full h-full flex flex-col ${alignClass} space-y-1 px-2`}>
        <div className="text-[9px] opacity-80 mb-1 text-right w-full" style={{ color: theme.textColor, fontFamily: theme.fontFamily }}>
          Content first<br />approach
        </div>
        <div className="text-xs font-bold text-right w-full" style={{ color: theme.textColor, fontFamily: theme.fontFamily, fontSize }}>
          Title
        </div>
      </div>
    );
  }

  if (preset) {
    return (
      <div className={`w-full h-full flex flex-col ${alignClass} space-y-1 px-2`}>
        <div className="text-xs font-bold mb-1" style={{ color: theme.textColor, fontFamily: theme.fontFamily, fontSize }}>
          Title
        </div>
        <div className="text-[9px] opacity-80 leading-tight" style={{ color: theme.textColor, fontFamily: theme.fontFamily }}>
          {preset.subtitle?.split('\n').map((line, i) => (
            <React.Fragment key={i}>
              {line}
              {i === 0 && <br />}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full h-full flex flex-col ${alignClass} space-y-1 px-2`}>
      <div className="text-sm font-bold" style={{ color: theme.textColor, fontFamily: theme.fontFamily }}>
        Title
      </div>
      <div className="text-[10px] opacity-90" style={{ color: theme.textColor, fontFamily: theme.fontFamily }}>
        Subtitle{' '}
        <span style={{ color: theme.accentColor, fontWeight: 'bold' }}>Accent</span>
      </div>
    </div>
  );
}
