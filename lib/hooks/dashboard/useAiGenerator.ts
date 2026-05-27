'use client';

import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { SlideData } from '@/lib/types';
import { applyAuthorityLinkedInStyle, type OutputPreset, type PlatformTarget } from '@/lib/authorityCarousel';

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
  const [generationStatus, setGenerationStatus] = useState('');
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [aiOutputPreset, setAiOutputPreset] = useState<OutputPreset>('General Carousel');
  const [aiPlatformTarget, setAiPlatformTarget] = useState<PlatformTarget>('Auto');
  const lastGenerationInputRef = useRef<{ text: string; sections: string[] } | null>(null);

  // --- Generation Settings ---
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiSlideCount, setAiSlideCount] = useState(6);
  const [aiWritingStyle, setAiWritingStyle] = useState<string>('Professional');
  const [aiSlideStyle, setAiSlideStyle] = useState<'visual' | 'text' | 'mixed'>('mixed');
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

  const plainError = (message: string) => message.replace(/^Error:\s*/i, '').trim();

  const applyPreset = (preset: OutputPreset) => {
    const presets = {
      'General Carousel': {
        writingStyle: 'Clear',
        audience: 'General social media audience',
        goal: 'Create a useful, easy-to-read carousel that works across platforms',
      },
      'Authority LinkedIn': {
        writingStyle: 'Authoritative',
        audience: 'Professionals and decision-makers on LinkedIn',
        goal: 'Create a high-trust thought leadership carousel with comparison slides, metrics, checklists, and a strong takeaway',
      },
      Educational: {
        writingStyle: 'Professional',
        audience: 'People who are new to this topic',
        goal: 'Teach the idea clearly with practical examples',
      },
      Sales: {
        writingStyle: 'Persuasive',
        audience: 'Potential customers',
        goal: 'Explain the offer clearly and move people to take action',
      },
      'Founder LinkedIn': {
        writingStyle: 'Storytelling',
        audience: 'Founders, operators, and professionals on LinkedIn',
        goal: 'Share a useful point of view with a clear lesson',
      },
      'Tips/Listicle': {
        writingStyle: 'Direct',
        audience: 'Busy people who want quick practical tips',
        goal: 'Give useful tips people can save and apply',
      },
    }[preset];

    setAiOutputPreset(preset);
    setAiWritingStyle(presets.writingStyle);
    setAiAudience(presets.audience);
    setAiGoal(presets.goal);
  };

  const handleGenerateCarousel = async (overrideText?: string) => {
    const sourceText = overrideText || docAttachment?.text || urlAttachment?.text || aiPrompt;
    const sourceSections = overrideText ? [] : docAttachment?.sections || urlAttachment?.sections || [];

    if (!sourceText.trim()) {
      const message = 'Paste your idea, article, or notes first';
      setGenerationError(message);
      toast.error(message);
      return;
    }

    setIsGenerating(true);
    setGenerationError(null);
    setGenerationStatus('Creating your carousel. This usually takes about a minute.');
    lastGenerationInputRef.current = { text: sourceText, sections: sourceSections };
    try {
      const requestBody = {
        text: sourceText,
        slideCount: aiSlideCount,
        platformTarget: aiPlatformTarget,
        outputPreset: aiOutputPreset,
        writingStyle: aiWritingStyle,
        slideStyle: aiSlideStyle,
        language: aiLanguage,
        ...(aiWordCount ? { wordCount: aiWordCount } : {}),
        tone: aiTone,
        autoHashtags: aiAutoHashtags,
        includeStats: aiIncludeStats,
        accessibility: aiAccessibility,
        smartColors: aiSmartColors,
        freshDesign: aiFreshDesign,
        audience: aiAudience,
        goal: aiGoal,
        sections: sourceSections,
        ...(aiSmartColors ? {
          accentColor: brandSettings.accentColor,
          backgroundColor: brandSettings.backgroundColor,
          textColor: brandSettings.textColor,
        } : {}),
      };

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      if (!response.ok) {
        const detailMessage = Array.isArray(data.details)
          ? data.details.map((detail: { path?: string; message?: string }) => `${detail.path || 'field'}: ${detail.message || 'invalid'}`).join(', ')
          : '';
        throw new Error(detailMessage || data.message || data.error || 'Failed to generate');
      }

      if (data.fallbackUsed) {
        setGenerationStatus('Gemini failed, trying Groq');
        toast.message('Gemini failed, trying Groq');
      }

      // Update state with new slides
      const generatedSlides = data.slides.map((s: any, i: number) => ({
        ...s,
        id: `gen-${Date.now()}-${i}`,
        // Map any extra fields from generation
        accentColor: data.theme?.accentColor || s.accentColor || brandSettings.accentColor,
        backgroundColor: data.theme?.backgroundColor || s.backgroundColor || brandSettings.backgroundColor,
        textColor: data.theme?.textColor || s.textColor || brandSettings.textColor,
        fontFamily: data.theme?.fontFamily || s.fontFamily || brandSettings.fontFamily,
      }));

      const newSlides = aiOutputPreset === 'Authority LinkedIn'
        ? applyAuthorityLinkedInStyle(generatedSlides, brandSettings)
        : generatedSlides;

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
      setGenerationStatus('Carousel created');
      toast.success('Carousel created');
    } catch (error: any) {
      const message = plainError(error.message || 'Generation failed');
      const displayMessage = `Generation failed: ${message}`;
      setGenerationError(displayMessage);
      setGenerationStatus(displayMessage);
      toast.error(displayMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const retryLastGeneration = () => {
    if (lastGenerationInputRef.current?.text) {
      void handleGenerateCarousel(lastGenerationInputRef.current.text);
      return;
    }
    void handleGenerateCarousel();
  };

  const handleDocUpload = async (file: File | null) => {
    if (!file) return;

    setIsUploadingDoc(true);
    setDocUploadError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/ingest', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to process document');

      setDocAttachment({
        name: data.fileName || file.name,
        text: data.text,
        sections: data.sections,
        wordCount: data.wordCount,
        truncated: data.truncated,
      });
      setAiInputTab('document');
      toast.success('Document attached');
    } catch (error: any) {
      const message = error.message || 'Failed to process document';
      setDocUploadError(message);
      toast.error(message);
    } finally {
      setIsUploadingDoc(false);
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
    generationStatus,
    generationError,
    aiPrompt, setAiPrompt,
    aiOutputPreset, setAiOutputPreset,
    aiPlatformTarget, setAiPlatformTarget,
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
    retryLastGeneration,
    applyPreset,
    handleDocUpload,
    handleParseUrl
  };
}
