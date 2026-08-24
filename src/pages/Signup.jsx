import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, User, ArrowRight, AlertCircle } from 'lucide-react';

const Signup = () => {
  const { register, apiUrl } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleGoogleSignup = () => {
    window.location.href = `${apiUrl}/auth/google`;
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const res = await register(formData.username, formData.email, formData.password);
    setLoading(false);

    if (res.success) {
      if (res.requiresVerification) {
        navigate('/verify-email', {
          state: {
            email: formData.email,
            username: formData.username,
          },
        });
      } else {
        navigate('/');
      }
    } else {
      setErrorMsg(res.message);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 dark:bg-darkBg bg-lightBg transition-colors duration-300">
      <div className="w-full max-w-md p-8 rounded-2xl shadow-xl border dark:border-darkBorder dark:bg-darkCard bg-white border-lightBorder transition-all duration-300">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold tracking-tight dark:text-white text-slate-900">
            Create Account
          </h2>
          <p className="mt-2 text-sm dark:text-slate-400 text-slate-500">
            Start preparing for your dream interview today
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl flex items-start gap-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Google OAuth Sign-Up Button */}
        <button
          type="button"
          onClick={handleGoogleSignup}
          className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border font-semibold text-sm transition-all duration-200 shadow-sm dark:bg-darkBg dark:border-darkBorder dark:text-slate-200 dark:hover:bg-slate-800/80 dark:hover:border-slate-700 bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300"
        >
          <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
            />
          </svg>
          <span>Sign up with Google</span>
        </button>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t dark:border-darkBorder border-slate-200"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="dark:bg-darkCard bg-white px-3 text-slate-400 font-semibold tracking-wider">
              Or register with email
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium dark:text-slate-300 text-slate-700 mb-2">
              Full Name<span className="text-red-500 font-bold ml-1 cursor-help" title="This field is required">*</span>
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center dark:text-slate-500 text-slate-400">
                <User className="w-4 h-4" />
              </span>
              <input
                type="text"
                name="username"
                required
                value={formData.username}
                onChange={handleChange}
                className="block w-full pl-10 pr-4 py-3 rounded-xl border transition-all text-sm outline-none dark:bg-darkBg dark:border-darkBorder dark:text-white dark:focus:border-indigo-500 bg-white border-slate-200 text-slate-900 focus:border-indigo-600"
                placeholder="John Doe"
              />
            </div>
          </div>

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
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="block w-full pl-10 pr-4 py-3 rounded-xl border transition-all text-sm outline-none dark:bg-darkBg dark:border-darkBorder dark:text-white dark:focus:border-indigo-500 bg-white border-slate-200 text-slate-900 focus:border-indigo-600"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium dark:text-slate-300 text-slate-700 mb-2">
              Password<span className="text-red-500 font-bold ml-1 cursor-help" title="This field is required">*</span>
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center dark:text-slate-500 text-slate-400">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type="password"
                name="password"
                required
                minLength={6}
                value={formData.password}
                onChange={handleChange}
                className="block w-full pl-10 pr-4 py-3 rounded-xl border transition-all text-sm outline-none dark:bg-darkBg dark:border-darkBorder dark:text-white dark:focus:border-indigo-500 bg-white border-slate-200 text-slate-900 focus:border-indigo-600"
                placeholder="•••••••• (min 6 characters)"
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
                Create Free Account
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center border-t dark:border-darkBorder border-slate-100 pt-6">
          <p className="text-sm dark:text-slate-400 text-slate-500">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-semibold text-indigo-500 hover:text-indigo-400 transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
