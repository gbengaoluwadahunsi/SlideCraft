"use client";

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Bold, Italic, Underline, Type, Palette, AlignLeft, AlignCenter, AlignRight, Smile } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';

export const TextToolbar = () => {
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const [adjustedPosition, setAdjustedPosition] = useState<{ top: number; left: number; transform: string } | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const toolbarRef = useRef<HTMLDivElement>(null);

  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showFontPicker, setShowFontPicker] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const savedSelectionRef = useRef<Range | null>(null);
  const savedElementRef = useRef<HTMLElement | null>(null);
  const emojiPickerOpenRef = useRef(false);

  // Detect mobile/touch devices - hide toolbar to avoid conflict with native selection menu
  useEffect(() => {
    const checkMobile = () => {
      // Check for touch capability OR small screen
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isSmallScreen = window.innerWidth < 768;
      setIsMobile(isTouchDevice || isSmallScreen);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Adjust position to stay within viewport
  const adjustPositionToViewport = useCallback(() => {
    if (!position || !toolbarRef.current) return;
    
    const toolbar = toolbarRef.current;
    const toolbarWidth = toolbar.offsetWidth;
    const viewportWidth = window.innerWidth;
    const padding = 8; // Minimum padding from edges
    
    let adjustedLeft = position.left;
    let transform = 'translateX(-50%)';
    
    // Calculate the actual left position after centering
    const actualLeft = position.left - toolbarWidth / 2;
    const actualRight = position.left + toolbarWidth / 2;
    
    if (actualLeft < padding) {
      // Toolbar would overflow on the left
      adjustedLeft = padding;
      transform = 'translateX(0)';
    } else if (actualRight > viewportWidth - padding) {
      // Toolbar would overflow on the right
      adjustedLeft = viewportWidth - padding;
      transform = 'translateX(-100%)';
    }
    
    setAdjustedPosition({
      top: position.top,
      left: adjustedLeft,
      transform
    });
  }, [position]);

  useEffect(() => {
    if (position && toolbarRef.current) {
      // Delay to ensure toolbar is rendered before measuring
      requestAnimationFrame(adjustPositionToViewport);
    }
  }, [position, adjustPositionToViewport]);

  // Keep ref in sync with state
  useEffect(() => {
    emojiPickerOpenRef.current = showEmojiPicker;
  }, [showEmojiPicker]);

  // Close emoji picker when clicking outside
  useEffect(() => {
    if (!showEmojiPicker) return;
    
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Don't close if clicking inside the toolbar or emoji picker
      if (toolbarRef.current?.contains(target)) return;
      setShowEmojiPicker(false);
    };

    // Delay adding listener to prevent immediate closure
    const timer = setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showEmojiPicker]);

  useEffect(() => {
    const handleSelectionChange = () => {
      // Don't hide toolbar if emoji picker is open
      if (emojiPickerOpenRef.current) {
        return;
      }

      const selection = window.getSelection();
      
      if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
        setIsVisible(false);
        setShowColorPicker(false);
        setShowFontPicker(false);
        setShowEmojiPicker(false);
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

  const saveSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      savedSelectionRef.current = range.cloneRange();
      // Save the contenteditable element
      const container = range.commonAncestorContainer;
      const element = container.nodeType === Node.TEXT_NODE 
        ? container.parentElement 
        : container as HTMLElement;
      savedElementRef.current = element?.closest('[contenteditable="true"]') as HTMLElement | null;
    }
  };

  const insertEmoji = (emoji: string) => {
    // Focus the saved element first
    if (savedElementRef.current) {
      savedElementRef.current.focus();
    }

    // Restore selection
    const selection = window.getSelection();
    if (selection && savedSelectionRef.current) {
      selection.removeAllRanges();
      selection.addRange(savedSelectionRef.current);
      
      // Now insert the emoji
      const range = selection.getRangeAt(0);
      range.deleteContents();
      const textNode = document.createTextNode(emoji);
      range.insertNode(textNode);
      
      // Move cursor after the emoji
      range.setStartAfter(textNode);
      range.setEndAfter(textNode);
      selection.removeAllRanges();
      selection.addRange(range);

      // Trigger input event so React updates
      if (savedElementRef.current) {
        savedElementRef.current.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }
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

  // On mobile: position at bottom of screen to avoid conflict with native selection menu
  // On desktop: position above the selected text
  const toolbarStyle = isMobile
    ? {
        bottom: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        top: 'auto'
      }
    : adjustedPosition 
      ? { 
          top: adjustedPosition.top, 
          left: adjustedPosition.left,
          transform: adjustedPosition.transform
        }
      : { 
          top: position.top, 
          left: position.left,
          transform: 'translateX(-50%)'
        };

  return (
    <AnimatePresence>
      {isVisible && position && (
        <motion.div 
          ref={toolbarRef}
          className={`fixed z-[100] bg-gray-900 border border-gray-700 rounded-lg shadow-2xl p-1.5 ${
            isMobile ? 'max-w-[calc(100vw-32px)] overflow-x-auto hide-scrollbar' : ''
          }`}
          style={toolbarStyle}
          initial={isMobile ? { opacity: 0, y: 20 } : { opacity: 0, scale: 0.8, y: 10 }}
          animate={isMobile ? { opacity: 1, y: 0 } : { opacity: 1, scale: 1, y: 0 }}
          exit={isMobile ? { opacity: 0, y: 20 } : { opacity: 0, scale: 0.8, y: 10 }}
          transition={{ duration: 0.2, type: "spring", stiffness: 300, damping: 25 }}
          onMouseDown={(e) => e.preventDefault()} // Prevent losing focus from text
          onTouchStart={(e) => e.preventDefault()} // Prevent touch events from dismissing selection
        >
          <div className="flex items-center gap-1">
      {/* Font Family Picker */}
      <div className="relative">
        <motion.button 
            onClick={() => {
                setShowFontPicker(!showFontPicker);
                setShowColorPicker(false);
                setShowEmojiPicker(false);
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
              className={`absolute bg-gray-900 border border-gray-700 rounded-lg shadow-xl overflow-hidden flex flex-col w-32 max-h-60 overflow-y-auto ${
                isMobile ? 'bottom-full mb-2 left-0' : 'top-full mt-2 left-1/2 -translate-x-1/2'
              }`}
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
                setShowEmojiPicker(false);
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
              className={`absolute bg-gray-900 border border-gray-700 rounded-lg shadow-xl p-2 grid grid-cols-5 gap-1 w-40 ${
                isMobile ? 'bottom-full mb-2 right-0' : 'top-full mt-2 left-1/2 -translate-x-1/2'
              }`}
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

      {/* Emoji Picker */}
      <div className="relative">
        <motion.button 
            onClick={() => {
                saveSelection();
                setShowEmojiPicker(!showEmojiPicker);
                setShowColorPicker(false);
                setShowFontPicker(false);
            }}
            className={`p-1.5 rounded transition ${showEmojiPicker ? 'bg-gray-800 text-white' : 'text-gray-300 hover:text-white hover:bg-gray-800'}`}
            title="Insert Emoji"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
        >
            <Smile size={16} />
        </motion.button>
        
        <AnimatePresence>
          {showEmojiPicker && (
            <motion.div 
              className={`absolute z-50 ${isMobile ? 'bottom-full mb-2 right-0' : 'top-full mt-2 right-0'}`}
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              onMouseDown={(e) => e.preventDefault()}
            >
              <EmojiPicker
                onEmojiClick={(emojiData: EmojiClickData) => {
                  insertEmoji(emojiData.emoji);
                  setShowEmojiPicker(false);
                }}
                theme={Theme.DARK}
                width={isMobile ? Math.min(280, window.innerWidth - 32) : 300}
                height={isMobile ? 300 : 350}
                searchPlaceholder="Search..."
                previewConfig={{ showPreview: false }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
