"use client";

import React, { useState, useRef } from 'react';
import { 
  Layout, 
  Menu,
  Sparkles, 
  Palette, 
  Settings, 
  Plus, 
  Download, 
  ArrowRight, 
  MousePointer2, 
  Type, 
  Image as ImageIcon, 
  RefreshCw,
  ChevronLeft,
  MoreVertical,
  PanelRight,
  X,
  Loader2,
  BarChart3,
  LineChart,
  PieChart
} from 'lucide-react';
import Link from 'next/link';
import { Slide } from '@/components/Slide';
import { TextToolbar } from '@/components/TextToolbar';
import { THEMES, Theme } from '@/app/constants/themes';

// Types matching Slide.tsx
interface SlideData {
  id: string;
  type: 'cover' | 'content' | 'chart';
  title: string;
  subtitle?: string;
  content?: string;
  emoji?: string;
  category?: string;
  accentColor?: string;
  handle?: string;
  fontFamily?: string;
  backgroundColor?: string;
  textColor?: string;
  backgroundImage?: string;
  backgroundOverlayOpacity?: number;
  textAlign?: 'left' | 'center' | 'right';
  chartType?: 'bar' | 'line' | 'pie';
  chartData?: Array<{ name: string; value: number; }>;
}

export default function DashboardPage() {
  const [activeSlideId, setActiveSlideId] = useState<string>('1');
  const [isPropertiesPanelOpen, setIsPropertiesPanelOpen] = useState(true);
  const [isMobileSlidesOpen, setIsMobileSlidesOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [projectName, setProjectName] = useState('Untitled Project');
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState<'pdf' | 'ppt' | null>(null);
  const [aiPrompt, setAiPrompt] = useState('');
  const [activeTool, setActiveTool] = useState<'select' | 'text' | 'image'>('select');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [slides, setSlides] = useState<SlideData[]>([
    {
      id: '1',
      type: 'cover',
      title: 'THE SECRET SAUCE',
      subtitle: 'How to create viral carousels in minutes.',
      category: 'UNDER THE HOOD',
      accentColor: '#ffd700',
      handle: '@slidecraft',
      fontFamily: 'var(--font-inter)',
      backgroundColor: '#0B0F19',
      textColor: '#ffffff'
    },
    {
      id: '2',
      type: 'content',
      title: 'Hook Your Audience',
      content: '<p>Stop the scroll with a <strong>bold promise</strong> or a challenging question.</p>',
      emoji: '🪝',
      category: 'UNDER THE HOOD',
      accentColor: '#ffd700',
      handle: '@slidecraft',
      fontFamily: 'var(--font-inter)',
      backgroundColor: '#0B0F19',
      textColor: '#ffffff'
    },
    {
        id: '3',
        type: 'content',
        title: 'Tell a Story',
        content: '<p>Facts tell, but <em>stories sell</em>. Connect emotionally.</p>',
        emoji: '📖',
        category: 'UNDER THE HOOD',
        accentColor: '#ffd700',
        handle: '@slidecraft',
        fontFamily: 'var(--font-inter)',
        backgroundColor: '#0B0F19',
        textColor: '#ffffff'
      }
  ]);

  const activeSlide = slides.find(s => s.id === activeSlideId) || slides[0];
  const activeSlideIndex = Math.max(0, slides.findIndex(s => s.id === activeSlideId));

  const goToSlideByIndex = (index: number) => {
    const target = slides[index];
    if (target) {
      setActiveSlideId(target.id);
    }
  };

  const addNewSlide = () => {
    const newId = Date.now().toString();
    setSlides([...slides, {
      id: newId,
      type: 'content',
      title: 'New Slide',
      content: '<p>Edit this content...</p>',
      emoji: '✨',
      category: 'UNDER THE HOOD',
      accentColor: slides[0]?.accentColor || '#ffd700',
      handle: slides[0]?.handle || '@slidecraft',
      fontFamily: slides[0]?.fontFamily || 'var(--font-inter)',
      backgroundColor: slides[0]?.backgroundColor || '#0B0F19',
      textColor: slides[0]?.textColor || '#ffffff'
    }]);
    setActiveSlideId(newId);
  };

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) return;
    
    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: aiPrompt }),
      });
      
      const data = await response.json();
      
      if (data.slides && Array.isArray(data.slides)) {
        setSlides(data.slides);
        if (data.slides.length > 0) {
          setActiveSlideId(data.slides[0].id);
        }
        setIsAiModalOpen(false);
      }
    } catch (error) {
      console.error('Failed to generate slides:', error);
      // You might want to show a toast error here
    } finally {
      setIsGenerating(false);
    }
  };

  const handleToolClick = (tool: 'select' | 'text' | 'image') => {
    setActiveTool(tool);
    if (tool === 'image') {
        fileInputRef.current?.click();
        // Reset to select after triggering file dialog, or keep as image to allow multiple? 
        // Usually better to reset or stay. Let's stay for now, but triggering click is one-off.
        setTimeout(() => setActiveTool('select'), 500); 
    } else if (tool === 'text') {
        // For text, we append a new paragraph to content
        const newContent = (activeSlide.content || '') + '<p>New text block</p>';
        setSlides(slides.map(s => s.id === activeSlide.id ? { ...s, content: newContent } : s));
        setActiveTool('select'); // Reset to select so they can edit it
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            const result = event.target?.result as string;
            // Apply background image to ALL slides
            setSlides(slides.map(s => ({ ...s, backgroundImage: result })));
        };
        reader.readAsDataURL(file);
    }
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleExport = async (format: 'pdf' | 'ppt') => {
    setIsExporting(format);
    try {
      // Optimize payload: If all slides have the same background image, move it to options
      // and remove from individual slides to save bandwidth/limit
      const globalBackgroundImage = slides[0]?.backgroundImage;
      const allSlidesHaveSameBg = slides.every(s => s.backgroundImage === globalBackgroundImage);
      
      const slidesPayload = allSlidesHaveSameBg 
        ? slides.map(({ backgroundImage, ...rest }) => rest) // Remove bg from slides
        : slides;

      const response = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          slides: slidesPayload, 
          format,
          options: {
            category: slides[0]?.category,
            handle: slides[0]?.handle,
            accentColor: slides[0]?.accentColor,
            fontFamily: slides[0]?.fontFamily,
            backgroundColor: slides[0]?.backgroundColor,
            textColor: slides[0]?.textColor,
            // Pass global background if applicable
            backgroundImage: allSlidesHaveSameBg ? globalBackgroundImage : undefined,
            backgroundOverlayOpacity: slides[0]?.backgroundOverlayOpacity
          }
        }),
      });

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `slidecraft-export.${format === 'ppt' ? 'pptx' : 'pdf'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      setIsExportOpen(false);
    } catch (error) {
      console.error('Export failed:', error);
      // Show error toast here
    } finally {
      setIsExporting(null);
    }
  };

  const renderPropertiesPanelContent = () => (
    <>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Properties</h3>
        <button onClick={() => setIsPropertiesPanelOpen(false)} className="text-gray-500 hover:text-white transition">
          <X size={16} />
        </button>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-xs text-gray-400">Title</label>
          <input
            type="text"
            value={activeSlide.title}
            onChange={(e) => {
              const newTitle = e.target.value;
              setSlides(slides.map(s => s.id === activeSlide.id ? { ...s, title: newTitle } : s));
            }}
            className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#ffd700] transition"
          />
        </div>

        {activeSlide.type === 'cover' && (
          <div className="space-y-2">
            <label className="text-xs text-gray-400">Subtitle</label>
            <textarea
              value={activeSlide.subtitle || ''}
              onChange={(e) => {
                const newSubtitle = e.target.value;
                setSlides(slides.map(s => s.id === activeSlide.id ? { ...s, subtitle: newSubtitle } : s));
              }}
              className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#ffd700] transition resize-none h-24"
            />
          </div>
        )}

        {activeSlide.type === 'content' && (
          <div className="space-y-2">
            <label className="text-xs text-gray-400">Content (HTML)</label>
            <textarea
              value={activeSlide.content || ''}
              onChange={(e) => {
                const newContent = e.target.value;
                setSlides(slides.map(s => s.id === activeSlide.id ? { ...s, content: newContent } : s));
              }}
              className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#ffd700] transition resize-none h-32 font-mono"
            />
          </div>
        )}

        <div className="space-y-2">
          <label className="text-xs text-gray-400">Handle / Tag</label>
          <input
            type="text"
            value={activeSlide.handle || ''}
            onChange={(e) => {
              const newHandle = e.target.value;
              setSlides(slides.map(s => ({ ...s, handle: newHandle }))); // Update all slides
            }}
            placeholder="@yourhandle"
            className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#ffd700] transition"
          />
          <p className="text-[10px] text-gray-500">Updates across all slides</p>
        </div>

        <div className="space-y-2">
          <label className="text-xs text-gray-400">Category / Series Tag</label>
          <input
            type="text"
            value={activeSlide.category || ''}
            onChange={(e) => {
              const newCategory = e.target.value;
              setSlides(slides.map(s => ({ ...s, category: newCategory }))); // Update all slides
            }}
            placeholder="UNDER THE HOOD"
            className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#ffd700] transition"
          />
          <p className="text-[10px] text-gray-500">Updates across all slides</p>
        </div>

        <div className="pt-4 border-t border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400">Type</span>
          </div>
          <div className="flex bg-gray-900 rounded-lg p-1 gap-1">
            <button
              onClick={() => setSlides(slides.map(s => s.id === activeSlide.id ? { ...s, type: 'cover' } : s))}
              className={`flex-1 px-2 py-1.5 text-xs rounded-md transition flex items-center justify-center gap-1 ${activeSlide.type === 'cover' ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'}`}
              title="Cover Slide"
            >
              <Layout size={14} /> Cover
            </button>
            <button
              onClick={() => setSlides(slides.map(s => s.id === activeSlide.id ? { ...s, type: 'content' } : s))}
              className={`flex-1 px-2 py-1.5 text-xs rounded-md transition flex items-center justify-center gap-1 ${activeSlide.type === 'content' ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'}`}
              title="Content Slide"
            >
              <Type size={14} /> Content
            </button>
            <button
              onClick={() => setSlides(slides.map(s => s.id === activeSlide.id ? {
                ...s,
                type: 'chart',
                chartType: 'bar',
                chartData: [
                  { name: 'A', value: 40 },
                  { name: 'B', value: 30 },
                  { name: 'C', value: 20 },
                  { name: 'D', value: 27 },
                ]
              } : s))}
              className={`flex-1 px-2 py-1.5 text-xs rounded-md transition flex items-center justify-center gap-1 ${activeSlide.type === 'chart' ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'}`}
              title="Chart Slide"
            >
              <BarChart3 size={14} /> Chart
            </button>
          </div>
        </div>

        {activeSlide.type === 'chart' && (
          <div className="space-y-4 pt-4 border-t border-gray-700 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="space-y-2">
              <label className="text-xs text-gray-400">Chart Type</label>
              <div className="flex bg-gray-900 rounded-lg p-1 gap-1">
                <button
                  onClick={() => setSlides(slides.map(s => s.id === activeSlide.id ? { ...s, chartType: 'bar' } : s))}
                  className={`flex-1 p-1.5 rounded transition flex justify-center ${activeSlide.chartType === 'bar' ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                >
                  <BarChart3 size={16} />
                </button>
                <button
                  onClick={() => setSlides(slides.map(s => s.id === activeSlide.id ? { ...s, chartType: 'line' } : s))}
                  className={`flex-1 p-1.5 rounded transition flex justify-center ${activeSlide.chartType === 'line' ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                >
                  <LineChart size={16} />
                </button>
                <button
                  onClick={() => setSlides(slides.map(s => s.id === activeSlide.id ? { ...s, chartType: 'pie' } : s))}
                  className={`flex-1 p-1.5 rounded transition flex justify-center ${activeSlide.chartType === 'pie' ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                >
                  <PieChart size={16} />
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs text-gray-400">Data Points</label>
                <button
                  onClick={() => {
                    const newData = [...(activeSlide.chartData || [])];
                    newData.push({ name: 'New', value: 50 });
                    setSlides(slides.map(s => s.id === activeSlide.id ? { ...s, chartData: newData } : s));
                  }}
                  className="text-[10px] bg-gray-700 hover:bg-gray-600 text-white px-2 py-0.5 rounded"
                >
                  + Add
                </button>
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {activeSlide.chartData?.map((point, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={point.name}
                      onChange={(e) => {
                        const newData = [...(activeSlide.chartData || [])];
                        newData[idx].name = e.target.value;
                        setSlides(slides.map(s => s.id === activeSlide.id ? { ...s, chartData: newData } : s));
                      }}
                      className="w-1/3 bg-gray-900/50 border border-gray-700 rounded px-2 py-1 text-xs text-white focus:border-[#ffd700] outline-none"
                      placeholder="Label"
                    />
                    <input
                      type="number"
                      value={point.value}
                      onChange={(e) => {
                        const newData = [...(activeSlide.chartData || [])];
                        newData[idx].value = parseInt(e.target.value) || 0;
                        setSlides(slides.map(s => s.id === activeSlide.id ? { ...s, chartData: newData } : s));
                      }}
                      className="w-1/3 bg-gray-900/50 border border-gray-700 rounded px-2 py-1 text-xs text-white focus:border-[#ffd700] outline-none"
                      placeholder="Value"
                    />
                    <button
                      onClick={() => {
                        const newData = [...(activeSlide.chartData || [])].filter((_, i) => i !== idx);
                        setSlides(slides.map(s => s.id === activeSlide.id ? { ...s, chartData: newData } : s));
                      }}
                      className="text-gray-500 hover:text-red-400"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white font-sans flex flex-col lg:h-screen lg:overflow-hidden">
      <TextToolbar />
      {/* Header */}
      <header className="h-14 border-b border-gray-800 bg-[#0f1117] flex items-center px-4 justify-between shrink-0 z-20">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-gray-400 hover:text-white transition">
            <ChevronLeft size={20} />
          </Link>
          <div className="flex items-center gap-2">
             <div className="w-6 h-6 bg-[#ffd700] rounded-md rotate-3 flex items-center justify-center">
                <span className="text-black font-bold text-xs">S</span>
             </div>
             <span className="font-bold tracking-tight text-sm sm:text-base truncate max-w-[150px] sm:max-w-none">
                SlideCraft / {projectName}
             </span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
             <button
                onClick={() => setIsMobileSidebarOpen(true)}
                className="p-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition flex items-center justify-center lg:hidden"
             >
                <Menu size={24} />
             </button>
             <button 
                onClick={() => setIsPropertiesPanelOpen(!isPropertiesPanelOpen)}
                className={`p-2 rounded-lg transition ${isPropertiesPanelOpen ? 'text-[#ffd700] bg-[#ffd700]/10' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
                title="Toggle Properties Panel"
             >
                <PanelRight size={20} />
             </button>
             <div className="w-px h-6 bg-gray-800 mx-1"></div>
             <button 
                onClick={() => setIsAiModalOpen(true)}
                className="px-3 py-1.5 text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition flex items-center gap-2"
             >
                <Sparkles size={16} /> AI Generate
             </button>
             <button 
                onClick={() => setIsExportOpen(true)}
                className="px-4 py-1.5 bg-[#ffd700] hover:bg-yellow-400 text-black text-sm font-bold rounded-lg transition flex items-center gap-2"
             >
                Export <Download size={16} />
             </button>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Navigation */}
        <div className="hidden md:flex w-16 border-r border-gray-800 flex-col items-center py-6 gap-6 bg-[#0f1117] shrink-0 z-10">
            <button 
                onClick={() => setIsTemplatesOpen(true)}
                className="w-10 h-10 bg-[#ffd700]/10 text-[#ffd700] rounded-xl flex items-center justify-center border border-[#ffd700]/20 shadow-[0_0_15px_rgba(255,215,0,0.1)] cursor-pointer hover:bg-[#ffd700]/20 transition"
                title="Templates"
            >
                <Layout size={20} />
            </button>
            <button 
                onClick={() => setIsAiModalOpen(true)}
                className="w-10 h-10 text-gray-500 hover:text-gray-300 hover:bg-gray-800 rounded-xl flex items-center justify-center transition cursor-pointer"
                title="AI Generate"
            >
                <Sparkles size={20} />
            </button>
            <button 
                onClick={() => setIsSettingsOpen(true)}
                className="w-10 h-10 text-gray-500 hover:text-gray-300 hover:bg-gray-800 rounded-xl flex items-center justify-center transition cursor-pointer"
                title="Theme"
            >
                <Palette size={20} />
            </button>
            <button 
                onClick={() => setIsSettingsOpen(true)}
                className="mt-auto w-10 h-10 text-gray-500 hover:text-gray-300 hover:bg-gray-800 rounded-xl flex items-center justify-center transition cursor-pointer"
                title="Settings"
            >
                <Settings size={20} />
            </button>
        </div>

        {/* Slide List */}
        <div className="hidden lg:flex w-72 border-r border-gray-800 bg-[#0f1117] flex-col shrink-0">
            <div className="p-4 border-b border-gray-800 flex justify-between items-center">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Slides ({slides.length})</span>
                <button 
                    onClick={addNewSlide}
                    className="w-6 h-6 bg-gray-800 hover:bg-gray-700 rounded flex items-center justify-center text-gray-400 hover:text-white transition"
                >
                    <Plus size={14} />
                </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {slides.map((slide, index) => (
                    <div 
                        key={slide.id} 
                        onClick={() => setActiveSlideId(slide.id)}
                        className={`group cursor-pointer rounded-xl transition-all duration-200 border ${activeSlideId === slide.id ? 'bg-gray-800/50 border-[#ffd700]/50 shadow-lg' : 'border-transparent hover:bg-gray-800/30 hover:border-gray-700'}`}
                    >
                        <div className="p-3">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-xs font-medium text-gray-400">Slide {index + 1}</span>
                                {activeSlideId === slide.id && <div className="w-1.5 h-1.5 bg-[#ffd700] rounded-full shadow-[0_0_5px_#ffd700]"></div>}
                            </div>
                            {/* Mini Preview */}
                            <div className="aspect-[4/5] bg-gray-900 rounded-lg border border-gray-700/50 relative overflow-hidden group-hover:border-gray-600 transition flex items-center justify-center">
                                <div className="transform scale-[0.15] origin-center pointer-events-none">
                                    <Slide {...slide} />
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 relative bg-[#0B0F19] flex flex-col overflow-hidden">
            {/* Grid Background */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
                    style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
            </div>

            {/* Toolbar */}
            <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-gray-800/90 backdrop-blur-md border border-gray-700/50 p-1.5 rounded-full flex items-center gap-1 shadow-2xl z-20">
                <div 
                    onClick={() => handleToolClick('select')}
                    className={`w-9 h-9 flex items-center justify-center rounded-full cursor-pointer shadow-lg transition ${activeTool === 'select' ? 'bg-[#ffd700] text-black' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}
                    title="Select / Edit"
                >
                    <MousePointer2 size={16} />
                </div>
                <div 
                    onClick={() => handleToolClick('text')}
                    className={`w-9 h-9 flex items-center justify-center rounded-full cursor-pointer transition ${activeTool === 'text' ? 'bg-[#ffd700] text-black' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}
                    title="Add Text Block"
                >
                    <Type size={16} />
                </div>
                <div 
                    onClick={() => handleToolClick('image')}
                    className={`w-9 h-9 flex items-center justify-center rounded-full cursor-pointer transition ${activeTool === 'image' ? 'bg-[#ffd700] text-black' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}
                    title="Set Background Image"
                >
                    <ImageIcon size={16} />
                </div>
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleImageUpload}
                />
            </div>

            {/* Main Viewport */}
            <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
                <div className="relative shadow-2xl rounded-none ring-1 ring-white/10 transform scale-[0.25] sm:scale-[0.35] md:scale-[0.45] lg:scale-[0.5] xl:scale-[0.6] transition-transform duration-300 origin-center">
                     <div className="w-[1080px] h-[1080px] bg-white relative overflow-hidden">
                        <Slide 
                            {...activeSlide} 
                            isEditable={true}
                            onUpdate={(field, value) => {
                                setSlides(slides.map(s => s.id === activeSlide.id ? { ...s, [field]: value } : s));
                            }}
                        />
                     </div>
                </div>
            </div>

            {/* Mobile Slide Navigation */}
            <div className="lg:hidden px-4 pb-5 flex items-center gap-3 justify-between z-20">
                <button
                    onClick={() => goToSlideByIndex(activeSlideIndex - 1)}
                    disabled={activeSlideIndex <= 0}
                    className="w-12 h-12 rounded-2xl border border-gray-800 bg-gray-900/60 flex items-center justify-center text-gray-200 transition disabled:opacity-30 disabled:cursor-not-allowed"
                    aria-label="Previous slide"
                >
                    <ChevronLeft size={20} />
                </button>
                <button
                    onClick={() => setIsMobileSlidesOpen(true)}
                    className="flex-1 px-4 py-3 rounded-2xl border border-gray-800 bg-gray-900/80 text-sm font-medium text-gray-200 flex flex-col items-center justify-center gap-1 shadow-lg"
                >
                    <span className="text-xs uppercase tracking-wider text-gray-500">Current Slide</span>
                    <span className="text-base font-semibold text-white">#{activeSlideIndex + 1} / {slides.length}</span>
                </button>
                <button
                    onClick={() => goToSlideByIndex(activeSlideIndex + 1)}
                    disabled={activeSlideIndex >= slides.length - 1}
                    className="w-12 h-12 rounded-2xl border border-gray-800 bg-gray-900/60 flex items-center justify-center text-gray-200 transition disabled:opacity-30 disabled:cursor-not-allowed"
                    aria-label="Next slide"
                >
                    <ChevronLeft size={20} className="rotate-180" />
                </button>
            </div>
            
            {/* Properties Panel */}
            {isPropertiesPanelOpen && (
                <>
                    <div className="absolute right-6 top-6 bottom-6 w-80 bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 overflow-y-auto hidden xl:block animate-in slide-in-from-right duration-300">
                        {renderPropertiesPanelContent()}
                    </div>
                    <div className="fixed inset-0 z-40 flex xl:hidden">
                        <button
                            className="absolute inset-0 bg-black/70"
                            onClick={() => setIsPropertiesPanelOpen(false)}
                        />
                        <div className="relative z-10 w-full max-w-md ml-auto h-full bg-[#0f1117] border-l border-gray-800 rounded-l-3xl p-6 overflow-y-auto shadow-2xl animate-in slide-in-from-right duration-300">
                            {renderPropertiesPanelContent()}
                        </div>
                    </div>
                </>
            )}

        </div>
      </div>
      
      {/* Export Modal */}
      {isExportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-[#0f1117] border border-gray-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-800 flex justify-between items-center">
              <h3 className="font-bold text-white text-lg">Export Carousel</h3>
              <button 
                onClick={() => setIsExportOpen(false)}
                className="text-gray-400 hover:text-white transition"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <p className="text-gray-400 text-sm">Choose your preferred format:</p>
              
              <button
                onClick={() => handleExport('pdf')}
                disabled={!!isExporting}
                className="w-full flex items-center justify-between p-4 bg-gray-900/50 hover:bg-gray-800 border border-gray-700 hover:border-gray-600 rounded-xl transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center text-red-500 group-hover:scale-110 transition">
                    <Download size={20} />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-white">Export as PDF</div>
                    <div className="text-xs text-gray-500">Best for LinkedIn & Printing</div>
                  </div>
                </div>
                {isExporting === 'pdf' ? <Loader2 size={18} className="animate-spin text-gray-500" /> : <ChevronLeft size={18} className="rotate-180 text-gray-500 group-hover:translate-x-1 transition" />}
              </button>

              <button
                onClick={() => handleExport('ppt')}
                disabled={!!isExporting}
                className="w-full flex items-center justify-between p-4 bg-gray-900/50 hover:bg-gray-800 border border-gray-700 hover:border-gray-600 rounded-xl transition group"
              >
                 <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center text-orange-500 group-hover:scale-110 transition">
                    <Layout size={20} />
                  </div>
                  <div className="text-left">
                    <div className="font-bold text-white">Export as PowerPoint</div>
                    <div className="text-xs text-gray-500">Editable PPTX Slides</div>
                  </div>
                </div>
                {isExporting === 'ppt' ? <Loader2 size={18} className="animate-spin text-gray-500" /> : <ChevronLeft size={18} className="rotate-180 text-gray-500 group-hover:translate-x-1 transition" />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-4xl bg-[#0f1117] border border-gray-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 my-8">
            <div className="p-6 border-b border-gray-800 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Settings size={20} className="text-gray-400" />
                <h3 className="font-bold text-white text-lg">General Settings</h3>
              </div>
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="text-gray-400 hover:text-white transition"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[70vh] overflow-y-auto">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400">Project Name</label>
                <input 
                  type="text" 
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#ffd700] transition"
                  placeholder="Untitled Project"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400">Author Handle</label>
                <input 
                  type="text" 
                  value={slides[0]?.handle || ''}
                  onChange={(e) => {
                    const newHandle = e.target.value;
                    setSlides(slides.map(s => ({ ...s, handle: newHandle })));
                  }}
                  className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#ffd700] transition"
                  placeholder="@handle"
                />
                <p className="text-xs text-gray-500">Applies to all slides</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400">Category / Series</label>
                <input 
                  type="text" 
                  value={slides[0]?.category || ''}
                  onChange={(e) => {
                    const newCategory = e.target.value;
                    setSlides(slides.map(s => ({ ...s, category: newCategory })));
                  }}
                  className="w-full bg-gray-900/50 border border-gray-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#ffd700] transition"
                  placeholder="Category"
                />
                <p className="text-xs text-gray-500">Applies to all slides</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400">Font Family</label>
                <div className="grid grid-cols-2 gap-2">
                    {[
                        { name: 'Inter', value: 'var(--font-inter)' },
                        { name: 'Playfair', value: 'var(--font-playfair)' },
                        { name: 'Oswald', value: 'var(--font-oswald)' },
                        { name: 'Roboto Mono', value: 'var(--font-roboto-mono)' }
                    ].map(font => (
                        <button
                            key={font.name}
                            onClick={() => setSlides(slides.map(s => ({ ...s, fontFamily: font.value })))}
                            className={`px-3 py-2 rounded-lg text-sm border transition ${slides[0]?.fontFamily === font.value ? 'border-[#ffd700] bg-[#ffd700]/10 text-[#ffd700]' : 'border-gray-700 hover:border-gray-500 text-gray-300'}`}
                            style={{ fontFamily: font.value }}
                        >
                            {font.name}
                        </button>
                    ))}
                </div>
              </div>

              <div className="space-y-4">
                   <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-400">Colors</label>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs text-gray-500">Background</label>
                                <div className="flex items-center gap-2">
                                    <div className="relative w-full h-8">
                                        <input 
                                            type="color"
                                            value={slides[0]?.backgroundColor || '#0B0F19'}
                                            onChange={(e) => setSlides(slides.map(s => ({ ...s, backgroundColor: e.target.value })))}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        />
                                        <div 
                                            className="w-full h-full rounded-lg border border-gray-700 flex items-center justify-center"
                                            style={{ backgroundColor: slides[0]?.backgroundColor || '#0B0F19' }}
                                        >
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-gray-500">Text</label>
                                <div className="flex items-center gap-2">
                                    <div className="relative w-full h-8">
                                        <input 
                                            type="color"
                                            value={slides[0]?.textColor || '#ffffff'}
                                            onChange={(e) => setSlides(slides.map(s => ({ ...s, textColor: e.target.value })))}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        />
                                        <div 
                                            className="w-full h-full rounded-lg border border-gray-700 flex items-center justify-center"
                                            style={{ backgroundColor: slides[0]?.textColor || '#ffffff' }}
                                        >
                                            <span className="text-xs font-bold mix-blend-difference text-white">Aa</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                             <div className="space-y-1">
                                <label className="text-xs text-gray-500">Accent</label>
                                <div className="flex items-center gap-2">
                                    <div className="relative w-full h-8">
                                        <input 
                                            type="color"
                                            value={slides[0]?.accentColor || '#ffd700'}
                                            onChange={(e) => setSlides(slides.map(s => ({ ...s, accentColor: e.target.value })))}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        />
                                        <div 
                                            className="w-full h-full rounded-lg border border-gray-700 flex items-center justify-center"
                                            style={{ backgroundColor: slides[0]?.accentColor || '#ffd700' }}
                                        >
                                            <Palette size={14} className="text-black mix-blend-difference" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                   </div>

                   <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-400">Accent Presets</label>
                    <div className="flex gap-2 items-center">
                    {['#ffd700', '#ff4d4d', '#4dff4d', '#4da6ff', '#ff4dff'].map(color => (
                        <button
                            key={color}
                            onClick={() => setSlides(slides.map(s => ({ ...s, accentColor: color })))}
                            className={`w-8 h-8 rounded-full border-2 transition ${slides[0]?.accentColor === color ? 'border-white scale-110' : 'border-transparent hover:scale-105'}`}
                            style={{ backgroundColor: color }}
                        />
                    ))}
                </div>
                <p className="text-xs text-gray-500">Applies to all slides</p>
              </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-800 flex justify-end gap-3">
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="px-6 py-2.5 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="px-6 py-2.5 bg-[#ffd700] hover:bg-yellow-400 text-black font-bold rounded-xl transition"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Slides Drawer */}
      {isMobileSlidesOpen && (
        <div className="fixed inset-0 z-50 flex items-end lg:hidden">
          <button
            className="absolute inset-0 bg-black/70"
            onClick={() => setIsMobileSlidesOpen(false)}
          />
          <div className="relative z-10 w-full bg-[#0f1117] border-t border-gray-800 rounded-t-3xl p-4 max-h-[80vh]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-gray-400">
                <Layout size={18} />
                <span className="text-sm font-bold uppercase tracking-wider">Slides ({slides.length})</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={addNewSlide}
                  className="w-8 h-8 bg-gray-800 hover:bg-gray-700 rounded-full flex items-center justify-center text-gray-300 transition"
                >
                  <Plus size={16} />
                </button>
                <button
                  onClick={() => setIsMobileSlidesOpen(false)}
                  className="w-8 h-8 bg-gray-800 hover:bg-gray-700 rounded-full flex items-center justify-center text-gray-300 transition"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
            <div className="space-y-3 overflow-y-auto pr-2" style={{ maxHeight: '60vh' }}>
              {slides.map((slide, index) => (
                <div
                  key={slide.id}
                  onClick={() => {
                    setActiveSlideId(slide.id);
                    setIsMobileSlidesOpen(false);
                  }}
                  className={`group cursor-pointer rounded-xl transition-all duration-200 border ${activeSlideId === slide.id ? 'bg-gray-800/60 border-[#ffd700]/50 shadow-lg' : 'border-transparent hover:bg-gray-800/40 hover:border-gray-700'}`}
                >
                  <div className="p-3 flex items-center gap-3">
                    <div className="text-xs font-medium text-gray-400 w-12">#{index + 1}</div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-white truncate">{slide.title}</div>
                      <div className="text-xs text-gray-500">{slide.type === 'cover' ? 'Cover slide' : 'Content slide'}</div>
                    </div>
                    <div className="w-16 h-16 bg-gray-900 rounded-lg border border-gray-700/50 overflow-hidden flex items-center justify-center">
                      <div className="transform scale-[0.12] origin-center pointer-events-none">
                        <Slide {...slide} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <button
            className="absolute inset-0 bg-black/70"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
          <div className="relative z-10 w-64 bg-[#0f1117] border-r border-gray-800 h-full p-5 flex flex-col gap-4 shadow-2xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Tools
              </span>
              <button
                onClick={() => setIsMobileSidebarOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-gray-300 transition"
              >
                <X size={16} />
              </button>
            </div>
            <button
              onClick={() => {
                setIsTemplatesOpen(true);
                setIsMobileSidebarOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-[#ffd700]/10 text-[#ffd700] border border-[#ffd700]/30 hover:bg-[#ffd700]/20 transition"
            >
              <Layout size={18} />
              Templates
            </button>
            <button
              onClick={() => {
                setIsAiModalOpen(true);
                setIsMobileSidebarOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-gray-800 text-gray-200 border border-gray-700 hover:border-gray-600 transition"
            >
              <Sparkles size={18} />
              AI Generate
            </button>
            <button
              onClick={() => {
                setIsSettingsOpen(true);
                setIsMobileSidebarOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-gray-800 text-gray-200 border border-gray-700 hover:border-gray-600 transition"
            >
              <Palette size={18} />
              Theme & Settings
            </button>
            <button
              onClick={() => {
                setIsMobileSlidesOpen(true);
                setIsMobileSidebarOpen(false);
              }}
              className="mt-auto px-4 py-3 rounded-2xl bg-gray-900 text-white border border-gray-700 hover:bg-gray-800 transition flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <Layout size={18} />
                Slides ({slides.length})
              </div>
              <ChevronLeft size={16} className="rotate-180" />
            </button>
          </div>
        </div>
      )}

      {/* Templates Modal */}
      {isTemplatesOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-6xl bg-[#0f1117] border border-gray-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col h-[70vh]">
            <div className="p-6 border-b border-gray-800 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <Layout size={20} className="text-[#ffd700]" />
                <h3 className="font-bold text-white text-lg">Theme Gallery</h3>
              </div>
              <button 
                onClick={() => setIsTemplatesOpen(false)}
                className="text-gray-400 hover:text-white transition"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {THEMES.map((theme) => (
                    <div 
                        key={theme.id}
                        onClick={() => {
                            // Apply theme to all slides
                            setSlides(slides.map(s => ({
                                ...s,
                                backgroundColor: theme.backgroundColor,
                                textColor: theme.textColor,
                                accentColor: theme.accentColor,
                                fontFamily: theme.fontFamily
                            })));
                            setIsTemplatesOpen(false);
                        }}
                        className="group cursor-pointer relative bg-gray-900 rounded-xl overflow-hidden border border-gray-800 hover:border-[#ffd700] transition-all hover:shadow-xl hover:scale-[1.02]"
                    >
                        <div className="aspect-[4/3] p-6 flex flex-col justify-center items-center gap-4" style={{ backgroundColor: theme.backgroundColor }}>
                            <div className="text-center space-y-2">
                                <div className="text-2xl font-bold" style={{ color: theme.textColor, fontFamily: theme.fontFamily }}>
                                    {theme.name}
                                </div>
                                <div className="text-sm opacity-80" style={{ color: theme.textColor, fontFamily: theme.fontFamily }}>
                                    Make it <span style={{ color: theme.accentColor, fontWeight: 'bold' }}>pop</span>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                {theme.previewColors.map((color, i) => (
                                    <div key={i} className="w-6 h-6 rounded-full border border-white/20 shadow-sm" style={{ backgroundColor: color }}></div>
                                ))}
                            </div>
                        </div>
                        <div className="p-3 bg-gray-900 border-t border-gray-800 flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-300">{theme.name}</span>
                            <span className="text-xs text-[#ffd700] opacity-0 group-hover:opacity-100 transition">Apply Theme →</span>
                        </div>
                    </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* AI Modal */}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-[#0f1117] border border-gray-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-800 flex justify-between items-center">
              <div className="flex items-center gap-2 text-[#ffd700]">
                <Sparkles size={20} />
                <h3 className="font-bold text-white text-lg">Generate with AI</h3>
              </div>
              <button 
                onClick={() => setIsAiModalOpen(false)}
                className="text-gray-400 hover:text-white transition"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  What's your carousel about?
                </label>
                <textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="e.g., 5 tips for better sleep, How to learn React in 2024..."
                  className="w-full h-32 bg-gray-900/50 border border-gray-700 rounded-xl p-4 text-white placeholder-gray-600 focus:outline-none focus:border-[#ffd700] focus:ring-1 focus:ring-[#ffd700] resize-none transition"
                  autoFocus
                />
              </div>
              
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setIsAiModalOpen(false)}
                  className="px-4 py-2 text-gray-400 hover:text-white font-medium transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAiGenerate}
                  disabled={!aiPrompt.trim() || isGenerating}
                  className="px-6 py-2 bg-[#ffd700] hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold rounded-xl transition flex items-center gap-2"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} />
                      Generate Magic
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

