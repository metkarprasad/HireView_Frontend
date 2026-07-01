import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Lock, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    
    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      await axios.put(`${API_URL}/auth/resetpassword/${token}`, { password });
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to reset password. Token may be expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 dark:bg-darkBg bg-lightBg transition-colors duration-300">
      <div className="w-full max-w-md p-8 rounded-2xl shadow-xl border dark:border-darkBorder dark:bg-darkCard bg-white border-lightBorder transition-all duration-300">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold tracking-tight dark:text-white text-slate-900">
            Reset Password
          </h2>
          <p className="mt-2 text-sm dark:text-slate-400 text-slate-500">
            Create a secure new password for your account
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl flex items-start gap-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {success ? (
          <div className="space-y-4 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold dark:text-white text-slate-900">Password Reset Successful</h3>
            <p className="text-sm dark:text-slate-400 text-slate-500">
              Your password has been updated. Redirecting you to login...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
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
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-4 py-3 rounded-xl border transition-all text-sm outline-none dark:bg-darkBg dark:border-darkBorder dark:text-white dark:focus:border-indigo-500 bg-white border-slate-200 text-slate-900 focus:border-indigo-600"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium dark:text-slate-300 text-slate-700 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center dark:text-slate-500 text-slate-400">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="block w-full pl-10 pr-4 py-3 rounded-xl border transition-all text-sm outline-none dark:bg-darkBg dark:border-darkBorder dark:text-white dark:focus:border-indigo-500 bg-white border-slate-200 text-slate-900 focus:border-indigo-600"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              ) : (
                <>
                  Change Password
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
