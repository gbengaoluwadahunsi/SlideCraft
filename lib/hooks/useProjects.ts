'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

interface ProjectListItem {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  lastAutoSavedAt?: string;
  isShared: boolean;
}

export function useProjects() {
  const { data: session, status } = useSession();
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadProjects = useCallback(async () => {
    if (!session?.user?.id || status !== 'authenticated') {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/projects');
      if (!response.ok) throw new Error('Failed to load projects');
      
      const data = await response.json();
      setProjects(data.projects);
    } catch (error) {
      console.error('Load projects error:', error);
    } finally {
      setLoading(false);
    }
  }, [session, status]);

  const createProject = useCallback(async (name: string, slides: any[], options: any = {}) => {
    if (!session?.user?.id) return null;

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, slides, options })
      });

      if (!response.ok) throw new Error('Failed to create project');
      
      const data = await response.json();
      await loadProjects();
      return data.project;
    } catch (error) {
      console.error('Create project error:', error);
      throw error;
    }
  }, [session, loadProjects]);

  const deleteProject = useCallback(async (id: string) => {
    if (!session?.user?.id) return;

    try {
      const response = await fetch(`/api/projects/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete project');
      
      await loadProjects();
    } catch (error) {
      console.error('Delete project error:', error);
      throw error;
    }
  }, [session, loadProjects]);

  useEffect(() => {
    if (status === 'authenticated') {
      loadProjects();
    }
  }, [status, loadProjects]);

  return {
    projects,
    loading,
    loadProjects,
    createProject,
    deleteProject
  };
}

