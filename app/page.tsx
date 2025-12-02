'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Sparkles, Zap, Layout, Download, ArrowRight, Settings, Type, Image as ImageIcon, Palette, MousePointer2, RefreshCw, Menu, X } from 'lucide-react';

const numberFormatter = new Intl.NumberFormat('en-US');

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [metrics, setMetrics] = useState<{ todayCreations: number; totalCreations: number } | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [metricsError, setMetricsError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const fetchMetrics = async () => {
      try {
        const response = await fetch('/api/metrics');
        if (!response.ok) throw new Error('Failed to fetch metrics');
        const data = await response.json();
        if (!cancelled) {
          setMetrics(data);
        }
      } catch (error) {
        if (!cancelled) {
          setMetricsError(true);
          console.error('Metrics GET failed:', error);
        }
      } finally {
        if (!cancelled) {
          setMetricsLoading(false);
        }
      }
    };

    fetchMetrics();
    return () => {
      cancelled = true;
    };
  }, []);

  const renderMetricValue = (value: number | null) => {
    if (metricsLoading) return '—';
    if (metricsError) return 'N/A';
    return numberFormatter.format(value ?? 0);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans selection:bg-[#ffd700] selection:text-black">
      {/* Navbar */}
      <nav className="max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#ffd700] rounded-lg rotate-3 flex items-center justify-center">
             <span className="text-black font-bold text-xl">S</span>
          </div>
          <span className="text-xl font-bold tracking-tight">SlideCraft</span>
        </div>
        <div className="flex items-center gap-3">
          <Link 
            href="/dashboard" 
            className="hidden sm:inline-flex px-5 py-2.5 bg-[#ffd700] hover:bg-yellow-400 text-black text-sm font-bold rounded-xl transition transform hover:scale-105 hover:shadow-lg items-center gap-2"
          >
            Let's Cook <ArrowRight size={16} />
          </Link>
          <button
            aria-label="Toggle navigation"
            onClick={() => setMobileMenuOpen(prev => !prev)}
            className="sm:hidden p-2 rounded-lg bg-gray-800/60 border border-gray-700 hover:bg-gray-800 transition"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden max-w-7xl mx-auto px-6 pb-4 animate-in fade-in">
          <div className="bg-gray-800/60 border border-gray-700 rounded-2xl p-4 space-y-3">
            <Link 
              href="/dashboard" 
              className="w-full flex justify-between items-center px-4 py-3 bg-[#ffd700] text-black font-bold rounded-xl"
              onClick={() => setMobileMenuOpen(false)}
            >
              Let's Cook <ArrowRight size={18} />
            </Link>
            <a 
              href="#how-it-works" 
              className="block px-4 py-3 rounded-xl border border-gray-700 text-gray-200 hover:bg-gray-800"
              onClick={() => setMobileMenuOpen(false)}
            >
              See How It Works
            </a>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 pt-20 pb-32 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-sm font-medium mb-8 animate-fade-in">
          <Sparkles size={14} />
          <span>AI-Powered Carousel Generator</span>
        </div>
        
        <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight mb-8 leading-tight max-w-4xl mx-auto">
          Turn Any Idea into <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ffd700] to-orange-400 relative">
            Multi-Platform Carousels
            <svg className="absolute w-full h-3 -bottom-1 left-0 text-[#ffd700] opacity-50" viewBox="0 0 200 9" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2.00025 6.99997C25.5002 3.99999 77.5 0.499964 197.5 2.49999" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/></svg>
          </span>
        </h1>
        
        <p className="text-base sm:text-lg lg:text-xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed">
          Create scroll-stopping carousels for LinkedIn, Instagram, X, pitch decks, newsletters—anywhere you publish. No design skills needed—just paste your content, customize, and export.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link 
            href="/dashboard" 
            className="px-6 py-3 text-sm bg-[#ffd700] hover:bg-yellow-400 text-black sm:text-base font-bold rounded-xl transition transform hover:scale-105 hover:shadow-lg flex items-center gap-2 sm:px-8 sm:py-4"
          >
            Let's Cook <ArrowRight size={20} />
          </Link>
          <a 
            href="#how-it-works" 
            className="px-6 py-3 text-sm bg-gray-800 hover:bg-gray-700 text-white sm:text-base font-medium rounded-xl border border-gray-700 transition sm:px-8 sm:py-4"
          >
            See How It Works
          </a>
        </div>


      {/* Hero Visual */}
      <div className="mt-20 relative max-w-6xl mx-auto z-10">
        <div className="absolute -inset-1 bg-gradient-to-r from-[#ffd700] via-orange-500 to-purple-600 rounded-2xl opacity-20 blur-2xl animate-pulse"></div>
        
            <div className="relative bg-[#0f1117] border border-gray-800 rounded-xl shadow-2xl overflow-hidden">
            {/* Mock Window Header */}
            <div className="h-12 border-b border-gray-800 bg-[#0f1117] flex items-center px-4 justify-between">
                <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50"></div>
                </div>
                <div className="px-4 py-1.5 bg-gray-800/50 rounded-md text-xs text-gray-400 flex items-center gap-2 w-80 border border-gray-700/50">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    slidecraft.new/untitled-project
                </div>
                <div className="w-16"></div>
            </div>

            {/* App Interface */}
            <div className="flex h-[460px] sm:h-[600px] bg-[#0B0F19]">
                {/* Left Sidebar */}
                <div className="w-16 border-r border-gray-800 flex flex-col items-center py-6 gap-6 bg-[#0f1117]">
                    <div className="w-10 h-10 bg-[#ffd700]/10 text-[#ffd700] rounded-xl flex items-center justify-center border border-[#ffd700]/20 shadow-[0_0_15px_rgba(255,215,0,0.1)]">
                        <Layout size={20} />
                    </div>
                    <div className="w-10 h-10 text-gray-500 hover:text-gray-300 hover:bg-gray-800 rounded-xl flex items-center justify-center transition cursor-pointer">
                        <Sparkles size={20} />
                    </div>
                    <div className="w-10 h-10 text-gray-500 hover:text-gray-300 hover:bg-gray-800 rounded-xl flex items-center justify-center transition cursor-pointer">
                        <Palette size={20} />
                    </div>
                    <div className="mt-auto w-10 h-10 text-gray-500 hover:text-gray-300 hover:bg-gray-800 rounded-xl flex items-center justify-center transition cursor-pointer">
                        <Settings size={20} />
                    </div>
                </div>

                {/* Slide List */}
                <div className="w-72 border-r border-gray-800 bg-[#0f1117] hidden md:flex flex-col">
                    <div className="p-4 border-b border-gray-800 flex justify-between items-center">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Slides (5)</span>
                        <div className="w-6 h-6 bg-gray-800 rounded flex items-center justify-center text-gray-400 cursor-pointer hover:text-white">+</div>
                    </div>
                    <div className="p-4 space-y-4 overflow-y-auto">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className={`group cursor-pointer rounded-xl transition-all duration-300 ${i === 1 ? 'bg-gray-800/50 ring-1 ring-[#ffd700]/50 shadow-lg' : 'hover:bg-gray-800/30 opacity-60 hover:opacity-100'}`}>
                                <div className="p-3">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-xs font-medium text-gray-400">Slide {i}</span>
                                        {i === 1 && <div className="w-1.5 h-1.5 bg-[#ffd700] rounded-full shadow-[0_0_5px_#ffd700]"></div>}
                                    </div>
                                    <div className="aspect-[4/5] bg-gray-900 rounded-lg border border-gray-700/50 relative overflow-hidden group-hover:border-gray-600 transition">
                                        <div className="absolute inset-3 flex flex-col gap-2">
                                            <div className="w-3/4 h-2 bg-gray-700/50 rounded-full"></div>
                                            <div className="w-1/2 h-2 bg-gray-700/50 rounded-full"></div>
                                            <div className="mt-auto w-full h-16 bg-gray-800/50 rounded-md border border-gray-700/30"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Main Canvas */}
                <div className="flex-1 relative flex items-center justify-center bg-[#0B0F19] overflow-hidden">
                    {/* Grid Background */}
                    <div className="absolute inset-0 opacity-[0.03]" 
                         style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
                    </div>

                    {/* Floating Toolbar */}
                    <div className="absolute top-6 bg-gray-800/80 backdrop-blur-md border border-gray-700/50 p-1.5 rounded-full flex items-center gap-1 shadow-2xl z-20 transform -translate-y-2 opacity-0 animate-fade-in-down" style={{ animationDelay: '0.5s', animationFillMode: 'forwards' }}>
                        <div className="w-8 h-8 flex items-center justify-center bg-[#ffd700] text-black rounded-full cursor-pointer shadow-lg"><MousePointer2 size={14} /></div>
                        <div className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 rounded-full cursor-pointer transition"><Type size={14} /></div>
                        <div className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 rounded-full cursor-pointer transition"><ImageIcon size={14} /></div>
                    </div>
                    
                    {/* Active Slide */}
                    <div className="relative w-[280px] sm:w-[380px] aspect-[4/5] bg-white rounded-2xl shadow-2xl transform transition-all duration-500 hover:scale-[1.02] group z-10">
                        <div className="absolute inset-0 bg-gradient-to-br from-white to-gray-100 rounded-2xl overflow-hidden border-4 border-transparent group-hover:border-[#ffd700]/20 transition-all">
                            <div className="h-full p-6 sm:p-10 flex flex-col relative">
                                {/* Design Elements */}
                                <div className="absolute top-0 right-0 w-32 h-32 bg-[#ffd700]/10 rounded-bl-full -mr-8 -mt-8"></div>
                                
                                <div className="relative z-10">
                                    <div className="w-14 h-14 bg-[#ffd700] rounded-2xl flex items-center justify-center text-3xl shadow-lg shadow-[#ffd700]/30 mb-8 rotate-3 group-hover:rotate-6 transition-transform duration-300">
                                        🚀
                                    </div>
                                    
                                    <h2 className="text-4xl md:text-5xl font-black text-gray-900 leading-[0.9] mb-6 tracking-tight">
                                        THE <br/>
                                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ffd700] to-orange-500">SECRET</span> <br/>
                                        SAUCE
                                    </h2>
                                    
                                    <div className="space-y-4">
                                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-3">
                                            <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-xs font-bold">✓</div>
                                            <span className="font-bold text-gray-600">Hook your audience</span>
                                        </div>
                                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-3">
                                            <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-xs font-bold">✓</div>
                                            <span className="font-bold text-gray-600">Tell a story</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-auto flex items-center justify-between pt-8 border-t border-gray-100">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center text-white font-bold text-xs border-2 border-white shadow-md">S</div>
                                        <span className="text-sm font-bold text-gray-400">@slidecraft</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-xs font-black text-gray-900 uppercase tracking-wider bg-[#ffd700] px-3 py-1 rounded-full">
                                        Swipe <ArrowRight size={12} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Context Menu Mockup */}
                    <div className="absolute right-20 bottom-32 bg-gray-800 border border-gray-700 rounded-lg p-1 shadow-2xl w-48 opacity-0 animate-scale-in origin-top-left" style={{ animationDelay: '1s', animationFillMode: 'forwards' }}>
                        <div className="px-3 py-2 text-xs font-medium text-gray-400 border-b border-gray-700 mb-1">Slide Actions</div>
                        <div className="flex items-center gap-2 px-3 py-2 hover:bg-gray-700 rounded cursor-pointer text-sm text-gray-200">
                            <RefreshCw size={14} /> Regenerate Content
                        </div>
                        <div className="flex items-center gap-2 px-3 py-2 hover:bg-gray-700 rounded cursor-pointer text-sm text-gray-200">
                            <Download size={14} /> Export as PDF
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        {/* Floating Badges */}
        <div className="absolute -top-6 -right-6 bg-[#ffd700] text-black px-6 py-3 rounded-xl shadow-xl transform rotate-6 animate-float border-4 border-[#0B0F19] z-30 flex items-center gap-3">
            <div className="bg-black/10 p-1.5 rounded-lg">
                <Zap size={20} className="text-black" />
            </div>
            <div>
                <div className="text-xs font-bold uppercase opacity-60">Speed</div>
                <div className="font-black text-lg leading-none">Instant</div>
            </div>
        </div>
      </div>
      </main>

      {/* Features Grid */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-6 py-24 border-t border-gray-800">
        <div className="text-center mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">Everything You Need</h2>
            <p className="text-base sm:text-lg text-gray-400 max-w-2xl mx-auto">Packed with powerful features to help you create engaging content faster.</p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gray-800/50 p-8 rounded-2xl border border-gray-700 hover:border-[#ffd700]/50 transition group">
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center text-blue-400 mb-6 group-hover:scale-110 transition">
                    <Zap size={24} />
                </div>
                <h3 className="text-lg md:text-xl font-bold mb-3">Lightning Fast</h3>
                <p className="text-sm sm:text-base text-gray-400 leading-relaxed">
                    Stop wasting hours on design tools. Input your text and let our engine generate beautiful slides instantly.
                </p>
            </div>
            <div className="bg-gray-800/50 p-8 rounded-2xl border border-gray-700 hover:border-[#ffd700]/50 transition group">
                <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center text-purple-400 mb-6 group-hover:scale-110 transition">
                    <Sparkles size={24} />
                </div>
                <h3 className="text-lg md:text-xl font-bold mb-3">AI Writing Partner</h3>
                <p className="text-sm sm:text-base text-gray-400 leading-relaxed">
                    Stuck on ideas? Use our built-in AI to expand topics into full educational carousels.
                </p>
            </div>
            <div className="bg-gray-800/50 p-8 rounded-2xl border border-gray-700 hover:border-[#ffd700]/50 transition group">
                <div className="w-12 h-12 bg-[#ffd700]/20 rounded-xl flex items-center justify-center text-[#ffd700] mb-6 group-hover:scale-110 transition">
                    <Layout size={24} />
                </div>
                <h3 className="text-lg md:text-xl font-bold mb-3">Fully Customizable</h3>
                <p className="text-sm sm:text-base text-gray-400 leading-relaxed">
                    Brand your slides. Change colors, fonts, and layout to match your personal brand identity.
                </p>
            </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6">
         <div className="max-w-4xl mx-auto bg-gradient-to-r from-gray-800 to-gray-900 rounded-3xl p-8 sm:p-12 border border-gray-700 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-[#ffd700]"></div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">Ready to go viral?</h2>
            <p className="text-base sm:text-lg lg:text-xl text-gray-400 mb-8 max-w-xl mx-auto">Join thousands of creators using SlideCraft to stand out on LinkedIn, Instagram, X, and every other platform.</p>
            <Link 
                href="/dashboard" 
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#ffd700] hover:bg-yellow-400 text-black text-sm sm:text-base lg:text-lg font-bold rounded-xl transition transform hover:scale-105 sm:px-8 sm:py-4"
            >
                Start Creating for Free <ArrowRight size={18} />
            </Link>
         </div>
      </section>

      {/* Simple Footer */}
      <footer className="border-t border-gray-800 py-12 text-center text-gray-500">
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="w-8 h-8 bg-[#ffd700] rounded-lg rotate-3 flex items-center justify-center">
            <span className="text-black font-bold text-xl">S</span>
          </div>
          <span className="text-xl font-bold text-white tracking-tight">SlideCraft</span>
        </div>
        
        <div className="mb-8 flex justify-center gap-3 sm:gap-4">
          <div className="bg-gray-800/40 border border-gray-700 rounded-2xl px-5 py-3 flex flex-col items-center min-w-[100px] sm:min-w-[120px]">
            <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Creations Today</span>
            <span className="text-xl sm:text-2xl font-black text-[#ffd700] leading-none mt-1">
              {renderMetricValue(metrics?.todayCreations ?? null)}
            </span>
          </div>
          <div className="bg-gray-800/40 border border-gray-700 rounded-2xl px-5 py-3 flex flex-col items-center min-w-[100px] sm:min-w-[120px]">
            <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Total Creations</span>
            <span className="text-xl sm:text-2xl font-black text-[#ffd700] leading-none mt-1">
              {renderMetricValue(metrics?.totalCreations ?? null)}
            </span>
          </div>
        </div>

        <p>&copy; {new Date().getFullYear()} SlideCraft. All rights reserved.</p>
      </footer>

    </div>
  );
}
