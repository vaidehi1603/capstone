import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { useTheme } from '../../hooks/useTheme';
import { extractErrorMessage } from '../../utils/formatters';
import { USER_ROLES } from '../../utils/constants';
import {
  Zap,
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Sun,
  Moon,
  Building2,
  UserPlus,
  LogIn,
} from 'lucide-react';

export const LoginPage = () => {
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'signup'
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRoleHint, setSelectedRoleHint] = useState(USER_ROLES.ADMIN);
  const { login, signup } = useAuth();
  const { toggleTheme, isDark } = useTheme();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  // Login form hook
  const {
    register: registerLogin,
    handleSubmit: handleSubmitLogin,
    setValue: setLoginValue,
    formState: { errors: loginErrors, isSubmitting: isLoginSubmitting },
  } = useForm({
    defaultValues: {
      email: 'admin@example.com',
      password: 'admin123',
    },
  });

  // Signup form hook
  const {
    register: registerSignup,
    handleSubmit: handleSubmitSignup,
    formState: { errors: signupErrors, isSubmitting: isSignupSubmitting },
  } = useForm({
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: 'VIEWER',
    },
  });

  const onLoginSubmit = async (data) => {
    try {
      await login(data.email, data.password, selectedRoleHint);
      toast.success('Authentication successful! Welcome to Carbon IQ.');
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  };

  const onSignupSubmit = async (data) => {
    try {
      await signup({
        name: data.name.trim(),
        email: data.email.trim().toLowerCase(),
        password: data.password,
        role: data.role,
      });
      toast.success(`Account created for ${data.name}! Welcome to Carbon IQ.`);
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  };

  const setPreset = (email, pass, role) => {
    setLoginValue('email', email);
    setLoginValue('password', pass);
    setSelectedRoleHint(role);
  };

  return (
    <div className="min-h-screen app-bg flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden transition-colors">
      {/* Top right Theme toggle on login screen */}
      <div className="absolute top-4 right-4 z-20">
        <button
          onClick={toggleTheme}
          title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          className="p-2.5 rounded-xl border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] card-surface shadow-sm transition-all"
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-sky-600" />}
        </button>
      </div>

      {/* Subtle background ambient accents */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md relative z-10">
        {/* Branding Header */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 p-0.5 shadow-lg shadow-emerald-900/20 mb-3">
            <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center">
              <Zap className="w-7 h-7 text-emerald-400" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] tracking-tight">
            Carbon<span className="text-emerald-500">IQ</span>
          </h1>
          <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto mt-1 leading-relaxed font-medium">
            Smart Campus Carbon Intelligence & Energy Accounting Platform
          </p>
          <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-mono">
            <Building2 className="w-3 h-3" />
            V.E.S. Institute of Technology (VESIT)
          </div>
        </div>

        {/* Auth Mode Tabs */}
        <div className="flex rounded-xl p-1 elevated-surface mb-3 border border-[var(--border-color)]">
          <button
            type="button"
            onClick={() => setAuthMode('login')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${
              authMode === 'login'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setAuthMode('signup')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${
              authMode === 'signup'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            Sign Up (New User)
          </button>
        </div>

        {/* Card Surface */}
        <div className="card-surface p-6 sm:p-7 shadow-xl">
          {/* ===================== SIGN IN FORM ===================== */}
          {authMode === 'login' ? (
            <div>
              <form onSubmit={handleSubmitLogin(onLoginSubmit)} className="space-y-4">
                {/* Email field */}
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                    Campus Email / Username
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[var(--text-secondary)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      placeholder="e.g. yourname@vesit.edu or admin@example.com"
                      {...registerLogin('email', { required: 'Email address is required' })}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl input-surface text-xs focus:outline-none"
                    />
                  </div>
                  {loginErrors.email && (
                    <p className="text-[11px] text-rose-500 mt-1 font-medium">{loginErrors.email.message}</p>
                  )}
                </div>

                {/* Password field */}
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[var(--text-secondary)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      {...registerLogin('password', { required: 'Password is required' })}
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl input-surface text-xs focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {loginErrors.password && (
                    <p className="text-[11px] text-rose-500 mt-1 font-medium">{loginErrors.password.message}</p>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoginSubmitting}
                  className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider shadow-md shadow-emerald-950/20 transition-all disabled:opacity-50"
                >
                  {isLoginSubmitting ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Authenticating JWT...
                    </span>
                  ) : (
                    <>
                      <span>Sign In to Dashboard</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Quick Demo Login Presets */}
              <div className="mt-5 pt-4 border-t border-[var(--border-subtle)]">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2 font-mono">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  Quick Evaluation Demo Presets:
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPreset('admin@example.com', 'admin123', USER_ROLES.ADMIN)}
                    className="p-2 rounded-lg elevated-surface border border-[var(--border-color)] hover:border-emerald-500 text-[11px] font-semibold text-[var(--text-primary)] text-left transition-colors truncate"
                  >
                    ⚡ System Admin
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreset('maintenance@vesit.edu', 'admin123', USER_ROLES.MAINTENANCE)}
                    className="p-2 rounded-lg elevated-surface border border-[var(--border-color)] hover:border-emerald-500 text-[11px] font-semibold text-[var(--text-primary)] text-left transition-colors truncate"
                  >
                    🛠 Maintenance
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreset('hod@vesit.edu', 'admin123', USER_ROLES.HOD)}
                    className="p-2 rounded-lg elevated-surface border border-[var(--border-color)] hover:border-emerald-500 text-[11px] font-semibold text-[var(--text-primary)] text-left transition-colors truncate"
                  >
                    🎓 Dept. Head (HOD)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreset('viewer@vesit.edu', 'admin123', USER_ROLES.VIEWER)}
                    className="p-2 rounded-lg elevated-surface border border-[var(--border-color)] hover:border-emerald-500 text-[11px] font-semibold text-[var(--text-primary)] text-left transition-colors truncate"
                  >
                    📊 Auditor / Viewer
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* ===================== SIGN UP FORM ===================== */
            <div>
              <form onSubmit={handleSubmitSignup(onSignupSubmit)} className="space-y-3.5">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-[var(--text-secondary)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="e.g. Dr. Rajesh Sharma"
                      {...registerSignup('name', { required: 'Full name is required' })}
                      className="w-full pl-10 pr-4 py-2 rounded-xl input-surface text-xs focus:outline-none"
                    />
                  </div>
                  {signupErrors.name && (
                    <p className="text-[11px] text-rose-500 mt-1 font-medium">{signupErrors.name.message}</p>
                  )}
                </div>

                {/* Email address */}
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                    Campus Email Address <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[var(--text-secondary)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      placeholder="e.g. rajesh.sharma@vesit.edu"
                      {...registerSignup('email', {
                        required: 'Email address is required',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Please enter a valid email address',
                        },
                      })}
                      className="w-full pl-10 pr-4 py-2 rounded-xl input-surface text-xs focus:outline-none"
                    />
                  </div>
                  {signupErrors.email && (
                    <p className="text-[11px] text-rose-500 mt-1 font-medium">{signupErrors.email.message}</p>
                  )}
                </div>

                {/* Password field */}
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                    Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[var(--text-secondary)] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="At least 6 characters"
                      {...registerSignup('password', {
                        required: 'Password is required',
                        minLength: { value: 6, message: 'Password must be at least 6 characters' },
                      })}
                      className="w-full pl-10 pr-10 py-2 rounded-xl input-surface text-xs focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {signupErrors.password && (
                    <p className="text-[11px] text-rose-500 mt-1 font-medium">{signupErrors.password.message}</p>
                  )}
                </div>

                {/* Campus Role */}
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                    Campus Role
                  </label>
                  <select
                    {...registerSignup('role')}
                    className="w-full px-3.5 py-2 rounded-xl input-surface text-xs focus:outline-none"
                  >
                    <option value="VIEWER">Sustainability Officer / Auditor (VIEWER)</option>
                    <option value="MAINTENANCE">Facility & Maintenance Lead (MAINTENANCE)</option>
                    <option value="HOD">Head of Department (HOD)</option>
                    <option value="ADMIN">Campus Administrator (ADMIN)</option>
                  </select>
                  <p className="text-[10px] text-[var(--text-secondary)] mt-1">
                    Defines your initial RBAC permissions across carbon data entry, analytics, and diagnostics.
                  </p>
                </div>

                {/* Submit Signup Button */}
                <button
                  type="submit"
                  disabled={isSignupSubmitting}
                  className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider shadow-md shadow-emerald-950/20 transition-all disabled:opacity-50"
                >
                  {isSignupSubmitting ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creating Account & Issuing JWT...
                    </span>
                  ) : (
                    <>
                      <span>Create Account & Sign In</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Switch mode footer */}
        <div className="text-center mt-3 text-xs text-[var(--text-secondary)]">
          {authMode === 'login' ? (
            <p>
              Need a new campus account?{' '}
              <button
                type="button"
                onClick={() => setAuthMode('signup')}
                className="font-bold text-emerald-500 hover:underline"
              >
                Sign Up here
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => setAuthMode('login')}
                className="font-bold text-emerald-500 hover:underline"
              >
                Sign In here
              </button>
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-4 text-[11px] text-[var(--text-secondary)] font-mono">
          ISO 14064 Compliance • GHG Protocol Accounting
        </div>
      </div>
    </div>
  );
};
