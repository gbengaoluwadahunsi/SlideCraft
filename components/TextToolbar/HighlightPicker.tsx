"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Highlighter, X } from 'lucide-react';
import { useTextToolbar } from './TextToolbarContext';

interface HighlightPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onToggle: () => void;
  applyHighlight: (color: string) => void;
}

const highlightColors = [
  '#ffeb3b', '#ff9800', '#f44336', '#e91e63', '#9c27b0',
  '#2196f3', '#00bcd4', '#4caf50', '#8bc34a', '#cddc39',
  'transparent'
];

export const HighlightPicker: React.FC<HighlightPickerProps> = ({ 
  isOpen, 
  onClose, 
  onToggle, 
  applyHighlight 
}) => {
  return (
    <div className="relative z-[9998]">
      <button 
        onClick={onToggle} 
        className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700" 
        title="Highlight"
      >
        <Highlighter size={16} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl p-3 w-44 z-[9999]" 
            style={{ zIndex: 9999 }}
            initial={{ opacity: 0, y: -5, scale: 0.95 }} 
            animate={{ opacity: 1, y: 0, scale: 1 }} 
            exit={{ opacity: 0, y: -5, scale: 0.95 }}
          >
            <div className="text-xs text-gray-400 font-medium mb-2">Highlight</div>
            <div className="grid grid-cols-6 gap-1.5">
              {highlightColors.map(color => (
                <button 
                  key={color} 
                  onMouseDown={(e) => { e.preventDefault(); applyHighlight(color); }} 
                  className={`w-5 h-5 rounded-md border border-gray-600 hover:scale-110 hover:border-white transition-all ${color === 'transparent' ? 'bg-gray-700 relative' : ''}`} 
                  style={{ backgroundColor: color === 'transparent' ? undefined : color }}
                >
                  {color === 'transparent' && <X size={10} className="absolute inset-0 m-auto text-gray-400" />}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
