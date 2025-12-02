"use client";

import React, { useState, useEffect, useRef } from 'react';

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
  const lastHtml = useRef(html);

  // Sync internal ref when prop changes (only if not currently focused to avoid cursor jumping)
  useEffect(() => {
    if (contentEditableRef.current && document.activeElement !== contentEditableRef.current && html !== contentEditableRef.current.innerHTML) {
        contentEditableRef.current.innerHTML = html;
        lastHtml.current = html;
    }
  }, [html]);

  const handleInput = (e: React.FormEvent<HTMLElement>) => {
    const newHtml = e.currentTarget.innerHTML;
    lastHtml.current = newHtml;
    // We generally don't want to trigger onChange on every keystroke for performance 
    // and to prevent re-render loops if the parent updates the prop back.
    // However, for live preview, we might want it. 
    // Let's stick to onBlur for committed changes or use a debounce if needed.
    // For now, we won't trigger onChange here unless requested.
  };

  const handleBlur = () => {
    const html = contentEditableRef.current?.innerHTML || '';
    if (onChange && html !== html) { // Check against prop? No, check against last emitted?
        // actually, always emit on blur if it's different from initial prop or last known state
        onChange(html);
    } else if (onChange) {
        onChange(html);
    }
  };

  const Tag = tagName as keyof JSX.IntrinsicElements;

  return (
    <Tag
      ref={contentEditableRef}
      className={`outline-none focus:ring-2 focus:ring-[#ffd700]/50 rounded px-1 -mx-1 transition-all empty:before:content-[attr(data-placeholder)] empty:before:text-gray-500 cursor-text ${className}`}
      style={style}
      contentEditable={!disabled}
      onInput={handleInput}
      onBlur={handleBlur}
      dangerouslySetInnerHTML={{ __html: html }}
      data-placeholder={placeholder}
      suppressContentEditableWarning={true}
    />
  );
};

