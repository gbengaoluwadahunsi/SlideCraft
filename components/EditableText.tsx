"use client";

import React, { useEffect, useRef, useCallback, useLayoutEffect } from 'react';

interface EditableTextProps {
  html: string;
  tagName?: string;
  className?: string;
  style?: React.CSSProperties;
  onChange?: (html: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export const EditableText: React.FC<EditableTextProps> = ({
  html,
  tagName = 'div',
  className,
  style,
  onChange,
  placeholder,
  disabled = false
}) => {
  const contentEditableRef = useRef<HTMLElement>(null);
  const lastHtmlRef = useRef(html);
  const isInternalUpdate = useRef(false);
  const isInitialized = useRef(false);

  // Check if there's an active selection within this element
  const hasActiveSelection = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return false;
    
    const range = selection.getRangeAt(0);
    const container = range.commonAncestorContainer;
    const element = container.nodeType === Node.TEXT_NODE ? container.parentElement : container;
    
    // Check if selection is within this contenteditable
    return contentEditableRef.current?.contains(element as Node) === true;
  }, []);

  // Initialize content on mount (only once)
  useLayoutEffect(() => {
    const element = contentEditableRef.current;
    if (element && !isInitialized.current) {
      element.innerHTML = html;
      lastHtmlRef.current = html;
      isInitialized.current = true;
    }
  }, []);

  // Sync content from prop changes (only when NOT interacting)
  useEffect(() => {
    // Skip if this update was triggered by our own input handler
    if (isInternalUpdate.current) {
      isInternalUpdate.current = false;
      return;
    }

    const element = contentEditableRef.current;
    if (!element) return;

    // Check if the prop actually changed from what we last knew
    if (html === lastHtmlRef.current) return;

    // Don't update if user is interacting with the element
    const isFocused = document.activeElement === element;
    const hasSelection = hasActiveSelection();

    if (!isFocused && !hasSelection) {
      element.innerHTML = html;
      lastHtmlRef.current = html;
    }
  }, [html, hasActiveSelection]);

  const handleInput = useCallback((e: React.FormEvent<HTMLElement>) => {
    const newHtml = e.currentTarget.innerHTML;
    lastHtmlRef.current = newHtml;
    
    // Mark that the next prop update is from us (to prevent overwriting)
    isInternalUpdate.current = true;
    
    // Notify parent of change
    onChange?.(newHtml);
  }, [onChange]);

  const handleBlur = useCallback(() => {
    const currentHtml = contentEditableRef.current?.innerHTML || '';
    if (currentHtml !== lastHtmlRef.current) {
      lastHtmlRef.current = currentHtml;
      onChange?.(currentHtml);
    }
  }, [onChange]);

  // Handle mousedown to prevent selection issues
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Don't prevent default - we want normal text selection behavior
    // Just ensure the element can receive focus
  }, []);

  const Tag = tagName as keyof JSX.IntrinsicElements;

  // IMPORTANT: We don't use dangerouslySetInnerHTML to avoid React replacing DOM content
  // Instead, we manage innerHTML manually via refs and useEffect
  return (
    <Tag
      ref={contentEditableRef}
      className={`outline-none focus:ring-2 focus:ring-[#ffd700]/50 rounded px-1 -mx-1 transition-all empty:before:content-[attr(data-placeholder)] empty:before:text-gray-500 cursor-text ${className}`}
      style={{ ...style, userSelect: 'text', WebkitUserSelect: 'text' }}
      contentEditable={!disabled}
      onInput={handleInput}
      onBlur={handleBlur}
      onMouseDown={handleMouseDown}
      data-placeholder={placeholder}
      suppressContentEditableWarning={true}
    />
  );
};

