"use client";

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, X, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';

interface SpellCheckProps {
  text: string;
  onReplace: (original: string, replacement: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

interface SpellError {
  word: string;
  suggestions: string[];
  index: number;
}

// Simple dictionary for common words (in production, use a proper spell checker API)
const DICTIONARY = new Set([
  'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
  'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
  'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
  'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their',
  'what', 'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go',
  'me', 'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know',
  'take', 'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them',
  'see', 'other', 'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over',
  'think', 'also', 'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first',
  'well', 'way', 'even', 'new', 'want', 'because', 'any', 'these', 'give', 'day',
  'most', 'us', 'create', 'viral', 'carousel', 'minutes', 'audience', 'story',
  'content', 'social', 'media', 'linkedin', 'instagram', 'platform', 'design',
  'template', 'slide', 'title', 'subtitle', 'background', 'color', 'font', 'text',
]);

const checkSpelling = (text: string): SpellError[] => {
  const errors: SpellError[] = [];
  const words = text.match(/\b\w+\b/g) || [];
  
  words.forEach((word, index) => {
    const lowerWord = word.toLowerCase();
    if (word.length > 2 && !DICTIONARY.has(lowerWord)) {
      // Generate simple suggestions (in production, use a proper spell checker)
      const suggestions = generateSuggestions(lowerWord);
      errors.push({
        word,
        suggestions,
        index,
      });
    }
  });

  return errors;
};

const generateSuggestions = (word: string): string[] => {
  // Simple suggestion generator (in production, use a proper spell checker API)
  const suggestions: string[] = [];
  
  // Check for common typos
  const commonTypos: Record<string, string[]> = {
    'teh': ['the'],
    'adn': ['and'],
    'taht': ['that'],
    'recieve': ['receive'],
    'seperate': ['separate'],
    'occured': ['occurred'],
  };

  if (commonTypos[word]) {
    return commonTypos[word];
  }

  // Simple suggestions based on similar words in dictionary
  Array.from(DICTIONARY).forEach(dictWord => {
    if (dictWord.length === word.length) {
      let diff = 0;
      for (let i = 0; i < word.length; i++) {
        if (word[i] !== dictWord[i]) diff++;
      }
      if (diff <= 2 && suggestions.length < 3) {
        suggestions.push(dictWord);
      }
    }
  });

  return suggestions.slice(0, 3);
};

export const SpellCheck: React.FC<SpellCheckProps> = ({ text, onReplace, onClose, isOpen }) => {
  const errors = useMemo(() => checkSpelling(text), [text]);
  const [selectedError, setSelectedError] = useState<number>(0);

  const handleReplace = (original: string, replacement: string) => {
    onReplace(original, replacement);
  };

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
          <CheckCircle2 size={20} className="text-[#ffd700]" />
          <h3 className="text-lg font-bold text-white">Spell Check</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-800 rounded transition-colors"
        >
          <X size={18} className="text-gray-400" />
        </button>
      </div>

      {errors.length === 0 ? (
        <div className="text-center py-8">
          <CheckCircle size={48} className="text-green-500 mx-auto mb-3" />
          <div className="text-white font-semibold">No spelling errors found!</div>
          <div className="text-gray-400 text-sm mt-1">Your text looks good.</div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="text-sm text-gray-400">
            Found {errors.length} potential {errors.length === 1 ? 'error' : 'errors'}
          </div>
          
          {errors.map((error, index) => (
            <div key={index} className="bg-gray-800 rounded-lg p-3">
              <div className="flex items-start gap-2 mb-2">
                <AlertCircle size={16} className="text-yellow-500 mt-0.5" />
                <div className="flex-1">
                  <div className="text-white font-semibold">{error.word}</div>
                  {error.suggestions.length > 0 ? (
                    <div className="mt-2 space-y-1">
                      {error.suggestions.map((suggestion, i) => (
                        <button
                          key={i}
                          onClick={() => handleReplace(error.word, suggestion)}
                          className="w-full text-left px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-sm text-white transition-colors flex items-center justify-between"
                        >
                          <span>{suggestion}</span>
                          <ArrowRight size={14} />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-gray-500 mt-1">No suggestions available</div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

