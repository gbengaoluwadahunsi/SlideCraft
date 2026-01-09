"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Palette, Type, X, Plus, Trash2, Save } from 'lucide-react';

interface BrandColor {
  id: string;
  name: string;
  value: string;
}

interface BrandFont {
  id: string;
  name: string;
  value: string;
}

interface BrandKitProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyBrand: (colors: BrandColor[], fonts: BrandFont[]) => void;
}

export const BrandKit: React.FC<BrandKitProps> = ({ isOpen, onClose, onApplyBrand }) => {
  const [colors, setColors] = useState<BrandColor[]>([]);
  const [fonts, setFonts] = useState<BrandFont[]>([]);
  const [newColorName, setNewColorName] = useState('');
  const [newColorValue, setNewColorValue] = useState('#ffd700');
  const [newFontName, setNewFontName] = useState('');
  const [newFontValue, setNewFontValue] = useState('var(--font-inter)');

  useEffect(() => {
    // Load from localStorage
    const savedColors = localStorage.getItem('brandKit_colors');
    const savedFonts = localStorage.getItem('brandKit_fonts');
    if (savedColors) setColors(JSON.parse(savedColors));
    if (savedFonts) setFonts(JSON.parse(savedFonts));
  }, []);

  const saveToLocalStorage = () => {
    localStorage.setItem('brandKit_colors', JSON.stringify(colors));
    localStorage.setItem('brandKit_fonts', JSON.stringify(fonts));
  };

  const addColor = () => {
    if (newColorName.trim() && newColorValue) {
      const newColor: BrandColor = {
        id: Date.now().toString(),
        name: newColorName.trim(),
        value: newColorValue,
      };
      setColors([...colors, newColor]);
      setNewColorName('');
      saveToLocalStorage();
    }
  };

  const removeColor = (id: string) => {
    setColors(colors.filter(c => c.id !== id));
    saveToLocalStorage();
  };

  const addFont = () => {
    if (newFontName.trim() && newFontValue) {
      const newFont: BrandFont = {
        id: Date.now().toString(),
        name: newFontName.trim(),
        value: newFontValue,
      };
      setFonts([...fonts, newFont]);
      setNewFontName('');
      saveToLocalStorage();
    }
  };

  const removeFont = (id: string) => {
    setFonts(fonts.filter(f => f.id !== id));
    saveToLocalStorage();
  };

  const handleApply = () => {
    onApplyBrand(colors, fonts);
    saveToLocalStorage();
  };

  const fontOptions = [
    { name: 'Inter', value: 'var(--font-inter)' },
    { name: 'Playfair', value: 'var(--font-playfair)' },
    { name: 'Oswald', value: 'var(--font-oswald)' },
    { name: 'Roboto Mono', value: 'var(--font-roboto-mono)' },
    { name: 'Permanent Marker', value: 'var(--font-permanent-marker)' },
  ];

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
          <Palette size={20} className="text-[#ffd700]" />
          <h3 className="text-lg font-bold text-white">Brand Kit</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-800 rounded transition-colors"
        >
          <X size={18} className="text-gray-400" />
        </button>
      </div>

      <div className="space-y-6">
        {/* Colors Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-semibold text-white">Brand Colors</label>
            <button
              onClick={handleApply}
              className="px-3 py-1.5 bg-[#ffd700] hover:bg-yellow-400 text-black rounded-lg text-xs font-semibold transition-colors flex items-center gap-1"
            >
              <Save size={14} />
              Apply
            </button>
          </div>

          <div className="space-y-2 mb-3">
            {colors.map((color) => (
              <div key={color.id} className="flex items-center gap-2 p-2 bg-gray-800 rounded-lg">
                <div
                  className="w-8 h-8 rounded border border-gray-600"
                  style={{ backgroundColor: color.value }}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white truncate">{color.name}</div>
                  <div className="text-xs text-gray-400">{color.value}</div>
                </div>
                <button
                  onClick={() => removeColor(color.id)}
                  className="p-1 hover:bg-gray-700 rounded transition-colors"
                >
                  <Trash2 size={14} className="text-gray-400" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={newColorName}
              onChange={(e) => setNewColorName(e.target.value)}
              placeholder="Color name"
              className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#ffd700] text-sm"
            />
            <input
              type="color"
              value={newColorValue}
              onChange={(e) => setNewColorValue(e.target.value)}
              className="w-12 h-10 rounded-lg cursor-pointer border-2 border-gray-600 hover:border-[#ffd700] transition-colors"
            />
            <button
              onClick={addColor}
              className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>

        {/* Fonts Section */}
        <div>
          <label className="text-sm font-semibold text-white mb-3 block">Brand Fonts</label>

          <div className="space-y-2 mb-3">
            {fonts.map((font) => (
              <div key={font.id} className="flex items-center gap-2 p-2 bg-gray-800 rounded-lg">
                <Type size={16} className="text-gray-400" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white truncate">{font.name}</div>
                  <div className="text-xs text-gray-400 truncate">{font.value}</div>
                </div>
                <button
                  onClick={() => removeFont(font.id)}
                  className="p-1 hover:bg-gray-700 rounded transition-colors"
                >
                  <Trash2 size={14} className="text-gray-400" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={newFontName}
              onChange={(e) => setNewFontName(e.target.value)}
              placeholder="Font name"
              className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#ffd700] text-sm"
            />
            <select
              value={newFontValue}
              onChange={(e) => setNewFontValue(e.target.value)}
              className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[#ffd700] text-sm"
            >
              {fontOptions.map((font) => (
                <option key={font.value} value={font.value}>
                  {font.name}
                </option>
              ))}
            </select>
            <button
              onClick={addFont}
              className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};



