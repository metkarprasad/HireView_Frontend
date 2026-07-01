import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { User, Mail, Lock, CheckCircle, AlertCircle, Award, Brain, Target } from 'lucide-react';

const Profile = () => {
  const { user, updateProfile, apiUrl } = useAuth();
  const [username, setUsername] = useState(user?.username || '');
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Status indicators
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Analytics
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (user) {
      setUsername(user.username);
      setEmail(user.email);
    }
  }, [user]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get(`${apiUrl}/interviews/analytics/dashboard`);
        setStats(res.data.summary);
      } catch (err) {
        console.error('Failed to load profile stats:', err);
      }
    };
    fetchStats();
  }, [apiUrl]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccess(false);

    if (password && password !== confirmPassword) {
      setErrorMsg('Passwords do not match');
      return;
    }

    setLoading(true);
    const res = await updateProfile(username, email, password || undefined);
    setLoading(false);

    if (res.success) {
      setSuccess(true);
      setPassword('');
      setConfirmPassword('');
      setTimeout(() => setSuccess(false), 4000);
    } else {
      setErrorMsg(res.message);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] dark:bg-darkBg bg-lightBg py-8 px-4 transition-colors duration-300">
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left Side: Stats Hero Card */}
        <div className="md:col-span-1 space-y-6">
          <div className="p-6 rounded-2xl border dark:border-darkBorder dark:bg-darkCard bg-white border-lightBorder text-center flex flex-col items-center">
            {/* User Avatar Circle */}
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center text-white text-3xl font-extrabold shadow-lg shadow-indigo-500/10 mb-4">
              {username ? username.charAt(0).toUpperCase() : 'C'}
            </div>
            
            <h3 className="text-lg font-bold dark:text-white text-slate-800">{username}</h3>
            <p className="text-xs dark:text-slate-400 text-slate-500">{email}</p>

            <div className="w-full border-t dark:border-darkBorder border-slate-100 my-4"></div>

            <div className="w-full space-y-4 text-left">
              <div className="flex justify-between items-center text-xs">
                <span className="dark:text-slate-400 text-slate-500 font-medium">Rank Tier:</span>
                <span className="text-indigo-400 font-bold">Candidate</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="dark:text-slate-400 text-slate-500 font-medium">Completed:</span>
                <span className="dark:text-slate-200 text-slate-800 font-semibold">{stats?.totalCompleted || 0} interviews</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="dark:text-slate-400 text-slate-500 font-medium">Avg Score:</span>
                <span className="text-emerald-400 font-bold">{stats?.averageScore || 0}%</span>
              </div>
            </div>
          </div>

          {/* Quick Metrics list */}
          <div className="p-5 rounded-2xl border dark:border-darkBorder dark:bg-darkCard bg-white border-lightBorder space-y-4">
            <h4 className="text-xs font-semibold dark:text-slate-400 text-slate-500 uppercase tracking-wider">
              Profile Badges
            </h4>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                  <Brain className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold dark:text-white text-slate-800">Mind Explorer</p>
                  <p className="text-[10px] dark:text-slate-400 text-slate-500">Attempted at least 1 interview</p>
                </div>
              </div>

              {stats?.averageScore >= 80 && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                    <Award className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold dark:text-white text-slate-800">Distinguished Master</p>
                    <p className="text-[10px] dark:text-slate-400 text-slate-500">Achieved a score &gt; 80%</p>
                  </div>
                </div>
              )}

              {stats?.totalCompleted >= 5 && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                    <Target className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold dark:text-white text-slate-800">Tenacious Candidate</p>
                    <p className="text-[10px] dark:text-slate-400 text-slate-500">Completed 5+ interview runs</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Profile Settings form */}
        <div className="md:col-span-2">
          <div className="p-6 md:p-8 rounded-2xl border dark:border-darkBorder dark:bg-darkCard bg-white border-lightBorder glow-indigo">
            <h2 className="text-xl font-bold dark:text-white text-slate-900 mb-6">
              Account Settings
            </h2>

            {errorMsg && (
              <div className="mb-6 p-4 rounded-xl flex items-start gap-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 rounded-xl flex items-start gap-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
                <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <span>Account settings successfully saved.</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium dark:text-slate-300 text-slate-700 mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center dark:text-slate-500 text-slate-400">
                      <User className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="block w-full pl-10 pr-4 py-2.5 rounded-xl border transition-all text-sm outline-none dark:bg-darkBg dark:border-darkBorder dark:text-white dark:focus:border-indigo-500 bg-white border-slate-200 text-slate-900 focus:border-indigo-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium dark:text-slate-300 text-slate-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center dark:text-slate-500 text-slate-400">
                      <Mail className="w-4 h-4" />
                    </span>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full pl-10 pr-4 py-2.5 rounded-xl border transition-all text-sm outline-none dark:bg-darkBg dark:border-darkBorder dark:text-white dark:focus:border-indigo-500 bg-white border-slate-200 text-slate-900 focus:border-indigo-600"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t dark:border-darkBorder border-slate-100 pt-6 space-y-6">
                <div>
                  <h4 className="text-sm font-bold dark:text-white text-slate-800">Change Password</h4>
                  <p className="text-xs dark:text-slate-400 text-slate-500 mt-0.5">Leave blank if you do not wish to update your password.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium dark:text-slate-300 text-slate-700 mb-2">
                      New Password
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center dark:text-slate-500 text-slate-400">
                        <Lock className="w-4 h-4" />
                      </span>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="block w-full pl-10 pr-4 py-2.5 rounded-xl border transition-all text-sm outline-none dark:bg-darkBg dark:border-darkBorder dark:text-white dark:focus:border-indigo-500 bg-white border-slate-200 text-slate-900 focus:border-indigo-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium dark:text-slate-300 text-slate-700 mb-2">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center dark:text-slate-500 text-slate-400">
                        <Lock className="w-4 h-4" />
                      </span>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="block w-full pl-10 pr-4 py-2.5 rounded-xl border transition-all text-sm outline-none dark:bg-darkBg dark:border-darkBorder dark:text-white dark:focus:border-indigo-500 bg-white border-slate-200 text-slate-900 focus:border-indigo-600"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end border-t dark:border-darkBorder border-slate-100 pt-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md shadow-indigo-600/20 hover:shadow-indigo-600/35 transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  ) : (
                    'Save Settings'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Profile;
