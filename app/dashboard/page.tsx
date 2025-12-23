"use client";

import React, { useState, useRef, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { toast } from 'sonner';
import { 
  Layout, 
  Menu,
  Sparkles, 
  Palette, 
  Settings, 
  Pencil,
  Plus, 
  Download, 
  MousePointer2, 
  Type, 
  Image as ImageIcon, 
  ChevronLeft,
  PanelRight,
  X,
  Loader2,
  BarChart3,
  LineChart,
  PieChart,
  Trash2,
  Paperclip,
  FileText,
  Trash,
  Upload,
  Undo2,
  Redo2,
  LogOut,
  Wand2,
  Search,
  TrendingUp,
  Lightbulb,
  Check,
  Copy,
  CreditCard
} from 'lucide-react';
import Link from 'next/link';
import { Slide } from '@/components/Slide';
import { TextToolbar } from '@/components/TextToolbar';
import { ProjectManager } from '@/components/ProjectManager';
import { useProject } from '@/lib/hooks/useProject';
import { THEMES } from '@/app/constants/themes';
import { toPng, toJpeg } from 'html-to-image';

// Types matching Slide.tsx
interface CustomBlock {
  id: string;
  html: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface SlideData {
  id: string;
  type: 'cover' | 'content' | 'chart';
  title: string;
  subtitle?: string;
  content?: string;
  emoji?: string;
  category?: string;
  accentColor?: string;
  handle?: string;
  fontFamily?: string;
  fontScale?: number;
  backgroundColor?: string;
  textColor?: string;
  backgroundImage?: string;
  backgroundOverlayOpacity?: number;
  backgroundImageFilter?: string; // e.g. "brightness(0.5) contrast(1.2)"
  textAlign?: 'left' | 'center' | 'right';
  chartType?: 'bar' | 'line' | 'pie';
  chartData?: Array<{ name: string; value: number; }>;
  mediaType?: 'video' | 'embed' | 'image' | null;
  mediaUrl?: string;
  mediaPosterUrl?: string; // Generated thumbnail for video files
  embedHtml?: string;
  mediaAspectRatio?: number;
  mediaWidthPercent?: number;
  mediaAlignment?: 'left' | 'center' | 'right';
  elementOrder?: string[];
  customBlocks?: CustomBlock[];
  logoUrl?: string | null;
}

const sanitizeEmoji = (value: string | undefined | null) => {
  if (!value) return '';
  return value
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .trim();
};

function DashboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const projectId = searchParams.get('project') || undefined;

  // Hooks must be called before any conditional returns
  const {
    project: loadedProject,
    loading: projectLoading,
    saving: projectSaving,
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
  const [projectName, setProjectName] = useState('Untitled Project');
  const [projectOptions, setProjectOptions] = useState<any>({});
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState<'pdf' | 'ppt' | null>(null);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiSlideCount, setAiSlideCount] = useState(6);
  const [aiWordCount, setAiWordCount] = useState<number | ''>('');
  const [aiWritingStyle, setAiWritingStyle] = useState<string>('Professional');
  const [activeTool, setActiveTool] = useState<'select' | 'text' | 'image' | 'image-all' | 'color'>('select');
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);

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
  const [slideDownloadData, setSlideDownloadData] = useState<SlideData | null>(null);
  const [downloadingSlideId, setDownloadingSlideId] = useState<string | null>(null);
  const [docAttachment, setDocAttachment] = useState<{ name: string; text: string; sections?: string[]; wordCount?: number; truncated?: boolean } | null>(null);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [docUploadError, setDocUploadError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [useStreaming, setUseStreaming] = useState(true); // Enable streaming by default

  // AI Features state
  const [isAiFeaturesOpen, setIsAiFeaturesOpen] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isEnhancingContent, setIsEnhancingContent] = useState(false);
  const [isResearching, setIsResearching] = useState(false);
  const [isAnalyzingDesign, setIsAnalyzingDesign] = useState(false);
  const [isPredictingPerformance, setIsPredictingPerformance] = useState(false);
  const [enhancementResult, setEnhancementResult] = useState<string | null>(null);
  const [researchResult, setResearchResult] = useState<any>(null);
  const [designSuggestions, setDesignSuggestions] = useState<any>(null);
  const [performancePrediction, setPerformancePrediction] = useState<any>(null);
  const [researchTopic, setResearchTopic] = useState('');
  
  // Dedicated AI tool result modal state
  const [activeAiToolResult, setActiveAiToolResult] = useState<{
    tool: 'research' | 'design' | 'performance' | 'enhancement' | null;
    data: any;
    query?: string;
  } | null>(null);

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
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const logoUploadInputRef = useRef<HTMLInputElement>(null);

  // Load brand settings from API
  const loadBrandSettings = useCallback(async () => {
    if (status !== 'authenticated') return;
    
    try {
      setIsLoadingBrandSettings(true);
      const response = await fetch('/api/user/brand-settings');
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
            accentColor: data.settings.accentColor
          })));
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
      alert('Failed to save brand settings');
    } finally {
      setIsSavingBrandSettings(false);
    }
  }, [brandSettings, status]);

  // Handle logo upload
  const handleLogoUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    
    // Validate file size (max 10MB for logos)
    const maxSizeMB = 10;
    if (file.size / 1024 / 1024 > maxSizeMB) {
      toast.error(`Logo file too large. Please upload a file <= ${maxSizeMB} MB.`);
      return;
    }
    
    try {
      setIsUploadingLogo(true);
      
      const formData = new FormData();
      formData.append('file', file);
      
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (uploadRes.ok) {
        const data = await uploadRes.json();
        setBrandSettings({ ...brandSettings, logoUrl: data.secure_url });
      } else {
        const errorData = await uploadRes.json();
        toast.error(errorData.error || 'Failed to upload logo');
      }
    } catch (error) {
      toast.error('Failed to upload logo');
    } finally {
      setIsUploadingLogo(false);
      if (logoUploadInputRef.current) {
        logoUploadInputRef.current.value = '';
      }
    }
  }, [brandSettings]);
  
  // Handle logo deletion
  const handleLogoDelete = useCallback(async () => {
    if (!brandSettings.logoUrl) return;
    
    if (!confirm('Are you sure you want to delete your logo?')) {
      return;
    }
    
    try {
      setIsSavingBrandSettings(true);
      const response = await fetch('/api/user/brand-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          settings: { ...brandSettings, logoUrl: null },
          deleteLogo: true
        })
      });
      
      if (response.ok) {
        setBrandSettings({ ...brandSettings, logoUrl: null });
      } else {
        alert('Failed to delete logo');
      }
    } catch (error) {
      alert('Failed to delete logo');
    } finally {
      setIsSavingBrandSettings(false);
    }
  }, [brandSettings]);

  // Reset brand settings to defaults
  const resetBrandSettings = useCallback(async () => {
    if (status !== 'authenticated') return;
    
    if (!confirm('Are you sure you want to reset brand settings to defaults?')) {
      return;
    }
    
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
        }
      } else {
        alert('Failed to reset brand settings');
      }
    } catch (error) {
      alert('Failed to reset brand settings');
    } finally {
      setIsSavingBrandSettings(false);
    }
  }, [status]);

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
    
    // Open mobile sidebar by default on small screens
    if (window.innerWidth < 1024) {
        setIsMobileSidebarOpen(true);
    }

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [slides, setSlides] = useState<SlideData[]>([
    {
      id: '1',
      type: 'cover',
      title: 'THE SECRET SAUCE',
      subtitle: 'How to create viral carousels in minutes.',
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
        emoji: '🪝',
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
        emoji: '📖',
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

  const activeSlide = slides.find(s => s.id === activeSlideId) || slides[0];
  const activeSlideIndex = Math.max(0, slides.findIndex(s => s.id === activeSlideId));

  const createCustomBlock = (): CustomBlock => ({
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `block-${Date.now()}-${Math.random()}`,
    html: '<p>Text block</p>',
    x: 100,
    y: 400,
    width: 360,
    height: 140,
  });

  const normalizeSlides = (incomingSlides: SlideData[]) => {
    const timestamp = Date.now();
    const baseSlide = slides[0];
    return incomingSlides.map((slide, index) => ({
      ...slide,
      fontScale: slide.fontScale ?? 1,
      mediaType: slide.mediaType ?? null,
      mediaAspectRatio: slide.mediaAspectRatio ?? 16 / 9,
      mediaWidthPercent: typeof slide.mediaWidthPercent === 'number' ? slide.mediaWidthPercent : 100,
      mediaAlignment: slide.mediaAlignment || 'center',
      category: slide.category ?? baseSlide?.category ?? '',
      handle: slide.handle ?? baseSlide?.handle ?? '@carouslk',
      accentColor: slide.accentColor ?? baseSlide?.accentColor,
      elementOrder: slide.elementOrder || (slide.type === 'cover' ? ['title', 'subtitle', 'media'] : slide.type === 'chart' ? ['emoji', 'title', 'content', 'chart', 'media'] : ['emoji', 'title', 'content', 'media']),
      customBlocks: Array.isArray(slide.customBlocks) ? slide.customBlocks : [],
      id: slide.id || `${timestamp}-${index}`,
    }));
  };

  useEffect(() => {
    activeSlideIdRef.current = activeSlideId;
  }, [activeSlideId]);

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

  const addNewSlide = () => {
    const newId = Date.now().toString();
    setSlides([...slides, {
      id: newId,
      type: 'content',
      title: 'New Slide',
      content: '<p>Edit this content...</p>',
      emoji: '✨',
      category: brandSettings.category,
      accentColor: brandSettings.accentColor,
      handle: brandSettings.handle,
      fontFamily: brandSettings.fontFamily,
      fontScale: slides[0]?.fontScale || 1,
      backgroundColor: brandSettings.backgroundColor,
      textColor: brandSettings.textColor,
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
  };

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

  // Load project when it's available
  useEffect(() => {
    if (loadedProject && !projectLoading) {
      setSlides(loadedProject.slides);
      setProjectName(loadedProject.name);
      setProjectOptions(loadedProject.options || {});
      if (loadedProject.slides.length > 0) {
        setActiveSlideId(loadedProject.slides[0].id);
      }
    }
  }, [loadedProject, projectLoading]);

  // Auto-save when slides change
  useEffect(() => {
    if (projectId && slides.length > 0) {
      autoSaveProject(slides, projectOptions);
    }
  }, [slides, projectOptions, projectId, autoSaveProject]);

  // Handle project load from ProjectManager
  const handleProjectLoad = useCallback((project: { id: string; name: string; slides: SlideData[]; options: any }) => {
    setSlides(project.slides);
    setProjectName(project.name);
    setProjectOptions(project.options || {});
    if (project.slides.length > 0) {
      setActiveSlideId(project.slides[0].id);
    }
    addToHistory(project.slides);
  }, [addToHistory]);

  // Undo handler
  const handleUndo = useCallback(() => {
    const previousSlides = undoProject();
    if (previousSlides) {
      setSlides(previousSlides);
    }
  }, [undoProject]);

  // Redo handler
  const handleRedo = useCallback(() => {
    const nextSlides = redoProject();
    if (nextSlides) {
      setSlides(nextSlides);
    }
  }, [redoProject]);

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        if (canUndo) handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        if (canRedo) handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canUndo, canRedo, handleUndo, handleRedo]);

  // Update slides with history tracking
  const updateSlides = useCallback((newSlides: SlideData[]) => {
    setSlides(newSlides);
    addToHistory(newSlides);
  }, [addToHistory]);

  // Show loading state while checking authentication
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-[#ffd700]" />
      </div>
    );
  }

  // Don't render if not authenticated (redirect is in progress)
  if (status === 'unauthenticated') {
    return null;
  }

  const handleDeleteSlide = (id: string) => {
    if (slides.length === 1) {
      alert('You need at least one slide in your project.');
      return;
    }

    const targetIndex = slides.findIndex(s => s.id === id);
    const updatedSlides = slides.filter(s => s.id !== id);
    updateSlides(updatedSlides);

    if (activeSlideId === id && updatedSlides.length > 0) {
      const fallbackIndex = Math.min(targetIndex, updatedSlides.length - 1);
      setActiveSlideId(updatedSlides[fallbackIndex].id);
    }
  };

  const handleDownloadSlideImage = async (slide: SlideData, index: number) => {
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

      const dataUrl = await toPng(slideDownloadRef.current, {
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
      // Download failed silently
    } finally {
      // Delay state reset to prevent rapid repeated downloads
      setTimeout(() => {
        setDownloadingSlideId(null);
        setSlideDownloadData(null);
      }, 500);
    }
  };

  const adjustFontScale = (delta: number) => {
    if (!activeSlide) return;
    const current = activeSlide.fontScale ?? 1;
    const next = Math.min(1.5, Math.max(0.7, parseFloat((current + delta).toFixed(2))));
    setSlides(slides.map(s => s.id === activeSlide.id ? { ...s, fontScale: next } : s));
  };

  const handleAiGenerate = async () => {
    const combinedSource = [docAttachment?.text, aiPrompt.trim()].filter(Boolean).join('\n\n').trim();
    if (!combinedSource) {
      setDocUploadError('Add a prompt or attach a document to proceed.');
      return;
    }
    
    setDocUploadError(null);
    setIsGenerating(true);
    setStreamingText('');

    // Try streaming first, fallback to regular
    let useStream = useStreaming;
    if (useStream) {
      try {
        const streamResponse = await fetch('/api/generate/stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: combinedSource,
            slideCount: aiSlideCount,
            wordCount: aiWordCount || undefined,
            writingStyle: aiWritingStyle,
            sections: docAttachment?.sections || [],
          }),
        });

        if (streamResponse.ok) {
          // For now, use regular endpoint as streaming needs more complex handling
          // This is a placeholder for future streaming UI
          useStream = false;
        }
      } catch (error) {
        useStream = false;
      }
    }

    // Regular generation (streaming UI can be added later)
    if (!useStream) {
      try {
        const response = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: combinedSource,
            slideCount: aiSlideCount,
            wordCount: aiWordCount || undefined,
            writingStyle: aiWritingStyle,
            sourceFile: docAttachment
              ? {
                  name: docAttachment.name,
                  wordCount: docAttachment.wordCount,
                  truncated: docAttachment.truncated,
                }
              : undefined,
          }),
        });
        
        const data = await response.json();
        
        if (data.slides && Array.isArray(data.slides)) {
          const normalized = normalizeSlides((data.slides || []).slice(0, aiSlideCount));
          setSlides(normalized);
          if (normalized.length > 0) {
            setActiveSlideId(normalized[0].id);
          }
          setIsAiModalOpen(false);
        }
      } catch (error) {
        // Generation failed silently
      } finally {
        setIsGenerating(false);
      }
    }
  };

  const handleToolClick = (tool: 'select' | 'text' | 'image' | 'image-all' | 'color') => {
    setActiveTool(tool);
    if (tool === 'image' || tool === 'image-all') {
        fileInputRef.current?.click();
        // Don't reset activeTool here - let handleImageUpload do it after applying the image
    } else if (tool === 'text') {
        if (!activeSlide) return;
        const newBlock = createCustomBlock();
        setSlides(slides.map(s => s.id === activeSlide.id ? { 
          ...s, 
          customBlocks: [...(s.customBlocks || []), newBlock], 
        } : s));
        setActiveTool('select');
    } else if (tool === 'color') {
        colorInputRef.current?.click();
        setTimeout(() => setActiveTool('select'), 100);
    }
  };

  const handleBackgroundColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value;
    // Apply to all slides
    setSlides(slides.map(s => ({ ...s, backgroundColor: color })));
  };

  const handleMediaImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
        const result = event.target?.result as string;
        setSlides(slides.map(s => s.id === activeSlide.id ? { 
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
            if (activeTool === 'image-all') {
                 // Apply to ALL slides
                 setSlides(slides.map(s => ({ ...s, backgroundImage: result })));
            } else {
                 // Apply to CURRENT slide only (whether tool is 'image' or 'select')
                 setSlides(slides.map(s => s.id === activeSlide.id ? { ...s, backgroundImage: result } : s));
            }
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
          setSlides(slides.map(s => 
            s.id === slideId 
              ? { ...s, backgroundImage: data.imageUrl, mediaType: 'image', mediaUrl: data.imageUrl }
              : s
          ));
        }
      }
    } catch (error) {
      alert('Failed to generate image');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // Content Enhancement
  const handleEnhanceContent = async (action: string, content: string) => {
    setIsEnhancingContent(true);
    setEnhancementResult(null);
    try {
      const response = await fetch('/api/ai/enhance-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          action,
          targetAudience: 'LinkedIn professionals'
        })
      });

      if (response.ok) {
        const data = await response.json();
        setEnhancementResult(data.enhancedContent);
        // Open dedicated modal with formatted result
        setActiveAiToolResult({
          tool: 'enhancement',
          data: { enhancedContent: data.enhancedContent, originalContent: content },
          query: `Enhance: ${action}`
        });
      }
    } catch (error) {
      alert('Failed to enhance content');
    } finally {
      setIsEnhancingContent(false);
    }
  };

  // Research Agent
  const handleResearch = async () => {
    if (!researchTopic.trim()) return;
    
    setIsResearching(true);
    setResearchResult(null);
    try {
      const response = await fetch('/api/ai/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: researchTopic,
          depth: 'comprehensive',
          sources: 5
        })
      });

      if (response.ok) {
        const data = await response.json();
        setResearchResult(data);
        // Open dedicated modal with formatted result
        setActiveAiToolResult({
          tool: 'research',
          data: data,
          query: researchTopic
        });
        setIsAiFeaturesOpen(false); // Close main modal
        // Auto-fill AI prompt with research
        setAiPrompt(data.research);
      }
    } catch (error) {
      alert('Failed to research topic');
    } finally {
      setIsResearching(false);
    }
  };

  // Design Suggestions
  const handleGetDesignSuggestions = async () => {
    setIsAnalyzingDesign(true);
    setDesignSuggestions(null);
    try {
      const response = await fetch('/api/ai/design-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slides,
          currentSettings: brandSettings
        })
      });

      if (response.ok) {
        const data = await response.json();
        setDesignSuggestions(data.suggestions);
        // Open dedicated modal with formatted result
        setActiveAiToolResult({
          tool: 'design',
          data: data.suggestions,
          query: 'Design Analysis'
        });
        setIsAiFeaturesOpen(false); // Close main modal
      }
    } catch (error) {
      alert('Failed to get design suggestions');
    } finally {
      setIsAnalyzingDesign(false);
    }
  };

  // Performance Prediction
  const handlePredictPerformance = async () => {
    setIsPredictingPerformance(true);
    setPerformancePrediction(null);
    try {
      const response = await fetch('/api/ai/predict-performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slides,
          platform: 'LinkedIn',
          targetAudience: 'tech professionals'
        })
      });

      if (response.ok) {
        const data = await response.json();
        setPerformancePrediction(data.prediction);
        // Open dedicated modal with formatted result
        setActiveAiToolResult({
          tool: 'performance',
          data: data.prediction,
          query: 'Performance Analysis'
        });
        setIsAiFeaturesOpen(false); // Close main modal
      }
    } catch (error) {
      alert('Failed to predict performance');
    } finally {
      setIsPredictingPerformance(false);
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Optimistic: Show local blob immediately while uploading
    const localUrl = URL.createObjectURL(file);
    
    // Generate thumbnail immediately
    let posterUrl: string | undefined = undefined;
    try {
        posterUrl = await captureVideoFrame(localUrl) || undefined;
    } catch (err) {
        // Video thumbnail generation failed silently
    }

    // Set temporary state
    setSlides(slides.map(s => s.id === activeSlide.id ? { 
        ...s, 
        mediaUrl: localUrl,
        mediaPosterUrl: posterUrl 
    } : s));

    // Upload to Cloudinary via our server (bypasses browser CORS restrictions)
    try {
        const sizeMb = file.size / 1024 / 1024;
        const MAX_FILE_MB = 100;
        if (sizeMb > MAX_FILE_MB) {
            alert(`Video too large (${sizeMb.toFixed(1)} MB). Please upload a file <= ${MAX_FILE_MB} MB to avoid timeouts.`);
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        const uploadRes = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
        });

        if (uploadRes.ok) {
            const data = await uploadRes.json();
            if (data.secure_url) {
                // Update with permanent public URL from Cloudinary
                setSlides(currentSlides => currentSlides.map(s => s.id === activeSlide.id ? { 
                    ...s, 
                    mediaUrl: data.secure_url,
                    // Cloudinary auto-generates video thumbnails
                    mediaPosterUrl: data.resource_type === 'video' 
                        ? data.secure_url.replace(/\.[^/.]+$/, ".jpg") 
                        : undefined
                } : s));
            }
        } else {
            // Try to parse JSON error; fallback to text
            let errMsg = uploadRes.statusText;
            try {
                const errorData = await uploadRes.json();
                errMsg = errorData?.error || errMsg;
            } catch {
                const text = await uploadRes.text().catch(() => '');
                errMsg = text || errMsg;
            }
            alert(errMsg || 'Upload failed. Please try again.');
        }
    } catch (error) {
        // Upload error handled silently
    }
  };

  // Helper: Capture a video frame to a base64 image
  const captureVideoFrame = async (videoSrc: string): Promise<string | null> => {
      return new Promise((resolve) => {
        const video = document.createElement('video');
        video.crossOrigin = 'anonymous'; 
        video.src = videoSrc;
        video.muted = true;
        video.playsInline = true; // Important for iOS/mobile context if needed
        video.currentTime = 0.5; // Capture at 0.5s to avoid black start frames
        
        // Timeout to prevent hanging
        const timeout = setTimeout(() => {
            resolve(null);
            video.remove();
        }, 3000);

        video.onloadeddata = () => {
             video.currentTime = 0.5; 
        };

        video.onseeked = () => {
            clearTimeout(timeout);
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                try {
                    const dataUrl = canvas.toDataURL('image/png');
                    resolve(dataUrl);
                } catch (e) {
                    resolve(null); 
                }
            } else {
                resolve(null);
            }
            video.remove();
        };

        video.onerror = () => {
            clearTimeout(timeout);
            resolve(null);
            video.remove();
        };
      });
  };

  const handleExport = async (format: 'pdf' | 'ppt') => {
    setIsExporting(format);
    
    try {
      // Step 1: Client-side Capture
      // To ensure 100% visual fidelity (especially with local blobs, fonts, etc.),
      // we capture each slide as an image here in the browser.
      const slideImages: string[] = [];
      const slidesContainer = document.querySelector('.slides-container'); // Need to ensure we target the main renderer
      
      // We'll iterate through slides, set them as active to ensure they render, and capture
      // Note: This might be flickery, a better approach is to have a hidden "ExportRenderer"
      // or just capture the current DOM if all slides are rendered.
      // But currently, the carousel renders all slides in a flex row.
      
      // Find all slide elements currently in the DOM
      // We rely on the fact that the main carousel renders <Slide> components
      // Let's assume they are identifiable by ID or class.
      // In the current render, we map slides:
      // <div key={slide.id} className="w-[1080px] h-[1080px] ... transform origin-top-left scale-[...]" ...>
      //    <Slide ... />
      // </div>
      
      // Wait for a render cycle to ensure all images/styles are applied
      await new Promise(r => setTimeout(r, 200));

      const capturedSlides = [];
      for (let index = 0; index < slides.length; index++) {
          const slide = slides[index];
          
          // Temporarily set this slide as "downloading" to trigger any print-specific styles (like video placeholders)
          // Since React state is async, we need to wait for it to apply
          setSlideDownloadData({ ...slide, _isDownloading: true } as any);
          
          // Wait for render update
          await new Promise(r => setTimeout(r, index === 0 ? 500 : 150));
          
          if (slideDownloadRef.current) {
              try {
                 // Use JPEG with quality 0.85 instead of PNG to drastically reduce payload size (fixes 413 error)
                 const dataUrl = await toJpeg(slideDownloadRef.current, {
                    cacheBust: true,
                    width: 1080,
                    height: 1080,
                    pixelRatio: 1.5,
                    skipAutoScale: true,
                    quality: 0.85
                 });
                 capturedSlides.push({ id: slide.id, dataUrl, index });
              } catch (err) {
                  // Retry once
                  try {
                      await new Promise(r => setTimeout(r, 500));
                      const retryDataUrl = await toJpeg(slideDownloadRef.current, { width: 1080, height: 1080, quality: 0.85, cacheBust: true });
                      capturedSlides.push({ id: slide.id, dataUrl: retryDataUrl, index });
                  } catch (retryErr) {
                      // skip if fails twice
                  }
              }
          }
      }
      
      const validCaptures = capturedSlides; // They are already ordered because we looped sequentially

      // Prepare FormData
      const formData = new FormData();
      
      // Attach captured images as the slide backgrounds/content
      validCaptures.forEach((cap, i) => {
          // Convert dataURL to blob to save space in JSON and use multipart
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

      // Also attach videos if PPT export
      if (format === 'ppt') {
          await Promise.all(slides.map(async (slide, index) => {
              if (slide.mediaType === 'video' && slide.mediaUrl?.startsWith('blob:')) {
                  try {
                      const blobRes = await fetch(slide.mediaUrl);
                      const blob = await blobRes.blob();
                      formData.append(`video_${index}`, blob, 'video.mp4');
                  } catch (e) {
                      // Failed to attach video blob
                  }
              }
          }));
      }

      // Construct simplified payload
      // We only need to tell the backend: "Here are the images, put them on slides."
      // And "Here are videos, overlay them on top of these slides."
      const payloadSlides = slides.map((slide, index) => ({
          ...slide,
          // We will tell backend to use the attached image as background
          _useAttachedImage: true,
          _attachedImageKey: `slide_image_${index}`,
          
          // Flags for video
          _hasAttachedVideo: slide.mediaType === 'video' && slide.mediaUrl?.startsWith('blob:'),
          _videoAttachmentIndex: index,
          
          // Strip heavy data from JSON
          backgroundImage: undefined, // Burned into image
          mediaUrl: slide.mediaType === 'video' ? slide.mediaUrl : undefined // Keep URL if remote, strip if blob? 
                                                                             // Actually keep it, backend logic needs it to decide embed type.
                                                                             // But if blob, backend can't read it anyway.
      }));

      // Strip blob URLs from payload to avoid "string too long"
      const safePayload = payloadSlides.map(s => {
          if (s.mediaUrl?.startsWith('blob:')) return { ...s, mediaUrl: '' };
          return s;
      });

      formData.append('data', JSON.stringify({
          slides: safePayload,
          format,
          options: {
              // Options are mostly burned into images now, but keep for metadata
              title: slides[0]?.title
          },
          mode: 'client-side-images' // Flag for backend to switch logic
      }));

      const response = await fetch('/api/export', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Export failed with status ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `carouslk-export.${format === 'ppt' ? 'pptx' : 'pdf'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      setIsExportOpen(false);

    } catch (error) {
      // Export failed silently
    } finally {
      setIsExporting(null);
      setSlideDownloadData(null); // Cleanup
    }
  };

  const renderPropertiesPanelContent = () => (
    <>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Properties</h3>
        <button onClick={() => setIsPropertiesPanelOpen(false)} className="text-gray-500 hover:text-white transition">
          <X size={16} />
        </button>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-xs text-gray-400">Title</label>
          <input
            type="text"
            value={activeSlide.title || ''}
            onChange={(e) => {
              const newTitle = e.target.value;
              setSlides(slides.map(s => s.id === activeSlide.id ? { ...s, title: newTitle } : s));
            }}
            className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#ffd700] transition"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs text-gray-400">Font Size</label>
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
                setSlides(slides.map(s => s.id === activeSlide.id ? { ...s, fontScale: newScale } : s));
              }}
              className="flex-1"
              style={{ accentColor: '#ffd700' }}
            />
            <span className="text-xs text-gray-300 w-12 text-right">
              {Math.round((activeSlide.fontScale ?? 1) * 100)}%
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => adjustFontScale(-0.05)}
              className="flex-1 px-2 py-1 text-xs bg-gray-900/60 border border-gray-700 rounded-lg hover:border-gray-500 transition"
            >
              A-
            </button>
            <button
              onClick={() => adjustFontScale(0.05)}
              className="flex-1 px-2 py-1 text-xs bg-gray-900/60 border border-gray-700 rounded-lg hover:border-gray-500 transition"
            >
              A+
            </button>
          </div>
        </div>

        {activeSlide.type === 'cover' && (
          <div className="space-y-2">
            <label className="text-xs text-gray-400">Subtitle</label>
            <textarea
              value={activeSlide.subtitle || ''}
              onChange={(e) => {
                const newSubtitle = e.target.value;
                setSlides(slides.map(s => s.id === activeSlide.id ? { ...s, subtitle: newSubtitle } : s));
              }}
              className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#ffd700] transition resize-none h-24"
            />
          </div>
        )}

        {activeSlide.type === 'content' && (
          <div className="space-y-2">
            <label className="text-xs text-gray-400">Content</label>
            <div
              key={activeSlide.id}
              contentEditable
              suppressContentEditableWarning
              dangerouslySetInnerHTML={{ __html: activeSlide.content || '' }}
              onBlur={(e) => {
                const newContent = e.currentTarget.innerHTML;
                setSlides(slides.map(s => s.id === activeSlide.id ? { ...s, content: newContent } : s));
              }}
              className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#ffd700] transition min-h-[8rem] max-h-64 overflow-y-auto"
            />
            <p className="text-[10px] text-gray-500">
              Format with shortcuts: <strong>Ctrl+B</strong> bold, <em>Ctrl+I</em> italic.
            </p>
            {/* AI Content Enhancement */}
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => handleEnhanceContent('rewrite', activeSlide.content || '')}
                disabled={isEnhancingContent || !activeSlide.content}
                className="flex-1 px-3 py-1.5 text-xs bg-[#ffd700]/10 border border-[#ffd700]/30 text-[#ffd700] rounded-lg hover:bg-[#ffd700]/20 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                title="Improve clarity and flow"
              >
                {isEnhancingContent ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} />}
                Enhance
              </button>
              <button
                onClick={() => handleEnhanceContent('hook', activeSlide.content || activeSlide.title || '')}
                disabled={isEnhancingContent}
                className="px-3 py-1.5 text-xs bg-gray-800 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-700 transition disabled:opacity-50 flex items-center gap-1"
                title="Create better hook"
              >
                <Lightbulb size={12} />
              </button>
            </div>
            {enhancementResult && (
              <div className="mt-2 p-2 bg-gray-800 rounded-lg border border-gray-700">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-xs text-gray-400">Enhanced:</span>
                  <button
                    onClick={() => {
                      setSlides(slides.map(s => 
                        s.id === activeSlide.id 
                          ? { ...s, content: enhancementResult } 
                          : s
                      ));
                      setEnhancementResult(null);
                    }}
                    className="text-xs text-[#ffd700] hover:text-yellow-400"
                  >
                    Apply
                  </button>
                </div>
                <div 
                  className="text-xs text-gray-300"
                  dangerouslySetInnerHTML={{ __html: enhancementResult }}
                />
              </div>
            )}
          </div>
        )}

        <div className="space-y-2">
          <label className="text-xs text-gray-400">Slide Emoji / Icon</label>
          <div className="flex gap-2">
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
              className="flex-1 bg-gray-900/50 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#ffd700] transition"
            />
            {activeSlide.emoji && activeSlide.emoji.trim() !== '' && (
              <button
                onClick={() => setSlides(slides.map(s => s.id === activeSlide.id ? { ...s, emoji: '' } : s))}
                className="px-3 py-2 rounded-lg border border-gray-700 text-xs text-gray-300 hover:text-white hover:border-gray-500 transition"
                title="Remove emoji"
              >
                Clear
              </button>
            )}
          </div>
          <p className="text-[10px] text-gray-500">Leave empty to hide the emoji block.</p>
        </div>



        <div className="space-y-3 pt-4 border-t border-gray-700 media-section-unique">
          <label className="text-xs text-gray-400">Media / Embeds</label>
          <div className="flex bg-gray-900 rounded-lg p-1 gap-1 mb-2">
            <button
              onClick={() => setSlides(slides.map(s => s.id === activeSlide.id ? { ...s, mediaType: null, mediaUrl: undefined, embedHtml: undefined } : s))}
              className={`flex-1 px-2 py-1.5 text-xs rounded-md transition flex items-center justify-center gap-1 ${!activeSlide.mediaType ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'}`}
              title="None"
            >
              None
            </button>
            <button
              onClick={() => setSlides(slides.map(s => s.id === activeSlide.id ? { ...s, mediaType: 'image' } : s))}
              className={`flex-1 px-2 py-1.5 text-xs rounded-md transition flex items-center justify-center gap-1 ${activeSlide.mediaType === 'image' ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'}`}
              title="Image"
            >
              <ImageIcon size={14} /> Img
            </button>
            <button
              onClick={() => setSlides(slides.map(s => s.id === activeSlide.id ? { ...s, mediaType: 'video' } : s))}
              className={`flex-1 px-2 py-1.5 text-xs rounded-md transition flex items-center justify-center gap-1 ${activeSlide.mediaType === 'video' ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'}`}
              title="Video"
            >
              <Upload size={14} /> Video
            </button>
            <button
              onClick={() => setSlides(slides.map(s => s.id === activeSlide.id ? { ...s, mediaType: 'embed' } : s))}
              className={`flex-1 px-2 py-1.5 text-xs rounded-md transition flex items-center justify-center gap-1 ${activeSlide.mediaType === 'embed' ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'}`}
              title="Embed"
            >
              <MousePointer2 size={14} /> Embed
            </button>
          </div>

          {activeSlide.mediaType === 'image' && (
             <div className="space-y-2">
                <label className="text-xs text-gray-400">Image Source</label>
                {activeSlide.mediaUrl ? (
                    <div className="relative group rounded-lg overflow-hidden border border-gray-700 h-32 bg-black/40">
                        <img src={activeSlide.mediaUrl} className="w-full h-full object-contain" alt="Media Block" />
                        <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition bg-black/40 backdrop-blur-sm">
                            <label className="p-1.5 bg-gray-800 rounded-md text-white hover:bg-gray-700 border border-gray-600 cursor-pointer">
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
                    <label className="flex items-center justify-center w-full px-3 py-4 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg cursor-pointer transition group border-dashed">
                        <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={handleMediaImageUpload}
                        />
                        <div className="flex flex-col items-center gap-2 text-gray-400 group-hover:text-white">
                            <ImageIcon size={20} />
                            <span className="text-xs">Upload Image Block</span>
                        </div>
                    </label>
                )}
                {/* AI Image Generation */}
                <button
                  onClick={() => handleGenerateImage(activeSlide.id)}
                  disabled={isGeneratingImage}
                  className="w-full mt-2 px-3 py-2 text-xs bg-[#ffd700]/10 border border-[#ffd700]/30 text-[#ffd700] rounded-lg hover:bg-[#ffd700]/20 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isGeneratingImage ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} />
                      Generate Image with AI
                    </>
                  )}
                </button>
                 <label className="text-xs text-gray-400 mt-2 block">Aspect ratio</label>
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
                    className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#ffd700] transition"
                />
             </div>
          )}

          {activeSlide.mediaType === 'video' && (
            <div className="space-y-4">
              {activeSlide.mediaUrl ? (
                <div className="space-y-2">
                    <label className="text-xs text-gray-400">Current Video (links preferred; uploads ≤100MB)</label>
                    <div className="relative group rounded-lg overflow-hidden border border-gray-700 h-32 bg-black/40 flex items-center justify-center">
                        {/* Simple preview */}
                        {activeSlide.mediaUrl.startsWith('blob:') ? (
                            <video src={activeSlide.mediaUrl} className="w-full h-full object-contain" />
                        ) : (
                            <div className="text-center p-4">
                                <div className="text-red-500 mb-2 flex justify-center"><Upload size={24} /></div>
                                <div className="text-xs text-gray-400 break-all line-clamp-2">{activeSlide.mediaUrl}</div>
                            </div>
                        )}
                        
                        {/* Overlay Controls */}
                        <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition bg-black/60 backdrop-blur-sm">
                            <label className="p-1.5 bg-gray-800 rounded-md text-white hover:bg-gray-700 border border-gray-600 cursor-pointer" title="Replace Video (≤100MB recommended)">
                                <Upload size={14} />
                                <input 
                                    type="file" 
                                    accept="video/*" 
                                    className="hidden" 
                                    onChange={handleVideoUpload}
                                />
                            </label>
                            <button 
                                onClick={() => setSlides(slides.map(s => s.id === activeSlide.id ? { ...s, mediaUrl: undefined } : s))}
                                className="p-1.5 bg-red-500/20 rounded-md text-red-400 hover:bg-red-500/30 border border-red-500/50"
                                title="Remove Video"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </div>
                    {/* URL Input for editing link directly */}
                    {!activeSlide.mediaUrl.startsWith('blob:') && (
                         <input
                            type="text"
                            value={activeSlide.mediaUrl || ''}
                            onChange={(e) => {
                              const newUrl = e.target.value;
                              setSlides(slides.map(s => s.id === activeSlide.id ? { ...s, mediaUrl: newUrl } : s));
                            }}
                            placeholder="https://www.youtube.com/watch?v=..."
                            className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#ffd700] transition"
                        />
                    )}
                </div>
              ) : (
                <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <label className="text-xs text-gray-400">Preferred: paste video URL (YouTube/Vimeo/Cloudinary)</label>
                      <span className="text-[10px] text-gray-500">Fastest & most reliable</span>
                    </div>
                    <input
                        type="text"
                        value={activeSlide.mediaUrl || ''}
                        onChange={(e) => {
                        const newUrl = e.target.value;
                        setSlides(slides.map(s => s.id === activeSlide.id ? { ...s, mediaUrl: newUrl } : s));
                        }}
                        placeholder="Paste YouTube/Video URL..."
                        className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#ffd700] transition"
                    />
                    
                    <div className="flex items-center gap-2 my-2">
                        <div className="h-px bg-gray-700 flex-1"></div>
                        <span className="text-[10px] text-gray-500 uppercase">OR</span>
                        <div className="h-px bg-gray-700 flex-1"></div>
                    </div>
                    
                    <label className="flex items-center justify-center w-full px-3 py-4 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg cursor-pointer transition group border-dashed">
                        <input 
                        type="file" 
                        accept="video/*" 
                        className="hidden" 
                        onChange={handleVideoUpload}
                        />
                        <div className="flex flex-col items-center gap-2 text-gray-400 group-hover:text-white">
                            <Upload size={20} />
                            <span className="text-xs text-center leading-tight">
                              Upload video file (≤100MB).
                              <br />Larger? Use a URL.
                            </span>
                        </div>
                    </label>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs text-gray-400">Aspect ratio</label>
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
                    className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#ffd700] transition"
                />
              </div>
            </div>
          )}

          {activeSlide.mediaType === 'embed' && (
            <div className="space-y-2">
              <label className="text-xs text-gray-400">Embed HTML</label>
              <textarea
                value={activeSlide.embedHtml || ''}
                onChange={(e) => {
                  const newHtml = e.target.value;
                  setSlides(slides.map(s => s.id === activeSlide.id ? { ...s, embedHtml: newHtml } : s));
                }}
                placeholder='<iframe src="..." ></iframe>'
                className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#ffd700] transition resize-none h-28 font-mono"
              />
              <p className="text-[10px] text-gray-500">
                Paste trusted embed snippets (charts, maps, dashboards). Scripts are not executed.
              </p>
            </div>
          )}

          {activeSlide.mediaType && (
            <div className="space-y-3 pt-3 border-t border-gray-800">
              <div className="flex items-center justify-between">
                <label className="text-xs text-gray-400">Media Width</label>
                <span className="text-xs text-gray-500">
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
                  style={{ accentColor: '#ffd700' }}
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
                  className="w-16 bg-gray-900/50 border border-gray-700 rounded-lg px-2 py-1 text-sm text-white text-center focus:outline-none focus:border-[#ffd700] transition"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {[25, 40, 55, 70, 85, 100].map(preset => (
                  <button
                    key={preset}
                    onClick={() => setSlides(slides.map(s => s.id === activeSlide.id ? { ...s, mediaWidthPercent: preset } : s))}
                    className={`px-3 py-1.5 rounded-lg text-xs border transition ${
                      Math.round(activeSlide.mediaWidthPercent ?? 100) === preset
                        ? 'border-[#ffd700] text-white bg-[#ffd700]/10'
                        : 'border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white'
                    }`}
                  >
                    {preset}%
                  </button>
                ))}
              </div>

              <div className="space-y-2">
                <label className="text-xs text-gray-400">Alignment</label>
                <div className="flex gap-2">
                  {(['left', 'center', 'right'] as const).map(position => (
                    <button
                      key={position}
                      onClick={() => setSlides(slides.map(s => s.id === activeSlide.id ? { ...s, mediaAlignment: position } : s))}
                      className={`flex-1 px-3 py-2 rounded-lg text-xs uppercase tracking-wide border transition ${
                        (activeSlide.mediaAlignment || 'center') === position
                          ? 'border-[#ffd700] text-white bg-[#ffd700]/10'
                          : 'border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white'
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

        <div className="space-y-3 pt-4 border-t border-gray-700">
          <label className="text-xs text-gray-400">Background Image (Current Slide)</label>
          
          {activeSlide.backgroundImage ? (
              <div className="relative group rounded-lg overflow-hidden border border-gray-700 h-24 bg-black/40">
                  <img src={activeSlide.backgroundImage} className="w-full h-full object-cover opacity-60" alt="Background" />
                  <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition bg-black/40 backdrop-blur-sm">
                      <button 
                          onClick={() => {
                              // Trigger file input for specific slide
                              // We can reuse the main input but need to ensure activeTool is NOT 'image'
                              setActiveTool('select'); 
                              fileInputRef.current?.click();
                          }}
                          className="p-1.5 bg-gray-800 rounded-md text-white hover:bg-gray-700 border border-gray-600"
                          title="Change Image"
                      >
                          <ImageIcon size={14} />
                      </button>
                      <button 
                          onClick={() => setSlides(slides.map(s => s.id === activeSlide.id ? { ...s, backgroundImage: undefined } : s))}
                          className="p-1.5 bg-red-500/20 rounded-md text-red-400 hover:bg-red-500/30 border border-red-500/50"
                          title="Remove Image"
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
                className="w-full flex items-center justify-center gap-2 p-3 bg-gray-900/50 border border-gray-700 border-dashed rounded-lg text-gray-400 hover:text-white hover:border-gray-500 hover:bg-gray-800 transition group"
            >
                <ImageIcon size={16} className="group-hover:scale-110 transition" />
                <span className="text-xs">Upload for This Slide</span>
            </button>
          )}
          
          {activeSlide.backgroundImage && (
             <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <span className="text-[10px] text-gray-500 font-medium">SETTINGS</span>
                    <button 
                        onClick={() => {
                            const currentOpacity = activeSlide.backgroundOverlayOpacity;
                            const currentFilter = activeSlide.backgroundImageFilter;
                            
                            setSlides(slides.map(s => ({
                                ...s,
                                backgroundOverlayOpacity: currentOpacity,
                                backgroundImageFilter: currentFilter
                            })));
                            
                            // Visual feedback
                            const btn = document.getElementById('apply-all-settings-btn');
                            if (btn) {
                                const originalText = btn.innerHTML;
                                btn.innerHTML = '<span class="text-green-400">Applied!</span>';
                                setTimeout(() => {
                                    btn.innerHTML = originalText;
                                }, 1500);
                            }
                        }}
                        id="apply-all-settings-btn"
                        className="text-[10px] bg-gray-800 hover:bg-gray-700 text-gray-300 px-2 py-1 rounded border border-gray-700 transition"
                        title="Apply these image settings (opacity, filters) to ALL slides"
                    >
                        Apply to All Slides
                    </button>
                </div>
             
                <div className="space-y-1">
                   <div className="flex justify-between text-xs text-gray-500">
                       <span>Overlay Opacity</span>
                       <span>{Math.round((activeSlide.backgroundOverlayOpacity ?? 0.5) * 100)}%</span>
                   </div>
                   <input
                       type="range"
                       min={0}
                       max={0.9}
                       step={0.1}
                       value={activeSlide.backgroundOverlayOpacity ?? 0.5}
                       onChange={(e) => {
                           const val = parseFloat(e.target.value);
                           setSlides(slides.map(s => s.id === activeSlide.id ? { ...s, backgroundOverlayOpacity: val } : s));
                       }}
                       className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#ffd700]"
                   />
                </div>

                <div className="pt-2 border-t border-gray-700 mt-2 space-y-2">
                   <label className="text-xs text-gray-400">Image Filters</label>
                   <div className="grid grid-cols-2 gap-2">
                       {/* Brightness */}
                       <div className="space-y-1">
                          <label className="text-[10px] text-gray-500">Brightness</label>
                          <input
                             type="range"
                             min={0}
                             max={2}
                             step={0.1}
                             defaultValue={1}
                             onChange={(e) => {
                                 const val = e.target.value;
                                 // Simple regex to replace brightness part or append it
                                 const currentFilter = activeSlide.backgroundImageFilter || '';
                                 let newFilter = currentFilter;
                                 if (newFilter.includes('brightness')) {
                                     newFilter = newFilter.replace(/brightness\([0-9.]+\)/, `brightness(${val})`);
                                 } else {
                                     newFilter = `${newFilter} brightness(${val})`.trim();
                                 }
                                 setSlides(slides.map(s => s.id === activeSlide.id ? { ...s, backgroundImageFilter: newFilter } : s));
                             }}
                             className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#ffd700]"
                          />
                       </div>
                       
                       {/* Contrast */}
                       <div className="space-y-1">
                          <label className="text-[10px] text-gray-500">Contrast</label>
                          <input
                             type="range"
                             min={0}
                             max={2}
                             step={0.1}
                             defaultValue={1}
                             onChange={(e) => {
                                 const val = e.target.value;
                                 const currentFilter = activeSlide.backgroundImageFilter || '';
                                 let newFilter = currentFilter;
                                 if (newFilter.includes('contrast')) {
                                     newFilter = newFilter.replace(/contrast\([0-9.]+\)/, `contrast(${val})`);
                                 } else {
                                     newFilter = `${newFilter} contrast(${val})`.trim();
                                 }
                                 setSlides(slides.map(s => s.id === activeSlide.id ? { ...s, backgroundImageFilter: newFilter } : s));
                             }}
                             className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#ffd700]"
                          />
                       </div>

                        {/* Blur */}
                       <div className="space-y-1">
                          <label className="text-[10px] text-gray-500">Blur</label>
                          <input
                             type="range"
                             min={0}
                             max={10}
                             step={1}
                             defaultValue={0}
                             onChange={(e) => {
                                 const val = e.target.value;
                                 const currentFilter = activeSlide.backgroundImageFilter || '';
                                 let newFilter = currentFilter;
                                 if (newFilter.includes('blur')) {
                                     newFilter = newFilter.replace(/blur\([0-9.]+px\)/, `blur(${val}px)`);
                                 } else {
                                     newFilter = `${newFilter} blur(${val}px)`.trim();
                                 }
                                 setSlides(slides.map(s => s.id === activeSlide.id ? { ...s, backgroundImageFilter: newFilter } : s));
                             }}
                             className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#ffd700]"
                          />
                       </div>

                       {/* Grayscale */}
                       <div className="space-y-1">
                          <label className="text-[10px] text-gray-500">Grayscale</label>
                           <input
                             type="range"
                             min={0}
                             max={1}
                             step={0.1}
                             defaultValue={0}
                             onChange={(e) => {
                                 const val = e.target.value;
                                 const currentFilter = activeSlide.backgroundImageFilter || '';
                                 let newFilter = currentFilter;
                                 if (newFilter.includes('grayscale')) {
                                     newFilter = newFilter.replace(/grayscale\([0-9.]+\)/, `grayscale(${val})`);
                                 } else {
                                     newFilter = `${newFilter} grayscale(${val})`.trim();
                                 }
                                 setSlides(slides.map(s => s.id === activeSlide.id ? { ...s, backgroundImageFilter: newFilter } : s));
                             }}
                             className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#ffd700]"
                          />
                       </div>
                   </div>
                </div>
             </div>
          )}
        </div>

        <div className="space-y-3 pt-4 border-t border-gray-700">
          <label className="text-xs text-gray-400">Handle / Tag</label>
          <input
            type="text"
            value={activeSlide.handle || ''}
            onChange={(e) => {
              const newHandle = e.target.value;
              setSlides(slides.map(s => ({ ...s, handle: newHandle }))); // Update all slides
            }}
            placeholder="@yourhandle"
            className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#ffd700] transition"
          />
          <p className="text-[10px] text-gray-500">Updates across all slides</p>
        </div>

        <div className="space-y-2">
          <label className="text-xs text-gray-400">Category / Series Tag</label>
          <input
            type="text"
            value={activeSlide.category || ''}
            onChange={(e) => {
              const newCategory = e.target.value;
              setSlides(slides.map(s => ({ ...s, category: newCategory }))); // Update all slides
            }}
            placeholder="UNDER THE HOOD"
            className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#ffd700] transition"
          />
          <p className="text-[10px] text-gray-500">Updates across all slides</p>
        </div>

        <div className="pt-4 border-t border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400">Type</span>
          </div>
          <div className="flex bg-gray-900 rounded-lg p-1 gap-1">
            <button
              onClick={() => setSlides(slides.map(s => s.id === activeSlide.id ? { 
                  ...s, 
                  type: 'cover',
                  elementOrder: ['title', 'subtitle', 'media'] 
              } : s))}
              className={`flex-1 px-2 py-1.5 text-xs rounded-md transition flex items-center justify-center gap-1 ${activeSlide.type === 'cover' ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'}`}
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
              className={`flex-1 px-2 py-1.5 text-xs rounded-md transition flex items-center justify-center gap-1 ${activeSlide.type === 'content' ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'}`}
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
              className={`flex-1 px-2 py-1.5 text-xs rounded-md transition flex items-center justify-center gap-1 ${activeSlide.type === 'chart' ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'}`}
              title="Chart Slide"
            >
              <BarChart3 size={14} /> Chart
            </button>
          </div>
        </div>

        {activeSlide.type === 'chart' && (
          <div className="space-y-4 pt-4 border-t border-gray-700 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="space-y-2">
              <label className="text-xs text-gray-400">Chart Type</label>
              <div className="flex bg-gray-900 rounded-lg p-1 gap-1">
                <button
                  onClick={() => setSlides(slides.map(s => s.id === activeSlide.id ? { ...s, chartType: 'bar' } : s))}
                  className={`flex-1 p-1.5 rounded transition flex justify-center ${activeSlide.chartType === 'bar' ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                >
                  <BarChart3 size={16} />
                </button>
                <button
                  onClick={() => setSlides(slides.map(s => s.id === activeSlide.id ? { ...s, chartType: 'line' } : s))}
                  className={`flex-1 p-1.5 rounded transition flex justify-center ${activeSlide.chartType === 'line' ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                >
                  <LineChart size={16} />
                </button>
                <button
                  onClick={() => setSlides(slides.map(s => s.id === activeSlide.id ? { ...s, chartType: 'pie' } : s))}
                  className={`flex-1 p-1.5 rounded transition flex justify-center ${activeSlide.chartType === 'pie' ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                >
                  <PieChart size={16} />
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs text-gray-400">Data Points</label>
                <button
                  onClick={() => {
                    const newData = [...(activeSlide.chartData || [])];
                    newData.push({ name: 'New', value: 50 });
                    setSlides(slides.map(s => s.id === activeSlide.id ? { ...s, chartData: newData } : s));
                  }}
                  className="text-[10px] bg-gray-700 hover:bg-gray-600 text-white px-2 py-0.5 rounded"
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
                      className="w-1/3 bg-gray-900/50 border border-gray-700 rounded px-2 py-1 text-xs text-white focus:border-[#ffd700] outline-none"
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
                      className="w-1/3 bg-gray-900/50 border border-gray-700 rounded px-2 py-1 text-xs text-white focus:border-[#ffd700] outline-none"
                      placeholder="Value"
                    />
                    <button
                      onClick={() => {
                        const newData = [...(activeSlide.chartData || [])].filter((_, i) => i !== idx);
                        setSlides(slides.map(s => s.id === activeSlide.id ? { ...s, chartData: newData } : s));
                      }}
                      className="text-gray-500 hover:text-red-400"
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
    <div className="min-h-screen bg-[#0B0F19] text-white font-sans flex flex-col lg:h-screen lg:overflow-hidden overflow-x-hidden">
      <TextToolbar />
      <div
        aria-hidden="true"
        className="absolute"
        style={{ width: 1, height: 1, top: -9999, left: -9999, pointerEvents: 'none' }}
      >
        <div ref={slideDownloadRef} className="w-[1080px] h-[1080px]">
          {slideDownloadData && (
            <Slide
              {...slideDownloadData}
              isEditable={false}
            />
          )}
        </div>
      </div>
      {/* Header */}
      <header className="h-14 border-b border-gray-800 bg-[#0f1117] flex items-center px-4 justify-between shrink-0 z-20">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-gray-400 hover:text-white transition">
            <ChevronLeft size={20} />
          </Link>
          <div className="flex items-center gap-2">
             <div className="w-6 h-6 bg-[#ffd700] rounded-md rotate-3 flex items-center justify-center">
                <span className="text-black font-bold text-xs">C</span>
             </div>
             <span className="font-bold tracking-tight text-sm sm:text-base whitespace-nowrap">
                <span className="hidden sm:inline">Carouslk / </span>{projectName}
             </span>
          </div>
          <div className="hidden lg:flex items-center gap-1 border-l border-gray-800 pl-4 ml-4">
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
              className="p-2 hover:bg-gray-800 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition"
              title="Undo (Ctrl+Z)"
            >
              <Undo2 size={18} className="text-gray-400" />
            </button>
            <button
              onClick={handleRedo}
              disabled={!canRedo}
              className="p-2 hover:bg-gray-800 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition"
              title="Redo (Ctrl+Y)"
            >
              <Redo2 size={18} className="text-gray-400" />
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
             <button
                onClick={() => setIsMobileSidebarOpen(true)}
                className="p-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition flex items-center justify-center lg:hidden"
             >
                <Menu size={24} />
             </button>
             <button 
                onClick={() => setIsPropertiesPanelOpen(!isPropertiesPanelOpen)}
                className={`hidden lg:flex p-2 rounded-lg transition ${isPropertiesPanelOpen ? 'text-[#ffd700] bg-[#ffd700]/10' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
                title="Toggle Properties Panel"
             >
                <PanelRight size={20} />
             </button>
             <div className="hidden lg:block w-px h-6 bg-gray-800 mx-1"></div>
             <button 
                onClick={() => setIsAiModalOpen(true)}
                className="hidden lg:flex px-3 py-1.5 text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition items-center gap-2"
             >
                <Sparkles size={16} /> AI Generate
             </button>
             <button 
                onClick={() => setIsAiFeaturesOpen(true)}
                className="hidden lg:flex px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold rounded-lg transition items-center gap-2"
                title="AI Features"
             >
                <Sparkles size={16} />
                AI Tools
             </button>
             <button 
                onClick={() => setIsExportOpen(true)}
                className="hidden lg:flex px-4 py-1.5 bg-[#ffd700] hover:bg-yellow-400 text-black text-sm font-bold rounded-lg transition items-center gap-2"
             >
                Export <Download size={16} />
             </button>
             {session?.user?.email && (
               <span className="hidden lg:block text-sm text-gray-400 px-3">{session.user.email}</span>
             )}
             <Link
               href="/dashboard/billing"
               className="p-2 hover:bg-gray-800 rounded-lg transition"
               title="Billing & Subscription"
             >
               <CreditCard size={18} className="text-gray-400" />
             </Link>
             <button
               onClick={() => signOut({ callbackUrl: '/login' })}
               className="p-2 hover:bg-gray-800 rounded-lg transition"
               title="Sign out"
             >
               <LogOut size={18} className="text-gray-400" />
             </button>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Navigation */}
        <div className="hidden md:flex w-16 border-r border-gray-800 flex-col items-center py-6 gap-6 bg-[#0f1117] shrink-0 z-10">
            <button 
                onClick={() => setIsTemplatesOpen(true)}
                className="w-10 h-10 bg-[#ffd700]/10 text-[#ffd700] rounded-xl flex items-center justify-center border border-[#ffd700]/20 shadow-[0_0_15px_rgba(255,215,0,0.1)] cursor-pointer hover:bg-[#ffd700]/20 transition"
                title="Templates"
            >
                <Layout size={20} />
            </button>
            <button 
                onClick={() => setIsAiModalOpen(true)}
                className="w-10 h-10 text-gray-500 hover:text-gray-300 hover:bg-gray-800 rounded-xl flex items-center justify-center transition cursor-pointer"
                title="AI Generate"
            >
                <Sparkles size={20} />
            </button>
            <button 
                onClick={() => setIsSettingsOpen(true)}
                className="w-10 h-10 text-gray-500 hover:text-gray-300 hover:bg-gray-800 rounded-xl flex items-center justify-center transition cursor-pointer"
                title="Theme"
            >
                <Palette size={20} />
            </button>
            <button 
                onClick={() => setIsSettingsOpen(true)}
                className="mt-auto w-10 h-10 text-gray-500 hover:text-gray-300 hover:bg-gray-800 rounded-xl flex items-center justify-center transition cursor-pointer"
                title="Settings"
            >
                <Settings size={20} />
            </button>
        </div>

        {/* Slide List */}
        <div className="hidden lg:flex w-72 border-r border-gray-800 bg-[#0f1117] flex-col shrink-0">
            <div className="p-4 border-b border-gray-800 flex justify-between items-center">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Slides ({slides.length})</span>
                <button 
                    onClick={addNewSlide}
                    className="w-6 h-6 bg-gray-800 hover:bg-gray-700 rounded flex items-center justify-center text-gray-400 hover:text-white transition"
                >
                    <Plus size={14} />
                </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {slides.map((slide, index) => (
                    <div 
                        key={slide.id} 
                        ref={(el) => { sidebarSlideRefs.current[slide.id] = el; }}
                        onClick={() => setActiveSlideId(slide.id)}
                        className={`group cursor-pointer rounded-xl transition-all duration-200 border ${activeSlideId === slide.id ? 'bg-gray-800/50 border-[#ffd700]/50 shadow-lg' : 'border-transparent hover:bg-gray-800/30 hover:border-gray-700'}`}
                    >
                        <div className="p-3">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-xs font-medium text-gray-400">Slide {index + 1}</span>
                                {activeSlideId === slide.id && <div className="w-1.5 h-1.5 bg-[#ffd700] rounded-full shadow-[0_0_5px_#ffd700]"></div>}
                            </div>
                            {/* Mini Preview */}
                            <div className="aspect-[4/5] bg-gray-900 rounded-lg border border-gray-700/50 relative overflow-hidden group-hover:border-gray-600 transition flex items-center justify-center">
                                <div className="transform scale-[0.15] origin-center pointer-events-none">
                                    <Slide {...slide} />
                                </div>
                            </div>
                            <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                                <span className="uppercase tracking-wide text-[10px]">{slide.type}</span>
                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDownloadSlideImage(slide, index);
                                        }}
                                        className="p-1.5 rounded-md border border-gray-700 text-gray-300 hover:text-white hover:border-gray-500 transition disabled:opacity-40"
                                        title="Download slide as PNG"
                                        disabled={downloadingSlideId !== null && downloadingSlideId !== slide.id}
                                    >
                                        {downloadingSlideId === slide.id ? (
                                            <Loader2 size={14} className="animate-spin" />
                                        ) : (
                                            <Download size={14} />
                                        )}
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteSlide(slide.id);
                                        }}
                                        className="p-1.5 rounded-md border border-gray-700 text-gray-300 hover:text-red-300 hover:border-red-500 transition disabled:opacity-40"
                                        title={slides.length === 1 ? 'You need at least one slide' : 'Delete slide'}
                                        disabled={slides.length === 1}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* Canvas Area */}
        <div 
            className="flex-1 relative bg-[#0B0F19] flex flex-col overflow-hidden"
        >
            {/* Grid Background */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
                    style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
            </div>

            {/* Toolbar */}
            <div className="hidden lg:flex absolute top-6 left-1/2 -translate-x-1/2 bg-gray-800/90 backdrop-blur-md border border-gray-700/50 p-1.5 rounded-full items-center gap-1 shadow-2xl z-20">
                <div 
                    onClick={() => handleToolClick('color')}
                    className={`w-9 h-9 flex items-center justify-center rounded-full cursor-pointer shadow-lg transition relative overflow-hidden ${activeTool === 'color' ? 'ring-2 ring-[#ffd700]' : 'hover:ring-2 hover:ring-gray-500'}`}
                    title="Change Background Color for All Slides"
                    style={{ backgroundColor: slides[0]?.backgroundColor || '#0B0F19' }}
                >
                    <div className="absolute inset-0 bg-black/20" />
                    <Palette size={16} className="relative z-10 text-white drop-shadow-md" />
                </div>
                <div 
                    onClick={() => handleToolClick('text')}
                    className={`w-9 h-9 flex items-center justify-center rounded-full cursor-pointer transition ${activeTool === 'text' ? 'bg-[#ffd700] text-black' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}
                    title="Add Text Block"
                >
                    <Type size={16} />
                </div>
                <div 
                    onClick={() => handleToolClick('image')}
                    className={`w-9 h-9 flex items-center justify-center rounded-full cursor-pointer transition ${activeTool === 'image' ? 'bg-[#ffd700] text-black' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}
                    title="Set Background Image (Current Slide)"
                >
                    <ImageIcon size={16} />
                </div>
                <div 
                    onClick={() => handleToolClick('image-all')}
                    className={`w-9 h-9 flex items-center justify-center rounded-full cursor-pointer transition ${activeTool === 'image-all' ? 'bg-[#ffd700] text-black' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}
                    title="Set Background Image (All Slides)"
                >
                    <div className="relative">
                        <ImageIcon size={16} />
                        <div className="absolute -bottom-1.5 -right-2 text-[6px] font-bold bg-blue-500 text-white px-0.5 rounded">ALL</div>
                    </div>
                </div>
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleImageUpload}
                />
                <input 
                    type="color" 
                    ref={colorInputRef} 
                    className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-0 h-0 opacity-0"
                    value={slides[0]?.backgroundColor || '#0B0F19'}
                    onChange={handleBackgroundColorChange}
                />
            </div>

            {/* Main Viewport */}
            <div className="flex-1 overflow-hidden px-0 lg:px-4 pb-0 lg:pb-8">
                <div
                    ref={slidesScrollRef}
                    className="relative z-10 h-full overflow-y-auto lg:snap-y lg:snap-mandatory scroll-smooth space-y-4 lg:space-y-16 pt-4 lg:pt-28 pb-24 lg:pb-32 no-scrollbar"
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
                                        slide.id === activeSlideId ? 'ring-[#ffd700]/70' : ''
                                    }`}
                                >
                                    <div className="w-[1080px] h-[1080px] bg-white relative overflow-hidden">
                                        <Slide
                                            {...slide}
                                            isEditable={slide.id === activeSlideId}
                                            scale={currentScale}
                                            onUpdate={(field, value) => {
                                                setSlides((prev) =>
                                                    prev.map((s) =>
                                                        s.id === slide.id ? { ...s, [field]: value } : s
                                                    )
                                                );
                                            }}
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
                                        className="lg:hidden absolute top-4 right-4 z-50 bg-[#ffd700] text-black p-3 rounded-full shadow-xl animate-in fade-in zoom-in duration-300 hover:bg-yellow-400 active:scale-90 transition-all border-2 border-black/10"
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
                    className="w-12 h-12 rounded-2xl border border-gray-800 bg-gray-900/60 flex items-center justify-center text-gray-200 transition disabled:opacity-30 disabled:cursor-not-allowed"
                    aria-label="Previous slide"
                >
                    <ChevronLeft size={20} />
                </button>
                
                <div className="flex-1 flex gap-2">
                    <button
                        onClick={() => setIsMobileSlidesOpen(true)}
                        className="flex-1 px-2 py-3 rounded-2xl border border-gray-800 bg-gray-900/80 text-sm font-medium text-gray-200 flex flex-col items-center justify-center gap-1 shadow-lg"
                    >
                        <span className="text-[10px] uppercase tracking-wider text-gray-500">Slides</span>
                        <span className="text-sm font-semibold text-white">#{activeSlideIndex + 1} / {slides.length}</span>
                    </button>
                    <button
                        onClick={() => setIsPropertiesPanelOpen(true)}
                        className="flex-1 px-2 py-3 rounded-2xl border border-gray-800 bg-gray-900/80 text-sm font-medium text-gray-200 flex flex-col items-center justify-center gap-1 shadow-lg active:bg-gray-800"
                    >
                        <span className="text-[10px] uppercase tracking-wider text-gray-500">Edit</span>
                        <Settings size={18} className="text-white" />
                    </button>
                </div>

                <button
                    onClick={() => goToSlideByIndex(activeSlideIndex + 1)}
                    disabled={activeSlideIndex >= slides.length - 1}
                    className="w-12 h-12 rounded-2xl border border-gray-800 bg-gray-900/60 flex items-center justify-center text-gray-200 transition disabled:opacity-30 disabled:cursor-not-allowed"
                    aria-label="Next slide"
                >
                    <ChevronLeft size={20} className="rotate-180" />
                </button>
            </div>
            
            {/* Properties Panel */}
            {isPropertiesPanelOpen && (
                <>
                    <div className="pointer-events-none absolute top-0 right-6 hidden xl:block z-30">
                        <div className="pointer-events-auto mt-6 w-[26rem] bg-gray-800/70 backdrop-blur-md border border-gray-700/50 rounded-2xl p-6 shadow-2xl max-h-[80vh] overflow-y-auto hide-scrollbar animate-in fade-in duration-200">
                            {renderPropertiesPanelContent()}
                        </div>
                    </div>
                    <div className="fixed inset-0 z-40 flex xl:hidden">
                        <button
                            className="absolute inset-0 bg-black/70"
                            onClick={() => setIsPropertiesPanelOpen(false)}
                        />
                        <div className="relative z-10 w-full max-w-md ml-auto h-full bg-[#0f1117] border-l border-gray-800 rounded-l-3xl p-6 overflow-y-auto hide-scrollbar shadow-2xl animate-in slide-in-from-right duration-300">
                            {renderPropertiesPanelContent()}
                        </div>
                    </div>
                </>
            )}

        </div>
      </div>
      
      {/* Export Modal */}
      {isExportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-[#0f1117] border border-gray-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-800 flex justify-between items-center">
              <h3 className="font-bold text-white text-lg">Export Carousel</h3>
              <button 
                onClick={() => setIsExportOpen(false)}
                className="text-gray-400 hover:text-white transition"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <p className="text-gray-400 text-sm">Choose your preferred format:</p>
              
              <button
                onClick={() => handleExport('pdf')}
                disabled={!!isExporting}
                className="w-full flex items-center justify-between p-4 bg-gray-900/50 hover:bg-gray-800 border border-gray-700 hover:border-gray-600 rounded-xl transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center text-red-500 group-hover:scale-110 transition">
                    <Download size={20} />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-white">Export as PDF</div>
                    <div className="text-xs text-gray-500">Best for LinkedIn & Printing</div>
                  </div>
                </div>
                {isExporting === 'pdf' ? <Loader2 size={18} className="animate-spin text-gray-500" /> : <ChevronLeft size={18} className="rotate-180 text-gray-500 group-hover:translate-x-1 transition" />}
              </button>

              <button
                onClick={() => handleExport('ppt')}
                disabled={!!isExporting}
                className="w-full flex items-center justify-between p-4 bg-gray-900/50 hover:bg-gray-800 border border-gray-700 hover:border-gray-600 rounded-xl transition group"
              >
                 <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center text-orange-500 group-hover:scale-110 transition">
                    <Layout size={20} />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-white">Export as PowerPoint</div>
                    <div className="text-xs text-gray-500">Editable PPTX Slides</div>
                  </div>
                </div>
                {isExporting === 'ppt' ? <Loader2 size={18} className="animate-spin text-gray-500" /> : <ChevronLeft size={18} className="rotate-180 text-gray-500 group-hover:translate-x-1 transition" />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-4xl bg-[#0f1117] border border-gray-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 my-8">
            <div className="p-6 border-b border-gray-800 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Settings size={20} className="text-gray-400" />
                <h3 className="font-bold text-white text-lg">General Settings</h3>
              </div>
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="text-gray-400 hover:text-white transition"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[70vh] overflow-y-auto">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400">Project Name</label>
                <input 
                  type="text" 
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#ffd700] transition"
                  placeholder="Untitled Project"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400">Author Handle</label>
                <input 
                  type="text" 
                  value={brandSettings.handle}
                  onChange={(e) => setBrandSettings({ ...brandSettings, handle: e.target.value })}
                  className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#ffd700] transition"
                  placeholder="@handle"
                />
                <p className="text-xs text-gray-500">Applies to all slides and persists across sessions</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400">Category / Series</label>
                <input 
                  type="text" 
                  value={brandSettings.category}
                  onChange={(e) => setBrandSettings({ ...brandSettings, category: e.target.value })}
                  className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#ffd700] transition"
                  placeholder="Category"
                />
                <p className="text-xs text-gray-500">Applies to all slides and persists across sessions</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400">Brand Logo</label>
                <div className="space-y-3">
                  {brandSettings.logoUrl ? (
                    <div className="relative">
                      <div className="w-full h-32 bg-gray-900/50 border border-gray-700 rounded-lg flex items-center justify-center overflow-hidden">
                        <img 
                          src={brandSettings.logoUrl} 
                          alt="Brand Logo" 
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>
                      <button
                        onClick={handleLogoDelete}
                        disabled={isSavingBrandSettings}
                        className="mt-2 w-full px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/50 text-red-500 font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        <Trash2 size={16} />
                        Delete Logo
                      </button>
                    </div>
                  ) : (
                    <div className="w-full">
                      <input
                        ref={logoUploadInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                      <button
                        onClick={() => logoUploadInputRef.current?.click()}
                        disabled={isUploadingLogo}
                        className="w-full px-4 py-3 bg-gray-900/50 hover:bg-gray-800 border border-gray-700 hover:border-gray-600 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {isUploadingLogo ? (
                          <>
                            <Loader2 size={16} className="animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload size={16} />
                            Upload Logo
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500">Upload your brand logo (max 10MB). Applies to all slides and persists across sessions.</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400">Font Family</label>
                <div className="grid grid-cols-2 gap-2">
                    {[
                        { name: 'Inter', value: 'var(--font-inter)' },
                        { name: 'Playfair', value: 'var(--font-playfair)' },
                        { name: 'Oswald', value: 'var(--font-oswald)' },
                        { name: 'Roboto Mono', value: 'var(--font-roboto-mono)' }
                    ].map(font => (
                        <button
                            key={font.name}
                            onClick={() => setBrandSettings({ ...brandSettings, fontFamily: font.value })}
                            className={`px-3 py-2 rounded-lg text-sm border transition ${brandSettings.fontFamily === font.value ? 'border-[#ffd700] bg-[#ffd700]/10 text-[#ffd700]' : 'border-gray-700 hover:border-gray-500 text-gray-300'}`}
                            style={{ fontFamily: font.value }}
                        >
                            {font.name}
                        </button>
                    ))}
                </div>
              </div>

              <div className="space-y-4">
                   <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-400">Colors</label>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs text-gray-500">Background</label>
                                <div className="flex items-center gap-2">
                                    <div className="relative w-full h-8">
                                        <input 
                                            type="color"
                                            value={brandSettings.backgroundColor}
                                            onChange={(e) => setBrandSettings({ ...brandSettings, backgroundColor: e.target.value })}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        />
                                        <div 
                                            className="w-full h-full rounded-lg border border-gray-700 flex items-center justify-center"
                                            style={{ backgroundColor: brandSettings.backgroundColor }}
                                        >
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-gray-500">Text</label>
                                <div className="flex items-center gap-2">
                                    <div className="relative w-full h-8">
                                        <input 
                                            type="color"
                                            value={brandSettings.textColor}
                                            onChange={(e) => setBrandSettings({ ...brandSettings, textColor: e.target.value })}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        />
                                        <div 
                                            className="w-full h-full rounded-lg border border-gray-700 flex items-center justify-center"
                                            style={{ backgroundColor: brandSettings.textColor }}
                                        >
                                            <span className="text-xs font-bold mix-blend-difference text-white">Aa</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                             <div className="space-y-1">
                                <label className="text-xs text-gray-500">Accent</label>
                                <div className="flex items-center gap-2">
                                    <div className="relative w-full h-8">
                                        <input 
                                            type="color"
                                            value={brandSettings.accentColor}
                                            onChange={(e) => setBrandSettings({ ...brandSettings, accentColor: e.target.value })}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        />
                                        <div 
                                            className="w-full h-full rounded-lg border border-gray-700 flex items-center justify-center"
                                            style={{ backgroundColor: brandSettings.accentColor }}
                                        >
                                            <Palette size={14} className="text-black mix-blend-difference" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                   </div>

                   <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-400">Accent Presets</label>
                    <div className="flex gap-2 items-center">
                    {['#ffd700', '#ff4d4d', '#4dff4d', '#4da6ff', '#ff4dff'].map(color => (
                        <button
                            key={color}
                            onClick={() => setBrandSettings({ ...brandSettings, accentColor: color })}
                            className={`w-8 h-8 rounded-full border-2 transition ${brandSettings.accentColor === color ? 'border-white scale-110' : 'border-transparent hover:scale-105'}`}
                            style={{ backgroundColor: color }}
                        />
                    ))}
                </div>
                <p className="text-xs text-gray-500">Applies to all slides and persists across sessions</p>
              </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-800 flex justify-between items-center">
              <button
                onClick={resetBrandSettings}
                disabled={isSavingBrandSettings}
                className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <X size={16} />
                Reset to Defaults
              </button>
              <div className="flex gap-3">
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="px-6 py-2.5 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    await saveBrandSettings();
                    setIsSettingsOpen(false);
                  }}
                  disabled={isSavingBrandSettings}
                  className="px-6 py-2.5 bg-[#ffd700] hover:bg-yellow-400 text-black font-bold rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSavingBrandSettings ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Features Modal */}
      {isAiFeaturesOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-4xl bg-[#0f1117] border border-gray-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 my-8">
            <div className="p-6 border-b border-gray-800 flex justify-between items-center">
              <div className="flex items-center gap-2 text-purple-400">
                <Sparkles size={24} />
                <h3 className="font-bold text-white text-xl">AI Features</h3>
              </div>
              <button 
                onClick={() => setIsAiFeaturesOpen(false)}
                className="text-gray-400 hover:text-white transition"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto">
              {/* Research Agent */}
              <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Search size={18} className="text-purple-400" />
                  <h4 className="font-semibold text-white">Research Agent</h4>
                </div>
                <p className="text-xs text-gray-400">Research any topic and get comprehensive insights</p>
                <input
                  type="text"
                  value={researchTopic}
                  onChange={(e) => setResearchTopic(e.target.value)}
                  placeholder="Enter topic to research..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500 transition"
                />
                <button
                  onClick={handleResearch}
                  disabled={isResearching || !researchTopic.trim()}
                  className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isResearching ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Researching...
                    </>
                  ) : (
                    <>
                      <Search size={16} />
                      Research
                    </>
                  )}
                </button>
                {researchResult && (
                  <div className="mt-3 p-3 bg-gray-800 rounded-lg border border-gray-700">
                    <p className="text-xs text-green-400 mb-2">✓ Research completed</p>
                    <button
                      onClick={() => {
                        setActiveAiToolResult({
                          tool: 'research',
                          data: researchResult,
                          query: researchTopic
                        });
                        setIsAiFeaturesOpen(false);
                      }}
                      className="text-xs text-purple-400 hover:text-purple-300 underline"
                    >
                      View full results →
                    </button>
                  </div>
                )}
              </div>

              {/* Design Suggestions */}
              <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Lightbulb size={18} className="text-yellow-400" />
                  <h4 className="font-semibold text-white">Design Suggestions</h4>
                </div>
                <p className="text-xs text-gray-400">Get AI-powered design recommendations</p>
                <button
                  onClick={handleGetDesignSuggestions}
                  disabled={isAnalyzingDesign}
                  className="w-full px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isAnalyzingDesign ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Lightbulb size={16} />
                      Get Suggestions
                    </>
                  )}
                </button>
                {designSuggestions && (
                  <div className="mt-3 p-3 bg-gray-800 rounded-lg border border-gray-700">
                    <p className="text-xs text-green-400 mb-2">✓ Analysis completed</p>
                    <button
                      onClick={() => {
                        setActiveAiToolResult({
                          tool: 'design',
                          data: designSuggestions,
                          query: 'Design Analysis'
                        });
                        setIsAiFeaturesOpen(false);
                      }}
                      className="text-xs text-yellow-400 hover:text-yellow-300 underline"
                    >
                      View full results →
                    </button>
                  </div>
                )}
              </div>

              {/* Performance Prediction */}
              <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <TrendingUp size={18} className="text-green-400" />
                  <h4 className="font-semibold text-white">Performance Prediction</h4>
                </div>
                <p className="text-xs text-gray-400">Predict how your carousel will perform</p>
                <button
                  onClick={handlePredictPerformance}
                  disabled={isPredictingPerformance || slides.length === 0}
                  className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isPredictingPerformance ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <TrendingUp size={16} />
                      Predict Performance
                    </>
                  )}
                </button>
                {performancePrediction && (
                  <div className="mt-3 p-3 bg-gray-800 rounded-lg border border-gray-700">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs text-green-400">✓ Prediction completed</p>
                      <span className="text-sm font-bold text-green-400">{performancePrediction.engagementScore}/100</span>
                    </div>
                    <button
                      onClick={() => {
                        setActiveAiToolResult({
                          tool: 'performance',
                          data: performancePrediction,
                          query: 'Performance Analysis'
                        });
                        setIsAiFeaturesOpen(false);
                      }}
                      className="text-xs text-green-400 hover:text-green-300 underline"
                    >
                      View full results →
                    </button>
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Wand2 size={18} className="text-blue-400" />
                  <h4 className="font-semibold text-white">Quick Actions</h4>
                </div>
                <p className="text-xs text-gray-400">AI-powered content improvements</p>
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      const content = activeSlide.content || activeSlide.title || '';
                      if (content) handleEnhanceContent('seo', content);
                    }}
                    disabled={isEnhancingContent || !activeSlide.content}
                    className="w-full px-3 py-2 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Wand2 size={14} />
                    Optimize for SEO
                  </button>
                  <button
                    onClick={() => {
                      const content = activeSlide.content || activeSlide.title || '';
                      if (content) handleEnhanceContent('tone', content);
                    }}
                    disabled={isEnhancingContent || !activeSlide.content}
                    className="w-full px-3 py-2 text-xs bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    Adjust Tone
                  </button>
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-800 flex justify-end">
              <button
                onClick={() => setIsAiFeaturesOpen(false)}
                className="px-6 py-2.5 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-xl transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Slides Drawer */}
      {isMobileSlidesOpen && (
        <div className="fixed inset-0 z-50 flex items-end lg:hidden">
          <button
            className="absolute inset-0 bg-black/70"
            onClick={() => setIsMobileSlidesOpen(false)}
          />
          <div className="relative z-10 w-full bg-[#0f1117] border-t border-gray-800 rounded-t-3xl p-4 max-h-[80vh]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-gray-400">
                <Layout size={18} />
                <span className="text-sm font-bold uppercase tracking-wider">Slides ({slides.length})</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={addNewSlide}
                  className="w-8 h-8 bg-gray-800 hover:bg-gray-700 rounded-full flex items-center justify-center text-gray-300 transition"
                >
                  <Plus size={16} />
                </button>
                <button
                  onClick={() => setIsMobileSlidesOpen(false)}
                  className="w-8 h-8 bg-gray-800 hover:bg-gray-700 rounded-full flex items-center justify-center text-gray-300 transition"
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
                  className={`group cursor-pointer rounded-xl transition-all duration-200 border ${activeSlideId === slide.id ? 'bg-gray-800/60 border-[#ffd700]/50 shadow-lg' : 'border-transparent hover:bg-gray-800/40 hover:border-gray-700'}`}
                >
                  <div className="p-3 flex items-center gap-3">
                    <div className="text-xs font-medium text-gray-400 w-12">#{index + 1}</div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-white truncate">{slide.title}</div>
                      <div className="text-xs text-gray-500">{slide.type === 'cover' ? 'Cover slide' : 'Content slide'}</div>
                    </div>
                    <div className="w-16 h-16 bg-gray-900 rounded-lg border border-gray-700/50 overflow-hidden flex items-center justify-center">
                      <div className="transform scale-[0.12] origin-center pointer-events-none">
                        <Slide {...slide} />
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownloadSlideImage(slide, index);
                        }}
                        className="px-3 py-1 rounded-lg border border-gray-700 text-gray-200 text-xs hover:text-white hover:border-gray-500 transition disabled:opacity-40"
                        disabled={downloadingSlideId !== null && downloadingSlideId !== slide.id}
                      >
                        {downloadingSlideId === slide.id ? 'Downloading…' : 'Download'}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSlide(slide.id);
                        }}
                        className="px-3 py-1 rounded-lg border border-gray-700 text-red-300 text-xs hover:border-red-500 transition disabled:opacity-40"
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
          <div className="relative z-10 w-64 bg-[#0f1117] border-r border-gray-800 h-full p-5 flex flex-col gap-4 shadow-2xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Tools
              </span>
              <button
                onClick={() => setIsMobileSidebarOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-gray-300 transition"
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
                  className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl bg-gray-800 border border-gray-700 hover:bg-gray-700 transition"
                >
                    <Type size={20} className="text-[#ffd700]" />
                    <span className="text-[10px] font-medium text-gray-400">Text</span>
                </button>
                <button
                  onClick={() => {
                    handleToolClick('image');
                    setIsMobileSidebarOpen(false);
                  }}
                  className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl bg-gray-800 border border-gray-700 hover:bg-gray-700 transition"
                >
                    <ImageIcon size={20} className="text-blue-400" />
                    <span className="text-[10px] font-medium text-gray-400">Image</span>
                </button>
                 <button
                  onClick={() => {
                    handleToolClick('image-all');
                    setIsMobileSidebarOpen(false);
                  }}
                  className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl bg-gray-800 border border-gray-700 hover:bg-gray-700 transition"
                >
                    <div className="relative">
                        <ImageIcon size={20} className="text-purple-400" />
                        <div className="absolute -bottom-1 -right-2 text-[8px] font-bold bg-purple-500 text-white px-1 rounded">ALL</div>
                    </div>
                    <span className="text-[10px] font-medium text-gray-400">All</span>
                </button>
                <button
                  onClick={() => {
                    handleToolClick('color');
                    setIsMobileSidebarOpen(false);
                  }}
                  className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl bg-gray-800 border border-gray-700 hover:bg-gray-700 transition"
                >
                    <Palette size={20} className="text-pink-400" />
                    <span className="text-[10px] font-medium text-gray-400">Color</span>
                </button>
            </div>

            <button
              onClick={() => {
                setIsExportOpen(true);
                setIsMobileSidebarOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-[#ffd700] text-black font-bold border border-[#ffd700] hover:bg-yellow-400 transition mb-2"
            >
              <Download size={18} />
              Export Carousel
            </button>
            <button
              onClick={() => {
                setIsTemplatesOpen(true);
                setIsMobileSidebarOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-gray-800 text-gray-200 border border-gray-700 hover:border-gray-600 transition"
            >
              <Layout size={18} />
              Templates
            </button>
            <button
              onClick={() => {
                setIsAiModalOpen(true);
                setIsMobileSidebarOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-gray-800 text-gray-200 border border-gray-700 hover:border-gray-600 transition"
            >
              <Sparkles size={18} />
              AI Generate
            </button>
            <button
              onClick={() => {
                setIsSettingsOpen(true);
                setIsMobileSidebarOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-gray-800 text-gray-200 border border-gray-700 hover:border-gray-600 transition"
            >
              <Palette size={18} />
              Theme & Settings
            </button>
            <button
              onClick={() => {
                setIsMobileSlidesOpen(true);
                setIsMobileSidebarOpen(false);
              }}
              className="mt-auto px-4 py-3 rounded-2xl bg-gray-900 text-white border border-gray-700 hover:bg-gray-800 transition flex items-center justify-between"
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

      {/* Templates Modal */}
      {isTemplatesOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-6xl bg-[#0f1117] border border-gray-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col h-[70vh]">
            <div className="p-6 border-b border-gray-800 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <Layout size={20} className="text-[#ffd700]" />
                <h3 className="font-bold text-white text-lg">Theme Gallery</h3>
              </div>
              <button 
                onClick={() => setIsTemplatesOpen(false)}
                className="text-gray-400 hover:text-white transition"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-10">
                {['Professional', 'Bold', 'Minimalist', 'Dark Mode'].map((category) => (
                    <div key={category}>
                        <h4 className="text-white font-bold text-xl mb-4 flex items-center gap-2">
                            <span className="w-1 h-6 bg-[#ffd700] rounded-full"></span>
                            {category}
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {THEMES.filter(t => t.category === category).map((theme) => (
                                <div 
                                    key={theme.id}
                                    onClick={() => {
                                        // Apply theme to all slides
                                        setSlides(slides.map(s => {
                                            const updatedSlide = {
                                                ...s,
                                                backgroundColor: theme.backgroundColor,
                                                textColor: theme.textColor,
                                                accentColor: theme.accentColor,
                                                fontFamily: theme.fontFamily
                                            };
                                            
                                            // Only update category if the theme specifically defines one
                                            if (theme.defaultCategory) {
                                                updatedSlide.category = theme.defaultCategory;
                                            }
                                            
                                            return updatedSlide;
                                        }));
                                        setIsTemplatesOpen(false);
                                    }}
                                    className="group cursor-pointer relative bg-gray-900 rounded-xl overflow-hidden border border-gray-800 hover:border-[#ffd700] transition-all hover:shadow-xl hover:scale-[1.02]"
                                >
                                    <div className="aspect-[4/3] p-4 flex flex-col justify-center items-center gap-2" style={{ backgroundColor: theme.backgroundColor }}>
                                        <div className="text-center space-y-1">
                                            <div className="text-xl font-bold" style={{ color: theme.textColor, fontFamily: theme.fontFamily }}>
                                                Title
                                            </div>
                                            <div className="text-xs opacity-80" style={{ color: theme.textColor, fontFamily: theme.fontFamily }}>
                                                Subtitle <span style={{ color: theme.accentColor, fontWeight: 'bold' }}>Accent</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-3 bg-gray-900 border-t border-gray-800 flex justify-between items-center">
                                        <span className="text-sm font-medium text-gray-300">{theme.name}</span>
                                        <span className="text-xs text-[#ffd700] opacity-0 group-hover:opacity-100 transition">Apply</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* AI Modal */}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-[#0f1117] border border-gray-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-800 flex justify-between items-center">
              <div className="flex items-center gap-2 text-[#ffd700]">
                <Sparkles size={20} />
                <h3 className="font-bold text-white text-lg">Generate with AI</h3>
              </div>
              <button 
                onClick={() => setIsAiModalOpen(false)}
                className="text-gray-400 hover:text-white transition"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  What&apos;s your carousel about?
                </label>
                <textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="e.g., 5 tips for better sleep, How to learn React in 2024..."
                  className="w-full h-32 bg-gray-900/50 border border-gray-700 rounded-xl p-4 text-white placeholder-gray-600 focus:outline-none focus:border-[#ffd700] focus:ring-1 focus:ring-[#ffd700] resize-none transition"
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-400">
                  Attach a document (optional)
                </label>
                <input
                  ref={docUploadInputRef}
                  type="file"
                  accept=".md,.markdown,.docx,.txt"
                  className="hidden"
                  onChange={handleDocUpload}
                />
                {docAttachment ? (
                  <div className="bg-gray-900/60 border border-gray-700 rounded-xl p-4 space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 text-white font-semibold">
                          <FileText size={16} className="text-[#ffd700]" />
                          <span className="break-all">{docAttachment.name}</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          {docAttachment.wordCount ?? '—'} words
                          {docAttachment.truncated ? ' • trimmed to first 20k characters' : ''}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={clearDocAttachment}
                        className="text-gray-400 hover:text-red-400 transition"
                        title="Remove attachment"
                      >
                        <Trash size={16} />
                      </button>
                    </div>
                    {docAttachment.sections && docAttachment.sections.length > 0 && (
                      <div className="text-xs text-gray-400 space-y-1 max-h-28 overflow-y-auto">
                        <p className="font-semibold text-gray-300">Detected Sections</p>
                        <ul className="list-disc pl-4 space-y-1">
                          {docAttachment.sections.slice(0, 6).map((section, idx) => (
                            <li key={idx}>{section}</li>
                          ))}
                          {docAttachment.sections.length > 6 && (
                            <li>+ {docAttachment.sections.length - 6} more…</li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => docUploadInputRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 border border-dashed border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-300 hover:text-white hover:border-gray-500 transition"
                  >
                    {isUploadingDoc ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Reading document...
                      </>
                    ) : (
                      <>
                        <Paperclip size={16} />
                        Attach .docx / .md / .txt
                      </>
                    )}
                  </button>
                )}
                {docUploadError && (
                  <p className="text-xs text-red-400">{docUploadError}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Writing Style
                  </label>
                  <select
                    value={aiWritingStyle}
                    onChange={(e) => setAiWritingStyle(e.target.value)}
                    className="w-full bg-gray-900/50 border border-gray-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#ffd700] transition"
                  >
                    <option value="Professional">Professional</option>
                    <option value="Funny">Funny</option>
                    <option value="Storytelling">Storytelling</option>
                    <option value="Inspirational">Inspirational</option>
                    <option value="Educational">Educational</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Word count per slide
                  </label>
                  <input
                    type="number"
                    min={10}
                    max={500}
                    placeholder="Auto"
                    value={aiWordCount}
                    onChange={(e) => {
                       const val = e.target.value;
                       setAiWordCount(val === '' ? '' : parseInt(val, 10));
                    }}
                    className="w-full bg-gray-900/50 border border-gray-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#ffd700] transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Target slide count
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={3}
                    max={50}
                    step={1}
                    value={aiSlideCount}
                    onChange={(e) => setAiSlideCount(parseInt(e.target.value, 10))}
                    className="flex-1"
                    style={{ accentColor: '#ffd700' }}
                  />
                  <input
                    type="number"
                    min={3}
                    max={50}
                    value={aiSlideCount}
                    onChange={(e) => {
                      const value = parseInt(e.target.value, 10);
                      if (Number.isNaN(value)) return;
                      setAiSlideCount(Math.min(50, Math.max(3, value)));
                    }}
                    className="w-16 bg-gray-900/50 border border-gray-700 rounded-xl px-2 py-1 text-white text-center focus:outline-none focus:border-[#ffd700] transition"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Choose between 3 and 50 slides for AI output.
                </p>
              </div>
              
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setIsAiModalOpen(false)}
                  className="px-4 py-2 text-gray-400 hover:text-white font-medium transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAiGenerate}
                  disabled={(!docAttachment && !aiPrompt.trim()) || isGenerating}
                  className="px-6 py-2 bg-[#ffd700] hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold rounded-xl transition flex items-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} />
                      Generate Magic
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dedicated AI Tool Result Modal */}
      {activeAiToolResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-5xl bg-[#0f1117] border border-gray-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 my-8 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-gray-800 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                {activeAiToolResult.tool === 'research' && <Search size={24} className="text-purple-400" />}
                {activeAiToolResult.tool === 'design' && <Lightbulb size={24} className="text-yellow-400" />}
                {activeAiToolResult.tool === 'performance' && <TrendingUp size={24} className="text-green-400" />}
                {activeAiToolResult.tool === 'enhancement' && <Wand2 size={24} className="text-blue-400" />}
                <div>
                  <h3 className="font-bold text-white text-xl">
                    {activeAiToolResult.tool === 'research' && 'Research Agent'}
                    {activeAiToolResult.tool === 'design' && 'Design Suggestions'}
                    {activeAiToolResult.tool === 'performance' && 'Performance Prediction'}
                    {activeAiToolResult.tool === 'enhancement' && 'Content Enhancement'}
                  </h3>
                  {activeAiToolResult.query && (
                    <p className="text-sm text-gray-400 mt-1">{activeAiToolResult.query}</p>
                  )}
                </div>
              </div>
              <button 
                onClick={() => setActiveAiToolResult(null)}
                className="text-gray-400 hover:text-white transition p-2 hover:bg-gray-800 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {activeAiToolResult.tool === 'research' && (
                <div className="space-y-6">
                  {/* Research Content */}
                  <div className="prose prose-invert max-w-none">
                    <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-6">
                      <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Search size={18} className="text-purple-400" />
                        Research Results
                      </h4>
                      <div 
                        className="text-gray-300 whitespace-pre-wrap leading-relaxed"
                        dangerouslySetInnerHTML={{ 
                          __html: formatMarkdown(activeAiToolResult.data.research || '') 
                        }}
                      />
                    </div>
                  </div>

                  {/* Key Points */}
                  {activeAiToolResult.data.keyPoints && activeAiToolResult.data.keyPoints.length > 0 && (
                    <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-6">
                      <h4 className="text-lg font-semibold text-white mb-4">Key Points</h4>
                      <ul className="space-y-3">
                        {activeAiToolResult.data.keyPoints.map((point: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-3 text-gray-300">
                            <span className="text-purple-400 font-bold mt-1">{idx + 1}.</span>
                            <span className="flex-1">{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Action Button */}
                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
                    <button
                      onClick={() => {
                        setAiPrompt(activeAiToolResult.data.research);
                        setActiveAiToolResult(null);
                        setIsAiModalOpen(true);
                      }}
                      className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-xl transition flex items-center gap-2"
                    >
                      <Sparkles size={16} />
                      Use for Generation
                    </button>
                  </div>
                </div>
              )}

              {activeAiToolResult.tool === 'design' && (
                <div className="space-y-6">
                  {/* Overall Score */}
                  {activeAiToolResult.data.overallScore && (
                    <div className="bg-gradient-to-r from-yellow-600/20 to-yellow-500/20 border border-yellow-500/50 rounded-xl p-6">
                      <div className="flex items-center justify-between">
                        <h4 className="text-lg font-semibold text-white">Overall Design Score</h4>
                        <div className="text-4xl font-bold text-yellow-400">{activeAiToolResult.data.overallScore}/100</div>
                      </div>
                    </div>
                  )}

                  {/* Color Suggestions */}
                  {activeAiToolResult.data.colorSuggestions && (
                    <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-6">
                      <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Palette size={18} className="text-yellow-400" />
                        Color Recommendations
                      </h4>
                      <div className="space-y-3 text-gray-300">
                        {activeAiToolResult.data.colorSuggestions.accentColor && (
                          <p><strong className="text-yellow-400">Accent Color:</strong> {activeAiToolResult.data.colorSuggestions.accentColor}</p>
                        )}
                        {activeAiToolResult.data.colorSuggestions.backgroundColor && (
                          <p><strong className="text-yellow-400">Background:</strong> {activeAiToolResult.data.colorSuggestions.backgroundColor}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Layout Suggestions */}
                  {activeAiToolResult.data.layoutSuggestions && (
                    <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-6">
                      <h4 className="text-lg font-semibold text-white mb-4">Layout Recommendations</h4>
                      <div className="text-gray-300 whitespace-pre-wrap">{activeAiToolResult.data.layoutSuggestions}</div>
                    </div>
                  )}

                  {/* Accessibility */}
                  {activeAiToolResult.data.accessibility && (
                    <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-6">
                      <h4 className="text-lg font-semibold text-white mb-4">Accessibility Analysis</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-300">Contrast Score</span>
                          <span className="text-lg font-bold text-green-400">{activeAiToolResult.data.accessibility.contrastScore}</span>
                        </div>
                        {activeAiToolResult.data.accessibility.fixes && activeAiToolResult.data.accessibility.fixes.length > 0 && (
                          <div>
                            <p className="text-sm font-semibold text-gray-400 mb-2">Recommended Fixes:</p>
                            <ul className="space-y-2">
                              {activeAiToolResult.data.accessibility.fixes.map((fix: string, idx: number) => (
                                <li key={idx} className="flex items-start gap-2 text-gray-300">
                                  <span className="text-yellow-400 mt-1">•</span>
                                  <span>{fix}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeAiToolResult.tool === 'performance' && (
                <div className="space-y-6">
                  {/* Engagement Score */}
                  <div className="bg-gradient-to-r from-green-600/20 to-green-500/20 border border-green-500/50 rounded-xl p-6">
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-semibold text-white">Engagement Score</h4>
                      <div className="text-4xl font-bold text-green-400">{activeAiToolResult.data.engagementScore || 0}/100</div>
                    </div>
                  </div>

                  {/* Predicted Metrics */}
                  {activeAiToolResult.data.predictedMetrics && (
                    <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-6">
                      <h4 className="text-lg font-semibold text-white mb-4">Predicted Metrics</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {Object.entries(activeAiToolResult.data.predictedMetrics).map(([key, value]: [string, any]) => (
                          <div key={key} className="text-center">
                            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{key}</p>
                            <p className="text-xl font-bold text-green-400">{value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Strengths */}
                  {activeAiToolResult.data.strengths && activeAiToolResult.data.strengths.length > 0 && (
                    <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-6">
                      <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Check size={18} className="text-green-400" />
                        Strengths
                      </h4>
                      <ul className="space-y-2">
                        {activeAiToolResult.data.strengths.map((strength: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-2 text-gray-300">
                            <span className="text-green-400 mt-1">✓</span>
                            <span>{strength}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Recommendations */}
                  {activeAiToolResult.data.recommendations && activeAiToolResult.data.recommendations.length > 0 && (
                    <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-6">
                      <h4 className="text-lg font-semibold text-white mb-4">Recommendations</h4>
                      <ul className="space-y-2">
                        {activeAiToolResult.data.recommendations.map((rec: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-2 text-gray-300">
                            <span className="text-yellow-400 mt-1">•</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Hashtags */}
                  {activeAiToolResult.data.hashtagSuggestions && activeAiToolResult.data.hashtagSuggestions.length > 0 && (
                    <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-6">
                      <h4 className="text-lg font-semibold text-white mb-4">Suggested Hashtags</h4>
                      <div className="flex flex-wrap gap-2">
                        {activeAiToolResult.data.hashtagSuggestions.map((tag: string, idx: number) => (
                          <span key={idx} className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300 hover:border-green-500 transition">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeAiToolResult.tool === 'enhancement' && (
                <div className="space-y-6">
                  {/* Original Content */}
                  {activeAiToolResult.data.originalContent && (
                    <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-6">
                      <h4 className="text-lg font-semibold text-white mb-4">Original Content</h4>
                      <div className="text-gray-400 whitespace-pre-wrap bg-gray-800/50 p-4 rounded-lg">
                        {activeAiToolResult.data.originalContent}
                      </div>
                    </div>
                  )}

                  {/* Enhanced Content */}
                  <div className="bg-gradient-to-r from-blue-600/20 to-blue-500/20 border border-blue-500/50 rounded-xl p-6">
                    <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <Wand2 size={18} className="text-blue-400" />
                      Enhanced Content
                    </h4>
                    <div 
                      className="text-gray-300 whitespace-pre-wrap leading-relaxed"
                      dangerouslySetInnerHTML={{ 
                        __html: formatMarkdown(activeAiToolResult.data.enhancedContent || '') 
                      }}
                    />
                  </div>

                  {/* Action Button */}
                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
                    <button
                      onClick={() => {
                        if (activeAiToolResult.data.enhancedContent) {
                          setSlides(slides.map(s => 
                            s.id === activeSlideId 
                              ? { ...s, content: activeAiToolResult.data.enhancedContent }
                              : s
                          ));
                          setActiveAiToolResult(null);
                        }
                      }}
                      className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition flex items-center gap-2"
                    >
                      <Check size={16} />
                      Apply Enhancement
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper function to format markdown-like text
function formatMarkdown(text: string): string {
  if (!text) return '';
  
  return text
    // Headers
    .replace(/^### (.*$)/gim, '<h3 class="text-xl font-semibold text-white mt-6 mb-3">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-semibold text-white mt-8 mb-4">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold text-white mt-10 mb-5">$1</h1>')
    // Bold
    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-yellow-400 font-semibold">$1</strong>')
    // Lists
    .replace(/^\d+\.\s+(.*$)/gim, '<li class="ml-4 mb-2">$1</li>')
    .replace(/^[-*]\s+(.*$)/gim, '<li class="ml-4 mb-2">$1</li>')
    // Paragraphs
    .split('\n\n')
    .map(para => para.trim() ? `<p class="mb-4">${para}</p>` : '')
    .join('');
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-[#ffd700]" />
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}


