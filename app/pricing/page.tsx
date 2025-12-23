"use client";

import React from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { 
  Sparkles, 
  Check, 
  X, 
  Zap, 
  Shield, 
  Users, 
  BarChart3,
  Image as ImageIcon,
  Wand2,
  TrendingUp,
  Search,
  Lightbulb,
  ArrowRight,
  Rocket
} from 'lucide-react';

export default function PricingPage() {
  const { data: session } = useSession();

  const features = {
    core: [
      { name: 'Projects', free: '5 projects', starter: 'Unlimited', pro: 'Unlimited', enterprise: 'Unlimited' },
      { name: 'Slide Editor', free: true, starter: true, pro: true, enterprise: true },
      { name: 'PDF & PPT Exports', free: '5 total', starter: 'Unlimited', pro: 'Unlimited', enterprise: 'Unlimited' },
      { name: 'Project Sharing', free: false, starter: true, pro: true, enterprise: true },
      { name: 'Brand Settings & Logo', free: false, starter: true, pro: true, enterprise: true },
      { name: 'Custom Brand Colors', free: false, starter: true, pro: true, enterprise: true },
      { name: 'Templates Library', free: 'Basic only', starter: 'All templates', pro: 'All templates', enterprise: 'All + Custom' },
      { name: 'Auto-save', free: true, starter: true, pro: true, enterprise: true },
      { name: 'Undo/Redo', free: true, starter: true, pro: true, enterprise: true },
    ],
    ai: [
      { name: 'AI Content Generation', free: '5/month', starter: '20/month', pro: 'Unlimited', enterprise: 'Unlimited' },
      { name: 'AI Image Generation', free: false, starter: false, pro: true, enterprise: true },
      { name: 'Content Enhancement', free: false, starter: false, pro: true, enterprise: true },
      { name: 'Research Agent', free: false, starter: false, pro: true, enterprise: true },
      { name: 'Design Suggestions', free: false, starter: false, pro: true, enterprise: true },
      { name: 'Performance Prediction', free: false, starter: false, pro: true, enterprise: true },
    ],
    advanced: [
      { name: 'Priority Support', free: false, starter: false, pro: true, enterprise: true },
      { name: 'Advanced Analytics', free: false, starter: false, pro: false, enterprise: true },
      { name: 'Team Collaboration', free: false, starter: false, pro: false, enterprise: true },
      { name: 'API Access', free: false, starter: false, pro: false, enterprise: true },
      { name: 'White-label', free: false, starter: false, pro: false, enterprise: true },
      { name: 'Custom AI Training', free: false, starter: false, pro: false, enterprise: true },
    ]
  };

  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: 'forever',
      description: 'Try Carouslk with limited features',
      cta: session ? 'Current Plan' : 'Get Started',
      href: session ? '/dashboard' : '/register',
      popular: false,
      icon: Zap,
      color: 'gray'
    },
    {
      name: 'Starter',
      price: '$10',
      period: 'month',
      description: 'Perfect for individual creators',
      cta: 'Start Free Trial',
      href: session ? '/dashboard?upgrade=starter' : '/register?plan=starter',
      popular: false,
      icon: Rocket,
      color: 'blue'
    },
    {
      name: 'Pro',
      price: '$19',
      period: 'month',
      description: 'For creators who want unlimited AI',
      cta: 'Start Free Trial',
      href: session ? '/dashboard?upgrade=pro' : '/register?plan=pro',
      popular: true,
      icon: Sparkles,
      color: 'gold'
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: '',
      description: 'For teams and agencies',
      cta: 'Contact Sales',
      href: 'mailto:sales@carouslk.com?subject=Enterprise Inquiry',
      popular: false,
      icon: Shield,
      color: 'purple'
    }
  ];

  const FeatureRow = ({ feature, category }: { feature: any, category: string }) => {
    const getValue = (tier: string) => {
      if (category === 'ai' && typeof feature[tier] === 'string') {
        return feature[tier];
      }
      return feature[tier] ? true : false;
    };

    return (
      <tr className="border-b border-gray-800 hover:bg-gray-900/30 transition">
        <td className="py-4 px-4 text-sm text-gray-300">{feature.name}</td>
        <td className="py-4 px-4 text-center">
          {getValue('free') === true ? (
            <Check size={20} className="text-green-400 mx-auto" />
          ) : getValue('free') ? (
            <span className="text-xs text-gray-400">{getValue('free')}</span>
          ) : (
            <X size={20} className="text-gray-700 mx-auto" />
          )}
        </td>
        <td className="py-4 px-4 text-center">
          {getValue('starter') === true ? (
            <Check size={20} className="text-blue-400 mx-auto" />
          ) : getValue('starter') ? (
            <span className="text-xs text-blue-400">{getValue('starter')}</span>
          ) : (
            <X size={20} className="text-gray-700 mx-auto" />
          )}
        </td>
        <td className="py-4 px-4 text-center">
          {getValue('pro') === true ? (
            <Check size={20} className="text-[#ffd700] mx-auto" />
          ) : getValue('pro') ? (
            <span className="text-xs text-[#ffd700]">{getValue('pro')}</span>
          ) : (
            <X size={20} className="text-gray-700 mx-auto" />
          )}
        </td>
        <td className="py-4 px-4 text-center">
          {getValue('enterprise') === true ? (
            <Check size={20} className="text-purple-400 mx-auto" />
          ) : getValue('enterprise') ? (
            <span className="text-xs text-purple-400">{getValue('enterprise')}</span>
          ) : (
            <X size={20} className="text-gray-700 mx-auto" />
          )}
        </td>
      </tr>
    );
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white">
      {/* Header */}
      <header className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 text-xl font-bold">
              <div className="w-8 h-8 bg-[#ffd700] rounded-lg rotate-3 flex items-center justify-center">
                <span className="text-black font-bold text-xl">C</span>
              </div>
              <span>Carouslk</span>
            </Link>
            <div className="flex items-center gap-4">
              {session ? (
                <Link
                  href="/dashboard"
                  className="px-4 py-2 text-sm text-gray-300 hover:text-white transition"
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="px-4 py-2 text-sm text-gray-300 hover:text-white transition"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="px-4 py-2 bg-[#ffd700] hover:bg-yellow-400 text-black font-bold rounded-lg transition"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-[#ffd700] to-yellow-400 bg-clip-text text-transparent">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-400 mb-12">
            Choose the perfect plan for your content creation needs. All plans include our core features.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-4 gap-6 mt-12 max-w-7xl mx-auto">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const isPopular = plan.popular;
            const hoverStyles =
              plan.color === 'gold'
                ? 'hover:border-[#ffd700] hover:shadow-[0_25px_70px_-25px_rgba(255,215,0,0.45)]'
                : plan.color === 'purple'
                ? 'hover:border-purple-500 hover:shadow-[0_25px_70px_-25px_rgba(168,85,247,0.45)]'
                : plan.color === 'blue'
                ? 'hover:border-blue-500 hover:shadow-[0_25px_70px_-25px_rgba(59,130,246,0.45)]'
                : 'hover:border-gray-600 hover:shadow-[0_25px_70px_-25px_rgba(255,255,255,0.18)]';
            
            return (
              <div
                key={plan.name}
                className={`group relative overflow-visible bg-[#0f1117] border-2 rounded-2xl p-8 transition-all duration-300 ease-out hover:-translate-y-2 ${
                  isPopular
                    ? 'border-[#ffd700] shadow-2xl shadow-[#ffd700]/20 scale-105'
                    : 'border-gray-800 shadow-[0_10px_35px_-20px_rgba(0,0,0,0.6)]'
                } ${hoverStyles}`}
              >
                <div
                  className={`pointer-events-none absolute inset-0 rounded-2xl opacity-0 blur-3xl transition duration-500 group-hover:opacity-100 ${
                    plan.color === 'gold'
                      ? 'bg-gradient-to-br from-[#ffd700]/0 via-[#ffd700]/5 to-[#ffd700]/10'
                      : plan.color === 'purple'
                      ? 'bg-gradient-to-br from-purple-500/0 via-purple-500/5 to-purple-500/10'
                      : plan.color === 'blue'
                      ? 'bg-gradient-to-br from-blue-500/0 via-blue-500/5 to-blue-500/10'
                      : 'bg-gradient-to-br from-white/0 via-white/5 to-white/10'
                  }`}
                />

                <div className="relative">
                {isPopular && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 drop-shadow-md">
                    <span className="inline-flex items-center justify-center bg-[#ffd700] text-black px-4 py-1 rounded-full text-xs font-bold whitespace-nowrap">
                      MOST POPULAR
                    </span>
                  </div>
                )}
                
                <div className={`text-center mb-6 ${isPopular ? 'pt-6' : ''}`}>
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 transition-all duration-300 ${
                    plan.color === 'gold' ? 'bg-[#ffd700]/20 group-hover:bg-[#ffd700]/30' :
                    plan.color === 'purple' ? 'bg-purple-500/20 group-hover:bg-purple-500/30' :
                    plan.color === 'blue' ? 'bg-blue-500/20 group-hover:bg-blue-500/30' :
                    'bg-gray-800 group-hover:bg-gray-700'
                  } group-hover:scale-110 group-hover:rotate-3`}>
                    <Icon size={32} className={
                      plan.color === 'gold' ? 'text-[#ffd700]' :
                      plan.color === 'purple' ? 'text-purple-400' :
                      plan.color === 'blue' ? 'text-blue-400' :
                      'text-gray-400'
                    } />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <div className="mb-2">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    {plan.period && <span className="text-gray-400 ml-2">/{plan.period}</span>}
                  </div>
                  <p className="text-sm text-gray-400">{plan.description}</p>
                </div>

                {(plan.name === 'Starter' || plan.name === 'Pro') && session ? (
                  <button
                    onClick={async () => {
                      try {
                        const response = await fetch(`/api/dodo/checkout?plan=${plan.name.toLowerCase()}`);
                        if (response.ok) {
                          const data = await response.json();
                          if (data.url) {
                            window.location.href = data.url;
                          }
                        } else {
                          alert('Failed to start checkout');
                        }
                      } catch (error) {
                        console.error('Checkout error:', error);
                        alert('Failed to start checkout');
                      }
                    }}
                    className={`block w-full text-center py-3 px-6 rounded-lg font-bold transition mb-6 ${
                      isPopular
                        ? 'bg-[#ffd700] hover:bg-yellow-400 text-black'
                        : plan.color === 'blue'
                        ? 'bg-blue-600 hover:bg-blue-500 text-white'
                        : 'bg-gray-800 hover:bg-gray-700 text-white'
                    }`}
                  >
                    {plan.cta}
                  </button>
                ) : (
                  <Link
                    href={plan.href}
                    className={`block w-full text-center py-3 px-6 rounded-lg font-bold transition mb-6 ${
                      isPopular
                        ? 'bg-[#ffd700] hover:bg-yellow-400 text-black'
                        : 'bg-gray-800 hover:bg-gray-700 text-white'
                    }`}
                  >
                    {plan.cta}
                  </Link>
                )}

                <ul className="space-y-3 text-sm">
                  {plan.name === 'Free' ? (
                    <>
                      <li className="flex items-center gap-2">
                        <Check size={16} className="text-green-400" />
                        <span>5 Projects</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check size={16} className="text-green-400" />
                        <span>5 Exports (PDF/PPT)</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check size={16} className="text-green-400" />
                        <span>5 AI Generations/month</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <X size={16} className="text-gray-600" />
                        <span className="text-gray-500">No Brand Customization</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <X size={16} className="text-gray-600" />
                        <span className="text-gray-500">No Project Sharing</span>
                      </li>
                    </>
                  ) : plan.name === 'Starter' ? (
                    <>
                      <li className="flex items-center gap-2">
                        <Check size={16} className="text-blue-400" />
                        <span>Unlimited Projects</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check size={16} className="text-blue-400" />
                        <span>Unlimited Exports</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check size={16} className="text-blue-400" />
                        <span>20 AI Generations/month</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check size={16} className="text-blue-400" />
                        <span>Brand Customization</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check size={16} className="text-blue-400" />
                        <span>Project Sharing</span>
                      </li>
                    </>
                  ) : plan.name === 'Pro' ? (
                    <>
                      <li className="flex items-center gap-2">
                        <Check size={16} className="text-[#ffd700]" />
                        <span>Unlimited Projects</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check size={16} className="text-[#ffd700]" />
                        <span>Unlimited Exports</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check size={16} className="text-[#ffd700]" />
                        <span>Unlimited AI Generations</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check size={16} className="text-[#ffd700]" />
                        <span>All Advanced AI Features</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check size={16} className="text-[#ffd700]" />
                        <span>Priority Support</span>
                      </li>
                    </>
                  ) : (
                    <>
                      <li className="flex items-center gap-2">
                        <Check size={16} className="text-purple-400" />
                        <span>Everything in Pro</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check size={16} className="text-purple-400" />
                        <span>Team Collaboration</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check size={16} className="text-purple-400" />
                        <span>API Access</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check size={16} className="text-purple-400" />
                        <span>White-label</span>
                      </li>
                    </>
                  )}
                </ul>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Compare Plans</h2>
          <p className="text-gray-400">See what's included in each plan</p>
        </div>

        <div className="bg-[#0f1117] border border-gray-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="py-4 px-4 text-left text-sm font-semibold text-gray-400">Feature</th>
                  <th className="py-4 px-4 text-center text-sm font-semibold text-gray-400">Free</th>
                  <th className="py-4 px-4 text-center text-sm font-semibold text-blue-400">Starter</th>
                  <th className="py-4 px-4 text-center text-sm font-semibold text-[#ffd700]">Pro</th>
                  <th className="py-4 px-4 text-center text-sm font-semibold text-purple-400">Enterprise</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={5} className="py-3 px-4 bg-gray-900/50">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Core Features</span>
                  </td>
                </tr>
                {features.core.map((feature, idx) => (
                  <FeatureRow key={idx} feature={feature} category="core" />
                ))}
                
                <tr>
                  <td colSpan={5} className="py-3 px-4 bg-gray-900/50">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">AI Features</span>
                  </td>
                </tr>
                {features.ai.map((feature, idx) => (
                  <FeatureRow key={idx} feature={feature} category="ai" />
                ))}
                
                <tr>
                  <td colSpan={5} className="py-3 px-4 bg-gray-900/50">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Advanced Features</span>
                  </td>
                </tr>
                {features.advanced.map((feature, idx) => (
                  <FeatureRow key={idx} feature={feature} category="advanced" />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* AI Features Highlight */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-gradient-to-r from-purple-600/20 to-[#ffd700]/20 border border-purple-500/30 rounded-2xl p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4">AI-Powered Features</h2>
            <p className="text-gray-300">Pro and Enterprise plans include our full AI suite</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-[#0f1117] border border-gray-800 rounded-xl p-6">
              <ImageIcon className="text-purple-400 mb-4" size={32} />
              <h3 className="font-semibold mb-2">AI Image Generation</h3>
              <p className="text-sm text-gray-400">Generate contextual images automatically for your slides</p>
            </div>
            
            <div className="bg-[#0f1117] border border-gray-800 rounded-xl p-6">
              <Wand2 className="text-[#ffd700] mb-4" size={32} />
              <h3 className="font-semibold mb-2">Content Enhancement</h3>
              <p className="text-sm text-gray-400">Improve clarity, SEO, and engagement with AI</p>
            </div>
            
            <div className="bg-[#0f1117] border border-gray-800 rounded-xl p-6">
              <Search className="text-blue-400 mb-4" size={32} />
              <h3 className="font-semibold mb-2">Research Agent</h3>
              <p className="text-sm text-gray-400">Research any topic and get comprehensive insights</p>
            </div>
            
            <div className="bg-[#0f1117] border border-gray-800 rounded-xl p-6">
              <Lightbulb className="text-yellow-400 mb-4" size={32} />
              <h3 className="font-semibold mb-2">Design Suggestions</h3>
              <p className="text-sm text-gray-400">Get AI-powered design recommendations</p>
            </div>
            
            <div className="bg-[#0f1117] border border-gray-800 rounded-xl p-6">
              <TrendingUp className="text-green-400 mb-4" size={32} />
              <h3 className="font-semibold mb-2">Performance Prediction</h3>
              <p className="text-sm text-gray-400">Predict engagement before you post</p>
            </div>
            
            <div className="bg-[#0f1117] border border-gray-800 rounded-xl p-6">
              <Sparkles className="text-pink-400 mb-4" size={32} />
              <h3 className="font-semibold mb-2">AI Content Generation</h3>
              <p className="text-sm text-gray-400">Convert text to professional carousels instantly</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
        </div>
        
        <div className="space-y-6">
          <div className="bg-[#0f1117] border border-gray-800 rounded-xl p-6">
            <h3 className="font-semibold mb-2">Can I change plans later?</h3>
            <p className="text-sm text-gray-400">Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.</p>
          </div>
          
          <div className="bg-[#0f1117] border border-gray-800 rounded-xl p-6">
            <h3 className="font-semibold mb-2">What payment methods do you accept?</h3>
            <p className="text-sm text-gray-400">We accept all major credit cards, PayPal, and bank transfers for Enterprise plans.</p>
          </div>
          
          <div className="bg-[#0f1117] border border-gray-800 rounded-xl p-6">
            <h3 className="font-semibold mb-2">Is there a free trial?</h3>
            <p className="text-sm text-gray-400">Yes! Pro plan includes a 14-day free trial. No credit card required.</p>
          </div>
          
          <div className="bg-[#0f1117] border border-gray-800 rounded-xl p-6">
            <h3 className="font-semibold mb-2">What happens to my projects if I cancel?</h3>
            <p className="text-sm text-gray-400">Your projects remain accessible. You can export them anytime, even after cancellation.</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="bg-gradient-to-r from-[#ffd700]/10 to-purple-600/10 border border-[#ffd700]/30 rounded-2xl p-12">
          <h2 className="text-3xl font-bold mb-4">Ready to create amazing carousels?</h2>
          <p className="text-gray-300 mb-8">Join thousands of creators using AI to create engaging content</p>
          <div className="flex gap-4 justify-center">
            {session ? (
              <Link
                href="/dashboard"
                className="px-8 py-4 bg-[#ffd700] hover:bg-yellow-400 text-black font-bold rounded-lg transition flex items-center gap-2"
              >
                Go to Dashboard
                <ArrowRight size={20} />
              </Link>
            ) : (
              <>
                <Link
                  href="/register?plan=pro"
                  className="px-8 py-4 bg-[#ffd700] hover:bg-yellow-400 text-black font-bold rounded-lg transition flex items-center gap-2"
                >
                  Start Free Trial
                  <ArrowRight size={20} />
                </Link>
                <Link
                  href="/register"
                  className="px-8 py-4 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-lg transition"
                >
                  Try Free Plan
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-[#ffd700] rounded-lg rotate-3 flex items-center justify-center">
                <span className="text-black font-bold text-sm">C</span>
              </div>
              <span className="font-bold">Carouslk</span>
            </div>
            <div className="flex gap-6 text-sm text-gray-400">
              <Link href="/pricing" className="hover:text-white transition">Pricing</Link>
              <Link href="/dashboard" className="hover:text-white transition">Dashboard</Link>
              <a href="mailto:support@carouslk.com" className="hover:text-white transition">Support</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

