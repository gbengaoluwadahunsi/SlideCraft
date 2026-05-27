'use client';

import React from 'react';
import { 
  X, Palette, Type, Image as ImageIcon, 
  Trash2, Plus, Check, ChevronDown, 
  Sparkles, Save, ShieldCheck, RefreshCw
} from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import Image from 'next/image';
import { toast } from 'sonner';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  brandSettings: any;
}

const FONTS = [
  'Inter', 'Montserrat', 'Playfair Display', 'Roboto Mono', 
  'Outfit', 'Syne', 'Plus Jakarta Sans', 'Fraunces'
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  brandSettings
}) => {
  const settings = brandSettings.brandSettings || {};
  const update = (updates: Record<string, string | null>) => {
    if (typeof brandSettings.updateBrandSettings === 'function') {
      brandSettings.updateBrandSettings(updates);
      return;
    }
    if (typeof brandSettings.setBrandSettings === 'function') {
      brandSettings.setBrandSettings({ ...settings, ...updates });
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/70 backdrop-blur-md z-[100]" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl bg-[var(--surface-1)] border border-[var(--border-hover)] rounded-3xl shadow-2xl z-[101] outline-none overflow-hidden">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-8 pb-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center">
                  <Palette size={24} />
                </div>
                <div>
                  <Dialog.Title className="text-2xl font-black text-white tracking-tight">Brand Kit</Dialog.Title>
                  <p className="text-sm text-[var(--text-muted)] mt-1">Setup your global brand identity</p>
                </div>
              </div>
              <Dialog.Close className="p-2 hover:bg-[var(--surface-3)] rounded-xl transition-colors text-[var(--text-secondary)] hover:text-white">
                <X size={24} />
              </Dialog.Close>
            </div>

            <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto">
              {/* Branding Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Logo Section */}
                <div className="space-y-4">
                  <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-2">
                    <ShieldCheck size={14} className="text-[var(--accent)]" /> Brand Logo
                  </label>
                  
                  {settings.logoUrl ? (
                    <div className="relative aspect-video rounded-2xl border border-[var(--border-hover)] bg-black/20 overflow-hidden group">
                      <Image 
                        src={settings.logoUrl} 
                        alt="Logo" 
                        className="w-full h-full object-contain p-4" 
                        fill 
                        unoptimized 
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <label className="p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border-hover)] text-white hover:bg-[var(--surface-3)] cursor-pointer">
                          <RefreshCw size={18} />
                          <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                             const file = e.target.files?.[0];
                             if (file) {
                               const reader = new FileReader();
                               reader.onload = (ev) => update({ logoUrl: ev.target?.result as string });
                               reader.readAsDataURL(file);
                             }
                          }} />
                        </label>
                        <button 
                          onClick={() => update({ logoUrl: null })}
                          className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center aspect-video rounded-2xl border-2 border-dashed border-[var(--border-hover)] hover:border-[var(--accent)] transition-colors bg-[var(--surface-2)]/30 cursor-pointer group">
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                         const file = e.target.files?.[0];
                         if (file) {
                           const reader = new FileReader();
                           reader.onload = (ev) => update({ logoUrl: ev.target?.result as string });
                           reader.readAsDataURL(file);
                         }
                      }} />
                      <div className="w-12 h-12 rounded-full bg-[var(--surface-3)] flex items-center justify-center text-[var(--text-muted)] group-hover:text-[var(--accent)] group-hover:scale-110 transition-all">
                        <Plus size={24} />
                      </div>
                      <span className="text-xs font-medium text-[var(--text-muted)] mt-3">Upload Logo</span>
                    </label>
                  )}
                  <div className="flex items-center gap-2 bg-yellow-500/5 border border-yellow-500/10 rounded-xl p-3">
                     <Sparkles size={14} className="text-yellow-500 flex-shrink-0" />
                     <p className="text-[10px] text-[var(--text-muted)] leading-tight">Pro Tip: Use a transparent PNG for the best result on dark backgrounds.</p>
                  </div>
                </div>

                {/* Info Section */}
                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">Brand Name</label>
                    <input 
                      type="text"
                      value={settings.category || ''}
                      onChange={(e) => update({ category: e.target.value })}
                      placeholder="e.g. Customer Reviews"
                      className="w-full bg-[var(--surface-2)] border border-[var(--border-hover)] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[var(--accent)] transition shadow-inner"
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">Handle (@)</label>
                    <input 
                      type="text"
                      value={settings.handle || ''}
                      onChange={(e) => update({ handle: e.target.value })}
                      placeholder="@yourhandle"
                      className="w-full bg-[var(--surface-2)] border border-[var(--border-hover)] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[var(--accent)] transition shadow-inner"
                    />
                  </div>
                </div>
              </div>

              {/* Theme Colors */}
              <div className="space-y-4 pt-8 border-t border-[var(--border-hover)]/30">
                 <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-2">
                    <Palette size={14} /> Global Color Palette
                  </label>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                      { label: 'Accent', key: 'accentColor', set: 'setAccentColor' },
                      { label: 'Background', key: 'backgroundColor', set: 'setBackgroundColor' },
                      { label: 'Text', key: 'textColor', set: 'setTextColor' }
                    ].map((color) => (
                      <div key={color.key} className="p-4 rounded-2xl bg-[var(--surface-2)] border border-[var(--border-hover)] flex items-center justify-between">
                        <div>
                          <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase mb-1">{color.label}</p>
                          <p className="text-sm font-mono text-white tracking-widest uppercase">{settings[color.key] || ''}</p>
                        </div>
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-white/10 shadow-lg">
                          <input 
                            type="color" 
                            className="absolute inset-0 w-[150%] h-[150%] -translate-x-1/4 -translate-y-1/4 cursor-pointer" 
                            value={settings[color.key] || '#000000'} 
                            onChange={(e) => update({ [color.key]: e.target.value })}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
              </div>

              {/* Typography */}
              <div className="space-y-4 pt-8 border-t border-[var(--border-hover)]/30">
                <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-2">
                  <Type size={14} /> Brand Typography
                </label>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {FONTS.map((font) => (
                    <button
                      key={font}
                      onClick={() => update({ fontFamily: font })}
                      style={{ fontFamily: font }}
                      className={`p-4 rounded-xl border transition-all text-left group ${
                        settings.fontFamily === font 
                          ? 'bg-[var(--accent)] border-[var(--accent)] text-black' 
                          : 'bg-[var(--surface-2)] border-[var(--border-hover)] text-white hover:border-[var(--accent)]/50'
                      }`}
                    >
                      <span className="block text-sm font-bold mb-1 truncate">{font}</span>
                      <span className="block text-[10px] opacity-60">Sample Text</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-8 border-t border-[var(--border-hover)] bg-[var(--surface-2)]/50 flex items-center justify-end gap-4">
              <button
                onClick={onClose}
                className="px-8 py-3 rounded-xl text-sm font-bold text-white hover:bg-[var(--surface-3)] transition border border-[var(--border-hover)]"
              >
                Close
              </button>
              <button
                onClick={() => {
                  toast.success('Brand applied');
                  onClose();
                }}
                className="px-10 py-3 rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-black font-extrabold shadow-[0_4px_20px_rgba(var(--accent-rgb),0.3)] flex items-center gap-2 transition"
              >
                <Save size={18} />
                Save & Apply Brand
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
