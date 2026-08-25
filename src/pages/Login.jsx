import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, ArrowRight, AlertCircle, ShieldAlert, CheckCircle2 } from 'lucide-react';

const Login = () => {
  const { login, loginWithToken, user, apiUrl } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    email: location.state?.verifiedEmail || '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  const [processingGoogle, setProcessingGoogle] = useState(() => {
    return new URLSearchParams(window.location.search).has('google_token');
  });

  // Auto-redirect if already logged in and no Google OAuth params are being processed
  useEffect(() => {
    const hasGoogleToken = location.search.includes('google_token');
    const hasError = location.search.includes('error');
    const isAuthed = user || localStorage.getItem('token');
    
    if (isAuthed && !hasGoogleToken && !hasError) {
      window.location.replace('/');
    }
  }, [user, location.search]);

  // Handle incoming Google OAuth redirects
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const googleToken = params.get('google_token');
    const userDataStr = params.get('user');
    const oauthError = params.get('error');

    if (googleToken) {
      setProcessingGoogle(true);
      let userData = null;
      if (userDataStr) {
        try {
          userData = JSON.parse(userDataStr);
        } catch {
          try {
            userData = JSON.parse(decodeURIComponent(userDataStr));
          } catch (e) {
            console.warn('Could not parse user param:', e);
          }
        }
      }

      // Fallback: decode user id directly from JWT payload if user object parsing had issues
      if (!userData) {
        try {
          const payloadBase64 = googleToken.split('.')[1];
          const decoded = JSON.parse(atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/')));
          userData = { id: decoded.id, email: '', username: 'Candidate' };
        } catch (e) {
          console.error('Failed to decode JWT token:', e);
        }
      }

      if (userData) {
        loginWithToken(googleToken, userData);
        window.location.replace('/');
        return;
      }
    }

    if (oauthError) {
      setProcessingGoogle(false);
      if (oauthError === 'google_cancelled') {
        setErrorMsg('Google sign-in was cancelled.');
      } else if (oauthError === 'google_not_configured') {
        setErrorMsg('Google sign-in is not yet configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.');
      } else {
        setErrorMsg('Unable to sign in with Google. Please try again.');
      }
    }
  }, [location.search, loginWithToken]);

  const handleGoogleLogin = () => {
    window.location.href = `${apiUrl}/auth/google`;
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setUnverifiedEmail('');

    const res = await login(formData.email, formData.password);
    setLoading(false);

    if (res.success) {
      navigate('/');
    } else {
      if (res.code === 'EMAIL_NOT_VERIFIED') {
        setUnverifiedEmail(res.email || formData.email);
      }
      setErrorMsg(res.message);
    }
  };

  if (processingGoogle) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center px-4 dark:bg-darkBg bg-lightBg transition-colors duration-300">
        <div className="relative w-16 h-16 mb-4">
          <div className="absolute top-0 left-0 w-full h-full border-4 border-indigo-500/20 rounded-full"></div>
          <div className="absolute top-0 left-0 w-full h-full border-4 border-t-indigo-500 rounded-full animate-spin"></div>
        </div>
        <h3 className="text-xl font-bold dark:text-white text-slate-800">Signing in with Google...</h3>
        <p className="text-sm dark:text-slate-400 text-slate-500 mt-2">Setting up your session</p>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 dark:bg-darkBg bg-lightBg transition-colors duration-300">
      <div className="w-full max-w-md p-8 rounded-2xl shadow-xl border dark:border-darkBorder dark:bg-darkCard bg-white border-lightBorder transition-all duration-300">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold tracking-tight dark:text-white text-slate-900">
            Welcome Back
          </h2>
          <p className="mt-2 text-sm dark:text-slate-400 text-slate-500">
            Sign in to continue your interview preparation
          </p>
        </div>

        {location.state?.verifiedEmail && !errorMsg && (
          <div className="mb-6 p-4 rounded-xl flex items-start gap-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
            <span>Email verified successfully! You can now sign in with your credentials.</span>
          </div>
        )}

        {unverifiedEmail ? (
          <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-500 text-sm space-y-3">
            <div className="flex items-start gap-2.5">
              <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5 text-amber-500" />
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">Email Verification Required</p>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                  Your account requires email verification before you can sign in.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate('/verify-email', { state: { email: unverifiedEmail } })}
              className="w-full py-2 px-3 rounded-lg text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 transition-colors shadow-sm"
            >
              Verify Email Now
            </button>
          </div>
        ) : errorMsg ? (
          <div className="mb-6 p-4 rounded-xl flex items-start gap-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        ) : null}

        {/* Google OAuth Sign-In Button */}
        <button
          type="button"
          onClick={handleGoogleLogin}
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
          <span>Continue with Google</span>
        </button>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t dark:border-darkBorder border-slate-200"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="dark:bg-darkCard bg-white px-3 text-slate-400 font-semibold tracking-wider">
              Or continue with email
            </span>
          </div>
        </div>

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
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium dark:text-slate-300 text-slate-700">
                Password<span className="text-red-500 font-bold ml-1 cursor-help" title="This field is required">*</span>
              </label>
              <Link
                to="/forgot-password"
                className="text-xs font-semibold text-indigo-500 hover:text-indigo-400 transition-colors"
              >
                Forgot Password?
              </Link>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center dark:text-slate-500 text-slate-400">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type="password"
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
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
                Sign In
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center border-t dark:border-darkBorder border-slate-100 pt-6">
          <p className="text-sm dark:text-slate-400 text-slate-500">
            Don't have an account?{' '}
            <Link
              to="/signup"
              className="font-semibold text-indigo-500 hover:text-indigo-400 transition-colors"
            >
              Sign up free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
