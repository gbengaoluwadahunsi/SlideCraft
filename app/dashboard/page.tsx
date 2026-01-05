"use client";

import React, { useState, useRef, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { toast } from 'sonner';
import { useAppContextSafe } from '@/lib/hooks/useAppContext';
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
  ChevronUp,
  ChevronDown,
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
  Clipboard,
  CreditCard,
  Send,
  MessageSquare,
  RefreshCw,
  Keyboard,
  Eye,
  ExternalLink,
  ZoomIn,
  Link2,
  Globe,
  CheckCircle2,
  History
} from 'lucide-react';
import Link from 'next/link';
import { Slide } from '@/components/Slide';
import { TextToolbar } from '@/components/TextToolbar';
import { ProjectManager } from '@/components/ProjectManager';
import { useConfirm } from '@/components/ConfirmDialog';
import { useProject } from '@/lib/hooks/useProject';
import { THEMES } from '@/app/constants/themes';
import { toPng, toJpeg } from 'html-to-image';
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';
import { BOLD_TEMPLATES } from '@/lib/templates';

// Types matching Slide.tsx
interface CustomBlock {
  id: string;
  html: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface InfographicData {
  items: string[];
  layout?: 'icon-grid' | 'process-flow' | 'comparison' | 'stats' | 'radial';
}

interface ElementPosition {
  x: number;
  y: number;
  width?: number;
  height?: number;
}

interface SlideData {
  id: string;
  type: 'cover' | 'content' | 'chart' | 'visual';
  title: string;
  subtitle?: string;
  content?: string;
  emoji?: string;
  icon?: string;
  infographicData?: InfographicData;
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
  // Free positioning for main elements
  elementPositions?: {
    title?: ElementPosition;
    subtitle?: ElementPosition;
    content?: ElementPosition;
    emoji?: ElementPosition;
    media?: ElementPosition;
  };
  freePositioning?: boolean;
}

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
      className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#ffd700] transition min-h-[8rem] max-h-64 overflow-y-auto"
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
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [projectName, setProjectName] = useState('Untitled Project');
  const [projectOptions, setProjectOptions] = useState<any>({});
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState<'pdf' | 'ppt' | 'images' | null>(null);
  const [exportProgress, setExportProgress] = useState({ current: 0, total: 0, status: '' });
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiSlideCount, setAiSlideCount] = useState(6);
  const [aiWordCount, setAiWordCount] = useState<number | ''>('');
  const [aiWritingStyle, setAiWritingStyle] = useState<string>('Professional');
  const [aiSlideStyle, setAiSlideStyle] = useState<'visual' | 'text' | 'mixed'>('text');
  const [activeTool, setActiveTool] = useState<'select' | 'text' | 'image' | 'image-all' | 'color'>('select');
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);

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
  const [streamingText, setStreamingText] = useState('');
  const [useStreaming, setUseStreaming] = useState(false); // Streaming disabled - use regular endpoint

  // AI Features state
  const [isAiFeaturesOpen, setIsAiFeaturesOpen] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isEnhancingContent, setIsEnhancingContent] = useState<string | null>(null); // tracks which action: 'seo-current', 'seo-all', 'tone-current', 'tone-all'
  const [isResearching, setIsResearching] = useState(false);
  const [isAnalyzingDesign, setIsAnalyzingDesign] = useState(false);
  
  // Image Picker state (Unsplash search)
  const [isImagePickerOpen, setIsImagePickerOpen] = useState(false);
  const [imagePickerMode, setImagePickerMode] = useState<'single' | 'all'>('single');
  const [unsplashQuery, setUnsplashQuery] = useState('');
  const [unsplashResults, setUnsplashResults] = useState<any[]>([]);
  const [unsplashLoading, setUnsplashLoading] = useState(false);
  const [unsplashPage, setUnsplashPage] = useState(1);
  const [unsplashTotal, setUnsplashTotal] = useState(0);
  const [imageUrlInput, setImageUrlInput] = useState('');
  
  // Version History state
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyEntries, setHistoryEntries] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [restoringHistoryId, setRestoringHistoryId] = useState<string | null>(null);
  const [isPredictingPerformance, setIsPredictingPerformance] = useState(false);
  const [enhancementResult, setEnhancementResult] = useState<string | null>(null);
  const [researchResult, setResearchResult] = useState<any>(null);
  const [designSuggestions, setDesignSuggestions] = useState<any>(null);
  const [performancePrediction, setPerformancePrediction] = useState<any>(null);
  const [researchTopic, setResearchTopic] = useState('');
  const [researchRefinement, setResearchRefinement] = useState('');
  const [researchHistory, setResearchHistory] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  
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
  const [canUploadLogo, setCanUploadLogo] = useState(false);
  const logoUploadInputRef = useRef<HTMLInputElement>(null);

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
      console.error('Failed to upload logo:', error);
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
    
    const confirmed = await confirm({
      title: 'Delete Logo',
      message: 'Are you sure you want to delete your logo?',
      confirmText: 'Delete',
      variant: 'danger'
    });
    if (!confirmed) return;
    
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
        toast.success('Logo deleted');
      } else {
        toast.error('Failed to delete logo');
      }
    } catch (error) {
      console.error('Failed to delete logo:', error);
      toast.error('Failed to delete logo');
    } finally {
      setIsSavingBrandSettings(false);
    }
  }, [brandSettings, confirm]);

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

  // Load subscription status to check logo upload permission
  useEffect(() => {
    const fetchSubscriptionStatus = async () => {
      if (status !== 'authenticated') return;
      try {
        const response = await fetch('/api/subscription/status');
        if (response.ok) {
          const data = await response.json();
          setCanUploadLogo(data.limits?.canUploadLogo ?? false);
        }
      } catch (error) {
        // Default to false if error
        setCanUploadLogo(false);
      }
    };
    fetchSubscriptionStatus();
  }, [status]);

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
  };

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

  const addNewSlide = () => {
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
      fontScale: slides[0]?.fontScale || 1,
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
      } else if (isAiFeaturesOpen) {
        appContext.setCurrentSection('ai-tools');
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
  }, [isAiModalOpen, isAiFeaturesOpen, isSettingsOpen, isPropertiesPanelOpen, isMobileSlidesOpen]);

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
      
      // Show keyboard shortcuts: ?
      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        setShowKeyboardShortcuts(true);
        return;
      }
      
      // Close modals: Escape
      if (e.key === 'Escape') {
        setShowKeyboardShortcuts(false);
        return;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canUndo, canRedo, handleUndo, handleRedo, activeSlideId, slides, handleDuplicateSlide, handleDeleteSlide, handleMoveSlide, addNewSlide, saveProject, previewImageUrl]);

  // Show loading state while checking authentication
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-[#ffd700]" />
      </div>
    );
  }

  // Don't render if not authenticated (redirect is in progress)
  if (status === 'unauthenticated') {
    return null;
  }

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

  const handleDownloadSlideImage = async (slide: SlideData, index: number) => {
    // Prevent multiple simultaneous downloads
    if (downloadingSlideId) {
      console.log('Download already in progress, please wait...');
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
      console.error('Single slide download failed:', error);
    } finally {
      // Delay state reset to prevent rapid repeated downloads
      setTimeout(() => {
        setDownloadingSlideId(null);
        setSlideDownloadData(null);
      }, 500);
    }
  };

  // Copy slide to clipboard as image
  const handleCopySlideToClipboard = async (slide: SlideData, index: number) => {
    if (copyingSlideId) return;
    
    try {
      setCopyingSlideId(slide.id);
      
      const tempSlideData = { ...slide, _isDownloading: true } as any;
      setSlideDownloadData(tempSlideData);
      
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
  };

  const adjustFontScale = (delta: number) => {
    if (!activeSlide) return;
    const current = activeSlide.fontScale ?? 1;
    const next = Math.min(1.5, Math.max(0.7, parseFloat((current + delta).toFixed(2))));
    setSlides(prevSlides => prevSlides.map(s => s.id === activeSlide.id ? { ...s, fontScale: next } : s));
  };

  // Fetch version history
  const fetchHistory = async () => {
    if (!projectId) {
      toast.error('Save your project first to view history');
      return;
    }
    
    setHistoryLoading(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/history?limit=30`);
      if (!response.ok) throw new Error('Failed to fetch history');
      
      const data = await response.json();
      setHistoryEntries(data.history || []);
      setIsHistoryOpen(true);
    } catch (error) {
      console.error('History fetch error:', error);
      toast.error('Failed to load version history');
    } finally {
      setHistoryLoading(false);
    }
  };

  // Restore from history
  const restoreFromHistory = async (entry: any) => {
    const confirmed = await confirm({
      title: 'Restore Version',
      message: 'This will replace your current slides with this version. Your current work will be added to history. Continue?',
      confirmText: 'Restore',
      variant: 'warning'
    });
    
    if (!confirmed) return;
    
    try {
      setRestoringHistoryId(entry.id);
      
      // Save current state to history first
      if (projectId) {
        await fetch(`/api/projects/${projectId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            name: projectName, 
            slides, 
            options: projectOptions, 
            saveHistory: true 
          })
        });
      }
      
      // Restore the selected version
      const restoredSlides = entry.slides.map((slide: any) => ({
        ...slide,
        id: slide.id || Date.now().toString() + Math.random().toString(36).substr(2, 9)
      }));
      
      setSlides(restoredSlides);
      if (entry.options) {
        setProjectOptions(entry.options);
      }
      
      setIsHistoryOpen(false);
      toast.success('Version restored successfully');
      addToHistory(restoredSlides);
    } catch (error) {
      console.error('Restore error:', error);
      toast.error('Failed to restore version');
    } finally {
      setRestoringHistoryId(null);
    }
  };

  const handleAiGenerate = async () => {
    const combinedSource = [urlAttachment?.text, docAttachment?.text, aiPrompt.trim()].filter(Boolean).join('\n\n').trim();
    if (!combinedSource) {
      setDocUploadError('Add a prompt, attach a document, or import a URL to proceed.');
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
        console.error('Streaming check failed:', error);
        useStream = false;
      }
    }

    // Regular generation (streaming UI can be added later)
    if (!useStream) {
      try {
        // Combine sections from document and URL
        const combinedSections = [
          ...(docAttachment?.sections || []),
          ...(urlAttachment?.sections || []),
        ];

        const response = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: combinedSource,
            slideCount: aiSlideCount,
            wordCount: aiWordCount || undefined,
            writingStyle: aiWritingStyle,
            slideStyle: aiSlideStyle,
            sections: combinedSections.length > 0 ? combinedSections : undefined,
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
        
        if (data.slides && Array.isArray(data.slides)) {
          // Reapply current brand/theme colors to AI-generated slides
          const themedSlides = (data.slides as SlideData[]).map((s, idx) => ({
            ...s,
            backgroundColor: s.backgroundColor || brandSettings.backgroundColor,
            textColor: s.textColor || brandSettings.textColor,
            accentColor: s.accentColor || brandSettings.accentColor,
            fontFamily: s.fontFamily || brandSettings.fontFamily,
          }));
          // Normalize slide IDs, element order etc.
          const normalized = normalizeSlides(themedSlides.slice(0, aiSlideCount));
          
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
              
              console.log(`📝 Extracted ${items.length} items from content for "${title}":`, items.slice(0, 3));

              
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
              
              console.log(`🎨 Creating visual infographic for "${title}" with ${items.length} items:`, items);
              
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
              
              console.log(`🎨 Slide ${index + 1} "${title}" → Layout: ${layout}`);
              
              return {
                ...slide,
                type: 'visual' as const,
                // Set infographic data for programmatic rendering
                infographicData: {
                  items,
                  layout: slide.infographicLayout || layout
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
          
          // Clear inputs after successful generation
          setAiPrompt('');
          clearDocAttachment();
          clearUrlAttachment();
          setIsAiModalOpen(false);
        }
      } catch (error) {
        console.error('Failed to generate slides:', error);
        toast.error('Failed to generate slides. Please try again.');
      } finally {
        setIsGenerating(false);
      }
    }
  };

  const handleToolClick = (tool: 'select' | 'text' | 'image' | 'image-all' | 'color') => {
    setActiveTool(tool);
    if (tool === 'image' || tool === 'image-all') {
        // Open the image picker modal instead of directly triggering file input
        setImagePickerMode(tool === 'image-all' ? 'all' : 'single');
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
  };

  // Unsplash search function
  const searchUnsplash = async (query: string, page: number = 1) => {
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
  };

  // Apply image from Unsplash or URL
  const applyBackgroundImage = async (imageUrl: string, downloadLink?: string) => {
    // Track download if from Unsplash (required by API guidelines)
    if (downloadLink) {
      fetch('/api/unsplash/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ downloadLink }),
      }).catch(() => {});
    }

    if (imagePickerMode === 'all') {
      // Reset overlay opacity to 0 when adding new background image (no color tint by default)
      setSlides(prevSlides => prevSlides.map(s => ({ ...s, backgroundImage: imageUrl, backgroundOverlayOpacity: 0 })));
      toast.success('Background applied to all slides');
    } else {
      setSlides(prevSlides => prevSlides.map(s => s.id === activeSlideId ? { ...s, backgroundImage: imageUrl, backgroundOverlayOpacity: 0 } : s));
      toast.success('Background applied to slide');
    }
    
    setIsImagePickerOpen(false);
    setActiveTool('select');
    addToHistory(slides);
  };

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
            if (activeTool === 'image-all') {
                 // Apply to ALL slides - reset overlay to 0 (no tint)
                 setSlides(prevSlides => prevSlides.map(s => ({ ...s, backgroundImage: result, backgroundOverlayOpacity: 0 })));
            } else {
                 // Apply to CURRENT slide only - reset overlay to 0 (no tint)
                 setSlides(prevSlides => prevSlides.map(s => s.id === activeSlide.id ? { ...s, backgroundImage: result, backgroundOverlayOpacity: 0 } : s));
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

  const clearUrlAttachment = () => {
    setUrlAttachment(null);
    setUrlError(null);
    setUrlInput('');
    setUrlOwnershipConfirmed(false);
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
  const handleEnhanceContent = async (action: string, content: string) => {
    setIsEnhancingContent(`${action}-current`);
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
      console.error('Content enhancement failed:', error);
      toast.error('Failed to enhance content');
    } finally {
      setIsEnhancingContent(null);
    }
  };

  // Batch Content Enhancement (all slides)
  const handleEnhanceAllSlides = async (action: string) => {
    setIsEnhancingContent(`${action}-all`);
    try {
      // Prepare slides for analysis (strip large binary data)
      const slidesForEnhancement = slides.map(slide => ({
        id: slide.id,
        type: slide.type,
        title: slide.title,
        subtitle: slide.subtitle,
        content: slide.content,
      }));

      const response = await fetch('/api/ai/enhance-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slides: slidesForEnhancement,
          action,
          targetAudience: 'LinkedIn professionals'
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.batchMode && data.enhancedSlides) {
          // Apply enhanced content to all slides
          setSlides(prevSlides => prevSlides.map((slide, index) => {
            const enhanced = data.enhancedSlides[index];
            if (enhanced) {
              return {
                ...slide,
                title: enhanced.title || slide.title,
                subtitle: enhanced.subtitle || slide.subtitle,
                content: enhanced.content || slide.content,
              };
            }
            return slide;
          }));
          toast.success(`All ${slides.length} slides ${action === 'seo' ? 'optimized for SEO' : 'tone adjusted'}!`);
          setIsAiFeaturesOpen(false);
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Enhancement failed');
      }
    } catch (error) {
      console.error('Batch enhancement failed:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to enhance slides');
    } finally {
      setIsEnhancingContent(null);
    }
  };

  // Research Agent
  const handleResearch = async (isRefinement = false) => {
    const query = isRefinement ? researchRefinement.trim() : researchTopic.trim();
    if (!query) return;
    
    setIsResearching(true);
    
    try {
      // Build conversation history for refinements
      const history = isRefinement ? [
        ...researchHistory,
        { role: 'user' as const, content: query }
      ] : [];
      
      const response = await fetch('/api/ai/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: isRefinement ? researchTopic : query,
          depth: 'comprehensive',
          sources: 5,
          refinement: isRefinement ? query : undefined,
          history: isRefinement ? researchHistory : undefined,
          previousResearch: isRefinement ? researchResult?.research : undefined
        })
      });

      if (response.ok) {
        const data = await response.json();
        setResearchResult(data);
        
        // Update conversation history
        if (isRefinement) {
          setResearchHistory([
            ...history,
            { role: 'assistant', content: data.research }
          ]);
          setResearchRefinement('');
        } else {
          // Start fresh conversation
          setResearchHistory([
            { role: 'user', content: query },
            { role: 'assistant', content: data.research }
          ]);
        }
        
        // Open/Update dedicated modal with formatted result
        setActiveAiToolResult({
          tool: 'research',
          data: data,
          query: researchTopic
        });
        
        if (!isRefinement) {
          setIsAiFeaturesOpen(false); // Close main modal only on initial research
        }
        
        // Auto-fill AI prompt with research
        setAiPrompt(data.research);
      }
    } catch (error) {
      console.error('Research failed:', error);
      toast.error('Failed to research topic');
    } finally {
      setIsResearching(false);
    }
  };

  // Design Suggestions
  const handleGetDesignSuggestions = async () => {
    setIsAnalyzingDesign(true);
    setDesignSuggestions(null);
    try {
      // Strip large binary data (images, videos) before sending - only text/design info needed
      const slidesForAnalysis = slides.map(slide => ({
        id: slide.id,
        type: slide.type,
        title: slide.title,
        subtitle: slide.subtitle,
        content: slide.content,
        emoji: slide.emoji,
        category: slide.category,
        backgroundColor: slide.backgroundColor,
        textColor: slide.textColor,
        accentColor: slide.accentColor,
        fontFamily: slide.fontFamily,
        fontScale: slide.fontScale,
        textAlign: slide.textAlign,
        chartType: slide.chartType,
        chartData: slide.chartData,
        // Indicate if slide has background image without sending the data
        hasBackgroundImage: !!slide.backgroundImage,
        backgroundOverlayOpacity: slide.backgroundOverlayOpacity,
      }));
      
      const response = await fetch('/api/ai/design-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slides: slidesForAnalysis,
          currentSettings: brandSettings
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to get design suggestions');
      }

      setDesignSuggestions(data.suggestions);
      // Open dedicated modal with formatted result
      setActiveAiToolResult({
        tool: 'design',
        data: data.suggestions,
        query: 'Design Analysis'
      });
      setIsAiFeaturesOpen(false); // Close main modal
    } catch (error) {
      console.error('Design analysis failed:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to get design suggestions');
    } finally {
      setIsAnalyzingDesign(false);
    }
  };

  // Performance Prediction
  const handlePredictPerformance = async () => {
    setIsPredictingPerformance(true);
    setPerformancePrediction(null);
    try {
      // Strip large binary data (images, videos) before sending - only text is needed for analysis
      const slidesForAnalysis = slides.map(slide => ({
        id: slide.id,
        type: slide.type,
        title: slide.title,
        subtitle: slide.subtitle,
        content: slide.content,
        emoji: slide.emoji,
        category: slide.category,
        chartType: slide.chartType,
        chartData: slide.chartData,
      }));
      
      const response = await fetch('/api/ai/predict-performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slides: slidesForAnalysis,
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
      console.error('Performance prediction failed:', error);
      toast.error('Failed to predict performance');
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
        console.warn('Failed to generate video thumbnail', err);
    }

    // Set temporary state
    setSlides(prevSlides => prevSlides.map(s => s.id === activeSlide.id ? { 
        ...s, 
        mediaUrl: localUrl,
        mediaPosterUrl: posterUrl 
    } : s));

    // Upload to Cloudinary via our server (bypasses browser CORS restrictions)
    try {
        const sizeMb = file.size / 1024 / 1024;
        const MAX_FILE_MB = 100;
        if (sizeMb > MAX_FILE_MB) {
            console.error(`Upload blocked: file too large (${sizeMb.toFixed(1)} MB). Limit is ${MAX_FILE_MB} MB.`);
            toast.error(`Video too large (${sizeMb.toFixed(1)} MB). Please upload a file ≤ ${MAX_FILE_MB} MB.`);
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        console.log('Uploading via server proxy to Cloudinary...');

        const uploadRes = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
        });

        if (uploadRes.ok) {
            const data = await uploadRes.json();
            console.log('Upload successful:', data.secure_url);
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
            console.error('Upload failed:', errMsg);
            toast.error(errMsg || 'Upload failed. Please try again.');
        }
    } catch (error) {
        console.error('Upload error:', error);
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
            console.warn('Video capture timed out');
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
                    console.warn('Canvas taint error (CORS)', e);
                    resolve(null); 
                }
            } else {
                resolve(null);
            }
            video.remove();
        };

        video.onerror = () => {
            clearTimeout(timeout);
            console.warn('Video load error for capture');
            resolve(null);
            video.remove();
        };
      });
  };

  // Export as Images ZIP (client-side only, no server needed)
  const handleExportImages = async () => {
    setIsExporting('images');
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
            const dataUrl = await toPng(slideDownloadRef.current, {
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
      setIsExporting(null);
      setSlideDownloadData(null);
      setExportProgress({ current: 0, total: 0, status: '' });
    }
  };

  const handleExport = async (format: 'pdf' | 'ppt') => {
    // Use ref for fresh slides data (avoids stale closure issue)
    const currentSlides = slidesRef.current;
    
    // Check for pending video uploads (blob URLs mean upload not complete)
    const pendingVideos = currentSlides.filter(s => s.mediaType === 'video' && s.mediaUrl?.startsWith('blob:'));
    if (pendingVideos.length > 0) {
      toast.warning(`${pendingVideos.length} video(s) still uploading. Wait for upload to complete for video URLs to appear in export.`);
    }
    
    // Debug: Log what we're sending
    console.log('Export - Current slides mediaUrls:', currentSlides.map(s => ({ type: s.type, mediaType: s.mediaType, mediaUrl: s.mediaUrl?.substring(0, 50) })));
    
    setIsExporting(format);
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
                     // Use JPEG with quality 0.85 for faster export and smaller payload
                     // Add timeout wrapper to prevent hanging
                     const capturePromise = toJpeg(slideDownloadRef.current, {
                        cacheBust: true,
                        width: 1080,
                        height: 1080,
                        pixelRatio: 1.5,
                        skipAutoScale: true,
                        quality: 0.85,
                        backgroundColor: slide.backgroundColor || '#0B0F19',
                        // Skip fonts to avoid CORS issues
                        skipFonts: false,
                        // Add pixel ratio for better quality
                        pixelRatio: attempts > 1 ? 1 : 1.5,
                     });
                     
                     // Add 10 second timeout per slide
                     const timeoutPromise = new Promise<string>((_, reject) => 
                         setTimeout(() => reject(new Error('Capture timeout')), 10000)
                     );
                     
                     const dataUrl = await Promise.race([capturePromise, timeoutPromise]);
                     capturedSlides.push({ id: slide.id, dataUrl, index });
                     captured = true;
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
          setIsExporting(null);
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

      // Attach videos if PPT export
      if (format === 'ppt') {
          setExportProgress({ current: totalSlides, total: totalSlides, status: 'Attaching videos...' });
          await Promise.all(currentSlides.map(async (slide, index) => {
              if (slide.mediaType === 'video' && slide.mediaUrl?.startsWith('blob:')) {
                  try {
                      const blobRes = await fetch(slide.mediaUrl);
                      const blob = await blobRes.blob();
                      formData.append(`video_${index}`, blob, 'video.mp4');
                  } catch (e) {
                      console.error('Failed to attach video blob', e);
                  }
              }
          }));
      }

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
          format,
          options: { title: currentSlides[0]?.title },
          mode: 'client-side-images'
      }));

      setExportProgress({ current: totalSlides, total: totalSlides, status: `Generating ${format.toUpperCase()}...` });

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
      a.download = `carouslk-export.${format === 'ppt' ? 'pptx' : 'pdf'}`;
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
      setIsExporting(null);
      setSlideDownloadData(null);
      setExportProgress({ current: 0, total: 0, status: '' });
    }
  };

  const renderPropertiesPanelContent = () => (
    <>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Properties</h3>
        <button onClick={() => setIsPropertiesPanelOpen(false)} className="text-gray-500 hover:text-white transition">
          <X size={16} />
        </button>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-xs text-gray-600 dark:text-gray-400">Title</label>
          <input
            type="text"
            value={activeSlide.title || ''}
            onChange={(e) => {
              const newTitle = e.target.value;
              setSlides(prevSlides => prevSlides.map(s => s.id === activeSlide.id ? { ...s, title: newTitle } : s));
            }}
            className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#ffd700] transition"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs text-gray-600 dark:text-gray-400">Font Size</label>
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
            <label className="text-xs text-gray-600 dark:text-gray-400">Subtitle</label>
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
            <label className="text-xs text-gray-600 dark:text-gray-400">Content</label>
            <ContentEditableDiv
              slideId={activeSlide.id}
              content={activeSlide.content || ''}
              onChange={(newContent) => {
                setSlides(slides.map(s => s.id === activeSlide.id ? { ...s, content: newContent } : s));
              }}
            />
            <p className="text-[10px] text-gray-500">
              Format with shortcuts: <strong>Ctrl+B</strong> bold, <em>Ctrl+I</em> italic.
            </p>
            {/* AI Content Enhancement */}
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => handleEnhanceContent('rewrite', activeSlide.content || '')}
                disabled={!!isEnhancingContent || !activeSlide.content}
                className="flex-1 px-3 py-1.5 text-xs bg-[#ffd700]/10 border border-[#ffd700]/30 text-[#ffd700] rounded-lg hover:bg-[#ffd700]/20 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                title="Improve clarity and flow"
              >
                {isEnhancingContent === 'rewrite-current' ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} />}
                Enhance
              </button>
              <button
                onClick={() => handleEnhanceContent('hook', activeSlide.content || activeSlide.title || '')}
                disabled={!!isEnhancingContent}
                className="px-3 py-1.5 text-xs bg-gray-800 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-700 transition disabled:opacity-50 flex items-center gap-1"
                title="Create better hook"
              >
                <Lightbulb size={12} />
              </button>
            </div>
            {enhancementResult && (
              <div className="mt-2 p-2 bg-gray-800 rounded-lg border border-gray-700">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-xs text-gray-600 dark:text-gray-400">Enhanced:</span>
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
          <div className="flex items-center justify-between">
            <label className="text-xs text-gray-600 dark:text-gray-400">Slide Emoji / Icon</label>
            {/* Toggle for all slides */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-500">All slides</span>
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
                    ? 'bg-[#ffd700]'
                    : 'bg-gray-700'
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
                className="flex-1 bg-gray-900/50 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#ffd700] transition"
              />
              <button
                onClick={() => setIsEmojiPickerOpen(!isEmojiPickerOpen)}
                className={`px-3 py-2 rounded-lg border text-lg transition ${
                  isEmojiPickerOpen 
                    ? 'border-[#ffd700] bg-[#ffd700]/10' 
                    : 'border-gray-700 hover:border-gray-500'
                }`}
                title="Open emoji picker"
              >
                😀
              </button>
            </div>
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
          {/* Emoji Picker Popup */}
          {isEmojiPickerOpen && (
            <div className="absolute z-50 mt-2 right-0">
              <div className="relative">
                <button
                  onClick={() => setIsEmojiPickerOpen(false)}
                  className="absolute -top-2 -right-2 z-10 w-6 h-6 bg-gray-800 border border-gray-600 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-white hover:bg-gray-700 transition"
                >
                  <X size={12} />
                </button>
                <EmojiPicker
                  onEmojiClick={(emojiData: EmojiClickData) => {
                    setSlides(slides.map(s => s.id === activeSlide.id ? { ...s, emoji: emojiData.emoji } : s));
                    setIsEmojiPickerOpen(false);
                  }}
                  theme={Theme.DARK}
                  width={320}
                  height={400}
                  searchPlaceholder="Search emojis..."
                  previewConfig={{ showPreview: false }}
                />
              </div>
            </div>
          )}
          <p className="text-[10px] text-gray-500">Toggle above to add/remove icons from all slides, or pick an emoji.</p>
        </div>



        <div className="space-y-3 pt-4 border-t border-gray-700 media-section-unique">
          <label className="text-xs text-gray-600 dark:text-gray-400">Media / Embeds</label>
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
                <label className="text-xs text-gray-600 dark:text-gray-400">Image Source</label>
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
                        <div className="flex flex-col items-center gap-2 text-gray-600 dark:text-gray-400 group-hover:text-white">
                            <ImageIcon size={20} />
                            <span className="text-xs">Upload Image Block</span>
                        </div>
                    </label>
                )}
                 <label className="text-xs text-gray-600 dark:text-gray-400 mt-2 block">Aspect ratio</label>
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
                    <label className="text-xs text-gray-600 dark:text-gray-400">Current Video (links preferred; uploads ≤100MB)</label>
                    <div className="relative group rounded-lg overflow-hidden border border-gray-700 h-32 bg-black/40 flex items-center justify-center">
                        {/* Simple preview */}
                        {activeSlide.mediaUrl.startsWith('blob:') ? (
                            <video src={activeSlide.mediaUrl} className="w-full h-full object-contain" />
                        ) : (
                            <div className="text-center p-4">
                                <div className="text-red-500 mb-2 flex justify-center"><Upload size={24} /></div>
                                <div className="text-xs text-gray-600 dark:text-gray-400 break-all line-clamp-2">{activeSlide.mediaUrl}</div>
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
                      <label className="text-xs text-gray-600 dark:text-gray-400">Preferred: paste video URL (YouTube/Vimeo/Cloudinary)</label>
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
                        <div className="flex flex-col items-center gap-2 text-gray-600 dark:text-gray-400 group-hover:text-white">
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
                <label className="text-xs text-gray-600 dark:text-gray-400">Aspect ratio</label>
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
              <label className="text-xs text-gray-600 dark:text-gray-400">Embed HTML</label>
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
            <div className="space-y-3 pt-3 border-t border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <label className="text-xs text-gray-600 dark:text-gray-400">Media Width</label>
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
                        : 'border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-500 hover:text-white'
                    }`}
                  >
                    {preset}%
                  </button>
                ))}
              </div>

              <div className="space-y-2">
                <label className="text-xs text-gray-600 dark:text-gray-400">Alignment</label>
                <div className="flex gap-2">
                  {(['left', 'center', 'right'] as const).map(position => (
                    <button
                      key={position}
                      onClick={() => setSlides(slides.map(s => s.id === activeSlide.id ? { ...s, mediaAlignment: position } : s))}
                      className={`flex-1 px-3 py-2 rounded-lg text-xs uppercase tracking-wide border transition ${
                        (activeSlide.mediaAlignment || 'center') === position
                          ? 'border-[#ffd700] text-white bg-[#ffd700]/10'
                          : 'border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-500 hover:text-white'
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
          <label className="text-xs text-gray-600 dark:text-gray-400">Background Image</label>
          
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
                className="w-full flex items-center justify-center gap-2 p-3 bg-gray-900/50 border border-gray-700 border-dashed rounded-lg text-gray-600 dark:text-gray-400 hover:text-white hover:border-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition group"
            >
                <ImageIcon size={16} className="group-hover:scale-110 transition" />
                <span className="text-xs">Upload for This Slide</span>
            </button>
          )}
          
          {activeSlide.backgroundImage && (
             <div className="space-y-4">
                <div className="flex justify-between items-center gap-2">
                    <span className="text-[10px] text-gray-500 font-medium">SETTINGS</span>
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
                   <div className="flex justify-between text-xs text-gray-500">
                       <span>Color Tint</span>
                       <span>{Math.round((activeSlide.backgroundOverlayOpacity ?? 0) * 100)}%</span>
                   </div>
                   <p className="text-[9px] text-gray-600 mb-1">Add theme color overlay on image</p>
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
                       className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#ffd700]"
                   />
                </div>

                <div className="pt-2 border-t border-gray-700 mt-2 space-y-2">
                   <label className="text-xs text-gray-600 dark:text-gray-400">Image Filters</label>
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
                                 // Smart apply: if all slides have same background, apply to all
                                 const currentBg = activeSlide.backgroundImage;
                                 const allSameBackground = slides.every(s => s.backgroundImage === currentBg);
                                 
                                 const updateFilter = (existingFilter: string | undefined) => {
                                     let newFilter = existingFilter || '';
                                     if (newFilter.includes('brightness')) {
                                         newFilter = newFilter.replace(/brightness\([0-9.]+\)/, `brightness(${val})`);
                                     } else {
                                         newFilter = `${newFilter} brightness(${val})`.trim();
                                     }
                                     return newFilter;
                                 };
                                 
                                 if (allSameBackground) {
                                     setSlides(prevSlides => prevSlides.map(s => ({ ...s, backgroundImageFilter: updateFilter(s.backgroundImageFilter) })));
                                 } else {
                                     setSlides(prevSlides => prevSlides.map(s => s.id === activeSlide.id ? { ...s, backgroundImageFilter: updateFilter(s.backgroundImageFilter) } : s));
                                 }
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
                                 // Smart apply: if all slides have same background, apply to all
                                 const currentBg = activeSlide.backgroundImage;
                                 const allSameBackground = slides.every(s => s.backgroundImage === currentBg);
                                 
                                 const updateFilter = (existingFilter: string | undefined) => {
                                     let newFilter = existingFilter || '';
                                     if (newFilter.includes('contrast')) {
                                         newFilter = newFilter.replace(/contrast\([0-9.]+\)/, `contrast(${val})`);
                                     } else {
                                         newFilter = `${newFilter} contrast(${val})`.trim();
                                     }
                                     return newFilter;
                                 };
                                 
                                 if (allSameBackground) {
                                     setSlides(prevSlides => prevSlides.map(s => ({ ...s, backgroundImageFilter: updateFilter(s.backgroundImageFilter) })));
                                 } else {
                                     setSlides(prevSlides => prevSlides.map(s => s.id === activeSlide.id ? { ...s, backgroundImageFilter: updateFilter(s.backgroundImageFilter) } : s));
                                 }
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
                                 // Smart apply: if all slides have same background, apply to all
                                 const currentBg = activeSlide.backgroundImage;
                                 const allSameBackground = slides.every(s => s.backgroundImage === currentBg);
                                 
                                 const updateFilter = (existingFilter: string | undefined) => {
                                     let newFilter = existingFilter || '';
                                     if (newFilter.includes('blur')) {
                                         newFilter = newFilter.replace(/blur\([0-9.]+px\)/, `blur(${val}px)`);
                                     } else {
                                         newFilter = `${newFilter} blur(${val}px)`.trim();
                                     }
                                     return newFilter;
                                 };
                                 
                                 if (allSameBackground) {
                                     setSlides(prevSlides => prevSlides.map(s => ({ ...s, backgroundImageFilter: updateFilter(s.backgroundImageFilter) })));
                                 } else {
                                     setSlides(prevSlides => prevSlides.map(s => s.id === activeSlide.id ? { ...s, backgroundImageFilter: updateFilter(s.backgroundImageFilter) } : s));
                                 }
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
                                 // Smart apply: if all slides have same background, apply to all
                                 const currentBg = activeSlide.backgroundImage;
                                 const allSameBackground = slides.every(s => s.backgroundImage === currentBg);
                                 
                                 const updateFilter = (existingFilter: string | undefined) => {
                                     let newFilter = existingFilter || '';
                                     if (newFilter.includes('grayscale')) {
                                         newFilter = newFilter.replace(/grayscale\([0-9.]+\)/, `grayscale(${val})`);
                                     } else {
                                         newFilter = `${newFilter} grayscale(${val})`.trim();
                                     }
                                     return newFilter;
                                 };
                                 
                                 if (allSameBackground) {
                                     setSlides(prevSlides => prevSlides.map(s => ({ ...s, backgroundImageFilter: updateFilter(s.backgroundImageFilter) })));
                                 } else {
                                     setSlides(prevSlides => prevSlides.map(s => s.id === activeSlide.id ? { ...s, backgroundImageFilter: updateFilter(s.backgroundImageFilter) } : s));
                                 }
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
          <label className="text-xs text-gray-600 dark:text-gray-400">Handle / Tag</label>
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
          <label className="text-xs text-gray-600 dark:text-gray-400">Category / Series Tag</label>
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
            <span className="text-xs text-gray-600 dark:text-gray-400">Type</span>
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
              <label className="text-xs text-gray-600 dark:text-gray-400">Chart Type</label>
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
                <label className="text-xs text-gray-600 dark:text-gray-400">Data Points</label>
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
    <div className="min-h-screen bg-gray-50 dark:bg-[#0B0F19] text-gray-900 dark:text-white font-sans flex flex-col lg:h-screen lg:overflow-hidden overflow-x-hidden transition-colors duration-300">
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
      <header className="h-14 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0f1117] flex items-center px-4 justify-between shrink-0 z-20">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
          <Link href="/" className="text-gray-600 dark:text-gray-400 hover:text-white transition shrink-0">
            <ChevronLeft size={20} />
          </Link>
          <div className="flex items-center gap-2 min-w-0">
             <div className="w-6 h-6 bg-[#ffd700] rounded-md rotate-3 flex items-center justify-center shrink-0">
                <span className="text-black font-bold text-xs">C</span>
             </div>
             <span className="font-bold tracking-tight text-sm sm:text-base truncate">
                <span className="hidden sm:inline">Carouslk / </span>{projectName}
             </span>
          </div>
          <div className="hidden lg:flex items-center gap-1 border-l border-gray-200 dark:border-gray-800 pl-4 ml-4">
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
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition"
              title="Undo (Ctrl+Z)"
            >
              <Undo2 size={18} className="text-gray-600 dark:text-gray-400" />
            </button>
            <button
              onClick={handleRedo}
              disabled={!canRedo}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition"
              title="Redo (Ctrl+Y)"
            >
              <Redo2 size={18} className="text-gray-600 dark:text-gray-400" />
            </button>
            {projectId && (
              <button
                onClick={fetchHistory}
                disabled={historyLoading}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
                title="Version History"
              >
                {historyLoading ? (
                  <Loader2 size={18} className="animate-spin text-gray-400" />
                ) : (
                  <History size={18} className="text-gray-600 dark:text-gray-400" />
                )}
              </button>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
             <button
                onClick={() => setIsMobileSidebarOpen(true)}
                className="p-2 text-gray-300 hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition flex items-center justify-center lg:hidden"
             >
                <Menu size={20} />
             </button>
             <button 
                onClick={() => setIsPropertiesPanelOpen(!isPropertiesPanelOpen)}
                className={`hidden lg:flex p-2 rounded-lg transition ${isPropertiesPanelOpen ? 'text-[#ffd700] bg-[#ffd700]/10' : 'text-gray-600 dark:text-gray-400 hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                title="Toggle Properties Panel"
             >
                <PanelRight size={20} />
             </button>
             <div className="hidden lg:block w-px h-6 bg-gray-800 mx-1"></div>
             <button 
                onClick={() => setIsAiModalOpen(true)}
                className="hidden lg:flex px-3 py-1.5 text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition items-center gap-2"
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
        <div className="hidden md:flex w-16 border-r border-gray-200 dark:border-gray-800 flex-col items-center py-6 gap-6 bg-white dark:bg-[#0f1117] shrink-0 z-10">
            <button 
                onClick={() => setIsTemplatesOpen(true)}
                className="w-10 h-10 bg-[#ffd700]/10 text-[#ffd700] rounded-xl flex items-center justify-center border border-[#ffd700]/20 shadow-[0_0_15px_rgba(255,215,0,0.1)] cursor-pointer hover:bg-[#ffd700]/20 transition"
                title="Templates"
            >
                <Layout size={20} />
            </button>
            <button 
                onClick={() => setIsAiModalOpen(true)}
                className="w-10 h-10 text-gray-500 hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl flex items-center justify-center transition cursor-pointer"
                title="AI Generate"
            >
                <Sparkles size={20} />
            </button>
            <button 
                onClick={() => setIsSettingsOpen(true)}
                className="w-10 h-10 text-gray-500 hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl flex items-center justify-center transition cursor-pointer"
                title="Theme"
            >
                <Palette size={20} />
            </button>
            <button 
                onClick={() => setIsSettingsOpen(true)}
                className="mt-auto w-10 h-10 text-gray-500 hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl flex items-center justify-center transition cursor-pointer"
                title="Settings"
            >
                <Settings size={20} />
            </button>
        </div>

        {/* Slide List */}
        <div className="hidden lg:flex w-72 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0f1117] flex-col shrink-0">
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
                <span className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Slides ({slides.length})</span>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => setShowKeyboardShortcuts(true)}
                        className="w-6 h-6 hover:bg-gray-700 rounded flex items-center justify-center text-gray-500 hover:text-gray-300 transition"
                        title="Keyboard shortcuts"
                    >
                        <Keyboard size={12} />
                    </button>
                    <button 
                        onClick={addNewSlide}
                        className="w-6 h-6 bg-gray-800 hover:bg-gray-700 rounded flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-white transition"
                        title="Add new slide (Ctrl+Enter)"
                    >
                        <Plus size={14} />
                    </button>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {slides.map((slide, index) => (
                    <div 
                        key={slide.id} 
                        ref={(el) => { sidebarSlideRefs.current[slide.id] = el; }}
                        onClick={() => setActiveSlideId(slide.id)}
                        className={`group cursor-pointer rounded-xl transition-all duration-200 border ${activeSlideId === slide.id ? 'bg-gray-800/50 border-[#ffd700]/50 shadow-lg' : 'border-transparent hover:bg-gray-100 dark:hover:bg-gray-800/30 hover:border-gray-700'}`}
                    >
                        <div className="p-3">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Slide {index + 1}</span>
                                    {activeSlideId === slide.id && <div className="w-1.5 h-1.5 bg-[#ffd700] rounded-full shadow-[0_0_5px_#ffd700]"></div>}
                                </div>
                                {/* Move buttons */}
                                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleMoveSlide(slide.id, 'up');
                                        }}
                                        disabled={index === 0}
                                        className="p-1 rounded text-gray-500 hover:text-white hover:bg-gray-700 transition disabled:opacity-30 disabled:cursor-not-allowed"
                                        title="Move up (Ctrl+Shift+↑)"
                                    >
                                        <ChevronUp size={12} />
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleMoveSlide(slide.id, 'down');
                                        }}
                                        disabled={index === slides.length - 1}
                                        className="p-1 rounded text-gray-500 hover:text-white hover:bg-gray-700 transition disabled:opacity-30 disabled:cursor-not-allowed"
                                        title="Move down (Ctrl+Shift+↓)"
                                    >
                                        <ChevronDown size={12} />
                                    </button>
                                </div>
                            </div>
                            {/* Mini Preview */}
                            <div className="aspect-[4/5] bg-gray-900 rounded-lg border border-gray-700/50 relative overflow-hidden group-hover:border-gray-600 transition flex items-center justify-center">
                                <div className="transform scale-[0.15] origin-center pointer-events-none">
                                    <Slide {...slide} />
                                </div>
                            </div>
                            <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                                <span className="uppercase tracking-wide text-[10px]">{slide.type}</span>
                                <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDuplicateSlide(slide.id);
                                        }}
                                        className="p-1.5 rounded-md border border-gray-700 text-gray-300 hover:text-[#ffd700] hover:border-[#ffd700] transition"
                                        title="Duplicate slide (Ctrl+D)"
                                    >
                                        <Copy size={14} />
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleCopySlideToClipboard(slide, index);
                                        }}
                                        className="p-1.5 rounded-md border border-gray-700 text-gray-300 hover:text-green-400 hover:border-green-500 transition disabled:opacity-40"
                                        title="Copy slide to clipboard"
                                        disabled={copyingSlideId !== null}
                                    >
                                        {copyingSlideId === slide.id ? (
                                            <Loader2 size={14} className="animate-spin" />
                                        ) : (
                                            <Clipboard size={14} />
                                        )}
                                    </button>
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
                                    {slide.mediaUrl && slide.mediaType === 'image' && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setPreviewImageUrl(slide.mediaUrl || null);
                                            }}
                                            className="p-1.5 rounded-md border border-gray-700 text-gray-300 hover:text-[#ffd700] hover:border-[#ffd700] transition"
                                            title="View infographic full size"
                                        >
                                            <ZoomIn size={14} />
                                        </button>
                                    )}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteSlide(slide.id);
                                        }}
                                        className="p-1.5 rounded-md border border-gray-700 text-gray-300 hover:text-red-300 hover:border-red-500 transition disabled:opacity-40"
                                        title={slides.length === 1 ? 'You need at least one slide' : 'Delete slide (Del)'}
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
                    className={`w-9 h-9 flex items-center justify-center rounded-full cursor-pointer transition ${activeTool === 'text' ? 'bg-[#ffd700] text-black' : 'text-gray-600 dark:text-gray-400 hover:text-white hover:bg-gray-700'}`}
                    title="Add Text Block"
                >
                    <Type size={16} />
                </div>
                <button 
                    onClick={() => handleToolClick('image')}
                    className={`w-9 h-9 flex items-center justify-center rounded-full cursor-pointer transition ${activeTool === 'image' ? 'bg-[#ffd700] text-black' : 'text-gray-600 dark:text-gray-400 hover:text-white hover:bg-gray-700'}`}
                    title="Set Background Image (Current Slide)"
                    aria-label="Set Background Image"
                >
                    <ImageIcon size={16} />
                </button>
                <div 
                    onClick={() => handleToolClick('image-all')}
                    className={`w-9 h-9 flex items-center justify-center rounded-full cursor-pointer transition ${activeTool === 'image-all' ? 'bg-[#ffd700] text-black' : 'text-gray-600 dark:text-gray-400 hover:text-white hover:bg-gray-700'}`}
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
                                        slide.id === activeSlideId ? 'ring-[#ffd700]/70' : ''
                                    }`}
                                >
                                    <div className="w-[1080px] h-[1080px] bg-white relative overflow-hidden">
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
                    className="w-12 h-12 rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-900/60 flex items-center justify-center text-gray-200 transition disabled:opacity-30 disabled:cursor-not-allowed"
                    aria-label="Previous slide"
                >
                    <ChevronLeft size={20} />
                </button>
                
                <div className="flex-1 flex gap-2">
                    <button
                        onClick={() => setIsMobileSlidesOpen(true)}
                        className="flex-1 px-2 py-3 rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-900/80 text-sm font-medium text-gray-200 flex flex-col items-center justify-center gap-1 shadow-lg"
                    >
                        <span className="text-[10px] uppercase tracking-wider text-gray-500">Slides</span>
                        <span className="text-sm font-semibold text-white">#{activeSlideIndex + 1} / {slides.length}</span>
                    </button>
                    <button
                        onClick={() => setIsPropertiesPanelOpen(true)}
                        className="flex-1 px-2 py-3 rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-900/80 text-sm font-medium text-gray-200 flex flex-col items-center justify-center gap-1 shadow-lg active:bg-gray-800"
                    >
                        <span className="text-[10px] uppercase tracking-wider text-gray-500">Edit</span>
                        <Settings size={18} className="text-white" />
                    </button>
                </div>

                <button
                    onClick={() => goToSlideByIndex(activeSlideIndex + 1)}
                    disabled={activeSlideIndex >= slides.length - 1}
                    className="w-12 h-12 rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-900/60 flex items-center justify-center text-gray-200 transition disabled:opacity-30 disabled:cursor-not-allowed"
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
                        <div className="relative z-10 w-full max-w-md ml-auto h-full bg-white dark:bg-[#0f1117] border-l border-gray-200 dark:border-gray-800 rounded-l-3xl p-6 overflow-y-auto hide-scrollbar shadow-2xl animate-in slide-in-from-right duration-300">
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
          <div className="w-full max-w-sm bg-white dark:bg-[#0f1117] border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
              <h3 className="font-bold text-white text-lg">Export Carousel</h3>
              <button 
                onClick={() => setIsExportOpen(false)}
                className="text-gray-600 dark:text-gray-400 hover:text-white transition"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              {isExporting ? (
                // Progress view during export
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Loader2 size={24} className="animate-spin text-[#ffd700]" />
                    <div>
                      <div className="font-medium text-white">{exportProgress.status}</div>
                      {exportProgress.total > 0 && (
                        <div className="text-xs text-gray-500">
                          {exportProgress.current} / {exportProgress.total} slides
                        </div>
                      )}
                    </div>
                  </div>
                  {exportProgress.total > 0 && (
                    <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-[#ffd700] to-[#ffed4a] h-full transition-all duration-300 ease-out"
                        style={{ width: `${(exportProgress.current / exportProgress.total) * 100}%` }}
                      />
                    </div>
                  )}
                </div>
              ) : (
                // Format selection buttons
                <>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">Choose your preferred format:</p>
                  
                  <button
                    onClick={() => handleExport('pdf')}
                    disabled={!!isExporting}
                    className="w-full flex items-center justify-between p-4 bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-700 hover:border-gray-600 rounded-xl transition group"
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
                    <ChevronLeft size={18} className="rotate-180 text-gray-500 group-hover:translate-x-1 transition" />
                  </button>

                  <button
                    onClick={() => handleExport('ppt')}
                    disabled={!!isExporting}
                    className="w-full flex items-center justify-between p-4 bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-700 hover:border-gray-600 rounded-xl transition group"
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
                    <ChevronLeft size={18} className="rotate-180 text-gray-500 group-hover:translate-x-1 transition" />
                  </button>

                  <button
                    onClick={() => handleExportImages()}
                    disabled={!!isExporting}
                    className="w-full flex items-center justify-between p-4 bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-700 hover:border-gray-600 rounded-xl transition group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center text-green-500 group-hover:scale-110 transition">
                        <ImageIcon size={20} />
                      </div>
                      <div className="text-left">
                        <div className="font-bold text-white">Export as Images</div>
                        <div className="text-xs text-gray-500">ZIP of PNG files • Best for Instagram</div>
                      </div>
                    </div>
                    <ChevronLeft size={18} className="rotate-180 text-gray-500 group-hover:translate-x-1 transition" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-4xl bg-white dark:bg-[#0f1117] border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 my-8">
            <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Settings size={20} className="text-gray-600 dark:text-gray-400" />
                <h3 className="font-bold text-white text-lg">General Settings</h3>
              </div>
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="text-gray-600 dark:text-gray-400 hover:text-white transition"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[70vh] overflow-y-auto">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Project Name</label>
                <input 
                  type="text" 
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#ffd700] transition"
                  placeholder="Untitled Project"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Author Handle</label>
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
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Category / Series</label>
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
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Brand Logo</label>
                  {!canUploadLogo && (
                    <span className="text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-0.5 rounded-full font-medium">PRO</span>
                  )}
                </div>
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
                  ) : canUploadLogo ? (
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
                        className="w-full px-4 py-3 bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-700 hover:border-gray-600 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                  ) : (
                    <div className="w-full">
                      <Link 
                        href="/pricing"
                        className="w-full px-4 py-3 bg-gradient-to-r from-purple-600/20 to-pink-600/20 hover:from-purple-600/30 hover:to-pink-600/30 border border-purple-500/30 rounded-lg transition flex items-center justify-center gap-2 text-purple-300 hover:text-purple-200"
                      >
                        <Upload size={16} />
                        <span>Upgrade to Upload Logo</span>
                      </Link>
                      <p className="text-xs text-gray-500 mt-2">Logo upload is available on Starter, Pro, and Enterprise plans.</p>
                    </div>
                  )}
                </div>
                {canUploadLogo && (
                  <p className="text-xs text-gray-500">Upload your brand logo (max 10MB). Applies to all slides and persists across sessions.</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Font Family</label>
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
                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Colors</label>
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
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Accent Presets</label>
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
            
            <div className="p-6 border-t border-gray-200 dark:border-gray-800 flex justify-between items-center">
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
          <div className="w-full max-w-4xl bg-white dark:bg-[#0f1117] border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 my-8">
            <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
              <div className="flex items-center gap-2 text-purple-400">
                <Sparkles size={24} />
                <h3 className="font-bold text-white text-xl">AI Features</h3>
              </div>
              <button 
                onClick={() => setIsAiFeaturesOpen(false)}
                className="text-gray-600 dark:text-gray-400 hover:text-white transition"
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
                <p className="text-xs text-gray-600 dark:text-gray-400">Research any topic and get comprehensive insights</p>
                <input
                  type="text"
                  value={researchTopic}
                  onChange={(e) => setResearchTopic(e.target.value)}
                  placeholder="Enter topic to research..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500 transition"
                />
                <button
                  onClick={() => handleResearch(false)}
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
                <p className="text-xs text-gray-600 dark:text-gray-400">Get AI-powered design recommendations</p>
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
                <p className="text-xs text-gray-600 dark:text-gray-400">Predict how your carousel will perform</p>
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
                <p className="text-xs text-gray-600 dark:text-gray-400">AI-powered content improvements</p>
                
                {/* SEO Optimization */}
                <div className="space-y-1.5">
                  <label className="text-xs text-gray-500 uppercase tracking-wide">Optimize for SEO</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const content = activeSlide.content || activeSlide.title || activeSlide.subtitle || '';
                        if (content) handleEnhanceContent('seo', content);
                      }}
                      disabled={!!isEnhancingContent || !(activeSlide.content || activeSlide.title || activeSlide.subtitle)}
                      className="flex-1 px-3 py-2 text-xs bg-blue-600/20 border border-blue-600/50 hover:bg-blue-600/30 text-blue-400 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                    >
                      {isEnhancingContent === 'seo-current' ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} />}
                      Current Slide
                    </button>
                    <button
                      onClick={() => handleEnhanceAllSlides('seo')}
                      disabled={!!isEnhancingContent || slides.length === 0}
                      className="flex-1 px-3 py-2 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                    >
                      {isEnhancingContent === 'seo-all' ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} />}
                      All {slides.length} Slides
                    </button>
                  </div>
                </div>

                {/* Tone Adjustment */}
                <div className="space-y-1.5">
                  <label className="text-xs text-gray-500 uppercase tracking-wide">Adjust Tone</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const content = activeSlide.content || activeSlide.title || activeSlide.subtitle || '';
                        if (content) handleEnhanceContent('tone', content);
                      }}
                      disabled={!!isEnhancingContent || !(activeSlide.content || activeSlide.title || activeSlide.subtitle)}
                      className="flex-1 px-3 py-2 text-xs bg-gray-700/50 border border-gray-600 hover:bg-gray-700 text-gray-300 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                    >
                      {isEnhancingContent === 'tone-current' ? <Loader2 size={12} className="animate-spin" /> : null}
                      Current Slide
                    </button>
                    <button
                      onClick={() => handleEnhanceAllSlides('tone')}
                      disabled={!!isEnhancingContent || slides.length === 0}
                      className="flex-1 px-3 py-2 text-xs bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                    >
                      {isEnhancingContent === 'tone-all' ? <Loader2 size={12} className="animate-spin" /> : null}
                      All {slides.length} Slides
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 dark:border-gray-800 flex justify-end">
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
          <div className="relative z-10 w-full bg-white dark:bg-[#0f1117] border-t border-gray-200 dark:border-gray-800 rounded-t-3xl p-4 max-h-[80vh]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
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
                  className={`group cursor-pointer rounded-xl transition-all duration-200 border ${activeSlideId === slide.id ? 'bg-gray-800/60 border-[#ffd700]/50 shadow-lg' : 'border-transparent hover:bg-gray-100 dark:hover:bg-gray-800/40 hover:border-gray-700'}`}
                >
                  <div className="p-3 flex items-center gap-3">
                    <div className="text-xs font-medium text-gray-600 dark:text-gray-400 w-12">#{index + 1}</div>
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
          <div className="relative z-10 w-64 bg-white dark:bg-[#0f1117] border-r border-gray-200 dark:border-gray-800 h-full p-5 flex flex-col gap-4 shadow-2xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
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
                    <span className="text-[10px] font-medium text-gray-600 dark:text-gray-400">Text</span>
                </button>
                <button
                  onClick={() => {
                    handleToolClick('image');
                    setIsMobileSidebarOpen(false);
                  }}
                  className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl bg-gray-800 border border-gray-700 hover:bg-gray-700 transition"
                >
                    <ImageIcon size={20} className="text-blue-400" />
                    <span className="text-[10px] font-medium text-gray-600 dark:text-gray-400">Image</span>
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
                    <span className="text-[10px] font-medium text-gray-600 dark:text-gray-400">All</span>
                </button>
                <button
                  onClick={() => {
                    handleToolClick('color');
                    setIsMobileSidebarOpen(false);
                  }}
                  className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl bg-gray-800 border border-gray-700 hover:bg-gray-700 transition"
                >
                    <Palette size={20} className="text-pink-400" />
                    <span className="text-[10px] font-medium text-gray-600 dark:text-gray-400">Color</span>
                </button>
            </div>

            {/* Undo/Redo */}
            <div className="flex gap-2 mb-4">
                <button
                  onClick={() => {
                    handleUndo();
                  }}
                  disabled={!canUndo}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gray-800 border border-gray-700 hover:bg-gray-700 transition disabled:opacity-30 disabled:cursor-not-allowed"
                >
                    <Undo2 size={18} className="text-gray-300" />
                    <span className="text-xs font-medium text-gray-300">Undo</span>
                </button>
                <button
                  onClick={() => {
                    handleRedo();
                  }}
                  disabled={!canRedo}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gray-800 border border-gray-700 hover:bg-gray-700 transition disabled:opacity-30 disabled:cursor-not-allowed"
                >
                    <Redo2 size={18} className="text-gray-300" />
                    <span className="text-xs font-medium text-gray-300">Redo</span>
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
                setIsAiFeaturesOpen(true);
                setIsMobileSidebarOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-purple-600/20 text-purple-300 border border-purple-500/30 hover:bg-purple-600/30 transition"
            >
              <Sparkles size={18} />
              AI Tools
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
              className="mt-auto px-4 py-3 rounded-2xl bg-gray-900 text-white border border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition flex items-center justify-between"
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
          <div className="w-full max-w-6xl bg-white dark:bg-[#0f1117] border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col h-[70vh]">
            <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <Layout size={20} className="text-[#ffd700]" />
                <h3 className="font-bold text-white text-lg">Theme Gallery</h3>
              </div>
              <button 
                onClick={() => setIsTemplatesOpen(false)}
                className="text-gray-600 dark:text-gray-400 hover:text-white transition"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-10">
                {['Professional', 'Bold', 'Minimalist', 'Dark Mode', 'Premium', 'Educational Templates'].map((category) => (
                    <div key={category}>
                        <h4 className="text-white font-bold text-xl mb-4 flex items-center gap-2">
                            <span className="w-1 h-6 bg-[#ffd700] rounded-full"></span>
                            {category}
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {THEMES.filter(t => t.category === category).map((theme) => {
                                // Find matching template from BOLD_TEMPLATES if it's a full template
                                const fullTemplate = theme.isFullTemplate 
                                  ? BOLD_TEMPLATES.find(t => t.id === theme.id.replace('-template', ''))
                                  : null;

                                return (
                                <div 
                                    key={theme.id}
                                    onClick={async () => {
                                        if (theme.isFullTemplate && fullTemplate) {
                                            // Apply template STYLING to existing slides (preserve user content)
                                            const templateFirst = fullTemplate.slides[0];
                                            // Use functional update to get current state (not stale closure)
                                            setSlides(prevSlides => prevSlides.map((s, idx) => {
                                                // Get matching template slide for styling (cycle if fewer template slides)
                                                const templateSlide = fullTemplate.slides[idx % fullTemplate.slides.length];
                                                return {
                                                    ...s,
                                                    // Apply template styling
                                                    backgroundColor: templateSlide.backgroundColor,
                                                    textColor: templateSlide.textColor,
                                                    accentColor: templateSlide.accentColor,
                                                    fontFamily: templateSlide.fontFamily,
                                                    fontScale: templateSlide.fontScale,
                                                    // Keep user's content: title, subtitle, content, media, customBlocks, etc.
                                                };
                                            }));
                                            // Update brand settings to match template colors/fonts
                                            const newBrand = {
                                              ...brandSettings,
                                              backgroundColor: templateFirst.backgroundColor,
                                              textColor: templateFirst.textColor,
                                              accentColor: templateFirst.accentColor,
                                              fontFamily: templateFirst.fontFamily,
                                            };
                                            setBrandSettings(newBrand);
                                            if (typeof window !== 'undefined' && status !== 'authenticated') {
                                              localStorage.setItem('carouslk_brand_settings', JSON.stringify(newBrand));
                                            }
                                            toast.success(`Applied "${theme.name}" styling to your slides!`);
                                            addToHistory();
                                        } else {
                                            // Apply theme colors/fonts to existing slides
                                            // Use functional update to get current state (not stale closure)
                                            setSlides(prevSlides => prevSlides.map(s => {
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
                                            // Update brand settings state and persist for non-auth users
                                            const newBrand = {
                                                ...brandSettings,
                                                backgroundColor: theme.backgroundColor,
                                                textColor: theme.textColor,
                                                accentColor: theme.accentColor,
                                                fontFamily: theme.fontFamily
                                            };
                                            setBrandSettings(newBrand);
                                            if (typeof window !== 'undefined' && status !== 'authenticated') {
                                                localStorage.setItem('carouslk_brand_settings', JSON.stringify(newBrand));
                                            }
                                            toast.success(`Applied "${theme.name}" theme!`);
                                        }
                                        setIsTemplatesOpen(false);
                                    }}
                                    className="group cursor-pointer relative bg-gray-900 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 hover:border-[#ffd700] transition-all hover:shadow-xl hover:scale-[1.02]"
                                >
                                    <div className="aspect-[4/3] p-4 flex flex-col justify-center items-center gap-2" style={{ backgroundColor: theme.backgroundColor }}>
                                        <div className="text-center space-y-1">
                                            {theme.isFullTemplate ? (
                                                <>
                                                    <div className="text-3xl mb-2">{theme.name.split(' ')[0]}</div>
                                                    <div className="text-sm font-bold px-2" style={{ color: theme.textColor, fontFamily: theme.fontFamily }}>
                                                        {fullTemplate?.slides[0]?.title || 'Template'}
                                                    </div>
                                                    <div className="text-xs opacity-70 px-3" style={{ color: theme.textColor }}>
                                                        {fullTemplate?.slides.length} slides
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="text-xl font-bold" style={{ color: theme.textColor, fontFamily: theme.fontFamily }}>
                                                        Title
                                                    </div>
                                                    <div className="text-xs opacity-80" style={{ color: theme.textColor, fontFamily: theme.fontFamily }}>
                                                        Subtitle <span style={{ color: theme.accentColor, fontWeight: 'bold' }}>Accent</span>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <div className="p-3 bg-gray-900 border-t border-gray-200 dark:border-gray-800 flex justify-between items-center">
                                        <span className="text-sm font-medium text-gray-300">{theme.name}</span>
                                        <span className="text-xs text-[#ffd700] opacity-0 group-hover:opacity-100 transition">
                                            {theme.isFullTemplate ? 'Use Template' : 'Apply'}
                                        </span>
                                    </div>
                                </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {previewImageUrl && (
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm cursor-zoom-out"
          onClick={() => setPreviewImageUrl(null)}
        >
          <div className="relative max-w-[90vw] max-h-[90vh]">
            <button
              onClick={() => setPreviewImageUrl(null)}
              className="absolute -top-12 right-0 text-white hover:text-[#ffd700] transition flex items-center gap-2"
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
                className="px-4 py-2 bg-[#ffd700] text-black font-semibold rounded-lg hover:bg-yellow-400 transition flex items-center gap-2"
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
                className="px-4 py-2 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600 transition flex items-center gap-2"
              >
                <ExternalLink size={18} />
                Open in New Tab
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Modal */}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white dark:bg-[#0f1117] border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2 text-[#ffd700]">
                <Sparkles size={20} />
                <h3 className="font-bold text-white text-lg">Generate with AI</h3>
              </div>
              <button 
                onClick={() => setIsAiModalOpen(false)}
                className="text-gray-600 dark:text-gray-400 hover:text-white transition"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* Input Source Tabs */}
              <div className="flex gap-1 p-1 bg-gray-900/50 rounded-xl">
                <button
                  onClick={() => setAiInputTab('prompt')}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
                    aiInputTab === 'prompt'
                      ? 'bg-[#ffd700] text-black'
                      : 'text-gray-600 dark:text-gray-400 hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <Type size={16} />
                  <span className="hidden sm:inline">Topic</span>
                </button>
                <button
                  onClick={() => setAiInputTab('document')}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
                    aiInputTab === 'document'
                      ? 'bg-[#ffd700] text-black'
                      : 'text-gray-600 dark:text-gray-400 hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <FileText size={16} />
                  <span className="hidden sm:inline">Document</span>
                </button>
                <button
                  onClick={() => setAiInputTab('url')}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
                    aiInputTab === 'url'
                      ? 'bg-[#ffd700] text-black'
                      : 'text-gray-600 dark:text-gray-400 hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <Link2 size={16} />
                  <span className="hidden sm:inline">URL</span>
                </button>
              </div>

              {/* Tab Content: Topic/Prompt */}
              {aiInputTab === 'prompt' && (
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
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
              )}

              {/* Tab Content: Document Upload */}
              {aiInputTab === 'document' && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
                    Upload your document
                  </label>
                  <input
                    ref={docUploadInputRef}
                    type="file"
                    accept=".md,.markdown,.docx,.txt,.pdf"
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
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            {docAttachment.wordCount ?? '—'} words
                            {docAttachment.truncated ? ' • trimmed to first 20k characters' : ''}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={clearDocAttachment}
                          className="text-gray-600 dark:text-gray-400 hover:text-red-400 transition"
                          title="Remove attachment"
                        >
                          <Trash size={16} />
                        </button>
                      </div>
                      {docAttachment.sections && docAttachment.sections.length > 0 && (
                        <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1 max-h-28 overflow-y-auto">
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
                          Upload .docx / .pdf / .md / .txt
                        </>
                      )}
                    </button>
                  )}
                  {docUploadError && (
                    <p className="text-xs text-red-400">{docUploadError}</p>
                  )}
                </div>
              )}

              {/* Tab Content: URL Import */}
              {aiInputTab === 'url' && (
                <div className="space-y-3">
                  <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <RefreshCw size={20} className="text-purple-400 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-white text-sm">Repurpose Your Content</h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          Turn your blog posts, articles, or web content into engaging carousels. 
                          Perfect for repurposing content you&apos;ve already created.
                        </p>
                      </div>
                    </div>
                  </div>

                  {urlAttachment ? (
                    <div className="bg-gray-900/60 border border-gray-700 rounded-xl p-4 space-y-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 text-white font-semibold">
                            <Globe size={16} className="text-[#ffd700] shrink-0" />
                            <span className="truncate">{urlAttachment.title}</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1 truncate">
                            {urlAttachment.sourceDomain}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            {urlAttachment.wordCount ?? '—'} words
                            {urlAttachment.truncated ? ' • trimmed for processing' : ''}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={clearUrlAttachment}
                          className="text-gray-600 dark:text-gray-400 hover:text-red-400 transition shrink-0"
                          title="Remove URL"
                        >
                          <Trash size={16} />
                        </button>
                      </div>
                      {urlAttachment.description && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                          {urlAttachment.description}
                        </p>
                      )}
                      {urlAttachment.sections && urlAttachment.sections.length > 0 && (
                        <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1 max-h-28 overflow-y-auto">
                          <p className="font-semibold text-gray-300">Detected Sections</p>
                          <ul className="list-disc pl-4 space-y-1">
                            {urlAttachment.sections.slice(0, 6).map((section, idx) => (
                              <li key={idx}>{section}</li>
                            ))}
                            {urlAttachment.sections.length > 6 && (
                              <li>+ {urlAttachment.sections.length - 6} more…</li>
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                          Paste your content URL
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="url"
                            value={urlInput}
                            onChange={(e) => {
                              setUrlInput(e.target.value);
                              setUrlError(null);
                            }}
                            placeholder="https://yourblog.com/your-article"
                            className="flex-1 bg-gray-900/50 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-[#ffd700] focus:ring-1 focus:ring-[#ffd700] transition text-sm"
                          />
                          <button
                            onClick={handleParseUrl}
                            disabled={isParsingUrl || !urlInput.trim() || !urlOwnershipConfirmed}
                            className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl transition flex items-center gap-2 shrink-0"
                          >
                            {isParsingUrl ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <Download size={16} />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Ownership Confirmation */}
                      <label className="flex items-start gap-3 p-3 bg-gray-900/30 border border-gray-200 dark:border-gray-800 rounded-xl cursor-pointer hover:bg-gray-900/50 transition">
                        <input
                          type="checkbox"
                          checked={urlOwnershipConfirmed}
                          onChange={(e) => {
                            setUrlOwnershipConfirmed(e.target.checked);
                            setUrlError(null);
                          }}
                          className="mt-0.5 w-4 h-4 rounded border-gray-600 bg-gray-800 text-[#ffd700] focus:ring-[#ffd700] focus:ring-offset-0"
                        />
                        <div className="flex-1">
                          <span className="text-sm text-gray-300 font-medium flex items-center gap-2">
                            <CheckCircle2 size={14} className={urlOwnershipConfirmed ? 'text-green-400' : 'text-gray-500'} />
                            This is my own content
                          </span>
                          <p className="text-xs text-gray-500 mt-1">
                            I confirm I have the rights to repurpose this content
                          </p>
                        </div>
                      </label>
                    </>
                  )}
                  {urlError && (
                    <p className="text-xs text-red-400">{urlError}</p>
                  )}
                </div>
              )}

              {/* Show active sources summary */}
              {(aiInputTab !== 'prompt' && aiPrompt.trim()) || 
               (aiInputTab !== 'document' && docAttachment) || 
               (aiInputTab !== 'url' && urlAttachment) ? (
                <div className="bg-gray-900/30 border border-gray-200 dark:border-gray-800 rounded-xl p-3">
                  <p className="text-xs text-gray-500 mb-2">Active sources:</p>
                  <div className="flex flex-wrap gap-2">
                    {aiPrompt.trim() && (
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-gray-800 rounded-lg text-xs text-gray-300">
                        <Type size={12} /> Topic
                      </span>
                    )}
                    {docAttachment && (
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-gray-800 rounded-lg text-xs text-gray-300">
                        <FileText size={12} /> {docAttachment.name}
                      </span>
                    )}
                    {urlAttachment && (
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-gray-800 rounded-lg text-xs text-gray-300">
                        <Globe size={12} /> {urlAttachment.sourceDomain}
                      </span>
                    )}
                  </div>
                </div>
              ) : null}

              {docUploadError && aiInputTab === 'prompt' && (
                <p className="text-xs text-red-400">{docUploadError}</p>
              )}

              {/* Slide Style Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                  Slide Style
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setAiSlideStyle('visual')}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition ${
                      aiSlideStyle === 'visual'
                        ? 'bg-[#ffd700]/10 border-[#ffd700] text-[#ffd700]'
                        : 'bg-gray-900/50 border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-600 hover:text-gray-300'
                    }`}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <path d="M21 15l-5-5L5 21" />
                    </svg>
                    <span className="text-xs font-medium">Visual</span>
                    <span className="text-[10px] opacity-60">Icons & graphics</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAiSlideStyle('text')}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition ${
                      aiSlideStyle === 'text'
                        ? 'bg-[#ffd700]/10 border-[#ffd700] text-[#ffd700]'
                        : 'bg-gray-900/50 border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-600 hover:text-gray-300'
                    }`}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 7V4h16v3" />
                      <path d="M9 20h6" />
                      <path d="M12 4v16" />
                    </svg>
                    <span className="text-xs font-medium">Text</span>
                    <span className="text-[10px] opacity-60">Detailed content</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAiSlideStyle('mixed')}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition ${
                      aiSlideStyle === 'mixed'
                        ? 'bg-[#ffd700]/10 border-[#ffd700] text-[#ffd700]'
                        : 'bg-gray-900/50 border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-600 hover:text-gray-300'
                    }`}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="8" height="8" rx="1" />
                      <path d="M14 5h7" />
                      <path d="M14 9h5" />
                      <path d="M3 16h7" />
                      <path d="M3 20h5" />
                      <rect x="13" y="13" width="8" height="8" rx="1" />
                    </svg>
                    <span className="text-xs font-medium">Mixed</span>
                    <span className="text-[10px] opacity-60">Best of both</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
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
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
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
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
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
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-white font-medium transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAiGenerate}
                  disabled={(!docAttachment && !aiPrompt.trim() && !urlAttachment) || isGenerating}
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
          <div className="w-full max-w-5xl bg-white dark:bg-[#0f1117] border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 my-8 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center shrink-0">
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
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{activeAiToolResult.query}</p>
                  )}
                </div>
              </div>
              <button 
                onClick={() => setActiveAiToolResult(null)}
                className="text-gray-600 dark:text-gray-400 hover:text-white transition p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {activeAiToolResult.tool === 'research' && (
                <div className="space-y-6">
                  {/* Conversation History */}
                  {researchHistory.length > 2 && (
                    <div className="bg-gray-900/50 border border-gray-700 rounded-xl p-4">
                      <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3 flex items-center gap-2">
                        <MessageSquare size={14} />
                        Conversation History
                      </h4>
                      <div className="space-y-3 max-h-40 overflow-y-auto">
                        {researchHistory.slice(0, -2).map((msg, idx) => (
                          <div key={idx} className={`text-sm ${msg.role === 'user' ? 'text-purple-400' : 'text-gray-500'}`}>
                            <span className="font-medium">{msg.role === 'user' ? 'You: ' : 'AI: '}</span>
                            <span className="line-clamp-2">{msg.content.slice(0, 200)}...</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

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

                  {/* Refine Research */}
                  <div className="bg-purple-900/20 border border-purple-500/30 rounded-xl p-4">
                    <h4 className="text-sm font-semibold text-purple-400 mb-3 flex items-center gap-2">
                      <MessageSquare size={14} />
                      Refine or Continue Research
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                      Ask follow-up questions, request more details, or ask to focus on specific aspects.
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={researchRefinement}
                        onChange={(e) => setResearchRefinement(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && researchRefinement.trim()) {
                            handleResearch(true);
                          }
                        }}
                        placeholder="e.g., Tell me more about..., Focus on..., What about...?"
                        className="flex-1 px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 text-sm"
                      />
                      <button
                        onClick={() => handleResearch(true)}
                        disabled={isResearching || !researchRefinement.trim()}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {isResearching ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Send size={16} />
                        )}
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {['Tell me more details', 'Add statistics', 'Focus on practical examples', 'Simplify this'].map((suggestion) => (
                        <button
                          key={suggestion}
                          onClick={() => setResearchRefinement(suggestion)}
                          className="px-3 py-1 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-full transition"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-between gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
                    <button
                      onClick={() => {
                        setResearchHistory([]);
                        setResearchResult(null);
                        setActiveAiToolResult(null);
                        setIsAiFeaturesOpen(true);
                      }}
                      className="px-4 py-2.5 text-gray-600 dark:text-gray-400 hover:text-white transition flex items-center gap-2"
                    >
                      <RefreshCw size={16} />
                      Start New Research
                    </button>
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
                <div className="space-y-5">
                  {/* Overall Score Card */}
                  {activeAiToolResult.data.overallScore && (
                    <div className="bg-gradient-to-br from-yellow-500/10 via-orange-500/10 to-yellow-600/10 border border-yellow-500/30 rounded-2xl p-5">
                      <div className="flex items-start gap-4">
                        <div className="w-16 h-16 bg-yellow-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                          <span className="text-2xl font-black text-yellow-400">
                            {String(activeAiToolResult.data.overallScore).match(/\d+/)?.[0] || '?'}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-yellow-400 uppercase tracking-wide mb-1">Design Score</h4>
                          <p className="text-gray-300 text-sm leading-relaxed">
                            {String(activeAiToolResult.data.overallScore).replace(/^\d+\/\d+[,.]?\s*/, '')}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Two Column Grid for Colors & Fonts */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Color Suggestions */}
                    {activeAiToolResult.data.colorSuggestions && (
                      <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4">
                        <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                          <Palette size={16} className="text-purple-400" />
                          Colors
                        </h4>
                        <div className="space-y-3">
                          {activeAiToolResult.data.colorSuggestions.accentColor && (
                            <div className="flex items-start gap-3">
                              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-yellow-400 to-orange-500 flex-shrink-0 shadow-inner" />
                              <div className="min-w-0">
                                <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">Accent</p>
                                <p className="text-gray-200 text-sm truncate">{String(activeAiToolResult.data.colorSuggestions.accentColor).split(',')[0]}</p>
                              </div>
                            </div>
                          )}
                          {activeAiToolResult.data.colorSuggestions.backgroundColor && (
                            <div className="flex items-start gap-3">
                              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gray-700 to-gray-900 flex-shrink-0 shadow-inner border border-gray-600" />
                              <div className="min-w-0">
                                <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">Background</p>
                                <p className="text-gray-200 text-sm truncate">{String(activeAiToolResult.data.colorSuggestions.backgroundColor).split(',')[0]}</p>
                              </div>
                            </div>
                          )}
                          {activeAiToolResult.data.colorSuggestions.textColor && (
                            <div className="flex items-start gap-3">
                              <div className="w-8 h-8 rounded-lg bg-white flex-shrink-0 shadow-inner border border-gray-300" />
                              <div className="min-w-0">
                                <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">Text</p>
                                <p className="text-gray-200 text-sm truncate">{String(activeAiToolResult.data.colorSuggestions.textColor).split(',')[0]}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Font Suggestions */}
                    {activeAiToolResult.data.fontSuggestions && (
                      <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4">
                        <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                          <Type size={16} className="text-blue-400" />
                          Typography
                        </h4>
                        <div className="space-y-2">
                          {activeAiToolResult.data.fontSuggestions.recommendedFont && (
                            <div>
                              <p className="text-xs text-gray-600 dark:text-gray-400 font-medium mb-1">Recommended Font</p>
                              <p className="text-white font-semibold">{activeAiToolResult.data.fontSuggestions.recommendedFont}</p>
                            </div>
                          )}
                          {activeAiToolResult.data.fontSuggestions.reason && (
                            <p className="text-gray-600 dark:text-gray-400 text-xs leading-relaxed">{activeAiToolResult.data.fontSuggestions.reason}</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Layout Suggestions */}
                  {activeAiToolResult.data.layoutSuggestions && Array.isArray(activeAiToolResult.data.layoutSuggestions) && activeAiToolResult.data.layoutSuggestions.length > 0 && (
                    <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4">
                      <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                        <Layout size={16} className="text-green-400" />
                        Layout Tips
                      </h4>
                      <div className="space-y-3">
                        {activeAiToolResult.data.layoutSuggestions.slice(0, 3).map((item: { slideIndex?: number; suggestion?: string; reason?: string }, idx: number) => (
                          <div key={idx} className="flex items-start gap-3 p-3 bg-gray-900/50 rounded-lg">
                            <div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                              <span className="text-xs font-bold text-green-400">{idx + 1}</span>
                            </div>
                            <div className="min-w-0 flex-1">
                              {item.slideIndex !== undefined && (
                                <span className="inline-block px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded-full mb-1">
                                  Slide {item.slideIndex + 1}
                                </span>
                              )}
                              {item.suggestion && (
                                <p className="text-gray-200 text-sm">{item.suggestion}</p>
                              )}
                              {item.reason && (
                                <p className="text-gray-500 text-xs mt-1">{item.reason}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Accessibility */}
                  {activeAiToolResult.data.accessibility && (
                    <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4">
                      <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                        <Eye size={16} className="text-cyan-400" />
                        Accessibility
                      </h4>
                      <div className="space-y-3">
                        {activeAiToolResult.data.accessibility.contrastScore && (
                          <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg">
                            <span className="text-gray-300 text-sm">Contrast Score</span>
                            <span className="text-lg font-bold text-cyan-400">{activeAiToolResult.data.accessibility.contrastScore}</span>
                          </div>
                        )}
                        {activeAiToolResult.data.accessibility.fixes && activeAiToolResult.data.accessibility.fixes.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">Improvements</p>
                            {activeAiToolResult.data.accessibility.fixes.slice(0, 3).map((fix: string, idx: number) => (
                              <div key={idx} className="flex items-start gap-2 text-sm">
                                <span className="text-cyan-400 mt-0.5">→</span>
                                <span className="text-gray-300">{fix}</span>
                              </div>
                            ))}
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
                            <p className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1">{key}</p>
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
                      <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3 uppercase tracking-wide">Original Content</h4>
                      <div 
                        className="text-gray-600 dark:text-gray-400 bg-gray-800/50 p-4 rounded-lg leading-relaxed"
                        dangerouslySetInnerHTML={{ 
                          __html: activeAiToolResult.data.originalContent 
                        }}
                      />
                    </div>
                  )}

                  {/* Enhanced Content */}
                  <div className="bg-gradient-to-br from-blue-600/20 via-purple-600/10 to-blue-500/20 border border-blue-500/40 rounded-xl p-6">
                    <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <Wand2 size={18} className="text-blue-400" />
                      Enhanced Content
                    </h4>
                    <div 
                      className="text-gray-200 leading-relaxed prose prose-invert prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ 
                        __html: formatMarkdown(activeAiToolResult.data.enhancedContent || '') 
                      }}
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-800">
                    <p className="text-xs text-gray-500">
                      Click "Apply" to replace the current slide content
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          if (activeAiToolResult.data.enhancedContent) {
                            navigator.clipboard.writeText(
                              activeAiToolResult.data.enhancedContent.replace(/<[^>]*>/g, '')
                            );
                            toast.success('Copied to clipboard!');
                          }
                        }}
                        className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium rounded-xl transition flex items-center gap-2"
                      >
                        <Copy size={16} />
                        Copy
                      </button>
                      <button
                        onClick={() => {
                          if (activeAiToolResult.data.enhancedContent && activeSlide) {
                            setSlides(slides.map(s => 
                              s.id === activeSlideId 
                                ? { ...s, content: activeAiToolResult.data.enhancedContent }
                                : s
                            ));
                            toast.success('Content applied to slide!', {
                              description: 'Your slide content has been updated with the enhanced version.'
                            });
                            setActiveAiToolResult(null);
                          }
                        }}
                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition flex items-center gap-2"
                      >
                        <Check size={16} />
                        Apply to Slide
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Version History Modal */}
      {isHistoryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-white dark:bg-[#0f1117] border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[80vh] flex flex-col">
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <History className="text-[#ffd700]" size={20} />
                <h2 className="text-lg font-semibold text-white">Version History</h2>
              </div>
              <button 
                onClick={() => setIsHistoryOpen(false)}
                className="text-gray-600 dark:text-gray-400 hover:text-white transition"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              {historyEntries.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <History size={40} className="mx-auto mb-3 opacity-50" />
                  <p className="font-medium">No version history yet</p>
                  <p className="text-sm mt-1">Save your project to create history snapshots</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {historyEntries.map((entry, index) => {
                    const date = new Date(entry.createdAt);
                    const isRecent = Date.now() - date.getTime() < 3600000; // Less than 1 hour
                    
                    return (
                      <div
                        key={entry.id}
                        className="p-4 bg-gray-900/50 border border-gray-800 hover:border-gray-700 rounded-xl transition group"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-white">
                                {index === 0 ? 'Latest Save' : `Version ${historyEntries.length - index}`}
                              </span>
                              {isRecent && (
                                <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">
                                  Recent
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-500 mt-1">
                              {date.toLocaleDateString()} at {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            <div className="text-xs text-gray-600 mt-1">
                              {entry.slides?.length || 0} slides
                            </div>
                          </div>
                          <button
                            onClick={() => restoreFromHistory(entry)}
                            disabled={restoringHistoryId === entry.id}
                            className="px-4 py-2 bg-[#ffd700]/10 hover:bg-[#ffd700]/20 border border-[#ffd700]/50 text-[#ffd700] text-sm font-medium rounded-lg transition opacity-0 group-hover:opacity-100 disabled:opacity-50"
                          >
                            {restoringHistoryId === entry.id ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              'Restore'
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-gray-800 bg-gray-900/50">
              <p className="text-xs text-gray-500 text-center">
                History is saved automatically when you save your project
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Image Picker Modal (Unsplash Search) */}
      {isImagePickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-4xl bg-white dark:bg-[#0f1117] border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <ImageIcon className="text-[#ffd700]" size={20} />
                <h2 className="text-lg font-semibold text-white">
                  {imagePickerMode === 'all' ? 'Set Background (All Slides)' : 'Set Background Image'}
                </h2>
              </div>
              <button 
                onClick={() => { setIsImagePickerOpen(false); setActiveTool('select'); }}
                className="text-gray-600 dark:text-gray-400 hover:text-white transition"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-4 space-y-4 overflow-y-auto flex-1">
              {/* Upload & URL Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Upload from device */}
                <button
                  onClick={() => {
                    fileInputRef.current?.click();
                    setIsImagePickerOpen(false);
                  }}
                  className="flex items-center gap-3 p-4 bg-gray-900/50 hover:bg-gray-800 border border-gray-700 rounded-xl transition group"
                >
                  <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-500 group-hover:scale-110 transition">
                    <Upload size={20} />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-white">Upload from Device</div>
                    <div className="text-xs text-gray-500">JPG, PNG, GIF, WebP</div>
                  </div>
                </button>

                {/* Paste URL */}
                <div className="flex items-center gap-2 p-2 bg-gray-900/50 border border-gray-700 rounded-xl">
                  <input
                    type="text"
                    value={imageUrlInput}
                    onChange={(e) => setImageUrlInput(e.target.value)}
                    placeholder="Paste image URL..."
                    className="flex-1 bg-transparent border-none outline-none text-white text-sm px-2"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && imageUrlInput.trim()) {
                        applyBackgroundImage(imageUrlInput.trim());
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      if (imageUrlInput.trim()) {
                        applyBackgroundImage(imageUrlInput.trim());
                      }
                    }}
                    disabled={!imageUrlInput.trim()}
                    className="px-3 py-2 bg-[#ffd700] text-black rounded-lg text-sm font-medium hover:bg-[#ffed4a] disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    Apply
                  </button>
                </div>
              </div>

              {/* Unsplash Search */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="flex-1 flex items-center gap-2 bg-gray-900/50 border border-gray-700 rounded-xl px-3 py-2">
                    <Search size={16} className="text-gray-500" />
                    <input
                      type="text"
                      value={unsplashQuery}
                      onChange={(e) => setUnsplashQuery(e.target.value)}
                      placeholder="Search free photos on Unsplash..."
                      className="flex-1 bg-transparent border-none outline-none text-white text-sm"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          searchUnsplash(unsplashQuery, 1);
                        }
                      }}
                    />
                  </div>
                  <button
                    onClick={() => searchUnsplash(unsplashQuery, 1)}
                    disabled={unsplashLoading || !unsplashQuery.trim()}
                    className="px-4 py-2 bg-[#ffd700] text-black rounded-xl text-sm font-medium hover:bg-[#ffed4a] disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
                  >
                    {unsplashLoading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                    Search
                  </button>
                </div>

                {/* Quick search tags */}
                <div className="flex flex-wrap gap-2">
                  {['business', 'technology', 'nature', 'abstract', 'gradient', 'minimal', 'office', 'creative'].map(tag => (
                    <button
                      key={tag}
                      onClick={() => {
                        setUnsplashQuery(tag);
                        searchUnsplash(tag, 1);
                      }}
                      className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs rounded-full transition capitalize"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Results Grid */}
              {unsplashResults.length > 0 && (
                <div className="space-y-3">
                  <div className="text-xs text-gray-500">
                    {unsplashTotal.toLocaleString()} photos found • Photos by <a href="https://unsplash.com" target="_blank" rel="noopener noreferrer" className="text-[#ffd700] hover:underline">Unsplash</a>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {unsplashResults.map((photo) => (
                      <button
                        key={photo.id}
                        onClick={() => applyBackgroundImage(photo.urls.regular, photo.downloadLink)}
                        className="group relative aspect-square rounded-lg overflow-hidden border border-gray-700 hover:border-[#ffd700] transition"
                        style={{ backgroundColor: photo.color }}
                      >
                        <img
                          src={photo.urls.small}
                          alt={photo.alt}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition flex items-center justify-center">
                          <Check size={24} className="text-white opacity-0 group-hover:opacity-100 transition" />
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition">
                          <div className="text-[10px] text-white truncate">
                            by {photo.user.name}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Load more */}
                  {unsplashResults.length < unsplashTotal && (
                    <div className="flex justify-center pt-2">
                      <button
                        onClick={() => searchUnsplash(unsplashQuery, unsplashPage + 1)}
                        disabled={unsplashLoading}
                        className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-lg transition flex items-center gap-2"
                      >
                        {unsplashLoading ? <Loader2 size={14} className="animate-spin" /> : null}
                        Load More
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Empty state */}
              {!unsplashLoading && unsplashResults.length === 0 && unsplashQuery && (
                <div className="text-center py-8 text-gray-500">
                  <ImageIcon size={40} className="mx-auto mb-2 opacity-50" />
                  <p>No photos found for "{unsplashQuery}"</p>
                  <p className="text-xs mt-1">Try a different search term</p>
                </div>
              )}

              {/* Initial state */}
              {!unsplashQuery && unsplashResults.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Search size={40} className="mx-auto mb-2 opacity-50" />
                  <p>Search millions of free photos</p>
                  <p className="text-xs mt-1">Powered by Unsplash</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Modal */}
      {showKeyboardShortcuts && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white dark:bg-[#0f1117] border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Keyboard className="text-[#ffd700]" size={20} />
                <h2 className="text-lg font-semibold">Keyboard Shortcuts</h2>
              </div>
              <button 
                onClick={() => setShowKeyboardShortcuts(false)}
                className="text-gray-600 dark:text-gray-400 hover:text-white transition"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
              {/* Navigation */}
              <div>
                <h3 className="text-sm font-semibold text-[#ffd700] uppercase tracking-wider mb-3">Navigation</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Previous slide</span>
                    <kbd className="px-2 py-1 bg-gray-800 rounded text-gray-300 text-xs font-mono">↑</kbd>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Next slide</span>
                    <kbd className="px-2 py-1 bg-gray-800 rounded text-gray-300 text-xs font-mono">↓</kbd>
                  </div>
                </div>
              </div>
              
              {/* Editing */}
              <div>
                <h3 className="text-sm font-semibold text-[#ffd700] uppercase tracking-wider mb-3">Editing</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Undo</span>
                    <kbd className="px-2 py-1 bg-gray-800 rounded text-gray-300 text-xs font-mono">Ctrl+Z</kbd>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Redo</span>
                    <kbd className="px-2 py-1 bg-gray-800 rounded text-gray-300 text-xs font-mono">Ctrl+Y</kbd>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Bold text</span>
                    <kbd className="px-2 py-1 bg-gray-800 rounded text-gray-300 text-xs font-mono">Ctrl+B</kbd>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Italic text</span>
                    <kbd className="px-2 py-1 bg-gray-800 rounded text-gray-300 text-xs font-mono">Ctrl+I</kbd>
                  </div>
                </div>
              </div>
              
              {/* Slides */}
              <div>
                <h3 className="text-sm font-semibold text-[#ffd700] uppercase tracking-wider mb-3">Slides</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">New slide</span>
                    <kbd className="px-2 py-1 bg-gray-800 rounded text-gray-300 text-xs font-mono">Ctrl+Enter</kbd>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Duplicate slide</span>
                    <kbd className="px-2 py-1 bg-gray-800 rounded text-gray-300 text-xs font-mono">Ctrl+D</kbd>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Delete slide</span>
                    <kbd className="px-2 py-1 bg-gray-800 rounded text-gray-300 text-xs font-mono">Delete</kbd>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Move slide up</span>
                    <kbd className="px-2 py-1 bg-gray-800 rounded text-gray-300 text-xs font-mono">Ctrl+Shift+↑</kbd>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Move slide down</span>
                    <kbd className="px-2 py-1 bg-gray-800 rounded text-gray-300 text-xs font-mono">Ctrl+Shift+↓</kbd>
                  </div>
                </div>
              </div>
              
              {/* Project */}
              <div>
                <h3 className="text-sm font-semibold text-[#ffd700] uppercase tracking-wider mb-3">Project</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Save project</span>
                    <kbd className="px-2 py-1 bg-gray-800 rounded text-gray-300 text-xs font-mono">Ctrl+S</kbd>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-900/50">
              <p className="text-xs text-gray-500 text-center">Press <kbd className="px-1.5 py-0.5 bg-gray-800 rounded text-gray-600 dark:text-gray-400 font-mono">?</kbd> anytime to show shortcuts</p>
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
  
  // First, handle markdown headers
  let formatted = text
    // Headers with markdown syntax
    .replace(/^### (.*$)/gim, '<h3 class="text-xl font-bold text-purple-400 mt-6 mb-3">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold text-purple-400 mt-8 mb-4">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold text-purple-400 mt-10 mb-5">$1</h1>')
    // Bold text with **
    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-yellow-400 font-semibold">$1</strong>')
    // Lists
    .replace(/^\d+\.\s+(.*$)/gim, '<li class="ml-4 mb-2 list-decimal">$1</li>')
    .replace(/^[-*]\s+(.*$)/gim, '<li class="ml-4 mb-2 list-disc">$1</li>');

  // Detect and style section headers (lines that look like titles)
  // Pattern: Short lines (< 60 chars) that end without punctuation or end with colon
  // and are followed by longer content
  const lines = formatted.split('\n');
  const processedLines = lines.map((line, index) => {
    const trimmedLine = line.trim();
    
    // Skip if already has HTML tags
    if (trimmedLine.startsWith('<')) return line;
    
    // Skip empty lines
    if (!trimmedLine) return line;
    
    // Check if this looks like a section header:
    // - Short line (less than 80 characters)
    // - Doesn't end with common sentence punctuation (. ! ?)
    // - Or ends with colon
    // - Contains keywords like "Overview", "Key", "Points", "Trends", "Summary", etc.
    const isShortLine = trimmedLine.length < 80 && trimmedLine.length > 3;
    const endsWithColon = trimmedLine.endsWith(':');
    const noSentenceEnd = !trimmedLine.match(/[.!?]$/);
    const hasHeaderKeywords = /^(Overview|Key|Main|Summary|Introduction|Conclusion|Recent|Trends|Points|Insights|Benefits|Features|Examples|Steps|Tips|How|What|Why|When|Where|The\s|A\s)/i.test(trimmedLine);
    const isTitleCase = trimmedLine.split(' ').filter(w => w.length > 2).every(word => /^[A-Z]/.test(word));
    
    // Next line exists and is longer (indicating this is a header)
    const nextLine = lines[index + 1]?.trim() || '';
    const nextLineIsContent = nextLine.length > trimmedLine.length * 1.5 || nextLine.length > 100;
    
    if (isShortLine && (endsWithColon || (noSentenceEnd && (hasHeaderKeywords || isTitleCase || nextLineIsContent)))) {
      // Remove trailing colon for cleaner display
      const headerText = endsWithColon ? trimmedLine.slice(0, -1) : trimmedLine;
      return `<h4 class="text-lg font-bold text-purple-400 mt-6 mb-2">${headerText}</h4>`;
    }
    
    return line;
  });

  // Rejoin and handle paragraphs
  return processedLines.join('\n')
    .split('\n\n')
    .map(para => {
      const trimmed = para.trim();
      // Don't wrap if already has block-level HTML
      if (trimmed.startsWith('<h') || trimmed.startsWith('<li') || trimmed.startsWith('<ul') || trimmed.startsWith('<ol')) {
        return trimmed;
      }
      return trimmed ? `<p class="mb-4 leading-relaxed">${trimmed}</p>` : '';
    })
    .join('');
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-[#ffd700]" />
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}


