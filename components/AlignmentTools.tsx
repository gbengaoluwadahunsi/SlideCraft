"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { AlignLeft, AlignCenter, AlignRight, AlignVerticalJustifyCenter, AlignHorizontalJustifyCenter, X, MoveHorizontal, MoveVertical } from 'lucide-react';

interface AlignmentToolsProps {
  onAlign: (type: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom' | 'distribute-h' | 'distribute-v') => void;
  onClose: () => void;
  isOpen: boolean;
}

export const AlignmentTools: React.FC<AlignmentToolsProps> = ({ onAlign, onClose, isOpen }) => {
  if (!isOpen) return null;

  const alignmentOptions = [
    { type: 'left' as const, icon: AlignLeft, label: 'Align Left' },
    { type: 'center' as const, icon: AlignCenter, label: 'Align Center' },
    { type: 'right' as const, icon: AlignRight, label: 'Align Right' },
    { type: 'top' as const, icon: AlignVerticalJustifyCenter, label: 'Align Top' },
    { type: 'middle' as const, icon: AlignHorizontalJustifyCenter, label: 'Align Middle' },
    { type: 'bottom' as const, icon: AlignVerticalJustifyCenter, label: 'Align Bottom' },
    { type: 'distribute-h' as const, icon: MoveHorizontal, label: 'Distribute Horizontally' },
    { type: 'distribute-v' as const, icon: MoveVertical, label: 'Distribute Vertically' },
  ];

  return (
    <motion.div
      className="fixed top-20 right-4 z-[150] bg-gray-900 border border-gray-700 rounded-lg shadow-2xl p-4 w-64"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white">Alignment</h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-800 rounded transition-colors"
        >
          <X size={18} className="text-gray-400" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {alignmentOptions.map(({ type, icon: Icon, label }) => (
          <button
            key={type}
            onClick={() => {
              onAlign(type);
              onClose();
            }}
            className="p-3 rounded-lg border-2 border-gray-700 hover:border-[#ffd700] hover:bg-[#ffd700]/10 transition-colors flex flex-col items-center gap-2"
          >
            <Icon size={20} className="text-white" />
            <span className="text-xs text-gray-300 text-center">{label}</span>
          </button>
        ))}
      </div>
    </motion.div>
  );
};



