'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Lock, Check } from 'lucide-react';
import { motion } from 'framer-motion';

function ResetPasswordContent() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [token, setToken] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (!tokenParam) {
      setError('Invalid reset link. Please request a new password reset.');
    } else {
      setToken(tokenParam);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (!token) {
      setError('Invalid reset token');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to reset password');
      } else {
        setSuccess(true);
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center px-6">
        <div className="w-full max-w-md">
          <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-8 text-center">
            <p className="text-red-400 mb-4">Invalid reset link</p>
            <Link href="/forgot-password" className="text-[#ffd700] hover:underline">
              Request a new password reset
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center px-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <motion.div 
          className="flex items-center gap-2 mb-8 justify-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <motion.div 
            className="w-8 h-8 bg-[#ffd700] rounded-lg rotate-3 flex items-center justify-center"
            whileHover={{ rotate: 6, scale: 1.1 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <span className="text-black font-bold text-xl">C</span>
          </motion.div>
          <span className="text-2xl font-bold tracking-tight">Carouslk</span>
        </motion.div>

        <motion.div 
          className="bg-gray-800/50 border border-gray-700 rounded-2xl p-8"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h1 className="text-2xl font-bold mb-2">Reset Password</h1>
          <p className="text-gray-400 mb-6">Enter your new password below.</p>

          {success ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-green-500/10 border border-green-500/50 rounded-lg p-4 mb-6"
            >
              <div className="flex items-center gap-3">
                <Check className="text-green-400" size={20} />
                <div>
                  <p className="text-green-400 font-medium">Password reset successful!</p>
                  <p className="text-sm text-gray-300 mt-1">
                    Redirecting to login page...
                  </p>
                </div>
              </div>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium mb-2">
                  New Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-[#ffd700]"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-[#ffd700]"
                  placeholder="••••••••"
                />
              </div>

              {error && (
                <div className="text-red-400 text-sm bg-red-400/10 p-3 rounded-lg border border-red-400/50">
                  {error}
                </div>
              )}

              <motion.button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-3 bg-[#ffd700] hover:bg-yellow-400 text-black font-bold rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50"
                whileHover={{ scale: loading ? 1 : 1.05 }}
                whileTap={{ scale: loading ? 1 : 0.95 }}
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Resetting...
                  </>
                ) : (
                  <>
                    Reset Password <Lock size={18} />
                  </>
                )}
              </motion.button>
            </form>
          )}

          <div className="mt-6 text-center">
            <Link 
              href="/login" 
              className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-[#ffd700] transition"
            >
              <ArrowLeft size={16} />
              Back to Sign In
            </Link>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-[#ffd700]" />
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}























