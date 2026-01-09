"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Replace, ReplaceAll } from 'lucide-react';

interface FindReplaceProps {
  isOpen: boolean;
  onClose: () => void;
  onFind: (query: string, caseSensitive: boolean) => void;
  onReplace: (find: string, replace: string, caseSensitive: boolean, replaceAll: boolean) => void;
  currentMatch?: number;
  totalMatches?: number;
}

export const FindReplace: React.FC<FindReplaceProps> = ({
  isOpen,
  onClose,
  onFind,
  onReplace,
  currentMatch = 0,
  totalMatches = 0,
}) => {
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [caseSensitive, setCaseSensitive] = useState(false);

  const handleFind = () => {
    if (findText.trim()) {
      onFind(findText, caseSensitive);
    }
  };

  const handleReplace = (replaceAll: boolean = false) => {
    if (findText.trim()) {
      onReplace(findText, replaceText, caseSensitive, replaceAll);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed top-20 left-1/2 -translate-x-1/2 z-[150] bg-gray-900 border border-gray-700 rounded-lg shadow-2xl p-4 w-full max-w-2xl mx-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white">Find & Replace</h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X size={20} className="text-gray-400" />
            </button>
          </div>

          <div className="space-y-3">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  value={findText}
                  onChange={(e) => {
                    setFindText(e.target.value);
                    if (e.target.value.trim()) {
                      onFind(e.target.value, caseSensitive);
                    }
                  }}
                  placeholder="Find..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#ffd700]"
                  autoFocus
                />
              </div>
              {totalMatches > 0 && (
                <div className="flex items-center px-3 text-sm text-gray-400">
                  {currentMatch} / {totalMatches}
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Replace className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  value={replaceText}
                  onChange={(e) => setReplaceText(e.target.value)}
                  placeholder="Replace with..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#ffd700]"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={caseSensitive}
                  onChange={(e) => {
                    setCaseSensitive(e.target.checked);
                    if (findText.trim()) {
                      onFind(findText, e.target.checked);
                    }
                  }}
                  className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-[#ffd700] focus:ring-[#ffd700]"
                />
                Case sensitive
              </label>

              <div className="flex gap-2">
                <button
                  onClick={handleFind}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm"
                >
                  Find
                </button>
                <button
                  onClick={() => handleReplace(false)}
                  className="px-4 py-2 bg-[#ffd700] hover:bg-yellow-400 text-black rounded-lg transition-colors text-sm font-semibold flex items-center gap-2"
                >
                  <Replace size={16} />
                  Replace
                </button>
                <button
                  onClick={() => handleReplace(true)}
                  className="px-4 py-2 bg-[#ffd700] hover:bg-yellow-400 text-black rounded-lg transition-colors text-sm font-semibold flex items-center gap-2"
                >
                  <ReplaceAll size={16} />
                  Replace All
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};



