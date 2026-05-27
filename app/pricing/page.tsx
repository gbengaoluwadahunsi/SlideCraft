"use client";

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { ArrowRight, Check } from 'lucide-react';

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Try the workflow and create a few drafts.',
    cta: 'Start free',
    href: '/register',
    features: ['5 projects', '5 exports', '5 AI generations/month', 'Editable slides'],
  },
  {
    name: 'Starter',
    price: '$10',
    period: 'month',
    description: 'For creators who make carousels regularly.',
    cta: 'Choose Starter',
    href: '/register?plan=starter',
    features: ['Unlimited projects', 'Unlimited exports', '20 AI generations/month', 'Brand logo upload'],
  },
  {
    name: 'Pro',
    price: '$19',
    period: 'month',
    description: 'More room for frequent content work.',
    cta: 'Choose Pro',
    href: '/register?plan=pro',
    features: ['Everything in Starter', 'Unlimited AI drafts', 'Priority support', 'More preset flexibility'],
    popular: true,
  },
];

const included = [
  'Platform-aware carousel prompts',
  'General, education, sales, tips, and LinkedIn presets',
  'Editable slides before export',
  'PDF and image export',
  'Ready-to-post checklist',
  'Brand colors and fonts',
];

export default function PricingPage() {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen bg-[#080B14] text-white">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#ffd700] text-lg font-black text-black">C</div>
            <span className="text-lg font-black">Carouslk</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href={session ? '/dashboard' : '/login'} className="rounded-lg px-3 py-2 text-sm font-semibold text-gray-300 hover:text-white">
              {session ? 'Dashboard' : 'Login'}
            </Link>
            <Link href={session ? '/dashboard' : '/register'} className="rounded-lg bg-[#ffd700] px-4 py-2 text-sm font-black text-black hover:bg-yellow-400">
              Start
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-14">
        <section className="max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-widest text-[#ffd700]">Pricing</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">Simple plans for editable carousel drafts.</h1>
          <p className="mt-4 text-lg leading-8 text-gray-300">
            Start free, upgrade when you need more drafts, exports, and brand control. No enterprise promises in the normal product flow.
          </p>
        </section>

        <section className="mt-10 grid gap-5 lg:grid-cols-3">
          {plans.map(plan => (
            <div
              key={plan.name}
              className={`relative rounded-2xl border p-6 ${plan.popular ? 'border-[#ffd700] bg-[#111827]' : 'border-white/10 bg-[#0D1320]'}`}
            >
              {plan.popular && (
                <div className="absolute right-5 top-5 rounded-full bg-[#ffd700] px-3 py-1 text-xs font-black text-black">
                  Popular
                </div>
              )}
              <h2 className="text-2xl font-black">{plan.name}</h2>
              <p className="mt-2 min-h-12 text-sm leading-6 text-gray-400">{plan.description}</p>
              <div className="mt-6 flex items-end gap-2">
                <span className="text-4xl font-black">{plan.price}</span>
                <span className="pb-1 text-sm text-gray-400">/{plan.period}</span>
              </div>
              <Link
                href={session ? '/dashboard' : plan.href}
                className={`mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-black ${
                  plan.popular ? 'bg-[#ffd700] text-black hover:bg-yellow-400' : 'bg-white text-black hover:bg-gray-100'
                }`}
              >
                {session ? 'Open dashboard' : plan.cta} <ArrowRight size={16} />
              </Link>
              <ul className="mt-6 space-y-3">
                {plan.features.map(feature => (
                  <li key={feature} className="flex items-start gap-3 text-sm text-gray-300">
                    <Check size={17} className="mt-0.5 shrink-0 text-green-400" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        <section className="mt-12 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:items-start">
            <div>
              <h2 className="text-2xl font-black">What every plan is built around</h2>
              <p className="mt-3 text-sm leading-6 text-gray-400">
                The product promise is not perfect AI. It is a faster path from rough material to an editable, platform-aware draft.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {included.map(item => (
                <div key={item} className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#0D1320] p-4 text-sm font-bold text-gray-200">
                  <Check size={18} className="text-[#ffd700]" />
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
