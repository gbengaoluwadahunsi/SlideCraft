'use client';

import React from 'react';
import { 
  X, Download, FileText, Layout, 
  Image as ImageIcon, Loader2, 
  CheckCircle2, Info, ChevronRight,
  ArrowRight
} from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  exportManager: any;
  projectName: string;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  exportManager,
  projectName
}) => {
  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100]" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-1rem)] max-w-xl bg-[var(--surface-1)] border border-[var(--border-hover)] rounded-2xl shadow-2xl z-[101] outline-none overflow-hidden">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-8 pb-4 flex items-center justify-between">
              <div>
                <Dialog.Title className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                  <Download size={28} className="text-[var(--accent)]" />
                  Download Carousel
                </Dialog.Title>
                <p className="text-sm text-[var(--text-muted)] mt-1">Choose where you want to use {projectName}</p>
              </div>
              <Dialog.Close className="p-2 hover:bg-[var(--surface-3)] rounded-xl transition-colors text-[var(--text-secondary)] hover:text-white">
                <X size={24} />
              </Dialog.Close>
            </div>

            <div className="p-8 pt-4 space-y-6">
              {/* Progress Bar (Visible during export) */}
              {exportManager.isExporting && (
                <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                  <div className="bg-[var(--surface-2)] border border-[var(--border-hover)] rounded-2xl p-6 mb-8 relative overflow-hidden">
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-[var(--accent)] uppercase tracking-widest">{exportManager.exportProgress.status}</span>
                        <span className="text-xs font-bold text-white bg-[var(--surface-3)] px-2 py-1 rounded-md">
                          {Math.round((exportManager.exportProgress.current / exportManager.exportProgress.total) * 100)}%
                        </span>
                      </div>
                      <div className="h-2 w-full bg-black/20 rounded-full overflow-hidden mb-2">
                        <div 
                          className="h-full bg-[var(--accent)] transition-all duration-500 shadow-[0_0_15px_rgba(var(--accent-rgb),0.5)]"
                          style={{ width: `${(exportManager.exportProgress.current / exportManager.exportProgress.total) * 100}%` }}
                        />
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)]">
                        <Loader2 size={10} className="animate-spin" />
                        Do not close this window until download starts
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Format Selection Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* PDF Button */}
                <button
                  onClick={exportManager.handleExportPDF}
                  disabled={exportManager.isExporting}
                  className="group relative flex flex-col p-6 rounded-2xl border-2 border-[var(--border-hover)] hover:border-[var(--accent)] bg-[var(--surface-2)]/30 hover:bg-[var(--accent)]/5 transition-all duration-300 text-left disabled:opacity-50"
                >
                  <div className="w-12 h-12 rounded-xl bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <FileText size={24} />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1">LinkedIn PDF</h3>
                  <p className="text-xs text-[var(--text-muted)] group-hover:text-[var(--text-secondary)] transition-colors">Best for LinkedIn carousel posts and document sharing.</p>
                  
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ChevronRight size={20} className="text-[var(--accent)]" />
                  </div>
                </button>

                {/* Images ZIP Button */}
                <button
                  onClick={exportManager.handleExportImages}
                  disabled={exportManager.isExporting}
                  className="group relative flex flex-col p-6 rounded-2xl border-2 border-[var(--border-hover)] hover:border-[var(--accent)] bg-[var(--surface-2)]/30 hover:bg-[var(--accent)]/5 transition-all duration-300 text-left disabled:opacity-50"
                >
                  <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <ImageIcon size={24} />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1">Images</h3>
                  <p className="text-xs text-[var(--text-muted)] group-hover:text-[var(--text-secondary)] transition-colors">One PNG per slide for Instagram, X, and other platforms.</p>
                  
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ChevronRight size={20} className="text-purple-400" />
                  </div>
                </button>
              </div>

              {/* Tips Section */}
              <div className="bg-blue-500/5 border border-blue-500/10 rounded-2xl p-5 flex gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex-shrink-0 flex items-center justify-center text-blue-400">
                  <Info size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white mb-1">Best choice for LinkedIn</h4>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                    Choose <strong>LinkedIn PDF</strong>. LinkedIn turns it into a swipeable carousel automatically.
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-8 border-t border-[var(--border-hover)] flex items-center justify-between bg-[var(--surface-2)]/20">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-widest">Ready to share</span>
              </div>
              
              <button
                onClick={onClose}
                className="text-sm font-bold text-[var(--text-muted)] hover:text-white transition"
              >
                Close
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
