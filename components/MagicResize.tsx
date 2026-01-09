"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, X, Wand2, Loader2 } from 'lucide-react';

interface MagicResizeProps {
  currentSize: { width: number; height: number };
  targetSizes: Array<{ name: string; width: number; height: number; description: string }>;
  onApplySuggestion: (size: { width: number; height: number }) => void;
  onClose: () => void;
  isOpen: boolean;
}

export const MagicResize: React.FC<MagicResizeProps> = ({
  currentSize,
  targetSizes,
  onApplySuggestion,
  onClose,
  isOpen,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestions, setSuggestions] = useState<Array<{ name: string; width: number; height: number; description: string }>>([]);

  const defaultSizes = [
    { name: 'Instagram Post', width: 1080, height: 1080, description: 'Square format for Instagram' },
    { name: 'Instagram Story', width: 1080, height: 1920, description: 'Vertical story format' },
    { name: 'LinkedIn Post', width: 1200, height: 1200, description: 'Square format for LinkedIn' },
    { name: 'Twitter/X Post', width: 1200, height: 675, description: 'Landscape format for Twitter' },
    { name: 'Facebook Post', width: 1200, height: 630, description: 'Landscape format for Facebook' },
    { name: 'Presentation Slide', width: 1920, height: 1080, description: '16:9 presentation format' },
  ];

  const handleGenerateSuggestions = async () => {
    setIsGenerating(true);
    // Simulate AI suggestion generation
    setTimeout(() => {
      setSuggestions(defaultSizes);
      setIsGenerating(false);
    }, 1500);
  };

  const displaySizes = suggestions.length > 0 ? suggestions : (targetSizes.length > 0 ? targetSizes : defaultSizes);

  if (!isOpen) return null;

  return (
    <motion.div
      className="fixed top-20 right-4 z-[150] bg-gray-900 border border-gray-700 rounded-lg shadow-2xl p-4 w-96 max-h-[80vh] overflow-y-auto"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles size={20} className="text-[#ffd700]" />
          <h3 className="text-lg font-bold text-white">Magic Resize</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-800 rounded transition-colors"
        >
          <X size={18} className="text-gray-400" />
        </button>
      </div>

      <div className="space-y-4">
        <div className="bg-gray-800 rounded-lg p-3">
          <div className="text-xs text-gray-400 mb-1">Current Size</div>
          <div className="text-sm text-white font-semibold">
            {currentSize.width} × {currentSize.height}px
          </div>
        </div>

        <button
          onClick={handleGenerateSuggestions}
          disabled={isGenerating}
          className="w-full px-4 py-2 bg-[#ffd700] hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed text-black rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
        >
          {isGenerating ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Generating Suggestions...
            </>
          ) : (
            <>
              <Wand2 size={16} />
              Generate AI Suggestions
            </>
          )}
        </button>

        <div>
          <div className="text-xs text-gray-400 mb-2">Suggested Sizes</div>
          <div className="space-y-2">
            {displaySizes.map((size, index) => (
              <button
                key={index}
                onClick={() => onApplySuggestion({ width: size.width, height: size.height })}
                className="w-full p-3 rounded-lg border-2 border-gray-700 hover:border-[#ffd700] hover:bg-[#ffd700]/10 transition-colors text-left"
              >
                <div className="text-sm text-white font-semibold">{size.name}</div>
                <div className="text-xs text-gray-400 mt-1">
                  {size.width} × {size.height}px
                </div>
                <div className="text-xs text-gray-500 mt-1">{size.description}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};



