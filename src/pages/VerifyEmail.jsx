import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Mail, ArrowRight, RefreshCw, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';

const VerifyEmail = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { verifyOtp, resendOtp } = useAuth();

  const [email, setEmail] = useState(location.state?.email || '');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isVerified, setIsVerified] = useState(false);

  // Cooldown countdown in seconds (initial 60s if newly arrived from signup)
  const [cooldown, setCooldown] = useState(60);

  // Expiration countdown in seconds (10 minutes = 600s)
  const [expiresIn, setExpiresIn] = useState(600);

  const inputRefs = useRef([]);

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Expiration timer
  useEffect(() => {
    if (expiresIn <= 0) return;
    const timer = setInterval(() => {
      setExpiresIn((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [expiresIn]);

  const handleDigitChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newDigits = [...otpDigits];
    
    // Handle paste event of multi-character string
    if (value.length > 1) {
      const pasted = value.slice(0, 6).split('');
      for (let i = 0; i < 6; i++) {
        newDigits[i] = pasted[i] || '';
      }
      setOtpDigits(newDigits);
      const nextIndex = Math.min(pasted.length, 5);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    newDigits[index] = value;
    setOtpDigits(newDigits);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').trim();
    if (/^\d{1,6}$/.test(pasteData)) {
      const pasted = pasteData.slice(0, 6).split('');
      const newDigits = ['', '', '', '', '', ''];
      pasted.forEach((char, idx) => {
        newDigits[idx] = char;
      });
      setOtpDigits(newDigits);
      const targetFocus = Math.min(pasted.length, 5);
      inputRefs.current[targetFocus]?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const fullOtp = otpDigits.join('').trim();
    if (!email.trim()) {
      setErrorMsg('Please provide your email address.');
      return;
    }
    if (fullOtp.length !== 6) {
      setErrorMsg('Please enter all 6 digits of the verification code.');
      return;
    }

    setLoading(true);
    const res = await verifyOtp(email.trim(), fullOtp, 'EMAIL_VERIFICATION');
    setLoading(false);

    if (res.success) {
      setIsVerified(true);
      setSuccessMsg(res.message || 'Email verified successfully! Redirecting to login...');
      setTimeout(() => {
        navigate('/login', { state: { verifiedEmail: email } });
      }, 2500);
    } else {
      setErrorMsg(res.message || 'Invalid or expired verification code.');
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || resending) return;

    if (!email.trim()) {
      setErrorMsg('Please provide your email address to resend the code.');
      return;
    }

    setErrorMsg('');
    setSuccessMsg('');
    setResending(true);

    const res = await resendOtp(email.trim(), 'EMAIL_VERIFICATION');
    setResending(false);

    if (res.success) {
      setSuccessMsg('A new 6-digit verification code has been sent to your email.');
      setCooldown(60);
      setExpiresIn(600);
      setOtpDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } else {
      if (res.retryAfter) {
        setCooldown(res.retryAfter);
      }
      setErrorMsg(res.message || 'Failed to resend code.');
    }
  };

  const formatExpiresTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 dark:bg-darkBg bg-lightBg transition-colors duration-300">
      <div className="w-full max-w-md p-8 rounded-2xl shadow-xl border dark:border-darkBorder dark:bg-darkCard bg-white border-lightBorder transition-all duration-300">
        
        <div className="mb-6">
          <Link
            to="/signup"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-indigo-500 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Sign Up
          </Link>
        </div>

        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight dark:text-white text-slate-900">
            Verify Your Email
          </h2>
          <p className="mt-2 text-sm dark:text-slate-400 text-slate-500">
            We sent a 6-digit code to{' '}
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {email || 'your email'}
            </span>
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl flex items-start gap-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-4 rounded-xl flex items-start gap-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {isVerified ? (
          <div className="text-center py-6 space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto animate-bounce">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold dark:text-white text-slate-900">Account Activated!</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Redirecting you to sign in...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {!location.state?.email && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider dark:text-slate-300 text-slate-700 mb-2">
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
                    className="block w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm outline-none dark:bg-darkBg dark:border-darkBorder dark:text-white dark:focus:border-indigo-500 bg-white border-slate-200 text-slate-900 focus:border-indigo-600"
                    placeholder="you@example.com"
                  />
                </div>
              </div>
            )}

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-semibold uppercase tracking-wider dark:text-slate-300 text-slate-700">
                  Verification Code
                </label>
                <span className="text-xs font-mono text-slate-400">
                  Expires in: <strong className="text-indigo-400">{formatExpiresTime(expiresIn)}</strong>
                </span>
              </div>

              {/* 6 Digit Inputs */}
              <div className="flex justify-between gap-2" onPaste={handlePaste}>
                {otpDigits.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleDigitChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-12 h-14 text-center text-xl font-bold font-mono rounded-xl border transition-all outline-none dark:bg-darkBg dark:border-darkBorder dark:text-white dark:focus:border-indigo-500 dark:focus:ring-1 dark:focus:ring-indigo-500 bg-white border-slate-200 text-slate-900 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 shadow-sm"
                  />
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || otpDigits.join('').length !== 6}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              ) : (
                <>
                  Verify Email
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="text-center pt-2">
              <p className="text-xs dark:text-slate-400 text-slate-500">
                Didn't receive the code?{' '}
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={cooldown > 0 || resending}
                  className="font-semibold text-indigo-500 hover:text-indigo-400 transition-colors disabled:text-slate-400 disabled:cursor-not-allowed inline-flex items-center gap-1"
                >
                  {resending ? (
                    'Sending...'
                  ) : cooldown > 0 ? (
                    `Resend in ${cooldown}s`
                  ) : (
                    <>
                      <RefreshCw className="w-3 h-3" /> Resend Code
                    </>
                  )}
                </button>
              </p>
            </div>
          </form>
        )}

        <div className="mt-8 text-center border-t dark:border-darkBorder border-slate-100 pt-6">
          <p className="text-sm dark:text-slate-400 text-slate-500">
            Already verified?{' '}
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

export default VerifyEmail;
