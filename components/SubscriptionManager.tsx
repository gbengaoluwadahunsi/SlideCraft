'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { useConfirm } from '@/components/ConfirmDialog';
import { 
  Sparkles, 
  Calendar, 
  CreditCard, 
  X, 
  Check, 
  AlertCircle,
  Loader2,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';

interface SubscriptionData {
  plan: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
  trialEndDate: string | null;
  usage: {
    exports: { current: number; limit: number };
    aiGenerations: { current: number; limit: number };
    projects: { current: number; limit: number };
  };
  limits: any;
  isActive: boolean;
}

export function SubscriptionManager() {
  const { data: session } = useSession();
  const confirm = useConfirm();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCanceling, setIsCanceling] = useState(false);
  const [isResuming, setIsResuming] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);

  useEffect(() => {
    if (session?.user?.id) {
      loadSubscription();
    }
  }, [session]);

  const loadSubscription = async () => {
    try {
      const response = await fetch('/api/subscription/status');
      if (response.ok) {
        const data = await response.json();
        setSubscription(data);
      }
    } catch (error) {
      // Subscription load failed silently
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async () => {
    setIsUpgrading(true);
    try {
      const response = await fetch('/api/dodo/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: 'pro' }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.url) {
          window.location.href = data.url;
        }
      } else {
        toast.error('Failed to start checkout');
      }
    } catch (error) {
      toast.error('Failed to start checkout');
    } finally {
      setIsUpgrading(false);
    }
  };

  const handleCancel = async () => {
    const confirmed = await confirm({
      title: 'Cancel Subscription',
      message: 'Are you sure you want to cancel your subscription? You will lose access to Pro features at the end of your billing period.',
      confirmText: 'Cancel Subscription',
      cancelText: 'Keep Subscription',
      variant: 'danger'
    });
    if (!confirmed) return;

    setIsCanceling(true);
    try {
      const response = await fetch('/api/subscription/cancel', {
        method: 'POST',
      });

      if (response.ok) {
        await loadSubscription();
        toast.success('Subscription will be canceled at the end of the billing period');
      } else {
        toast.error('Failed to cancel subscription');
      }
    } catch (error) {
      toast.error('Failed to cancel subscription');
    } finally {
      setIsCanceling(false);
    }
  };

  const handleResume = async () => {
    setIsResuming(true);
    try {
      const response = await fetch('/api/subscription/resume', {
        method: 'POST',
      });

      if (response.ok) {
        await loadSubscription();
        toast.success('Subscription resumed');
      } else {
        toast.error('Failed to resume subscription');
      }
    } catch (error) {
      toast.error('Failed to resume subscription');
    } finally {
      setIsResuming(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 size={24} className="animate-spin text-[#ffd700]" />
      </div>
    );
  }

  if (!subscription) {
    return null;
  }

  const formatDate = (date: string | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const isTrial = subscription.status === 'trialing';
  const isPastDue = subscription.status === 'past_due';
  const willCancel = subscription.endDate && new Date(subscription.endDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  return (
    <div className="space-y-6">
      {/* Current Plan Card */}
      <div className="bg-[#0f1117] border border-gray-800 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-white mb-1">Current Plan</h3>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                subscription.plan === 'pro' 
                  ? 'bg-[#ffd700] text-black' 
                  : subscription.plan === 'enterprise'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-700 text-gray-300'
              }`}>
                {subscription.plan.toUpperCase()}
              </span>
              {isTrial && (
                <span className="px-3 py-1 rounded-full text-sm font-semibold bg-blue-600 text-white">
                  TRIAL
                </span>
              )}
              {isPastDue && (
                <span className="px-3 py-1 rounded-full text-sm font-semibold bg-red-600 text-white">
                  PAYMENT FAILED
                </span>
              )}
            </div>
          </div>
          {subscription.plan === 'free' && (
            <button
              onClick={handleUpgrade}
              disabled={isUpgrading}
              className="px-6 py-2 bg-[#ffd700] hover:bg-yellow-400 text-black font-bold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isUpgrading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  Upgrade to Pro
                </>
              )}
            </button>
          )}
        </div>

        {/* Subscription Dates */}
        {subscription.plan !== 'free' && (
          <div className="grid md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-800">
            <div>
              <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
                <Calendar size={14} />
                <span>Started</span>
              </div>
              <p className="text-white font-semibold">{formatDate(subscription.startDate)}</p>
            </div>
            <div>
              <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
                <Calendar size={14} />
                <span>{isTrial ? 'Trial Ends' : 'Renews'}</span>
              </div>
              <p className="text-white font-semibold">
                {formatDate(subscription.trialEndDate || subscription.endDate)}
              </p>
            </div>
          </div>
        )}

        {/* Cancel/Resume Actions */}
        {subscription.plan !== 'free' && subscription.isActive && (
          <div className="mt-4 pt-4 border-t border-gray-800">
            {willCancel ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Subscription will cancel on {formatDate(subscription.endDate)}</p>
                  <p className="text-xs text-gray-500 mt-1">You'll lose access to Pro features after this date</p>
                </div>
                <button
                  onClick={handleResume}
                  disabled={isResuming}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isResuming ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Resuming...
                    </>
                  ) : (
                    'Resume Subscription'
                  )}
                </button>
              </div>
            ) : (
              <button
                onClick={handleCancel}
                disabled={isCanceling}
                className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-600/50 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isCanceling ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Canceling...
                  </>
                ) : (
                  <>
                    <X size={14} />
                    Cancel Subscription
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {isPastDue && (
          <div className="mt-4 p-4 bg-red-600/20 border border-red-600/50 rounded-lg">
            <div className="flex items-center gap-2 text-red-400 mb-2">
              <AlertCircle size={16} />
              <span className="font-semibold">Payment Required</span>
            </div>
            <p className="text-sm text-gray-300 mb-3">
              Your subscription payment failed. Please update your payment method to continue using Pro features.
            </p>
            <Link
              href="/dashboard?tab=billing"
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition text-sm"
            >
              Update Payment Method
              <ExternalLink size={14} />
            </Link>
          </div>
        )}
      </div>

      {/* Usage Stats */}
      <div className="bg-[#0f1117] border border-gray-800 rounded-2xl p-6">
        <h3 className="text-lg font-bold text-white mb-4">Usage This Month</h3>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Projects</span>
              <span className="text-sm text-white font-semibold">
                {subscription.usage.projects.current} / {subscription.usage.projects.limit === Infinity ? '∞' : subscription.usage.projects.limit}
              </span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-2">
              <div
                className="bg-[#ffd700] h-2 rounded-full transition-all"
                style={{
                  width: `${Math.min(
                    (subscription.usage.projects.current / (subscription.usage.projects.limit === Infinity ? 1 : subscription.usage.projects.limit)) * 100,
                    100
                  )}%`,
                }}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Exports</span>
              <span className="text-sm text-white font-semibold">
                {subscription.usage.exports.current} / {subscription.usage.exports.limit === Infinity ? '∞' : subscription.usage.exports.limit}
              </span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all"
                style={{
                  width: `${Math.min(
                    (subscription.usage.exports.current / (subscription.usage.exports.limit === Infinity ? 1 : subscription.usage.exports.limit)) * 100,
                    100
                  )}%`,
                }}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">AI Generations</span>
              <span className="text-sm text-white font-semibold">
                {subscription.usage.aiGenerations.current} / {subscription.usage.aiGenerations.limit === Infinity ? '∞' : subscription.usage.aiGenerations.limit}
              </span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-2">
              <div
                className="bg-purple-500 h-2 rounded-full transition-all"
                style={{
                  width: `${Math.min(
                    (subscription.usage.aiGenerations.current / (subscription.usage.aiGenerations.limit === Infinity ? 1 : subscription.usage.aiGenerations.limit)) * 100,
                    100
                  )}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Upgrade CTA for Free Users */}
      {subscription.plan === 'free' && (
        <div className="bg-gradient-to-r from-[#ffd700]/10 to-purple-600/10 border border-[#ffd700]/30 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white mb-2">Unlock Pro Features</h3>
              <p className="text-sm text-gray-300">
                Get unlimited projects, exports, AI features, and more
              </p>
            </div>
            <Link
              href="/pricing"
              className="px-6 py-3 bg-[#ffd700] hover:bg-yellow-400 text-black font-bold rounded-lg transition"
            >
              View Plans
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}


