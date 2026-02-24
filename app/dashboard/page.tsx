"use client";

import React, { useState, useRef, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { useAppContextSafe } from '@/lib/hooks/useAppContext';
import { 
  Layout, 
  Menu,
  ChevronRight,
  Sparkles, 
  Palette, 
  Settings, 
  Pencil,
  Plus, 
  Download, 
  Type, 
  SquarePen,
  Image as ImageIcon, 
  ChevronLeft,
  X,
  Loader2,
  BarChart3,
  LineChart,
  PieChart,
  Trash2,
  Undo2,
  Redo2,
  LogOut,
  Check,
  ExternalLink,
  Cloud,
  CloudOff,
} from 'lucide-react';
import Link from 'next/link';
import { Slide } from '@/components/Slide';
import { TextToolbar } from '@/components/TextToolbar';
import { ProjectManager } from '@/components/ProjectManager';
import { useConfirm } from '@/components/ConfirmDialog';
import { useProject } from '@/lib/hooks/useProject';
import { THEMES } from '@/app/constants/themes';
import type { EmojiClickData } from 'emoji-picker-react';
const LazyEmojiPicker = React.lazy(() => import('emoji-picker-react'));
import { BOLD_TEMPLATES } from '@/lib/templates';
// Core feature components
import { ExportModal } from '@/components/ExportModal';
import { ImagePickerModal } from '@/components/ImagePickerModal';
import { ThemeGalleryModal } from '@/components/ThemeGalleryModal';
import { SettingsModal } from '@/components/SettingsModal';
import { AIGenerateModal } from '@/components/AIGenerateModal';
import { SlideListSidebar } from '@/components/SlideListSidebar';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { SlideData, InfographicData, ElementPosition, CustomBlock } from '@/lib/types';

const lazyToPng = (node: HTMLElement, options?: Record<string, unknown>) =>
  import('html-to-image').then(m => m.toPng(node, options));

const sanitizeEmoji = (value: string | undefined | null) => {
  if (!value) return '';
  return value
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .trim();
};

// Mobile-friendly contentEditable component
function ContentEditableDiv({ 
  slideId, 
  content, 
  onChange 
}: { 
  slideId: string; 
  content: string; 
  onChange: (content: string) => void;
}) {
  const divRef = useRef<HTMLDivElement>(null);
  const lastContentRef = useRef(content);
  const isComposingRef = useRef(false);

  // Only update innerHTML when slide changes (not on every content update)
  useEffect(() => {
    if (divRef.current && lastContentRef.current !== content) {
      // Only set innerHTML if the element doesn't have focus
      // This prevents resetting content while user is typing
      if (document.activeElement !== divRef.current) {
        divRef.current.innerHTML = content;
      }
      lastContentRef.current = content;
    }
  }, [slideId, content]);

  // Set initial content on mount
  useEffect(() => {
    if (divRef.current) {
      divRef.current.innerHTML = content;
    }
  }, [slideId]); // Only on slideId change

  const handleInput = useCallback(() => {
    if (divRef.current && !isComposingRef.current) {
      const newContent = divRef.current.innerHTML;
      lastContentRef.current = newContent;
      onChange(newContent);
    }
  }, [onChange]);

  // Handle composition events for IME input (important for some mobile keyboards)
  const handleCompositionStart = useCallback(() => {
    isComposingRef.current = true;
  }, []);

  const handleCompositionEnd = useCallback(() => {
    isComposingRef.current = false;
    handleInput();
  }, [handleInput]);

  return (
    <div
      ref={divRef}
      contentEditable
      suppressContentEditableWarning
      onInput={handleInput}
      onCompositionStart={handleCompositionStart}
      onCompositionEnd={handleCompositionEnd}
      className="w-full bg-[var(--surface-1)]/50 border border-[var(--border-hover)] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[var(--accent)] transition min-h-[8rem] max-h-64 overflow-y-auto"
      style={{ WebkitUserSelect: 'text', userSelect: 'text' }}
    />
  );
}

function DashboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const confirm = useConfirm();
  const appContext = useAppContextSafe();
  const projectId = searchParams.get('project') || undefined;

  // Hooks must be called before any conditional returns
  const {
    project: loadedProject,
    loading: projectLoading,
    saving: projectSaving,
    saveProject: saveProjectToServer,
    autoSave: autoSaveProject,
    addToHistory,
    undo: undoProject,
    redo: redoProject,
    canUndo,
    canRedo
  } = useProject(projectId);

  const [activeSlideId, setActiveSlideId] = useState<string>('1');
  const [isPropertiesPanelOpen, setIsPropertiesPanelOpen] = useState(false);
  const [isMobileSlidesOpen, setIsMobileSlidesOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [projectName, setProjectName] = useState('Untitled Project');
  const [projectOptions, setProjectOptions] = useState<any>({});
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState({ current: 0, total: 0, status: '' });
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiSlideCount, setAiSlideCount] = useState(6);
  const [aiWritingStyle, setAiWritingStyle] = useState<string>('Professional');
  const [aiSlideStyle, setAiSlideStyle] = useState<'visual' | 'text' | 'mixed'>('text');
  const [aiLanguage, setAiLanguage] = useState<string>('en');
  const [aiWordCount, setAiWordCount] = useState<number | null>(null);
  const [aiTone, setAiTone] = useState<string>('neutral');
  const [aiAutoHashtags, setAiAutoHashtags] = useState<boolean>(false);
  const [aiIncludeStats, setAiIncludeStats] = useState<boolean>(false);
  const [aiAccessibility, setAiAccessibility] = useState<boolean>(false);
  const [aiSmartColors, setAiSmartColors] = useState<boolean>(false);
  const [aiFreshDesign, setAiFreshDesign] = useState<boolean>(false);
  const [aiAudience, setAiAudience] = useState<string>('');
  const [aiGoal, setAiGoal] = useState<string>('');
  const [isAdvancedOptionsOpen, setIsAdvancedOptionsOpen] = useState<boolean>(false);
  const [activeTool, setActiveTool] = useState<'select' | 'text' | 'image' | 'color'>('select');
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [showTextFormattingToolbar, setShowTextFormattingToolbar] = useState(false);
  const [isTextToolbarOpen, setIsTextToolbarOpen] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [gridSize, setGridSize] = useState(40);
  const [showGuides, setShowGuides] = useState(false);
  
  // Core feature states
  const [showQuickExport, setShowQuickExport] = useState(false);

  // Calculate scale for Rnd
  const [currentScale, setCurrentScale] = useState(0.6);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const colorInputRef = useRef<HTMLInputElement>(null);
  const docUploadInputRef = useRef<HTMLInputElement>(null);
  const slideDownloadRef = useRef<HTMLDivElement>(null);
  const slidesScrollRef = useRef<HTMLDivElement>(null);
  const sidebarSlideRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const isScrollSyncingRef = useRef(false);
  const activeSlideIdRef = useRef(activeSlideId);
  const slidesRef = useRef<SlideData[]>([]); // Ref to always have latest slides for export
  const [slideDownloadData, setSlideDownloadData] = useState<SlideData | null>(null);
  const [downloadingSlideId, setDownloadingSlideId] = useState<string | null>(null);
  const [copyingSlideId, setCopyingSlideId] = useState<string | null>(null);
  const [docAttachment, setDocAttachment] = useState<{ name: string; text: string; sections?: string[]; wordCount?: number; truncated?: boolean } | null>(null);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [docUploadError, setDocUploadError] = useState<string | null>(null);
  
  // URL Import state
  const [aiInputTab, setAiInputTab] = useState<'prompt' | 'document' | 'url'>('prompt');
  const [urlInput, setUrlInput] = useState('');
  const [urlAttachment, setUrlAttachment] = useState<{ 
    title: string; 
    text: string; 
    sections?: string[]; 
    wordCount?: number; 
    truncated?: boolean;
    sourceUrl: string;
    sourceDomain: string;
    description?: string;
  } | null>(null);
  const [isParsingUrl, setIsParsingUrl] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [urlOwnershipConfirmed, setUrlOwnershipConfirmed] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [regeneratingSlideId, setRegeneratingSlideId] = useState<string | null>(null);

  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  // Onboarding
  const [showOnboarding, setShowOnboarding] = useState(false);
  useEffect(() => {
    if (typeof window !== 'undefined' && !localStorage.getItem('slidecraft_onboarded')) {
      setShowOnboarding(true);
    }
  }, []);
  const dismissOnboarding = useCallback(() => {
    setShowOnboarding(false);
    if (typeof window !== 'undefined') localStorage.setItem('slidecraft_onboarded', '1');
  }, []);
  const handleOnboardingGenerate = useCallback(() => {
    dismissOnboarding();
    setAiPrompt('10 Productivity Hacks Every Remote Worker Needs');
    setIsAiModalOpen(true);
  }, [dismissOnboarding]);
  
  // Image Picker state (Unsplash search)
  const [isImagePickerOpen, setIsImagePickerOpen] = useState(false);
  const [imagePickerMode, setImagePickerMode] = useState<'single' | 'all'>('single');
  const [unsplashQuery, setUnsplashQuery] = useState('');
  const [unsplashResults, setUnsplashResults] = useState<any[]>([]);
  const [unsplashLoading, setUnsplashLoading] = useState(false);
  const [unsplashPage, setUnsplashPage] = useState(1);
  const [unsplashTotal, setUnsplashTotal] = useState(0);
  const [imageUrlInput, setImageUrlInput] = useState('');
  

  // Brand settings state
  const [brandSettings, setBrandSettings] = useState({
    handle: '@carouslk',
    category: '',
    fontFamily: 'var(--font-inter)',
    backgroundColor: '#0B0F19',
    textColor: '#ffffff',
    accentColor: '#ffd700',
    logoUrl: null as string | null
  });
  const [isLoadingBrandSettings, setIsLoadingBrandSettings] = useState(false);
  const [isSavingBrandSettings, setIsSavingBrandSettings] = useState(false);

  // Load brand settings from API
  // Also load from localStorage for unauthenticated users
  // NOTE: This only updates brandSettings state, does NOT overwrite slide properties
  // (slide properties are only set when creating new slides or loading a project)
  const loadBrandSettings = useCallback(async () => {
    try {
      setIsLoadingBrandSettings(true);
      let loaded = false;
      if (status === 'authenticated') {
        const response = await fetch('/api/user/brand-settings');
        if (response.ok) {
          const data = await response.json();
          if (data.settings) {
            setBrandSettings(data.settings);
            loaded = true;
          }
        }
      }
      if (!loaded && typeof window !== 'undefined') {
        const stored = localStorage.getItem('carouslk_brand_settings');
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            setBrandSettings(parsed);
          } catch (e) {
            console.error('Failed to parse stored brand settings', e);
          }
        }
      }
    } catch (error) {
      // Error handled silently
    } finally {
      setIsLoadingBrandSettings(false);
    }
  }, [status]);

  // Save brand settings to API
  const saveBrandSettings = useCallback(async () => {
    if (status !== 'authenticated') return;
    
    try {
      setIsSavingBrandSettings(true);
      const response = await fetch('/api/user/brand-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: brandSettings })
      });
      
      if (response.ok) {
        // Apply to all existing slides
        setSlides(prevSlides => prevSlides.map(slide => ({
          ...slide,
          handle: brandSettings.handle,
          category: brandSettings.category,
          fontFamily: brandSettings.fontFamily,
          backgroundColor: brandSettings.backgroundColor,
          textColor: brandSettings.textColor,
          accentColor: brandSettings.accentColor,
          logoUrl: brandSettings.logoUrl || null
        })));
      } else {
        toast.error('Failed to save brand settings');
      }
    } catch (error) {
      console.error('Failed to save brand settings:', error);
      toast.error('Failed to save brand settings');
    } finally {
      setIsSavingBrandSettings(false);
    }
  }, [brandSettings, status]);

  // Handle logo upload

  // Reset brand settings to defaults
  const resetBrandSettings = useCallback(async () => {
    if (status !== 'authenticated') return;
    
    const confirmed = await confirm({
      title: 'Reset Brand Settings',
      message: 'Are you sure you want to reset brand settings to defaults? This cannot be undone.',
      confirmText: 'Reset',
      variant: 'warning'
    });
    if (!confirmed) return;
    
    try {
      setIsSavingBrandSettings(true);
      const response = await fetch('/api/user/brand-settings', {
        method: 'DELETE'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.settings) {
          setBrandSettings(data.settings);
          // Apply to all existing slides
          setSlides(prevSlides => prevSlides.map(slide => ({
            ...slide,
            handle: data.settings.handle,
            category: data.settings.category,
            fontFamily: data.settings.fontFamily,
            backgroundColor: data.settings.backgroundColor,
            textColor: data.settings.textColor,
            accentColor: data.settings.accentColor,
            logoUrl: data.settings.logoUrl || null
          })));
          toast.success('Brand settings reset to defaults');
        }
      } else {
        toast.error('Failed to reset brand settings');
      }
    } catch (error) {
      console.error('Failed to reset brand settings:', error);
      toast.error('Failed to reset brand settings');
    } finally {
      setIsSavingBrandSettings(false);
    }
  }, [status, confirm]);

  // Load brand settings on mount
  useEffect(() => {
    if (status === 'authenticated') {
      loadBrandSettings();
    }
  }, [status, loadBrandSettings]);


  // Reload brand settings when settings modal opens
  useEffect(() => {
    if (isSettingsOpen && status === 'authenticated') {
      loadBrandSettings();
    }
  }, [isSettingsOpen, status, loadBrandSettings]);

  // Check authentication before rendering
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    const handleResize = () => {
        const width = window.innerWidth;
        if (width >= 1280) setCurrentScale(0.6);      // xl
        else if (width >= 1024) setCurrentScale(0.5); // lg
        else if (width >= 768) setCurrentScale(0.45); // md
        else if (width >= 640) setCurrentScale(0.35); // sm
        else {
            // Mobile: Calculate exact scale to fit screen width minus padding
            // 1080px slide, 32px padding (16px on each side)
            const mobileScale = (width - 32) / 1080;
            setCurrentScale(Math.min(mobileScale, 0.35));
        }
    };

    handleResize(); // Initial call
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [slides, setSlides] = useState<SlideData[]>([
    {
      id: '1',
      type: 'cover',
      title: 'THE SECRET SAUCE',
      subtitle: 'How to create viral carousels in seconds.',
      category: '',
      accentColor: '#ffd700',
      handle: '@carouslk',
      fontFamily: 'var(--font-inter)',
      fontScale: 1,
      backgroundColor: '#0B0F19',
      textColor: '#ffffff',
      mediaType: null,
      mediaAspectRatio: 16 / 9,
      mediaWidthPercent: 100,
      mediaAlignment: 'center',
      elementOrder: ['title', 'subtitle', 'media'],
      customBlocks: [],
    },
    {
      id: '2',
      type: 'content',
        title: 'Hook Your Audience',
        content: '<p>Stop the scroll with a <strong>bold promise</strong> or a challenging question.</p>',
        emoji: '',
        category: '',
        accentColor: '#ffd700',
        handle: '@carouslk',
      fontFamily: 'var(--font-inter)',
      fontScale: 1,
      backgroundColor: '#0B0F19',
      textColor: '#ffffff',
      mediaType: null,
      mediaAspectRatio: 16 / 9,
      mediaWidthPercent: 100,
      mediaAlignment: 'center',
      elementOrder: ['emoji', 'title', 'content', 'media'],
      customBlocks: [],
    },
    {
        id: '3',
        type: 'content',
        title: 'Tell a Story',
        content: '<p>Facts tell, but <em>stories sell</em>. Connect emotionally.</p>',
        emoji: '',
        category: '',
        accentColor: '#ffd700',
        handle: '@carouslk',
        fontFamily: 'var(--font-inter)',
        fontScale: 1,
        backgroundColor: '#0B0F19',
        textColor: '#ffffff',
        mediaType: null,
        mediaAspectRatio: 16 / 9,
        mediaWidthPercent: 100,
        mediaAlignment: 'center',
        elementOrder: ['emoji', 'title', 'content', 'media'],
        customBlocks: [],
      }
  ]);

  // --- Undo/Redo history helpers ---
  const lastHistorySnapshotRef = useRef<string>('');
  const historyDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipNextHistoryRef = useRef(false);

  const commitSlidesSkipHistory = useCallback((nextSlides: SlideData[]) => {
    if (historyDebounceRef.current) {
      clearTimeout(historyDebounceRef.current);
      historyDebounceRef.current = null;
    }
    skipNextHistoryRef.current = true;
    lastHistorySnapshotRef.current = JSON.stringify(nextSlides);
    setSlides(nextSlides);
  }, []);

  const commitSlidesImmediateHistory = useCallback((nextSlides: SlideData[]) => {
    if (historyDebounceRef.current) {
      clearTimeout(historyDebounceRef.current);
      historyDebounceRef.current = null;
    }
    setSlides(nextSlides);
    addToHistory(nextSlides);
    lastHistorySnapshotRef.current = JSON.stringify(nextSlides);
  }, [addToHistory]);

  // Debounced history capture for all slide changes (covers "delete inside a slide" too).
  useEffect(() => {
    if (!slides || slides.length === 0) return;

    const serialized = JSON.stringify(slides);
    if (serialized === lastHistorySnapshotRef.current) return;

    if (skipNextHistoryRef.current) {
      skipNextHistoryRef.current = false;
      lastHistorySnapshotRef.current = serialized;
      return;
    }

    if (historyDebounceRef.current) clearTimeout(historyDebounceRef.current);
    historyDebounceRef.current = setTimeout(() => {
      addToHistory(slides);
      lastHistorySnapshotRef.current = JSON.stringify(slides);
      historyDebounceRef.current = null;
    }, 250);

    return () => {
      if (historyDebounceRef.current) {
        clearTimeout(historyDebounceRef.current);
        historyDebounceRef.current = null;
      }
    };
  }, [slides, addToHistory]);

  const activeSlide = slides.find(s => s.id === activeSlideId) || slides[0];
  const activeSlideIndex = Math.max(0, slides.findIndex(s => s.id === activeSlideId));

  // Stable close callbacks for memoized modals
  const closeExport = useCallback(() => setIsExportOpen(false), []);
  const closeSettings = useCallback(() => setIsSettingsOpen(false), []);
  const closeTemplates = useCallback(() => setIsTemplatesOpen(false), []);
  const closeAiModal = useCallback(() => setIsAiModalOpen(false), []);
  const closeImagePicker = useCallback(() => { setIsImagePickerOpen(false); setActiveTool('select'); }, []);
  const closePreview = useCallback(() => setPreviewImageUrl(null), []);

  // Feature handlers


  const handleApplyBrand = useCallback((colors: any[], fonts: any[]) => {
    if (colors.length > 0) {
      setSlides(prevSlides => prevSlides.map(s => ({ ...s, accentColor: colors[0].value })));
    }
    if (fonts.length > 0) {
      setSlides(prevSlides => prevSlides.map(s => ({ ...s, fontFamily: fonts[0].value })));
    }
    toast.success('Brand applied to slides');
  }, []);


  const createCustomBlock = (): CustomBlock => ({
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `block-${Date.now()}-${Math.random()}`,
    html: '<p>Text block</p>',
    x: 100,
    y: 400,
    width: 360,
    height: 140,
  });

  const normalizeSlides = useCallback((incomingSlides: SlideData[]) => {
    const timestamp = Date.now();
    const baseSlide = slides[0];
    
    // Helper to get default element order based on slide type
    const getDefaultElementOrder = (type: string, hasInfographic: boolean = false) => {
      switch (type) {
        case 'cover': return ['title', 'subtitle', 'media'];
        case 'chart': return ['emoji', 'title', 'content', 'chart', 'media'];
        case 'visual': return hasInfographic ? ['title', 'infographic', 'media'] : ['title', 'content', 'media'];
        default: return ['emoji', 'title', 'content', 'media'];
      }
    };
    
    return incomingSlides.map((slide, index) => ({
      ...slide,
      fontScale: slide.fontScale ?? 1,
      mediaType: slide.mediaType ?? null,
      mediaAspectRatio: slide.mediaAspectRatio ?? 16 / 9,
      mediaWidthPercent: typeof slide.mediaWidthPercent === 'number' ? slide.mediaWidthPercent : 100,
      mediaAlignment: slide.mediaAlignment || 'center',
      // Apply brand settings to slides
      category: slide.category ?? brandSettings.category ?? baseSlide?.category ?? '',
      handle: slide.handle ?? brandSettings.handle ?? baseSlide?.handle ?? '@carouslk',
      accentColor: slide.accentColor ?? brandSettings.accentColor ?? baseSlide?.accentColor,
      backgroundColor: slide.backgroundColor ?? brandSettings.backgroundColor ?? baseSlide?.backgroundColor,
      textColor: slide.textColor ?? brandSettings.textColor ?? baseSlide?.textColor,
      fontFamily: slide.fontFamily ?? brandSettings.fontFamily ?? baseSlide?.fontFamily,
      // Always apply logoUrl from brand settings
      logoUrl: brandSettings.logoUrl || null,
      elementOrder: slide.elementOrder || getDefaultElementOrder(slide.type, !!slide.infographicData),
      customBlocks: Array.isArray(slide.customBlocks) ? slide.customBlocks : [],
      id: slide.id || `${timestamp}-${index}`,
    }));
  }, [slides, brandSettings]);

  useEffect(() => {
    activeSlideIdRef.current = activeSlideId;
  }, [activeSlideId]);

  // Keep slidesRef updated for export to always have fresh data
  useEffect(() => {
    slidesRef.current = slides;
  }, [slides]);

  useEffect(() => {
    if (!activeSlideId) return;
    const sidebarNode = sidebarSlideRefs.current[activeSlideId];
    if (sidebarNode && sidebarNode.scrollIntoView) {
      sidebarNode.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }, [activeSlideId]);

  useEffect(() => {
    const container = slidesScrollRef.current;
    if (!container) return;

    const slideElements = Array.from(container.querySelectorAll('[data-slide-id]')) as HTMLElement[];
    if (!slideElements.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (isScrollSyncingRef.current) return;
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) {
          const newId = visible.target.getAttribute('data-slide-id');
          if (newId && newId !== activeSlideIdRef.current) {
            setActiveSlideId(newId);
          }
        }
      },
      { root: container, threshold: 0.6 }
    );

    slideElements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [slides, setActiveSlideId]);

  useEffect(() => {
    const container = slidesScrollRef.current;
    if (!container) return;
    const target = container.querySelector(`[data-slide-id="${activeSlideId}"]`) as HTMLElement | null;
    if (!target) return;

    const containerRect = container.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const buffer = containerRect.height * 0.1;
    const fullyVisible =
      targetRect.top >= containerRect.top + buffer &&
      targetRect.bottom <= containerRect.bottom - buffer;

    if (fullyVisible) return;

    isScrollSyncingRef.current = true;
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const timeout = window.setTimeout(() => {
      isScrollSyncingRef.current = false;
    }, 500);

    return () => window.clearTimeout(timeout);
  }, [activeSlideId]);

  const goToSlideByIndex = (index: number) => {
    const target = slides[index];
    if (target) {
      setActiveSlideId(target.id);
    }
  };

  const addNewSlide = useCallback(() => {
    const newId = Date.now().toString();
    setSlides(prevSlides => [...prevSlides, {
      id: newId,
      type: 'content',
      title: 'New Slide',
      content: '<p>Edit this content...</p>',
      emoji: '',
      category: brandSettings.category,
      accentColor: brandSettings.accentColor,
      handle: brandSettings.handle,
      fontFamily: brandSettings.fontFamily,
      fontScale: prevSlides[0]?.fontScale ?? 1,
      backgroundColor: brandSettings.backgroundColor,
      textColor: brandSettings.textColor,
      logoUrl: brandSettings.logoUrl || null,
      mediaType: null,
      mediaUrl: undefined,
      embedHtml: undefined,
      mediaAspectRatio: 16 / 9,
      mediaWidthPercent: 100,
      mediaAlignment: 'center',
      elementOrder: ['emoji', 'title', 'content', 'media'],
      customBlocks: [],
    }]);
    setActiveSlideId(newId);
  }, [brandSettings]);

  const getSlideFilename = (slide: SlideData, index: number) => {
    const sanitized = (slide.title || '')
      .replace(/<[^>]*>/g, '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .slice(0, 24);
    const fallback = sanitized || `slide-${index + 1}`;
    const suffix = (index + 1).toString().padStart(2, '0');
    return `${fallback}-${suffix}`;
  };

  // Load project when it's available - only run on initial project load
  // NOT when brandSettings changes (that would overwrite theme changes)
  const loadedProjectIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (loadedProject && !projectLoading && loadedProject.id !== loadedProjectIdRef.current) {
      // Mark this project as loaded to prevent re-running
      loadedProjectIdRef.current = loadedProject.id;
      
      // Apply brand settings to loaded project slides (only for fields the slide doesn't have)
      const slidesWithBrandSettings = loadedProject.slides.map(slide => ({
        ...slide,
        // Apply brand settings only if slide doesn't have its own values
        handle: slide.handle || brandSettings.handle,
        category: slide.category || brandSettings.category,
        fontFamily: slide.fontFamily || brandSettings.fontFamily,
        backgroundColor: slide.backgroundColor || brandSettings.backgroundColor,
        textColor: slide.textColor || brandSettings.textColor,
        accentColor: slide.accentColor || brandSettings.accentColor,
        // Always apply logoUrl from brand settings (it's the source of truth)
        logoUrl: brandSettings.logoUrl || null
      }));
      
      setSlides(slidesWithBrandSettings);
      setProjectName(loadedProject.name);
      setProjectOptions(loadedProject.options || {});
      if (loadedProject.slides.length > 0) {
        setActiveSlideId(loadedProject.slides[0].id);
      }
    }
  }, [loadedProject, projectLoading, brandSettings]);

  // Auto-save when slides change
  useEffect(() => {
    if (projectId && slides.length > 0) {
      autoSaveProject(slides, projectOptions);
    }
  }, [slides, projectOptions, projectId, autoSaveProject]);

  // Auto-open AI modal for new users (no existing project loaded)
  const hasAutoOpenedRef = useRef(false);
  useEffect(() => {
    if (!projectId && !hasAutoOpenedRef.current) {
      hasAutoOpenedRef.current = true;
      const timer = setTimeout(() => setIsAiModalOpen(true), 400);
      return () => clearTimeout(timer);
    }
  }, [projectId]);

  // Sync context with app state for AI assistant
  useEffect(() => {
    if (appContext) {
      appContext.setSlideCount(slides.length);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slides.length]);

  // Track current section for context awareness
  useEffect(() => {
    if (appContext) {
      if (isAiModalOpen) {
        appContext.setCurrentSection('ai-generate');
      } else if (isSettingsOpen) {
        appContext.setCurrentSection('theme');
      } else if (isPropertiesPanelOpen) {
        appContext.setCurrentSection('properties');
      } else if (isMobileSlidesOpen) {
        appContext.setCurrentSection('slides-panel');
      } else {
        appContext.setCurrentSection('editor');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAiModalOpen, isSettingsOpen, isPropertiesPanelOpen, isMobileSlidesOpen]);

  // Handle project load from ProjectManager - also apply brand settings
  const handleProjectLoad = useCallback((project: { id: string; name: string; slides: SlideData[]; options: any }) => {
    // Apply brand settings to loaded project slides
    const slidesWithBrandSettings = project.slides.map(slide => ({
      ...slide,
      handle: slide.handle || brandSettings.handle,
      category: slide.category || brandSettings.category,
      fontFamily: slide.fontFamily || brandSettings.fontFamily,
      backgroundColor: slide.backgroundColor || brandSettings.backgroundColor,
      textColor: slide.textColor || brandSettings.textColor,
      accentColor: slide.accentColor || brandSettings.accentColor,
      logoUrl: brandSettings.logoUrl || null
    }));
    
    setSlides(slidesWithBrandSettings);
    setProjectName(project.name);
    setProjectOptions(project.options || {});
    if (project.slides.length > 0) {
      setActiveSlideId(project.slides[0].id);
    }
    addToHistory(slidesWithBrandSettings);
  }, [addToHistory, brandSettings]);

  // Undo handler
  const handleUndo = useCallback(() => {
    const previousSlides = undoProject();
    if (previousSlides) {
      commitSlidesSkipHistory(previousSlides);
    }
  }, [undoProject, commitSlidesSkipHistory]);

  // Redo handler
  const handleRedo = useCallback(() => {
    const nextSlides = redoProject();
    if (nextSlides) {
      commitSlidesSkipHistory(nextSlides);
    }
  }, [redoProject, commitSlidesSkipHistory]);

  // Manual save handler for keyboard shortcut
  const saveProject = useCallback(async () => {
    if (!projectId) {
      toast.info('Create or open a project to save');
      return;
    }
    try {
      await saveProjectToServer(slides, projectOptions);
      toast.success('Project saved');
    } catch {
      toast.error('Failed to save project');
    }
  }, [projectId, slides, projectOptions, saveProjectToServer]);

  // Update slides with history tracking
  const updateSlides = useCallback((newSlides: SlideData[]) => {
    commitSlidesImmediateHistory(newSlides);
  }, [commitSlidesImmediateHistory]);

  // Delete a slide
  const handleDeleteSlide = useCallback((id: string) => {
    if (slides.length === 1) {
      toast.error('You need at least one slide in your project.');
      return;
    }

    const targetIndex = slides.findIndex(s => s.id === id);
    const updatedSlides = slides.filter(s => s.id !== id);
    commitSlidesImmediateHistory(updatedSlides);

    if (activeSlideId === id && updatedSlides.length > 0) {
      const fallbackIndex = Math.min(targetIndex, updatedSlides.length - 1);
      setActiveSlideId(updatedSlides[fallbackIndex].id);
    }
    toast.success('Slide deleted');
  }, [slides, activeSlideId, commitSlidesImmediateHistory]);

  // Regenerate a single slide with AI — supports optional refinement instruction
  // Detect which HTML pattern (A-L) a slide is currently using, so refinement preserves layout.
  // [\s\S]*? matches across newlines (no /s flag so TS target ES2017 is ok)
  const detectSlidePattern = useCallback((content: string): string => {
    if (!content) return '';
    // F before C — Stats Grid has bebas-neue too, so check it first with the 2x2 grid marker
    if (/grid-template-columns:1fr 1fr[\s\S]*?font-family:var\(--font-bebas-neue\)[\s\S]*?font-size:2em/.test(content)) return 'F (Stats Grid — keep exact same 2x2 grid layout)';
    if (/font-family:var\(--font-bebas-neue\)[\s\S]*?font-size:1\.6em/.test(content)) return 'C (Numbered List — keep exact same numbered layout)';
    // G: two-column grid with Before/After labels
    if (/grid-template-columns:1fr 1fr[\s\S]*?(Before|After)/.test(content)) return 'G (Before/After — keep exact same two-column comparison layout)';
    // I: timeline dots (width:10px;height:10px;border-radius:50%)
    if (/width:10px;height:10px;border-radius:50%/.test(content)) return 'I (Timeline — keep exact same timeline layout)';
    // J: highlight box — accent bg + border + Key Takeaway label
    if (/border-radius:12px[\s\S]*?(Key Takeaway|⚡)/.test(content) || /ACCENT_BG[\s\S]*?ACCENT_BORDER/.test(content)) return 'J (Highlight Box — keep exact same highlight box layout)';
    // K: single large metric centered
    if (/font-size:3\.5em/.test(content) && /text-align:center/.test(content)) return 'K (Metric Callout — keep exact same single metric layout)';
    // L: quote card with italic text and attribution
    if (/font-style:italic/.test(content) && /—\s/.test(content)) return 'L (Quote Card — keep exact same quote card layout)';
    // E: pill/tag cloud (flex-wrap + border-radius:100px)
    if (/flex-wrap:wrap[\s\S]*?border-radius:100px/.test(content)) return 'E (Pill Tags — keep exact same tag cloud layout)';
    // H: arrow list (→ arrows as absolute positioned markers)
    if (/position:absolute;left:0[\s\S]*?→/.test(content) || content.includes('→')) return 'H (Arrow List — keep exact same arrow list layout)';
    // A: quote with left border + tip box
    if (/border-left:3px solid[\s\S]*?padding-left:16px/.test(content)) return 'A (Quote + Tip — keep exact same quote with tip box layout)';
    // D: code block (dark background + monospace font)
    if (/rgba\(0,0,0,0\.35\)[\s\S]*?monospace/.test(content) || /font-family:monospace[\s\S]*?background:rgba\(0,0,0/.test(content)) return 'D (Code Block — keep exact same code block layout)';
    // B: icon cards (flex column of cards with flex-shrink:0 icons)
    if (/flex-shrink:0[\s\S]*?font-weight:700/.test(content)) return 'B (Icon Cards — keep exact same icon cards layout)';
    return '';
  }, []);

  const handleRegenerateSlide = useCallback(async (id: string, instruction?: string) => {
    const slideIndex = slides.findIndex(s => s.id === id);
    if (slideIndex === -1) return;
    const slide = slides[slideIndex];

    setRegeneratingSlideId(id);
    try {
      const carouselTopic = slides[0]?.title?.replace(/<[^>]*>/g, '') || 'General';
      const detectedPattern = slide.type !== 'visual' ? detectSlidePattern(slide.content || '') : '';
      const response = await fetch('/api/generate-slide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slideTitle: slide.title,
          slideContent: slide.content,
          slideLabel: slide.slideLabel,
          slideIndex,
          totalSlides: slides.length,
          carouselTopic,
          pattern: detectedPattern,
          instruction,
          slideType: slide.type,
          infographicLayout: slide.infographicData?.layout,
          accentColor: slide.accentColor || brandSettings.accentColor,
          textColor: slide.textColor || brandSettings.textColor,
          backgroundColor: slide.backgroundColor || brandSettings.backgroundColor,
        }),
      });

      const data = await response.json();
      if (!response.ok || data.error) {
        toast.error(data.error || 'Failed to regenerate slide');
        return;
      }

      // Re-extract infographicData for visual slides from the new <ul><li> content
      let newInfographicData = slide.infographicData;
      if (slide.type === 'visual' && data.content) {
        const liMatches = data.content.match(/<li[^>]*>([\s\S]*?)<\/li>/gi) || [];
        const items = liMatches
          .map((li: string) => li.replace(/<[^>]+>/g, '').replace(/&[a-z]+;/gi, ' ').replace(/\s+/g, ' ').trim())
          .filter((t: string) => t.length > 1);
        if (items.length > 0) {
          newInfographicData = { items, layout: data.infographicLayout || slide.infographicData?.layout || 'cards-grid' };
        }
      }

      const updatedSlides = slides.map(s =>
        s.id === id
          ? { ...s, title: data.title || s.title, content: data.content || s.content, slideLabel: data.slideLabel || s.slideLabel, infographicData: newInfographicData }
          : s
      );
      commitSlidesImmediateHistory(updatedSlides);
      toast.success(instruction ? 'Slide refined!' : 'Slide regenerated!');
    } catch {
      toast.error('Failed to regenerate slide');
    } finally {
      setRegeneratingSlideId(null);
    }
  }, [slides, commitSlidesImmediateHistory]);

  // Duplicate a slide
  const handleDuplicateSlide = useCallback((id: string) => {
    const slideIndex = slides.findIndex(s => s.id === id);
    if (slideIndex === -1) return;
    
    const slideToDuplicate = slides[slideIndex];
    const newId = Date.now().toString();
    const duplicatedSlide: SlideData = {
      ...slideToDuplicate,
      id: newId,
      // Deep clone arrays/objects to avoid reference issues
      elementOrder: slideToDuplicate.elementOrder ? [...slideToDuplicate.elementOrder] : undefined,
      customBlocks: slideToDuplicate.customBlocks ? slideToDuplicate.customBlocks.map(b => ({ ...b, id: `${b.id}-copy-${Date.now()}` })) : [],
      chartData: slideToDuplicate.chartData ? [...slideToDuplicate.chartData] : undefined,
    };
    
    // Insert after the original slide
    const newSlides = [...slides];
    newSlides.splice(slideIndex + 1, 0, duplicatedSlide);
    commitSlidesImmediateHistory(newSlides);
    setActiveSlideId(newId);
    toast.success('Slide duplicated');
  }, [slides, commitSlidesImmediateHistory]);

  // Move slide up/down in order
  const handleMoveSlide = useCallback((id: string, direction: 'up' | 'down') => {
    const currentIndex = slides.findIndex(s => s.id === id);
    if (currentIndex === -1) return;
    
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= slides.length) return;
    
    const newSlides = [...slides];
    [newSlides[currentIndex], newSlides[newIndex]] = [newSlides[newIndex], newSlides[currentIndex]];
    commitSlidesImmediateHistory(newSlides);
  }, [slides, commitSlidesImmediateHistory]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Close image preview modal on ESC
      if (e.key === 'Escape' && previewImageUrl) {
        setPreviewImageUrl(null);
        return;
      }

      
      // Don't trigger destructive/editor-wide shortcuts when typing in inputs/textareas/contenteditable
      const target = e.target as HTMLElement;
      const isEditing = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      // Allow browser-native undo/redo while editing text.
      if (isEditing) {
        // Still allow Save while typing (common behavior)
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
          e.preventDefault();
          saveProject();
        }
        return;
      }
      
      // Undo: Ctrl+Z
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (canUndo) handleUndo();
        return;
      }
      
      // Redo: Ctrl+Y or Ctrl+Shift+Z
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        if (canRedo) handleRedo();
        return;
      }
      
      // Save: Ctrl+S
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveProject();
        return;
      }
      
      // Duplicate slide: Ctrl+D
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        if (activeSlideId) {
          handleDuplicateSlide(activeSlideId);
        }
        return;
      }
      
      // Delete slide: Delete or Backspace (when not editing)
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (activeSlideId && slides.length > 1) {
          e.preventDefault();
          handleDeleteSlide(activeSlideId);
        }
        return;
      }
      
      // Navigate slides: Arrow Up/Down or Arrow Left/Right
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        const currentIndex = slides.findIndex(s => s.id === activeSlideId);
        if (currentIndex > 0) {
          setActiveSlideId(slides[currentIndex - 1].id);
        }
        return;
      }
      
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        const currentIndex = slides.findIndex(s => s.id === activeSlideId);
        if (currentIndex < slides.length - 1) {
          setActiveSlideId(slides[currentIndex + 1].id);
        }
        return;
      }
      
      // Add new slide: Ctrl+Enter
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        addNewSlide();
        return;
      }
      
      // Move slide up: Ctrl+Shift+Up
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'ArrowUp') {
        e.preventDefault();
        if (activeSlideId) {
          handleMoveSlide(activeSlideId, 'up');
        }
        return;
      }
      
      // Move slide down: Ctrl+Shift+Down
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'ArrowDown') {
        e.preventDefault();
        if (activeSlideId) {
          handleMoveSlide(activeSlideId, 'down');
        }
        return;
      }
      
      // Close modals: Escape
      if (e.key === 'Escape') {
        return;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canUndo, canRedo, handleUndo, handleRedo, activeSlideId, slides, handleDuplicateSlide, handleDeleteSlide, handleMoveSlide, addNewSlide, saveProject, previewImageUrl]);

  // Reorder slides via drag and drop
  const handleReorderSlides = (activeId: string, overId: string) => {
    if (activeId === overId) return;
    
    const oldIndex = slides.findIndex(s => s.id === activeId);
    const newIndex = slides.findIndex(s => s.id === overId);
    
    if (oldIndex === -1 || newIndex === -1) return;
    
    const newSlides = [...slides];
    const [movedSlide] = newSlides.splice(oldIndex, 1);
    newSlides.splice(newIndex, 0, movedSlide);
    updateSlides(newSlides);
  };

  const handleDownloadSlideImage = useCallback(async (slide: SlideData, index: number) => {
    // Prevent multiple simultaneous downloads
    if (downloadingSlideId) {
      return;
    }

    try {
      setDownloadingSlideId(slide.id);
      
      // Clone the slide data for rendering
      const tempSlideData = { ...slide };

      // If video, try to get a thumbnail or fallback to a placeholder for the screenshot
      // Standard video/iframe screenshots (like YouTube) will be black due to CORS.
      // We'll instruct the <Slide> component to render a static placeholder if `isExporting` mode is active.
      // However, for single slide download, we're using `slideDownloadData`.
      // We can add a flag `_isDownloading` to the slide data.
      (tempSlideData as any)._isDownloading = true;

      setSlideDownloadData(tempSlideData);

      // Wait for DOM to update and render
      await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));

      if (!slideDownloadRef.current) {
        throw new Error('Slide canvas not available');
      }

      const dataUrl = await lazyToPng(slideDownloadRef.current, {
        cacheBust: true,
        width: 1080,
        height: 1080,
        pixelRatio: 2,
      });

      // Convert to blob and download
      const blob = await (await fetch(dataUrl)).blob();
      
      // Create a unique download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${getSlideFilename(slide, index)}.png`;
      link.style.display = 'none';
      
      // Append, click, and clean up immediately
      document.body.appendChild(link);
      link.click();
      
      // Clean up after a short delay
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 100);
      
    } catch (error) {
      console.error('Single slide download failed:', error);
    } finally {
      // Delay state reset to prevent rapid repeated downloads
      setTimeout(() => {
        setDownloadingSlideId(null);
        setSlideDownloadData(null);
      }, 500);
    }
  }, [projectName]);

  // Copy slide to clipboard as image
  const handleCopySlideToClipboard = useCallback(async (slide: SlideData, index: number) => {
    if (copyingSlideId) return;
    
    try {
      setCopyingSlideId(slide.id);
      
      const tempSlideData = { ...slide, _isDownloading: true } as any;
      setSlideDownloadData(tempSlideData);
      
      await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
      
      if (!slideDownloadRef.current) {
        throw new Error('Slide canvas not available');
      }
      
      const dataUrl = await lazyToPng(slideDownloadRef.current, {
        cacheBust: true,
        width: 1080,
        height: 1080,
        pixelRatio: 2,
      });
      
      // Convert to blob
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      
      // Copy to clipboard
      await navigator.clipboard.write([
        new ClipboardItem({
          'image/png': blob
        })
      ]);
      
      toast.success('Slide copied to clipboard!');
    } catch (error) {
      console.error('Copy to clipboard failed:', error);
      toast.error('Failed to copy. Try downloading instead.');
    } finally {
      setTimeout(() => {
        setCopyingSlideId(null);
        setSlideDownloadData(null);
      }, 300);
    }
  }, [projectName]);

  const adjustFontScale = (delta: number) => {
    if (!activeSlide) return;
    const current = activeSlide.fontScale ?? 1;
    const next = Math.min(1.5, Math.max(0.7, parseFloat((current + delta).toFixed(2))));
    setSlides(prevSlides => prevSlides.map(s => s.id === activeSlide.id ? { ...s, fontScale: next } : s));
  };



  const handleAiGenerate = useCallback(async () => {
    const combinedSource = [urlAttachment?.text, docAttachment?.text, aiPrompt.trim()].filter(Boolean).join('\n\n').trim();
    if (!combinedSource) {
      setDocUploadError('Add a prompt, attach a document, or import a URL to proceed.');
      return;
    }
    
    setDocUploadError(null);
    setIsGenerating(true);

    try {
        // Combine sections from document and URL
        const combinedSections = [
          ...(docAttachment?.sections || []),
          ...(urlAttachment?.sections || []),
        ];

        // Load saved style unless user wants a fresh design
        let savedPatternOrder: string[] | undefined;
        let savedCreativeAngle: number | undefined;
        if (!aiFreshDesign) {
          try {
            const stored = localStorage.getItem('slidecraft_pattern_order');
            if (stored) savedPatternOrder = JSON.parse(stored);
            const storedAngle = localStorage.getItem('slidecraft_creative_angle');
            if (storedAngle) savedCreativeAngle = JSON.parse(storedAngle);
          } catch { /* ignore */ }
        }

        const response = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: combinedSource,
            slideCount: aiSlideCount,
            writingStyle: aiWritingStyle,
            slideStyle: aiSlideStyle,
            language: aiLanguage,
            sections: combinedSections.length > 0 ? combinedSections : undefined,
            wordCount: aiWordCount || undefined,
            tone: aiTone,
            autoHashtags: aiAutoHashtags,
            includeStats: aiIncludeStats,
            accessibility: aiAccessibility,
            smartColors: aiSmartColors,
            patternOrder: savedPatternOrder,
            creativeAngle: savedCreativeAngle,
            // Pass active theme colors so they are used even if brand_settings DB is stale
            accentColor: brandSettings.accentColor,
            textColor: brandSettings.textColor,
            backgroundColor: brandSettings.backgroundColor,
            audience: aiAudience || undefined,
            goal: aiGoal || undefined,
            sourceFile: docAttachment
              ? {
                  name: docAttachment.name,
                  wordCount: docAttachment.wordCount,
                  truncated: docAttachment.truncated,
                }
              : urlAttachment
              ? {
                  name: urlAttachment.title,
                  wordCount: urlAttachment.wordCount,
                  truncated: urlAttachment.truncated,
                  sourceUrl: urlAttachment.sourceUrl,
                }
              : undefined,
          }),
        });
        
        const data = await response.json();

        if (!response.ok || data.error) {
          toast.error(data.error || 'Failed to generate slides. Please try again.');
          setIsGenerating(false);
          return;
        }

        // Save style for future "Keep My Style" generations
        try {
          if (data.patternOrder) localStorage.setItem('slidecraft_pattern_order', JSON.stringify(data.patternOrder));
          if (typeof data.creativeAngle === 'number') localStorage.setItem('slidecraft_creative_angle', JSON.stringify(data.creativeAngle));
        } catch { /* ignore */ }
        
        if (data.slides && Array.isArray(data.slides)) {
          // Helper function to extract colors from image (client-side)
          const extractColorsFromImage = async (imageUrl: string): Promise<string[]> => {
            return new Promise((resolve) => {
              const img = new Image();
              img.crossOrigin = 'anonymous';
              img.onload = () => {
                try {
                  const canvas = document.createElement('canvas');
                  const ctx = canvas.getContext('2d');
                  if (!ctx) {
                    resolve([brandSettings.accentColor || '#ffd700']);
                    return;
                  }
                  
                  canvas.width = img.width;
                  canvas.height = img.height;
                  ctx.drawImage(img, 0, 0);
                  
                  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                  const pixels = imageData.data;
                  const colorMap = new Map<string, number>();
                  
                  // Sample pixels (every 10th pixel for performance)
                  for (let i = 0; i < pixels.length; i += 40) {
                    const r = pixels[i];
                    const g = pixels[i + 1];
                    const b = pixels[i + 2];
                    const a = pixels[i + 3];
                    
                    // Skip transparent or very dark pixels
                    if (a < 128 || (r + g + b) < 30) continue;
                    
                    // Quantize colors to reduce noise
                    const qr = Math.floor(r / 32) * 32;
                    const qg = Math.floor(g / 32) * 32;
                    const qb = Math.floor(b / 32) * 32;
                    const colorKey = `${qr},${qg},${qb}`;
                    
                    colorMap.set(colorKey, (colorMap.get(colorKey) || 0) + 1);
                  }
                  
                  // Get top 5 most common colors
                  const sortedColors = Array.from(colorMap.entries())
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5)
                    .map(([color]) => {
                      const [r, g, b] = color.split(',').map(Number);
                      return `#${[r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')}`;
                    });
                  
                  resolve(sortedColors.length > 0 ? sortedColors : [brandSettings.accentColor || '#ffd700']);
                } catch (error) {
                  console.error('Color extraction error:', error);
                  resolve([brandSettings.accentColor || '#ffd700']);
                }
              };
              img.onerror = () => resolve([brandSettings.accentColor || '#ffd700']);
              img.src = imageUrl;
            });
          };

          // Auto-apply the Dev Carousel template for a polished look
          const devCarousel = BOLD_TEMPLATES.find(t => t.id === 'dev-carousel');
          const fallbackTemplate = BOLD_TEMPLATES.find(t => t.slides.length >= 2);
          const autoTemplate = devCarousel || fallbackTemplate || null;

          let themedSlides = (data.slides as SlideData[]).map((s, idx) => {
            if (!autoTemplate) return { ...s };
            const templateSlide = autoTemplate.slides[idx % autoTemplate.slides.length];
            return {
              ...s,
              backgroundColor: templateSlide.backgroundColor || s.backgroundColor || brandSettings.backgroundColor,
              textColor: templateSlide.textColor || s.textColor || brandSettings.textColor,
              accentColor: templateSlide.accentColor || s.accentColor || brandSettings.accentColor,
              fontFamily: templateSlide.fontFamily || s.fontFamily || brandSettings.fontFamily,
              fontScale: templateSlide.fontScale || s.fontScale,
              titleColor: templateSlide.titleColor,
              slideLabel: s.slideLabel || templateSlide.slideLabel,
              slideLabelColor: templateSlide.slideLabelColor,
              glowColor: templateSlide.glowColor,
              glowPosition: templateSlide.glowPosition,
              borderWidth: templateSlide.borderWidth,
              borderColor: templateSlide.borderColor,
              borderStyle: templateSlide.borderStyle,
              borderRadius: templateSlide.borderRadius,
              slidePadding: templateSlide.slidePadding,
              showNoise: templateSlide.showNoise,
              backgroundPattern: templateSlide.backgroundPattern,
              slideNumber: undefined,
              totalSlides: undefined,
              elementOrder: templateSlide.elementOrder,
              slideJustify: templateSlide.slideJustify,
            };
          });

          // Filter out empty or near-empty slides so we never show blank slides
          const nonEmpty = themedSlides.filter((s) => {
            const titleText = (s.title || '').replace(/<[^>]*>/g, '').trim();
            const contentText = (s.content || '').replace(/<[^>]*>/g, '').trim();
            const hasTitle = titleText.length > 0;
            const hasContent = contentText.length > 15;
            const isCover = s.type === 'cover';
            if (isCover) return hasTitle;
            return hasTitle && hasContent;
          });

          // Normalize slide IDs, element order etc.
          const normalized = normalizeSlides(nonEmpty.slice(0, aiSlideCount));
          
          // For Visual style: create programmatic infographics (Gamma-style)
          if (aiSlideStyle === 'visual' || aiSlideStyle === 'mixed') {
            // Generate polished HTML/CSS infographics for visual slides
            const slidesWithInfographics = normalized.map((slide, index) => {
              // For chart slides with data, generate QuickChart image URLs
              if (slide.type === 'chart' && slide.chartData && slide.chartData.length > 0) {
                const chartConfig = {
                  type: slide.chartType === 'pie' ? 'outlabeledPie' : (slide.chartType || 'bar'),
                  data: {
                    labels: slide.chartData.map((d: any) => d.name),
                    datasets: [{
                      label: slide.title || 'Data',
                      data: slide.chartData.map((d: any) => d.value),
                      backgroundColor: ['#3b82f6', '#a855f7', '#ec4899', '#10b981', '#f59e0b', '#ef4444'],
                    }]
                  },
                  options: {
                    plugins: {
                      legend: { display: true, position: 'bottom' },
                      title: { display: false }
                    }
                  }
                };
                
                const chartUrl = `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(chartConfig))}&width=800&height=600&backgroundColor=transparent`;
                
                return {
                  ...slide,
                  mediaType: 'image' as const,
                  mediaUrl: chartUrl,
                  mediaWidthPercent: 90,
                  mediaAlignment: 'center' as const,
                  // Clear the chart data to use image instead
                  chartData: undefined,
                  chartType: undefined,
                };
              }
              
              // Skip cover slides
              if (slide.type === 'cover') {
                return slide;
              }
              
              // Extract key points from content for the infographic
              const rawContent = slide.content || '';
              const title = slide.title || '';
              
              // Parse bullet points, sentences, or meaningful content
              let items: string[] = [];
              
              // Strategy 0: Extract from HTML <li> tags FIRST (AI often generates this format)
              const liMatch = rawContent.match(/<li[^>]*>([^<]+)<\/li>/gi);
              if (liMatch && liMatch.length >= 2) {
                items = liMatch
                  .map(li => li.replace(/<\/?[^>]+>/g, '').trim())
                  .filter(s => s.length > 3);
              }
              
              // Strategy 0.5: Extract from <p> tags if no <li> tags found
              if (items.length < 2) {
                const pMatch = rawContent.match(/<p[^>]*>([^<]+(?:<[^>]+>[^<]*<\/[^>]+>)*[^<]*)<\/p>/gi);
                if (pMatch && pMatch.length >= 2) {
                  items = pMatch
                    .map(p => p.replace(/<\/?[^>]+>/g, '').trim())
                    .filter(s => s.length > 5);
                }
              }
              
              // Extract text content for later analysis
              const contentText = rawContent.replace(/<[^>]*>/g, '') || '';
              

              
              // If no HTML list items found, try plain text extraction
              if (items.length < 2) {
                
                // Strategy 1: Look for bullet points
                const bulletMatch = contentText.match(/[•\-\*]\s*([^\n•\-\*]+)/g);
                // Strategy 2: Look for numbered items
                const numberedMatch = contentText.match(/\d+[.)]\s*([^\n]+)/g);
                // Strategy 3: Split by line breaks
                const lineBreaks = contentText.split(/\n+/).filter(s => s.trim().length > 15);
                
                if (bulletMatch && bulletMatch.length >= 2) {
                  items = bulletMatch
                    .map(b => b.replace(/^[•\-\*]\s*/, '').trim())
                    .filter(s => s.length > 5);
                } else if (numberedMatch && numberedMatch.length >= 2) {
                  items = numberedMatch
                    .map(n => n.replace(/^\d+[.)]\s*/, '').trim())
                    .filter(s => s.length > 5);
                } else if (lineBreaks.length >= 2) {
                  items = lineBreaks.map(s => s.trim()).filter(s => s.length > 10);
                } else {
                  // Split by sentences
                  const sentences = contentText
                    .split(/[.!?]+/)
                    .map(s => s.trim())
                    .filter(s => s.length > 15 && s.length < 120);
                  
                  if (sentences.length >= 2) {
                    items = sentences;
                  } else if (contentText.length > 20) {
                    // Use the whole content if it's meaningful
                    items = [contentText.slice(0, 100)];
                  }
                }
              }
              
              // Ensure we have at least some items
              if (items.length < 2) {
                console.warn(`⚠️ Not enough items (${items.length}) for infographic on slide "${title}". Falling back to content slide.`);
                // If we don't have enough real items, don't force a visual slide
                // Fall back to a standard content slide instead of fake data
                return {
                  ...slide,
                  type: 'content' as const,
                };
              }
              
              // Truncate and clean items for the infographic (keep them short and punchy)
              items = items
                .slice(0, 6)
                .map(item => {
                  // Strip ALL HTML tags to get clean text
                  let cleaned = item.replace(/<[^>]*>/g, '').trim();
                  cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
                  // Truncate to 60 chars max for infographic cards to maintain design
                  if (cleaned.length > 60) {
                    cleaned = cleaned.substring(0, 57) + '...';
                  }
                  return cleaned;
                });
              
              
              // Choose layout based on content type and slide position
              // 12 premium layouts for visual variety
              type InfographicLayoutType = 'cards-grid' | 'timeline' | 'process-steps' | 'feature-list' | 'metrics-row' | 'icon-cards' | 'numbered-list' | 'pyramid' | 'cycle' | 'comparison' | 'checklist' | 'quote-highlight';
              
              const layouts: InfographicLayoutType[] = [
                'cards-grid',      // Good for general content
                'timeline',        // Good for sequences
                'process-steps',   // Good for how-to content  
                'feature-list',    // Good for benefits
                'icon-cards',      // Good for tips
                'numbered-list',   // Good for steps
                'pyramid',         // Good for hierarchy
                'cycle',           // Good for processes
                'comparison',      // Good for pros/cons
                'checklist',       // Good for action items
                'quote-highlight', // Good for key insights
              ];
              
              // Smart layout selection based on content
              let layout: InfographicLayoutType;
              const titleLower = title.toLowerCase();
              const hasLotsOfNumbers = (contentText.match(/\d+/g) || []).length > 3;
              const itemCount = items.length;
              
              // Check if items contain metrics/numbers that would look better as QuickChart
              const metricsPattern = /(\d+%?|\d+x|\d+\+|\d+k|\d+K|\d+M)/i;
              const hasMetrics = items.some(item => metricsPattern.test(item));
              
              // If content is data-heavy with lots of metrics, use QuickChart bar chart
              if (hasMetrics && items.length >= 3 && hasLotsOfNumbers) {
                // Extract metrics for QuickChart
                const chartData = items.map(item => {
                  const match = item.match(/(\d+\.?\d*)/);
                  const value = match ? parseFloat(match[1]) : 0;
                  const label = item.replace(/\d+\.?\d*%?/, '').trim().substring(0, 20);
                  return { name: label || 'Metric', value };
                }).filter(d => d.value > 0);
                
                if (chartData.length >= 2) {
                  // Generate QuickChart horizontal bar chart for metrics
                  const chartConfig = {
                    type: 'horizontalBar',
                    data: {
                      labels: chartData.map(d => d.name),
                      datasets: [{
                        data: chartData.map(d => d.value),
                        backgroundColor: ['#3b82f6', '#a855f7', '#ec4899', '#10b981', '#f59e0b'],
                      }]
                    },
                    options: {
                      legend: { display: false },
                      scales: {
                        xAxes: [{ ticks: { fontColor: '#fff', fontSize: 16 } }],
                        yAxes: [{ ticks: { fontColor: '#fff', fontSize: 16 } }]
                      },
                      plugins: {
                        datalabels: {
                          anchor: 'end',
                          align: 'end',
                          color: '#fff',
                          font: { size: 18, weight: 'bold' }
                        }
                      }
                    }
                  };
                  
                  const chartUrl = `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(chartConfig))}&width=900&height=500&backgroundColor=rgba(15,23,42,0.8)`;
                  
                  return {
                    ...slide,
                    type: 'content' as const,
                    mediaType: 'image' as const,
                    mediaUrl: chartUrl,
                    mediaWidthPercent: 100,
                    mediaAlignment: 'center' as const,
                    content: `<p><strong>Key Insights:</strong></p><ul>${items.map(i => `<li>${i}</li>`).join('')}</ul>`,
                  };
                }
              }
              
              // Intelligent layout matching with MORE VARIETY
              // Use slide index to ensure visual variety across the carousel
              const variedLayouts: InfographicLayoutType[] = [
                'cards-grid',      // Slide 1
                'timeline',        // Slide 2
                'icon-cards',      // Slide 3
                'cycle',           // Slide 4
                'feature-list',    // Slide 5
                'process-steps',   // Slide 6
                'numbered-list',   // Slide 7
                'checklist',       // Slide 8
              ];
              
              // Smart keyword-based override (only for very obvious cases)
              if ((titleLower.includes('step') || titleLower.includes('process')) && itemCount <= 5) {
                layout = 'process-steps';
              } else if (titleLower.includes('timeline') || titleLower.includes('history') || titleLower.includes('evolution')) {
                layout = 'timeline';
              } else if (titleLower.includes('cycle') || titleLower.includes('loop')) {
                layout = 'cycle';
              } else if (titleLower.includes('vs') || titleLower.includes('compare')) {
                layout = 'comparison';
              } else if (titleLower.includes('pyramid') || titleLower.includes('hierarchy')) {
                layout = 'pyramid';
              } else {
                // Use varied layouts based on slide position for visual diversity
                layout = variedLayouts[index % variedLayouts.length];
              }
              
              
              return {
                ...slide,
                type: 'visual' as const,
                // Set infographic data for programmatic rendering
                infographicData: {
                  items,
                  layout: slide.infographicData?.layout || layout
                },
                // Clear content so it doesn't render as text
                content: undefined,
                // Update element order: title, then the infographic ONLY
                elementOrder: ['title', 'infographic'],
              };
            });
            
            setSlides(slidesWithInfographics);
            if (slidesWithInfographics.length > 0) {
              setActiveSlideId(slidesWithInfographics[0].id);
            }
          } else {
            setSlides(normalized);
            if (normalized.length > 0) {
              setActiveSlideId(normalized[0].id);
            }
          }
          
          setAiPrompt('');
          clearDocAttachment();
          clearUrlAttachment();
          setIsAiModalOpen(false);
          setShowQuickExport(true);
          toast.success('Carousel generated!', {
            duration: 3000,
          });
        }
      } catch (error) {
        console.error('Failed to generate slides:', error);
        toast.error('Failed to generate slides. Please try again.');
      } finally {
        setIsGenerating(false);
      }
  }, [urlAttachment, docAttachment, aiPrompt, aiSlideCount, aiWritingStyle, aiSlideStyle, aiLanguage, aiWordCount, aiTone, aiAutoHashtags, aiIncludeStats, aiAccessibility, aiSmartColors, aiFreshDesign, aiAudience, aiGoal, normalizeSlides, brandSettings, addToHistory]);

  const handleToolClick = useCallback((tool: 'select' | 'text' | 'image' | 'color') => {
    setActiveTool(tool);
    if (tool === 'image') {
        setImagePickerMode('single');
        setIsImagePickerOpen(true);
        setUnsplashQuery('');
        setUnsplashResults([]);
        setImageUrlInput('');
    } else if (tool === 'text') {
        if (!activeSlide) return;
        const newBlock = createCustomBlock();
        setSlides(prevSlides => prevSlides.map(s => s.id === activeSlide.id ? { 
          ...s, 
          customBlocks: [...(s.customBlocks || []), newBlock], 
        } : s));
        setActiveTool('select');
    } else if (tool === 'color') {
        colorInputRef.current?.click();
        setTimeout(() => setActiveTool('select'), 100);
    }
  }, [activeTool]);

  // Unsplash search function
  const searchUnsplash = useCallback(async (query: string, page: number = 1) => {
    if (!query.trim()) return;
    
    setUnsplashLoading(true);
    try {
      const response = await fetch(`/api/unsplash/search?query=${encodeURIComponent(query)}&page=${page}&per_page=20`);
      
      const data = await response.json();
      
      // Check if there's an error message from the API
      if (data.error) {
        toast.error(data.message || 'Image search temporarily unavailable');
        setUnsplashResults([]);
        setUnsplashTotal(0);
        return;
      }
      
      if (page === 1) {
        setUnsplashResults(data.photos || []);
      } else {
        // Deduplicate by photo.id when appending paginated results
        setUnsplashResults(prev => {
          const existingIds = new Set(prev.map((p: any) => p.id));
          const newPhotos = (data.photos || []).filter((p: any) => !existingIds.has(p.id));
          return [...prev, ...newPhotos];
        });
      }
      setUnsplashTotal(data.total || 0);
      setUnsplashPage(page);
    } catch (error) {
      console.error('Unsplash search error:', error);
      toast.error('Failed to search photos. Please try adding images via URL or upload.');
    } finally {
      setUnsplashLoading(false);
    }
  }, []);

  // Apply image from Unsplash or URL
  const applyBackgroundImage = useCallback(async (imageUrl: string, downloadLink?: string) => {
    // Track download if from Unsplash (required by API guidelines)
    if (downloadLink) {
      fetch('/api/unsplash/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ downloadLink }),
      }).catch(() => {});
    }

    setSlides(prevSlides => prevSlides.map(s => s.id === activeSlideId ? { ...s, backgroundImage: imageUrl, backgroundOverlayOpacity: 0 } : s));
    toast.success('Background applied');
    
    setIsImagePickerOpen(false);
    setActiveTool('select');
    addToHistory(slides);
  }, [slides, activeSlideId]);

  const handleBackgroundColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value;
    // Apply to all slides
    setSlides(prevSlides => prevSlides.map(s => ({ ...s, backgroundColor: color })));
  };

  const handleMediaImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
        const result = event.target?.result as string;
        setSlides(prevSlides => prevSlides.map(s => s.id === activeSlide.id ? { 
            ...s, 
            mediaType: 'image', 
            mediaUrl: result 
        } : s));
    };
    reader.readAsDataURL(file);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            const result = event.target?.result as string;
            setSlides(prevSlides => prevSlides.map(s => s.id === activeSlide.id ? { ...s, backgroundImage: result, backgroundOverlayOpacity: 0 } : s));
            // Reset tool after applying
            setActiveTool('select');
        };
        reader.readAsDataURL(file);
    } else {
        // User cancelled - reset tool
        setActiveTool('select');
    }
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setDocUploadError(null);
    setIsUploadingDoc(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/ingest', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error?.error || 'Failed to parse document');
      }

      const data = await response.json();
      setDocAttachment({
        name: data.fileName || file.name,
        text: data.text,
        sections: data.sections || [],
        wordCount: data.wordCount,
        truncated: data.truncated,
      });

      if (!aiPrompt.trim()) {
        setAiPrompt((data.text || '').slice(0, 2000));
      }
    } catch (error) {
      console.error('Doc upload failed:', error);
      setDocUploadError(error instanceof Error ? error.message : 'Failed to process file');
    } finally {
      setIsUploadingDoc(false);
      if (docUploadInputRef.current) {
        docUploadInputRef.current.value = '';
      }
    }
  };

  const clearDocAttachment = () => {
    setDocAttachment(null);
    setDocUploadError(null);
    if (docUploadInputRef.current) docUploadInputRef.current.value = '';
  };

  // URL Import handling
  const handleParseUrl = async () => {
    if (!urlInput.trim()) {
      setUrlError('Please enter a URL');
      return;
    }

    if (!urlOwnershipConfirmed) {
      setUrlError('Please confirm this is your own content');
      return;
    }

    setIsParsingUrl(true);
    setUrlError(null);

    try {
      const response = await fetch('/api/parse-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlInput.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to parse URL');
      }

      setUrlAttachment({
        title: data.title || 'Untitled',
        text: data.text,
        sections: data.sections,
        wordCount: data.wordCount,
        truncated: data.truncated,
        sourceUrl: data.sourceUrl,
        sourceDomain: data.sourceDomain,
        description: data.description,
      });
      setUrlInput('');
    } catch (error) {
      console.error('URL parse failed:', error);
      setUrlError(error instanceof Error ? error.message : 'Failed to fetch URL content');
    } finally {
      setIsParsingUrl(false);
    }
  };

  const clearUrlAttachment = useCallback(() => {
    setUrlAttachment(null);
    setUrlError(null);
    setUrlInput('');
    setUrlOwnershipConfirmed(false);
  }, []);

  // AI Image Generation
  const handleGenerateImage = async (slideId: string) => {
    const slide = slides.find(s => s.id === slideId);
    if (!slide) return;

    setIsGeneratingImage(true);
    try {
      const response = await fetch('/api/ai/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slideContent: slide.title + ' ' + (slide.content || slide.subtitle || ''),
          style: 'professional',
          brandColors: [brandSettings.accentColor, brandSettings.backgroundColor]
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.imageUrl) {
          // Set the image URL directly - Pollinations generates on-demand when URL is accessed
          // The image will appear once it's generated (may take 5-30 seconds on first load)
          setSlides(prevSlides => prevSlides.map(s => 
            s.id === slideId 
              ? { ...s, backgroundImage: data.imageUrl, mediaType: 'image', mediaUrl: data.imageUrl, backgroundOverlayOpacity: 0 }
              : s
          ));
          
          toast.success(
            'Image URL set! The AI image will appear shortly (may take 10-30 seconds to generate).', 
            { id: 'image-gen', duration: 5000 }
          );
        } else {
          toast.error('No image URL returned');
        }
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to generate image');
      }
    } catch (error) {
      console.error('Image generation failed:', error);
      toast.error('Failed to generate image');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // Content Enhancement





  // Export as Images (ZIP file)
  const handleExportImages = useCallback(async () => {
    setIsExporting(true);
    setExportProgress({ current: 0, total: slides.length, status: 'Preparing slides...' });
    
    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      const folder = zip.folder('carousel-images');
      
      await new Promise(r => setTimeout(r, 100));

      const totalSlides = slides.length;
      
      for (let index = 0; index < totalSlides; index++) {
        const slide = slides[index];
        
        setExportProgress({ 
          current: index + 1, 
          total: totalSlides, 
          status: `Capturing slide ${index + 1} of ${totalSlides}...` 
        });
        
        setSlideDownloadData({ ...slide, _isDownloading: true } as any);
        await new Promise(r => setTimeout(r, index === 0 ? 200 : 50));
        
        if (slideDownloadRef.current) {
          try {
            // Use PNG for higher quality images
            const dataUrl = await lazyToPng(slideDownloadRef.current, {
              cacheBust: true,
              width: 1080,
              height: 1080,
              pixelRatio: 2, // Higher quality for images
              skipAutoScale: true,
            });
            
            // Convert data URL to blob
            const data = dataUrl.split(',')[1];
            folder?.file(`slide-${String(index + 1).padStart(2, '0')}.png`, data, { base64: true });
          } catch (err) {
            console.warn(`Failed to capture slide ${index}`, err);
          }
        }
      }
      
      setExportProgress({ current: totalSlides, total: totalSlides, status: 'Creating ZIP file...' });
      
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = window.URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${projectName.replace(/[^a-z0-9]/gi, '-').toLowerCase() || 'carousel'}-images.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      setIsExportOpen(false);
      toast.success('Images downloaded successfully!');
      
      if (appContext) {
        appContext.markExported();
      }
    } catch (error) {
      console.error('Export images failed:', error);
      toast.error('Failed to export images');
    } finally {
      setIsExporting(false);
      setSlideDownloadData(null);
      setExportProgress({ current: 0, total: 0, status: '' });
    }
  }, [slides, projectName]);

  // Export as PDF
  const handleExportPDF = useCallback(async () => {
    await handleExport('pdf');
  }, [slides, projectName]);

  // --- All hooks are above this line ---
  // Early returns MUST come after all hook calls (Rules of Hooks)
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[var(--surface-1)] text-gray-900 dark:text-white flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-[var(--accent)]" />
      </div>
    );
  }
  if (status === 'unauthenticated') {
    return null;
  }

  const handleExport = async (format: 'pdf' | 'ppt') => {
    // Use ref for fresh slides data (avoids stale closure issue)
    const currentSlides = slidesRef.current;
    
    
    setIsExporting(true);
    setExportProgress({ current: 0, total: currentSlides.length, status: 'Preparing slides...' });
    
    try {
      // Step 1: Client-side Capture - optimized for speed
      // Wait for initial render cycle
      await new Promise(r => setTimeout(r, 100));

      const capturedSlides = [];
      const totalSlides = currentSlides.length;
      
      for (let index = 0; index < totalSlides; index++) {
          const slide = currentSlides[index];
          
          // Update progress
          setExportProgress({ 
            current: index + 1, 
            total: totalSlides, 
            status: `Capturing slide ${index + 1} of ${totalSlides}...` 
          });
          
          // Set slide data for rendering
          setSlideDownloadData({ ...slide, _isDownloading: true } as any);
          
          // Increased delay for media-heavy slides to ensure proper loading
          const hasMedia = slide.mediaType === 'image' || slide.mediaType === 'video' || slide.mediaType === 'embed';
          const delay = index === 0 ? 500 : (hasMedia ? 300 : 100);
          await new Promise(r => setTimeout(r, delay));
          
          if (slideDownloadRef.current) {
              let captured = false;
              let attempts = 0;
              const maxAttempts = 3;
              
              while (!captured && attempts < maxAttempts) {
                  attempts++;
                  try {
                     // Calculate actual height to prevent content cut-off
                     const element = slideDownloadRef.current;
                     // Wait longer for content to fully render (especially for bullet points and long text)
                     await new Promise(r => setTimeout(r, 200));
                     
                     // Force reflow to ensure layout is complete
                     element.getBoundingClientRect();
                     
                     // Get all possible height measurements
                     const scrollHeight = element.scrollHeight || 0;
                     const offsetHeight = element.offsetHeight || 0;
                     const clientHeight = element.clientHeight || 0;
                     
                     // Check all child elements for max height
                     let maxChildHeight = 0;
                     if (element.children && element.children.length > 0) {
                         for (let i = 0; i < element.children.length; i++) {
                             const child = element.children[i] as HTMLElement;
                             // Recursively check deeper children if needed, but for now check direct
                             const childHeight = Math.max(
                                 child.scrollHeight || 0, 
                                 child.offsetHeight || 0, 
                                 child.getBoundingClientRect().height || 0
                             );
                             maxChildHeight = Math.max(maxChildHeight, childHeight);
                         }
                     }
                     
                     const actualHeight = Math.max(
                         scrollHeight,
                         offsetHeight,
                         clientHeight,
                         maxChildHeight,
                         1080 // Minimum height
                     );
                     
                     // Add generous buffer (200px) to ensure nothing is clipped and increase max to 4000px
                     const captureHeight = Math.min(actualHeight + 200, 4000);
                     const captureWidth = 1080;
                     
                     
                     // Temporarily set the container to ensure all content is visible
                     const originalMinHeight = element.style.minHeight;
                     const originalHeight = element.style.height;
                     const originalOverflow = element.style.overflow;
                     const originalMaxHeight = element.style.maxHeight;
                     
                     // Remove all height restrictions and ensure overflow is visible
                     element.style.minHeight = `${captureHeight}px`;
                     element.style.height = 'auto';
                     element.style.maxHeight = 'none';
                     element.style.overflow = 'visible';
                     
                     // Also ensure all child elements can expand
                     if (element.children && element.children.length > 0) {
                         for (let i = 0; i < element.children.length; i++) {
                             const child = element.children[i] as HTMLElement;
                             child.style.overflow = 'visible';
                             child.style.maxHeight = 'none';
                         }
                     }
                     
                     // Wait longer for layout to fully adjust
                     await new Promise(r => setTimeout(r, 200));
                     element.getBoundingClientRect();
                     
                     // Re-measure after layout adjustment
                     const finalHeight = Math.max(
                         element.scrollHeight,
                         element.offsetHeight,
                         captureHeight
                     );
                     const finalCaptureHeight = Math.min(finalHeight + 100, 5000);
                     
                     try {
                         // Use PNG for better quality and to preserve all content
                         const capturePromise = lazyToPng(slideDownloadRef.current, {
                            cacheBust: true,
                            width: captureWidth,
                            height: finalCaptureHeight,
                            pixelRatio: 1, // Use 1:1 to get exact dimensions
                            skipAutoScale: false, // Allow auto-scale to ensure full content
                            backgroundColor: slide.backgroundColor || '#0B0F19',
                            // Don't skip fonts - we need them for proper rendering
                            skipFonts: false,
                         });
                         
                         const dataUrl = await Promise.race([
                             capturePromise, 
                             new Promise<string>((_, reject) => 
                                 setTimeout(() => reject(new Error('Capture timeout')), 10000)
                             )
                         ]);
                         
                         capturedSlides.push({ id: slide.id, dataUrl, index });
                         captured = true;
                     } finally {
                         // Restore original styles
                         element.style.minHeight = originalMinHeight;
                         element.style.height = originalHeight;
                         element.style.overflow = originalOverflow;
                         element.style.maxHeight = originalMaxHeight;
                         
                         // Restore child styles
                         if (element.children && element.children.length > 0) {
                             for (let i = 0; i < element.children.length; i++) {
                                 const child = element.children[i] as HTMLElement;
                                 child.style.overflow = '';
                                 child.style.maxHeight = '';
                             }
                         }
                     }
                  } catch (err) {
                      console.warn(`Failed to capture slide ${index} (attempt ${attempts}/${maxAttempts})`, err);
                      if (attempts < maxAttempts) {
                          // Wait longer between retries
                          await new Promise(r => setTimeout(r, 300 * attempts));
                      }
                  }
              }
              
              if (!captured) {
                  toast.error(`Failed to capture slide ${index + 1}. Export may be incomplete.`);
              }
          }
      }
      
      setExportProgress({ current: totalSlides, total: totalSlides, status: 'Processing images...' });
      
      const validCaptures = capturedSlides;
      
      // Check if we have any valid captures
      if (validCaptures.length === 0) {
          toast.error('Failed to capture any slides. Please try again or contact support.');
          setIsExporting(false);
          setSlideDownloadData(null);
          setExportProgress({ current: 0, total: 0, status: '' });
          return;
      }
      
      // Warn if some slides failed
      if (validCaptures.length < totalSlides) {
          toast.warning(`Only ${validCaptures.length} of ${totalSlides} slides captured. Export will continue with available slides.`);
      }

      // Prepare FormData
      const formData = new FormData();
      
      // Attach captured images as blobs
      validCaptures.forEach((cap, i) => {
          const header = cap.dataUrl.split(',')[0];
          const data = cap.dataUrl.split(',')[1];
          const mime = header.match(/:(.*?);/)?.[1] || 'image/jpeg';
          const binary = atob(data);
          const array = [];
          for(let k = 0; k < binary.length; k++) {
              array.push(binary.charCodeAt(k));
          }
          const blob = new Blob([new Uint8Array(array)], { type: mime });
          formData.append(`slide_image_${i}`, blob, `slide-${i}.jpg`);
      });


      // Construct simplified payload - use currentSlides for fresh data
      const payloadSlides = currentSlides.map((slide, index) => ({
          ...slide,
          _useAttachedImage: true,
          _attachedImageKey: `slide_image_${index}`,
          _hasAttachedVideo: slide.mediaType === 'video' && slide.mediaUrl?.startsWith('blob:'),
          _videoAttachmentIndex: index,
          backgroundImage: undefined,
          // Preserve mediaUrl for videos (will be Cloudinary URL after upload completes)
          mediaUrl: slide.mediaType === 'video' ? slide.mediaUrl : undefined,
          // Preserve mediaType and mediaPosterUrl for PDF link generation
          mediaType: slide.mediaType,
          mediaPosterUrl: slide.mediaPosterUrl
      }));

      // Strip blob URLs from payload (Cloudinary URLs are preserved)
      const safePayload = payloadSlides.map(s => {
          if (s.mediaUrl?.startsWith('blob:')) return { ...s, mediaUrl: '' };
          return s;
      });

      formData.append('data', JSON.stringify({
          slides: safePayload,
          format: 'pdf',
          options: { title: currentSlides[0]?.title },
          mode: 'client-side-images'
      }));

      setExportProgress({ current: totalSlides, total: totalSlides, status: 'Generating PDF...' });

      const response = await fetch('/api/export', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Export failed with status ${response.status}`);
      }

      setExportProgress({ current: totalSlides, total: totalSlides, status: 'Downloading...' });

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `carouslk-export.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      setIsExportOpen(false);
      
      // Track successful export in context
      if (appContext) {
        appContext.markExported();
      }

    } catch (error) {
      console.error('Export failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Export failed: ${errorMessage}. Try removing media or using simpler slides.`);
    } finally {
      setIsExporting(false);
      setSlideDownloadData(null);
      setExportProgress({ current: 0, total: 0, status: '' });
    }
  };

  const renderPropertiesPanelContent = () => (
    <>
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-[var(--border-hover)]/50">
        <h3 className="text-base font-bold text-white uppercase tracking-wider">Properties</h3>
        <button 
          onClick={() => setIsPropertiesPanelOpen(false)} 
          className="w-8 h-8 flex items-center justify-center rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-black transition-colors flex-shrink-0"
          title="Close Properties Panel"
        >
          <X size={18} />
        </button>
      </div>

      <div className="space-y-4">
        {/* TEXT SECTION */}
        <div className="space-y-3 pb-4 border-b border-[var(--border-hover)]/50">
          <h4 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Text</h4>
          <div className="space-y-3">
            <div className="space-y-2">
              <label className="text-xs text-[var(--text-muted)]">Title</label>
              <input
                type="text"
                value={activeSlide.title || ''}
                onChange={(e) => {
                  const newTitle = e.target.value;
                  setSlides(prevSlides => prevSlides.map(s => s.id === activeSlide.id ? { ...s, title: newTitle } : s));
                }}
                className="w-full bg-[var(--surface-1)]/50 border border-[var(--border-hover)] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[var(--accent)] transition"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs text-[var(--text-muted)]">Font Size</label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={0.7}
                  max={1.5}
                  step={0.05}
                  aria-label="Font size"
                  value={activeSlide.fontScale ?? 1}
                  onChange={(e) => {
                    const newScale = parseFloat(e.target.value);
                    setSlides(prevSlides => prevSlides.map(s => s.id === activeSlide.id ? { ...s, fontScale: newScale } : s));
                  }}
                  className="flex-1"
                  style={{ accentColor: 'var(--accent)' }}
                />
                <span className="text-xs text-[var(--text-secondary)] w-12 text-right">
                  {Math.round((activeSlide.fontScale ?? 1) * 100)}%
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => adjustFontScale(-0.05)}
                  className="flex-1 px-2 py-1 text-xs bg-[var(--surface-1)]/60 border border-[var(--border-hover)] rounded-lg hover:border-[var(--border-hover)] transition"
                >
                  A-
                </button>
                <button
                  onClick={() => adjustFontScale(0.05)}
                  className="flex-1 px-2 py-1 text-xs bg-[var(--surface-1)]/60 border border-[var(--border-hover)] rounded-lg hover:border-[var(--border-hover)] transition"
                >
                  A+
                </button>
              </div>
            </div>
          </div>
        </div>



        {activeSlide.type === 'cover' && (
          <div className="space-y-2">
            <label className="text-xs text-[var(--text-muted)]">Subtitle</label>
            <textarea
              value={activeSlide.subtitle || ''}
              onChange={(e) => {
                const newSubtitle = e.target.value;
                setSlides(slides.map(s => s.id === activeSlide.id ? { ...s, subtitle: newSubtitle } : s));
              }}
              className="w-full bg-[var(--surface-1)]/50 border border-[var(--border-hover)] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[var(--accent)] transition resize-none h-24"
            />
          </div>
        )}

        {activeSlide.type === 'content' && (
          <div className="space-y-2">
            <label className="text-xs text-[var(--text-muted)]">Content</label>
            <ContentEditableDiv
              slideId={activeSlide.id}
              content={activeSlide.content || ''}
              onChange={(newContent) => {
                setSlides(slides.map(s => s.id === activeSlide.id ? { ...s, content: newContent } : s));
              }}
            />
            <p className="text-[10px] text-[var(--text-muted)]">
              Format with shortcuts: <strong>Ctrl+B</strong> bold, <em>Ctrl+I</em> italic.
            </p>
          </div>
        )}

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs text-[var(--text-muted)]">Slide Emoji / Icon</label>
            {/* Toggle for all slides */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-[var(--text-muted)]">All slides</span>
              <button
                onClick={() => {
                  const hasAnyEmoji = slides.some(s => s.emoji && s.emoji.trim() !== '');
                  if (hasAnyEmoji) {
                    // Turn off: clear all emojis
                    setSlides(slides.map(s => ({ ...s, emoji: '' })));
                    toast.success('Icons removed from all slides');
                  } else {
                    // Turn on: add default emoji to content/chart slides
                    setSlides(slides.map(s => ({
                      ...s,
                      emoji: s.type !== 'cover' ? '✨' : ''
                    })));
                    toast.success('Icons added to all slides');
                  }
                }}
                className={`relative w-10 h-5 rounded-full transition-colors ${
                  slides.some(s => s.emoji && s.emoji.trim() !== '')
                    ? 'bg-[var(--accent)]'
                    : 'bg-[var(--surface-3)]'
                }`}
                title={slides.some(s => s.emoji && s.emoji.trim() !== '') ? 'Click to remove all icons' : 'Click to add icons to all slides'}
              >
                <div
                  className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                    slides.some(s => s.emoji && s.emoji.trim() !== '')
                      ? 'translate-x-5'
                      : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          </div>
          <div className="flex gap-2 relative">
            <div className="flex-1 flex gap-2">
              <input
                type="text"
                inputMode="text"
                maxLength={8}
                value={sanitizeEmoji(activeSlide.emoji) || ''}
                onChange={(e) => {
                  const cleaned = sanitizeEmoji(e.target.value);
                  setSlides(slides.map(s => s.id === activeSlide.id ? { ...s, emoji: cleaned } : s));
                }}
                placeholder="✨"
                className="flex-1 bg-[var(--surface-1)]/50 border border-[var(--border-hover)] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[var(--accent)] transition"
              />
              <button
                onClick={() => setIsEmojiPickerOpen(!isEmojiPickerOpen)}
                className={`px-3 py-2 rounded-lg border text-lg transition ${
                  isEmojiPickerOpen 
                    ? 'border-[var(--accent)] bg-[var(--accent-subtle)]' 
                    : 'border-[var(--border-hover)] hover:border-[var(--border-hover)]'
                }`}
                title="Open emoji picker"
              >
                😀
              </button>
            </div>
            {activeSlide.emoji && activeSlide.emoji.trim() !== '' && (
              <button
                onClick={() => setSlides(slides.map(s => s.id === activeSlide.id ? { ...s, emoji: '' } : s))}
                className="px-3 py-2 rounded-lg border border-[var(--border-hover)] text-xs text-[var(--text-secondary)] hover:text-white hover:border-[var(--border-hover)] transition"
                title="Remove emoji"
              >
                Clear
              </button>
            )}
          </div>
          {/* Emoji Picker Popup */}
          {isEmojiPickerOpen && (
            <div className="absolute z-50 mt-2 right-0">
              <div className="relative">
                <button
                  onClick={() => setIsEmojiPickerOpen(false)}
                  className="absolute -top-2 -right-2 z-10 w-6 h-6 bg-[var(--surface-2)] border border-[var(--border-hover)] rounded-full flex items-center justify-center text-[var(--text-muted)] hover:text-white hover:bg-[var(--surface-3)] transition"
                >
                  <X size={12} />
                </button>
                <Suspense fallback={<div className="w-[320px] h-[400px] flex items-center justify-center bg-[var(--surface-1)]"><Loader2 size={24} className="animate-spin text-[var(--text-muted)]" /></div>}>
                  <LazyEmojiPicker
                    onEmojiClick={(emojiData: EmojiClickData) => {
                      setSlides(slides.map(s => s.id === activeSlide.id ? { ...s, emoji: emojiData.emoji } : s));
                      setIsEmojiPickerOpen(false);
                    }}
                    theme={"dark" as any}
                    width={320}
                    height={400}
                    searchPlaceholder="Search emojis..."
                    previewConfig={{ showPreview: false }}
                  />
                </Suspense>
              </div>
            </div>
          )}
          <p className="text-[10px] text-[var(--text-muted)]">Toggle above to add/remove icons from all slides, or pick an emoji.</p>
        </div>



        <div className="space-y-3 pt-4 border-t border-[var(--border-hover)] media-section-unique">
          <label className="text-xs text-[var(--text-muted)]">Media</label>
          <div className="flex bg-[var(--surface-1)] rounded-lg p-1 gap-1 mb-2">
            <button
              onClick={() => setSlides(slides.map(s => s.id === activeSlide.id ? { ...s, mediaType: null, mediaUrl: undefined, embedHtml: undefined } : s))}
              className={`flex-1 px-2 py-1.5 text-xs rounded-md transition flex items-center justify-center gap-1 ${!activeSlide.mediaType ? 'bg-[var(--surface-3)] text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}`}
              title="None"
            >
              None
            </button>
            <button
              onClick={() => setSlides(slides.map(s => s.id === activeSlide.id ? { ...s, mediaType: 'image' } : s))}
              className={`flex-1 px-2 py-1.5 text-xs rounded-md transition flex items-center justify-center gap-1 ${activeSlide.mediaType === 'image' ? 'bg-[var(--surface-3)] text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}`}
              title="Image"
            >
              <ImageIcon size={14} /> Image
            </button>
          </div>

          {activeSlide.mediaType === 'image' && (
             <div className="space-y-2">
                <label className="text-xs text-[var(--text-muted)]">Image Source</label>
                {activeSlide.mediaUrl ? (
                    <div className="relative group rounded-lg overflow-hidden border border-[var(--border-hover)] h-32 bg-black/40">
                        <img src={activeSlide.mediaUrl} className="w-full h-full object-contain" alt="Media Block" />
                        <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition bg-black/40 backdrop-blur-sm">
                            <label className="p-1.5 bg-[var(--surface-2)] rounded-md text-white hover:bg-[var(--surface-3)] border border-[var(--border-hover)] cursor-pointer">
                                <ImageIcon size={14} />
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    className="hidden" 
                                    onChange={handleMediaImageUpload}
                                />
                            </label>
                            <button 
                                onClick={() => setSlides(slides.map(s => s.id === activeSlide.id ? { ...s, mediaUrl: undefined } : s))}
                                className="p-1.5 bg-red-500/20 rounded-md text-red-400 hover:bg-red-500/30 border border-red-500/50"
                                title="Remove Image"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </div>
                ) : (
                    <label className="flex items-center justify-center w-full px-3 py-4 bg-[var(--surface-2)] hover:bg-[var(--surface-3)] border border-[var(--border-hover)] rounded-lg cursor-pointer transition group border-dashed">
                        <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={handleMediaImageUpload}
                        />
                        <div className="flex flex-col items-center gap-2 text-[var(--text-muted)] group-hover:text-white">
                            <ImageIcon size={20} />
                            <span className="text-xs">Upload Image Block</span>
                        </div>
                    </label>
                )}
                 <label className="text-xs text-[var(--text-muted)] mt-2 block">Aspect ratio</label>
                 <input
                    type="number"
                    min={0.5}
                    max={3}
                    step={0.05}
                    value={activeSlide.mediaAspectRatio ?? 16 / 9}
                    onChange={(e) => {
                        const value = parseFloat(e.target.value) || 16 / 9;
                        setSlides(slides.map(s => s.id === activeSlide.id ? { ...s, mediaAspectRatio: value } : s));
                    }}
                    className="w-full bg-[var(--surface-1)]/50 border border-[var(--border-hover)] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[var(--accent)] transition"
                />
             </div>
          )}


          {activeSlide.mediaType && (
            <div className="space-y-3 pt-3 border-t border-[var(--border)]">
              <div className="flex items-center justify-between">
                <label className="text-xs text-[var(--text-muted)]">Media Width</label>
                <span className="text-xs text-[var(--text-muted)]">
                  {Math.round(activeSlide.mediaWidthPercent ?? 100)}%
                </span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={10}
                  max={100}
                  step={1}
                  value={activeSlide.mediaWidthPercent ?? 100}
                  onChange={(e) => {
                    const value = parseInt(e.target.value, 10);
                    setSlides(slides.map(s => s.id === activeSlide.id ? { ...s, mediaWidthPercent: value } : s));
                  }}
                  className="flex-1"
                  style={{ accentColor: 'var(--accent)' }}
                />
                <input
                  type="number"
                  min={10}
                  max={100}
                  value={Math.round(activeSlide.mediaWidthPercent ?? 100)}
                  onChange={(e) => {
                    const value = Math.min(100, Math.max(10, parseInt(e.target.value, 10) || 10));
                    setSlides(slides.map(s => s.id === activeSlide.id ? { ...s, mediaWidthPercent: value } : s));
                  }}
                  className="w-16 bg-[var(--surface-1)]/50 border border-[var(--border-hover)] rounded-lg px-2 py-1 text-sm text-white text-center focus:outline-none focus:border-[var(--accent)] transition"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {[25, 40, 55, 70, 85, 100].map(preset => (
                  <button
                    key={preset}
                    onClick={() => setSlides(slides.map(s => s.id === activeSlide.id ? { ...s, mediaWidthPercent: preset } : s))}
                    className={`px-3 py-1.5 rounded-lg text-xs border transition ${
                      Math.round(activeSlide.mediaWidthPercent ?? 100) === preset
                        ? 'border-[var(--accent)] text-white bg-[var(--accent-subtle)]'
                        : 'border-[var(--border-hover)] text-[var(--text-muted)] hover:border-[var(--border-hover)] hover:text-white'
                    }`}
                  >
                    {preset}%
                  </button>
                ))}
              </div>

              <div className="space-y-2">
                <label className="text-xs text-[var(--text-muted)]">Alignment</label>
                <div className="flex gap-2">
                  {(['left', 'center', 'right'] as const).map(position => (
                    <button
                      key={position}
                      onClick={() => setSlides(slides.map(s => s.id === activeSlide.id ? { ...s, mediaAlignment: position } : s))}
                      className={`flex-1 px-3 py-2 rounded-lg text-xs uppercase tracking-wide border transition ${
                        (activeSlide.mediaAlignment || 'center') === position
                          ? 'border-[var(--accent)] text-white bg-[var(--accent-subtle)]'
                          : 'border-[var(--border-hover)] text-[var(--text-muted)] hover:border-[var(--border-hover)] hover:text-white'
                      }`}
                    >
                      {position}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-3 pt-4 border-t border-[var(--border-hover)]">
          <label className="text-xs text-[var(--text-muted)]">Background Image</label>
          
          {activeSlide.backgroundImage ? (
              <div className="relative group rounded-lg overflow-hidden border border-[var(--border-hover)] h-24 bg-black/40">
                  <img src={activeSlide.backgroundImage} className="w-full h-full object-cover opacity-60" alt="Background" />
                  <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition bg-black/40 backdrop-blur-sm">
                      <button 
                          onClick={() => {
                              // Trigger file input for specific slide
                              // We can reuse the main input but need to ensure activeTool is NOT 'image'
                              setActiveTool('select'); 
                              fileInputRef.current?.click();
                          }}
                          className="p-1.5 bg-[var(--surface-2)] rounded-md text-white hover:bg-[var(--surface-3)] border border-[var(--border-hover)]"
                          title="Change Image"
                      >
                          <ImageIcon size={14} />
                      </button>
                      <button 
                          onClick={() => {
                              // Smart remove: if all slides have the same background, remove from all
                              const currentBg = activeSlide.backgroundImage;
                              const allSameBackground = slides.every(s => s.backgroundImage === currentBg);
                              
                              if (allSameBackground) {
                                  setSlides(prevSlides => prevSlides.map(s => ({ ...s, backgroundImage: undefined, backgroundOverlayOpacity: 0, backgroundImageFilter: undefined })));
                                  toast.success('Background removed from all slides');
                              } else {
                                  setSlides(prevSlides => prevSlides.map(s => s.id === activeSlide.id ? { ...s, backgroundImage: undefined, backgroundOverlayOpacity: 0, backgroundImageFilter: undefined } : s));
                                  toast.success('Background removed from slide');
                              }
                          }}
                          className="p-1.5 bg-red-500/20 rounded-md text-red-400 hover:bg-red-500/30 border border-red-500/50"
                          title="Remove Image (smart: removes from all if same background)"
                      >
                          <Trash2 size={14} />
                      </button>
                  </div>
              </div>
          ) : (
            <button 
                onClick={() => {
                    setActiveTool('select');
                    fileInputRef.current?.click();
                }}
                className="w-full flex items-center justify-center gap-2 p-3 bg-[var(--surface-1)]/50 border border-[var(--border-hover)] border-dashed rounded-lg text-[var(--text-muted)] hover:text-white hover:border-[var(--border-hover)] hover:bg-[var(--surface-2)] transition group"
            >
                <ImageIcon size={16} className="group-hover:scale-110 transition" />
                <span className="text-xs">Upload for This Slide</span>
            </button>
          )}
          
          {activeSlide.backgroundImage && (
             <div className="space-y-4">
                <div className="flex justify-between items-center gap-2">
                    <span className="text-[10px] text-[var(--text-muted)] font-medium">SETTINGS</span>
                    <div className="flex gap-1">
                        <button 
                            onClick={() => {
                                // Smart reset: if all slides have the same background, reset settings on all
                                const currentBg = activeSlide.backgroundImage;
                                const allSameBackground = slides.every(s => s.backgroundImage === currentBg);
                                
                                if (allSameBackground) {
                                    setSlides(prevSlides => prevSlides.map(s => ({ ...s, backgroundOverlayOpacity: 0, backgroundImageFilter: undefined })));
                                    toast.success('Image settings reset on all slides');
                                } else {
                                    setSlides(prevSlides => prevSlides.map(s => 
                                        s.id === activeSlide.id 
                                            ? { ...s, backgroundOverlayOpacity: 0, backgroundImageFilter: undefined }
                                            : s
                                    ));
                                    toast.success('Image settings reset');
                                }
                            }}
                            className="text-[10px] bg-red-500/20 hover:bg-red-500/30 text-red-400 px-2 py-1 rounded border border-red-500/50 transition"
                            title="Reset color tint and filters (smart: resets all if same background)"
                        >
                            Reset
                        </button>
                    </div>
                </div>
             
                <div className="space-y-1">
                   <div className="flex justify-between text-xs text-[var(--text-muted)]">
                       <span>Color Tint</span>
                       <span>{Math.round((activeSlide.backgroundOverlayOpacity ?? 0) * 100)}%</span>
                   </div>
                   <p className="text-[9px] text-[var(--text-muted)] mb-1">Add theme color overlay on image</p>
                   <input
                       type="range"
                       min={0}
                       max={0.9}
                       step={0.1}
                       value={activeSlide.backgroundOverlayOpacity ?? 0}
                       onChange={(e) => {
                           const val = parseFloat(e.target.value);
                           // Smart apply: if all slides have same background, apply to all
                           const currentBg = activeSlide.backgroundImage;
                           const allSameBackground = slides.every(s => s.backgroundImage === currentBg);
                           if (allSameBackground) {
                               setSlides(prevSlides => prevSlides.map(s => ({ ...s, backgroundOverlayOpacity: val })));
                           } else {
                               setSlides(prevSlides => prevSlides.map(s => s.id === activeSlide.id ? { ...s, backgroundOverlayOpacity: val } : s));
                           }
                       }}
                       className="w-full h-1.5 bg-[var(--surface-3)] rounded-lg appearance-none cursor-pointer accent-[var(--accent)]"
                   />
                </div>

             </div>
          )}
        </div>

        <div className="space-y-3 pt-4 border-t border-[var(--border-hover)]">
          <label className="text-xs text-[var(--text-muted)]">Handle / Tag</label>
          <input
            type="text"
            value={activeSlide.handle || ''}
            onChange={(e) => {
              const newHandle = e.target.value;
              setSlides(slides.map(s => ({ ...s, handle: newHandle }))); // Update all slides
            }}
            placeholder="@yourhandle"
            className="w-full bg-[var(--surface-1)]/50 border border-[var(--border-hover)] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[var(--accent)] transition"
          />
          <p className="text-[10px] text-[var(--text-muted)]">Updates across all slides</p>
        </div>


        <div className="pt-4 border-t border-[var(--border-hover)]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-[var(--text-muted)]">Type</span>
          </div>
          <div className="flex bg-[var(--surface-1)] rounded-lg p-1 gap-1">
            <button
              onClick={() => setSlides(slides.map(s => s.id === activeSlide.id ? { 
                  ...s, 
                  type: 'cover',
                  elementOrder: ['title', 'subtitle', 'media'] 
              } : s))}
              className={`flex-1 px-2 py-1.5 text-xs rounded-md transition flex items-center justify-center gap-1 ${activeSlide.type === 'cover' ? 'bg-[var(--surface-3)] text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}`}
              title="Cover Slide"
            >
              <Layout size={14} /> Cover
            </button>
            <button
              onClick={() => setSlides(slides.map(s => s.id === activeSlide.id ? { 
                  ...s, 
                  type: 'content',
                  elementOrder: ['emoji', 'title', 'content', 'media']
              } : s))}
              className={`flex-1 px-2 py-1.5 text-xs rounded-md transition flex items-center justify-center gap-1 ${activeSlide.type === 'content' ? 'bg-[var(--surface-3)] text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}`}
              title="Content Slide"
            >
              <Type size={14} /> Content
            </button>
            <button
              onClick={() => setSlides(slides.map(s => s.id === activeSlide.id ? {
                ...s,
                type: 'chart',
                chartType: 'bar',
                chartData: [
                  { name: 'A', value: 40 },
                  { name: 'B', value: 30 },
                  { name: 'C', value: 20 },
                  { name: 'D', value: 27 },
                ],
                elementOrder: ['emoji', 'title', 'content', 'chart', 'media']
              } : s))}
              className={`flex-1 px-2 py-1.5 text-xs rounded-md transition flex items-center justify-center gap-1 ${activeSlide.type === 'chart' ? 'bg-[var(--surface-3)] text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}`}
              title="Chart Slide"
            >
              <BarChart3 size={14} /> Chart
            </button>
          </div>
        </div>


        {activeSlide.type === 'chart' && (
          <div className="space-y-4 pt-4 border-t border-[var(--border-hover)] animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="space-y-2">
              <label className="text-xs text-[var(--text-muted)]">Chart Type</label>
              <div className="flex bg-[var(--surface-1)] rounded-lg p-1 gap-1">
                <button
                  onClick={() => setSlides(slides.map(s => s.id === activeSlide.id ? { ...s, chartType: 'bar' } : s))}
                  className={`flex-1 p-1.5 rounded transition flex justify-center ${activeSlide.chartType === 'bar' ? 'bg-[var(--surface-3)] text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}`}
                >
                  <BarChart3 size={16} />
                </button>
                <button
                  onClick={() => setSlides(slides.map(s => s.id === activeSlide.id ? { ...s, chartType: 'line' } : s))}
                  className={`flex-1 p-1.5 rounded transition flex justify-center ${activeSlide.chartType === 'line' ? 'bg-[var(--surface-3)] text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}`}
                >
                  <LineChart size={16} />
                </button>
                <button
                  onClick={() => setSlides(slides.map(s => s.id === activeSlide.id ? { ...s, chartType: 'pie' } : s))}
                  className={`flex-1 p-1.5 rounded transition flex justify-center ${activeSlide.chartType === 'pie' ? 'bg-[var(--surface-3)] text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}`}
                >
                  <PieChart size={16} />
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs text-[var(--text-muted)]">Data Points</label>
                <button
                  onClick={() => {
                    const newData = [...(activeSlide.chartData || [])];
                    newData.push({ name: 'New', value: 50 });
                    setSlides(slides.map(s => s.id === activeSlide.id ? { ...s, chartData: newData } : s));
                  }}
                  className="text-[10px] bg-[var(--surface-3)] hover:bg-[var(--surface-3)] text-white px-2 py-0.5 rounded"
                >
                  + Add
                </button>
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {activeSlide.chartData?.map((point, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={point.name || ''}
                      onChange={(e) => {
                        const newData = [...(activeSlide.chartData || [])];
                        newData[idx].name = e.target.value;
                        setSlides(slides.map(s => s.id === activeSlide.id ? { ...s, chartData: newData } : s));
                      }}
                      className="w-1/3 bg-[var(--surface-1)]/50 border border-[var(--border-hover)] rounded px-2 py-1 text-xs text-white focus:border-[var(--accent)] outline-none"
                      placeholder="Label"
                    />
                    <input
                      type="number"
                      value={point.value ?? 0}
                      onChange={(e) => {
                        const newData = [...(activeSlide.chartData || [])];
                        newData[idx].value = parseInt(e.target.value) || 0;
                        setSlides(slides.map(s => s.id === activeSlide.id ? { ...s, chartData: newData } : s));
                      }}
                      className="w-1/3 bg-[var(--surface-1)]/50 border border-[var(--border-hover)] rounded px-2 py-1 text-xs text-white focus:border-[var(--accent)] outline-none"
                      placeholder="Value"
                    />
                    <button
                      onClick={() => {
                        const newData = [...(activeSlide.chartData || [])].filter((_, i) => i !== idx);
                        setSlides(slides.map(s => s.id === activeSlide.id ? { ...s, chartData: newData } : s));
                      }}
                      className="text-[var(--text-muted)] hover:text-red-400"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[var(--surface-1)] text-gray-900 dark:text-white font-sans flex flex-col lg:h-screen lg:overflow-hidden overflow-x-hidden transition-colors duration-300">
      <div
        aria-hidden="true"
        className="absolute"
        style={{ width: 1, height: 1, top: -9999, left: -9999, pointerEvents: 'none' }}
      >
        <div ref={slideDownloadRef} className="w-[1080px] h-auto">

          {slideDownloadData && (
            <Slide
              {...slideDownloadData}
              isEditable={false}
            />
          )}
        </div>
      </div>
      {/* Header */}
      <header className="h-14 border-b border-[var(--border)] bg-[var(--surface-1)] flex items-center px-4 justify-between shrink-0 z-20">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
          <Link href="/" className="text-[var(--text-muted)] hover:text-white transition shrink-0">
            <ChevronLeft size={20} />
          </Link>
          <div className="flex items-center gap-2 min-w-0">
             <div className="w-6 h-6 bg-[var(--accent)] rounded-md rotate-3 flex items-center justify-center shrink-0">
                <span className="text-black font-bold text-xs">C</span>
             </div>
             <span className="font-bold tracking-tight text-sm sm:text-base truncate">
                <span className="hidden sm:inline">Carouslk / </span>{projectName}
             </span>
          </div>
          <div className="hidden lg:flex items-center gap-1 border-l border-[var(--border)] pl-4 ml-4">
            <ProjectManager
              currentProjectId={projectId}
              projectName={projectName}
              slides={slides}
              options={projectOptions}
              onProjectLoad={handleProjectLoad}
              onProjectNameChange={setProjectName}
            />
            <button
              onClick={handleUndo}
              disabled={!canUndo}
              className="p-2 hover:bg-[var(--surface-2)] rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition"
              title="Undo (Ctrl+Z)"
            >
              <Undo2 size={18} className="text-[var(--text-muted)]" />
            </button>
            <button
              onClick={handleRedo}
              disabled={!canRedo}
              className="p-2 hover:bg-[var(--surface-2)] rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition"
              title="Redo (Ctrl+Y)"
            >
              <Redo2 size={18} className="text-[var(--text-muted)]" />
            </button>
            {/* Auto-save indicator */}
            <div className="flex items-center gap-1.5 ml-2 pl-2 border-l border-[var(--border)]">
              {projectSaving ? (
                <>
                  <Loader2 size={14} className="text-[var(--accent)] animate-spin" />
                  <span className="text-[11px] text-[var(--text-muted)]">Saving...</span>
                </>
              ) : projectId ? (
                <>
                  <Cloud size={14} className="text-green-400" />
                  <span className="text-[11px] text-[var(--text-muted)]">Saved</span>
                </>
              ) : (
                <>
                  <CloudOff size={14} className="text-[var(--text-muted)]" />
                  <span className="text-[11px] text-[var(--text-muted)]">Local</span>
                </>
              )}
            </div>
          </div>
        </div>
        
        {/* Text Editor Toggle Button */}
        <button
          onClick={() => setShowTextFormattingToolbar(!showTextFormattingToolbar)}
          className={`hidden lg:flex px-3 py-1.5 text-sm font-medium rounded-lg transition items-center gap-2 border ${
            showTextFormattingToolbar 
              ? 'bg-[var(--accent-subtle)] text-[var(--accent)] border-[var(--accent)]/30 hover:bg-[var(--accent)]/20' 
              : 'text-[var(--text-muted)] border-[var(--border-hover)] hover:text-white hover:bg-[var(--surface-2)] hover:border-[var(--border-hover)]'
          }`}
          title={showTextFormattingToolbar ? 'Hide Text Editor' : 'Show Text Editor'}
        >
          <Type size={16} />
          Text Editor
        </button>
        
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
                onClick={() => setIsMobileSidebarOpen(true)}
                className="p-2 text-[var(--text-secondary)] hover:text-white hover:bg-[var(--surface-2)] rounded-lg transition flex items-center justify-center lg:hidden"
            >
                <Menu size={20} />
            </button>
            <button 
                onClick={() => setIsAiModalOpen(true)}
                className="hidden lg:flex px-4 py-1.5 bg-gradient-to-r from-[var(--accent)] to-amber-500 hover:from-[var(--accent-hover)] hover:to-amber-400 text-black text-sm font-bold rounded-lg transition items-center gap-2 shadow-lg shadow-[var(--accent)]/20"
            >
                <Sparkles size={16} />
                Generate
            </button>
            <div className="hidden lg:block w-4"></div>
            <button 
                onClick={() => setIsExportOpen(true)}
                className="hidden lg:flex px-3 py-1.5 bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-white text-sm font-medium rounded-lg transition items-center gap-2 border border-[var(--border-hover)]"
            >
                <Download size={16} />
                Export
            </button>
            <button
                onClick={async () => {
                    const { signOut } = await import('next-auth/react');
                    signOut({ callbackUrl: '/login' });
                }}
                className="p-2 hover:bg-[var(--surface-2)] rounded-lg transition"
                title="Sign out"
            >
                <LogOut size={18} className="text-[var(--text-muted)]" />
            </button>
        </div>
      </header>

      {/* Main Workspace */}
      <ErrorBoundary section="Editor">
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <div className="hidden md:flex w-16 border-r border-[var(--border)] flex-col items-center py-4 gap-2 bg-[var(--surface-1)] shrink-0 z-10">
            <button 
                onClick={() => setIsAiModalOpen(true)}
                className="w-10 h-10 bg-gradient-to-br from-[var(--accent)] to-amber-500 text-black rounded-xl flex items-center justify-center shadow-lg shadow-[var(--accent)]/20 hover:shadow-[var(--accent)]/40 transition-all hover:scale-105"
                title="AI Generate Carousel"
            >
                <Sparkles size={20} />
            </button>
            <div className="w-6 h-px bg-[var(--border)] my-1" />
            <button 
                onClick={() => setIsTemplatesOpen(true)}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition ${isTemplatesOpen ? 'bg-[var(--surface-3)] text-white' : 'text-[var(--text-muted)] hover:text-white hover:bg-[var(--surface-2)]'}`}
                title="Templates"
            >
                <Layout size={18} />
            </button>
            <button 
                onClick={() => setIsSettingsOpen(true)}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-[var(--text-muted)] hover:text-white hover:bg-[var(--surface-2)] transition"
                title="Settings"
            >
                <Settings size={18} />
            </button>
            <div className="mt-auto flex flex-col gap-2">
                <button 
                    onClick={() => setIsExportOpen(true)}
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--accent-subtle)] transition"
                    title="Export"
                >
                    <Download size={18} />
                </button>
            </div>
        </div>

        <SlideListSidebar
          slides={slides}
          activeSlideId={activeSlideId}
          onSelectSlide={setActiveSlideId}
          onAddSlide={addNewSlide}
          onMoveSlide={handleMoveSlide}
          onDuplicateSlide={handleDuplicateSlide}
          onCopySlide={handleCopySlideToClipboard}
          onDownloadSlide={handleDownloadSlideImage}
          onDeleteSlide={handleDeleteSlide}
          onRegenerateSlide={handleRegenerateSlide}
          regeneratingSlideId={regeneratingSlideId}
          onPreviewImage={setPreviewImageUrl}
          copyingSlideId={copyingSlideId}
          downloadingSlideId={downloadingSlideId}
          slideRefs={sidebarSlideRefs}
        />

        {/* Canvas Area */}
        <div 
            className="flex-1 relative bg-[#0B0F19] flex flex-col overflow-hidden"
        >
            {/* Grid Background */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
                    style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
            </div>

            {/* Toolbar - Two Rows */}
            {showTextFormattingToolbar && (
            <div className="hidden lg:flex flex-col absolute top-4 left-1/2 -translate-x-1/2 bg-[var(--surface-2)]/95 backdrop-blur-md border border-[var(--border-hover)]/50 rounded-2xl shadow-2xl z-20">
                {/* Row 1: Main Tools */}
                <div className="flex items-center gap-1 px-2 py-1.5">
                    <button 
                        onClick={() => handleToolClick('color')}
                        className={`w-9 h-9 flex items-center justify-center rounded-xl shadow-lg transition relative overflow-hidden ${activeTool === 'color' ? 'ring-2 ring-[var(--accent)]' : 'hover:ring-2 hover:ring-[var(--border-hover)]'}`}
                        title="Background Color"
                        aria-label="Background Color"
                        style={{ backgroundColor: slides[0]?.backgroundColor || '#0B0F19' }}
                    >
                        <div className="absolute inset-0 bg-black/20" />
                        <Palette size={16} className="relative z-10 text-white drop-shadow-md" />
                    </button>
                    <button 
                        onClick={() => handleToolClick('text')}
                        className={`w-9 h-9 flex items-center justify-center rounded-xl transition ${activeTool === 'text' ? 'bg-[var(--accent)] text-black' : 'text-[var(--text-muted)] hover:text-white hover:bg-[var(--surface-3)]'}`}
                        title="Add Text"
                        aria-label="Add Text"
                    >
                        <SquarePen size={16} />
                    </button>
                    <button 
                        onClick={() => handleToolClick('image')}
                        className={`w-9 h-9 flex items-center justify-center rounded-xl transition ${activeTool === 'image' ? 'bg-[var(--accent)] text-black' : 'text-[var(--text-muted)] hover:text-white hover:bg-[var(--surface-3)]'}`}
                        title="Background Image"
                        aria-label="Background Image"
                    >
                        <ImageIcon size={16} />
                    </button>
                </div>
                
                {/* Row 2 & 3: Text Formatting (2 rows from TextToolbar) */}
                <div className="px-2 py-1 border-t border-[var(--border-hover)]/50 bg-[var(--surface-2)]/50" onMouseDown={(e) => { if (!(e.target as HTMLElement).closest('input')) e.preventDefault(); }}>
                    <TextToolbar inline />
                </div>

                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                <input type="color" ref={colorInputRef} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-0 h-0 opacity-0" value={slides[0]?.backgroundColor || '#0B0F19'} onChange={handleBackgroundColorChange} />
            </div>
            )}

            {/* Text Toolbar Sidebar - appears when button is clicked */}
            {isTextToolbarOpen && (
              <div 
                className="fixed left-16 top-16 bottom-0 w-72 bg-[var(--surface-1)]/95 backdrop-blur-md border-r border-[var(--border-hover)] shadow-2xl z-[100]"
                style={{ 
                  top: '72px',
                  maxHeight: 'calc(100vh - 72px)',
                  overflow: 'visible'
                }}
              >
                <div className="h-full overflow-y-auto" style={{ overflowX: 'visible' }}>
                  <div className="p-4 border-b border-[var(--border-hover)] flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Text Editor</h3>
                    <button
                      onClick={() => setIsTextToolbarOpen(false)}
                      className="p-1 hover:bg-[var(--surface-2)] rounded transition-colors"
                    >
                      <X size={18} className="text-[var(--text-muted)]" />
                    </button>
                  </div>
                  <div style={{ position: 'relative', overflow: 'visible' }}>
                    <TextToolbar isOpen={isTextToolbarOpen} onToggle={() => setIsTextToolbarOpen(false)} />
                  </div>
                </div>
              </div>
            )}

            {/* Main Viewport */}
            <div className="flex-1 overflow-hidden px-0 lg:px-4 pb-0 lg:pb-8">
                <div
                    ref={slidesScrollRef}
                    className="relative z-10 h-full overflow-y-auto lg:snap-y lg:snap-proximity space-y-4 lg:space-y-16 pt-4 lg:pt-28 pb-24 lg:pb-32 no-scrollbar touch-pan-y"
                >
                    {slides.map((slide) => (
                        <div
                            key={slide.id}
                            data-slide-id={slide.id}
                            onClick={() => setActiveSlideId(slide.id)}
                            className={`lg:snap-center flex justify-center transition-opacity duration-300 ${
                                slide.id === activeSlideId ? 'opacity-100' : 'opacity-60 hover:opacity-90 cursor-pointer'
                            }`}
                        >
                            <div
                                style={{
                                    width: 1080 * currentScale,
                                    height: 1080 * currentScale,
                                }}
                                className="relative"
                            >
                                <div
                                    style={{
                                        transform: `scale(${currentScale})`,
                                        transformOrigin: 'top left',
                                        transition: 'transform 0.3s ease-out'
                                    }}
                                    className={`absolute top-0 left-0 shadow-2xl rounded-none ring-1 ring-white/10 transition-transform duration-300 origin-top-left ${
                                        slide.id === activeSlideId ? 'ring-[var(--accent)]/70' : ''
                                    }`}
                                >
                                    <div 
                                        className="w-[1080px] h-[1080px] relative overflow-hidden"
                                    >
                                        {/* Grid Overlay */}
                                        {showGrid && (
                                            <div 
                                                className="absolute inset-0 z-[60] pointer-events-none"
                                                style={{
                                                    backgroundImage: `
                                                        linear-gradient(rgba(255, 215, 0, 0.3) 1px, transparent 1px),
                                                        linear-gradient(90deg, rgba(255, 215, 0, 0.3) 1px, transparent 1px)
                                                    `,
                                                    backgroundSize: `${gridSize}px ${gridSize}px`,
                                                }}
                                            />
                                        )}
                                        {/* Guide Lines */}
                                        {showGuides && (
                                            <>
                                                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-[var(--accent-subtle)]0 z-[61] pointer-events-none" style={{ transform: 'translateX(-50%)' }} />
                                                <div className="absolute top-1/2 left-0 right-0 h-px bg-[var(--accent-subtle)]0 z-[61] pointer-events-none" style={{ transform: 'translateY(-50%)' }} />
                                            </>
                                        )}
                                        <Slide
                                            {...slide}
                                            isEditable={slide.id === activeSlideId}
                                            scale={currentScale}
                                            onUpdate={(field, value) => {
                                                const current = slides.find((s) => s.id === slide.id);
                                                const isDeletion =
                                                  (field === 'customBlocks' &&
                                                    Array.isArray(value) &&
                                                    ((current?.customBlocks?.length ?? 0) > value.length)) ||
                                                  (field === 'chartData' &&
                                                    Array.isArray(value) &&
                                                    ((current?.chartData?.length ?? 0) > value.length));

                                                const nextSlides = slides.map((s) =>
                                                  s.id === slide.id ? { ...s, [field]: value } : s
                                                );

                                                if (isDeletion) {
                                                  commitSlidesImmediateHistory(nextSlides);
                                                } else {
                                                  setSlides(nextSlides);
                                                }
                                            }}
                                            onImagePreview={(url) => setPreviewImageUrl(url)}
                                        />
                                    </div>
                                </div>

                                {/* Mobile Edit Overlay Button */}
                                {slide.id === activeSlideId && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setIsPropertiesPanelOpen(true);
                                        }}
                                        className="lg:hidden absolute top-4 right-4 z-50 bg-[var(--accent)] text-black p-3 rounded-full shadow-xl animate-in fade-in zoom-in duration-300 hover:bg-[var(--accent-hover)] active:scale-90 transition-all border-2 border-black/10"
                                        title="Edit Slide Properties"
                                    >
                                        <Pencil size={20} />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Mobile Slide Navigation */}
            <div className="lg:hidden px-4 pb-5 flex items-center gap-3 justify-between z-20">
                <button
                    onClick={() => goToSlideByIndex(activeSlideIndex - 1)}
                    disabled={activeSlideIndex <= 0}
                    className="w-12 h-12 rounded-2xl border border-[var(--border)] bg-[var(--surface-1)]/60 flex items-center justify-center text-[var(--text-secondary)] transition disabled:opacity-30 disabled:cursor-not-allowed"
                    aria-label="Previous slide"
                >
                    <ChevronLeft size={20} />
                </button>
                
                <div className="flex-1 flex gap-2">
                    <button
                        onClick={() => setIsMobileSlidesOpen(true)}
                        className="flex-1 px-2 py-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-1)]/80 text-sm font-medium text-[var(--text-secondary)] flex flex-col items-center justify-center gap-1 shadow-lg"
                    >
                        <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">Slides</span>
                        <span className="text-sm font-semibold text-white">#{activeSlideIndex + 1} / {slides.length}</span>
                    </button>
                    <button
                        onClick={() => setIsPropertiesPanelOpen(true)}
                        className="flex-1 px-2 py-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-1)]/80 text-sm font-medium text-[var(--text-secondary)] flex flex-col items-center justify-center gap-1 shadow-lg active:bg-[var(--surface-2)]"
                    >
                        <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">Edit</span>
                        <Settings size={18} className="text-white" />
                    </button>
                </div>

                <button
                    onClick={() => goToSlideByIndex(activeSlideIndex + 1)}
                    disabled={activeSlideIndex >= slides.length - 1}
                    className="w-12 h-12 rounded-2xl border border-[var(--border)] bg-[var(--surface-1)]/60 flex items-center justify-center text-[var(--text-secondary)] transition disabled:opacity-30 disabled:cursor-not-allowed"
                    aria-label="Next slide"
                >
                    <ChevronLeft size={20} className="rotate-180" />
                </button>
            </div>
            
            {/* Properties Panel */}
            {isPropertiesPanelOpen && (
                <>
                    {/* Click outside overlay */}
                    <div
                        className="fixed inset-0 z-[99] xl:hidden"
                        onClick={() => setIsPropertiesPanelOpen(false)}
                    />

                    <div className="pointer-events-none absolute top-0 right-6 hidden xl:block z-30">
                        <div className="pointer-events-auto mt-6 w-[26rem] bg-[var(--surface-2)]/90 backdrop-blur-md border border-[var(--border-hover)]/70 rounded-2xl p-6 shadow-2xl max-h-[80vh] overflow-y-auto hide-scrollbar animate-in fade-in duration-200">
                            {renderPropertiesPanelContent()}
                        </div>
                    </div>
                    <div className="fixed inset-0 z-40 flex xl:hidden">
                        <button
                            className="absolute inset-0 bg-black/70"
                            onClick={() => setIsPropertiesPanelOpen(false)}
                        />
                        <div className="relative z-10 w-full max-w-md ml-auto h-full bg-[var(--surface-1)] border-l border-[var(--border)] rounded-l-3xl p-6 overflow-y-auto hide-scrollbar shadow-2xl animate-in slide-in-from-right duration-300">
                            {renderPropertiesPanelContent()}
                        </div>
                    </div>
                </>
            )}

        </div>
      </div>
      </ErrorBoundary>
      
      <ExportModal
        isOpen={isExportOpen}
        onClose={closeExport}
        isExporting={isExporting}
        exportProgress={exportProgress}
        onExportPDF={handleExportPDF}
        onExportImages={handleExportImages}
        slideCount={slides.length}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={closeSettings}
        projectName={projectName}
        onProjectNameChange={setProjectName}
        brandSettings={brandSettings}
        onBrandSettingsChange={setBrandSettings}
        canUploadLogo={false}
        isUploadingLogo={false}
        isSaving={isSavingBrandSettings}
        onLogoUpload={() => {}}
        onLogoDelete={() => {}}
        onSave={saveBrandSettings}
        onReset={resetBrandSettings}
      />



      {/* Mobile Slides Drawer */}
      {isMobileSlidesOpen && (
        <div className="fixed inset-0 z-50 flex items-end lg:hidden">
          <button
            className="absolute inset-0 bg-black/70"
            onClick={() => setIsMobileSlidesOpen(false)}
          />
          <div className="relative z-10 w-full bg-[var(--surface-1)] border-t border-[var(--border)] rounded-t-3xl p-4 max-h-[80vh]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-[var(--text-muted)]">
                <Layout size={18} />
                <span className="text-sm font-bold uppercase tracking-wider">Slides ({slides.length})</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={addNewSlide}
                  className="w-8 h-8 bg-[var(--surface-2)] hover:bg-[var(--surface-3)] rounded-full flex items-center justify-center text-[var(--text-secondary)] transition"
                >
                  <Plus size={16} />
                </button>
                <button
                  onClick={() => setIsMobileSlidesOpen(false)}
                  className="w-8 h-8 bg-[var(--surface-2)] hover:bg-[var(--surface-3)] rounded-full flex items-center justify-center text-[var(--text-secondary)] transition"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
            <div className="space-y-3 overflow-y-auto pr-2" style={{ maxHeight: '60vh' }}>
              {slides.map((slide, index) => (
                <div
                  key={slide.id}
                  onClick={() => {
                    setActiveSlideId(slide.id);
                    setIsMobileSlidesOpen(false);
                  }}
                  className={`group cursor-pointer rounded-xl transition-all duration-200 border ${activeSlideId === slide.id ? 'bg-[var(--surface-2)]/60 border-[var(--accent)]/50 shadow-lg' : 'border-transparent hover:bg-[var(--surface-2)]/40 hover:border-[var(--border-hover)]'}`}
                >
                  <div className="p-3 flex items-center gap-3">
                    <div className="text-xs font-medium text-[var(--text-muted)] w-12">#{index + 1}</div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-white truncate">{slide.title}</div>
                      <div className="text-xs text-[var(--text-muted)]">{slide.type === 'cover' ? 'Cover slide' : 'Content slide'}</div>
                    </div>
                    <div className="w-16 h-16 bg-[var(--surface-1)] rounded-lg border border-[var(--border-hover)]/50 overflow-hidden flex items-center justify-center">
                      <div className="transform scale-[0.12] origin-center pointer-events-none">
                        <Slide {...slide} />
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRegenerateSlide(slide.id);
                        }}
                        className="px-3 py-1 rounded-lg border border-[var(--border-hover)] text-yellow-300 text-xs hover:border-yellow-500 transition disabled:opacity-40"
                        disabled={regeneratingSlideId !== null}
                      >
                        {regeneratingSlideId === slide.id ? 'Refining…' : 'Refine'}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownloadSlideImage(slide, index);
                        }}
                        className="px-3 py-1 rounded-lg border border-[var(--border-hover)] text-[var(--text-secondary)] text-xs hover:text-white hover:border-[var(--border-hover)] transition disabled:opacity-40"
                        disabled={downloadingSlideId !== null && downloadingSlideId !== slide.id}
                      >
                        {downloadingSlideId === slide.id ? 'Downloading…' : 'Download'}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSlide(slide.id);
                        }}
                        className="px-3 py-1 rounded-lg border border-[var(--border-hover)] text-red-300 text-xs hover:border-red-500 transition disabled:opacity-40"
                        disabled={slides.length === 1}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <button
            className="absolute inset-0 bg-black/70"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
          <div className="relative z-10 w-64 bg-[var(--surface-1)] border-r border-[var(--border)] h-full p-5 flex flex-col gap-4 shadow-2xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                Tools
              </span>
              <button
                onClick={() => setIsMobileSidebarOpen(false)}
                className="w-8 h-8 rounded-full bg-[var(--surface-2)] hover:bg-[var(--surface-3)] flex items-center justify-center text-[var(--text-secondary)] transition"
              >
                <X size={16} />
              </button>
            </div>
            
            {/* Quick Tools Grid */}
            <div className="grid grid-cols-4 gap-2 mb-4">
                <button
                  onClick={() => {
                    handleToolClick('text');
                    setIsMobileSidebarOpen(false);
                  }}
                  className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border-hover)] hover:bg-[var(--surface-3)] transition"
                >
                    <Type size={20} className="text-[var(--accent)]" />
                    <span className="text-[10px] font-medium text-[var(--text-muted)]">Text</span>
                </button>
                <button
                  onClick={() => {
                    handleToolClick('image');
                    setIsMobileSidebarOpen(false);
                  }}
                  className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border-hover)] hover:bg-[var(--surface-3)] transition"
                >
                    <ImageIcon size={20} className="text-blue-400" />
                    <span className="text-[10px] font-medium text-[var(--text-muted)]">Image</span>
                </button>
                <button
                  onClick={() => {
                    handleToolClick('color');
                    setIsMobileSidebarOpen(false);
                  }}
                  className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border-hover)] hover:bg-[var(--surface-3)] transition"
                >
                    <Palette size={20} className="text-pink-400" />
                    <span className="text-[10px] font-medium text-[var(--text-muted)]">Color</span>
                </button>
            </div>

            {/* Undo/Redo */}
            <div className="flex gap-2 mb-4">
                <button
                  onClick={() => {
                    handleUndo();
                  }}
                  disabled={!canUndo}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border-hover)] hover:bg-[var(--surface-3)] transition disabled:opacity-30 disabled:cursor-not-allowed"
                >
                    <Undo2 size={18} className="text-[var(--text-secondary)]" />
                    <span className="text-xs font-medium text-[var(--text-secondary)]">Undo</span>
                </button>
                <button
                  onClick={() => {
                    handleRedo();
                  }}
                  disabled={!canRedo}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border-hover)] hover:bg-[var(--surface-3)] transition disabled:opacity-30 disabled:cursor-not-allowed"
                >
                    <Redo2 size={18} className="text-[var(--text-secondary)]" />
                    <span className="text-xs font-medium text-[var(--text-secondary)]">Redo</span>
                </button>
            </div>

            <button
              onClick={() => {
                setIsExportOpen(true);
                setIsMobileSidebarOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-[var(--accent)] text-black font-bold border border-[var(--accent)] hover:bg-[var(--accent-hover)] transition mb-2"
            >
              <Download size={18} />
              Export Carousel
            </button>
            <button
              onClick={() => {
                setIsTemplatesOpen(true);
                setIsMobileSidebarOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-[var(--surface-2)] text-[var(--text-secondary)] border border-[var(--border-hover)] hover:border-[var(--border-hover)] transition"
            >
              <Layout size={18} />
              Templates
            </button>
            <button
              onClick={() => {
                setIsAiModalOpen(true);
                setIsMobileSidebarOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-[var(--surface-2)] text-[var(--text-secondary)] border border-[var(--border-hover)] hover:border-[var(--border-hover)] transition"
            >
              <Sparkles size={18} />
              AI Generate
            </button>
            <button
              onClick={() => {
                setIsSettingsOpen(true);
                setIsMobileSidebarOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-[var(--surface-2)] text-[var(--text-secondary)] border border-[var(--border-hover)] hover:border-[var(--border-hover)] transition"
            >
              <Palette size={18} />
              Theme & Settings
            </button>
            <button
              onClick={() => {
                setIsMobileSlidesOpen(true);
                setIsMobileSidebarOpen(false);
              }}
              className="mt-auto px-4 py-3 rounded-2xl bg-[var(--surface-1)] text-white border border-[var(--border-hover)] hover:bg-[var(--surface-2)] transition flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <Layout size={18} />
                Slides ({slides.length})
              </div>
              <ChevronLeft size={16} className="rotate-180" />
            </button>
          </div>
        </div>
      )}

      <ThemeGalleryModal
        isOpen={isTemplatesOpen}
        onClose={closeTemplates}
        setSlides={setSlides}
        brandSettings={brandSettings}
        setBrandSettings={setBrandSettings}
        authStatus={status}
        addToHistory={addToHistory}
        slides={slides}
      />

      {/* Image Preview Modal */}
      {previewImageUrl && (
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm cursor-zoom-out"
          onClick={() => setPreviewImageUrl(null)}
        >
          <div className="relative max-w-[90vw] max-h-[90vh]">
            <button
              onClick={() => setPreviewImageUrl(null)}
              className="absolute -top-12 right-0 text-white hover:text-[var(--accent)] transition flex items-center gap-2"
            >
              <span className="text-sm">Press ESC or click anywhere to close</span>
              <X size={24} />
            </button>
            <img
              src={previewImageUrl}
              alt="Full size preview"
              className="max-w-full max-h-[85vh] rounded-xl shadow-2xl object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="absolute -bottom-12 left-0 right-0 flex justify-center gap-4">
              <a
                href={previewImageUrl}
                download="infographic.png"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-[var(--accent)] text-black font-semibold rounded-lg hover:bg-[var(--accent-hover)] transition flex items-center gap-2"
                onClick={(e) => e.stopPropagation()}
              >
                <Download size={18} />
                Download Full Size
              </a>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(previewImageUrl, '_blank');
                }}
                className="px-4 py-2 bg-[var(--surface-3)] text-white font-semibold rounded-lg hover:bg-[var(--surface-3)] transition flex items-center gap-2"
              >
                <ExternalLink size={18} />
                Open in New Tab
              </button>
            </div>
          </div>
        </div>
      )}

      <AIGenerateModal
        isOpen={isAiModalOpen}
        onClose={closeAiModal}
        aiInputTab={aiInputTab}
        onInputTabChange={setAiInputTab}
        aiPrompt={aiPrompt}
        onPromptChange={setAiPrompt}
        docAttachment={docAttachment}
        onDocUpload={handleDocUpload}
        onClearDoc={clearDocAttachment}
        isUploadingDoc={isUploadingDoc}
        docUploadError={docUploadError}
        docUploadInputRef={docUploadInputRef}
        urlAttachment={urlAttachment}
        urlInput={urlInput}
        onUrlInputChange={setUrlInput}
        urlError={urlError}
        onUrlErrorChange={setUrlError}
        urlOwnershipConfirmed={urlOwnershipConfirmed}
        onOwnershipChange={setUrlOwnershipConfirmed}
        onParseUrl={handleParseUrl}
        isParsingUrl={isParsingUrl}
        onClearUrl={clearUrlAttachment}
        aiSlideStyle={aiSlideStyle}
        onSlideStyleChange={setAiSlideStyle}
        aiWritingStyle={aiWritingStyle}
        onWritingStyleChange={setAiWritingStyle}
        aiLanguage={aiLanguage}
        onLanguageChange={setAiLanguage}
        aiSlideCount={aiSlideCount}
        onSlideCountChange={(v) => { if (v !== null) setAiSlideCount(v); }}
        aiWordCount={aiWordCount}
        onWordCountChange={setAiWordCount}
        isAdvancedOpen={isAdvancedOptionsOpen}
        onAdvancedToggle={() => setIsAdvancedOptionsOpen(!isAdvancedOptionsOpen)}
        aiTone={aiTone}
        onToneChange={setAiTone}
        aiAutoHashtags={aiAutoHashtags}
        onAutoHashtagsChange={setAiAutoHashtags}
        aiIncludeStats={aiIncludeStats}
        onIncludeStatsChange={setAiIncludeStats}
        aiAccessibility={aiAccessibility}
        onAccessibilityChange={setAiAccessibility}
        aiSmartColors={aiSmartColors}
        onSmartColorsChange={setAiSmartColors}
        freshDesign={aiFreshDesign}
        onFreshDesignChange={setAiFreshDesign}
        aiAudience={aiAudience}
        onAudienceChange={setAiAudience}
        aiGoal={aiGoal}
        onGoalChange={setAiGoal}
        onGenerate={handleAiGenerate}
        isGenerating={isGenerating}
      />


      <ImagePickerModal
        isOpen={isImagePickerOpen}
        onClose={closeImagePicker}
        mode={imagePickerMode}
        imageUrlInput={imageUrlInput}
        onImageUrlChange={setImageUrlInput}
        onApplyUrl={applyBackgroundImage}
        onUploadClick={() => fileInputRef.current?.click()}
        unsplashQuery={unsplashQuery}
        onUnsplashQueryChange={setUnsplashQuery}
        onSearch={searchUnsplash}
        unsplashResults={unsplashResults}
        unsplashTotal={unsplashTotal}
        unsplashPage={unsplashPage}
        unsplashLoading={unsplashLoading}
      />

      {/* Quick Export Bar — appears after AI generation */}
      {showQuickExport && slides.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[var(--surface-1)] border border-[var(--accent)]/30 rounded-2xl shadow-2xl shadow-black/50 px-6 py-3.5 flex items-center gap-5 animate-in slide-in-from-bottom duration-300">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-green-500/20 flex items-center justify-center">
              <Check size={14} className="text-green-400" />
            </div>
            <div>
              <p className="text-sm text-white font-medium">Carousel ready!</p>
              <p className="text-[11px] text-[var(--text-muted)]">{slides.length} slides</p>
            </div>
          </div>
          <button
            onClick={() => { handleExportPDF(); setShowQuickExport(false); }}
            className="px-5 py-2 bg-[var(--accent)] hover:brightness-110 text-black font-bold rounded-xl transition flex items-center gap-2 text-sm shadow-lg shadow-[var(--accent)]/20"
          >
            <Download size={15} />
            Download for LinkedIn
          </button>
          <button
            onClick={() => { setIsExportOpen(true); setShowQuickExport(false); }}
            className="text-xs text-[var(--text-muted)] hover:text-white transition whitespace-nowrap"
          >
            More options
          </button>
          <button
            onClick={() => setShowQuickExport(false)}
            className="text-[var(--text-muted)] hover:text-white transition ml-1"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Onboarding overlay for first-time users */}
      {showOnboarding && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[var(--surface-1)] border border-[var(--border)] rounded-2xl shadow-2xl max-w-md w-full mx-4 p-8 text-center relative overflow-hidden">
            <div className="absolute -top-16 -right-16 w-40 h-40 bg-[var(--accent)]/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-16 -left-16 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl" />

            <div className="relative">
              <div className="w-14 h-14 bg-[var(--accent)] rounded-2xl rotate-3 flex items-center justify-center mx-auto mb-4">
                <Sparkles size={28} className="text-black" />
              </div>
              <h2 className="text-xl font-bold mb-2">Welcome to Carouslk</h2>
              <p className="text-sm text-[var(--text-secondary)] mb-6 leading-relaxed">
                Create stunning carousels in seconds. Type a topic, paste a URL, or upload a document — our AI handles the rest.
              </p>

              <div className="space-y-3">
                <button
                  onClick={handleOnboardingGenerate}
                  className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[var(--accent)] text-black font-semibold text-sm hover:opacity-90 transition"
                >
                  <Sparkles size={16} />
                  Try it — Generate a Sample Carousel
                </button>
                <button
                  onClick={dismissOnboarding}
                  className="w-full px-5 py-2.5 rounded-xl border border-[var(--border)] text-[var(--text-secondary)] text-sm hover:bg-[var(--surface-2)] transition"
                >
                  Skip — I know what I&apos;m doing
                </button>
              </div>

              <div className="mt-6 grid grid-cols-3 gap-3 text-[11px] text-[var(--text-muted)]">
                <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-[var(--surface-2)]/50">
                  <Sparkles size={14} className="text-[var(--accent)]" />
                  AI Content
                </div>
                <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-[var(--surface-2)]/50">
                  <Palette size={14} className="text-purple-400" />
                  Brand Kit
                </div>
                <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-[var(--surface-2)]/50">
                  <Download size={14} className="text-green-400" />
                  Export All
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}


export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 dark:bg-[var(--surface-1)] text-gray-900 dark:text-white flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-[var(--accent)]" />
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}


