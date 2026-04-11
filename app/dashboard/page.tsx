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
import { BOLD_TEMPLATES } from '@/lib/templates';
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

import { useSlideEditor } from '@/lib/hooks/dashboard/useSlideEditor';
import { useUiState } from '@/lib/hooks/dashboard/useUiState';
import { useBrandSettings } from '@/lib/hooks/dashboard/useBrandSettings';
import { useAiGenerator } from '@/lib/hooks/dashboard/useAiGenerator';
import { useExportManager } from '@/lib/hooks/dashboard/useExportManager';

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
  const { status } = useSession();
  const appContext = useAppContextSafe();
  const projectId = searchParams.get('project') || undefined;

  const [copyingSlideId, setCopyingSlideId] = useState<string | null>(null);
  const [downloadingSlideId, setDownloadingSlideId] = useState<string | null>(null);
  const slideRefs = useRef<Record<string, HTMLDivElement | null>>({});


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

  if (status === 'unauthenticated') return null;

  return (
    <div className="h-screen bg-[#0B0F19] text-white flex flex-col overflow-hidden font-sans">
      {/* Header */}
      <header className="h-16 border-b border-[var(--border)] bg-[var(--surface-1)]/80 backdrop-blur-md flex items-center px-6 justify-between shrink-0 z-50">
        <div className="flex items-center gap-6">
          <Link href="/" className="p-2 hover:bg-[var(--surface-2)] rounded-xl transition">
            <ChevronLeft size={20} className="text-[var(--text-muted)] hover:text-white" />
          </Link>
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 bg-[var(--accent)] rounded-xl rotate-6 flex items-center justify-center shadow-[0_0_20px_rgba(var(--accent-rgb),0.3)]">
                <span className="text-black font-black text-sm">S</span>
             </div>
             <div>
               <h1 className="font-black tracking-tight text-lg leading-none">SlideCraft</h1>
               <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest mt-1">
                 {editor.projectName || 'Untitled Project'}
               </p>
             </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center bg-[var(--surface-2)] rounded-xl p-1 border border-[var(--border-hover)]">
            <button onClick={editor.undo} disabled={!editor.canUndo} className="p-2 hover:bg-[var(--surface-3)] rounded-lg disabled:opacity-20 transition">
              <Undo2 size={18} />
            </button>
            <button onClick={editor.redo} disabled={!editor.canRedo} className="p-2 hover:bg-[var(--surface-3)] rounded-lg disabled:opacity-20 transition">
              <Redo2 size={18} />
            </button>
          </div>
          
          <button 
            onClick={() => ui.setIsAiModalOpen(true)}
            className="px-6 py-2.5 bg-gradient-to-br from-[var(--accent)] to-amber-500 hover:scale-105 active:scale-95 text-black text-sm font-black rounded-xl transition duration-300 flex items-center gap-2 shadow-[0_0_30px_rgba(var(--accent-rgb),0.3)]"
          >
            <Sparkles size={18} />
            Magic Create
          </button>
          
          <button 
            onClick={() => ui.setIsExportOpen(true)}
            className="px-5 py-2.5 bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-white text-sm font-bold rounded-xl transition flex items-center gap-2 border border-[var(--border-hover)]"
          >
            <Download size={18} />
            Export
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex flex-1 overflow-hidden">
        {/* Activity Bar */}
        <aside className="w-20 border-r border-[var(--border)] bg-[var(--surface-1)] flex flex-col items-center py-6 gap-6 z-40">
          <button onClick={() => ui.setIsAiModalOpen(true)} className="w-12 h-12 bg-[var(--accent)]/10 text-[var(--accent)] rounded-2xl flex items-center justify-center hover:scale-110 transition active:scale-95 border border-[var(--accent)]/20 shadow-lg shadow-[var(--accent)]/5">
            <Sparkles size={24} />
          </button>
          <div className="w-8 h-px bg-[var(--border)] opacity-30" />
          <button onClick={() => ui.setIsSettingsOpen(true)} className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${ui.isSettingsOpen ? 'bg-[var(--accent)] text-black shadow-lg shadow-[var(--accent)]/30' : 'text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-white'}`}>
            <Palette size={22} />
          </button>
          <button className="w-12 h-12 rounded-2xl flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-white transition-all">
            <Layout size={22} />
          </button>
          <button onClick={() => ui.setIsExportOpen(true)} className="w-12 h-12 rounded-2xl flex items-center justify-center text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-white transition-all mt-auto">
            <Download size={22} />
          </button>
        </aside>

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
          onCopySlide={() => {}}
          onDownloadSlide={() => {}}
          onPreviewImage={ui.setPreviewImageUrl}
          copyingSlideId={copyingSlideId}
          downloadingSlideId={downloadingSlideId}
          slideRefs={slideRefs}
        />

        {/* Canvas Area */}
        <main className="flex-1 relative bg-[#080B14] overflow-hidden flex flex-col">
          {/* Subtle Grid Pattern */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
               style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 0)', backgroundSize: '40px 40px' }} />
          
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-12 scroll-smooth custom-scrollbar">
            <div className="max-w-4xl mx-auto flex flex-col items-center gap-24 pb-48">
              {slides.map((slide, index) => (
                <div 
                  key={slide.id}
                  id={`slide-${slide.id}`}
                  onClick={() => setActiveSlideId(slide.id)}
                  className={`relative group transition-all duration-700 ease-out transform ${
                    slide.id === activeSlideId 
                      ? 'scale-100 opacity-100 z-10' 
                      : 'scale-[0.85] opacity-20 hover:opacity-40 grayscale blur-[2px] cursor-pointer'
                  }`}
                >
                  {/* Floating Slide Index Indicator */}
                  <div className="absolute -left-16 top-0 h-full flex flex-col items-center">
                    <span className={`text-4xl font-black transition-colors duration-500 ${slide.id === activeSlideId ? 'text-[var(--accent)]' : 'text-[var(--text-muted)] opacity-20'}`}>
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <div className={`w-0.5 flex-1 my-4 rounded-full transition-colors duration-500 ${slide.id === activeSlideId ? 'bg-[var(--accent)]/50' : 'bg-[var(--border)] opacity-20'}`} />
                  </div>

                  <div className={`p-1 rounded-[40px] transition-all duration-500 bg-gradient-to-br ${slide.id === activeSlideId ? 'from-[var(--accent)] to-transparent shadow-[0_40px_100px_rgba(0,0,0,0.8)]' : 'from-transparent to-transparent'}`}>
                    <div className="rounded-[38px] overflow-hidden shadow-2xl relative">
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
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-[var(--surface-2)]/90 backdrop-blur-xl border border-[var(--border-hover)] rounded-2xl px-6 py-3 flex items-center gap-8 shadow-2xl z-40 animate-in slide-in-from-bottom-4 duration-500">
             <div className="flex items-center gap-3 pr-8 border-r border-[var(--border-hover)]">
                <span className="text-[10px] font-black uppercase text-[var(--accent)] tracking-widest">Active Slide</span>
                <span className="text-sm font-bold text-white">
                  {slides.findIndex(s => s.id === activeSlideId) + 1} of {slides.length}
                </span>
             </div>
             
             <div className="flex items-center gap-4">
                <button onClick={editor.addSlide} className="flex items-center gap-2 text-xs font-bold text-[var(--text-muted)] hover:text-white transition">
                   <Plus size={16} /> Add Slide
                </button>
                <div className="w-1 h-1 rounded-full bg-[var(--text-muted)]" />
                <button onClick={() => ui.setIsAiModalOpen(true)} className="flex items-center gap-2 text-xs font-bold text-[var(--accent)] hover:text-[var(--accent-hover)] transition">
                   <Sparkles size={16} /> Magic Refine
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
        exportManager={exporter}
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
