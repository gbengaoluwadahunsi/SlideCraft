'use client';

import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { SlideData } from '@/lib/types';

interface AiGeneratorProps {
  slides: SlideData[];
  setSlides: (slides: SlideData[]) => void;
  brandSettings: any;
  setBrandSettings: (settings: any) => void;
  addToHistory: (slides: SlideData[]) => void;
  setActiveSlideId: (id: string) => void;
  setIsAiModalOpen: (open: boolean) => void;
}

export function useAiGenerator({
  slides,
  setSlides,
  brandSettings,
  setBrandSettings,
  addToHistory,
  setActiveSlideId,
  setIsAiModalOpen
}: AiGeneratorProps) {
  // --- UI State ---
  const [isGenerating, setIsGenerating] = useState(false);
  const [regeneratingSlideId, setRegeneratingSlideId] = useState<string | null>(null);

  // --- Generation Settings ---
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiSlideCount, setAiSlideCount] = useState(6);
  const [aiWritingStyle, setAiWritingStyle] = useState<string>('Professional');
  const [aiSlideStyle, setAiSlideStyle] = useState<'visual' | 'text' | 'mixed'>('text');
  const [aiLanguage, setAiLanguage] = useState<string>('en');
  const [aiWordCount, setAiWordCount] = useState<number | null>(null);
  const [aiTone, setAiTone] = useState<string>('neutral');
  const [aiAutoHashtags, setAiAutoHashtags] = useState<boolean>(false);
  const [aiIncludeStats, setAiIncludeStats] = useState<boolean>(false);
  const [aiAccessibility, setAiAccessibility] = useState<boolean>(false);
  const [aiSmartColors, setAiSmartColors] = useState<boolean>(false);
  const [aiFreshDesign, setAiFreshDesign] = useState<boolean>(false);
  const [aiAudience, setAiAudience] = useState<string>('');
  const [aiGoal, setAiGoal] = useState<string>('');
  const [isAdvancedOptionsOpen, setIsAdvancedOptionsOpen] = useState<boolean>(false);

  // --- Input Tabs State ---
  const [aiInputTab, setAiInputTab] = useState<'prompt' | 'document' | 'url'>('prompt');

  // --- Document State ---
  const [docAttachment, setDocAttachment] = useState<{ name: string; text: string; sections?: string[]; wordCount?: number; truncated?: boolean } | null>(null);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [docUploadError, setDocUploadError] = useState<string | null>(null);

  // --- URL State ---
  const [urlInput, setUrlInput] = useState('');
  const [urlAttachment, setUrlAttachment] = useState<{
    title: string;
    text: string;
    sections?: string[];
    wordCount?: number;
    truncated?: boolean;
    sourceUrl: string;
    sourceDomain: string;
    description?: string;
  } | null>(null);
  const [isParsingUrl, setIsParsingUrl] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [urlOwnershipConfirmed, setUrlOwnershipConfirmed] = useState(false);

  // --- Implementation Logic ---

  const handleGenerateCarousel = async () => {
    if (!aiPrompt && !docAttachment && !urlAttachment) {
      toast.error('Please provide a prompt, document, or URL');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: aiPrompt,
          slideCount: aiSlideCount,
          writingStyle: aiWritingStyle,
          slideStyle: aiSlideStyle,
          language: aiLanguage,
          wordCount: aiWordCount,
          tone: aiTone,
          autoHashtags: aiAutoHashtags,
          includeStats: aiIncludeStats,
          accessibility: aiAccessibility,
          smartColors: aiSmartColors,
          freshDesign: aiFreshDesign,
          audience: aiAudience,
          goal: aiGoal,
          documentText: docAttachment?.text,
          urlText: urlAttachment?.text,
          brandSettings: aiSmartColors ? brandSettings : undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to generate');

      // Update state with new slides
      const newSlides = data.slides.map((s: any, i: number) => ({
        ...s,
        id: `gen-${Date.now()}-${i}`,
        // Map any extra fields from generation
        accentColor: data.theme?.accentColor || s.accentColor || brandSettings.accentColor,
        backgroundColor: data.theme?.backgroundColor || s.backgroundColor || brandSettings.backgroundColor,
        textColor: data.theme?.textColor || s.textColor || brandSettings.textColor,
        fontFamily: data.theme?.fontFamily || s.fontFamily || brandSettings.fontFamily,
      }));

      if (data.theme && aiSmartColors) {
        setBrandSettings({
          ...brandSettings,
          ...data.theme
        });
      }

      setSlides(newSlides);
      if (newSlides.length > 0) setActiveSlideId(newSlides[0].id);
      addToHistory(newSlides);
      setIsAiModalOpen(false);
      toast.success('Carousel generated successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleParseUrl = async (url: string) => {
    if (!url) return;
    setIsParsingUrl(true);
    setUrlError(null);
    try {
      const response = await fetch('/api/parse-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to parse URL');
      
      setUrlAttachment({
        title: data.title,
        text: data.text,
        sections: data.sections,
        wordCount: data.wordCount,
        truncated: data.truncated,
        sourceUrl: url,
        sourceDomain: data.domain,
        description: data.description
      });
      toast.success('URL parsed successfully');
    } catch (error: any) {
      setUrlError(error.message);
      toast.error(error.message);
    } finally {
      setIsParsingUrl(false);
    }
  };

  return {
    // States
    isGenerating,
    regeneratingSlideId,
    setRegeneratingSlideId,
    aiPrompt, setAiPrompt,
    aiSlideCount, setAiSlideCount,
    aiWritingStyle, setAiWritingStyle,
    aiSlideStyle, setAiSlideStyle,
    aiLanguage, setAiLanguage,
    aiWordCount, setAiWordCount,
    aiTone, setAiTone,
    aiAutoHashtags, setAiAutoHashtags,
    aiIncludeStats, setAiIncludeStats,
    aiAccessibility, setAiAccessibility,
    aiSmartColors, setAiSmartColors,
    aiFreshDesign, setAiFreshDesign,
    aiAudience, setAiAudience,
    aiGoal, setAiGoal,
    isAdvancedOptionsOpen, setIsAdvancedOptionsOpen,
    aiInputTab, setAiInputTab,
    docAttachment, setDocAttachment,
    isUploadingDoc, setIsUploadingDoc,
    docUploadError, setDocUploadError,
    urlInput, setUrlInput,
    urlAttachment, setUrlAttachment,
    isParsingUrl, setIsParsingUrl,
    urlError, setUrlError,
    urlOwnershipConfirmed, setUrlOwnershipConfirmed,

    // Actions
    handleGenerateCarousel,
    handleParseUrl
  };
}
