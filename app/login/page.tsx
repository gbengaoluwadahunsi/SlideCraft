'use client';

import { useState, useEffect, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Check, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { GoogleSignInButton } from '@/components/GoogleSignInButton';

function LoginContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedNextPath = searchParams.get('next');
  const nextPath = requestedNextPath?.startsWith('/') ? requestedNextPath : '/dashboard';

  useEffect(() => {
    if (searchParams.get('registered') === 'true') {
      setSuccess('Account created successfully! Please sign in.');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Try to sign in first
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false
      });

      if (result?.error) {
        // If login failed, check if it's because email is not verified
        try {
          const checkResponse = await fetch('/api/auth/check-verification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
          });
          
          if (checkResponse.ok) {
            const checkData = await checkResponse.json();
            // Only show verification error if we can confirm email is explicitly unverified
            // Don't block if status is 'unknown' (existing users)
            if (checkData.verified === false && checkData.status === 'unverified') {
              setError('Please verify your email before signing in. Check your inbox for the verification link, or click the link below to resend it.');
              setLoading(false);
              return;
            }
          }
        } catch (checkErr) {
          // If check fails, just show generic error
        }
        
        setError('Invalid email or password');
      } else {
        router.push(nextPath);
        router.refresh();
      }
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
          <h1 className="mt-16 text-4xl font-black leading-tight tracking-tight">Welcome back to your carousel workspace.</h1>
          <p className="mt-4 text-sm leading-7 text-gray-400">Open the editor, paste your material, choose a platform, and keep control of the final slides.</p>
          <div className="mt-8 space-y-3">
            {['Platform-aware drafts', 'Editable before export', 'General, sales, education, and LinkedIn presets'].map(item => (
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
          <h1 className="text-2xl font-black mb-2">Sign in</h1>
          <p className="mb-6 text-sm text-gray-400">Continue to your carousel editor.</p>

          {/* OAuth Buttons */}
          <motion.div 
            className="space-y-3 mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <GoogleSignInButton 
              callbackUrl={nextPath}
              onError={(errorMsg) => setError(errorMsg)}
            />
          </motion.div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-800/50 text-gray-400">Or continue with email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
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
                className="w-full px-4 py-3 bg-[#080B14] border border-white/10 rounded-lg focus:outline-none focus:border-[#ffd700]"
                placeholder="••••••••"
              />
            </div>

            {success && (
              <div className="text-green-400 text-sm bg-green-400/10 p-3 rounded-lg">{success}</div>
            )}
            {error && (
              <div className="text-red-400 text-sm bg-red-400/10 p-3 rounded-lg border border-red-400/50">
                {error}
                {error.includes('verify your email') && (
                  <div className="mt-2">
                    <Link 
                      href={`/check-email?email=${encodeURIComponent(email)}`}
                      className="text-[#ffd700] hover:underline text-sm"
                    >
                      Resend verification email
                    </Link>
                  </div>
                )}
              </div>
            )}

            <div className="text-right">
              <Link href="/forgot-password" className="text-sm text-[#ffd700] hover:underline">
                Forgot password?
              </Link>
            </div>

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
                  Signing in...
                </>
              ) : (
                <>
                  Sign In <ArrowRight size={18} />
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
            Don't have an account?{' '}
            <Link href="/register" className="text-[#ffd700] hover:underline">
              Sign up
            </Link>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-[#ffd700]" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}

