"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Square, Circle, Minus, ArrowRight, X } from 'lucide-react';

interface Shape {
  id: string;
  type: 'rectangle' | 'circle' | 'line' | 'arrow';
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  strokeWidth: number;
  fill: boolean;
}

interface ShapesToolProps {
  onAddShape: (shape: Omit<Shape, 'id'>) => void;
  onClose: () => void;
  isOpen?: boolean;
}

export const ShapesTool: React.FC<ShapesToolProps> = ({ onAddShape, onClose, isOpen = false }) => {
  // This component is deprecated - shapes are now in Properties Panel
  // Only render if explicitly opened (for backwards compatibility)
  if (!isOpen) return null;
  const [selectedType, setSelectedType] = useState<'rectangle' | 'circle' | 'line' | 'arrow'>('rectangle');
  const [color, setColor] = useState('#ffd700');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [fill, setFill] = useState(false);

  const handleAddShape = () => {
    onAddShape({
      type: selectedType,
      x: 100,
      y: 100,
      width: selectedType === 'line' || selectedType === 'arrow' ? 200 : 150,
      height: selectedType === 'line' || selectedType === 'arrow' ? 2 : 100,
      color,
      strokeWidth,
      fill,
    });
  };

  const shapes = [
    { type: 'rectangle' as const, icon: Square, label: 'Rectangle' },
    { type: 'circle' as const, icon: Circle, label: 'Circle' },
    { type: 'line' as const, icon: Minus, label: 'Line' },
    { type: 'arrow' as const, icon: ArrowRight, label: 'Arrow' },
  ];

  return (
    <motion.div
      className="fixed top-20 right-4 z-[150] bg-gray-900 border border-gray-700 rounded-lg shadow-2xl p-4 w-64"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white">Shapes</h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-800 rounded transition-colors"
        >
          <X size={18} className="text-gray-400" />
        </button>
      </div>

      <div className="space-y-4">
        {/* Shape Type Selection */}
        <div>
          <label className="text-xs text-gray-400 mb-2 block">Shape Type</label>
          <div className="grid grid-cols-2 gap-2">
            {shapes.map(({ type, icon: Icon, label }) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`p-3 rounded-lg border-2 transition ${
                  selectedType === type
                    ? 'border-[#ffd700] bg-[#ffd700]/10'
                    : 'border-gray-700 hover:border-gray-600'
                }`}
              >
                <Icon size={24} className="text-white mx-auto mb-1" />
                <div className="text-xs text-gray-300">{label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Color Picker */}
        <div>
          <label className="text-xs text-gray-400 mb-2 block">Color</label>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-full h-10 rounded-lg cursor-pointer border-2 border-gray-600 hover:border-[#ffd700] transition-colors"
          />
        </div>

        {/* Stroke Width */}
        <div>
          <label className="text-xs text-gray-400 mb-2 block">Stroke Width: {strokeWidth}px</label>
          <input
            type="range"
            min={1}
            max={10}
            value={strokeWidth}
            onChange={(e) => setStrokeWidth(parseInt(e.target.value))}
            className="w-full"
            style={{ accentColor: '#ffd700' }}
          />
        </div>

        {/* Fill Toggle */}
        {(selectedType === 'rectangle' || selectedType === 'circle') && (
          <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
            <input
              type="checkbox"
              checked={fill}
              onChange={(e) => setFill(e.target.checked)}
              className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-[#ffd700] focus:ring-[#ffd700]"
            />
            Fill shape
          </label>
        )}

        {/* Add Button */}
        <button
          onClick={handleAddShape}
          className="w-full px-4 py-2 bg-[#ffd700] hover:bg-yellow-400 text-black rounded-lg font-semibold transition-colors"
        >
          Add Shape
        </button>
      </div>
    </motion.div>
  );
};

