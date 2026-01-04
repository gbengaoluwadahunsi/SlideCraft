'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2, Check, Mail, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

function VerifyEmailContent() {
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [token, setToken] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (!tokenParam) {
      setError('Invalid verification link');
      setLoading(false);
    } else {
      setToken(tokenParam);
      verifyEmail(tokenParam);
    }
  }, [searchParams]);

  const verifyEmail = async (token: string) => {
    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to verify email');
      } else {
        setSuccess(true);
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    // This would need the user's email, which we don't have here
    // In a real app, you might store it or ask the user
    router.push('/login?resend=true');
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
          {loading ? (
            <div className="py-8">
              <Loader2 size={48} className="animate-spin text-[#ffd700] mx-auto mb-4" />
              <p className="text-gray-400">Verifying your email...</p>
            </div>
          ) : success ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="text-green-400" size={32} />
              </div>
              <h1 className="text-2xl font-bold mb-2">Email Verified!</h1>
              <p className="text-gray-400 mb-6">
                Your email has been successfully verified. You can now use all features of Carouslk.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#ffd700] hover:bg-yellow-400 text-black font-bold rounded-xl transition"
              >
                Continue to Sign In
              </Link>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="text-red-400" size={32} />
              </div>
              <h1 className="text-2xl font-bold mb-2">Verification Failed</h1>
              <p className="text-gray-400 mb-6">
                {error || 'The verification link is invalid or has expired.'}
              </p>
              <div className="space-y-3">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#ffd700] hover:bg-yellow-400 text-black font-bold rounded-xl transition w-full justify-center"
                >
                  Go to Sign In
                </Link>
                <button
                  onClick={handleResend}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-xl transition w-full justify-center"
                >
                  <Mail size={18} />
                  Resend Verification Email
                </button>
              </div>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-[#ffd700]" />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}





















