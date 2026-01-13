"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { List } from 'lucide-react';

interface BulletStylePickerProps {
  isOpen: boolean;
  onClose: () => void;
  onToggle: () => void;
  applyListStyle: (style: 'disc' | 'circle' | 'square' | 'decimal' | 'decimal-leading-zero' | 'lower-roman' | 'upper-roman' | 'lower-alpha' | 'upper-alpha' | 'none') => void;
}

export const BulletStylePicker: React.FC<BulletStylePickerProps> = ({ 
  isOpen, 
  onClose, 
  onToggle, 
  applyListStyle 
}) => {
  return (
    <div className="relative z-[9998]">
      <button 
        onClick={onToggle} 
        className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700" 
        title="List Styles"
      >
        <List size={16} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl overflow-hidden w-48 z-[9999]" 
            style={{ zIndex: 9999 }}
            initial={{ opacity: 0, y: -5, scale: 0.95 }} 
            animate={{ opacity: 1, y: 0, scale: 1 }} 
            exit={{ opacity: 0, y: -5, scale: 0.95 }}
          >
            <div className="px-3 py-2 border-b border-gray-700">
              <span className="text-xs text-gray-400 font-medium">Bullet Styles</span>
            </div>
            <div className="p-1">
              <div className="px-2 py-1 text-xs text-gray-500 font-medium mb-1">Unordered</div>
              <button 
                onMouseDown={(e) => { e.preventDefault(); applyListStyle('disc'); }} 
                className="w-full px-3 py-2 text-left text-sm text-gray-200 hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2"
              >
                <span className="text-lg">•</span>
                <span>Circle (Disc)</span>
              </button>
              <button 
                onMouseDown={(e) => { e.preventDefault(); applyListStyle('circle'); }} 
                className="w-full px-3 py-2 text-left text-sm text-gray-200 hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2"
              >
                <span className="text-lg">○</span>
                <span>Circle (Hollow)</span>
              </button>
              <button 
                onMouseDown={(e) => { e.preventDefault(); applyListStyle('square'); }} 
                className="w-full px-3 py-2 text-left text-sm text-gray-200 hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2"
              >
                <span className="text-lg">■</span>
                <span>Square</span>
              </button>
              <div className="px-2 py-1 text-xs text-gray-500 font-medium mb-1 mt-2">Ordered</div>
              <button 
                onMouseDown={(e) => { e.preventDefault(); applyListStyle('decimal'); }} 
                className="w-full px-3 py-2 text-left text-sm text-gray-200 hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2"
              >
                <span className="text-sm font-mono">1.</span>
                <span>Numbers (1, 2, 3)</span>
              </button>
              <button 
                onMouseDown={(e) => { e.preventDefault(); applyListStyle('decimal-leading-zero'); }} 
                className="w-full px-3 py-2 text-left text-sm text-gray-200 hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2"
              >
                <span className="text-sm font-mono">01.</span>
                <span>Numbers (01, 02)</span>
              </button>
              <button 
                onMouseDown={(e) => { e.preventDefault(); applyListStyle('lower-roman'); }} 
                className="w-full px-3 py-2 text-left text-sm text-gray-200 hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2"
              >
                <span className="text-sm font-mono">i.</span>
                <span>Roman (i, ii, iii)</span>
              </button>
              <button 
                onMouseDown={(e) => { e.preventDefault(); applyListStyle('upper-roman'); }} 
                className="w-full px-3 py-2 text-left text-sm text-gray-200 hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2"
              >
                <span className="text-sm font-mono">I.</span>
                <span>Roman (I, II, III)</span>
              </button>
              <button 
                onMouseDown={(e) => { e.preventDefault(); applyListStyle('lower-alpha'); }} 
                className="w-full px-3 py-2 text-left text-sm text-gray-200 hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2"
              >
                <span className="text-sm font-mono">a.</span>
                <span>Letters (a, b, c)</span>
              </button>
              <button 
                onMouseDown={(e) => { e.preventDefault(); applyListStyle('upper-alpha'); }} 
                className="w-full px-3 py-2 text-left text-sm text-gray-200 hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2"
              >
                <span className="text-sm font-mono">A.</span>
                <span>Letters (A, B, C)</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
