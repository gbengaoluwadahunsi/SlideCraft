"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface TextEffectsPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onToggle: () => void;
  applyTextEffect: (effect: 'shadow' | 'outline' | 'glow' | 'none') => void;
}

export const TextEffectsPicker: React.FC<TextEffectsPickerProps> = ({ 
  isOpen, 
  onClose, 
  onToggle, 
  applyTextEffect 
}) => {
  return (
    <div className="relative z-[9998]">
      <button 
        onClick={onToggle} 
        className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700" 
        title="Text Effects"
      >
        <Sparkles size={16} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl overflow-hidden w-36 z-[9999]" 
            style={{ zIndex: 9999 }}
            initial={{ opacity: 0, y: -5, scale: 0.95 }} 
            animate={{ opacity: 1, y: 0, scale: 1 }} 
            exit={{ opacity: 0, y: -5, scale: 0.95 }}
          >
            <div className="px-3 py-2 border-b border-gray-700">
              <span className="text-xs text-gray-400 font-medium">Text Effects</span>
            </div>
            <div className="p-1">
              <button 
                onMouseDown={(e) => { e.preventDefault(); applyTextEffect('shadow'); }} 
                className="w-full px-3 py-1.5 text-left text-sm text-gray-200 hover:bg-gray-700 rounded-lg transition-colors"
              >
                Shadow
              </button>
              <button 
                onMouseDown={(e) => { e.preventDefault(); applyTextEffect('outline'); }} 
                className="w-full px-3 py-1.5 text-left text-sm text-gray-200 hover:bg-gray-700 rounded-lg transition-colors"
              >
                Outline
              </button>
              <button 
                onMouseDown={(e) => { e.preventDefault(); applyTextEffect('glow'); }} 
                className="w-full px-3 py-1.5 text-left text-sm text-gray-200 hover:bg-gray-700 rounded-lg transition-colors"
              >
                Glow
              </button>
              <button 
                onMouseDown={(e) => { e.preventDefault(); applyTextEffect('none'); }} 
                className="w-full px-3 py-1.5 text-left text-sm text-gray-200 hover:bg-gray-700 rounded-lg transition-colors"
              >
                None
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
