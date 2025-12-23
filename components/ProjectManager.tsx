'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useProjects } from '@/lib/hooks/useProjects';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FolderOpen, 
  Save, 
  Plus, 
  Trash2, 
  Share2, 
  Download, 
  Upload,
  X,
  Loader2,
  Copy,
  Check
} from 'lucide-react';
import { SlideData } from '@/app/dashboard/page';

interface ProjectManagerProps {
  currentProjectId?: string;
  projectName: string;
  slides: SlideData[];
  options: any;
  onProjectLoad: (project: { id: string; name: string; slides: SlideData[]; options: any }) => void;
  onProjectNameChange: (name: string) => void;
}

export function ProjectManager({
  currentProjectId,
  projectName,
  slides,
  options,
  onProjectLoad,
  onProjectNameChange
}: ProjectManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [shareCopied, setShareCopied] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const { projects, loading, createProject, deleteProject, loadProjects } = useProjects();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleSave = async () => {
    if (!currentProjectId) {
      // Create new project
      try {
        setIsSaving(true);
        const project = await createProject(projectName || 'Untitled Project', slides, options);
        if (project) {
          router.push(`/dashboard?project=${project.id}`);
          router.refresh();
        }
      } catch (error) {
        alert('Failed to save project');
      } finally {
        setIsSaving(false);
      }
    } else {
      // Update existing project
      try {
        setIsSaving(true);
        const response = await fetch(`/api/projects/${currentProjectId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: projectName, slides, options, saveHistory: true })
        });

        if (!response.ok) throw new Error('Failed to save');
        await loadProjects();
      } catch (error) {
        alert('Failed to save project');
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleLoad = async (projectId: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}`);
      if (!response.ok) throw new Error('Failed to load project');
      
      const data = await response.json();
      onProjectLoad(data.project);
      router.push(`/dashboard?project=${projectId}`);
      setIsOpen(false);
    } catch (error) {
      alert('Failed to load project');
    }
  };

  const handleDelete = async (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this project?')) return;

    try {
      await deleteProject(projectId);
      if (currentProjectId === projectId) {
        router.push('/dashboard');
        router.refresh();
      }
    } catch (error) {
      alert('Failed to delete project');
    }
  };

  const handleShare = async () => {
    if (!currentProjectId) return;

    try {
      setIsSharing(true);
      const response = await fetch(`/api/projects/${currentProjectId}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isShared: !shareUrl })
      });

      if (!response.ok) throw new Error('Failed to update sharing');
      
      const data = await response.json();
      setShareUrl(data.shareUrl);
    } catch (error) {
      alert('Failed to update sharing');
    } finally {
      setIsSharing(false);
    }
  };

  const handleCopyShareUrl = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    }
  };

  const handleExport = () => {
    const data = {
      name: projectName,
      slides,
      options,
      exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectName || 'project'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      if (!data.slides || !Array.isArray(data.slides)) {
        throw new Error('Invalid project file');
      }

      onProjectNameChange(data.name || 'Imported Project');
      onProjectLoad({ id: '', name: data.name || 'Imported Project', slides: data.slides, options: data.options || {} });
      
      // Create new project from imported data
      const project = await createProject(data.name || 'Imported Project', data.slides, data.options || {});
      if (project) {
        router.push(`/dashboard?project=${project.id}`);
      }
    } catch (error) {
      alert('Failed to import project. Please check the file format.');
    }
  };

  return (
    <>
      <motion.button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg flex items-center gap-2 transition"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <FolderOpen size={16} />
        Projects
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
            onClick={() => setIsOpen(false)}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3, type: "spring", damping: 25 }}
              className="bg-[#0f1117] border border-gray-800 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
            <div className="p-6 border-b border-gray-800 flex items-center justify-between">
              <h2 className="text-xl font-bold">Project Manager</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center justify-center"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Current Project Actions */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => onProjectNameChange(e.target.value)}
                    className="flex-1 px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
                    placeholder="Project name"
                  />
                  <motion.button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-4 py-2 bg-[#ffd700] hover:bg-yellow-400 text-black font-bold rounded-lg flex items-center gap-2 disabled:opacity-50"
                    whileHover={{ scale: isSaving ? 1 : 1.05 }}
                    whileTap={{ scale: isSaving ? 1 : 0.95 }}
                  >
                    {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    Save
                  </motion.button>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleExport}
                    className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg flex items-center gap-2"
                  >
                    <Download size={16} />
                    Export JSON
                  </button>
                  <label className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg flex items-center gap-2 cursor-pointer">
                    <Upload size={16} />
                    Import JSON
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".json"
                      onChange={handleImport}
                      className="hidden"
                    />
                  </label>
                  {currentProjectId && (
                    <button
                      onClick={handleShare}
                      disabled={isSharing}
                      className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg flex items-center gap-2 disabled:opacity-50"
                    >
                      <Share2 size={16} />
                      {shareUrl ? 'Unshare' : 'Share'}
                    </button>
                  )}
                </div>

                {shareUrl && (
                  <div className="p-3 bg-gray-900 rounded-lg flex items-center gap-2">
                    <input
                      type="text"
                      value={shareUrl}
                      readOnly
                      className="flex-1 px-2 py-1 bg-gray-800 text-white text-sm rounded"
                    />
                    <button
                      onClick={handleCopyShareUrl}
                      className="px-3 py-1 bg-[#ffd700] hover:bg-yellow-400 text-black rounded flex items-center gap-1"
                    >
                      {shareCopied ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                  </div>
                )}
              </div>

              {/* Projects List */}
              <div>
                <h3 className="text-sm font-bold text-gray-400 uppercase mb-3">Your Projects</h3>
                {loading ? (
                  <div className="text-center py-8 text-gray-500">Loading...</div>
                ) : projects.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No projects yet</div>
                ) : (
                  <div className="space-y-2">
                    {projects.map((project, index) => (
                      <motion.div
                        key={project.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        onClick={() => handleLoad(project.id)}
                        className={`p-4 bg-gray-900 border rounded-lg cursor-pointer transition ${
                          currentProjectId === project.id
                            ? 'border-[#ffd700] bg-gray-900/50'
                            : 'border-gray-800 hover:border-gray-700'
                        }`}
                        whileHover={{ scale: 1.02, x: 5 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-semibold text-white">{project.name}</div>
                            <div className="text-xs text-gray-500 mt-1">
                              Updated {new Date(project.updatedAt).toLocaleDateString()}
                            </div>
                          </div>
                          <button
                            onClick={(e) => handleDelete(project.id, e)}
                            className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

