import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Mail, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [demoToken, setDemoToken] = useState('');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5635/api';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccess(false);

    try {
      const res = await axios.post(`${API_URL}/auth/forgotpassword`, { email });
      setSuccess(true);
      if (res.data.resetToken) {
        setDemoToken(res.data.resetToken);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Something went wrong. Please check your email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 dark:bg-darkBg bg-lightBg transition-colors duration-300">
      <div className="w-full max-w-md p-8 rounded-2xl shadow-xl border dark:border-darkBorder dark:bg-darkCard bg-white border-lightBorder transition-all duration-300">
        <div className="mb-6">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-indigo-500 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Sign In
          </Link>
        </div>

        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold tracking-tight dark:text-white text-slate-900">
            Forgot Password
          </h2>
          <p className="mt-2 text-sm dark:text-slate-400 text-slate-500">
            Enter your email and we'll help you reset it
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl flex items-start gap-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {success ? (
          <div className="space-y-6">
            <div className="p-4 rounded-xl flex items-start gap-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Reset Link Generated</p>
                <p className="mt-1 opacity-90">For local demonstration purposes, you can follow the token link below to reset your password directly:</p>
              </div>
            </div>
            {demoToken && (
              <div className="p-4 rounded-xl dark:bg-darkBg border dark:border-darkBorder bg-slate-50 border-slate-100 flex flex-col gap-2">
                <span className="text-xs font-mono break-all text-slate-500 dark:text-slate-400">
                  Reset Token: {demoToken}
                </span>
                <Link
                  to={`/reset-password/${demoToken}`}
                  className="w-full text-center py-2 px-3 bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/25 rounded-lg text-xs font-semibold transition-all"
                >
                  Go to Reset Password Screen
                </Link>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium dark:text-slate-300 text-slate-700 mb-2">
                Email Address<span className="text-red-500 font-bold ml-1 cursor-help" title="This field is required">*</span>
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
                  className="block w-full pl-10 pr-4 py-3 rounded-xl border transition-all text-sm outline-none dark:bg-darkBg dark:border-darkBorder dark:text-white dark:focus:border-indigo-500 bg-white border-slate-200 text-slate-900 focus:border-indigo-600"
                  placeholder="you@example.com"
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
                'Request Reset Link'
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
