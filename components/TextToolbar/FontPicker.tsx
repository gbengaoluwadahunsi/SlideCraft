"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Type } from 'lucide-react';
import { useTextToolbar } from './TextToolbarContext';

interface FontPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onToggle: () => void;
  applyFontFamily: (fontFamily: string) => void;
}

const fonts = [
  { name: 'Arial', value: 'Arial, sans-serif' },
  { name: 'Helvetica', value: 'Helvetica, sans-serif' },
  { name: 'Georgia', value: 'Georgia, serif' },
  { name: 'Times New Roman', value: 'Times New Roman, serif' },
  { name: 'Courier New', value: 'Courier New, monospace' },
  { name: 'Verdana', value: 'Verdana, sans-serif' },
  { name: 'Trebuchet MS', value: 'Trebuchet MS, sans-serif' },
  { name: 'Impact', value: 'Impact, sans-serif' },
  { name: 'Comic Sans MS', value: 'Comic Sans MS, cursive' },
  { name: 'Palatino', value: 'Palatino Linotype, serif' },
  { name: 'Lucida Console', value: 'Lucida Console, monospace' },
  { name: 'Tahoma', value: 'Tahoma, sans-serif' },
];

export const FontPicker: React.FC<FontPickerProps> = ({ 
  isOpen, 
  onClose, 
  onToggle, 
  applyFontFamily 
}) => {
  return (
    <div className="relative z-[9998]">
      <button 
        onClick={onToggle} 
        className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition" 
        title="Font"
      >
        <Type size={16} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            className="absolute top-full left-0 mt-2 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl w-48 z-[9999]" 
            style={{ zIndex: 9999 }}
            initial={{ opacity: 0, y: -5, scale: 0.95 }} 
            animate={{ opacity: 1, y: 0, scale: 1 }} 
            exit={{ opacity: 0, y: -5, scale: 0.95 }}
          >
            <div className="px-3 py-2 border-b border-gray-700">
              <span className="text-xs text-gray-400 font-medium">Select Font</span>
            </div>
            <div className="p-1 max-h-64 overflow-y-auto">
              {fonts.map(font => (
                <button 
                  key={font.name} 
                  onMouseDown={(e) => { e.preventDefault(); applyFontFamily(font.value); onClose(); }} 
                  className="w-full px-3 py-2 text-left text-sm text-gray-200 hover:bg-gray-700 rounded-lg transition-colors" 
                  style={{ fontFamily: font.value }}
                >
                  {font.name}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
