"use client";

import React, { useState, useRef, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
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
// Core feature components
import { ExportModal } from '@/components/Dashboard/Modals/ExportModal';
import { SettingsModal } from '@/components/Dashboard/Modals/SettingsModal';
import { AiGeneratorModal } from '@/components/Dashboard/Modals/AiGeneratorModal';
import { ImagePickerModal } from '@/components/ImagePickerModal';
import { ThemeGalleryModal } from '@/components/ThemeGalleryModal';
import { SlideListSidebar } from '@/components/SlideListSidebar';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { SlideData, InfographicData, ElementPosition, CustomBlock, ProjectOptions } from '@/lib/types';

interface UnsplashPhoto {
  id: string;
  urls: { thumb: string; small: string; regular: string; full: string };
  alt_description: string | null;
  color: string;
  user: { name: string; username: string };
  width: number;
  height: number;
}

const lazyToPng = (node: HTMLElement, options?: Record<string, unknown>) =>
  import('html-to-image').then(m => m.toPng(node, options));

const sanitizeEmoji = (value: string | undefined | null) => {
  if (!value) return '';
  return value
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .trim();
};

const dataUrlToBlob = async (dataUrl: string) => {
  const response = await fetch(dataUrl);
  return response.blob();
};

import { useSlideEditor } from '@/lib/hooks/dashboard/useSlideEditor';
import { useUiState } from '@/lib/hooks/dashboard/useUiState';
import { useBrandSettings } from '@/lib/hooks/dashboard/useBrandSettings';
import { useAiGenerator } from '@/lib/hooks/dashboard/useAiGenerator';
import { useExportManager } from '@/lib/hooks/dashboard/useExportManager';
import { createGeneralSampleSlides, type OutputPreset, type PlatformTarget } from '@/lib/authorityCarousel';

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
      if (document.activeElement !== divRef.current) {
        divRef.current.innerHTML = content;
      }
      lastContentRef.current = content;
    }
  }, [slideId, content]);

  useEffect(() => {
    if (divRef.current) {
      divRef.current.innerHTML = content;
    }
  }, [slideId]);

  const handleInput = useCallback(() => {
    if (divRef.current && !isComposingRef.current) {
      const newContent = divRef.current.innerHTML;
      lastContentRef.current = newContent;
      onChange(newContent);
    }
  }, [onChange]);

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
  const { status } = useSession();
  const appContext = useAppContextSafe();
  const projectId = searchParams.get('project') || undefined;

  const [copyingSlideId, setCopyingSlideId] = useState<string | null>(null);
  const [downloadingSlideId, setDownloadingSlideId] = useState<string | null>(null);
  const [quickPrompt, setQuickPrompt] = useState('');
  const [quickPreset, setQuickPreset] = useState<OutputPreset>('General Carousel');
  const [quickPlatform, setQuickPlatform] = useState<PlatformTarget>('Auto');
  const slideRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const sidebarSlideRefs = useRef<Record<string, HTMLDivElement | null>>({});


  // --- Initializing Modular Hooks ---
  const ui = useUiState();
  const brand = useBrandSettings();
  const editor = useSlideEditor();
  const ai = useAiGenerator({
    slides: editor.slides,
    setSlides: editor.setSlides,
    brandSettings: brand.brandSettings,
    setBrandSettings: brand.setBrandSettings,
    setActiveSlideId: editor.setActiveSlideId,
    setIsAiModalOpen: ui.setIsAiModalOpen,
    addToHistory: () => {} // Temporary placeholder
  });
  const exporter = useExportManager();

  const { slides, activeSlideId, setActiveSlideId } = editor;

  useEffect(() => {
    if (slides.length > 0) return;

    editor.initializeSlides(createGeneralSampleSlides(brand.brandSettings));
  }, [brand.brandSettings, editor, slides.length]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login?next=/dashboard');
    }
  }, [router, status]);

  // Sync scroll on active slide change
  useEffect(() => {
    if (activeSlideId) {
      const element = document.getElementById(`slide-${activeSlideId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [activeSlideId]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[var(--surface-1)] text-white flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-[var(--accent)]" />
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-[var(--surface-1)] text-white flex flex-col items-center justify-center gap-3">
        <Loader2 size={32} className="animate-spin text-[var(--accent)]" />
        <p className="text-sm text-[var(--text-muted)]">Taking you to login...</p>
      </div>
    );
  }

  const applyQuickPreset = (preset: typeof quickPreset) => {
    setQuickPreset(preset);
    ai.applyPreset(preset);
  };

  const applyQuickPlatform = (platform: PlatformTarget) => {
    setQuickPlatform(platform);
    ai.setAiPlatformTarget(platform);
  };

  const handleQuickGenerate = () => {
    ai.applyPreset(quickPreset);
    ai.setAiPlatformTarget(quickPlatform);
    void ai.handleGenerateCarousel(quickPrompt);
  };

  const handleUseSample = () => {
    const sampleSlides = createGeneralSampleSlides(brand.brandSettings);
    editor.initializeSlides(sampleSlides);
    setActiveSlideId(sampleSlides[0]?.id || '');
    toast.success('Sample loaded');
  };

  const captureSlidePng = async (slideId: string) => {
    const node = slideRefs.current[slideId];
    if (!node) throw new Error('Slide is not ready yet');

    return lazyToPng(node, {
      cacheBust: true,
      pixelRatio: 2,
      backgroundColor: '#0B0F19',
    });
  };

  const handleCopySlide = async (slide: SlideData) => {
    setActiveSlideId(slide.id);
    setCopyingSlideId(slide.id);
    try {
      await new Promise(resolve => requestAnimationFrame(resolve));
      const png = await captureSlidePng(slide.id);
      const blob = await dataUrlToBlob(png);
      if (!navigator.clipboard || typeof ClipboardItem === 'undefined') {
        throw new Error('Clipboard image copy is not supported in this browser');
      }
      await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
      toast.success('Slide copied');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to copy slide');
    } finally {
      setCopyingSlideId(null);
    }
  };

  const handleDownloadSlide = async (slide: SlideData, index: number) => {
    setActiveSlideId(slide.id);
    setDownloadingSlideId(slide.id);
    try {
      await new Promise(resolve => requestAnimationFrame(resolve));
      const png = await captureSlidePng(slide.id);
      const link = document.createElement('a');
      link.href = png;
      link.download = `slide-${String(index + 1).padStart(2, '0')}.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Slide downloaded');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to download slide');
    } finally {
      setDownloadingSlideId(null);
    }
  };

  const handleExportImages = async () => {
    if (slides.length === 0) return;
    exporter.setIsExporting(true);
    exporter.setExportProgress({ current: 0, total: slides.length, status: 'Rendering images...' });
    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();

      for (let index = 0; index < slides.length; index++) {
        const slide = slides[index];
        setActiveSlideId(slide.id);
        await new Promise(resolve => requestAnimationFrame(resolve));
        const png = await captureSlidePng(slide.id);
        zip.file(`slide-${String(index + 1).padStart(2, '0')}.png`, png.split(',')[1], { base64: true });
        exporter.setExportProgress({ current: index + 1, total: slides.length, status: 'Rendering images...' });
      }

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${editor.projectName || 'carousel'}-images.zip`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success('Image bundle exported');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to export images');
    } finally {
      exporter.setIsExporting(false);
    }
  };

  const exportManager = {
    ...exporter,
    handleExportPDF: () => exporter.handleExportToPdf(slides, editor.projectName || 'carousel', 'pdf'),
    handleExportImages,
  };

  const readyChecks = [
    { label: 'Hook slide', done: slides.length > 0 && Boolean(slides[0]?.title?.replace(/<[^>]*>/g, '').trim()) },
    { label: 'Enough slides', done: slides.length >= 4 },
    { label: 'Clear body text', done: slides.slice(1).every(slide => (slide.content || slide.subtitle || '').replace(/<[^>]*>/g, '').trim().length > 35) },
    { label: 'Ready to download', done: slides.length > 0 },
  ];
  const readyCount = readyChecks.filter(check => check.done).length;

  return (
    <div className="h-screen bg-[#0B0F19] text-white flex flex-col overflow-hidden font-sans">
      {/* Header */}
      <header className="min-h-20 border-b border-[var(--border)] bg-[var(--surface-1)]/95 backdrop-blur-md flex flex-col gap-4 px-4 py-4 shrink-0 z-50 lg:flex-row lg:items-center lg:justify-between lg:px-6">
        <div className="flex items-center gap-4">
          <Link href="/" className="p-2 hover:bg-[var(--surface-2)] rounded-lg transition" title="Back home">
            <ChevronLeft size={20} className="text-[var(--text-muted)] hover:text-white" />
          </Link>
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 bg-[var(--accent)] rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(var(--accent-rgb),0.25)]">
                <span className="text-black font-black text-sm">S</span>
             </div>
             <div>
               <h1 className="font-black tracking-tight text-lg leading-none">Carouslk Studio</h1>
               <p className="text-xs text-[var(--text-muted)] font-medium mt-1">
                 {editor.projectName || 'Untitled Project'}
               </p>
             </div>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 lg:gap-3">
          <div className="flex items-center bg-[var(--surface-2)] rounded-lg p-1 border border-[var(--border-hover)]">
            <button onClick={editor.undo} disabled={!editor.canUndo} className="p-2 hover:bg-[var(--surface-3)] rounded-md disabled:opacity-20 transition" title="Undo">
              <Undo2 size={18} />
            </button>
            <button onClick={editor.redo} disabled={!editor.canRedo} className="p-2 hover:bg-[var(--surface-3)] rounded-md disabled:opacity-20 transition" title="Redo">
              <Redo2 size={18} />
            </button>
          </div>

          <button
            onClick={() => ui.setIsSettingsOpen(true)}
            className="px-4 py-2.5 bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-white text-sm font-bold rounded-lg transition flex items-center gap-2 border border-[var(--border-hover)]"
          >
            <Palette size={18} />
            Brand
          </button>
          
          <button 
            onClick={() => ui.setIsAiModalOpen(true)}
            className="px-5 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-black text-sm font-black rounded-lg transition flex items-center gap-2 shadow-[0_0_24px_rgba(var(--accent-rgb),0.22)]"
          >
            <Sparkles size={18} />
            New Draft
          </button>
          
          <button 
            onClick={() => ui.setIsExportOpen(true)}
            className="px-5 py-2.5 bg-white hover:bg-gray-100 text-black text-sm font-bold rounded-lg transition flex items-center gap-2"
          >
            <Download size={18} />
            Download
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex flex-1 overflow-hidden">
        {/* Slide List Sidebar */}
        <SlideListSidebar
          slides={slides}
          activeSlideId={activeSlideId}
          onSelectSlide={setActiveSlideId}
          onAddSlide={() => editor.addSlide(brand.brandSettings)}
          onMoveSlide={(id, direction) => {
             const currentIndex = slides.findIndex(s => s.id === id);
             if (direction === 'up' && currentIndex > 0) {
               const newSlides = [...slides];
               const temp = newSlides[currentIndex - 1];
               newSlides[currentIndex - 1] = newSlides[currentIndex];
               newSlides[currentIndex] = temp;
               editor.setSlides(newSlides);
             } else if (direction === 'down' && currentIndex < slides.length - 1) {
               const newSlides = [...slides];
               const temp = newSlides[currentIndex + 1];
               newSlides[currentIndex + 1] = newSlides[currentIndex];
               newSlides[currentIndex] = temp;
               editor.setSlides(newSlides);
             }
          }}
          onDuplicateSlide={(id) => editor.handleDuplicateSlide(id, editor.updateSlides)}
          onDeleteSlide={(id) => editor.handleDeleteSlide(id, editor.updateSlides)}
          onCopySlide={handleCopySlide}
          onDownloadSlide={handleDownloadSlide}
          onPreviewImage={ui.setPreviewImageUrl}
          copyingSlideId={copyingSlideId}
          downloadingSlideId={downloadingSlideId}
          slideRefs={sidebarSlideRefs}
        />

        {/* Canvas Area */}
        <main className="flex-1 relative bg-[#080B14] overflow-hidden flex flex-col">
          <div className="shrink-0 border-b border-[var(--border)] bg-[#0B0F19] px-4 py-3 lg:px-8">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-bold text-white">Edit your carousel</p>
                <p className="text-xs text-[var(--text-muted)] mt-1">Click any text on the slide to change it. Use the left panel to reorder or duplicate slides.</p>
              </div>
              <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                <span className="rounded-full bg-[var(--surface-2)] px-3 py-1 border border-[var(--border)]">1. Create</span>
                <span className="rounded-full bg-[var(--surface-2)] px-3 py-1 border border-[var(--border)]">2. Edit</span>
                <span className="rounded-full bg-[var(--surface-2)] px-3 py-1 border border-[var(--border)]">3. Download</span>
              </div>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-5 scroll-smooth custom-scrollbar lg:p-10">
            <div className="max-w-4xl mx-auto flex flex-col items-center gap-14 pb-32">
              <section className="w-full rounded-2xl border border-[var(--border-hover)] bg-[var(--surface-1)] p-4 shadow-2xl lg:p-6">
                <div className="flex flex-col gap-4">
                  <div>
                    <h2 className="text-xl font-black tracking-tight text-white lg:text-2xl">Paste your idea, article, or notes.</h2>
                    <p className="mt-1 text-sm text-[var(--text-muted)]">Create a first draft, then edit any text directly on the slides.</p>
                  </div>

                  <textarea
                    value={quickPrompt}
                    onChange={(event) => setQuickPrompt(event.target.value)}
                    placeholder="Example: How local restaurants can get more Google reviews from happy customers"
                    className="min-h-36 w-full resize-none rounded-xl border border-[var(--border-hover)] bg-[#080B14] px-4 py-4 text-base text-white outline-none transition focus:border-[var(--accent)]"
                  />

                  <div className="space-y-2">
                    <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)]">Where will you post or use it?</p>
                    <div className="flex flex-wrap gap-2">
                      {(['Auto', 'LinkedIn', 'Instagram', 'Sales Deck', 'Education'] as const).map((platform) => (
                        <button
                          key={platform}
                          onClick={() => applyQuickPlatform(platform)}
                          className={`rounded-full border px-3 py-2 text-xs font-bold transition ${
                            quickPlatform === platform
                              ? 'border-white bg-white text-black'
                              : 'border-[var(--border-hover)] bg-[var(--surface-2)] text-[var(--text-secondary)] hover:text-white'
                          }`}
                        >
                          {platform}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex flex-wrap gap-2">
                      {(['General Carousel', 'Educational', 'Sales', 'Tips/Listicle', 'Founder LinkedIn', 'Authority LinkedIn'] as const).map((preset) => (
                        <button
                          key={preset}
                          onClick={() => applyQuickPreset(preset)}
                          className={`rounded-full border px-3 py-2 text-xs font-bold transition ${
                            quickPreset === preset
                              ? 'border-[var(--accent)] bg-[var(--accent)] text-black'
                              : 'border-[var(--border-hover)] bg-[var(--surface-2)] text-[var(--text-secondary)] hover:text-white'
                          }`}
                        >
                          {preset}
                        </button>
                      ))}
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row">
                      <button
                        onClick={handleUseSample}
                        className="rounded-lg border border-[var(--border-hover)] bg-[var(--surface-2)] px-4 py-3 text-sm font-bold text-white transition hover:bg-[var(--surface-3)]"
                      >
                        Use this sample
                      </button>
                      <button
                        onClick={handleQuickGenerate}
                        disabled={ai.isGenerating || !quickPrompt.trim()}
                        className="rounded-lg bg-[var(--accent)] px-5 py-3 text-sm font-black text-black transition hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {ai.isGenerating ? 'Creating...' : 'Create Carousel'}
                      </button>
                    </div>
                  </div>

                  {(ai.isGenerating || ai.generationStatus || ai.generationError) && (
                    <div className={`rounded-xl border px-4 py-3 text-sm ${
                      ai.generationError
                        ? 'border-red-500/30 bg-red-500/10 text-red-200'
                        : 'border-[var(--accent)]/30 bg-[var(--accent)]/10 text-[var(--text-secondary)]'
                    }`}>
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <span className="flex items-center gap-2">
                          {ai.isGenerating && <Loader2 size={16} className="animate-spin text-[var(--accent)]" />}
                          {ai.generationError || ai.generationStatus || 'Creating your carousel. This usually takes about a minute.'}
                        </span>
                        {ai.generationError && (
                          <button
                            onClick={ai.retryLastGeneration}
                            className="rounded-lg bg-white px-3 py-2 text-xs font-black text-black transition hover:bg-gray-100"
                          >
                            Try again
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </section>

              {slides.length === 0 && (
                <div className="w-full rounded-2xl border border-dashed border-[var(--border-hover)] bg-[var(--surface-1)]/60 px-6 py-12 text-center">
                  <p className="text-lg font-bold text-white">No carousel yet</p>
                  <p className="mt-2 text-sm text-[var(--text-muted)]">Paste an idea above or load the sample deck to start editing.</p>
                </div>
              )}

              {slides.length > 0 && (
                <section className="w-full rounded-2xl border border-[var(--border-hover)] bg-[var(--surface-1)] p-4 lg:p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="text-sm font-black text-white">Ready-to-post check</p>
                      <p className="mt-1 text-xs text-[var(--text-muted)]">{readyCount} of {readyChecks.length} basics are ready. Edit any weak slide before downloading.</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {readyChecks.map((check) => (
                        <span
                          key={check.label}
                          className={`rounded-full border px-3 py-1.5 text-xs font-bold ${
                            check.done
                              ? 'border-green-500/30 bg-green-500/10 text-green-300'
                              : 'border-yellow-500/30 bg-yellow-500/10 text-yellow-200'
                          }`}
                        >
                          {check.done ? '✓ ' : '! '}{check.label}
                        </span>
                      ))}
                    </div>
                  </div>
                </section>
              )}

              {slides.map((slide, index) => (
                <div 
                  key={slide.id}
                  id={`slide-${slide.id}`}
                  onClick={() => setActiveSlideId(slide.id)}
                  className={`relative group transition-all duration-300 ease-out transform ${
                    slide.id === activeSlideId 
                      ? 'scale-100 opacity-100 z-10' 
                      : 'scale-[0.96] opacity-70 hover:opacity-90 cursor-pointer'
                  }`}
                >
                  {/* Floating Slide Index Indicator */}
                  <div className="absolute -left-3 -top-3 z-20 lg:-left-14 lg:top-0 lg:h-full lg:flex lg:flex-col lg:items-center">
                    <span className={`flex h-9 w-9 items-center justify-center rounded-full border text-sm font-black transition-colors duration-300 lg:h-auto lg:w-auto lg:border-0 lg:text-3xl ${slide.id === activeSlideId ? 'bg-[var(--accent)] text-black border-[var(--accent)] lg:bg-transparent lg:text-[var(--accent)]' : 'bg-[var(--surface-2)] text-[var(--text-muted)] border-[var(--border)] lg:bg-transparent lg:opacity-50'}`}>
                      {index + 1}
                    </span>
                    <div className={`hidden lg:block w-0.5 flex-1 my-4 rounded-full transition-colors duration-300 ${slide.id === activeSlideId ? 'bg-[var(--accent)]/50' : 'bg-[var(--border)] opacity-20'}`} />
                  </div>

                  <div className={`p-1 rounded-3xl transition-all duration-300 ${slide.id === activeSlideId ? 'bg-[var(--accent)] shadow-[0_24px_70px_rgba(0,0,0,0.55)]' : 'bg-transparent'}`}>
                    <div
                      ref={(el) => { slideRefs.current[slide.id] = el; }}
                      className="rounded-[22px] overflow-hidden shadow-2xl relative"
                    >
                      <Slide 
                        {...slide} 
                        isEditable={slide.id === activeSlideId}
                        onUpdate={(field, value) => {
                          editor.setSlides(prev => prev.map(s => s.id === slide.id ? { ...s, [field]: value } : s));
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Context Bar */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-[var(--surface-2)]/95 backdrop-blur-xl border border-[var(--border-hover)] rounded-xl px-4 py-3 flex items-center gap-5 shadow-2xl z-40">
             <div className="flex items-center gap-2 pr-5 border-r border-[var(--border-hover)]">
                <span className="text-xs font-bold text-[var(--accent)]">Slide</span>
                <span className="text-sm font-bold text-white">
                  {slides.findIndex(s => s.id === activeSlideId) + 1} of {slides.length}
                </span>
             </div>
             
             <div className="flex items-center gap-4">
                <button onClick={() => editor.addSlide(brand.brandSettings)} className="flex items-center gap-2 text-xs font-bold text-[var(--text-muted)] hover:text-white transition">
                   <Plus size={16} /> Add Slide
                </button>
                <div className="w-1 h-1 rounded-full bg-[var(--text-muted)]" />
                <button onClick={() => ui.setIsAiModalOpen(true)} className="flex items-center gap-2 text-xs font-bold text-[var(--accent)] hover:text-[var(--accent-hover)] transition">
                   <Sparkles size={16} /> New Draft
                </button>
             </div>
          </div>
        </main>
      </div>

      {/* Modular Modals */}
      <AiGeneratorModal 
        isOpen={ui.isAiModalOpen} 
        onClose={() => ui.setIsAiModalOpen(false)} 
        aiGenerator={ai} 
      />
      
      <ExportModal 
        isOpen={ui.isExportOpen} 
        onClose={() => ui.setIsExportOpen(false)} 
        exportManager={exportManager}
        projectName={editor.projectName || 'carousel'}
      />

      <SettingsModal 
        isOpen={ui.isSettingsOpen} 
        onClose={() => ui.setIsSettingsOpen(false)} 
        brandSettings={brand}
      />
      
      {/* Toast and Global UI */}
      <ErrorBoundary section="Global Modals"><></></ErrorBoundary>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="h-screen bg-[#0B0F19] flex items-center justify-center">
        <Loader2 className="animate-spin text-[var(--accent)]" />
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
