'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Mail } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to send reset email');
      } else {
        setSuccess(true);
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
          <h1 className="text-2xl font-bold mb-2">Forgot Password?</h1>
          <p className="text-gray-400 mb-6">Enter your email address and we'll send you a link to reset your password.</p>

          {success ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-green-500/10 border border-green-500/50 rounded-lg p-4 mb-6"
            >
              <div className="flex items-center gap-3">
                <Mail className="text-green-400" size={20} />
                <div>
                  <p className="text-green-400 font-medium">Check your email</p>
                  <p className="text-sm text-gray-300 mt-1">
                    If an account exists with that email, a password reset link has been sent.
                  </p>
                </div>
              </div>
            </motion.div>
          ) : (
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
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-[#ffd700]"
                  placeholder="you@example.com"
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
                    Sending...
                  </>
                ) : (
                  <>
                    Send Reset Link <Mail size={18} />
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




