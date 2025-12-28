'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Loader2, 
  Key, 
  AlertCircle, 
  Lock, 
  Mail, 
  Calendar,
  Shield,
  Crown,
  Sparkles,
  UserCheck,
  UserX,
  TrendingUp,
  Search
} from 'lucide-react';
import Link from 'next/link';

interface User {
  id: string;
  email: string;
  name: string | null;
  provider: string | null;
  email_verified: boolean;
  plan: string | null;
  subscription_status: string | null;
  created_at: string;
  updated_at: string;
}

interface Stats {
  verified_count: string;
  google_users: string;
  email_users: string;
  free_users: string;
  pro_users: string;
  enterprise_users: string;
  new_this_week: string;
  new_this_month: string;
}

export default function AdminUsersPage() {
  const [adminSecret, setAdminSecret] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlan, setFilterPlan] = useState<string>('all');
  const [filterProvider, setFilterProvider] = useState<string>('all');

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/admin/users', {
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
        throw new Error('Failed to fetch users');
      }
      
      const data = await response.json();
      setUsers(data.users);
      setFilteredUsers(data.users);
      setTotal(data.total);
      setStats(data.stats);
      setIsAuthenticated(true);
    } catch (err) {
      setError('Failed to fetch users');
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
    await fetchUsers();
  };

  // Filter users when search or filters change
  useEffect(() => {
    let filtered = users;
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(user => 
        user.email.toLowerCase().includes(term) ||
        (user.name && user.name.toLowerCase().includes(term))
      );
    }
    
    if (filterPlan !== 'all') {
      filtered = filtered.filter(user => {
        if (filterPlan === 'free') {
          return !user.plan || user.plan === 'free';
        }
        return user.plan === filterPlan;
      });
    }
    
    if (filterProvider !== 'all') {
      filtered = filtered.filter(user => {
        if (filterProvider === 'email') {
          return !user.provider || user.provider === 'credentials';
        }
        return user.provider === filterProvider;
      });
    }
    
    setFilteredUsers(filtered);
  }, [searchTerm, filterPlan, filterProvider, users]);

  const getPlanBadge = (plan: string | null) => {
    switch (plan) {
      case 'enterprise':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-500/20 text-purple-300 text-xs rounded-full border border-purple-500/30">
            <Crown className="w-3 h-3" />
            Enterprise
          </span>
        );
      case 'pro':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-500/20 text-amber-300 text-xs rounded-full border border-amber-500/30">
            <Sparkles className="w-3 h-3" />
            Pro
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-500/20 text-slate-400 text-xs rounded-full border border-slate-500/30">
            Free
          </span>
        );
    }
  };

  const getProviderIcon = (provider: string | null) => {
    if (provider === 'google') {
      return (
        <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center" title="Google">
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
        </div>
      );
    }
    return (
      <div className="w-6 h-6 bg-slate-700 rounded-full flex items-center justify-center" title="Email/Password">
        <Mail className="w-3 h-3 text-slate-400" />
      </div>
    );
  };

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
              className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30"
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <Users className="w-6 h-6 text-white" />
            </motion.div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Registered Users</h1>
              <p className="text-sm text-slate-400">View all registered users</p>
            </div>
          </motion.div>

          <motion.div 
            className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 shadow-2xl"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="flex items-center gap-2 mb-6">
              <Lock className="w-5 h-5 text-emerald-400" />
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
                    className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
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
                className="w-full px-6 py-3 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 disabled:opacity-50"
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
                    <Users className="w-5 h-5" />
                    View Users
                  </>
                )}
              </motion.button>
            </form>

            <motion.div 
              className="mt-6 text-center text-sm text-slate-500 space-y-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Link href="/admin/emails" className="text-purple-400 hover:text-purple-300 hover:underline block">
                Manage Admin Emails →
              </Link>
              <Link href="/" className="text-slate-400 hover:text-slate-300 hover:underline block">
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
      <div className="max-w-6xl mx-auto">
        <motion.div 
          className="flex items-center justify-between mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Registered Users</h1>
              <p className="text-slate-400">View and manage all registered users</p>
            </div>
          </div>
          <Link 
            href="/admin/emails"
            className="flex items-center gap-2 px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 rounded-xl text-purple-300 transition-all"
          >
            <Shield className="w-4 h-4" />
            Admin Emails
          </Link>
        </motion.div>

        {/* Stats Cards */}
        {stats && (
          <motion.div 
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
                <Users className="w-4 h-4" />
                Total Users
              </div>
              <p className="text-2xl font-bold text-white">{total}</p>
            </div>
            <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-emerald-400 text-sm mb-1">
                <UserCheck className="w-4 h-4" />
                Verified
              </div>
              <p className="text-2xl font-bold text-white">{stats.verified_count}</p>
            </div>
            <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-amber-400 text-sm mb-1">
                <Sparkles className="w-4 h-4" />
                Pro Users
              </div>
              <p className="text-2xl font-bold text-white">{stats.pro_users}</p>
            </div>
            <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-cyan-400 text-sm mb-1">
                <TrendingUp className="w-4 h-4" />
                This Week
              </div>
              <p className="text-2xl font-bold text-white">{stats.new_this_week}</p>
            </div>
          </motion.div>
        )}

        {/* Filters */}
        <motion.div 
          className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-xl p-4 mb-6 flex flex-wrap gap-4 items-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search by email or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg focus:outline-none focus:border-emerald-500 text-sm"
              />
            </div>
          </div>
          <select
            value={filterPlan}
            onChange={(e) => setFilterPlan(e.target.value)}
            className="px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg focus:outline-none focus:border-emerald-500 text-sm"
          >
            <option value="all">All Plans</option>
            <option value="free">Free</option>
            <option value="pro">Pro</option>
            <option value="enterprise">Enterprise</option>
          </select>
          <select
            value={filterProvider}
            onChange={(e) => setFilterProvider(e.target.value)}
            className="px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg focus:outline-none focus:border-emerald-500 text-sm"
          >
            <option value="all">All Providers</option>
            <option value="email">Email/Password</option>
            <option value="google">Google</option>
          </select>
          <span className="text-sm text-slate-400">
            Showing {filteredUsers.length} of {total}
          </span>
        </motion.div>

        {/* Error */}
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
        </AnimatePresence>

        {/* Users Table */}
        <motion.div 
          className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-20 text-slate-400">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No users found</p>
              {searchTerm && <p className="text-sm mt-1">Try adjusting your search</p>}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-800/50 border-b border-slate-700/50">
                  <tr>
                    <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">User</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">Provider</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">Plan</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">Status</th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-slate-400">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  <AnimatePresence>
                    {filteredUsers.map((user, index) => (
                      <motion.tr
                        key={user.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: index * 0.02 }}
                        className="hover:bg-slate-800/30 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 rounded-full flex items-center justify-center border border-emerald-500/30 text-emerald-400 font-medium">
                              {(user.name || user.email)[0].toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-white">{user.name || 'No name'}</p>
                              <p className="text-sm text-slate-400">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {getProviderIcon(user.provider)}
                        </td>
                        <td className="px-6 py-4">
                          {getPlanBadge(user.plan)}
                        </td>
                        <td className="px-6 py-4">
                          {user.email_verified ? (
                            <span className="inline-flex items-center gap-1 text-emerald-400 text-sm">
                              <UserCheck className="w-4 h-4" />
                              Verified
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-amber-400 text-sm">
                              <UserX className="w-4 h-4" />
                              Unverified
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-sm text-slate-400">
                            <Calendar className="w-4 h-4" />
                            {new Date(user.created_at).toLocaleDateString()}
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
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
          <Link href="/dashboard" className="text-emerald-400 hover:text-emerald-300 hover:underline">
            Go to Dashboard →
          </Link>
        </motion.div>
      </div>
    </div>
  );
}

