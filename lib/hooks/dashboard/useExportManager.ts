'use client';

import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { SlideData } from '@/lib/types';

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function filenameBase(value: string) {
  return (value || 'carousel')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 50) || 'carousel';
}

export function useExportManager() {
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState({ current: 0, total: 0, status: '' });

  const handleExportToPdf = useCallback(async (slides: SlideData[], projectName: string, format: 'pdf' | 'ppt' = 'pdf') => {
    if (slides.length === 0) return;
    
    setIsExporting(true);
    setExportProgress({ current: 1, total: 3, status: 'Preparing export...' });
    
    try {
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slides,
          format,
          mode: 'puppeteer',
          options: {},
        }),
      });

      setExportProgress({ current: 2, total: 3, status: 'Building file...' });

      if (!response.ok) {
        let message = 'Failed to export';
        try {
          const data = await response.json();
          message = data.message || data.error || message;
        } catch {
          message = response.statusText || message;
        }
        throw new Error(message);
      }

      const blob = await response.blob();
      const extension = format === 'ppt' ? 'pptx' : 'pdf';
      downloadBlob(blob, `${filenameBase(projectName)}.${extension}`);
      setExportProgress({ current: 3, total: 3, status: 'Download ready' });
      toast.success(`${format === 'ppt' ? 'PowerPoint' : 'PDF'} exported`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to export. Please try again.');
    } finally {
      setIsExporting(false);
    }
  }, []);

  return {
    isExporting,
    exportProgress,
    setIsExporting,
    setExportProgress,
    handleExportToPdf
  };
}
