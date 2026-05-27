'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { ArrowRight, Check, Download, Layers, MessageSquareText, PenLine, Sparkles } from 'lucide-react';

const platformOptions = ['General', 'Instagram', 'LinkedIn', 'Sales', 'Education'];

export default function LandingPageClient() {
  const { data: session } = useSession();

  const startHref = session ? '/dashboard' : '/register';

  return (
    <div className="min-h-screen bg-[#080B14] text-white">
      <header className="border-b border-white/10 bg-[#080B14]/95">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#ffd700] text-lg font-black text-black">C</div>
            <span className="text-lg font-black tracking-tight">Carouslk</span>
          </Link>
          <nav className="flex items-center gap-2">
            <Link href={session ? '/dashboard' : '/login'} className="rounded-lg px-3 py-2 text-sm font-semibold text-gray-300 hover:text-white">
              {session ? 'Dashboard' : 'Login'}
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="mx-auto grid max-w-7xl gap-8 px-5 py-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:py-14">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-gray-300">
              <Sparkles size={14} className="text-[#ffd700]" />
              AI-assisted drafts you can edit
            </div>
            <h1 className="max-w-3xl text-4xl font-black leading-[1.03] tracking-tight sm:text-5xl lg:text-[4.75rem]">
              Turn ideas, articles, and notes into editable carousel drafts.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-gray-300">
              Choose the platform, paste your material, get a structured first draft, then edit the slides before download.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                href={startHref}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#ffd700] px-5 py-3 text-sm font-black text-black hover:bg-yellow-400"
              >
                Create a carousel <ArrowRight size={18} />
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap gap-2">
              {platformOptions.map(option => (
                <span key={option} className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-bold text-gray-300">
                  {option}
                </span>
              ))}
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0D1320] p-4 shadow-2xl">
            <div className="rounded-xl border border-white/10 bg-[#080B14] p-4">
              <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <p className="text-sm font-black">Create carousel</p>
                  <p className="mt-1 text-xs text-gray-400">Paste your idea, article, or notes.</p>
                </div>
                <div className="rounded-lg bg-[#ffd700] px-3 py-2 text-xs font-black text-black">Draft</div>
              </div>

              <div className="grid gap-4 lg:grid-cols-[0.85fr_1fr]">
                <div className="space-y-3">
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Platform</p>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {['Auto', 'Instagram', 'LinkedIn', 'Sales'].map((item, index) => (
                        <div key={item} className={`rounded-lg border px-3 py-2 text-xs font-bold ${index === 1 ? 'border-white bg-white text-black' : 'border-white/10 text-gray-300'}`}>
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Prompt</p>
                    <div className="mt-3 h-28 rounded-lg bg-[#050813] p-3 text-sm leading-6 text-gray-300">
                      How local restaurants can get more customer reviews without sounding pushy...
                    </div>
                  </div>
                  <div className="rounded-xl border border-[#ffd700]/30 bg-[#ffd700]/10 px-4 py-3 text-sm font-bold text-[#ffd700]">
                    Draft preview
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    ['01', 'How to Get More Customer Reviews', 'Simple ways to ask without being pushy'],
                    ['02', 'Ask at the Right Moment', 'Use clear positive customer moments'],
                    ['03', 'Make It Easy', 'Send one direct link and one simple ask'],
                    ['04', 'Reply to Every Review', 'Show future buyers there are real people behind the brand'],
                  ].map(slide => (
                    <div key={slide[0]} className="aspect-[3/4] overflow-hidden rounded-xl border border-white/10 bg-white p-4 text-[#071127]">
                      <div className="mb-6 inline-flex rounded-lg bg-[#075BFF] px-2 py-1 text-xs font-black text-white">{slide[0]}</div>
                      <h3 className="text-base font-black leading-tight">{slide[1]}</h3>
                      <p className="mt-3 text-xs font-medium leading-5 text-slate-600">{slide[2]}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-white/10 bg-white/[0.03]">
          <div className="mx-auto grid max-w-7xl gap-4 px-5 py-10 md:grid-cols-4">
            {[
              [MessageSquareText, 'Paste', 'Start with an idea, article, notes, or a URL.'],
              [Layers, 'Choose', 'Pick a platform and output type.'],
              [PenLine, 'Edit', 'Adjust text, order, and brand before download.'],
              [Download, 'Download', 'Export as PDF or images when it is ready.'],
            ].map(([Icon, title, body]) => {
              const StepIcon = Icon as typeof MessageSquareText;
              return (
                <div key={title as string} className="rounded-xl border border-white/10 bg-[#0D1320] p-5">
                  <StepIcon className="text-[#ffd700]" size={24} />
                  <h2 className="mt-4 text-lg font-black">{title as string}</h2>
                  <p className="mt-2 text-sm leading-6 text-gray-400">{body as string}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-14">
          <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <div>
              <h2 className="text-3xl font-black tracking-tight">Built for drafts that still need your judgment.</h2>
              <p className="mt-4 text-gray-400">Carouslk gives you a structured first draft, then keeps editing simple before download.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                'Platform-aware generation',
                'Editable slide text',
                'Ready-to-post checklist',
                'General, sales, education, and LinkedIn presets',
              ].map(item => (
                <div key={item} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm font-bold text-gray-200">
                  <Check size={18} className="text-green-400" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
