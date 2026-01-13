"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Space } from 'lucide-react';

interface LetterSpacingPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onToggle: () => void;
  applyLetterSpacing: (spacing: string) => void;
}

const letterSpacings = ['-0.05em', '0', '0.05em', '0.1em', '0.15em', '0.2em'];

export const LetterSpacingPicker: React.FC<LetterSpacingPickerProps> = ({ 
  isOpen, 
  onClose, 
  onToggle, 
  applyLetterSpacing 
}) => {
  return (
    <div className="relative z-[9998]">
      <button 
        onClick={onToggle} 
        className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700" 
        title="Letter Spacing"
      >
        <Space size={16} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl overflow-hidden w-32 z-[9999]" 
            style={{ zIndex: 9999 }}
            initial={{ opacity: 0, y: -5, scale: 0.95 }} 
            animate={{ opacity: 1, y: 0, scale: 1 }} 
            exit={{ opacity: 0, y: -5, scale: 0.95 }}
          >
            <div className="px-3 py-2 border-b border-gray-700">
              <span className="text-xs text-gray-400 font-medium">Spacing</span>
            </div>
            <div className="p-1">
              {letterSpacings.map(ls => (
                <button 
                  key={ls} 
                  onMouseDown={(e) => { e.preventDefault(); applyLetterSpacing(ls); }} 
                  className="w-full px-3 py-1.5 text-left text-sm text-gray-200 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  {ls}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
