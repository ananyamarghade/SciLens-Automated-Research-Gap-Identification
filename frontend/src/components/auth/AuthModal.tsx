import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  X,
  Lock,
  Mail,
  User as UserIcon,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { SciLensLogo } from '../common/SciLensLogo';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    authModalMode,
    openAuthModal,
    closeAuthModal,
    login,
    register,
  } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isAuthModalOpen) return null;

  const isSignUp = authModalMode === 'signup';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (isSignUp) {
        if (!name.trim()) {
          throw new Error('Please enter your full name or academic title.');
        }
        await register(name, email, password);
      } else {
        await login(email, password);
      }
      setName('');
      setEmail('');
      setPassword('');
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-scilens-navy/60 dark:bg-black/70 backdrop-blur-md animate-fade-in"
      onClick={closeAuthModal}
    >
      <div
        className="relative w-full max-w-[420px] bg-white dark:bg-[#0C1528] border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-2xl shadow-scilens-navy/15 dark:shadow-black/60 overflow-hidden animate-slide-up transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          aria-label="Close modal"
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-scilens-navy dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors z-10"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-7 sm:p-8 space-y-6">
          {/* Header Branding */}
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-teal-50/80 dark:bg-teal-950/40 border border-teal-500/25 flex items-center justify-center mx-auto shadow-sm">
              <SciLensLogo size="sm" showWordmark={false} />
            </div>

            <div>
              <h3 className="font-serif text-2xl font-bold text-scilens-navy dark:text-white tracking-tight">
                {isSignUp ? 'Create your account' : 'Welcome back!'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-sans">
                {isSignUp
                  ? 'Start uncovering hidden literature gaps with SciLens'
                  : 'Log in to continue your journey with SciLens'}
              </p>
            </div>
          </div>

          {/* Segmented Mode Switcher */}
          <div className="grid grid-cols-2 p-1 bg-slate-100/90 dark:bg-[#070D1E] rounded-xl text-xs font-sans font-medium border border-slate-200/60 dark:border-slate-800/80">
            <button
              type="button"
              onClick={() => {
                setError(null);
                openAuthModal('signin');
              }}
              className={`py-2 rounded-lg transition-all duration-150 ${
                !isSignUp
                  ? 'bg-white dark:bg-[#0C1528] text-scilens-navy dark:text-white shadow-sm font-semibold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-scilens-navy dark:hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setError(null);
                openAuthModal('signup');
              }}
              className={`py-2 rounded-lg transition-all duration-150 ${
                isSignUp
                  ? 'bg-white dark:bg-[#0C1528] text-scilens-navy dark:text-white shadow-sm font-semibold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-scilens-navy dark:hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-50/90 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2.5 animate-fade-in">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
              <span className="leading-snug">{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div className="space-y-1.5">
                <label className="text-xs font-sans font-medium text-slate-700 dark:text-slate-300">
                  Full Name & Title
                </label>
                <div className="relative group">
                  <UserIcon className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400 group-focus-within:text-scilens-teal transition-colors" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Dr. Jennifer Vance"
                    className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-[#070D1E]/80 text-scilens-navy dark:text-white placeholder-slate-400 focus:outline-none focus:border-scilens-teal focus:ring-2 focus:ring-scilens-teal/15 transition-all"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-sans font-medium text-slate-700 dark:text-slate-300">
                Email or Username
              </label>
              <div className="relative group">
                <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400 group-focus-within:text-scilens-teal transition-colors" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="researcher@institution.edu"
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-[#070D1E]/80 text-scilens-navy dark:text-white placeholder-slate-400 focus:outline-none focus:border-scilens-teal focus:ring-2 focus:ring-scilens-teal/15 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-sans font-medium text-slate-700 dark:text-slate-300">
                Password
              </label>
              <div className="relative group">
                <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400 group-focus-within:text-scilens-teal transition-colors" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-10 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-[#070D1E]/80 text-scilens-navy dark:text-white placeholder-slate-400 focus:outline-none focus:border-scilens-teal focus:ring-2 focus:ring-scilens-teal/15 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-2.5 p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember me & Forgot password row (similar to reference) */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600 dark:text-slate-400 hover:text-scilens-navy dark:hover:text-white">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-slate-300 text-scilens-teal focus:ring-scilens-teal/20 focus:ring-offset-0 transition-colors accent-scilens-teal"
                />
                <span className="text-[11px] font-sans">Remember me</span>
              </label>

              {!isSignUp && (
                <button
                  type="button"
                  onClick={() => alert('Password reset link sent to institutional admin.')}
                  className="text-[11px] font-sans text-scilens-teal dark:text-scilens-glowteal hover:underline font-medium"
                >
                  Forgot password?
                </button>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-scilens-teal to-scilens-darkteal hover:from-scilens-darkteal hover:to-scilens-teal text-white text-xs font-sans font-semibold transition-all duration-150 flex items-center justify-center gap-2 shadow-md shadow-scilens-teal/25 hover:shadow-lg hover:shadow-scilens-teal/35 active:scale-[0.99] disabled:opacity-60 cursor-pointer group"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>{isSignUp ? 'Create Account' : 'Log In'}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>

            {/* Bottom Switcher */}
            <div className="text-center pt-2">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    openAuthModal(isSignUp ? 'signin' : 'signup');
                  }}
                  className="text-scilens-teal dark:text-scilens-glowteal font-semibold hover:underline"
                >
                  {isSignUp ? 'Log In' : 'Sign Up'}
                </button>
              </p>
            </div>
          </form>

          {/* Secure Institutional Footnote */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-center gap-1.5 text-[10px] text-slate-400 dark:text-slate-500 font-mono">
            <ShieldCheck className="w-3.5 h-3.5 text-scilens-teal" />
            <span>256-BIT ENCRYPTED RESEARCH SESSION</span>
          </div>
        </div>
      </div>
    </div>
  );
};
