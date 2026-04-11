'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { SlideData, ProjectOptions } from '@/lib/types';

export function useSlideEditor() {
  const [slides, setSlides] = useState<SlideData[]>([]);
  const [activeSlideId, setActiveSlideId] = useState<string>('');
  const [projectName, setProjectName] = useState('Untitled Project');
  const [projectOptions, setProjectOptions] = useState<ProjectOptions>({});
  
  const [currentScale, setCurrentScale] = useState(0.6);
  const [activeTool, setActiveTool] = useState<'select' | 'text' | 'image' | 'color'>('select');
  
  // Ref to always have latest slides for export / background tasks
  const slidesRef = useRef<SlideData[]>([]);
  useEffect(() => {
    slidesRef.current = slides;
  }, [slides]);

  const updateSlides = useCallback((newSlides: SlideData[] | ((prev: SlideData[]) => SlideData[])) => {
    setSlides(newSlides);
  }, []);

  const addNewSlide = useCallback((brandSettings: any) => {
    const newId = Date.now().toString();
    setSlides(prevSlides => [...prevSlides, {
      id: newId,
      type: 'content',
      title: 'New Slide',
      content: '<p>Edit this content...</p>',
      emoji: '',
      category: brandSettings.category,
      accentColor: brandSettings.accentColor,
      handle: brandSettings.handle,
      fontFamily: brandSettings.fontFamily,
      fontScale: prevSlides[0]?.fontScale ?? 1,
      backgroundColor: brandSettings.backgroundColor,
      textColor: brandSettings.textColor,
      logoUrl: brandSettings.logoUrl || null,
      mediaType: null,
      mediaUrl: undefined,
      embedHtml: undefined,
      mediaAspectRatio: 16 / 9,
      mediaWidthPercent: 100,
      mediaAlignment: 'center',
      elementOrder: ['emoji', 'title', 'content', 'media'],
      customBlocks: [],
    }]);
    setActiveSlideId(newId);
  }, []);

  const handleDeleteSlide = useCallback((id: string, commitImmediate: (slides: SlideData[]) => void) => {
    if (slides.length === 1) {
      toast.error('You need at least one slide in your project.');
      return;
    }

    const targetIndex = slides.findIndex(s => s.id === id);
    const updatedSlides = slides.filter(s => s.id !== id);
    commitImmediate(updatedSlides);

    if (activeSlideId === id && updatedSlides.length > 0) {
      const fallbackIndex = Math.min(targetIndex, updatedSlides.length - 1);
      setActiveSlideId(updatedSlides[fallbackIndex].id);
    }
    toast.success('Slide deleted');
  }, [slides, activeSlideId]);

  const handleDuplicateSlide = useCallback((id: string, commitImmediate: (slides: SlideData[]) => void) => {
    const slideIndex = slides.findIndex(s => s.id === id);
    if (slideIndex === -1) return;
    
    const slideToDuplicate = slides[slideIndex];
    const newId = Date.now().toString();
    
    const newSlide = {
      ...slideToDuplicate,
      id: newId,
      title: `${slideToDuplicate.title} (Copy)`
    };

    const updatedSlides = [...slides];
    updatedSlides.splice(slideIndex + 1, 0, newSlide);
    
    commitImmediate(updatedSlides);
    setActiveSlideId(newId);
    toast.success('Slide duplicated');
  }, [slides]);

  return {
    slides, setSlides,
    slidesRef,
    activeSlideId, setActiveSlideId,
    projectName, setProjectName,
    projectOptions, setProjectOptions,
    currentScale, setCurrentScale,
    activeTool, setActiveTool,
    updateSlides,
    addSlide: addNewSlide,
    handleDeleteSlide,
    handleDuplicateSlide,
    undo: () => {},
    redo: () => {},
    canUndo: false,
    canRedo: false
  };
}
