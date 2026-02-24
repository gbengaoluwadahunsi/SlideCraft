'use client';

import React, { useState, useRef, useCallback } from 'react';
import {
  Sparkles, X, Type, FileText, Link2, Globe, Trash, Paperclip,
  Loader2, Download, RefreshCw, CheckCircle2, ArrowRight,
} from 'lucide-react';

export interface DocAttachment {
  name: string;
  text: string;
  wordCount?: number;
  truncated?: boolean;
  sections?: string[];
}

export interface UrlAttachment {
  title: string;
  text: string;
  sourceDomain: string;
  wordCount?: number;
  truncated?: boolean;
  sections?: string[];
  sourceUrl?: string;
  description?: string;
}

interface AIGenerateModalProps {
  isOpen: boolean;
  onClose: () => void;

  aiInputTab: 'prompt' | 'document' | 'url';
  onInputTabChange: (tab: 'prompt' | 'document' | 'url') => void;

  aiPrompt: string;
  onPromptChange: (prompt: string) => void;

  docAttachment: DocAttachment | null;
  onDocUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClearDoc: () => void;
  isUploadingDoc: boolean;
  docUploadError: string | null;
  docUploadInputRef: React.RefObject<HTMLInputElement | null>;

  urlAttachment: UrlAttachment | null;
  urlInput: string;
  onUrlInputChange: (value: string) => void;
  urlError: string | null;
  onUrlErrorChange: (error: string | null) => void;
  urlOwnershipConfirmed: boolean;
  onOwnershipChange: (confirmed: boolean) => void;
  onParseUrl: () => void;
  isParsingUrl: boolean;
  onClearUrl: () => void;

  aiSlideStyle: 'text' | 'visual' | 'mixed';
  onSlideStyleChange: (style: 'text' | 'visual' | 'mixed') => void;
  aiWritingStyle: string;
  onWritingStyleChange: (style: string) => void;
  aiLanguage: string;
  onLanguageChange: (lang: string) => void;
  aiSlideCount: number;
  onSlideCountChange: (count: number | null) => void;
  aiWordCount: number | null;
  onWordCountChange: (count: number | null) => void;

  isAdvancedOpen: boolean;
  onAdvancedToggle: () => void;
  aiTone: string;
  onToneChange: (tone: string) => void;
  aiAutoHashtags: boolean;
  onAutoHashtagsChange: (v: boolean) => void;
  aiIncludeStats: boolean;
  onIncludeStatsChange: (v: boolean) => void;
  aiAccessibility: boolean;
  onAccessibilityChange: (v: boolean) => void;
  aiSmartColors: boolean;
  onSmartColorsChange: (v: boolean) => void;

  freshDesign: boolean;
  onFreshDesignChange: (v: boolean) => void;

  aiAudience: string;
  onAudienceChange: (v: string) => void;
  aiGoal: string;
  onGoalChange: (v: string) => void;

  onGenerate: () => void;
  isGenerating: boolean;
}

const LANG_MAP: Record<string, string> = {
  en: 'English', es: 'Spanish', fr: 'French', de: 'German',
  it: 'Italian', pt: 'Portuguese', zh: 'Chinese', ja: 'Japanese',
  ko: 'Korean', ar: 'Arabic', hi: 'Hindi', ru: 'Russian',
  nl: 'Dutch', sv: 'Swedish', pl: 'Polish',
};

const AUDIENCE_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'Any audience' },
  { value: 'LinkedIn professionals', label: 'LinkedIn' },
  { value: 'Twitter/X', label: 'Twitter/X' },
  { value: 'Investors and decision-makers', label: 'Investors' },
  { value: 'Beginners in the topic', label: 'Beginners' },
  { value: 'Experts and practitioners', label: 'Experts' },
  { value: 'Sales and marketing teams', label: 'Sales/Marketing' },
  { value: 'Educators and students', label: 'Education' },
];

export const AIGenerateModal = React.memo(function AIGenerateModal({
  isOpen,
  onClose,
  aiInputTab,
  onInputTabChange,
  aiPrompt,
  onPromptChange,
  docAttachment,
  onDocUpload,
  onClearDoc,
  isUploadingDoc,
  docUploadError,
  docUploadInputRef,
  urlAttachment,
  urlInput,
  onUrlInputChange,
  urlError,
  onUrlErrorChange,
  urlOwnershipConfirmed,
  onOwnershipChange,
  onParseUrl,
  isParsingUrl,
  onClearUrl,
  aiSlideStyle,
  onSlideStyleChange,
  aiWritingStyle,
  onWritingStyleChange,
  aiLanguage,
  onLanguageChange,
  aiSlideCount,
  onSlideCountChange,
  aiWordCount,
  onWordCountChange,
  isAdvancedOpen,
  onAdvancedToggle,
  aiTone,
  onToneChange,
  aiAutoHashtags,
  onAutoHashtagsChange,
  aiIncludeStats,
  onIncludeStatsChange,
  aiAccessibility,
  onAccessibilityChange,
  aiSmartColors,
  onSmartColorsChange,
  freshDesign,
  onFreshDesignChange,
  aiAudience,
  onAudienceChange,
  aiGoal,
  onGoalChange,
  onGenerate,
  isGenerating,
}: AIGenerateModalProps) {
  const [isQuickMode, setIsQuickMode] = useState(true);
  const [quickInput, setQuickInput] = useState('');

  const parseUrlRef = useRef(onParseUrl);
  parseUrlRef.current = onParseUrl;

  const isUrlInput = /^https?:\/\/\S{5,}/.test(quickInput.trim());

  const canQuickGenerate = isGenerating
    ? false
    : isUrlInput
      ? !!urlAttachment
      : !!(quickInput.trim() || docAttachment);

  const handleQuickPaste = useCallback(
    (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
      const pasted = e.clipboardData.getData('text').trim();
      if (/^https?:\/\/\S{5,}/.test(pasted)) {
        e.preventDefault();
        setQuickInput(pasted);
        onInputTabChange('url');
        onUrlInputChange(pasted);
        onOwnershipChange(true);
        setTimeout(() => parseUrlRef.current(), 300);
      }
    },
    [onInputTabChange, onUrlInputChange, onOwnershipChange],
  );

  const handleQuickChange = useCallback(
    (value: string) => {
      setQuickInput(value);
      if (!/^https?:\/\//.test(value.trim())) {
        onInputTabChange('prompt');
        onPromptChange(value);
      }
    },
    [onInputTabChange, onPromptChange],
  );

  const handleManualUrlParse = useCallback(() => {
    const trimmed = quickInput.trim();
    onInputTabChange('url');
    onUrlInputChange(trimmed);
    onOwnershipChange(true);
    setTimeout(() => parseUrlRef.current(), 300);
  }, [quickInput, onInputTabChange, onUrlInputChange, onOwnershipChange]);

  if (!isOpen) return null;

  /* ================================================================
     QUICK MODE — single input, smart defaults, one-click generate
     ================================================================ */
  if (isQuickMode) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <div className="w-full max-w-2xl bg-[var(--surface-1)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
          {/* Header */}
          <div className="p-5 pb-0">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/15 flex items-center justify-center shrink-0">
                  <Sparkles size={20} className="text-[var(--accent)]" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg leading-tight">Create Carousel</h3>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">
                    Paste content, a URL, upload a doc, or describe a topic
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-[var(--text-muted)] hover:text-white transition p-1"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Input */}
          <div className="p-5">
            <textarea
              value={quickInput}
              onChange={(e) => handleQuickChange(e.target.value)}
              onPaste={handleQuickPaste}
              placeholder={'Paste your blog post, article, or any text content here...\n\nOr paste a URL to import from the web.\nOr just describe a topic like "5 tips for better productivity"'}
              className="w-full min-h-[160px] max-h-[40vh] bg-[var(--surface-2)] border border-[var(--border)] rounded-xl p-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[var(--accent)]/50 focus:ring-1 focus:ring-[var(--accent)]/30 resize-y transition"
              autoFocus
            />

            {/* URL status */}
            {isUrlInput && !urlAttachment && !isParsingUrl && (
              <button
                onClick={handleManualUrlParse}
                className="mt-2 flex items-center gap-1.5 text-xs text-[var(--accent)] hover:brightness-125 transition"
              >
                <ArrowRight size={12} />
                Parse this URL
              </button>
            )}
            {isParsingUrl && (
              <div className="mt-2 flex items-center gap-2 text-xs text-[var(--text-muted)]">
                <Loader2 size={12} className="animate-spin text-[var(--accent)]" />
                Reading article...
              </div>
            )}
            {isUrlInput && urlAttachment && (
              <div className="mt-2 flex items-center gap-2 text-xs">
                <CheckCircle2 size={12} className="text-green-400 shrink-0" />
                <span className="text-white font-medium truncate">{urlAttachment.title}</span>
                <span className="text-[var(--text-muted)] shrink-0">
                  &middot; {urlAttachment.wordCount} words
                </span>
              </div>
            )}

            {/* Doc status */}
            {docAttachment && (
              <div className="mt-2 flex items-center gap-2 text-xs">
                <CheckCircle2 size={12} className="text-green-400 shrink-0" />
                <FileText size={12} className="text-[var(--accent)] shrink-0" />
                <span className="text-white font-medium truncate">{docAttachment.name}</span>
                <span className="text-[var(--text-muted)] shrink-0">
                  &middot; {docAttachment.wordCount} words
                </span>
                <button
                  onClick={onClearDoc}
                  className="text-[var(--text-muted)] hover:text-red-400 ml-auto shrink-0"
                >
                  <Trash size={12} />
                </button>
              </div>
            )}

            {/* Errors */}
            {urlError && <p className="mt-2 text-xs text-red-400">{urlError}</p>}
            {docUploadError && <p className="mt-2 text-xs text-red-400">{docUploadError}</p>}
          </div>

          {/* Upload & options row */}
          {!docAttachment && (
            <div className="px-5 pb-3">
              <input
                ref={docUploadInputRef}
                type="file"
                accept=".md,.markdown,.docx,.txt,.pdf"
                className="hidden"
                onChange={onDocUpload}
              />
              <button
                onClick={() => docUploadInputRef.current?.click()}
                disabled={isUploadingDoc}
                className="w-full flex items-center justify-center gap-2 py-2.5 border border-dashed border-[var(--border)] hover:border-[var(--accent)]/40 rounded-xl text-xs text-[var(--text-muted)] hover:text-white transition"
              >
                {isUploadingDoc ? (
                  <><Loader2 size={14} className="animate-spin" /> Reading document...</>
                ) : (
                  <><FileText size={14} /> Upload Word, PDF, or text file</>
                )}
              </button>
            </div>
          )}

          {/* Quick options row */}
          <div className="px-5 pb-3">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-2.5 py-1.5">
                <span className="text-[10px] text-[var(--text-muted)] whitespace-nowrap">Slides</span>
                <select
                  value={aiSlideCount}
                  onChange={(e) => onSlideCountChange(parseInt(e.target.value, 10))}
                  className="bg-transparent text-xs text-white font-medium focus:outline-none cursor-pointer appearance-none pr-3"
                  style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'8\' height=\'8\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%239ca3af\' stroke-width=\'3\'%3E%3Cpath d=\'M6 9l6 6 6-6\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0 center' }}
                >
                  {[3,4,5,6,8,10,12,15,20,25,30,40,50,60,80,100].map(n => (
                    <option key={n} value={n} className="bg-[#1a1a2e]">{n}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5 bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-2.5 py-1.5">
                <span className="text-[10px] text-[var(--text-muted)] whitespace-nowrap">For</span>
                <select
                  value={aiAudience}
                  onChange={(e) => onAudienceChange(e.target.value)}
                  className="bg-transparent text-xs text-white font-medium focus:outline-none cursor-pointer appearance-none pr-3 max-w-[120px]"
                  style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'8\' height=\'8\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%239ca3af\' stroke-width=\'3\'%3E%3Cpath d=\'M6 9l6 6 6-6\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0 center' }}
                >
                  {AUDIENCE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value} className="bg-[#1a1a2e]">{o.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-1.5 bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-2.5 py-1.5 flex-1 min-w-0">
                <span className="text-[10px] text-[var(--text-muted)] whitespace-nowrap shrink-0">Goal</span>
                <input
                  type="text"
                  value={aiGoal}
                  onChange={(e) => onGoalChange(e.target.value)}
                  placeholder="e.g. drive sign-ups, explain concept"
                  className="bg-transparent text-xs text-white placeholder-[var(--text-muted)] focus:outline-none w-full min-w-0"
                />
              </div>
              <div className="flex items-center gap-1.5 bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-2.5 py-1.5">
                <span className="text-[10px] text-[var(--text-muted)] whitespace-nowrap">Tone</span>
                <select
                  value={aiTone}
                  onChange={(e) => onToneChange(e.target.value)}
                  className="bg-transparent text-xs text-white font-medium focus:outline-none cursor-pointer appearance-none pr-3"
                  style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'8\' height=\'8\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%239ca3af\' stroke-width=\'3\'%3E%3Cpath d=\'M6 9l6 6 6-6\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0 center' }}
                >
                  {['neutral','professional','casual','friendly','formal','conversational','authoritative'].map(t => (
                    <option key={t} value={t} className="bg-[#1a1a2e]">{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5 bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-2.5 py-1.5">
                <span className="text-[10px] text-[var(--text-muted)] whitespace-nowrap">Style</span>
                <select
                  value={aiWritingStyle}
                  onChange={(e) => onWritingStyleChange(e.target.value)}
                  className="bg-transparent text-xs text-white font-medium focus:outline-none cursor-pointer appearance-none pr-3"
                  style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'8\' height=\'8\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%239ca3af\' stroke-width=\'3\'%3E%3Cpath d=\'M6 9l6 6 6-6\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0 center' }}
                >
                  {['Professional','Funny','Storytelling','Inspirational','Educational'].map(s => (
                    <option key={s} value={s} className="bg-[#1a1a2e]">{s}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={() => onFreshDesignChange(!freshDesign)}
                className={`flex items-center gap-1.5 text-[10px] px-2.5 py-1.5 rounded-lg border transition ${freshDesign ? 'bg-[var(--accent)]/10 border-[var(--accent)]/30 text-[var(--accent)]' : 'bg-[var(--surface-2)] border-[var(--border)] text-[var(--text-muted)] hover:text-white'}`}
                title={freshDesign ? 'Will generate a new unique layout' : 'Will reuse your last layout style'}
              >
                <RefreshCw size={10} className={freshDesign ? 'animate-spin-slow' : ''} />
                {freshDesign ? 'Fresh' : 'My Style'}
              </button>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="px-5 pb-5 flex items-center justify-between">
            <button
              onClick={() => setIsQuickMode(false)}
              className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-white transition"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
              More options
            </button>
            <button
              onClick={onGenerate}
              disabled={!canQuickGenerate || isGenerating}
              className="px-5 py-2.5 bg-[var(--accent)] hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold rounded-xl transition flex items-center gap-2 text-sm shadow-lg shadow-[var(--accent)]/20"
            >
              {isGenerating ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Generating...
                </>
              ) : (
                <>
                  <Sparkles size={16} /> Generate Carousel
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ================================================================
     ADVANCED MODE — full controls for power users
     ================================================================ */
  const canGenerate = !!(docAttachment || aiPrompt.trim() || urlAttachment);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-6xl bg-[var(--surface-1)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="p-3 border-b border-[var(--border)] flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setIsQuickMode(true);
                setQuickInput(aiPrompt);
              }}
              className="text-xs text-[var(--text-muted)] hover:text-white transition"
            >
              &larr; Back
            </button>
            <div className="flex items-center gap-2 text-[var(--accent)]">
              <Sparkles size={18} />
              <h3 className="font-bold text-white text-base">Advanced Generation</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--text-muted)] hover:text-white transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 flex-1 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
            {/* Left Column: Input & Sources */}
            <div className="space-y-3 flex flex-col min-h-0">
              <SourceTabs active={aiInputTab} onChange={onInputTabChange} />

              {aiInputTab === 'prompt' && (
                <PromptTab value={aiPrompt} onChange={onPromptChange} />
              )}

              {aiInputTab === 'document' && (
                <DocumentTab
                  attachment={docAttachment}
                  onUpload={onDocUpload}
                  onClear={onClearDoc}
                  isUploading={isUploadingDoc}
                  error={docUploadError}
                  inputRef={docUploadInputRef}
                />
              )}

              {aiInputTab === 'url' && (
                <UrlTab
                  attachment={urlAttachment}
                  urlInput={urlInput}
                  onUrlInputChange={onUrlInputChange}
                  urlError={urlError}
                  onUrlErrorChange={onUrlErrorChange}
                  ownershipConfirmed={urlOwnershipConfirmed}
                  onOwnershipChange={onOwnershipChange}
                  onParse={onParseUrl}
                  isParsing={isParsingUrl}
                  onClear={onClearUrl}
                />
              )}

              <SourcesSummary
                activeTab={aiInputTab}
                prompt={aiPrompt}
                docAttachment={docAttachment}
                urlAttachment={urlAttachment}
              />

              {docUploadError && aiInputTab === 'prompt' && (
                <p className="text-xs text-red-400">{docUploadError}</p>
              )}
            </div>

            {/* Right Column: Settings */}
            <div className="space-y-3 flex flex-col min-h-0 overflow-y-auto">
              <SlideStylePicker value={aiSlideStyle} onChange={onSlideStyleChange} />

              <div className="grid grid-cols-2 gap-2 shrink-0">
                <SelectField
                  label="Writing Style"
                  value={aiWritingStyle}
                  onChange={onWritingStyleChange}
                  options={[
                    'Professional',
                    'Funny',
                    'Storytelling',
                    'Inspirational',
                    'Educational',
                  ]}
                />
                <SelectField
                  label="Language"
                  value={aiLanguage}
                  onChange={onLanguageChange}
                  options={Object.entries(LANG_MAP).map(([value, label]) => ({
                    value,
                    label,
                  }))}
                />
              </div>

              <RangeField
                label="Target slide count"
                min={3}
                max={100}
                step={1}
                value={aiSlideCount}
                onChange={onSlideCountChange}
              />
              <RangeField
                label="Words per slide"
                min={25}
                max={200}
                step={5}
                value={aiWordCount ?? 75}
                onChange={onWordCountChange}
                inputWidth="w-16"
              />

              <AdvancedOptions
                isOpen={isAdvancedOpen}
                onToggle={onAdvancedToggle}
                tone={aiTone}
                onToneChange={onToneChange}
                audience={aiAudience}
                onAudienceChange={onAudienceChange}
                goal={aiGoal}
                onGoalChange={onGoalChange}
                autoHashtags={aiAutoHashtags}
                onAutoHashtagsChange={onAutoHashtagsChange}
                includeStats={aiIncludeStats}
                onIncludeStatsChange={onIncludeStatsChange}
                accessibility={aiAccessibility}
                onAccessibilityChange={onAccessibilityChange}
                smartColors={aiSmartColors}
                onSmartColorsChange={onSmartColorsChange}
                freshDesign={freshDesign}
                onFreshDesignChange={onFreshDesignChange}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[var(--border)] flex justify-start gap-2 shrink-0">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-sm text-[var(--text-muted)] hover:text-white font-medium transition"
          >
            Cancel
          </button>
          <button
            onClick={onGenerate}
            disabled={!canGenerate || isGenerating}
            className="px-4 py-1.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold rounded-lg transition flex items-center gap-2 text-sm"
          >
            {isGenerating ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Generating...
              </>
            ) : (
              <>
                <Sparkles size={16} /> Generate Magic
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
});

/* ============================================================
   Sub-components (unchanged from original)
   ============================================================ */

type InputTab = 'prompt' | 'document' | 'url';

function SourceTabs({
  active,
  onChange,
}: {
  active: InputTab;
  onChange: (v: InputTab) => void;
}) {
  const tabs: { id: InputTab; icon: React.ReactNode; label: string }[] = [
    { id: 'prompt', icon: <Type size={16} />, label: 'Topic' },
    { id: 'document', icon: <FileText size={16} />, label: 'Document' },
    { id: 'url', icon: <Link2 size={16} />, label: 'URL' },
  ];
  return (
    <div className="flex gap-1 p-1 bg-[var(--surface-2)] rounded-xl shrink-0">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
            active === t.id
              ? 'bg-[var(--accent)] text-black'
              : 'text-[var(--text-muted)] hover:text-white hover:bg-[var(--surface-3)]'
          }`}
        >
          {t.icon}
          <span className="hidden sm:inline">{t.label}</span>
        </button>
      ))}
    </div>
  );
}

function PromptTab({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
        What&apos;s your carousel about?
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="e.g., 5 tips for better sleep, How to learn React in 2024..."
        className="w-full flex-1 min-h-[80px] bg-[var(--surface-2)] border border-[var(--border)] rounded-xl p-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] resize-none transition"
        autoFocus
      />
    </div>
  );
}

function DocumentTab({
  attachment,
  onUpload,
  onClear,
  isUploading,
  error,
  inputRef,
}: {
  attachment: DocAttachment | null;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
  isUploading: boolean;
  error: string | null;
  inputRef: React.RefObject<HTMLInputElement | null>;
}) {
  return (
    <div className="space-y-2 flex-1 flex flex-col min-h-0">
      <label className="block text-xs font-medium text-[var(--text-muted)]">
        Upload your document
      </label>
      <input
        ref={inputRef}
        type="file"
        accept=".md,.markdown,.docx,.txt,.pdf"
        className="hidden"
        onChange={onUpload}
      />
      {attachment ? (
        <AttachmentPreview
          name={attachment.name}
          wordCount={attachment.wordCount}
          truncated={attachment.truncated}
          sections={attachment.sections}
          onClear={onClear}
          icon={<FileText size={14} className="text-[var(--accent)] shrink-0" />}
        />
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full flex items-center justify-center gap-2 border border-dashed border-[var(--border)] rounded-lg px-3 py-2 text-xs text-[var(--text-secondary)] hover:text-white hover:border-[var(--border-hover)] transition"
        >
          {isUploading ? (
            <>
              <Loader2 size={14} className="animate-spin" /> Reading...
            </>
          ) : (
            <>
              <Paperclip size={14} /> Upload Document
            </>
          )}
        </button>
      )}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

function UrlTab({
  attachment,
  urlInput,
  onUrlInputChange,
  urlError,
  onUrlErrorChange,
  ownershipConfirmed,
  onOwnershipChange,
  onParse,
  isParsing,
  onClear,
}: {
  attachment: UrlAttachment | null;
  urlInput: string;
  onUrlInputChange: (v: string) => void;
  urlError: string | null;
  onUrlErrorChange: (v: string | null) => void;
  ownershipConfirmed: boolean;
  onOwnershipChange: (v: boolean) => void;
  onParse: () => void;
  isParsing: boolean;
  onClear: () => void;
}) {
  return (
    <div className="space-y-2 flex-1 flex flex-col min-h-0">
      <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-lg p-2 shrink-0">
        <div className="flex items-start gap-2">
          <RefreshCw size={14} className="text-purple-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-white text-xs">
              Repurpose Your Content
            </h4>
            <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
              Turn blog posts into engaging carousels
            </p>
          </div>
        </div>
      </div>

      {attachment ? (
        <AttachmentPreview
          name={attachment.title}
          subtitle={attachment.sourceDomain}
          wordCount={attachment.wordCount}
          truncated={attachment.truncated}
          sections={attachment.sections}
          onClear={onClear}
          icon={<Globe size={14} className="text-[var(--accent)] shrink-0" />}
        />
      ) : (
        <div className="flex-1 flex flex-col gap-2 min-h-0">
          <div className="shrink-0">
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">
              Paste your content URL
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => {
                  onUrlInputChange(e.target.value);
                  onUrlErrorChange(null);
                }}
                placeholder="https://yourblog.com/your-article"
                className="flex-1 bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition"
              />
              <button
                onClick={onParse}
                disabled={isParsing || !urlInput.trim() || !ownershipConfirmed}
                className="px-2.5 py-1.5 bg-[var(--surface-3)] hover:bg-[var(--surface-2)] disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition flex items-center gap-1.5 shrink-0"
              >
                {isParsing ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Download size={14} />
                )}
              </button>
            </div>
          </div>

          <label className="flex items-start gap-2 p-2 bg-[var(--surface-2)]/30 border border-[var(--border)] rounded-lg cursor-pointer hover:bg-[var(--surface-2)]/50 transition shrink-0">
            <input
              type="checkbox"
              checked={ownershipConfirmed}
              onChange={(e) => {
                onOwnershipChange(e.target.checked);
                onUrlErrorChange(null);
              }}
              className="mt-0.5 w-3.5 h-3.5 rounded border-gray-600 bg-gray-800 text-[var(--accent)] focus:ring-[var(--accent)] focus:ring-offset-0"
            />
            <span className="text-xs text-[var(--text-secondary)] font-medium flex items-center gap-1.5">
              <CheckCircle2
                size={12}
                className={
                  ownershipConfirmed ? 'text-green-400' : 'text-gray-500'
                }
              />
              This is my own content
            </span>
          </label>
        </div>
      )}
      {urlError && <p className="text-xs text-red-400">{urlError}</p>}
    </div>
  );
}

function AttachmentPreview({
  name,
  subtitle,
  wordCount,
  truncated,
  sections,
  onClear,
  icon,
}: {
  name: string;
  subtitle?: string;
  wordCount?: number;
  truncated?: boolean;
  sections?: string[];
  onClear: () => void;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-[var(--surface-2)]/60 border border-[var(--border)] rounded-lg p-2.5 space-y-2 flex-1 min-h-0 overflow-y-auto">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-white font-medium text-xs">
            {icon}
            <span className="truncate">{name}</span>
          </div>
          {subtitle && (
            <p className="text-[10px] text-gray-500 mt-0.5 truncate">
              {subtitle}
            </p>
          )}
          <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
            {wordCount ?? '\u2014'} words{truncated ? ' \u2022 trimmed' : ''}
          </p>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="text-[var(--text-muted)] hover:text-red-400 transition shrink-0"
          title="Remove"
        >
          <Trash size={14} />
        </button>
      </div>
      {sections && sections.length > 0 && (
        <div className="text-[10px] text-[var(--text-muted)] space-y-0.5 max-h-20 overflow-y-auto">
          <p className="font-semibold text-gray-300">Sections</p>
          <ul className="list-disc pl-3 space-y-0.5">
            {sections.slice(0, 4).map((s, i) => (
              <li key={i} className="truncate">
                {s}
              </li>
            ))}
            {sections.length > 4 && (
              <li>+ {sections.length - 4} more&hellip;</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

function SourcesSummary({
  activeTab,
  prompt,
  docAttachment,
  urlAttachment,
}: {
  activeTab: string;
  prompt: string;
  docAttachment: DocAttachment | null;
  urlAttachment: UrlAttachment | null;
}) {
  const showPrompt = activeTab !== 'prompt' && prompt.trim();
  const showDoc = activeTab !== 'document' && docAttachment;
  const showUrl = activeTab !== 'url' && urlAttachment;
  if (!showPrompt && !showDoc && !showUrl) return null;

  return (
    <div className="bg-[var(--surface-2)]/30 border border-[var(--border)] rounded-lg p-1.5 shrink-0">
      <div className="flex flex-wrap gap-1">
        {showPrompt && (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-[var(--surface-3)] rounded text-[10px] text-[var(--text-secondary)]">
            <Type size={10} /> Topic
          </span>
        )}
        {showDoc && (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-[var(--surface-3)] rounded text-[10px] text-[var(--text-secondary)] truncate max-w-[120px]">
            <FileText size={10} />{' '}
            <span className="truncate">{docAttachment!.name}</span>
          </span>
        )}
        {showUrl && (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-[var(--surface-3)] rounded text-[10px] text-[var(--text-secondary)] truncate max-w-[120px]">
            <Globe size={10} />{' '}
            <span className="truncate">{urlAttachment!.sourceDomain}</span>
          </span>
        )}
      </div>
    </div>
  );
}

type SlideStyle = 'text' | 'visual' | 'mixed';

function SlideStylePicker({
  value,
  onChange,
}: {
  value: SlideStyle;
  onChange: (v: SlideStyle) => void;
}) {
  return (
    <div className="shrink-0">
      <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">
        Slide Style
      </label>
      <div className="grid grid-cols-3 gap-1.5">
        <button
          onClick={() => onChange('text')}
          className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition ${
            value === 'text'
              ? 'border-[var(--accent)] bg-[var(--accent-subtle)]'
              : 'border-[var(--border)] bg-[var(--surface-2)] hover:border-[var(--border-hover)]'
          }`}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={
              value === 'text' ? 'text-[var(--accent)]' : 'text-gray-400'
            }
          >
            <path d="M4 7V4h16v3" />
            <path d="M9 20h6" />
            <path d="M12 4v16" />
          </svg>
          <span
            className={`text-[10px] font-medium ${value === 'text' ? 'text-[var(--accent)]' : 'text-[var(--text-secondary)]'}`}
          >
            Text
          </span>
        </button>
        <button
          disabled
          className="flex flex-col items-center gap-1 p-2 rounded-lg border border-[var(--border)] bg-[var(--surface-2)]/30 opacity-60 cursor-not-allowed"
          title="Coming Soon"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-gray-500"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="9" cy="9" r="2" />
            <path d="M21 15l-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
          </svg>
          <div className="text-center">
            <span className="text-[10px] font-medium text-gray-500">
              Graphics
            </span>
            <p className="text-[9px] text-gray-600 mt-0.5">Soon</p>
          </div>
        </button>
        <button
          disabled
          className="flex flex-col items-center gap-1 p-2 rounded-lg border border-[var(--border)] bg-[var(--surface-2)]/30 opacity-60 cursor-not-allowed"
          title="Coming Soon"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-gray-500"
          >
            <path d="M12 2v20M2 12h20" />
            <circle cx="12" cy="12" r="2" />
          </svg>
          <div className="text-center">
            <span className="text-[10px] font-medium text-gray-500">
              Mixed
            </span>
            <p className="text-[9px] text-gray-600 mt-0.5">Soon</p>
          </div>
        </button>
      </div>
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: (string | { value: string; label: string })[];
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none focus:border-[var(--accent)] transition"
      >
        {options.map((o) => {
          const val = typeof o === 'string' ? o : o.value;
          const lbl = typeof o === 'string' ? o : o.label;
          return (
            <option key={val} value={val}>
              {lbl}
            </option>
          );
        })}
      </select>
    </div>
  );
}

function RangeField({
  label,
  min,
  max,
  step,
  value,
  onChange,
  inputWidth = 'w-14',
}: {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number | null) => void;
  inputWidth?: string;
}) {
  return (
    <div className="shrink-0">
      <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value, 10))}
          className="flex-1"
          style={{ accentColor: 'var(--accent)' }}
        />
        <input
          type="number"
          min={min}
          max={max}
          value={value}
          onChange={(e) => {
            const v = parseInt(e.target.value, 10);
            if (Number.isNaN(v)) {
              onChange(null);
              return;
            }
            onChange(Math.min(max, Math.max(min, v)));
          }}
          className={`${inputWidth} bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-1.5 py-1 text-xs text-white text-center focus:outline-none focus:border-[var(--accent)] transition`}
        />
      </div>
    </div>
  );
}

function AdvancedOptions({
  isOpen,
  onToggle,
  tone,
  onToneChange,
  audience,
  onAudienceChange,
  goal,
  onGoalChange,
  autoHashtags,
  onAutoHashtagsChange,
  includeStats,
  onIncludeStatsChange,
  accessibility,
  onAccessibilityChange,
  smartColors,
  onSmartColorsChange,
  freshDesign,
  onFreshDesignChange,
}: {
  isOpen: boolean;
  onToggle: () => void;
  tone: string;
  onToneChange: (v: string) => void;
  audience: string;
  onAudienceChange: (v: string) => void;
  goal: string;
  onGoalChange: (v: string) => void;
  autoHashtags: boolean;
  onAutoHashtagsChange: (v: boolean) => void;
  includeStats: boolean;
  onIncludeStatsChange: (v: boolean) => void;
  accessibility: boolean;
  onAccessibilityChange: (v: boolean) => void;
  smartColors: boolean;
  onSmartColorsChange: (v: boolean) => void;
  freshDesign: boolean;
  onFreshDesignChange: (v: boolean) => void;
}) {
  const checkboxClass =
    'w-4 h-4 rounded border-gray-600 bg-gray-800 text-[var(--accent)] focus:ring-[var(--accent)] focus:ring-offset-0 cursor-pointer';

  return (
    <div className="shrink-0">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-2 rounded-lg border border-[var(--border)] bg-[var(--surface-2)]/30 hover:bg-[var(--surface-2)]/50 transition"
      >
        <span className="text-xs font-medium text-[var(--text-secondary)]">
          Advanced Options
        </span>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      {isOpen && (
        <div className="mt-2 space-y-2 border-t border-[var(--border)] pt-2">
          <div className="flex items-center justify-between gap-2">
            <label className="text-xs font-medium text-[var(--text-muted)] shrink-0">
              Audience
            </label>
            <select
              value={audience}
              onChange={(e) => onAudienceChange(e.target.value)}
              className="bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-[var(--accent)] transition flex-1 max-w-[180px]"
            >
              {AUDIENCE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value} className="bg-[#1a1a2e]">{o.label}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-[var(--text-muted)]">
              Goal (optional)
            </label>
            <input
              type="text"
              value={goal}
              onChange={(e) => onGoalChange(e.target.value)}
              placeholder="e.g. drive sign-ups, explain to investors"
              className="bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-2 py-1 text-xs text-white placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition"
            />
          </div>
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-[var(--text-muted)]">
              Tone
            </label>
            <select
              value={tone}
              onChange={(e) => onToneChange(e.target.value)}
              className="bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-[var(--accent)] transition"
            >
              {[
                'neutral',
                'formal',
                'casual',
                'friendly',
                'professional',
                'conversational',
                'authoritative',
              ].map((t) => (
                <option key={t} value={t}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            {[
              {
                label: 'Auto-hashtags',
                checked: autoHashtags,
                onChange: onAutoHashtagsChange,
              },
              {
                label: 'Include statistics',
                checked: includeStats,
                onChange: onIncludeStatsChange,
              },
              {
                label: 'Accessibility mode',
                checked: accessibility,
                onChange: onAccessibilityChange,
              },
              {
                label: 'Smart colors',
                checked: smartColors,
                onChange: onSmartColorsChange,
              },
              {
                label: 'Fresh design (new layout)',
                checked: freshDesign,
                onChange: onFreshDesignChange,
              },
            ].map((opt) => (
              <label
                key={opt.label}
                className="flex items-center justify-between cursor-pointer"
              >
                <span className="text-xs text-[var(--text-secondary)]">
                  {opt.label}
                </span>
                <input
                  type="checkbox"
                  checked={opt.checked}
                  onChange={(e) => opt.onChange(e.target.checked)}
                  className={checkboxClass}
                />
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
