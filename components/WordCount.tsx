"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { FileText, X } from 'lucide-react';

interface WordCountProps {
  slides: Array<{ title?: string; subtitle?: string; content?: string }>;
  isOpen: boolean;
  onClose: () => void;
}

export const WordCount: React.FC<WordCountProps> = ({ slides, isOpen, onClose }) => {
  const countWords = (text: string = '') => {
    return text.replace(/<[^>]*>/g, '').trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  const countCharacters = (text: string = '', includeSpaces: boolean = true) => {
    const cleaned = text.replace(/<[^>]*>/g, '');
    return includeSpaces ? cleaned.length : cleaned.replace(/\s/g, '').length;
  };

  const totalWords = slides.reduce((sum, slide) => {
    return sum + countWords(slide.title || '') + countWords(slide.subtitle || '') + countWords(slide.content || '');
  }, 0);

  const totalCharacters = slides.reduce((sum, slide) => {
    return sum + countCharacters(slide.title || '') + countCharacters(slide.subtitle || '') + countCharacters(slide.content || '');
  }, 0);

  const totalCharactersNoSpaces = slides.reduce((sum, slide) => {
    return sum + countCharacters(slide.title || '', false) + countCharacters(slide.subtitle || '', false) + countCharacters(slide.content || '', false);
  }, 0);

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
          <FileText size={20} className="text-[#ffd700]" />
          <h3 className="text-lg font-bold text-white">Word Count</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-800 rounded transition-colors"
        >
          <X size={18} className="text-gray-400" />
        </button>
      </div>

      <div className="space-y-4">
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="text-3xl font-bold text-[#ffd700] mb-1">{totalWords}</div>
          <div className="text-sm text-gray-400">Total Words</div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="text-xl font-bold text-white mb-1">{totalCharacters}</div>
            <div className="text-xs text-gray-400">Characters (with spaces)</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="text-xl font-bold text-white mb-1">{totalCharactersNoSpaces}</div>
            <div className="text-xs text-gray-400">Characters (no spaces)</div>
          </div>
        </div>

        <div className="border-t border-gray-700 pt-4">
          <div className="text-xs text-gray-400 mb-2">Per Slide:</div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {slides.map((slide, index) => {
              const slideWords = countWords(slide.title || '') + countWords(slide.subtitle || '') + countWords(slide.content || '');
              const slideChars = countCharacters(slide.title || '') + countCharacters(slide.subtitle || '') + countCharacters(slide.content || '');
              return (
                <div key={index} className="flex items-center justify-between text-sm bg-gray-800 rounded p-2">
                  <span className="text-gray-300">Slide {index + 1}</span>
                  <div className="flex gap-3 text-gray-400">
                    <span>{slideWords} words</span>
                    <span>{slideChars} chars</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
};



