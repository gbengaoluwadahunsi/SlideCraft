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
      // Use no-store to prevent caching and ensure fresh data
      const response = await fetch('/api/projects', { cache: 'no-store' });
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
      // Add to local state immediately instead of reloading all projects
      const newProject: ProjectListItem = {
        id: data.project.id,
        name: data.project.name,
        createdAt: data.project.created_at || new Date().toISOString(),
        updatedAt: data.project.updated_at || new Date().toISOString(),
        isShared: false
      };
      setProjects(prev => [newProject, ...prev]);
      return data.project;
    } catch (error) {
      console.error('Create project error:', error);
      throw error;
    }
  }, [session]);

  const deleteProject = useCallback(async (id: string) => {
    if (!session?.user?.id) return;

    try {
      const response = await fetch(`/api/projects/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete project');
      
      // Remove from local state immediately instead of reloading all projects
      setProjects(prev => prev.filter(p => p.id !== id));
    } catch (error) {
      console.error('Delete project error:', error);
      throw error;
    }
  }, [session]);

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

