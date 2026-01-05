'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Mail, Loader2, ArrowRight, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

function CheckEmailContent() {
  const [email, setEmail] = useState('');
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(decodeURIComponent(emailParam));
    }
  }, [searchParams]);

  const handleResend = async () => {
    if (!email) {
      setError('Email is required');
      return;
    }

    setResending(true);
    setError('');
    setResent(false);

    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to resend verification email');
      } else {
        setResent(true);
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setResending(false);
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
          className="bg-gray-800/50 border border-gray-700 rounded-2xl p-8 text-center"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="w-16 h-16 bg-[#ffd700]/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="text-[#ffd700]" size={32} />
            </div>
            <h1 className="text-2xl font-bold mb-2">Check Your Email</h1>
            <p className="text-gray-400 mb-6">
              We've sent a verification link to <strong className="text-white">{email || 'your email'}</strong>
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Click the link in the email to verify your account and start using Carouslk.
            </p>

            {resent && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 bg-green-500/10 border border-green-500/50 rounded-lg text-green-400 text-sm flex items-center justify-center gap-2"
              >
                <CheckCircle size={16} />
                Verification email sent!
              </motion.div>
            )}

            {error && (
              <div className="mb-4 text-red-400 text-sm bg-red-400/10 p-3 rounded-lg border border-red-400/50">
                {error}
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={handleResend}
                disabled={resending || !email}
                className="w-full px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resending ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail size={18} />
                    Resend Verification Email
                  </>
                )}
              </button>

              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#ffd700] hover:bg-yellow-400 text-black font-bold rounded-xl transition w-full justify-center"
              >
                Continue to Sign In
                <ArrowRight size={18} />
              </Link>
            </div>

            <motion.div 
              className="mt-6 text-center text-sm text-gray-400"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              Didn't receive the email? Check your spam folder or{' '}
              <button
                onClick={handleResend}
                disabled={resending}
                className="text-[#ffd700] hover:underline disabled:opacity-50"
              >
                resend it
              </button>
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default function CheckEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-[#ffd700]" />
      </div>
    }>
      <CheckEmailContent />
    </Suspense>
  );
}
























