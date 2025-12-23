"use client";

import React, { useEffect, useState, useRef } from 'react';
import { Bold, Italic, Underline, Type, Palette, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const TextToolbar = () => {
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const toolbarRef = useRef<HTMLDivElement>(null);

  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showFontPicker, setShowFontPicker] = useState(false);

  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      
      if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
        setIsVisible(false);
        setShowColorPicker(false);
        setShowFontPicker(false);
        return;
      }

      const range = selection.getRangeAt(0);
      const container = range.commonAncestorContainer.parentElement;

      // Check if the selection is inside a contenteditable element
      if (!container?.closest('[contenteditable="true"]')) {
        setIsVisible(false);
        return;
      }

      const rect = range.getBoundingClientRect();
      
      // Calculate position (centered above selection)
      setPosition({
        top: rect.top - 50, // 50px above
        left: rect.left + rect.width / 2
      });
      setIsVisible(true);
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, []);

  const execCommand = (command: string, value: string = '') => {
    // Ensure we use CSS styles instead of HTML tags (like <font>) where possible
    if (!document.queryCommandState('styleWithCSS')) {
      document.execCommand('styleWithCSS', false, 'true');
    }
    document.execCommand(command, false, value);
  };

  const adjustSelectionFontSize = (delta: number) => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
      return;
    }

    const range = selection.getRangeAt(0);
    const parentElement = range.startContainer.parentElement;
    const computedSize = parentElement
      ? parseFloat(window.getComputedStyle(parentElement).fontSize || '16')
      : 16;
    const newSize = Math.min(96, Math.max(12, computedSize + delta));

    const wrapper = document.createElement('span');
    wrapper.style.fontSize = `${newSize}px`;

    wrapper.appendChild(range.extractContents());
    range.insertNode(wrapper);

    // Re-select the updated content so the user can continue editing
    selection.removeAllRanges();
    const newRange = document.createRange();
    newRange.selectNodeContents(wrapper);
    selection.addRange(newRange);
  };

  const fonts = [
    { name: 'Default', value: 'inherit', style: { fontFamily: 'inherit' } },
    { name: 'Inter', value: 'var(--font-inter)', style: { fontFamily: 'var(--font-inter)' } },
    { name: 'Playfair', value: 'var(--font-playfair)', style: { fontFamily: 'var(--font-playfair)' } },
    { name: 'Oswald', value: 'var(--font-oswald)', style: { fontFamily: 'var(--font-oswald)' } },
    { name: 'Mono', value: 'var(--font-roboto-mono)', style: { fontFamily: 'var(--font-roboto-mono)' } },
    { name: 'Marker', value: 'var(--font-permanent-marker)', style: { fontFamily: 'var(--font-permanent-marker)' } },
  ];

  if (!isVisible || !position) return null;

  return (
    <AnimatePresence>
      {isVisible && position && (
        <motion.div 
          ref={toolbarRef}
          className="fixed z-50 flex items-center gap-1 bg-gray-900 border border-gray-700 rounded-lg shadow-2xl p-1.5"
          style={{ 
            top: position.top, 
            left: position.left,
            transform: 'translateX(-50%)'
          }}
          initial={{ opacity: 0, scale: 0.8, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 10 }}
          transition={{ duration: 0.2, type: "spring", stiffness: 300, damping: 25 }}
          onMouseDown={(e) => e.preventDefault()} // Prevent losing focus from text
        >
      {/* Font Family Picker */}
      <div className="relative">
        <motion.button 
            onClick={() => {
                setShowFontPicker(!showFontPicker);
                setShowColorPicker(false);
            }}
            className={`p-1.5 rounded transition ${showFontPicker ? 'bg-gray-800 text-white' : 'text-gray-300 hover:text-white hover:bg-gray-800'}`}
            title="Font Family"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
        >
            <Type size={16} />
        </motion.button>
        
        <AnimatePresence>
          {showFontPicker && (
            <motion.div 
              className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-gray-900 border border-gray-700 rounded-lg shadow-xl overflow-hidden flex flex-col w-32 max-h-60 overflow-y-auto"
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
                {fonts.map(font => (
                    <button
                        key={font.name}
                        onMouseDown={(e) => {
                            e.preventDefault();
                            execCommand('fontName', font.value);
                            setShowFontPicker(false);
                        }}
                        className="px-3 py-2 text-left text-sm text-gray-300 hover:text-white hover:bg-gray-800 transition"
                        style={font.style}
                    >
                        {font.name}
                    </button>
                ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="w-px h-4 bg-gray-700 mx-1"></div>

      {/* Font size controls */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => adjustSelectionFontSize(-2)}
          className="px-2 py-1 text-xs text-gray-300 hover:text-white hover:bg-gray-800 rounded transition"
          title="Decrease font size"
        >
          A-
        </button>
        <button
          onClick={() => adjustSelectionFontSize(2)}
          className="px-2 py-1 text-xs text-gray-300 hover:text-white hover:bg-gray-800 rounded transition"
          title="Increase font size"
        >
          A+
        </button>
      </div>

      <div className="w-px h-4 bg-gray-700 mx-1"></div>

      <motion.button 
        onClick={() => execCommand('bold')}
        className="p-1.5 text-gray-300 hover:text-white hover:bg-gray-800 rounded transition"
        title="Bold"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <Bold size={16} />
      </motion.button>
      <motion.button 
        onClick={() => execCommand('italic')}
        className="p-1.5 text-gray-300 hover:text-white hover:bg-gray-800 rounded transition"
        title="Italic"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <Italic size={16} />
      </motion.button>
      <motion.button 
        onClick={() => execCommand('underline')}
        className="p-1.5 text-gray-300 hover:text-white hover:bg-gray-800 rounded transition"
        title="Underline"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <Underline size={16} />
      </motion.button>
      
      <div className="w-px h-4 bg-gray-700 mx-1"></div>

      {/* Alignment */}
      <motion.button 
        onClick={() => execCommand('justifyLeft')}
        className="p-1.5 text-gray-300 hover:text-white hover:bg-gray-800 rounded transition"
        title="Align Left"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <AlignLeft size={16} />
      </motion.button>
      <motion.button 
        onClick={() => execCommand('justifyCenter')}
        className="p-1.5 text-gray-300 hover:text-white hover:bg-gray-800 rounded transition"
        title="Align Center"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <AlignCenter size={16} />
      </motion.button>
      <motion.button 
        onClick={() => execCommand('justifyRight')}
        className="p-1.5 text-gray-300 hover:text-white hover:bg-gray-800 rounded transition"
        title="Align Right"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <AlignRight size={16} />
      </motion.button>

      <div className="w-px h-4 bg-gray-700 mx-1"></div>
      
      {/* Color Picker */}
      <div className="relative">
        <motion.button 
            onClick={() => {
                setShowColorPicker(!showColorPicker);
                setShowFontPicker(false);
            }}
            className={`p-1.5 rounded transition ${showColorPicker ? 'bg-gray-800 text-white' : 'text-gray-300 hover:text-white hover:bg-gray-800'}`}
            title="Text Color"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
        >
            <Palette size={16} />
        </motion.button>
        
        <AnimatePresence>
          {showColorPicker && (
            <motion.div 
              className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-gray-900 border border-gray-700 rounded-lg shadow-xl p-2 grid grid-cols-5 gap-1 w-40"
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
                {['#ffffff', '#000000', '#ffd700', '#ff4d4d', '#4dff4d', '#4da6ff', '#ff4dff', '#f97316', '#8b5cf6', '#ec4899'].map(color => (
                    <button
                        key={color}
                        onMouseDown={(e) => {
                            e.preventDefault();
                            execCommand('foreColor', color);
                            setShowColorPicker(false);
                        }}
                        className="w-6 h-6 rounded-full border border-gray-700 hover:scale-110 transition"
                        style={{ backgroundColor: color }}
                    />
                ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
