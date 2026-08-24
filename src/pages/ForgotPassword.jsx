import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, ArrowRight, ArrowLeft, CheckCircle2, AlertCircle, RefreshCw, KeyRound, ShieldCheck } from 'lucide-react';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { forgotPassword, verifyOtp, resetPassword, resendOtp } = useAuth();

  // Current step in the recovery wizard: 1 = Email, 2 = Verify OTP, 3 = New Password, 4 = Success
  const [step, setStep] = useState(1);

  const [email, setEmail] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [cooldown, setCooldown] = useState(0);
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

  // Expiration countdown
  useEffect(() => {
    if (step !== 2 || expiresIn <= 0) return;
    const timer = setInterval(() => {
      setExpiresIn((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [step, expiresIn]);

  // Handle Step 1: Send OTP to Email
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!email.trim()) {
      setErrorMsg('Please enter your email address.');
      return;
    }

    setLoading(true);
    const res = await forgotPassword(email.trim());
    setLoading(false);

    if (res.success) {
      setStep(2);
      setCooldown(60);
      setExpiresIn(600);
      setSuccessMsg('A 6-digit verification code has been sent to your email.');
    } else {
      if (res.retryAfter) {
        setCooldown(res.retryAfter);
      }
      setErrorMsg(res.message);
    }
  };

  // Handle OTP digit changes
  const handleDigitChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newDigits = [...otpDigits];
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

  // Handle Step 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const fullOtp = otpDigits.join('').trim();
    if (fullOtp.length !== 6) {
      setErrorMsg('Please enter the complete 6-digit code.');
      return;
    }

    setLoading(true);
    const res = await verifyOtp(email.trim(), fullOtp, 'FORGOT_PASSWORD');
    setLoading(false);

    if (res.success && res.resetToken) {
      setResetToken(res.resetToken);
      setStep(3);
      setSuccessMsg('Code verified! Please choose a secure new password.');
    } else {
      setErrorMsg(res.message || 'Invalid or expired verification code.');
    }
  };

  // Handle Resend OTP in Step 2
  const handleResendOtp = async () => {
    if (cooldown > 0 || resending) return;
    setErrorMsg('');
    setSuccessMsg('');
    setResending(true);

    const res = await resendOtp(email.trim(), 'FORGOT_PASSWORD');
    setResending(false);

    if (res.success) {
      setSuccessMsg('A new reset code has been sent to your email.');
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

  // Handle Step 3: Set New Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (newPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setLoading(true);
    const res = await resetPassword(resetToken, newPassword);
    setLoading(false);

    if (res.success) {
      setStep(4);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } else {
      setErrorMsg(res.message || 'Failed to reset password.');
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
        
        <div className="mb-6 flex justify-between items-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-indigo-500 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Sign In
          </Link>
          
          {step < 4 && (
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full dark:bg-slate-800 bg-slate-100 text-slate-500 font-mono">
              Step {step} of 3
            </span>
          )}
        </div>

        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 flex items-center justify-center mx-auto mb-4">
            {step === 1 && <Mail className="w-7 h-7" />}
            {step === 2 && <ShieldCheck className="w-7 h-7" />}
            {step === 3 && <KeyRound className="w-7 h-7" />}
            {step === 4 && <CheckCircle2 className="w-7 h-7 text-emerald-500" />}
          </div>

          <h2 className="text-2xl font-extrabold tracking-tight dark:text-white text-slate-900">
            {step === 1 && 'Forgot Password'}
            {step === 2 && 'Enter Verification Code'}
            {step === 3 && 'Set New Password'}
            {step === 4 && 'Password Reset Complete'}
          </h2>

          <p className="mt-2 text-sm dark:text-slate-400 text-slate-500">
            {step === 1 && "Enter your email address to receive a 6-digit recovery code"}
            {step === 2 && (
              <>
                Code sent to <span className="font-semibold text-slate-800 dark:text-slate-200">{email}</span>
              </>
            )}
            {step === 3 && "Create a secure new password for your account"}
            {step === 4 && "Your password has been successfully updated"}
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl flex items-start gap-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && step !== 4 && (
          <div className="mb-6 p-4 rounded-xl flex items-start gap-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* STEP 1: Enter Email */}
        {step === 1 && (
          <form onSubmit={handleRequestOtp} className="space-y-6">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider dark:text-slate-300 text-slate-700 mb-2">
                Email Address<span className="text-red-500 font-bold ml-1">*</span>
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
                  className="block w-full pl-10 pr-4 py-3 rounded-xl border text-sm outline-none dark:bg-darkBg dark:border-darkBorder dark:text-white dark:focus:border-indigo-500 bg-white border-slate-200 text-slate-900 focus:border-indigo-600"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              ) : (
                <>
                  Send Recovery Code
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* STEP 2: Verify OTP */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-semibold uppercase tracking-wider dark:text-slate-300 text-slate-700">
                  6-Digit Recovery Code
                </label>
                <span className="text-xs font-mono text-slate-400">
                  Expires in: <strong className="text-indigo-400">{formatExpiresTime(expiresIn)}</strong>
                </span>
              </div>

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
                    className="w-12 h-14 text-center text-xl font-bold font-mono rounded-xl border transition-all outline-none dark:bg-darkBg dark:border-darkBorder dark:text-white dark:focus:border-indigo-500 bg-white border-slate-200 text-slate-900 focus:border-indigo-600 shadow-sm"
                  />
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || otpDigits.join('').length !== 6}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              ) : (
                <>
                  Verify Code
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="text-center pt-2">
              <p className="text-xs dark:text-slate-400 text-slate-500">
                Didn't receive the code?{' '}
                <button
                  type="button"
                  onClick={handleResendOtp}
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

        {/* STEP 3: Set New Password */}
        {step === 3 && (
          <form onSubmit={handleResetPassword} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider dark:text-slate-300 text-slate-700 mb-2">
                New Password<span className="text-red-500 font-bold ml-1">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center dark:text-slate-500 text-slate-400">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="block w-full pl-10 pr-4 py-3 rounded-xl border text-sm outline-none dark:bg-darkBg dark:border-darkBorder dark:text-white dark:focus:border-indigo-500 bg-white border-slate-200 text-slate-900 focus:border-indigo-600"
                  placeholder="•••••••• (min 6 characters)"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider dark:text-slate-300 text-slate-700 mb-2">
                Confirm Password<span className="text-red-500 font-bold ml-1">*</span>
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
                  className="block w-full pl-10 pr-4 py-3 rounded-xl border text-sm outline-none dark:bg-darkBg dark:border-darkBorder dark:text-white dark:focus:border-indigo-500 bg-white border-slate-200 text-slate-900 focus:border-indigo-600"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              ) : (
                <>
                  Update Password
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* STEP 4: Success */}
        {step === 4 && (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold dark:text-white text-slate-900">Password Changed!</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Your password has been updated successfully. Redirecting you to the sign in page...
            </p>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-xs font-bold text-indigo-500 hover:text-indigo-400"
            >
              Sign In Now <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

      </div>
    </div>
  );
};

export default ForgotPassword;

