"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, RotateCw } from 'lucide-react';

interface PhotoFiltersProps {
  currentFilter: string;
  onFilterChange: (filter: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

export const PhotoFilters: React.FC<PhotoFiltersProps> = ({
  currentFilter,
  onFilterChange,
  onClose,
  isOpen,
}) => {
  const filters = [
    { name: 'None', value: 'none' },
    { name: 'Brightness', value: 'brightness(1.2)' },
    { name: 'Contrast', value: 'contrast(1.2)' },
    { name: 'Saturation', value: 'saturate(1.3)' },
    { name: 'Grayscale', value: 'grayscale(100%)' },
    { name: 'Sepia', value: 'sepia(100%)' },
    { name: 'Blur', value: 'blur(2px)' },
    { name: 'Vintage', value: 'sepia(50%) contrast(1.1) brightness(0.9)' },
    { name: 'Cool', value: 'brightness(1.1) contrast(1.1) saturate(0.8)' },
    { name: 'Warm', value: 'brightness(1.1) contrast(1.05) saturate(1.2)' },
    { name: 'High Contrast', value: 'contrast(1.5) brightness(1.1)' },
    { name: 'Soft', value: 'brightness(1.05) contrast(0.95) saturate(0.9)' },
  ];

  const [customFilter, setCustomFilter] = useState('');

  if (!isOpen) return null;

  return (
    <motion.div
      className="fixed top-20 right-4 z-[150] bg-gray-900 border border-gray-700 rounded-lg shadow-2xl p-4 w-80 max-h-[80vh] overflow-y-auto"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white">Photo Filters</h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-800 rounded transition-colors"
        >
          <X size={18} className="text-gray-400" />
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-xs text-gray-400 mb-2 block">Preset Filters</label>
          <div className="grid grid-cols-2 gap-2">
            {filters.map((filter) => (
              <button
                key={filter.value}
                onClick={() => onFilterChange(filter.value === 'none' ? '' : filter.value)}
                className={`p-2 rounded-lg border-2 transition ${
                  (currentFilter === filter.value || (filter.value === 'none' && !currentFilter))
                    ? 'border-[#ffd700] bg-[#ffd700]/10'
                    : 'border-gray-700 hover:border-gray-600'
                }`}
              >
                <div className="text-sm text-white">{filter.name}</div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs text-gray-400 mb-2 block">Custom Filter (CSS)</label>
          <input
            type="text"
            value={customFilter}
            onChange={(e) => setCustomFilter(e.target.value)}
            placeholder="brightness(1.2) contrast(1.1)"
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#ffd700] text-sm"
          />
          <button
            onClick={() => {
              if (customFilter.trim()) {
                onFilterChange(customFilter.trim());
              }
            }}
            className="w-full mt-2 px-4 py-2 bg-[#ffd700] hover:bg-yellow-400 text-black rounded-lg font-semibold transition-colors text-sm"
          >
            Apply Custom
          </button>
        </div>

        <button
          onClick={() => {
            onFilterChange('');
            setCustomFilter('');
          }}
          className="w-full px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm flex items-center justify-center gap-2"
        >
          <RotateCw size={16} />
          Reset Filter
        </button>
      </div>
    </motion.div>
  );
};



