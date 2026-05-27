'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { SlideData, ProjectOptions } from '@/lib/types';

export function useSlideEditor() {
  const [slides, setSlides] = useState<SlideData[]>([]);
  const [activeSlideId, setActiveSlideId] = useState<string>('');
  const [projectName, setProjectName] = useState('Untitled Project');
  const [projectOptions, setProjectOptions] = useState<ProjectOptions>({});
  const [history, setHistory] = useState<SlideData[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  const [currentScale, setCurrentScale] = useState(0.6);
  const [activeTool, setActiveTool] = useState<'select' | 'text' | 'image' | 'color'>('select');
  
  // Ref to always have latest slides for export / background tasks
  const slidesRef = useRef<SlideData[]>([]);
  const historyRef = useRef<SlideData[][]>([]);
  const historyIndexRef = useRef(-1);
  useEffect(() => {
    slidesRef.current = slides;
  }, [slides]);

  const cloneSlides = useCallback((items: SlideData[]): SlideData[] => {
    try {
      return structuredClone(items);
    } catch {
      return JSON.parse(JSON.stringify(items));
    }
  }, []);

  const pushHistory = useCallback((nextSlides: SlideData[]) => {
    const snapshot = cloneSlides(nextSlides);
    const current = historyRef.current[historyIndexRef.current];
    if (current && JSON.stringify(current) === JSON.stringify(snapshot)) return;

    const base = historyRef.current.slice(0, historyIndexRef.current + 1);
    base.push(snapshot);
    const nextHistory = base.length > 50 ? base.slice(-50) : base;
    const nextIndex = nextHistory.length - 1;

    historyRef.current = nextHistory;
    historyIndexRef.current = nextIndex;
    setHistory(nextHistory);
    setHistoryIndex(nextIndex);
  }, [cloneSlides]);

  const updateSlides = useCallback((newSlides: SlideData[] | ((prev: SlideData[]) => SlideData[]), recordHistory = true) => {
    setSlides(prev => {
      const nextSlides = typeof newSlides === 'function' ? newSlides(prev) : newSlides;
      slidesRef.current = nextSlides;
      if (recordHistory) pushHistory(nextSlides);
      return nextSlides;
    });
  }, [pushHistory]);

  const initializeSlides = useCallback((initialSlides: SlideData[]) => {
    const snapshot = cloneSlides(initialSlides);
    slidesRef.current = snapshot;
    historyRef.current = [cloneSlides(snapshot)];
    historyIndexRef.current = 0;
    setSlides(snapshot);
    setHistory([cloneSlides(snapshot)]);
    setHistoryIndex(0);
    if (snapshot[0]) setActiveSlideId(snapshot[0].id);
  }, [cloneSlides]);

  const addNewSlide = useCallback((brandSettings: any) => {
    const newId = Date.now().toString();
    updateSlides(prevSlides => [...prevSlides, {
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
  }, [updateSlides]);

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

  const undo = useCallback(() => {
    const currentIndex = historyIndexRef.current;
    if (currentIndex <= 0) return;

    const nextIndex = currentIndex - 1;
    const snapshot = cloneSlides(historyRef.current[nextIndex]);
    historyIndexRef.current = nextIndex;
    slidesRef.current = snapshot;
    setHistoryIndex(nextIndex);
    setSlides(snapshot);
    if (!snapshot.some(s => s.id === activeSlideId) && snapshot[0]) {
      setActiveSlideId(snapshot[0].id);
    }
  }, [activeSlideId, cloneSlides]);

  const redo = useCallback(() => {
    const currentIndex = historyIndexRef.current;
    if (currentIndex >= historyRef.current.length - 1) return;

    const nextIndex = currentIndex + 1;
    const snapshot = cloneSlides(historyRef.current[nextIndex]);
    historyIndexRef.current = nextIndex;
    slidesRef.current = snapshot;
    setHistoryIndex(nextIndex);
    setSlides(snapshot);
    if (!snapshot.some(s => s.id === activeSlideId) && snapshot[0]) {
      setActiveSlideId(snapshot[0].id);
    }
  }, [activeSlideId, cloneSlides]);

  return {
    slides, setSlides: updateSlides,
    slidesRef,
    activeSlideId, setActiveSlideId,
    projectName, setProjectName,
    projectOptions, setProjectOptions,
    currentScale, setCurrentScale,
    activeTool, setActiveTool,
    updateSlides,
    initializeSlides,
    addSlide: addNewSlide,
    handleDeleteSlide,
    handleDuplicateSlide,
    undo,
    redo,
    canUndo: historyIndex > 0,
    canRedo: historyIndex >= 0 && historyIndex < history.length - 1
  };
}
