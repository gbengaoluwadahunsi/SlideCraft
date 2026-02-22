'use client';

import React from 'react';
import { Download, Loader2, FileText, MessageSquare, Smartphone, Monitor, Square } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';

interface ExportProgress {
  current: number;
  total: number;
  status: string;
}

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  isExporting: boolean;
  exportProgress: ExportProgress;
  onExportPDF: () => void;
  onExportImages: () => void;
  slideCount: number;
}

const PLATFORMS = [
  { id: 'linkedin', label: 'LinkedIn', sub: 'PDF carousel post', icon: FileText, color: 'blue', format: '1080×1080 PDF' },
  { id: 'instagram', label: 'Instagram', sub: 'Multi-image carousel', icon: Square, color: 'pink', format: '1080×1080 PNG' },
  { id: 'twitter', label: 'Twitter / X', sub: 'Multi-image post', icon: MessageSquare, color: 'sky', format: '1080×1080 PNG' },
  { id: 'tiktok', label: 'TikTok', sub: 'Photo carousel', icon: Smartphone, color: 'emerald', format: '1080×1920 PNG' },
  { id: 'presentation', label: 'Presentation', sub: 'Widescreen slides', icon: Monitor, color: 'purple', format: '1920×1080 PDF' },
] as const;

export const ExportModal = React.memo(function ExportModal({
  isOpen,
  onClose,
  isExporting,
  exportProgress,
  onExportPDF,
  onExportImages,
  slideCount,
}: ExportModalProps) {
  const [selectedPlatform, setSelectedPlatform] = React.useState<string>('linkedin');

  const handleExport = () => {
    if (selectedPlatform === 'presentation' || selectedPlatform === 'linkedin') {
      onExportPDF();
    } else {
      onExportImages();
    }
  };

  const selectedInfo = PLATFORMS.find(p => p.id === selectedPlatform)!;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Export Carousel" size="md">
      <div className="p-6 space-y-5">
        {isExporting ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Loader2 size={24} className="animate-spin text-[var(--accent)]" />
              <div>
                <div className="font-medium text-white">{exportProgress.status}</div>
                {exportProgress.total > 0 && (
                  <div className="text-xs text-[var(--text-muted)]">
                    {exportProgress.current} / {exportProgress.total} slides
                  </div>
                )}
              </div>
            </div>
            {exportProgress.total > 0 && (
              <div className="w-full bg-[var(--surface-2)] rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-[var(--accent)] to-amber-500 h-full transition-all duration-300 ease-out"
                  style={{ width: `${(exportProgress.current / exportProgress.total) * 100}%` }}
                />
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="text-center pb-1">
              <p className="text-[var(--text-muted)] text-sm">
                {slideCount} slide{slideCount !== 1 ? 's' : ''} &middot; Choose your platform
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {PLATFORMS.map(platform => {
                const Icon = platform.icon;
                const isSelected = selectedPlatform === platform.id;
                return (
                  <button
                    key={platform.id}
                    onClick={() => setSelectedPlatform(platform.id)}
                    className={`flex items-center gap-3 p-3 rounded-xl border-2 transition text-left ${
                      isSelected
                        ? 'border-[var(--accent)]/50 bg-[var(--accent-subtle)]'
                        : 'border-[var(--border)] hover:border-[var(--border-hover)] bg-[var(--surface-2)]/30'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      isSelected ? 'bg-[var(--accent)]/20 text-[var(--accent)]' : 'bg-[var(--surface-3)] text-[var(--text-muted)]'
                    }`}>
                      <Icon size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`font-semibold text-sm ${isSelected ? 'text-white' : 'text-[var(--text-secondary)]'}`}>
                        {platform.label}
                      </div>
                      <div className="text-[11px] text-[var(--text-muted)]">{platform.sub}</div>
                    </div>
                    <span className="text-[10px] text-[var(--text-muted)] font-mono">{platform.format}</span>
                  </button>
                );
              })}
            </div>

            <button
              onClick={handleExport}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-[var(--accent)] to-amber-500 hover:from-[var(--accent-hover)] hover:to-amber-400 text-black font-bold rounded-xl transition shadow-lg shadow-[var(--accent)]/20"
            >
              <Download size={18} />
              Export for {selectedInfo.label}
            </button>

            <p className="text-[10px] text-[var(--text-muted)] text-center">
              {selectedPlatform === 'linkedin' && 'Upload the PDF as a LinkedIn document post for carousel format.'}
              {selectedPlatform === 'instagram' && 'Upload individual images as a multi-image carousel post.'}
              {selectedPlatform === 'twitter' && 'Attach images to a tweet for a swipeable gallery.'}
              {selectedPlatform === 'tiktok' && 'Upload as photos in TikTok\'s photo carousel mode.'}
              {selectedPlatform === 'presentation' && 'Widescreen PDF optimized for presentations and screen sharing.'}
            </p>
          </>
        )}
      </div>
    </Modal>
  );
});
