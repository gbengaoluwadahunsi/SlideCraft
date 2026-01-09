"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, X, Play } from 'lucide-react';

interface TextAnimationsProps {
  onApplyAnimation: (animation: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

export const TextAnimations: React.FC<TextAnimationsProps> = ({ onApplyAnimation, onClose, isOpen }) => {
  const animations = [
    { name: 'Fade In', value: 'fadeIn', description: 'Fade in smoothly' },
    { name: 'Slide Up', value: 'slideUp', description: 'Slide up from bottom' },
    { name: 'Slide Down', value: 'slideDown', description: 'Slide down from top' },
    { name: 'Slide Left', value: 'slideLeft', description: 'Slide in from right' },
    { name: 'Slide Right', value: 'slideRight', description: 'Slide in from left' },
    { name: 'Zoom In', value: 'zoomIn', description: 'Zoom in effect' },
    { name: 'Bounce', value: 'bounce', description: 'Bounce animation' },
    { name: 'Typewriter', value: 'typewriter', description: 'Typewriter effect' },
    { name: 'None', value: 'none', description: 'Remove animation' },
  ];

  if (!isOpen) return null;

  return (
    <motion.div
      className="fixed top-20 right-4 z-[150] bg-gray-900 border border-gray-700 rounded-lg shadow-2xl p-4 w-80"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles size={20} className="text-[#ffd700]" />
          <h3 className="text-lg font-bold text-white">Text Animations</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-800 rounded transition-colors"
        >
          <X size={18} className="text-gray-400" />
        </button>
      </div>

      <div className="space-y-2">
        {animations.map((animation) => (
          <button
            key={animation.value}
            onClick={() => {
              onApplyAnimation(animation.value);
              onClose();
            }}
            className="w-full p-3 rounded-lg border-2 border-gray-700 hover:border-[#ffd700] hover:bg-[#ffd700]/10 transition-colors text-left flex items-center justify-between group"
          >
            <div>
              <div className="text-sm text-white font-semibold">{animation.name}</div>
              <div className="text-xs text-gray-400">{animation.description}</div>
            </div>
            <Play size={16} className="text-gray-400 group-hover:text-[#ffd700] transition-colors" />
          </button>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-700">
        <div className="text-xs text-gray-500">
          Animations will play when the slide is viewed. Preview in presentation mode.
        </div>
      </div>
    </motion.div>
  );
};



