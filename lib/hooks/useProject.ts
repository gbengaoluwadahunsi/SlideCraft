'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { SlideData, Project } from '@/lib/types';

export function useProject(projectId?: string) {
  const { data: session, status } = useSession();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [history, setHistory] = useState<SlideData[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedRef = useRef<string>('');

  // Note: Authentication check and redirect should be handled at the page level
  // to prevent flash of content before redirect

  // Load project
  const loadProject = useCallback(async (id: string) => {
    if (!session?.user?.id) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/projects/${id}`);
      if (!response.ok) throw new Error('Failed to load project');
      
      const data = await response.json();
      setProject(data.project);
      setHistory([data.project.slides]);
      setHistoryIndex(0);
      lastSavedRef.current = JSON.stringify(data.project.slides);
    } catch (error) {
      console.error('Load project error:', error);
    } finally {
      setLoading(false);
    }
  }, [session]);

  // Auto-save
  const autoSave = useCallback(async (slides: SlideData[], options: any = {}) => {
    if (!project?.id || !session?.user?.id) return;

    const currentState = JSON.stringify(slides);
    if (currentState === lastSavedRef.current) return;

    // Clear existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // Debounce auto-save
    autoSaveTimeoutRef.current = setTimeout(async () => {
      try {
        await fetch(`/api/projects/${project.id}/auto-save`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slides, options })
        });
        lastSavedRef.current = currentState;
      } catch (error) {
        console.error('Auto-save error:', error);
      }
    }, 2000); // 2 second debounce
  }, [project?.id, session]);

  // Save project (with history)
  const saveProject = useCallback(async (slides: SlideData[], options: any = {}) => {
    if (!project?.id || !session?.user?.id) return;

    try {
      setSaving(true);
      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slides, options, saveHistory: true })
      });

      if (!response.ok) throw new Error('Failed to save project');

      const data = await response.json();
      setProject(data.project);
      lastSavedRef.current = JSON.stringify(slides);
    } catch (error) {
      console.error('Save project error:', error);
      throw error;
    } finally {
      setSaving(false);
    }
  }, [project?.id, session]);

  // Add to history for undo/redo
  const addToHistory = useCallback((slides: SlideData[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(slides);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    
    // Limit history to 50 entries
    if (newHistory.length > 50) {
      setHistory(newHistory.slice(-50));
      setHistoryIndex(49);
    }
  }, [history, historyIndex]);

  // Undo
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      return history[historyIndex - 1];
    }
    return null;
  }, [history, historyIndex]);

  // Redo
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      return history[historyIndex + 1];
    }
    return null;
  }, [history, historyIndex]);

  // Load project on mount if projectId provided
  useEffect(() => {
    if (projectId && status === 'authenticated') {
      loadProject(projectId);
    }
  }, [projectId, status, loadProject]);

  return {
    project,
    loading,
    saving,
    loadProject,
    saveProject,
    autoSave,
    addToHistory,
    undo,
    redo,
    canUndo: historyIndex > 0,
    canRedo: historyIndex < history.length - 1
  };
}

