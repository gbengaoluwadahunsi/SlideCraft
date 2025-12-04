"use client";

import React, { useState, useRef, useEffect } from 'react';
import { 
  Layout, 
  Menu,
  Sparkles, 
  Palette, 
  Settings, 
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
  Upload
} from 'lucide-react';
import Link from 'next/link';
import { Slide } from '@/components/Slide';
import { TextToolbar } from '@/components/TextToolbar';
import { THEMES } from '@/app/constants/themes';
import { toPng } from 'html-to-image';

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
  textAlign?: 'left' | 'center' | 'right';
  chartType?: 'bar' | 'line' | 'pie';
  chartData?: Array<{ name: string; value: number; }>;
  mediaType?: 'video' | 'embed' | null;
  mediaUrl?: string;
  embedHtml?: string;
  mediaAspectRatio?: number;
  mediaWidthPercent?: number;
  mediaAlignment?: 'left' | 'center' | 'right';
  elementOrder?: string[];
  customBlocks?: CustomBlock[];
}

const sanitizeEmoji = (value: string | undefined | null) => {
  if (!value) return '';
  return value
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .trim();
};

export default function DashboardPage() {
  const [activeSlideId, setActiveSlideId] = useState<string>('1');
  const [isPropertiesPanelOpen, setIsPropertiesPanelOpen] = useState(true);
  const [isMobileSlidesOpen, setIsMobileSlidesOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [projectName, setProjectName] = useState('Untitled Project');
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState<'pdf' | 'ppt' | null>(null);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiSlideCount, setAiSlideCount] = useState(6);
  const [activeTool, setActiveTool] = useState<'select' | 'text' | 'image' | 'color'>('select');
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
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
  const [slides, setSlides] = useState<SlideData[]>([
    {
      id: '1',
      type: 'cover',
      title: 'THE SECRET SAUCE',
      subtitle: 'How to create viral carousels in minutes.',
      category: 'UNDER THE HOOD',
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
      category: 'UNDER THE HOOD',
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
        category: 'UNDER THE HOOD',
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
      category: slide.category ?? baseSlide?.category ?? 'UNDER THE HOOD',
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
      category: 'UNDER THE HOOD',
      accentColor: slides[0]?.accentColor || '#ffd700',
      handle: slides[0]?.handle || '@carouslk',
      fontFamily: slides[0]?.fontFamily || 'var(--font-inter)',
      fontScale: slides[0]?.fontScale || 1,
      backgroundColor: slides[0]?.backgroundColor || '#0B0F19',
      textColor: slides[0]?.textColor || '#ffffff',
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

  const handleDeleteSlide = (id: string) => {
    if (slides.length === 1) {
      alert('You need at least one slide in your project.');
      return;
    }

    const targetIndex = slides.findIndex(s => s.id === id);
    const updatedSlides = slides.filter(s => s.id !== id);
    setSlides(updatedSlides);

    if (activeSlideId === id && updatedSlides.length > 0) {
      const fallbackIndex = Math.min(targetIndex, updatedSlides.length - 1);
      setActiveSlideId(updatedSlides[fallbackIndex].id);
    }
  };

  const handleDownloadSlideImage = async (slide: SlideData, index: number) => {
    try {
      setDownloadingSlideId(slide.id);
      setSlideDownloadData(slide);

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

      // Use download API instead of link.click() to avoid "multiple files" prompt
      const blob = await (await fetch(dataUrl)).blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${getSlideFilename(slide, index)}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      setTimeout(() => window.URL.revokeObjectURL(url), 100);
    } catch (error) {
      console.error('Single slide download failed:', error);
    } finally {
      setDownloadingSlideId(null);
      setSlideDownloadData(null);
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
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: combinedSource,
          slideCount: aiSlideCount,
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
      console.error('Failed to generate slides:', error);
      // You might want to show a toast error here
    } finally {
      setIsGenerating(false);
    }
  };

  const handleToolClick = (tool: 'select' | 'text' | 'image' | 'color') => {
    setActiveTool(tool);
    if (tool === 'image') {
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
            if (activeTool === 'image') {
                 // Toolbar button: Apply to ALL slides
                 setSlides(slides.map(s => ({ ...s, backgroundImage: result })));
            } else {
                 // Properties panel button: Apply to CURRENT slide only
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

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const url = URL.createObjectURL(file);
    setSlides(slides.map(s => s.id === activeSlide.id ? { ...s, mediaUrl: url } : s));
  };

  // Helper: Capture a video frame to a base64 image
  const captureVideoFrame = async (videoSrc: string): Promise<string | null> => {
      return new Promise((resolve) => {
        const video = document.createElement('video');
        video.crossOrigin = 'anonymous'; // Try to handle CORS if possible, though blobs are local
        video.src = videoSrc;
        video.muted = true;
        video.currentTime = 1; // Capture frame at 1s
        
        video.onloadeddata = () => {
             // Wait a bit for seek
             video.currentTime = 1;
        };

        video.onseeked = () => {
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
            // Cleanup
            video.remove();
        };

        video.onerror = () => {
            console.warn('Video load error for capture');
            resolve(null);
            video.remove();
        };
      });
  };

  const handleExport = async (format: 'pdf' | 'ppt') => {
    setIsExporting(format);
    try {
      // Pre-process slides: Capture thumbnails for PDF, but keep raw blobs for PPT if needed (though standard fetch can't send blobs easily without FormData)
      const processedSlides = await Promise.all(slides.map(async (slide) => {
          // PDF Export: Always use thumbnail
          if (format === 'pdf' && slide.mediaType === 'video' && slide.mediaUrl?.startsWith('blob:')) {
              const thumbnail = await captureVideoFrame(slide.mediaUrl);
              if (thumbnail) {
                  return {
                      ...slide,
                      mediaType: 'embed',
                      embedHtml: `
                        <div style="display: flex; flex-direction: column; align-items: center; width: 100%; gap: 1rem;">
                            <img src="${thumbnail}" alt="Video Thumbnail" style="width: 100%; border-radius: 1rem; object-fit: cover; aspect-ratio: ${slide.mediaAspectRatio || 16/9}; box-shadow: 0 4px 20px rgba(0,0,0,0.3);" />
                            <a href="${slide.mediaUrl}" target="_blank" style="color: inherit; text-decoration: underline; font-size: 1rem; opacity: 0.8; font-family: monospace;">
                                Watch Video
                            </a>
                        </div>
                      `
                  };
              }
          }
          return slide;
      }));

      // Prepare FormData to handle binary uploads for PPT video embedding
      const formData = new FormData();
      const slidesPayload = processedSlides.map((slide, index) => {
           // For PPT export with local video, we need to send the file
           if (format === 'ppt' && slide.mediaType === 'video' && slide.mediaUrl?.startsWith('blob:')) {
               // We can't easily retrieve the original File object from the blob URL here 
               // unless we stored it. But we can fetch the blob content.
               return { ...slide, _hasAttachedVideo: true, _videoAttachmentIndex: index };
           }
           return slide;
      });

      // If exporting PPT, fetch and attach video blobs
      if (format === 'ppt') {
          await Promise.all(slidesPayload.map(async (slide, index) => {
              if ((slide as any)._hasAttachedVideo && slide.mediaUrl) {
                  try {
                      const blobRes = await fetch(slide.mediaUrl);
                      const blob = await blobRes.blob();
                      // Append with a unique key
                      formData.append(`video_${index}`, blob, 'video.mp4');
                  } catch (e) {
                      console.error('Failed to fetch local video blob for upload', e);
                  }
              }
          }));
      }

      const globalBackgroundImage = slidesPayload[0]?.backgroundImage;
      const allSlidesHaveSameBg = slidesPayload.every(s => s.backgroundImage === globalBackgroundImage);
      
      const finalSlidesPayload = allSlidesHaveSameBg 
        ? slidesPayload.map((slide) => {
            const clone = { ...slide };
            delete clone.backgroundImage;
            return clone;
          })
        : slidesPayload;

      formData.append('data', JSON.stringify({ 
          slides: finalSlidesPayload, 
          format,
          options: {
            category: slides[0]?.category,
            handle: slides[0]?.handle,
            accentColor: slides[0]?.accentColor,
            fontFamily: slides[0]?.fontFamily,
            backgroundColor: slides[0]?.backgroundColor,
            textColor: slides[0]?.textColor,
            backgroundImage: allSlidesHaveSameBg ? globalBackgroundImage : undefined,
            backgroundOverlayOpacity: slides[0]?.backgroundOverlayOpacity
          }
      }));

      const response = await fetch('/api/export', {
        method: 'POST',
        // headers: { 'Content-Type': 'multipart/form-data' }, // Do NOT set content-type manually with FormData, browser does it
        body: formData,
      });

      if (!response.ok) throw new Error('Export failed');

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
      console.error('Export failed:', error);
    } finally {
      setIsExporting(null);
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
            <label className="text-xs text-gray-400">Content (HTML)</label>
            <textarea
              value={activeSlide.content || ''}
              onChange={(e) => {
                const newContent = e.target.value;
                setSlides(slides.map(s => s.id === activeSlide.id ? { ...s, content: newContent } : s));
              }}
              className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#ffd700] transition resize-none h-32 font-mono"
            />
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
          )}
        </div>

        <div className="space-y-3 pt-4 border-t border-gray-700">
          <label className="text-xs text-gray-400">Media / Embeds</label>
          <select
            value={activeSlide.mediaType || 'none'}
            onChange={(e) => {
              const value = e.target.value === 'none' ? null : (e.target.value as 'video' | 'embed' | 'image');
              setSlides(slides.map(s => s.id === activeSlide.id ? {
                ...s,
                mediaType: value,
                mediaUrl: (value === 'video' || value === 'image') ? s.mediaUrl : undefined,
                embedHtml: value === 'embed' ? s.embedHtml : undefined,
              } : s));
            }}
            className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#ffd700] transition"
          >
            <option value="none">None</option>
            <option value="image">Image Block</option>
            <option value="video">Video / Map iframe</option>
            <option value="embed">Custom embed HTML</option>
          </select>

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
            <div className="space-y-2">
              <label className="text-xs text-gray-400">Video or iframe URL</label>
              <input
                type="text"
                value={activeSlide.mediaUrl || ''}
                onChange={(e) => {
                  const newUrl = e.target.value;
                  setSlides(slides.map(s => s.id === activeSlide.id ? { ...s, mediaUrl: newUrl } : s));
                }}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#ffd700] transition"
              />
              
              <div className="flex items-center gap-2 my-2">
                <div className="h-px bg-gray-700 flex-1"></div>
                <span className="text-[10px] text-gray-500 uppercase">OR</span>
                <div className="h-px bg-gray-700 flex-1"></div>
              </div>
              
              <label className="flex items-center justify-center w-full px-3 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg cursor-pointer transition group">
                <input 
                  type="file" 
                  accept="video/*" 
                  className="hidden" 
                  onChange={handleVideoUpload}
                />
                <Upload size={14} className="text-gray-400 group-hover:text-white mr-2" />
                <span className="text-xs text-gray-300 group-hover:text-white">Upload Video</span>
              </label>

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
              <p className="text-[10px] text-gray-500">
                Works best with embeddable sources like YouTube, Loom, ArcGIS, etc.
              </p>
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

        <div className="space-y-2">
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
    <div className="min-h-screen bg-[#0B0F19] text-white font-sans flex flex-col lg:h-screen lg:overflow-hidden">
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
             <span className="font-bold tracking-tight text-sm sm:text-base truncate max-w-[150px] sm:max-w-none">
                Carouslk / {projectName}
             </span>
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
                className={`p-2 rounded-lg transition ${isPropertiesPanelOpen ? 'text-[#ffd700] bg-[#ffd700]/10' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
                title="Toggle Properties Panel"
             >
                <PanelRight size={20} />
             </button>
             <div className="w-px h-6 bg-gray-800 mx-1"></div>
             <button 
                onClick={() => setIsAiModalOpen(true)}
                className="px-3 py-1.5 text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition flex items-center gap-2"
             >
                <Sparkles size={16} /> AI Generate
             </button>
             <button 
                onClick={() => setIsExportOpen(true)}
                className="px-4 py-1.5 bg-[#ffd700] hover:bg-yellow-400 text-black text-sm font-bold rounded-lg transition flex items-center gap-2"
             >
                Export <Download size={16} />
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
            <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-gray-800/90 backdrop-blur-md border border-gray-700/50 p-1.5 rounded-full flex items-center gap-1 shadow-2xl z-20">
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
                    title="Set Background Image for All Slides"
                >
                    <ImageIcon size={16} />
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
            <div className="flex-1 overflow-hidden px-4 pb-8">
                <div
                    ref={slidesScrollRef}
                    className="relative z-10 h-full overflow-y-auto snap-y snap-mandatory scroll-smooth space-y-16 pt-28 pb-32"
                >
                    {slides.map((slide) => (
                        <div
                            key={slide.id}
                            data-slide-id={slide.id}
                            onClick={() => setActiveSlideId(slide.id)}
                            className={`snap-center flex justify-center transition-opacity duration-300 ${
                                slide.id === activeSlideId ? 'opacity-100' : 'opacity-60 hover:opacity-90 cursor-pointer'
                            }`}
                        >
                            <div
                                className={`relative shadow-2xl rounded-none ring-1 ring-white/10 transform scale-[0.25] sm:scale-[0.35] md:scale-[0.45] lg:scale-[0.5] xl:scale-[0.6] transition-transform duration-300 origin-center ${
                                    slide.id === activeSlideId ? 'ring-[#ffd700]/70' : ''
                                }`}
                            >
                                <div className="w-[1080px] h-[1080px] bg-white relative overflow-hidden">
                                    <Slide
                                        {...slide}
                                        isEditable={slide.id === activeSlideId}
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
                <button
                    onClick={() => setIsMobileSlidesOpen(true)}
                    className="flex-1 px-4 py-3 rounded-2xl border border-gray-800 bg-gray-900/80 text-sm font-medium text-gray-200 flex flex-col items-center justify-center gap-1 shadow-lg"
                >
                    <span className="text-xs uppercase tracking-wider text-gray-500">Current Slide</span>
                    <span className="text-base font-semibold text-white">#{activeSlideIndex + 1} / {slides.length}</span>
                </button>
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
                  value={slides[0]?.handle || ''}
                  onChange={(e) => {
                    const newHandle = e.target.value;
                    setSlides(slides.map(s => ({ ...s, handle: newHandle })));
                  }}
                  className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#ffd700] transition"
                  placeholder="@handle"
                />
                <p className="text-xs text-gray-500">Applies to all slides</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400">Category / Series</label>
                <input 
                  type="text" 
                  value={slides[0]?.category || ''}
                  onChange={(e) => {
                    const newCategory = e.target.value;
                    setSlides(slides.map(s => ({ ...s, category: newCategory })));
                  }}
                  className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#ffd700] transition"
                  placeholder="Category"
                />
                <p className="text-xs text-gray-500">Applies to all slides</p>
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
                            onClick={() => setSlides(slides.map(s => ({ ...s, fontFamily: font.value })))}
                            className={`px-3 py-2 rounded-lg text-sm border transition ${slides[0]?.fontFamily === font.value ? 'border-[#ffd700] bg-[#ffd700]/10 text-[#ffd700]' : 'border-gray-700 hover:border-gray-500 text-gray-300'}`}
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
                                            value={slides[0]?.backgroundColor || '#0B0F19'}
                                            onChange={(e) => setSlides(slides.map(s => ({ ...s, backgroundColor: e.target.value })))}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        />
                                        <div 
                                            className="w-full h-full rounded-lg border border-gray-700 flex items-center justify-center"
                                            style={{ backgroundColor: slides[0]?.backgroundColor || '#0B0F19' }}
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
                                            value={slides[0]?.textColor || '#ffffff'}
                                            onChange={(e) => setSlides(slides.map(s => ({ ...s, textColor: e.target.value })))}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        />
                                        <div 
                                            className="w-full h-full rounded-lg border border-gray-700 flex items-center justify-center"
                                            style={{ backgroundColor: slides[0]?.textColor || '#ffffff' }}
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
                                            value={slides[0]?.accentColor || '#ffd700'}
                                            onChange={(e) => setSlides(slides.map(s => ({ ...s, accentColor: e.target.value })))}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        />
                                        <div 
                                            className="w-full h-full rounded-lg border border-gray-700 flex items-center justify-center"
                                            style={{ backgroundColor: slides[0]?.accentColor || '#ffd700' }}
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
                            onClick={() => setSlides(slides.map(s => ({ ...s, accentColor: color })))}
                            className={`w-8 h-8 rounded-full border-2 transition ${slides[0]?.accentColor === color ? 'border-white scale-110' : 'border-transparent hover:scale-105'}`}
                            style={{ backgroundColor: color }}
                        />
                    ))}
                </div>
                <p className="text-xs text-gray-500">Applies to all slides</p>
              </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-800 flex justify-end gap-3">
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="px-6 py-2.5 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="px-6 py-2.5 bg-[#ffd700] hover:bg-yellow-400 text-black font-bold rounded-xl transition"
              >
                Save Changes
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
            <button
              onClick={() => {
                setIsTemplatesOpen(true);
                setIsMobileSidebarOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-[#ffd700]/10 text-[#ffd700] border border-[#ffd700]/30 hover:bg-[#ffd700]/20 transition"
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
            
            <div className="p-6 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {THEMES.map((theme) => (
                    <div 
                        key={theme.id}
                        onClick={() => {
                            // Apply theme to all slides
                            setSlides(slides.map(s => ({
                                ...s,
                                backgroundColor: theme.backgroundColor,
                                textColor: theme.textColor,
                                accentColor: theme.accentColor,
                                fontFamily: theme.fontFamily
                            })));
                            setIsTemplatesOpen(false);
                        }}
                        className="group cursor-pointer relative bg-gray-900 rounded-xl overflow-hidden border border-gray-800 hover:border-[#ffd700] transition-all hover:shadow-xl hover:scale-[1.02]"
                    >
                        <div className="aspect-[4/3] p-6 flex flex-col justify-center items-center gap-4" style={{ backgroundColor: theme.backgroundColor }}>
                            <div className="text-center space-y-2">
                                <div className="text-2xl font-bold" style={{ color: theme.textColor, fontFamily: theme.fontFamily }}>
                                    {theme.name}
                                </div>
                                <div className="text-sm opacity-80" style={{ color: theme.textColor, fontFamily: theme.fontFamily }}>
                                    Make it <span style={{ color: theme.accentColor, fontWeight: 'bold' }}>pop</span>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                {theme.previewColors.map((color, i) => (
                                    <div key={i} className="w-6 h-6 rounded-full border border-white/20 shadow-sm" style={{ backgroundColor: color }}></div>
                                ))}
                            </div>
                        </div>
                        <div className="p-3 bg-gray-900 border-t border-gray-800 flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-300">{theme.name}</span>
                            <span className="text-xs text-[#ffd700] opacity-0 group-hover:opacity-100 transition">Apply Theme →</span>
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

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Target slide count
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={3}
                    max={15}
                    step={1}
                    value={aiSlideCount}
                    onChange={(e) => setAiSlideCount(parseInt(e.target.value, 10))}
                    className="flex-1"
                    style={{ accentColor: '#ffd700' }}
                  />
                  <input
                    type="number"
                    min={3}
                    max={15}
                    value={aiSlideCount}
                    onChange={(e) => {
                      const value = parseInt(e.target.value, 10);
                      if (Number.isNaN(value)) return;
                      setAiSlideCount(Math.min(15, Math.max(3, value)));
                    }}
                    className="w-16 bg-gray-900/50 border border-gray-700 rounded-xl px-2 py-1 text-white text-center focus:outline-none focus:border-[#ffd700] transition"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Choose between 3 and 15 slides for AI output.
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
    </div>
  );
}

