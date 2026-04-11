"use client";

import React, { createContext, useContext, useRef, useState, useCallback } from 'react';

interface CopiedFormat {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  fontSize?: string;
  color?: string;
}

interface TextToolbarContextType {
  savedSelectionRef: React.MutableRefObject<Range | null>;
  savedElementRef: React.MutableRefObject<HTMLElement | null>;
  activeStates: {
    bold: boolean;
    italic: boolean;
    underline: boolean;
    strikethrough: boolean;
    alignLeft: boolean;
    alignCenter: boolean;
    alignRight: boolean;
    alignJustify: boolean;
    superscript: boolean;
    subscript: boolean;
  };
  setActiveStates: React.Dispatch<React.SetStateAction<{
    bold: boolean;
    italic: boolean;
    underline: boolean;
    strikethrough: boolean;
    alignLeft: boolean;
    alignCenter: boolean;
    alignRight: boolean;
    alignJustify: boolean;
    superscript: boolean;
    subscript: boolean;
  }>>;
  fontSizeInput: string;
  setFontSizeInput: React.Dispatch<React.SetStateAction<string>>;
  recentColors: string[];
  setRecentColors: React.Dispatch<React.SetStateAction<string[]>>;
  copiedFormat: CopiedFormat | null;
  setCopiedFormat: React.Dispatch<React.SetStateAction<CopiedFormat | null>>;
  
  execCommand: (command: string, value?: string) => void;
  saveSelection: () => void;
  updateActiveStates: () => void;
  closeAllPickers: () => void;
}

const TextToolbarContext = createContext<TextToolbarContextType | null>(null);

export const useTextToolbar = () => {
  const context = useContext(TextToolbarContext);
  if (!context) {
    throw new Error('useTextToolbar must be used within TextToolbarProvider');
  }
  return context;
};

interface TextToolbarProviderProps {
  children: React.ReactNode;
  savedSelectionRef: React.MutableRefObject<Range | null>;
  savedElementRef: React.MutableRefObject<HTMLElement | null>;
  activeStates: {
    bold: boolean;
    italic: boolean;
    underline: boolean;
    strikethrough: boolean;
    alignLeft: boolean;
    alignCenter: boolean;
    alignRight: boolean;
    alignJustify: boolean;
    superscript: boolean;
    subscript: boolean;
  };
  setActiveStates: React.Dispatch<React.SetStateAction<{
    bold: boolean;
    italic: boolean;
    underline: boolean;
    strikethrough: boolean;
    alignLeft: boolean;
    alignCenter: boolean;
    alignRight: boolean;
    alignJustify: boolean;
    superscript: boolean;
    subscript: boolean;
  }>>;
  fontSizeInput: string;
  setFontSizeInput: React.Dispatch<React.SetStateAction<string>>;
  recentColors: string[];
  setRecentColors: React.Dispatch<React.SetStateAction<string[]>>;
  copiedFormat: any;
  setCopiedFormat: React.Dispatch<React.SetStateAction<any>>;
  execCommand: (command: string, value?: string) => void;
  saveSelection: () => void;
  updateActiveStates: () => void;
  closeAllPickers: () => void;
}

export const TextToolbarProvider: React.FC<TextToolbarProviderProps> = ({
  children,
  savedSelectionRef,
  savedElementRef,
  activeStates,
  setActiveStates,
  fontSizeInput,
  setFontSizeInput,
  recentColors,
  setRecentColors,
  copiedFormat,
  setCopiedFormat,
  execCommand,
  saveSelection,
  updateActiveStates,
  closeAllPickers,
}) => {
  return (
    <TextToolbarContext.Provider
      value={{
        savedSelectionRef,
        savedElementRef,
        activeStates,
        setActiveStates,
        fontSizeInput,
        setFontSizeInput,
        recentColors,
        setRecentColors,
        copiedFormat,
        setCopiedFormat,
        execCommand,
        saveSelection,
        updateActiveStates,
        closeAllPickers,
      }}
    >
      {children}
    </TextToolbarContext.Provider>
  );
};
