'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Plus, ChevronUp, ChevronDown, Copy, Clipboard,
  Download, ZoomIn, Trash2, Loader2, RefreshCw, Sparkles, Send, MoreHorizontal,
} from 'lucide-react';
import { Slide } from '@/components/Slide';
import type { SlideData } from '@/lib/types';

interface SlideListSidebarProps {
  slides: SlideData[];
  activeSlideId: string;
  onSelectSlide: (id: string) => void;
  onAddSlide: () => void;
  onMoveSlide: (id: string, direction: 'up' | 'down') => void;
  onDuplicateSlide: (id: string) => void;
  onCopySlide: (slide: SlideData, index: number) => void;
  onDownloadSlide: (slide: SlideData, index: number) => void;
  onDeleteSlide: (id: string) => void;
  onRegenerateSlide?: (id: string, instruction?: string) => void;
  regeneratingSlideId?: string | null;
  onPreviewImage: (url: string | null) => void;
  copyingSlideId: string | null;
  downloadingSlideId: string | null;
  slideRefs: React.MutableRefObject<Record<string, HTMLDivElement | null>>;
}

const QUICK_ACTIONS = [
  'Make it punchier',
  'Add statistics',
  'Simplify',
  'More persuasive',
];

export const SlideListSidebar = React.memo(function SlideListSidebar({
  slides,
  activeSlideId,
  onSelectSlide,
  onAddSlide,
  onMoveSlide,
  onDuplicateSlide,
  onCopySlide,
  onDownloadSlide,
  onDeleteSlide,
  onRegenerateSlide,
  regeneratingSlideId,
  onPreviewImage,
  copyingSlideId,
  downloadingSlideId,
  slideRefs,
}: SlideListSidebarProps) {
  const [refineSlideId, setRefineSlideId] = useState<string | null>(null);
  const [refineText, setRefineText] = useState('');
  const [openMenuSlideId, setOpenMenuSlideId] = useState<string | null>(null);
  const refineInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (refineSlideId && refineInputRef.current) {
      refineInputRef.current.focus();
    }
  }, [refineSlideId]);

  const handleRefineSubmit = (slideId: string) => {
    if (!onRegenerateSlide) return;
    const instruction = refineText.trim();
    onRegenerateSlide(slideId, instruction || undefined);
    setRefineSlideId(null);
    setRefineText('');
  };

  return (
    <div className="hidden lg:flex w-72 border-r border-[var(--border)] bg-[var(--surface-1)] flex-col shrink-0">
      <div className="p-4 border-b border-[var(--border)] flex justify-between items-center">
        <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
          Slides ({slides.length})
        </span>
        <button
          onClick={onAddSlide}
          className="w-6 h-6 bg-[var(--surface-3)] hover:bg-[var(--surface-2)] rounded flex items-center justify-center text-[var(--text-muted)] hover:text-white transition"
          title="Add new slide (Ctrl+Enter)"
          aria-label="Add new slide"
        >
          <Plus size={14} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            ref={(el) => { slideRefs.current[slide.id] = el; }}
            onClick={() => onSelectSlide(slide.id)}
            className={`group relative cursor-pointer rounded-xl transition-all duration-200 border ${
              activeSlideId === slide.id
                ? 'bg-[var(--surface-2)]/50 border-[var(--accent)]/50 shadow-lg'
                : 'border-transparent hover:bg-[var(--surface-2)]/30 hover:border-[var(--border)]'
            }`}
          >
            <div className="p-3">
              {/* Header row */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-[var(--text-muted)]">Slide {index + 1}</span>
                  {activeSlideId === slide.id && (
                    <div className="w-1.5 h-1.5 bg-[var(--accent)] rounded-full shadow-[0_0_5px_var(--accent)]" />
                  )}
                </div>
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition">
                  <button
                    onClick={(e) => { e.stopPropagation(); onMoveSlide(slide.id, 'up'); }}
                    disabled={index === 0}
                    className="p-1 rounded text-gray-500 hover:text-white hover:bg-[var(--surface-3)] transition disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Move up (Ctrl+Shift+Up)"
                    aria-label="Move slide up"
                  >
                    <ChevronUp size={12} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onMoveSlide(slide.id, 'down'); }}
                    disabled={index === slides.length - 1}
                    className="p-1 rounded text-gray-500 hover:text-white hover:bg-[var(--surface-3)] transition disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Move down (Ctrl+Shift+Down)"
                    aria-label="Move slide down"
                  >
                    <ChevronDown size={12} />
                  </button>
                </div>
              </div>

              {/* Mini preview */}
              <div className="aspect-[4/5] bg-[var(--surface-0)] rounded-lg border border-[var(--border)]/50 relative overflow-hidden group-hover:border-[var(--border)] transition flex items-start justify-center pt-1">
                <div className="transform scale-[0.15] origin-top pointer-events-none">
                  <Slide {...slide} />
                </div>
              </div>

              {/* AI Refine panel */}
              {refineSlideId === slide.id && (
                <div
                  className="mt-2 bg-[var(--surface-0)] rounded-lg border border-[var(--accent)]/30 p-2 space-y-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex gap-1.5 flex-wrap">
                    {QUICK_ACTIONS.map((action) => (
                      <button
                        key={action}
                        onClick={() => {
                          if (onRegenerateSlide) {
                            onRegenerateSlide(slide.id, action);
                            setRefineSlideId(null);
                            setRefineText('');
                          }
                        }}
                        disabled={regeneratingSlideId !== null}
                        className="text-[10px] px-2 py-1 rounded-full bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition disabled:opacity-40"
                      >
                        {action}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-1">
                    <input
                      ref={refineInputRef}
                      type="text"
                      value={refineText}
                      onChange={(e) => setRefineText(e.target.value)}
                      onKeyDown={(e) => {
                        e.stopPropagation();
                        if (e.key === 'Enter') handleRefineSubmit(slide.id);
                        if (e.key === 'Escape') { setRefineSlideId(null); setRefineText(''); }
                      }}
                      placeholder="e.g. 'add a quote' or 'more data'"
                      className="flex-1 text-xs bg-[var(--surface-2)] border border-[var(--border)] rounded-md px-2 py-1.5 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)]"
                      disabled={regeneratingSlideId !== null}
                    />
                    <button
                      onClick={() => handleRefineSubmit(slide.id)}
                      disabled={regeneratingSlideId !== null}
                      className="p-1.5 rounded-md bg-[var(--accent)] text-white hover:opacity-90 transition disabled:opacity-40"
                      title="Send refinement"
                    >
                      <Send size={12} />
                    </button>
                  </div>
                </div>
              )}

              {/* Actions row */}
              <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                <span className="uppercase tracking-wide text-[10px]">{slide.type}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenMenuSlideId(openMenuSlideId === slide.id ? null : slide.id);
                  }}
                  className="rounded-md border border-[var(--border)] p-1.5 text-[var(--text-secondary)] opacity-0 transition hover:border-[var(--accent)] hover:text-white group-hover:opacity-100"
                  title="Slide actions"
                  aria-label="Slide actions"
                >
                  <MoreHorizontal size={14} />
                </button>
                {openMenuSlideId === slide.id && (
                <div
                  className="absolute right-3 bottom-10 z-30 grid grid-cols-3 gap-1.5 rounded-xl border border-[var(--border-hover)] bg-[var(--surface-1)] p-2 shadow-2xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  {onRegenerateSlide && (
                    <>
                      <SlideAction
                        onClick={(e) => {
                          e.stopPropagation();
                          setRefineSlideId(refineSlideId === slide.id ? null : slide.id);
                          setRefineText('');
                          setOpenMenuSlideId(null);
                        }}
                        title="Refine with AI instructions"
                        hoverClass="hover:text-purple-400 hover:border-purple-500"
                        disabled={regeneratingSlideId !== null}
                      >
                        {regeneratingSlideId === slide.id ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                      </SlideAction>

                      <SlideAction
                        onClick={(e) => { e.stopPropagation(); onRegenerateSlide(slide.id); setOpenMenuSlideId(null); }}
                        title="Regenerate slide (random)"
                        hoverClass="hover:text-yellow-400 hover:border-yellow-500"
                        disabled={regeneratingSlideId !== null}
                      >
                        <RefreshCw size={14} />
                      </SlideAction>
                    </>
                  )}

                  <SlideAction
                    onClick={(e) => { e.stopPropagation(); onDuplicateSlide(slide.id); setOpenMenuSlideId(null); }}
                    title="Duplicate slide (Ctrl+D)"
                    hoverClass="hover:text-[var(--accent)] hover:border-[var(--accent)]"
                  >
                    <Copy size={14} />
                  </SlideAction>

                  <SlideAction
                    onClick={(e) => { e.stopPropagation(); onCopySlide(slide, index); setOpenMenuSlideId(null); }}
                    title="Copy slide to clipboard"
                    hoverClass="hover:text-green-400 hover:border-green-500"
                    disabled={copyingSlideId !== null}
                  >
                    {copyingSlideId === slide.id ? <Loader2 size={14} className="animate-spin" /> : <Clipboard size={14} />}
                  </SlideAction>

                  <SlideAction
                    onClick={(e) => { e.stopPropagation(); onDownloadSlide(slide, index); setOpenMenuSlideId(null); }}
                    title="Download slide as PNG"
                    hoverClass="hover:text-white hover:border-gray-500"
                    disabled={downloadingSlideId !== null && downloadingSlideId !== slide.id}
                  >
                    {downloadingSlideId === slide.id ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                  </SlideAction>

                  {slide.mediaUrl && slide.mediaType === 'image' && (
                    <SlideAction
                      onClick={(e) => { e.stopPropagation(); onPreviewImage(slide.mediaUrl || null); setOpenMenuSlideId(null); }}
                      title="View infographic full size"
                      hoverClass="hover:text-[var(--accent)] hover:border-[var(--accent)]"
                    >
                      <ZoomIn size={14} />
                    </SlideAction>
                  )}

                  <SlideAction
                    onClick={(e) => { e.stopPropagation(); onDeleteSlide(slide.id); setOpenMenuSlideId(null); }}
                    title={slides.length === 1 ? 'You need at least one slide' : 'Delete slide (Del)'}
                    hoverClass="hover:text-red-300 hover:border-red-500"
                    disabled={slides.length === 1}
                  >
                    <Trash2 size={14} />
                  </SlideAction>
                </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

function SlideAction({
  onClick,
  title,
  hoverClass,
  disabled,
  children,
}: {
  onClick: (e: React.MouseEvent) => void;
  title: string;
  hoverClass: string;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`p-1.5 rounded-md border border-[var(--border)] text-[var(--text-secondary)] ${hoverClass} transition disabled:opacity-40`}
      title={title}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
