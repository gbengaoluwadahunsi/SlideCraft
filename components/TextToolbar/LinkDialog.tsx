"use client";

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface LinkDialogProps {
  isOpen: boolean;
  linkUrl: string;
  onClose: () => void;
  onUrlChange: (url: string) => void;
  onApply: (url: string) => void;
}

export const LinkDialog: React.FC<LinkDialogProps> = ({ 
  isOpen, 
  linkUrl, 
  onClose, 
  onUrlChange, 
  onApply,
}) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const dialog = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="bg-[var(--surface-1)] border border-[var(--border)] rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold mb-4 text-white">Insert Link</h3>
            <input
              type="text"
              value={linkUrl}
              onChange={(e) => onUrlChange(e.target.value)}
              placeholder="https://example.com"
              className="w-full px-4 py-3 bg-[var(--surface-2)] border border-[var(--border-hover)] rounded-lg text-white placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') onApply(linkUrl);
                else if (e.key === 'Escape') onClose();
              }}
            />
            <div className="flex gap-3 mt-4">
              <button 
                onClick={() => onApply(linkUrl)} 
                className="flex-1 px-4 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-black font-bold rounded-lg transition"
              >
                Apply
              </button>
              <button 
                onClick={onClose} 
                className="px-4 py-2.5 bg-[var(--surface-3)] hover:bg-[var(--surface-2)] text-white font-medium rounded-lg transition"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (!mounted) return null;
  return createPortal(dialog, document.body);
};
