'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Plus, Trash2, Loader2, Key, Mail, AlertCircle, CheckCircle, Lock } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { useConfirm } from '@/components/ConfirmDialog';

interface AdminEmail {
  id: string;
  email: string;
  note: string | null;
  created_at: string;
}

export default function AdminEmailsPage() {
  const confirm = useConfirm();
  const [adminSecret, setAdminSecret] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminEmails, setAdminEmails] = useState<AdminEmail[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [newNote, setNewNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchAdminEmails = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/admin/emails', {
        headers: {
          'x-admin-secret': adminSecret,
        },
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          setError('Invalid admin secret key');
          setIsAuthenticated(false);
          return;
        }
        throw new Error('Failed to fetch admin emails');
      }
      
      const data = await response.json();
      setAdminEmails(data.adminEmails);
      setIsAuthenticated(true);
    } catch (err) {
      setError('Failed to fetch admin emails');
    } finally {
      setLoading(false);
    }
  };

  const handleAuthenticate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminSecret.trim()) {
      setError('Please enter the admin secret key');
      return;
    }
    await fetchAdminEmails();
  };

  const handleAddEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) {
      setError('Please enter an email address');
      return;
    }
    
    setAddLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await fetch('/api/admin/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': adminSecret,
        },
        body: JSON.stringify({
          email: newEmail.trim(),
          note: newNote.trim() || null,
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add admin email');
      }
      
      setSuccess('Admin email added successfully!');
      setNewEmail('');
      setNewNote('');
      await fetchAdminEmails();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add admin email';
      setError(errorMessage);
    } finally {
      setAddLoading(false);
    }
  };

  const handleDeleteEmail = async (id: string, email: string) => {
    const confirmed = await confirm({
      title: 'Remove Admin Email',
      message: `Are you sure you want to remove ${email} from the admin list? They will lose unlimited access.`,
      confirmText: 'Remove',
      cancelText: 'Cancel',
      variant: 'danger'
    });
    
    if (!confirmed) return;
    
    setDeletingId(id);
    setError('');
    setSuccess('');
    
    try {
      const response = await fetch(`/api/admin/emails?id=${id}`, {
        method: 'DELETE',
        headers: {
          'x-admin-secret': adminSecret,
        },
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to remove admin email');
      }
      
      toast.success(`${email} removed from admin list`);
      await fetchAdminEmails();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove admin email';
      toast.error(errorMessage);
    } finally {
      setDeletingId(null);
    }
  };

  // Auto-clear messages after 5 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950 text-white flex items-center justify-center px-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <motion.div 
            className="flex items-center gap-3 mb-8 justify-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <motion.div 
              className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30"
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <Shield className="w-6 h-6 text-white" />
            </motion.div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Admin Panel</h1>
              <p className="text-sm text-slate-400">Manage privileged access</p>
            </div>
          </motion.div>

          <motion.div 
            className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 shadow-2xl"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="flex items-center gap-2 mb-6">
              <Lock className="w-5 h-5 text-purple-400" />
              <h2 className="text-xl font-semibold">Authentication Required</h2>
            </div>

            <form onSubmit={handleAuthenticate} className="space-y-4">
              <div>
                <label htmlFor="adminSecret" className="block text-sm font-medium mb-2 text-slate-300">
                  Admin Secret Key
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    id="adminSecret"
                    type="password"
                    value={adminSecret}
                    onChange={(e) => setAdminSecret(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                    placeholder="Enter your admin secret"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Set ADMIN_SECRET in your environment variables
                </p>
              </div>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 p-3 rounded-lg border border-red-400/30"
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </motion.div>
              )}

              <motion.button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2 disabled:opacity-50"
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    <Shield className="w-5 h-5" />
                    Access Admin Panel
                  </>
                )}
              </motion.button>
            </form>

            <motion.div 
              className="mt-6 text-center text-sm text-slate-500"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Link href="/" className="text-purple-400 hover:text-purple-300 hover:underline">
                ← Back to Home
              </Link>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950 text-white px-6 py-12">
      <div className="max-w-4xl mx-auto">
        <motion.div 
          className="flex items-center gap-3 mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Admin Email Management</h1>
            <p className="text-slate-400">Grant unlimited free access to specific emails</p>
          </div>
        </motion.div>

        {/* Notifications */}
        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 p-4 rounded-xl border border-red-400/30 mb-6"
            >
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              {error}
              <button onClick={() => setError('')} className="ml-auto text-red-400/70 hover:text-red-400">×</button>
            </motion.div>
          )}
          {success && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-2 text-emerald-400 text-sm bg-emerald-400/10 p-4 rounded-xl border border-emerald-400/30 mb-6"
            >
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
              {success}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Add New Email Form */}
        <motion.div 
          className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 mb-8 shadow-2xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5 text-purple-400" />
            Add Admin Email
          </h2>
          <form onSubmit={handleAddEmail} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="newEmail" className="block text-sm font-medium mb-2 text-slate-300">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    id="newEmail"
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                    placeholder="user@example.com"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="newNote" className="block text-sm font-medium mb-2 text-slate-300">
                  Note (optional)
                </label>
                <input
                  id="newNote"
                  type="text"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                  placeholder="e.g. Founder, Beta tester"
                />
              </div>
            </div>
            <motion.button
              type="submit"
              disabled={addLoading}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-purple-500/25 flex items-center gap-2 disabled:opacity-50"
              whileHover={{ scale: addLoading ? 1 : 1.02 }}
              whileTap={{ scale: addLoading ? 1 : 0.98 }}
            >
              {addLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  Add Email
                </>
              )}
            </motion.button>
          </form>
        </motion.div>

        {/* Admin Emails List */}
        <motion.div 
          className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-2xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Mail className="w-5 h-5 text-purple-400" />
              Admin Emails
            </h2>
            <span className="text-sm text-slate-400 bg-slate-800 px-3 py-1 rounded-full">
              {adminEmails.length} {adminEmails.length === 1 ? 'email' : 'emails'}
            </span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
            </div>
          ) : adminEmails.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No admin emails yet</p>
              <p className="text-sm mt-1">Add your first admin email above</p>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {adminEmails.map((adminEmail, index) => (
                  <motion.div
                    key={adminEmail.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between p-4 bg-slate-800/50 border border-slate-700/50 rounded-xl hover:border-purple-500/30 transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg flex items-center justify-center border border-purple-500/30">
                        <Mail className="w-5 h-5 text-purple-400" />
                      </div>
                      <div>
                        <p className="font-medium text-white">{adminEmail.email}</p>
                        {adminEmail.note && (
                          <p className="text-sm text-slate-400">{adminEmail.note}</p>
                        )}
                        <p className="text-xs text-slate-500 mt-1">
                          Added {new Date(adminEmail.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <motion.button
                      onClick={() => handleDeleteEmail(adminEmail.id, adminEmail.email)}
                      disabled={deletingId === adminEmail.id}
                      className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      {deletingId === adminEmail.id ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Trash2 className="w-5 h-5" />
                      )}
                    </motion.button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>

        {/* Footer */}
        <motion.div 
          className="mt-8 text-center text-sm text-slate-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <p className="mb-2">
            Admin emails receive <span className="text-purple-400 font-medium">Enterprise-level access</span> for free.
          </p>
          <Link href="/dashboard" className="text-purple-400 hover:text-purple-300 hover:underline">
            Go to Dashboard →
          </Link>
        </motion.div>
      </div>
    </div>
  );
}

