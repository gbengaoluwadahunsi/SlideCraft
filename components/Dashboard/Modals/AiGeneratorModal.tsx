'use client';

import React from 'react';
import { 
  X, Sparkles, Wand2, Plus, Layout, 
  Type, MessageSquare, Globe, Hash, 
  BarChart3, Accessibility, Palette, 
  History, Users, Target, ChevronDown, 
  ChevronUp, Loader2, Upload, Link as LinkIcon,
  MousePointer2, Settings2, Trash2, CheckCircle2, AlertCircle
} from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';

interface AiGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  aiGenerator: any; // Using any for brevity in this refactor pass, but should be typed
}

export const AiGeneratorModal: React.FC<AiGeneratorModalProps> = ({
  isOpen,
  onClose,
  aiGenerator
}) => {
  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-1rem)] max-w-3xl max-h-[90vh] overflow-y-auto bg-[var(--surface-1)] border border-[var(--border-hover)] rounded-2xl shadow-2xl z-[101] outline-none">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-[var(--border-hover)] bg-[var(--surface-2)]/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)]">
                  <Sparkles size={24} />
                </div>
                <div>
                  <Dialog.Title className="text-xl font-bold text-white">Create a Carousel</Dialog.Title>
                  <p className="text-sm text-[var(--text-muted)]">Start with an idea, document, or link.</p>
                </div>
              </div>
              <Dialog.Close className="p-2 hover:bg-[var(--surface-3)] rounded-lg transition-colors text-[var(--text-secondary)] hover:text-white">
                <X size={20} />
              </Dialog.Close>
            </div>

            <div className="p-6 space-y-8">
              {/* Input Sections */}
              <div className="space-y-4">
                <div className="flex bg-[var(--surface-2)] p-1 rounded-xl">
                  {(['prompt', 'document', 'url'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => aiGenerator.setAiInputTab(tab)}
                      className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${
                        aiGenerator.aiInputTab === tab 
                          ? 'bg-[var(--surface-3)] text-white shadow-sm ring-1 ring-white/10' 
                          : 'text-[var(--text-muted)] hover:text-white'
                      }`}
                    >
                      {tab === 'prompt' && <MessageSquare size={16} />}
                      {tab === 'document' && <Upload size={16} />}
                      {tab === 'url' && <LinkIcon size={16} />}
                      {tab === 'prompt' ? 'Type an idea' : tab === 'document' ? 'Upload file' : 'Paste link'}
                    </button>
                  ))}
                </div>

                {/* Tab Contents */}
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                  {aiGenerator.aiInputTab === 'prompt' && (
                    <div className="space-y-3">
                      <div className="relative">
                        <textarea
                          placeholder="Example: Turn my blog post about remote work into a LinkedIn carousel"
                          value={aiGenerator.aiPrompt}
                          onChange={(e) => aiGenerator.setAiPrompt(e.target.value)}
                          className="w-full bg-[var(--surface-2)] border border-[var(--border-hover)] rounded-xl px-4 py-4 text-white focus:outline-none focus:border-[var(--accent)] transition min-h-[150px] resize-none pr-12"
                        />
                        <div className="absolute bottom-4 right-4 text-[var(--text-muted)]">
                          <Wand2 size={20} className="animate-pulse text-[var(--accent)]" />
                        </div>
                      </div>
                    </div>
                  )}

                  {aiGenerator.aiInputTab === 'document' && (
                    <div className="space-y-4">
                      {aiGenerator.docAttachment ? (
                        <div className="bg-[var(--accent-subtle)]/5 border border-[var(--accent)]/30 rounded-xl p-4 flex items-center justify-between">
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div className="w-10 h-10 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)] flex-shrink-0">
                              <CheckCircle2 size={20} />
                            </div>
                            <div className="overflow-hidden">
                              <p className="text-sm font-medium text-white truncate">{aiGenerator.docAttachment.name}</p>
                              <p className="text-xs text-[var(--text-muted)]">Ready to turn into slides</p>
                            </div>
                          </div>
                          <button 
                            onClick={() => aiGenerator.setDocAttachment(null)}
                            className="p-2 text-[var(--text-muted)] hover:text-red-400 transition"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      ) : (
                        <div 
                          className="border-2 border-dashed border-[var(--border-hover)] rounded-xl p-10 flex flex-col items-center justify-center gap-4 hover:border-[var(--accent)]/50 transition bg-[var(--surface-2)]/30 cursor-pointer group"
                          onClick={() => document.getElementById('ai-doc-upload')?.click()}
                        >
                          <div className="w-16 h-16 rounded-full bg-[var(--surface-3)] flex items-center justify-center text-[var(--text-muted)] group-hover:text-[var(--accent)] group-hover:bg-[var(--accent)]/10 transition-all">
                            {aiGenerator.isUploadingDoc ? <Loader2 size={32} className="animate-spin" /> : <Upload size={32} />}
                          </div>
                          <div className="text-center">
                            <p className="text-white font-medium">Upload your content</p>
                            <p className="text-xs text-[var(--text-muted)] mt-1">PDF, DOCX, TXT or Markdown (Max 10MB)</p>
                          </div>
                          <input 
                            id="ai-doc-upload" 
                            type="file" 
                            className="hidden" 
                            accept=".pdf,.docx,.doc,.txt,.md"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                aiGenerator.handleDocUpload(file);
                                e.currentTarget.value = '';
                              }
                            }}
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {aiGenerator.aiInputTab === 'url' && (
                    <div className="space-y-4">
                      <div className="flex gap-2">
                        <input
                          type="url"
                          placeholder="Paste an article, blog post, or page link"
                          value={aiGenerator.urlInput}
                          onChange={(e) => aiGenerator.setUrlInput(e.target.value)}
                          className="flex-1 bg-[var(--surface-2)] border border-[var(--border-hover)] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[var(--accent)] transition"
                        />
                        <button
                          onClick={() => aiGenerator.handleParseUrl(aiGenerator.urlInput)}
                          disabled={aiGenerator.isParsingUrl || !aiGenerator.urlInput}
                          className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-black font-bold px-6 py-3 rounded-xl transition flex items-center gap-2 disabled:opacity-50"
                        >
                          {aiGenerator.isParsingUrl ? <Loader2 size={18} className="animate-spin" /> : 'Use Link'}
                        </button>
                      </div>
                      
                      {aiGenerator.urlAttachment && (
                        <div className="bg-[var(--accent-subtle)]/5 border border-[var(--accent)]/30 rounded-xl p-4 flex items-center justify-between">
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div className="w-10 h-10 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center text-[var(--accent)] flex-shrink-0">
                              <Globe size={20} />
                            </div>
                            <div className="overflow-hidden">
                              <p className="text-sm font-medium text-white truncate">{aiGenerator.urlAttachment.title}</p>
                              <p className="text-xs text-[var(--text-muted)] truncate">{aiGenerator.urlAttachment.sourceDomain}</p>
                            </div>
                          </div>
                          <button 
                            onClick={() => aiGenerator.setUrlAttachment(null)}
                            className="p-2 text-[var(--text-muted)] hover:text-red-400 transition"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">
                      Where will this be used?
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['Auto', 'LinkedIn', 'Instagram', 'Sales Deck', 'Education'] as const).map((platform) => (
                        <button
                          key={platform}
                          onClick={() => aiGenerator.setAiPlatformTarget(platform)}
                          className={`rounded-lg border px-3 py-2 text-left text-xs font-bold transition ${
                            aiGenerator.aiPlatformTarget === platform
                              ? 'border-white bg-white text-black'
                              : 'border-[var(--border-hover)] bg-[var(--surface-2)] text-white hover:border-white'
                          }`}
                        >
                          {platform}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">
                      What kind of carousel?
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {(['General Carousel', 'Educational', 'Sales', 'Tips/Listicle', 'Founder LinkedIn', 'Authority LinkedIn'] as const).map((preset) => (
                        <button
                          key={preset}
                          onClick={() => aiGenerator.applyPreset(preset)}
                          className={`rounded-lg border px-3 py-2 text-left text-xs font-bold transition ${
                            aiGenerator.aiOutputPreset === preset
                              ? 'border-[var(--accent)] bg-[var(--accent)] text-black'
                              : 'border-[var(--border-hover)] bg-[var(--surface-2)] text-white hover:border-[var(--accent)] hover:text-[var(--accent)]'
                          }`}
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Optional Toggle */}
              <div className="pt-2 border-t border-[var(--border-hover)]/30">
                <button
                  onClick={() => aiGenerator.setIsAdvancedOptionsOpen(!aiGenerator.isAdvancedOptionsOpen)}
                  className="flex items-center gap-2 text-sm font-bold text-[var(--accent)] hover:text-[var(--accent-hover)] transition group"
                >
                  {aiGenerator.isAdvancedOptionsOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  More options
                </button>

                {aiGenerator.isAdvancedOptionsOpen && (
                  <div className="mt-6 space-y-6 animate-in slide-in-from-top-2 duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      <div className="space-y-3">
                        <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-2">
                          <Layout size={14} /> Number of slides
                        </label>
                        <div className="grid grid-cols-4 gap-2">
                          {[4, 6, 8, 10].map((count) => (
                            <button
                              key={count}
                              onClick={() => aiGenerator.setAiSlideCount(count)}
                              className={`py-2 px-1 text-sm font-medium rounded-lg border transition ${
                                aiGenerator.aiSlideCount === count 
                                  ? 'bg-[var(--accent)] border-[var(--accent)] text-black' 
                                  : 'bg-[var(--surface-2)] border-[var(--border-hover)] text-white hover:border-[var(--accent)]'
                              }`}
                            >
                              {count}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-2">
                          <Palette size={14} /> Layout
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {(['mixed', 'visual', 'text'] as const).map((style) => (
                            <button
                              key={style}
                              onClick={() => aiGenerator.setAiSlideStyle(style)}
                              className={`py-2 px-1 text-xs font-medium rounded-lg border capitalize transition ${
                                aiGenerator.aiSlideStyle === style 
                                  ? 'bg-[var(--accent)] border-[var(--accent)] text-black' 
                                  : 'bg-[var(--surface-2)] border-[var(--border-hover)] text-white hover:border-[var(--accent)]'
                              }`}
                            >
                              {style === 'mixed' ? 'Balanced' : style === 'visual' ? 'Visual' : 'Text'}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-2">
                          <Globe size={14} /> Language
                        </label>
                        <select
                          value={aiGenerator.aiLanguage}
                          onChange={(e) => aiGenerator.setAiLanguage(e.target.value)}
                          className="w-full bg-[var(--surface-2)] border border-[var(--border-hover)] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[var(--accent)] transition h-[42px]"
                        >
                          <option value="en">English</option>
                          <option value="es">Spanish</option>
                          <option value="fr">French</option>
                          <option value="de">German</option>
                          <option value="hi">Hindi</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <div className="space-y-3">
                        <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-2">
                          <History size={14} /> Tone
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {['Professional', 'Engaging', 'Simple', 'Storytelling'].map((style) => (
                            <button
                              key={style}
                              onClick={() => aiGenerator.setAiWritingStyle(style === 'Simple' ? 'Direct' : style)}
                              className={`py-2.5 px-3 text-xs font-medium rounded-lg border text-left transition ${
                                aiGenerator.aiWritingStyle === (style === 'Simple' ? 'Direct' : style) 
                                  ? 'bg-[var(--accent)] border-[var(--accent)] text-black' 
                                  : 'bg-[var(--surface-2)] border-[var(--border-hover)] text-white hover:border-[var(--accent)]'
                              }`}
                            >
                              {style}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-2">
                          <Users size={14} /> Who is this for?
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. founders, students, marketers"
                          value={aiGenerator.aiAudience}
                          onChange={(e) => aiGenerator.setAiAudience(e.target.value)}
                          className="w-full bg-[var(--surface-2)] border border-[var(--border-hover)] rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-[var(--accent)] transition"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      {/* AI Switches */}
                      <div className="space-y-4 bg-[var(--surface-2)]/30 p-5 rounded-2xl border border-[var(--border-hover)]/50">
                        <h4 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest mb-4">Extra help</h4>
                        <div className="grid grid-cols-1 gap-4">
                          {[
                            { id: 'smartColors', label: 'Use my brand colors', icon: Palette },
                            { id: 'freshDesign', label: 'Try a fresh design', icon: Sparkles },
                            { id: 'includeStats', label: 'Add useful numbers', icon: BarChart3 },
                            { id: 'autoHashtags', label: 'Add hashtags', icon: Hash }
                          ].map((item) => (
                            <div key={item.id} className="flex items-center justify-between group">
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition ${
                                  aiGenerator[`ai${item.id.charAt(0).toUpperCase() + item.id.slice(1)}`] 
                                    ? 'bg-[var(--accent)]/10 text-[var(--accent)]' 
                                    : 'bg-[var(--surface-3)] text-[var(--text-muted)]'
                                }`}>
                                  <item.icon size={16} />
                                </div>
                                <span className="text-sm font-medium text-[var(--text-secondary)] group-hover:text-white transition">{item.label}</span>
                              </div>
                              <button
                                onClick={() => aiGenerator[`setAi${item.id.charAt(0).toUpperCase() + item.id.slice(1)}`](!aiGenerator[`ai${item.id.charAt(0).toUpperCase() + item.id.slice(1)}`])}
                                className={`relative w-11 h-6 rounded-full transition-all ${
                                  aiGenerator[`ai${item.id.charAt(0).toUpperCase() + item.id.slice(1)}`] ? 'bg-[var(--accent)]' : 'bg-[var(--surface-3)]'
                                }`}
                              >
                                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
                                  aiGenerator[`ai${item.id.charAt(0).toUpperCase() + item.id.slice(1)}`] ? 'translate-x-6' : 'translate-x-1'
                                }`} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-[var(--border-hover)] bg-[var(--surface-2)]/50 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="space-y-2 text-xs text-[var(--text-muted)]">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5"><CheckCircle2 size={12} className="text-green-400" /> Editable slides</span>
                  <span className="flex items-center gap-1.5"><MousePointer2 size={12} className="text-blue-400" /> Download ready</span>
                </div>
                {(aiGenerator.isGenerating || aiGenerator.generationStatus || aiGenerator.generationError) && (
                  <div className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${
                    aiGenerator.generationError
                      ? 'border-red-500/30 bg-red-500/10 text-red-200'
                      : 'border-[var(--accent)]/30 bg-[var(--accent)]/10 text-[var(--text-secondary)]'
                  }`}>
                    {aiGenerator.isGenerating && <Loader2 size={14} className="animate-spin text-[var(--accent)]" />}
                    <span>{aiGenerator.generationError || aiGenerator.generationStatus || 'Creating your carousel. This usually takes about a minute.'}</span>
                    {aiGenerator.generationError && (
                      <button
                        onClick={aiGenerator.retryLastGeneration}
                        className="ml-2 rounded-md bg-white px-2 py-1 text-[11px] font-black text-black"
                      >
                        Try again
                      </button>
                    )}
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-4 w-full md:w-auto">
                <button
                  onClick={onClose}
                  className="flex-1 md:flex-none px-6 py-3 rounded-xl text-sm font-bold text-white hover:bg-[var(--surface-3)] transition border border-[var(--border-hover)]"
                >
                  Cancel
                </button>
                <button
                  onClick={aiGenerator.handleGenerateCarousel}
                  disabled={aiGenerator.isGenerating || (!aiGenerator.aiPrompt && !aiGenerator.docAttachment && !aiGenerator.urlAttachment)}
                  className="flex-[2] md:flex-none bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-black font-extrabold px-10 py-3 rounded-xl transition flex items-center justify-center gap-3 shadow-[0_4px_20px_rgba(var(--accent-rgb),0.3)] disabled:opacity-50 disabled:shadow-none min-w-[200px]"
                >
                  {aiGenerator.isGenerating ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Wand2 size={20} />
                      Create Carousel
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
