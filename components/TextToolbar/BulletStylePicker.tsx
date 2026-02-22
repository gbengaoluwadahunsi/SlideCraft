"use client";

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
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
  const buttonRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPos({
        top: rect.bottom + 8,
        left: Math.max(0, rect.left + rect.width / 2 - 96),
      });
    }
  }, [isOpen]);

  const dropdown = (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="fixed z-[9999] bg-gray-800 border border-gray-700 rounded-xl shadow-2xl w-48"
          style={{ top: pos.top, left: pos.left }}
          initial={{ opacity: 0, y: -5, scale: 0.95 }} 
          animate={{ opacity: 1, y: 0, scale: 1 }} 
          exit={{ opacity: 0, y: -5, scale: 0.95 }}
        >
          <div className="px-3 py-2 border-b border-gray-700">
            <span className="text-xs text-gray-400 font-medium">Bullet Styles</span>
          </div>
          <div className="p-1">
            <div className="px-2 py-1 text-xs text-gray-500 font-medium mb-1">Unordered</div>
            {[
              { style: 'disc' as const, icon: '•', label: 'Circle (Disc)' },
              { style: 'circle' as const, icon: '○', label: 'Circle (Hollow)' },
              { style: 'square' as const, icon: '■', label: 'Square' },
            ].map(({ style, icon, label }) => (
              <button 
                key={style}
                onMouseDown={(e) => { e.preventDefault(); applyListStyle(style); }} 
                className="w-full px-3 py-2 text-left text-sm text-gray-200 hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2"
              >
                <span className="text-lg">{icon}</span>
                <span>{label}</span>
              </button>
            ))}
            <div className="px-2 py-1 text-xs text-gray-500 font-medium mb-1 mt-2">Ordered</div>
            {[
              { style: 'decimal' as const, icon: '1.', label: 'Numbers (1, 2, 3)' },
              { style: 'lower-roman' as const, icon: 'i.', label: 'Roman (i, ii, iii)' },
              { style: 'upper-roman' as const, icon: 'I.', label: 'Roman (I, II, III)' },
              { style: 'lower-alpha' as const, icon: 'a.', label: 'Letters (a, b, c)' },
              { style: 'upper-alpha' as const, icon: 'A.', label: 'Letters (A, B, C)' },
            ].map(({ style, icon, label }) => (
              <button 
                key={style}
                onMouseDown={(e) => { e.preventDefault(); applyListStyle(style); }} 
                className="w-full px-3 py-2 text-left text-sm text-gray-200 hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2"
              >
                <span className="text-sm font-mono">{icon}</span>
                <span>{label}</span>
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div ref={buttonRef}>
      <button 
        onMouseDown={(e) => { e.preventDefault(); onToggle(); }} 
        className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700" 
        title="List Styles"
      >
        <List size={16} />
      </button>
      {mounted && createPortal(dropdown, document.body)}
    </div>
  );
};
