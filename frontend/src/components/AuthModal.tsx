import React, { useState } from 'react';
import {
  LayoutDashboard,
  Lock,
  Mail,
  Store,
  User,
  KeyRound,
  ArrowLeft,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import {
  loginUser,
  registerBusiness,
  verifyEmail,
  resendVerificationCode,
  requestForgotPassword,
  resetPassword,
  type AuthUser,
} from '../services/api';

interface AuthModalProps {
  onSuccess: (user: AuthUser) => void;
}

type AuthMode = 'login' | 'register' | 'verify-email' | 'forgot-password' | 'reset-password';

export const AuthModal: React.FC<AuthModalProps> = ({ onSuccess }) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [ownerFullName, setOwnerFullName] = useState('');
  const [country, setCountry] = useState('South Africa');
  const [currency, setCurrency] = useState('ZAR');

  // OTP Verification & Password Reset Fields
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resending, setResending] = useState(false);

  // 1. Handle Sign In & Registration
  const handleSubmitAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      if (mode === 'register') {
        const res = await registerBusiness({
          businessName,
          currency,
          country,
          industry: 'Retail',
          ownerFullName,
          email,
          password,
        });

        if (!res.isEmailVerified) {
          setMode('verify-email');
          setSuccessMsg(`We sent a 6-digit verification code to ${email}`);
          return;
        }

        localStorage.setItem('afribiz_token', res.token);
        localStorage.setItem('afribiz_user', JSON.stringify(res));
        onSuccess(res);
      } else {
        const res = await loginUser({ email, password });
        localStorage.setItem('afribiz_token', res.token);
        localStorage.setItem('afribiz_user', JSON.stringify(res));
        onSuccess(res);
      }
    } catch (err: any) {
      if (err.response?.status === 403 && err.response?.data?.message === 'EmailNotVerified') {
        setMode('verify-email');
        setSuccessMsg(`Your email is not verified yet. Enter the 6-digit code sent to ${email}`);
      } else {
        setErrorMsg(
          err.response?.data?.message ||
          'Authentication failed. Please verify your credentials or network.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // 2. Handle 6-Digit Email Verification
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (verificationCode.length !== 6) {
      setErrorMsg('Please enter the complete 6-digit code.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const user = await verifyEmail({ email, code: verificationCode });
      localStorage.setItem('afribiz_token', user.token);
      localStorage.setItem('afribiz_user', JSON.stringify(user));
      onSuccess(user);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Invalid or expired code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Resend Code
  const handleResendCode = async () => {
    setResending(true);
    setErrorMsg(null);
    try {
      await resendVerificationCode(email);
      setSuccessMsg('A fresh 6-digit code has been dispatched to your email.');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to resend code.');
    } finally {
      setResending(false);
    }
  };

  // 4. Request Forgot Password Code
  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await requestForgotPassword(email);
      setMode('reset-password');
      setSuccessMsg(`A 6-digit recovery code was sent to ${email}`);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to process request.');
    } finally {
      setLoading(false);
    }
  };

  // 5. Submit New Password with Code
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (verificationCode.length !== 6) {
      setErrorMsg('Please enter the 6-digit recovery code.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      await resetPassword({
        email,
        code: verificationCode,
        newPassword,
      });
      setMode('login');
      setPassword('');
      setVerificationCode('');
      setSuccessMsg('Password updated successfully! Please sign in with your new password.');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 select-none">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 border border-slate-100 animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex p-3 rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-600/30 mb-3">
            <LayoutDashboard className="h-7 w-7" />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900">
            AfriBiz <span className="text-indigo-600 font-light">Insights</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {mode === 'verify-email'
              ? 'Enter the 6-digit code sent to your email'
              : mode === 'forgot-password'
              ? 'Reset your store owner password'
              : mode === 'reset-password'
              ? 'Enter recovery code and choose new password'
              : mode === 'register'
              ? 'Onboard your African business to start automated intelligence'
              : 'Sign in to access your business telemetry'}
          </p>
        </div>

        {/* Notifications */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════ */}
        {/* SCREEN 1 & 2: LOGIN / REGISTER                            */}
        {/* ══════════════════════════════════════════════════════════ */}
        {(mode === 'login' || mode === 'register') && (
          <form onSubmit={handleSubmitAuth} className="space-y-3.5 text-xs">
            {mode === 'register' && (
              <>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Business / Store Name</label>
                  <div className="relative">
                    <Store className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Durban Coastal Apparel"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Owner Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Thabo Mthembu"
                      value={ownerFullName}
                      onChange={(e) => setOwnerFullName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Country</label>
                    <select
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-600 font-medium"
                    >
                      <option value="South Africa">South Africa</option>
                      <option value="Kenya">Kenya</option>
                      <option value="Nigeria">Nigeria</option>
                      <option value="Ghana">Ghana</option>
                      <option value="Tanzania">Tanzania</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Currency</label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-600 font-bold"
                    >
                      <option value="ZAR">ZAR (R)</option>
                      <option value="KES">KES (KSh)</option>
                      <option value="NGN">NGN (₦)</option>
                      <option value="GHS">GHS (GH₵)</option>
                      <option value="USD">USD ($)</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="font-bold text-slate-700 block mb-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="name@business.co.za"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-600"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="font-bold text-slate-700">Password</label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot-password');
                      setErrorMsg(null);
                      setSuccessMsg(null);
                    }}
                    className="text-[11px] text-indigo-600 hover:underline font-bold"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-600"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow-md shadow-indigo-600/20 disabled:bg-indigo-300 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <span>{mode === 'register' ? 'Register & Send 6-Digit Code' : 'Sign In to Dashboard'}</span>
              )}
            </button>

            {/* Toggle Login / Register */}
            <div className="pt-2 text-center text-xs text-slate-500">
              {mode === 'register' ? (
                <p>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setErrorMsg(null);
                      setSuccessMsg(null);
                    }}
                    className="font-bold text-indigo-600 hover:underline cursor-pointer"
                  >
                    Sign In
                  </button>
                </p>
              ) : (
                <p>
                  New African business?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('register');
                      setErrorMsg(null);
                      setSuccessMsg(null);
                    }}
                    className="font-bold text-indigo-600 hover:underline cursor-pointer"
                  >
                    Create Account
                  </button>
                </p>
              )}
            </div>
          </form>
        )}

        {/* ══════════════════════════════════════════════════════════ */}
        {/* SCREEN 3: 6-DIGIT EMAIL VERIFICATION                      */}
        {/* ══════════════════════════════════════════════════════════ */}
        {mode === 'verify-email' && (
          <form onSubmit={handleVerifyCode} className="space-y-4 text-xs">
            <div className="text-center">
              <label className="font-bold text-slate-700 block mb-2">
                Enter 6-Digit Verification Code
              </label>
              <input
                type="text"
                maxLength={6}
                required
                placeholder="123456"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                className="w-48 mx-auto text-center text-2xl tracking-[12px] font-mono font-black py-2.5 rounded-2xl border-2 border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-600/30 bg-indigo-50/40 text-slate-900 block"
              />
              <p className="text-[11px] text-slate-400 mt-2">Code sent to: <strong>{email}</strong></p>
            </div>

            <button
              type="submit"
              disabled={loading || verificationCode.length !== 6}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow-md shadow-indigo-600/20 disabled:bg-indigo-300 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <span>Verify & Unlock Dashboard</span>}
            </button>

            <div className="flex items-center justify-between pt-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-800 font-semibold cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back to Sign In</span>
              </button>

              <button
                type="button"
                onClick={handleResendCode}
                disabled={resending}
                className="inline-flex items-center gap-1 text-indigo-600 hover:underline font-bold cursor-pointer disabled:text-slate-400"
              >
                <RotateCcw className={`h-3 w-3 ${resending ? 'animate-spin' : ''}`} />
                <span>{resending ? 'Sending...' : 'Resend Code'}</span>
              </button>
            </div>
          </form>
        )}

        {/* ══════════════════════════════════════════════════════════ */}
        {/* SCREEN 4: FORGOT PASSWORD REQUEST                         */}
        {/* ══════════════════════════════════════════════════════════ */}
        {mode === 'forgot-password' && (
          <form onSubmit={handleRequestReset} className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Your Registered Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="name@business.co.za"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-600"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">We will dispatch a 6-digit recovery code to this email.</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow-md shadow-indigo-600/20 disabled:bg-indigo-300 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <span>Send Recovery Code</span>}
            </button>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-800 font-semibold cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Return to Sign In</span>
              </button>
            </div>
          </form>
        )}

        {/* ══════════════════════════════════════════════════════════ */}
        {/* SCREEN 5: SUBMIT RECOVERY CODE & NEW PASSWORD             */}
        {/* ══════════════════════════════════════════════════════════ */}
        {mode === 'reset-password' && (
          <form onSubmit={handleResetPassword} className="space-y-3.5 text-xs">
            <div className="text-center">
              <label className="font-bold text-slate-700 block mb-1">Enter 6-Digit Recovery Code</label>
              <input
                type="text"
                maxLength={6}
                required
                placeholder="123456"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                className="w-40 mx-auto text-center text-xl tracking-[8px] font-mono font-black py-2 rounded-xl border-2 border-rose-400 focus:outline-none bg-rose-50/40 text-slate-900 block"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Choose New Password</label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="Min 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-600"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || verificationCode.length !== 6 || newPassword.length < 6}
              className="w-full mt-2 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold transition-all shadow-md shadow-rose-600/20 disabled:bg-rose-300 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <span>Update Password & Save</span>}
            </button>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-800 font-semibold cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Cancel</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default AuthModal;