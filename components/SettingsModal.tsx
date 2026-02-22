'use client';

import React, { useRef } from 'react';
import { Settings, X, Loader2, Upload, Trash2, Palette } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';

interface BrandSettings {
  handle: string;
  category: string;
  fontFamily: string;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  logoUrl: string | null;
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectName: string;
  onProjectNameChange: (name: string) => void;
  brandSettings: BrandSettings;
  onBrandSettingsChange: (settings: BrandSettings) => void;
  canUploadLogo: boolean;
  isUploadingLogo: boolean;
  isSaving: boolean;
  onLogoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onLogoDelete: () => void;
  onSave: () => Promise<void>;
  onReset: () => void;
}

const FONT_OPTIONS = [
  { value: 'var(--font-inter)', label: 'Inter' },
  { value: 'var(--font-bebas-neue)', label: 'Bebas Neue' },
  { value: 'Georgia, serif', label: 'Georgia' },
  { value: 'system-ui, sans-serif', label: 'System UI' },
  { value: "'Courier New', monospace", label: 'Monospace' },
];

const PRESET_PALETTES = [
  { bg: '#0B0F19', text: '#ffffff', accent: '#ffd700', label: 'Gold Dark' },
  { bg: '#0B0F19', text: '#ffffff', accent: '#00D4FF', label: 'Cyan Dark' },
  { bg: '#0B0F19', text: '#ffffff', accent: '#FF4D6D', label: 'Rose Dark' },
  { bg: '#0B0F19', text: '#ffffff', accent: '#10b981', label: 'Emerald Dark' },
  { bg: '#ffffff', text: '#1a1a1a', accent: '#3b82f6', label: 'Blue Light' },
  { bg: '#1e1b4b', text: '#e0e7ff', accent: '#818cf8', label: 'Indigo' },
  { bg: '#0c0a09', text: '#fafaf9', accent: '#f97316', label: 'Orange Dark' },
  { bg: '#f8fafc', text: '#0f172a', accent: '#059669', label: 'Green Light' },
];

export const SettingsModal = React.memo(function SettingsModal({
  isOpen,
  onClose,
  projectName,
  onProjectNameChange,
  brandSettings,
  onBrandSettingsChange,
  canUploadLogo,
  isUploadingLogo,
  isSaving,
  onLogoUpload,
  onLogoDelete,
  onSave,
  onReset,
}: SettingsModalProps) {
  const logoInputRef = useRef<HTMLInputElement>(null);

  const update = (patch: Partial<BrandSettings>) =>
    onBrandSettingsChange({ ...brandSettings, ...patch });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Brand Kit & Settings"
      titleIcon={<Settings size={20} />}
      size="md"
      footer={
        <div className="flex justify-between items-center">
          <button
            onClick={onReset}
            disabled={isSaving}
            className="px-4 py-2.5 bg-[var(--surface-3)] hover:bg-[var(--surface-2)] text-white font-medium rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <X size={16} />
            Reset
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-[var(--surface-3)] hover:bg-[var(--surface-2)] text-white font-medium rounded-xl transition"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                await onSave();
                onClose();
              }}
              disabled={isSaving}
              className="px-6 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-black font-bold rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Saving...
                </>
              ) : (
                'Save'
              )}
            </button>
          </div>
        </div>
      }
    >
      <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
        {/* Project Name */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-[var(--text-muted)]">Project Name</label>
          <input
            type="text"
            value={projectName}
            onChange={(e) => onProjectNameChange(e.target.value)}
            className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-[var(--accent)] transition"
            placeholder="Untitled Project"
          />
        </div>

        {/* Author Handle */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-[var(--text-muted)]">Author Handle</label>
          <input
            type="text"
            value={brandSettings.handle}
            onChange={(e) => update({ handle: e.target.value })}
            className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-[var(--accent)] transition"
            placeholder="@yourhandle"
          />
          <p className="text-xs text-[var(--text-muted)]">Shown on all slides</p>
        </div>

        {/* Logo Upload */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-[var(--text-muted)]">Brand Logo</label>
          <input
            ref={logoInputRef}
            type="file"
            accept="image/*"
            onChange={onLogoUpload}
            className="hidden"
          />
          {brandSettings.logoUrl ? (
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] overflow-hidden flex items-center justify-center">
                <img src={brandSettings.logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
              </div>
              <button
                onClick={onLogoDelete}
                className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 transition"
              >
                <Trash2 size={12} /> Remove
              </button>
            </div>
          ) : (
            <button
              onClick={() => logoInputRef.current?.click()}
              disabled={!canUploadLogo || isUploadingLogo}
              className="w-full py-3 border border-dashed border-[var(--border)] rounded-lg text-sm text-[var(--text-muted)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition flex items-center justify-center gap-2 disabled:opacity-40"
            >
              {isUploadingLogo ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
              {isUploadingLogo ? 'Uploading...' : 'Upload Logo'}
            </button>
          )}
          {!canUploadLogo && !brandSettings.logoUrl && (
            <p className="text-xs text-[var(--text-muted)]">Logo upload available on paid plans</p>
          )}
        </div>

        <div className="border-t border-[var(--border)] pt-5">
          <div className="flex items-center gap-2 mb-4">
            <Palette size={16} className="text-[var(--accent)]" />
            <span className="text-sm font-medium text-white">Brand Colors</span>
          </div>

          {/* Color Presets */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            {PRESET_PALETTES.map((p) => (
              <button
                key={p.label}
                onClick={() => update({ backgroundColor: p.bg, textColor: p.text, accentColor: p.accent })}
                className="group relative rounded-lg p-2 border border-[var(--border)] hover:border-[var(--accent)] transition"
                title={p.label}
              >
                <div className="flex gap-1 justify-center">
                  <div className="w-4 h-4 rounded-full border border-white/10" style={{ background: p.bg }} />
                  <div className="w-4 h-4 rounded-full border border-white/10" style={{ background: p.accent }} />
                  <div className="w-4 h-4 rounded-full border border-white/10" style={{ background: p.text }} />
                </div>
                <div className="text-[9px] text-center text-[var(--text-muted)] mt-1 truncate">{p.label}</div>
              </button>
            ))}
          </div>

          {/* Custom Colors */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs text-[var(--text-muted)]">Background</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={brandSettings.backgroundColor}
                  onChange={(e) => update({ backgroundColor: e.target.value })}
                  className="w-8 h-8 rounded cursor-pointer bg-transparent border-0"
                />
                <input
                  type="text"
                  value={brandSettings.backgroundColor}
                  onChange={(e) => update({ backgroundColor: e.target.value })}
                  className="flex-1 bg-[var(--surface-2)] border border-[var(--border)] rounded px-2 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-[var(--accent)]"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-[var(--text-muted)]">Accent</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={brandSettings.accentColor}
                  onChange={(e) => update({ accentColor: e.target.value })}
                  className="w-8 h-8 rounded cursor-pointer bg-transparent border-0"
                />
                <input
                  type="text"
                  value={brandSettings.accentColor}
                  onChange={(e) => update({ accentColor: e.target.value })}
                  className="flex-1 bg-[var(--surface-2)] border border-[var(--border)] rounded px-2 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-[var(--accent)]"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-[var(--text-muted)]">Text</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={brandSettings.textColor}
                  onChange={(e) => update({ textColor: e.target.value })}
                  className="w-8 h-8 rounded cursor-pointer bg-transparent border-0"
                />
                <input
                  type="text"
                  value={brandSettings.textColor}
                  onChange={(e) => update({ textColor: e.target.value })}
                  className="flex-1 bg-[var(--surface-2)] border border-[var(--border)] rounded px-2 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-[var(--accent)]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Font Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-[var(--text-muted)]">Font Family</label>
          <select
            value={brandSettings.fontFamily}
            onChange={(e) => update({ fontFamily: e.target.value })}
            className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-[var(--accent)] transition appearance-none"
          >
            {FONT_OPTIONS.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
        </div>

        {/* Category */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-[var(--text-muted)]">Content Category</label>
          <input
            type="text"
            value={brandSettings.category}
            onChange={(e) => update({ category: e.target.value })}
            className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-[var(--accent)] transition"
            placeholder="e.g. Tech, Marketing, Design"
          />
          <p className="text-xs text-[var(--text-muted)]">Helps AI match your content niche</p>
        </div>
      </div>
    </Modal>
  );
});
