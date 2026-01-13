"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LinkDialogProps {
  isOpen: boolean;
  linkUrl: string;
  onClose: () => void;
  onUrlChange: (url: string) => void;
  onApply: (url: string) => void;
  inline?: boolean;
}

export const LinkDialog: React.FC<LinkDialogProps> = ({ 
  isOpen, 
  linkUrl, 
  onClose, 
  onUrlChange, 
  onApply,
  inline = false 
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50"
          style={{ zIndex: 9999 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className={`border border-gray-700 rounded-xl shadow-2xl p-6 w-full max-w-md mx-4 ${
              inline 
                ? 'bg-gray-800' 
                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
            }`}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className={`text-lg font-semibold mb-4 ${
              inline ? 'text-white' : 'text-gray-900 dark:text-white'
            }`}>
              Insert Link
            </h3>
            <input
              type="text"
              value={linkUrl}
              onChange={(e) => onUrlChange(e.target.value)}
              placeholder="https://example.com"
              className={`w-full px-4 py-3 border rounded-lg placeholder-gray-500 focus:outline-none focus:ring-2 ${
                inline
                  ? 'bg-gray-700 border-gray-600 text-white focus:ring-[#ffd700]'
                  : 'bg-gray-100 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white focus:ring-blue-500'
              }`}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') onApply(linkUrl);
                else if (e.key === 'Escape') onClose();
              }}
            />
            <div className="flex gap-3 mt-4">
              <button 
                onClick={() => onApply(linkUrl)} 
                className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-colors ${
                  inline
                    ? 'bg-[#ffd700] hover:bg-yellow-400 text-black'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                Apply
              </button>
              <button 
                onClick={onClose} 
                className={`px-4 py-2.5 rounded-lg font-medium transition-colors ${
                  inline
                    ? 'bg-gray-700 hover:bg-gray-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200'
                }`}
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
