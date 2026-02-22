"use client";

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getGlobalHoveredElement, globalHoverListeners } from '@/lib/textHover';
import { TextToolbarProvider } from './TextToolbarContext';
import { ToolbarContent } from './ToolbarContent';
import { LinkDialog } from './LinkDialog';

interface TextToolbarProps {
  isOpen?: boolean;
  onToggle?: () => void;
  hoveredElement?: HTMLElement | null;
  inline?: boolean;
}

export const TextToolbar = ({ 
  isOpen: externalIsOpen, 
  onToggle, 
  hoveredElement, 
  inline = false 
}: TextToolbarProps = {}) => {
  const [internalIsVisible, setInternalIsVisible] = useState(false);
  const [currentHoveredElement, setCurrentHoveredElement] = useState<HTMLElement | null>(null);
  const isVisible = externalIsOpen !== undefined ? externalIsOpen : (internalIsVisible || currentHoveredElement !== null);
  const [isMobile, setIsMobile] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState<{ top: string | number; left: string | number; position: 'fixed' } | null>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);

  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [showBulletStylePicker, setShowBulletStylePicker] = useState(false);
  
  const [linkUrl, setLinkUrl] = useState('');
  const [fontSizeInput, setFontSizeInput] = useState('16');
  const [recentColors, setRecentColors] = useState<string[]>([]);
  const [copiedFormat, setCopiedFormat] = useState<any>(null);
  
  const savedSelectionRef = useRef<Range | null>(null);
  const savedElementRef = useRef<HTMLElement | null>(null);
  const emojiPickerOpenRef = useRef(false);
  
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

  useEffect(() => {
    emojiPickerOpenRef.current = showEmojiPicker;
  }, [showEmojiPicker]);

  useEffect(() => {
    const anyPickerOpen = showEmojiPicker || showColorPicker || showBulletStylePicker;
    if (!anyPickerOpen) return;
    
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (toolbarRef.current?.contains(target)) return;
      setShowEmojiPicker(false);
      setShowColorPicker(false);
      setShowBulletStylePicker(false);
    };

    const timer = setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showEmojiPicker, showColorPicker, showBulletStylePicker]);

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
    
    setToolbarPosition({
      top: '72px',
      left: '50%',
      transform: 'translateX(-50%)',
      position: 'fixed' as const,
    } as any);
  }, [isMobile]);

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

  useEffect(() => {
    if (externalIsOpen && !toolbarPosition) {
      updateToolbarPosition();
    }
  }, [externalIsOpen, toolbarPosition, updateToolbarPosition]);

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
        const anyPickerOpen = showEmojiPicker || showColorPicker || showBulletStylePicker;
        
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
  }, [externalIsOpen, showEmojiPicker, showColorPicker, showBulletStylePicker, updateActiveStates, updateToolbarPosition]);

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
        
        const anyPickerOpen = showEmojiPicker || showColorPicker || showBulletStylePicker;
        
        if (!getGlobalHoveredElement() && !anyPickerOpen) {
          if (hideTimeoutId) clearTimeout(hideTimeoutId);
          hideTimeoutId = setTimeout(() => {
            const currentSelection = window.getSelection();
            const currentHovered = getGlobalHoveredElement();
            if (!currentHovered && (!currentSelection || currentSelection.isCollapsed)) {
              if (externalIsOpen === undefined) {
                setInternalIsVisible(false);
              }
            }
          }, 400);
        }
      } else {
        if (hideTimeoutId) {
          clearTimeout(hideTimeoutId);
          hideTimeoutId = null;
        }
        
        const element = (selection.rangeCount > 0 
          ? selection.getRangeAt(0).commonAncestorContainer 
          : null) as Node | null;
        
        if (element) {
          const editableElement = (element.nodeType === Node.TEXT_NODE 
            ? element.parentElement 
            : element as HTMLElement)?.closest('[contenteditable="true"]') as HTMLElement | null;
          
          if (editableElement) {
            savedElementRef.current = editableElement;
            const range = selection.getRangeAt(0);
            savedSelectionRef.current = range.cloneRange();
            setTimeout(() => {
              updateActiveStates();
              updateToolbarPosition();
            }, 50);
          } else if (!element && externalIsOpen === undefined) {
            const sel = window.getSelection();
            const hasSelection = sel && !sel.isCollapsed;
            const anyPickerOpen = showEmojiPicker || showColorPicker || showBulletStylePicker;
            
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
        }
      }
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
      if (showTimeoutId) clearTimeout(showTimeoutId);
      if (hideTimeoutId) clearTimeout(hideTimeoutId);
    };
  }, [externalIsOpen, showEmojiPicker, showColorPicker, showBulletStylePicker, updateActiveStates, updateToolbarPosition]);

  const closeAllPickers = () => {
    setShowColorPicker(false);
    setShowEmojiPicker(false);
    setShowBulletStylePicker(false);
  };

  const execCommand = (command: string, value: string = '') => {
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
    
    if (command === 'foreColor' && value && !recentColors.includes(value)) {
      setRecentColors(prev => [value, ...prev.slice(0, 7)]);
    }
    
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
      selection.addRange(savedSelectionRef.current.cloneRange());
      
      const range = selection.getRangeAt(0);
      range.deleteContents();
      const textNode = document.createTextNode(emoji);
      range.insertNode(textNode);
      
      range.setStartAfter(textNode);
      range.setEndAfter(textNode);
      selection.removeAllRanges();
      selection.addRange(range);

      savedSelectionRef.current = range.cloneRange();

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

  const clearFormatting = () => {
    execCommand('removeFormat');
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

  const toolbarContentProps = {
    showColorPicker,
    showBulletStylePicker,
    showEmojiPicker,
    onToggleColorPicker: () => { closeAllPickers(); setShowColorPicker(c => !c); },
    onToggleBulletStylePicker: () => { closeAllPickers(); setShowBulletStylePicker(c => !c); },
    onToggleEmojiPicker: () => { closeAllPickers(); setShowEmojiPicker(c => !c); },
    closeAllPickers,
    execCommand,
    adjustFontSize,
    applyFontSize,
    insertEmoji,
    insertLink,
    clearFormatting,
    fontSizeInput,
    setFontSizeInput,
  };

  return (
    <TextToolbarProvider
      savedSelectionRef={savedSelectionRef}
      savedElementRef={savedElementRef}
      activeStates={activeStates}
      setActiveStates={setActiveStates}
      fontSizeInput={fontSizeInput}
      setFontSizeInput={setFontSizeInput}
      recentColors={recentColors}
      setRecentColors={setRecentColors}
      copiedFormat={copiedFormat}
      setCopiedFormat={setCopiedFormat}
      execCommand={execCommand}
      saveSelection={saveSelection}
      updateActiveStates={updateActiveStates}
      closeAllPickers={closeAllPickers}
    >
      {inline ? (
        <>
          <ToolbarContent {...toolbarContentProps} />
          <LinkDialog
            isOpen={showLinkDialog}
            linkUrl={linkUrl}
            onClose={() => { setShowLinkDialog(false); setLinkUrl(''); }}
            onUrlChange={setLinkUrl}
            onApply={applyLink}
          />
        </>
      ) : (
        <>
          {isVisible && (
            <div
              className="fixed inset-0 z-[9997] pointer-events-none"
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
                className="fixed z-[9998] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-2xl px-2 py-1.5"
                style={{ ...toolbarPosition, pointerEvents: 'auto' } as any}
                initial={{ opacity: 0, scale: 0.95, y: -8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -8 }}
                transition={{ duration: 0.15 }}
                onMouseDown={(e) => e.preventDefault()}
              >
                <ToolbarContent {...toolbarContentProps} />
              </motion.div>
            )}
          </AnimatePresence>

          <LinkDialog
            isOpen={showLinkDialog}
            linkUrl={linkUrl}
            onClose={() => { setShowLinkDialog(false); setLinkUrl(''); }}
            onUrlChange={setLinkUrl}
            onApply={applyLink}
          />
        </>
      )}
    </TextToolbarProvider>
  );
};
