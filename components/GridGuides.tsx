"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Grid, X, Ruler } from 'lucide-react';

interface GridGuidesProps {
  showGrid: boolean;
  showGuides: boolean;
  gridSize: number;
  onToggleGrid: () => void;
  onToggleGuides: () => void;
  onGridSizeChange: (size: number) => void;
  onClose: () => void;
  isOpen: boolean;
}

export const GridGuides: React.FC<GridGuidesProps> = ({
  showGrid,
  showGuides,
  gridSize,
  onToggleGrid,
  onToggleGuides,
  onGridSizeChange,
  onClose,
  isOpen,
}) => {
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
          <Grid size={20} className="text-[#ffd700]" />
          <h3 className="text-lg font-bold text-white">Grid & Guides</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-800 rounded transition-colors"
        >
          <X size={18} className="text-gray-400" />
        </button>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Grid size={18} className="text-gray-400" />
            <span className="text-sm text-white">Show Grid</span>
          </div>
          <button
            onClick={onToggleGrid}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              showGrid ? 'bg-[#ffd700]' : 'bg-gray-700'
            }`}
          >
            <div
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                showGrid ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Ruler size={18} className="text-gray-400" />
            <span className="text-sm text-white">Show Guides</span>
          </div>
          <button
            onClick={onToggleGuides}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              showGuides ? 'bg-[#ffd700]' : 'bg-gray-700'
            }`}
          >
            <div
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                showGuides ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {showGrid && (
          <div>
            <label className="text-xs text-gray-400 mb-2 block">
              Grid Size: {gridSize}px
            </label>
            <input
              type="range"
              min={10}
              max={50}
              step={5}
              value={gridSize}
              onChange={(e) => onGridSizeChange(parseInt(e.target.value))}
              className="w-full"
              style={{ accentColor: '#ffd700' }}
            />
          </div>
        )}

        <div className="pt-4 border-t border-gray-700">
          <div className="text-xs text-gray-500">
            Grid and guides help align elements precisely. Guides can be dragged from rulers.
          </div>
        </div>
      </div>
    </motion.div>
  );
};



