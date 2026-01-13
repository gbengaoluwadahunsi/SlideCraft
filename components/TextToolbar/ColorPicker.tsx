"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Palette } from 'lucide-react';
import { useTextToolbar } from './TextToolbarContext';

interface ColorPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onToggle: () => void;
}

const textColors = [
  '#ffffff', '#000000', '#ffd700', '#ff6b6b', '#4ecdc4', '#45b7d1', 
  '#96ceb4', '#ffeaa7', '#dfe6e9', '#fd79a8', '#a29bfe', '#6c5ce7',
  '#00b894', '#e17055', '#fdcb6e', '#e84393', '#0984e3', '#2d3436'
];

export const ColorPicker: React.FC<ColorPickerProps> = ({ isOpen, onClose, onToggle }) => {
  const { execCommand, recentColors } = useTextToolbar();

  return (
    <div className="relative z-[9998]">
      <button 
        onClick={onToggle} 
        className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 flex flex-col items-center" 
        title="Color"
      >
        <Palette size={16} />
        <div className="w-4 h-0.5 rounded-sm" style={{ backgroundColor: recentColors[0] || '#ffd700' }} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl p-3 w-52 z-[9999]" 
            style={{ zIndex: 9999 }}
            initial={{ opacity: 0, y: -5, scale: 0.95 }} 
            animate={{ opacity: 1, y: 0, scale: 1 }} 
            exit={{ opacity: 0, y: -5, scale: 0.95 }}
          >
            <div className="text-xs text-gray-400 font-medium mb-2">Text Color</div>
            <div className="grid grid-cols-8 gap-1.5">
              {textColors.map(color => (
                <button 
                  key={color} 
                  onMouseDown={(e) => { e.preventDefault(); execCommand('foreColor', color); onClose(); }} 
                  className="w-5 h-5 rounded-md border border-gray-600 hover:scale-110 hover:border-white transition-all" 
                  style={{ backgroundColor: color }} 
                />
              ))}
            </div>
            <div className="mt-3 pt-2 border-t border-gray-700">
              <div className="text-xs text-gray-400 mb-1">Custom</div>
              <input 
                type="color" 
                className="w-full h-8 rounded-lg cursor-pointer bg-gray-700 border-0" 
                onChange={(e) => { execCommand('foreColor', e.target.value); onClose(); }} 
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
