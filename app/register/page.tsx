'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Check, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { GoogleSignInButton } from '@/components/GoogleSignInButton';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Registration failed');
        return;
      }

      // Redirect to check email page with email for resend functionality
      router.push(`/check-email?email=${encodeURIComponent(email)}`);
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080B14] text-white flex items-center justify-center px-5 py-10">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="grid w-full max-w-5xl overflow-hidden rounded-2xl border border-white/10 bg-[#0D1320] shadow-2xl lg:grid-cols-[0.9fr_1.1fr]"
      >
        <aside className="hidden border-r border-white/10 bg-[#090E18] p-8 lg:block">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#ffd700] text-lg font-black text-black">C</div>
            <span className="text-lg font-black">Carouslk</span>
          </Link>
          <h1 className="mt-16 text-4xl font-black leading-tight tracking-tight">Create your first editable carousel draft.</h1>
          <p className="mt-4 text-sm leading-7 text-gray-400">Start with a simple prompt, article, or notes. Pick a platform and edit the slides before downloading.</p>
          <div className="mt-8 space-y-3">
            {['No design setup required', 'Platform and preset choices', 'Download only when it is ready'].map(item => (
              <div key={item} className="flex items-center gap-3 text-sm font-bold text-gray-200">
                <Check size={17} className="text-[#ffd700]" />
                {item}
              </div>
            ))}
          </div>
        </aside>

        <motion.div 
          className="p-6 sm:p-8 lg:p-10"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#ffd700] text-lg font-black text-black">C</div>
            <span className="text-lg font-black">Carouslk</span>
          </div>
          <h1 className="text-2xl font-black mb-2">Create account</h1>
          <p className="mb-6 text-sm text-gray-400">Create drafts, edit them, and export when ready.</p>

          {/* OAuth Buttons */}
          <motion.div 
            className="space-y-3 mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <GoogleSignInButton 
              callbackUrl="/dashboard"
              onError={(errorMsg) => setError(errorMsg)}
            />
          </motion.div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-800/50 text-gray-400">Or sign up with email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-2">
                Name (optional)
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-[#080B14] border border-white/10 rounded-lg focus:outline-none focus:border-[#ffd700]"
                placeholder="Your name"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-[#080B14] border border-white/10 rounded-lg focus:outline-none focus:border-[#ffd700]"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-3 bg-[#080B14] border border-white/10 rounded-lg focus:outline-none focus:border-[#ffd700]"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="text-red-400 text-sm">{error}</div>
            )}

            <motion.button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 bg-[#ffd700] hover:bg-yellow-400 text-black font-bold rounded-xl transition transform hover:scale-105 flex items-center justify-center gap-2 disabled:opacity-50"
              whileHover={{ scale: loading ? 1 : 1.05 }}
              whileTap={{ scale: loading ? 1 : 0.95 }}
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  Create Account <ArrowRight size={18} />
                </>
              )}
            </motion.button>
          </form>

          <motion.div 
            className="mt-6 text-center text-sm text-gray-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            Already have an account?{' '}
            <Link href="/login" className="text-[#ffd700] hover:underline">
              Sign in
            </Link>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}

