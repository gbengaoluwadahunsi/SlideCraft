"use client";

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { 
  Bold, Italic, Underline, Type, Palette, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Smile, List, ListOrdered, Strikethrough, Minus, Plus, Link2, Highlighter, 
  Indent, Outdent, Superscript, Subscript, RotateCcw, ChevronDown, X,
  CaseSensitive, CaseUpper, CaseLower, ALargeSmall, Space, LineChart, Pipette, Copy, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
// Simple emoji grid - no external library needed
import { getGlobalHoveredElement, globalHoverListeners } from '@/lib/textHover';

interface TextToolbarProps {
  isOpen?: boolean;
  onToggle?: () => void;
  hoveredElement?: HTMLElement | null;
  inline?: boolean; // When true, renders just the buttons without floating container
}

export const TextToolbar = ({ isOpen: externalIsOpen, onToggle, hoveredElement, inline = false }: TextToolbarProps = {}) => {
  const [internalIsVisible, setInternalIsVisible] = useState(false);
  const [currentHoveredElement, setCurrentHoveredElement] = useState<HTMLElement | null>(null);
  const isVisible = externalIsOpen !== undefined ? externalIsOpen : (internalIsVisible || currentHoveredElement !== null);
  const [isMobile, setIsMobile] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState<{ top: string | number; left: string | number; position: 'fixed' } | null>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);

  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const [showFontPicker, setShowFontPicker] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [showLineHeightPicker, setShowLineHeightPicker] = useState(false);
  const [showLetterSpacingPicker, setShowLetterSpacingPicker] = useState(false);
  const [showTextEffectsPicker, setShowTextEffectsPicker] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [fontSizeInput, setFontSizeInput] = useState('16');
  const [lineHeight, setLineHeight] = useState('1.5');
  const [letterSpacing, setLetterSpacing] = useState('0');
  const [recentColors, setRecentColors] = useState<string[]>([]);
  const [copiedFormat, setCopiedFormat] = useState<any>(null);
  const savedSelectionRef = useRef<Range | null>(null);
  const savedElementRef = useRef<HTMLElement | null>(null);
  const emojiPickerOpenRef = useRef(false);
  
  // Active state tracking
  const [activeStates, setActiveStates] = useState({
    bold: false,
    italic: false,
    underline: false,
    strikethrough: false,
    alignLeft: false,
    alignCenter: false,
    alignRight: false,
    alignJustify: false,
    superscript: false,
    subscript: false,
  });

  // Detect mobile devices
  useEffect(() => {
    const checkMobile = () => {
      const isSmallScreen = window.innerWidth < 768;
      const isLikelyMobileDevice = isSmallScreen && ('ontouchstart' in window || navigator.maxTouchPoints > 0);
      setIsMobile(isLikelyMobileDevice);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Keep ref in sync with state
  useEffect(() => {
    emojiPickerOpenRef.current = showEmojiPicker;
  }, [showEmojiPicker]);

  // Close all pickers when clicking outside
  useEffect(() => {
    const anyPickerOpen = showEmojiPicker || showColorPicker || showFontPicker || showHighlightPicker || showMoreOptions;
    if (!anyPickerOpen) return;
    
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (toolbarRef.current?.contains(target)) return;
      setShowEmojiPicker(false);
      setShowColorPicker(false);
      setShowFontPicker(false);
      setShowHighlightPicker(false);
      setShowMoreOptions(false);
    };

    const timer = setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showEmojiPicker, showColorPicker, showFontPicker, showHighlightPicker, showMoreOptions]);

  // Update toolbar position - always centered horizontally
  const updateToolbarPosition = useCallback(() => {
    if (isMobile) {
      setToolbarPosition({
        bottom: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        position: 'fixed'
      } as any);
      return;
    }
    
    // Always position at top center, below the header
    setToolbarPosition({
      top: '72px',
      left: '50%',
      transform: 'translateX(-50%)',
      position: 'fixed' as const,
    } as any);
  }, [isMobile]);

  // Update active states
  const updateActiveStates = useCallback(() => {
    const element = savedElementRef.current;
    if (!element) return;
    
    try {
      const selection = window.getSelection();
      let range: Range | null = null;

      if (savedSelectionRef.current) {
        range = savedSelectionRef.current.cloneRange();
      } else if (element) {
        range = document.createRange();
        range.selectNodeContents(element);
      }

      if (!range) return;

      if (selection) {
        const previousRange = selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
        selection.removeAllRanges();
        selection.addRange(range);

        setActiveStates({
          bold: document.queryCommandState('bold'),
          italic: document.queryCommandState('italic'),
          underline: document.queryCommandState('underline'),
          strikethrough: document.queryCommandState('strikethrough'),
          alignLeft: document.queryCommandState('justifyLeft'),
          alignCenter: document.queryCommandState('justifyCenter'),
          alignRight: document.queryCommandState('justifyRight'),
          alignJustify: document.queryCommandState('justifyFull'),
          superscript: document.queryCommandState('superscript'),
          subscript: document.queryCommandState('subscript'),
        });

        // Get font size
        const parentElement = range.startContainer.parentElement || element;
        if (parentElement) {
          const fontSize = window.getComputedStyle(parentElement).fontSize;
          const size = parseFloat(fontSize);
          setFontSizeInput(isNaN(size) ? '16' : Math.round(size).toString());
        }

        if (previousRange) {
          selection.removeAllRanges();
          selection.addRange(previousRange);
        } else {
          selection.removeAllRanges();
        }
      }
    } catch (e) {
      // Ignore errors
    }
  }, []);

  // Initialize toolbar position when opened externally
  useEffect(() => {
    if (externalIsOpen && !toolbarPosition) {
      updateToolbarPosition();
    }
  }, [externalIsOpen, toolbarPosition, updateToolbarPosition]);

  // Listen for hover changes
  useEffect(() => {
    const handleHoverChange = (element: HTMLElement | null) => {
      setCurrentHoveredElement(element);
      if (element && externalIsOpen === undefined) {
        setInternalIsVisible(true);
        savedElementRef.current = element;
        const range = document.createRange();
        range.selectNodeContents(element);
        savedSelectionRef.current = range;
        setTimeout(() => {
          updateActiveStates();
          updateToolbarPosition();
        }, 50);
      } else if (!element && externalIsOpen === undefined) {
        const selection = window.getSelection();
        const hasSelection = selection && !selection.isCollapsed;
        const anyPickerOpen = showEmojiPicker || showColorPicker || showFontPicker || showHighlightPicker || showMoreOptions;
        
        if (!hasSelection && !anyPickerOpen) {
          setTimeout(() => {
            const currentSelection = window.getSelection();
            const stillHasSelection = currentSelection && !currentSelection.isCollapsed;
            if (!getGlobalHoveredElement() && !stillHasSelection) {
              setInternalIsVisible(false);
            }
          }, 400);
        }
      }
    };

    globalHoverListeners.add(handleHoverChange);
    return () => {
      globalHoverListeners.delete(handleHoverChange);
    };
  }, [externalIsOpen, showEmojiPicker, showColorPicker, showFontPicker, showHighlightPicker, showMoreOptions, updateActiveStates, updateToolbarPosition]);

  useEffect(() => {
    let showTimeoutId: NodeJS.Timeout | null = null;
    let hideTimeoutId: NodeJS.Timeout | null = null;
    
    const handleSelectionChange = () => {
      if (emojiPickerOpenRef.current) return;

      const selection = window.getSelection();
      
      if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
        if (showTimeoutId) {
          clearTimeout(showTimeoutId);
          showTimeoutId = null;
        }
        
        const anyPickerOpen = showEmojiPicker || showColorPicker || showFontPicker || showHighlightPicker || showMoreOptions;
        
        if (!getGlobalHoveredElement() && !anyPickerOpen) {
          if (hideTimeoutId) clearTimeout(hideTimeoutId);
          hideTimeoutId = setTimeout(() => {
            const currentSelection = window.getSelection();
            const currentHovered = getGlobalHoveredElement();
            if (!currentSelection || currentSelection.rangeCount === 0 || currentSelection.isCollapsed) {
              if (externalIsOpen === undefined && !currentHovered) {
                setInternalIsVisible(false);
              }
              if (!currentHovered) {
                closeAllPickers();
              }
            }
          }, 300);
        }
        return;
      }

      if (hideTimeoutId) {
        clearTimeout(hideTimeoutId);
        hideTimeoutId = null;
      }

      const range = selection.getRangeAt(0);
      const container = range.commonAncestorContainer.parentElement;

      if (!container?.closest('[contenteditable="true"]')) {
        if (externalIsOpen === undefined) {
          setInternalIsVisible(false);
        }
        return;
      }

      savedSelectionRef.current = range.cloneRange();
      const element = range.commonAncestorContainer.nodeType === Node.TEXT_NODE 
        ? range.commonAncestorContainer.parentElement 
        : range.commonAncestorContainer as HTMLElement;
      savedElementRef.current = element?.closest('[contenteditable="true"]') as HTMLElement | null;

      if (showTimeoutId) clearTimeout(showTimeoutId);
      showTimeoutId = setTimeout(() => {
        const currentSelection = window.getSelection();
        if (currentSelection && currentSelection.rangeCount > 0 && !currentSelection.isCollapsed) {
          if (externalIsOpen === undefined) {
            setInternalIsVisible(true);
          }
          updateActiveStates();
          updateToolbarPosition();
        }
      }, 50);
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
      if (showTimeoutId) clearTimeout(showTimeoutId);
      if (hideTimeoutId) clearTimeout(hideTimeoutId);
    };
  }, [externalIsOpen, showEmojiPicker, showColorPicker, showFontPicker, showHighlightPicker, showMoreOptions, updateActiveStates, updateToolbarPosition]);

  const closeAllPickers = () => {
    setShowColorPicker(false);
    setShowFontPicker(false);
    setShowEmojiPicker(false);
    setShowHighlightPicker(false);
    setShowMoreOptions(false);
    setShowLineHeightPicker(false);
    setShowLetterSpacingPicker(false);
    setShowTextEffectsPicker(false);
  };

  const execCommand = (command: string, value: string = '') => {
    // Handle foreColor (text color) with modern approach
    if (command === 'foreColor' && value) {
      if (savedElementRef.current) {
        savedElementRef.current.focus();
      }

      const selection = window.getSelection();
      if (!selection || !savedSelectionRef.current || !savedElementRef.current) return;

      selection.removeAllRanges();
      selection.addRange(savedSelectionRef.current.cloneRange());

      if (selection.rangeCount === 0 || selection.isCollapsed) return;

      const range = selection.getRangeAt(0);
      const wrapper = document.createElement('span');
      wrapper.style.color = value;

      wrapper.appendChild(range.extractContents());
      range.insertNode(wrapper);

      selection.removeAllRanges();
      const newRange = document.createRange();
      newRange.selectNodeContents(wrapper);
      selection.addRange(newRange);

      if (!recentColors.includes(value)) {
        setRecentColors(prev => [value, ...prev.slice(0, 7)]);
      }

      if (savedElementRef.current) {
        savedElementRef.current.dispatchEvent(new Event('input', { bubbles: true }));
      }

      saveSelection();
      return;
    }

    // For other commands, use execCommand (still works for most formatting)
    const selection = window.getSelection();
    if (selection && savedSelectionRef.current && savedElementRef.current) {
      savedElementRef.current.focus();
      selection.removeAllRanges();
      selection.addRange(savedSelectionRef.current.cloneRange());
    }
    
    if (!document.queryCommandState('styleWithCSS')) {
      document.execCommand('styleWithCSS', false, 'true');
    }
    document.execCommand(command, false, value);
    
    if (savedElementRef.current) {
      savedElementRef.current.dispatchEvent(new Event('input', { bubbles: true }));
    }
    
    setTimeout(updateActiveStates, 50);
    saveSelection();
  };

  const saveSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      savedSelectionRef.current = range.cloneRange();
      const container = range.commonAncestorContainer;
      const element = container.nodeType === Node.TEXT_NODE 
        ? container.parentElement 
        : container as HTMLElement;
      savedElementRef.current = element?.closest('[contenteditable="true"]') as HTMLElement | null;
    }
  };

  const insertEmoji = (emoji: string) => {
    if (savedElementRef.current) {
      savedElementRef.current.focus();
    }

    const selection = window.getSelection();
    if (selection && savedSelectionRef.current) {
      selection.removeAllRanges();
      selection.addRange(savedSelectionRef.current);
      
      const range = selection.getRangeAt(0);
      range.deleteContents();
      const textNode = document.createTextNode(emoji);
      range.insertNode(textNode);
      
      range.setStartAfter(textNode);
      range.setEndAfter(textNode);
      selection.removeAllRanges();
      selection.addRange(range);

      if (savedElementRef.current) {
        savedElementRef.current.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }
  };

  const adjustFontSize = (delta: number) => {
    if (savedElementRef.current) {
      savedElementRef.current.focus();
    }

    const selection = window.getSelection();
    if (!selection || !savedSelectionRef.current || !savedElementRef.current) return;

    selection.removeAllRanges();
    selection.addRange(savedSelectionRef.current.cloneRange());

    if (selection.rangeCount === 0 || selection.isCollapsed) return;

    const range = selection.getRangeAt(0);
    const parentElement = range.startContainer.parentElement;
    const computedSize = parentElement
      ? parseFloat(window.getComputedStyle(parentElement).fontSize || '16')
      : 16;
    const newSize = Math.min(120, Math.max(8, computedSize + delta));

    const wrapper = document.createElement('span');
    wrapper.style.fontSize = `${newSize}px`;

    wrapper.appendChild(range.extractContents());
    range.insertNode(wrapper);

    selection.removeAllRanges();
    const newRange = document.createRange();
    newRange.selectNodeContents(wrapper);
    selection.addRange(newRange);

    setFontSizeInput(Math.round(newSize).toString());

    if (savedElementRef.current) {
      savedElementRef.current.dispatchEvent(new Event('input', { bubbles: true }));
    }

    saveSelection();
  };

  const applyFontSize = (size: number) => {
    if (savedElementRef.current) {
      savedElementRef.current.focus();
    }

    const selection = window.getSelection();
    if (!selection || !savedSelectionRef.current || !savedElementRef.current) return;

    selection.removeAllRanges();
    selection.addRange(savedSelectionRef.current.cloneRange());

    if (selection.rangeCount === 0 || selection.isCollapsed) return;

    const range = selection.getRangeAt(0);
    const wrapper = document.createElement('span');
    wrapper.style.fontSize = `${size}px`;

    wrapper.appendChild(range.extractContents());
    range.insertNode(wrapper);

    selection.removeAllRanges();
    const newRange = document.createRange();
    newRange.selectNodeContents(wrapper);
    selection.addRange(newRange);

    if (savedElementRef.current) {
      savedElementRef.current.dispatchEvent(new Event('input', { bubbles: true }));
    }

    saveSelection();
  };

  const applyHighlight = (color: string) => {
    if (savedElementRef.current) {
      savedElementRef.current.focus();
    }

    const selection = window.getSelection();
    if (!selection || !savedSelectionRef.current || !savedElementRef.current) {
      // Try to get current selection if saved selection is not available
      if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
        const range = selection.getRangeAt(0);
        const wrapper = document.createElement('span');
        wrapper.style.backgroundColor = color;
        wrapper.style.padding = '0 2px';
        wrapper.style.borderRadius = '2px';

        wrapper.appendChild(range.extractContents());
        range.insertNode(wrapper);

        selection.removeAllRanges();
        const newRange = document.createRange();
        newRange.selectNodeContents(wrapper);
        selection.addRange(newRange);

        const container = range.commonAncestorContainer;
        const element = container.nodeType === Node.TEXT_NODE 
          ? container.parentElement 
          : container as HTMLElement;
        const editableElement = element?.closest('[contenteditable="true"]') as HTMLElement | null;
        
        if (editableElement) {
          editableElement.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }
      setShowHighlightPicker(false);
      return;
    }

    selection.removeAllRanges();
    selection.addRange(savedSelectionRef.current.cloneRange());

    if (selection.rangeCount === 0 || selection.isCollapsed) {
      setShowHighlightPicker(false);
      return;
    }

    const range = selection.getRangeAt(0);
    
    // If color is transparent, remove highlight by removing background color
    if (color === 'transparent') {
      // Find all spans with background color in the range
      const walker = document.createTreeWalker(
        range.commonAncestorContainer,
        NodeFilter.SHOW_ELEMENT,
        {
          acceptNode: (node) => {
            const el = node as HTMLElement;
            if (el.tagName === 'SPAN' && el.style.backgroundColor) {
              return NodeFilter.FILTER_ACCEPT;
            }
            return NodeFilter.FILTER_SKIP;
          }
        }
      );
      
      const spans: HTMLElement[] = [];
      let node;
      while (node = walker.nextNode()) {
        spans.push(node as HTMLElement);
      }
      
      // Also check if the range itself is within a highlighted span
      const parent = range.commonAncestorContainer.parentElement;
      if (parent && parent.tagName === 'SPAN' && parent.style.backgroundColor) {
        spans.push(parent);
      }
      
      // Remove background color from all found spans
      spans.forEach(span => {
        span.style.backgroundColor = '';
        if (!span.style.cssText.trim()) {
          // If span has no styles left, unwrap it
          const parent = span.parentNode;
          if (parent) {
            while (span.firstChild) {
              parent.insertBefore(span.firstChild, span);
            }
            parent.removeChild(span);
          }
        }
      });
    } else {
      const wrapper = document.createElement('span');
      wrapper.style.backgroundColor = color;
      wrapper.style.padding = '0 2px';
      wrapper.style.borderRadius = '2px';

      wrapper.appendChild(range.extractContents());
      range.insertNode(wrapper);

      selection.removeAllRanges();
      const newRange = document.createRange();
      newRange.selectNodeContents(wrapper);
      selection.addRange(newRange);
    }

    if (savedElementRef.current) {
      savedElementRef.current.dispatchEvent(new Event('input', { bubbles: true }));
    }

    saveSelection();
    setShowHighlightPicker(false);
  };

  const applyLineHeight = (value: string) => {
    const selection = window.getSelection();
    if (!selection || !savedSelectionRef.current || !savedElementRef.current) return;

    savedElementRef.current.focus();
    selection.removeAllRanges();
    selection.addRange(savedSelectionRef.current.cloneRange());

    const range = selection.getRangeAt(0);
    let element = range.commonAncestorContainer;
    if (element.nodeType === Node.TEXT_NODE) element = element.parentElement!;

    let blockElement = element as HTMLElement;
    while (blockElement && !['DIV', 'P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'LI', 'SPAN'].includes(blockElement.tagName)) {
      blockElement = blockElement.parentElement as HTMLElement;
    }

    if (blockElement) {
      blockElement.style.lineHeight = value;
      setLineHeight(value);
      if (savedElementRef.current) {
        savedElementRef.current.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }
    saveSelection();
    setShowLineHeightPicker(false);
  };

  const applyLetterSpacing = (value: string) => {
    const selection = window.getSelection();
    if (!selection || !savedSelectionRef.current || !savedElementRef.current) return;

    savedElementRef.current.focus();
    selection.removeAllRanges();
    selection.addRange(savedSelectionRef.current.cloneRange());

    if (selection.rangeCount === 0 || selection.isCollapsed) return;

    const range = selection.getRangeAt(0);
    const wrapper = document.createElement('span');
    wrapper.style.letterSpacing = value;

    wrapper.appendChild(range.extractContents());
    range.insertNode(wrapper);

    selection.removeAllRanges();
    const newRange = document.createRange();
    newRange.selectNodeContents(wrapper);
    selection.addRange(newRange);

    setLetterSpacing(value);
    if (savedElementRef.current) {
      savedElementRef.current.dispatchEvent(new Event('input', { bubbles: true }));
    }
    saveSelection();
    setShowLetterSpacingPicker(false);
  };

  const applyTextTransform = (transform: 'uppercase' | 'lowercase' | 'capitalize' | 'none') => {
    const selection = window.getSelection();
    if (!selection || !savedSelectionRef.current || !savedElementRef.current) return;

    savedElementRef.current.focus();
    selection.removeAllRanges();
    selection.addRange(savedSelectionRef.current.cloneRange());

    if (selection.rangeCount === 0 || selection.isCollapsed) return;

    const range = selection.getRangeAt(0);
    const wrapper = document.createElement('span');
    wrapper.style.textTransform = transform;

    wrapper.appendChild(range.extractContents());
    range.insertNode(wrapper);

    selection.removeAllRanges();
    const newRange = document.createRange();
    newRange.selectNodeContents(wrapper);
    selection.addRange(newRange);

    if (savedElementRef.current) {
      savedElementRef.current.dispatchEvent(new Event('input', { bubbles: true }));
    }
    saveSelection();
  };

  const copyFormat = () => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    let element = range.commonAncestorContainer;
    if (element.nodeType === Node.TEXT_NODE) element = element.parentElement!;

    const computedStyle = window.getComputedStyle(element as HTMLElement);
    setCopiedFormat({
      fontWeight: computedStyle.fontWeight,
      fontStyle: computedStyle.fontStyle,
      textDecoration: computedStyle.textDecoration,
      color: computedStyle.color,
      backgroundColor: computedStyle.backgroundColor,
      fontSize: computedStyle.fontSize,
      fontFamily: computedStyle.fontFamily,
      lineHeight: computedStyle.lineHeight,
      letterSpacing: computedStyle.letterSpacing,
    });
  };

  const pasteFormat = () => {
    if (!copiedFormat) return;
    const selection = window.getSelection();
    if (!selection || !savedSelectionRef.current || !savedElementRef.current) return;

    savedElementRef.current.focus();
    selection.removeAllRanges();
    selection.addRange(savedSelectionRef.current.cloneRange());

    if (selection.rangeCount === 0 || selection.isCollapsed) return;

    const range = selection.getRangeAt(0);
    const wrapper = document.createElement('span');
    
    if (copiedFormat.fontWeight) wrapper.style.fontWeight = copiedFormat.fontWeight;
    if (copiedFormat.fontStyle) wrapper.style.fontStyle = copiedFormat.fontStyle;
    if (copiedFormat.color && copiedFormat.color !== 'rgb(0, 0, 0)') wrapper.style.color = copiedFormat.color;
    if (copiedFormat.fontSize) wrapper.style.fontSize = copiedFormat.fontSize;
    if (copiedFormat.letterSpacing) wrapper.style.letterSpacing = copiedFormat.letterSpacing;

    wrapper.appendChild(range.extractContents());
    range.insertNode(wrapper);

    selection.removeAllRanges();
    const newRange = document.createRange();
    newRange.selectNodeContents(wrapper);
    selection.addRange(newRange);

    if (savedElementRef.current) {
      savedElementRef.current.dispatchEvent(new Event('input', { bubbles: true }));
    }
    saveSelection();
  };

  const applyTextEffect = (effect: 'shadow' | 'outline' | 'glow' | 'none') => {
    const selection = window.getSelection();
    if (!selection || !savedSelectionRef.current || !savedElementRef.current) return;

    savedElementRef.current.focus();
    selection.removeAllRanges();
    selection.addRange(savedSelectionRef.current.cloneRange());

    if (selection.rangeCount === 0 || selection.isCollapsed) return;

    const range = selection.getRangeAt(0);
    const wrapper = document.createElement('span');
    
    switch (effect) {
      case 'shadow':
        wrapper.style.textShadow = '2px 2px 4px rgba(0,0,0,0.5)';
        break;
      case 'outline':
        wrapper.style.textShadow = '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000';
        break;
      case 'glow':
        wrapper.style.textShadow = '0 0 10px #ffd700, 0 0 20px #ffd700, 0 0 30px #ffd700';
        break;
      case 'none':
        wrapper.style.textShadow = 'none';
        break;
    }

    wrapper.appendChild(range.extractContents());
    range.insertNode(wrapper);

    selection.removeAllRanges();
    const newRange = document.createRange();
    newRange.selectNodeContents(wrapper);
    selection.addRange(newRange);

    if (savedElementRef.current) {
      savedElementRef.current.dispatchEvent(new Event('input', { bubbles: true }));
    }
    saveSelection();
    setShowTextEffectsPicker(false);
  };

  const insertLink = () => {
    saveSelection();
    setShowLinkDialog(true);
  };

  const applyLink = (url: string) => {
    if (!url.trim()) return;

    let finalUrl = url.trim();
    if (!finalUrl.match(/^https?:\/\//i)) {
      finalUrl = 'https://' + finalUrl;
    }

    const selection = window.getSelection();
    if (!selection || !savedSelectionRef.current || !savedElementRef.current) return;

    savedElementRef.current.focus();
    selection.removeAllRanges();
    selection.addRange(savedSelectionRef.current.cloneRange());

    const range = selection.getRangeAt(0);
    const link = document.createElement('a');
    link.href = finalUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.style.textDecoration = 'underline';
    link.style.color = '#3b82f6';

    try {
      const contents = range.extractContents();
      link.appendChild(contents);
      range.insertNode(link);
    } catch (e) {
      console.error('Error creating link:', e);
      return;
    }

    if (savedElementRef.current) {
      savedElementRef.current.dispatchEvent(new Event('input', { bubbles: true }));
    }

    setShowLinkDialog(false);
    setLinkUrl('');
    saveSelection();
  };

  const adjustIndent = (direction: 'increase' | 'decrease') => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    if (savedElementRef.current) {
      savedElementRef.current.focus();
    }

    if (selection && savedSelectionRef.current) {
      selection.removeAllRanges();
      selection.addRange(savedSelectionRef.current.cloneRange());
    }

    const range = selection.getRangeAt(0);
    let element = range.commonAncestorContainer;
    if (element.nodeType === Node.TEXT_NODE) {
      element = element.parentElement!;
    }

    let blockElement = element as HTMLElement;
    while (blockElement && !['DIV', 'P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'LI'].includes(blockElement.tagName)) {
      blockElement = blockElement.parentElement as HTMLElement;
      if (!blockElement || blockElement.closest('[contenteditable="true"]') !== savedElementRef.current) {
        break;
      }
    }

    if (blockElement && blockElement.closest('[contenteditable="true"]') === savedElementRef.current) {
      const currentMargin = parseFloat(window.getComputedStyle(blockElement).marginLeft || '0');
      const indentAmount = 24;
      
      if (direction === 'increase') {
        blockElement.style.marginLeft = `${currentMargin + indentAmount}px`;
      } else {
        blockElement.style.marginLeft = `${Math.max(0, currentMargin - indentAmount)}px`;
      }
      
      if (savedElementRef.current) {
        savedElementRef.current.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }

    saveSelection();
  };

  const clearFormatting = () => {
    execCommand('removeFormat');
    // Also remove custom styles
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const container = range.commonAncestorContainer;
      if (container.nodeType === Node.TEXT_NODE && container.parentElement) {
        const parent = container.parentElement;
        if (parent.tagName === 'SPAN') {
          parent.style.cssText = '';
        }
      }
    }
  };

  const fonts = [
    { name: 'Arial', value: 'Arial, sans-serif' },
    { name: 'Helvetica', value: 'Helvetica, sans-serif' },
    { name: 'Georgia', value: 'Georgia, serif' },
    { name: 'Times New Roman', value: 'Times New Roman, serif' },
    { name: 'Courier New', value: 'Courier New, monospace' },
    { name: 'Verdana', value: 'Verdana, sans-serif' },
    { name: 'Trebuchet MS', value: 'Trebuchet MS, sans-serif' },
    { name: 'Impact', value: 'Impact, sans-serif' },
    { name: 'Comic Sans MS', value: 'Comic Sans MS, cursive' },
    { name: 'Palatino', value: 'Palatino Linotype, serif' },
    { name: 'Lucida Console', value: 'Lucida Console, monospace' },
    { name: 'Tahoma', value: 'Tahoma, sans-serif' },
  ];

  const applyFontFamily = (fontFamily: string) => {
    const selection = window.getSelection();
    if (!selection || !savedSelectionRef.current || !savedElementRef.current) return;

    savedElementRef.current.focus();
    selection.removeAllRanges();
    selection.addRange(savedSelectionRef.current.cloneRange());

    if (selection.rangeCount === 0 || selection.isCollapsed) return;

    const range = selection.getRangeAt(0);
    const wrapper = document.createElement('span');
    wrapper.style.fontFamily = fontFamily;

    wrapper.appendChild(range.extractContents());
    range.insertNode(wrapper);

    selection.removeAllRanges();
    const newRange = document.createRange();
    newRange.selectNodeContents(wrapper);
    selection.addRange(newRange);

    if (savedElementRef.current) {
      savedElementRef.current.dispatchEvent(new Event('input', { bubbles: true }));
    }
    saveSelection();
    setShowFontPicker(false);
  };

  const textColors = [
    '#ffffff', '#000000', '#ffd700', '#ff6b6b', '#4ecdc4', '#45b7d1', 
    '#96ceb4', '#ffeaa7', '#dfe6e9', '#fd79a8', '#a29bfe', '#6c5ce7',
    '#00b894', '#e17055', '#fdcb6e', '#e84393', '#0984e3', '#2d3436'
  ];

  const highlightColors = [
    '#ffeb3b', '#ff9800', '#f44336', '#e91e63', '#9c27b0',
    '#2196f3', '#00bcd4', '#4caf50', '#8bc34a', '#cddc39',
    'transparent'
  ];

  // Update position when selection changes while toolbar is visible
  useEffect(() => {
    if (!isVisible) return;
    
    const handleSelectionChange = () => {
      if (isVisible && savedSelectionRef.current) {
        updateToolbarPosition();
      }
    };
    
    window.addEventListener('scroll', handleSelectionChange, true);
    window.addEventListener('resize', handleSelectionChange);
    document.addEventListener('selectionchange', handleSelectionChange);
    
    return () => {
      window.removeEventListener('scroll', handleSelectionChange, true);
      window.removeEventListener('resize', handleSelectionChange);
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, [isVisible, updateToolbarPosition]);

  // Check if should show (skip for inline mode - always render)
  if (!inline) {
    if (externalIsOpen !== undefined) {
      if (!externalIsOpen && !currentHoveredElement) return null;
    } else {
      if (!isVisible && !currentHoveredElement) return null;
    }
  }

  const handleCloseToolbar = () => {
    setInternalIsVisible(false);
    closeAllPickers();
    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
    }
  };

  // Button component for consistent styling
  const ToolbarButton = ({ 
    onClick, 
    onMouseDown,
    active, 
    title, 
    children,
    className = ''
  }: { 
    onClick?: () => void; 
    onMouseDown?: (e: React.MouseEvent) => void;
    active?: boolean; 
    title: string; 
    children: React.ReactNode;
    className?: string;
  }) => (
    <button
      onClick={onClick}
      onMouseDown={onMouseDown}
      className={`p-1.5 rounded-lg transition-colors ${
        active ? 'bg-[#ffd700] text-black' : 'text-gray-400 hover:text-white hover:bg-gray-700'
      } ${className}`}
      title={title}
    >
      {children}
    </button>
  );

  const Divider = () => (
    <div className="w-px h-5 bg-gray-600 mx-0.5" />
  );

  // Inline toolbar buttons (for embedding in main toolbar) - Two rows
  const toolbarContent = (
    <div className="flex flex-col gap-1">
      {/* Row 1: Font, Size, Basic Formatting, Colors */}
      <div className="flex items-center justify-center gap-0.5">
        {/* Font Family */}
        <div className="relative">
          <button 
            onMouseDown={(e) => { 
              e.preventDefault(); 
              saveSelection(); 
              closeAllPickers(); 
              setShowFontPicker(!showFontPicker); 
            }} 
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition" 
            title="Font"
          >
            <Type size={16} />
          </button>
          <AnimatePresence>
            {showFontPicker && (
              <motion.div 
                className="absolute top-full left-0 mt-2 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl w-48 z-[200]" 
                initial={{ opacity: 0, y: -5, scale: 0.95 }} 
                animate={{ opacity: 1, y: 0, scale: 1 }} 
                exit={{ opacity: 0, y: -5, scale: 0.95 }}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <div className="px-3 py-2 border-b border-gray-700">
                  <span className="text-xs text-gray-400 font-medium">Select Font</span>
                </div>
                <div className="p-1 max-h-64 overflow-y-auto">
                  {fonts.map(font => (
                    <button 
                      key={font.name} 
                      onMouseDown={(e) => { 
                        e.preventDefault(); 
                        e.stopPropagation();
                        saveSelection();
                        applyFontFamily(font.value); 
                      }} 
                      className="w-full px-3 py-2 text-left text-sm text-gray-200 hover:bg-gray-700 rounded-lg transition-colors" 
                      style={{ fontFamily: font.value }}
                    >
                      {font.name}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <Divider />

        {/* Font Size */}
        <button 
          onMouseDown={(e) => { 
            e.preventDefault(); 
            saveSelection(); 
            adjustFontSize(-2); 
          }} 
          className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700" 
          title="Smaller"
        >
          <Minus size={14} />
        </button>
        <input 
          type="text" 
          value={fontSizeInput} 
          onChange={(e) => setFontSizeInput(e.target.value)} 
          onBlur={() => { 
            saveSelection();
            const s = parseInt(fontSizeInput); 
            if (!isNaN(s) && s >= 8 && s <= 120) applyFontSize(s); 
          }} 
          onKeyDown={(e) => { 
            if (e.key === 'Enter') { 
              saveSelection();
              const s = parseInt(fontSizeInput); 
              if (!isNaN(s) && s >= 8 && s <= 120) applyFontSize(s); 
            } 
          }} 
          className="w-8 px-1 py-0.5 text-center text-xs bg-gray-700 rounded text-gray-200 focus:outline-none" 
        />
        <button 
          onMouseDown={(e) => { 
            e.preventDefault(); 
            saveSelection(); 
            adjustFontSize(2); 
          }} 
          className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700" 
          title="Larger"
        >
          <Plus size={14} />
        </button>

        <Divider />

        {/* B I U S */}
        <ToolbarButton onMouseDown={(e) => { e.preventDefault(); execCommand('bold'); }} active={activeStates.bold} title="Bold"><Bold size={16} /></ToolbarButton>
        <ToolbarButton onMouseDown={(e) => { e.preventDefault(); execCommand('italic'); }} active={activeStates.italic} title="Italic"><Italic size={16} /></ToolbarButton>
        <ToolbarButton onMouseDown={(e) => { e.preventDefault(); execCommand('underline'); }} active={activeStates.underline} title="Underline"><Underline size={16} /></ToolbarButton>
        <ToolbarButton onMouseDown={(e) => { e.preventDefault(); execCommand('strikethrough'); }} active={activeStates.strikethrough} title="Strike"><Strikethrough size={16} /></ToolbarButton>

        <Divider />

        {/* Colors */}
        <div className="relative">
          <button 
            onMouseDown={(e) => { 
              e.preventDefault(); 
              saveSelection(); // Save selection before opening picker
              closeAllPickers(); 
              setShowColorPicker(!showColorPicker); 
            }} 
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 flex flex-col items-center" 
            title="Color"
          >
            <Palette size={16} />
            <div className="w-4 h-0.5 rounded-sm" style={{ backgroundColor: recentColors[0] || '#ffd700' }} />
          </button>
          <AnimatePresence>
            {showColorPicker && (
              <motion.div 
                className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl p-3 w-52 z-[200]" 
                initial={{ opacity: 0, y: -5, scale: 0.95 }} 
                animate={{ opacity: 1, y: 0, scale: 1 }} 
                exit={{ opacity: 0, y: -5, scale: 0.95 }}
                onMouseDown={(e) => e.stopPropagation()} // Prevent closing when clicking inside
              >
                <div className="text-xs text-gray-400 font-medium mb-2">Text Color</div>
                <div className="grid grid-cols-8 gap-1.5">
                  {textColors.map(color => (
                    <button 
                      key={color} 
                      onMouseDown={(e) => { 
                        e.preventDefault(); 
                        e.stopPropagation();
                        saveSelection(); // Ensure selection is saved
                        execCommand('foreColor', color); 
                        setShowColorPicker(false); 
                      }} 
                      className="w-5 h-5 rounded-md border border-gray-600 hover:scale-110 hover:border-white transition-all" 
                      style={{ backgroundColor: color }} 
                    />
                  ))}
                </div>
                <div className="mt-3 pt-2 border-t border-gray-700">
                  <div className="text-xs text-gray-400 mb-1">Custom</div>
                  <input 
                    type="color" 
                    className="w-full h-8 rounded-lg cursor-pointer bg-gray-700 border-0" 
                    onMouseDown={(e) => { e.stopPropagation(); saveSelection(); }}
                    onChange={(e) => { 
                      saveSelection(); // Ensure selection is saved
                      execCommand('foreColor', e.target.value); 
                      setShowColorPicker(false); 
                    }} 
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="relative">
          <button 
            onMouseDown={(e) => { 
              e.preventDefault(); 
              saveSelection(); // Save selection before opening picker
              closeAllPickers(); 
              setShowHighlightPicker(!showHighlightPicker); 
            }} 
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700" 
            title="Highlight"
          >
            <Highlighter size={16} />
          </button>
          <AnimatePresence>
            {showHighlightPicker && (
              <motion.div 
                className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl p-3 w-44 z-[200]" 
                initial={{ opacity: 0, y: -5, scale: 0.95 }} 
                animate={{ opacity: 1, y: 0, scale: 1 }} 
                exit={{ opacity: 0, y: -5, scale: 0.95 }}
                onMouseDown={(e) => e.stopPropagation()} // Prevent closing when clicking inside
              >
                <div className="text-xs text-gray-400 font-medium mb-2">Highlight</div>
                <div className="grid grid-cols-6 gap-1.5">
                  {highlightColors.map(color => (
                    <button 
                      key={color} 
                      onMouseDown={(e) => { 
                        e.preventDefault(); 
                        e.stopPropagation();
                        saveSelection(); // Ensure selection is saved
                        applyHighlight(color); 
                      }} 
                      className={`w-5 h-5 rounded-md border border-gray-600 hover:scale-110 hover:border-white transition-all ${color === 'transparent' ? 'bg-gray-700 relative' : ''}`} 
                      style={{ backgroundColor: color === 'transparent' ? undefined : color }}
                    >
                      {color === 'transparent' && <X size={10} className="absolute inset-0 m-auto text-gray-400" />}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <Divider />

        {/* Alignment */}
        <ToolbarButton 
          onMouseDown={(e) => { 
            e.preventDefault(); 
            saveSelection(); 
            execCommand('justifyLeft'); 
          }} 
          active={activeStates.alignLeft} 
          title="Left"
        >
          <AlignLeft size={16} />
        </ToolbarButton>
        <ToolbarButton 
          onMouseDown={(e) => { 
            e.preventDefault(); 
            saveSelection(); 
            execCommand('justifyCenter'); 
          }} 
          active={activeStates.alignCenter} 
          title="Center"
        >
          <AlignCenter size={16} />
        </ToolbarButton>
        <ToolbarButton 
          onMouseDown={(e) => { 
            e.preventDefault(); 
            saveSelection(); 
            execCommand('justifyRight'); 
          }} 
          active={activeStates.alignRight} 
          title="Right"
        >
          <AlignRight size={16} />
        </ToolbarButton>

        <Divider />

        {/* Lists */}
        <ToolbarButton 
          onMouseDown={(e) => { 
            e.preventDefault(); 
            saveSelection(); 
            execCommand('insertUnorderedList'); 
          }} 
          title="Bullets"
        >
          <List size={16} />
        </ToolbarButton>
        <ToolbarButton 
          onMouseDown={(e) => { 
            e.preventDefault(); 
            saveSelection(); 
            execCommand('insertOrderedList'); 
          }} 
          title="Numbers"
        >
          <ListOrdered size={16} />
        </ToolbarButton>
      </div>

      {/* Row 2: Advanced Features */}
      <div className="flex items-center justify-center gap-0.5 border-t border-gray-700/50 pt-1">
        {/* Indent */}
        <ToolbarButton 
          onMouseDown={(e) => { 
            e.preventDefault(); 
            saveSelection(); 
            adjustIndent('decrease'); 
          }} 
          title="Outdent"
        >
          <Outdent size={16} />
        </ToolbarButton>
        <ToolbarButton 
          onMouseDown={(e) => { 
            e.preventDefault(); 
            saveSelection(); 
            adjustIndent('increase'); 
          }} 
          title="Indent"
        >
          <Indent size={16} />
        </ToolbarButton>

        <Divider />

        {/* Line Height */}
        <div className="relative">
          <button 
            onMouseDown={(e) => { 
              e.preventDefault(); 
              saveSelection(); 
              closeAllPickers(); 
              setShowLineHeightPicker(!showLineHeightPicker); 
            }} 
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700" 
            title="Line Height"
          >
            <LineChart size={16} />
          </button>
          <AnimatePresence>
            {showLineHeightPicker && (
              <motion.div 
                className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl overflow-hidden w-32 z-[200]" 
                initial={{ opacity: 0, y: -5, scale: 0.95 }} 
                animate={{ opacity: 1, y: 0, scale: 1 }} 
                exit={{ opacity: 0, y: -5, scale: 0.95 }}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <div className="px-3 py-2 border-b border-gray-700">
                  <span className="text-xs text-gray-400 font-medium">Line Height</span>
                </div>
                <div className="p-1">
                  {['1', '1.25', '1.5', '1.75', '2', '2.5'].map(lh => (
                    <button 
                      key={lh} 
                      onMouseDown={(e) => { 
                        e.preventDefault(); 
                        e.stopPropagation();
                        saveSelection();
                        applyLineHeight(lh); 
                      }} 
                      className="w-full px-3 py-1.5 text-left text-sm text-gray-200 hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      {lh}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Letter Spacing */}
        <div className="relative">
          <button 
            onMouseDown={(e) => { 
              e.preventDefault(); 
              saveSelection(); 
              closeAllPickers(); 
              setShowLetterSpacingPicker(!showLetterSpacingPicker); 
            }} 
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700" 
            title="Letter Spacing"
          >
            <Space size={16} />
          </button>
          <AnimatePresence>
            {showLetterSpacingPicker && (
              <motion.div 
                className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl overflow-hidden w-32 z-[200]" 
                initial={{ opacity: 0, y: -5, scale: 0.95 }} 
                animate={{ opacity: 1, y: 0, scale: 1 }} 
                exit={{ opacity: 0, y: -5, scale: 0.95 }}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <div className="px-3 py-2 border-b border-gray-700">
                  <span className="text-xs text-gray-400 font-medium">Spacing</span>
                </div>
                <div className="p-1">
                  {['-0.05em', '0', '0.05em', '0.1em', '0.15em', '0.2em'].map(ls => (
                    <button 
                      key={ls} 
                      onMouseDown={(e) => { 
                        e.preventDefault(); 
                        e.stopPropagation();
                        saveSelection();
                        applyLetterSpacing(ls); 
                      }} 
                      className="w-full px-3 py-1.5 text-left text-sm text-gray-200 hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      {ls}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <Divider />

        {/* Text Transform */}
        <ToolbarButton 
          onMouseDown={(e) => { 
            e.preventDefault(); 
            saveSelection(); 
            applyTextTransform('uppercase'); 
          }} 
          title="UPPERCASE"
        >
          <CaseUpper size={16} />
        </ToolbarButton>
        <ToolbarButton 
          onMouseDown={(e) => { 
            e.preventDefault(); 
            saveSelection(); 
            applyTextTransform('lowercase'); 
          }} 
          title="lowercase"
        >
          <CaseLower size={16} />
        </ToolbarButton>
        <ToolbarButton 
          onMouseDown={(e) => { 
            e.preventDefault(); 
            saveSelection(); 
            applyTextTransform('capitalize'); 
          }} 
          title="Capitalize"
        >
          <CaseSensitive size={16} />
        </ToolbarButton>

        <Divider />

        {/* Super/Sub */}
        <ToolbarButton onMouseDown={(e) => { e.preventDefault(); execCommand('superscript'); }} active={activeStates.superscript} title="Superscript"><Superscript size={16} /></ToolbarButton>
        <ToolbarButton onMouseDown={(e) => { e.preventDefault(); execCommand('subscript'); }} active={activeStates.subscript} title="Subscript"><Subscript size={16} /></ToolbarButton>

        <Divider />

        {/* Format Painter */}
        <ToolbarButton 
          onMouseDown={(e) => { 
            e.preventDefault(); 
            saveSelection(); 
            copyFormat(); 
          }} 
          active={!!copiedFormat} 
          title="Copy Format"
        >
          <Copy size={16} />
        </ToolbarButton>
        <ToolbarButton 
          onMouseDown={(e) => { 
            e.preventDefault(); 
            saveSelection(); 
            pasteFormat(); 
          }} 
          title="Paste Format"
        >
          <Pipette size={16} />
        </ToolbarButton>

        <Divider />

        {/* Text Effects */}
        <div className="relative">
          <button 
            onMouseDown={(e) => { 
              e.preventDefault(); 
              saveSelection(); 
              closeAllPickers(); 
              setShowTextEffectsPicker(!showTextEffectsPicker); 
            }} 
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700" 
            title="Text Effects"
          >
            <Sparkles size={16} />
          </button>
          <AnimatePresence>
            {showTextEffectsPicker && (
              <motion.div 
                className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl overflow-hidden w-36 z-[200]" 
                initial={{ opacity: 0, y: -5, scale: 0.95 }} 
                animate={{ opacity: 1, y: 0, scale: 1 }} 
                exit={{ opacity: 0, y: -5, scale: 0.95 }}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <div className="px-3 py-2 border-b border-gray-700">
                  <span className="text-xs text-gray-400 font-medium">Text Effects</span>
                </div>
                <div className="p-1">
                  <button 
                    onMouseDown={(e) => { 
                      e.preventDefault(); 
                      e.stopPropagation();
                      saveSelection();
                      applyTextEffect('shadow'); 
                    }} 
                    className="w-full px-3 py-1.5 text-left text-sm text-gray-200 hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    Shadow
                  </button>
                  <button 
                    onMouseDown={(e) => { 
                      e.preventDefault(); 
                      e.stopPropagation();
                      saveSelection();
                      applyTextEffect('outline'); 
                    }} 
                    className="w-full px-3 py-1.5 text-left text-sm text-gray-200 hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    Outline
                  </button>
                  <button 
                    onMouseDown={(e) => { 
                      e.preventDefault(); 
                      e.stopPropagation();
                      saveSelection();
                      applyTextEffect('glow'); 
                    }} 
                    className="w-full px-3 py-1.5 text-left text-sm text-gray-200 hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    Glow
                  </button>
                  <button 
                    onMouseDown={(e) => { 
                      e.preventDefault(); 
                      e.stopPropagation();
                      saveSelection();
                      applyTextEffect('none'); 
                    }} 
                    className="w-full px-3 py-1.5 text-left text-sm text-gray-200 hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    None
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <Divider />

        {/* Link */}
        <ToolbarButton 
          onMouseDown={(e) => { 
            e.preventDefault(); 
            saveSelection(); 
            insertLink(); 
          }} 
          title="Link"
        >
          <Link2 size={16} />
        </ToolbarButton>

        {/* Emoji */}
        <div className="relative">
          <ToolbarButton 
            onMouseDown={(e) => { 
              e.preventDefault(); 
              saveSelection(); 
              closeAllPickers(); 
              setShowEmojiPicker(!showEmojiPicker); 
            }} 
            title="Emoji"
          >
            <Smile size={16} />
          </ToolbarButton>
          <AnimatePresence>
            {showEmojiPicker && (
              <motion.div 
                className="absolute top-full right-0 mt-2 z-[200] bg-gray-800 border border-gray-700 rounded-xl shadow-2xl w-72"
                initial={{ opacity: 0, y: -5, scale: 0.95 }} 
                animate={{ opacity: 1, y: 0, scale: 1 }} 
                exit={{ opacity: 0, y: -5, scale: 0.95 }}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <div className="px-3 py-2 border-b border-gray-700">
                  <span className="text-xs text-gray-400 font-medium">Emoji</span>
                </div>
                <div className="p-2 max-h-64 overflow-y-auto">
                  <div className="grid grid-cols-8 gap-1">
                    {['😀','😃','😄','😁','😆','😅','🤣','😂','🙂','😊','😇','🥰','😍','🤩','😘','😗','😚','😋','😛','😜','🤪','😝','🤑','🤗','🤭','🤫','🤔','🤐','🤨','😐','😑','😶','😏','😒','🙄','😬','🤥','😌','😔','😪','🤤','😴','😷','🤒','🤕','🤢','🤮','🥴','😵','🤯','🤠','🥳','😎','🤓','🧐','😕','😟','🙁','☹️','😮','😯','😲','😳','🥺','😦','😧','😨','😰','😥','😢','😭','😱','😖','😣','😞','😓','😩','😫','🥱','😤','😡','😠','🤬','👍','👎','👏','🙌','👐','🤲','🤝','🙏','✌️','🤞','🤟','🤘','👌','🤌','🤏','👈','👉','👆','👇','☝️','✋','🤚','🖐️','🖖','👋','🤙','💪','🦾','❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❣️','💕','💞','💓','💗','💖','💘','💝','⭐','🌟','✨','💫','🔥','💥','💯','👀','👁️','💬','💭','🗯️','✅','❌','❓','❗','💡','📌','📍','🎯','🎪','🎨','🎭','🎬','🎤','🎧','🎵','🎶','🎹','🥁','🎸','🎺','🎻'].map(emoji => (
                      <button 
                        key={emoji} 
                        onMouseDown={(e) => { e.preventDefault(); insertEmoji(emoji); setShowEmojiPicker(false); }}
                        className="w-7 h-7 flex items-center justify-center text-lg hover:bg-gray-700 rounded-lg transition-colors"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Clear */}
        <ToolbarButton 
          onMouseDown={(e) => { 
            e.preventDefault(); 
            saveSelection(); 
            clearFormatting(); 
          }} 
          title="Clear Format"
        >
          <RotateCcw size={16} />
        </ToolbarButton>
      </div>
    </div>
  );

  // If inline mode, just return the toolbar content directly
  if (inline) {
    return (
      <>
        {toolbarContent}
        {/* Link Dialog for inline mode */}
        <AnimatePresence>
          {showLinkDialog && (
            <motion.div
              className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLinkDialog(false)}
            >
              <motion.div
                className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl p-6 w-full max-w-md mx-4"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-lg font-semibold text-white mb-4">Insert Link</h3>
                <input
                  type="text"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#ffd700]"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') applyLink(linkUrl);
                    else if (e.key === 'Escape') { setShowLinkDialog(false); setLinkUrl(''); }
                  }}
                />
                <div className="flex gap-3 mt-4">
                  <button onClick={() => applyLink(linkUrl)} className="flex-1 px-4 py-2.5 bg-[#ffd700] hover:bg-yellow-400 text-black rounded-lg font-medium">Apply</button>
                  <button onClick={() => { setShowLinkDialog(false); setLinkUrl(''); }} className="px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium">Cancel</button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  }

  // Floating toolbar mode
  return (
    <>
      {/* Click outside overlay */}
      {isVisible && (
        <div
          className="fixed inset-0 z-[99] pointer-events-none"
          onClick={(e) => {
            const target = e.target as HTMLElement;
            if (toolbarRef.current?.contains(target)) return;
            if (target.closest('[contenteditable="true"]')) return;
            handleCloseToolbar();
          }}
        />
      )}

      <AnimatePresence>
        {isVisible && (
          <motion.div 
            ref={toolbarRef}
            className="fixed z-[100] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-2xl px-2 py-1.5"
            style={{ ...toolbarPosition, pointerEvents: 'auto' } as any}
            initial={{ opacity: 0, scale: 0.95, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -8 }}
            transition={{ duration: 0.15 }}
            onMouseDown={(e) => e.preventDefault()}
          >
            {toolbarContent}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Link Dialog */}
      <AnimatePresence>
        {showLinkDialog && (
          <motion.div
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowLinkDialog(false)}
          >
            <motion.div
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl p-6 w-full max-w-md mx-4"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Insert Link</h3>
              <input
                type="text"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://example.com"
                className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') applyLink(linkUrl);
                  else if (e.key === 'Escape') { setShowLinkDialog(false); setLinkUrl(''); }
                }}
              />
              <div className="flex gap-3 mt-4">
                <button 
                  onClick={() => applyLink(linkUrl)} 
                  className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  Apply
                </button>
                <button 
                  onClick={() => { setShowLinkDialog(false); setLinkUrl(''); }} 
                  className="px-4 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
