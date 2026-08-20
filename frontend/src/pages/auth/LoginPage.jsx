import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { extractErrorMessage } from '../../utils/formatters';
import { USER_ROLES } from '../../utils/constants';
import {
  Zap,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

export const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRoleHint, setSelectedRoleHint] = useState(USER_ROLES.ADMIN);
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      email: 'admin@example.com',
      password: 'admin123',
    }
  });

  const onSubmit = async (data) => {
    try {
      await login(data.email, data.password, selectedRoleHint);
      toast.success('Authentication successful! Welcome to Smart Campus CarbonIQ.');
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  };

  const setPreset = (email, pass, role) => {
    setValue('email', email);
    setValue('password', pass);
    setSelectedRoleHint(role);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Login Card */}
      <div className="w-full max-w-md relative z-10">
        {/* Branding Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-600 to-brand-400 p-0.5 shadow-xl shadow-brand-900/50 mb-4">
            <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center">
              <Zap className="w-8 h-8 text-brand-400" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
            Carbon<span className="text-brand-400">IQ</span> Platform
          </h1>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-2 leading-relaxed font-medium">
            AI-Driven Sustainability Framework for Smart Campus Carbon Intelligence
          </p>
        </div>

        {/* Form Container */}
        <div className="glass-card rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-2xl">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Email field */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Campus Email / Username
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  placeholder="admin@example.com"
                  {...register('email', { required: 'Email is required' })}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/60 border border-slate-700 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors"
                />
              </div>
              {errors.email && <p className="text-[11px] text-rose-400 mt-1">{errors.email.message}</p>}
            </div>

            {/* Password field */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  {...register('password', { required: 'Password is required' })}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950/60 border border-slate-700 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-[11px] text-rose-400 mt-1">{errors.password.message}</p>}
            </div>

            {/* Login Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-500 hover:to-brand-400 text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-brand-900/40 transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Verifying JWT Token...
                </span>
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Login Presets for Project Demonstration */}
          <div className="mt-6 pt-5 border-t border-slate-800">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
              <ShieldCheck className="w-3.5 h-3.5 text-brand-400" />
              Quick Demo Presets:
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPreset('admin@example.com', 'admin123', USER_ROLES.ADMIN)}
                className="px-2.5 py-1.5 rounded-lg bg-purple-950/30 hover:bg-purple-900/40 text-purple-300 border border-purple-800/40 text-[11px] font-medium text-left transition-colors truncate"
              >
                ⚡ Admin (Full Access)
              </button>
              <button
                type="button"
                onClick={() => setPreset('admin@example.com', 'admin123', USER_ROLES.MAINTENANCE)}
                className="px-2.5 py-1.5 rounded-lg bg-amber-950/30 hover:bg-amber-900/40 text-amber-300 border border-amber-800/40 text-[11px] font-medium text-left transition-colors truncate"
              >
                🛠 Maintenance (Data Entry)
              </button>
              <button
                type="button"
                onClick={() => setPreset('admin@example.com', 'admin123', USER_ROLES.HOD)}
                className="px-2.5 py-1.5 rounded-lg bg-blue-950/30 hover:bg-blue-900/40 text-blue-300 border border-blue-800/40 text-[11px] font-medium text-left transition-colors truncate"
              >
                🎓 HOD (Department)
              </button>
              <button
                type="button"
                onClick={() => setPreset('admin@example.com', 'admin123', USER_ROLES.VIEWER)}
                className="px-2.5 py-1.5 rounded-lg bg-emerald-950/30 hover:bg-emerald-900/40 text-emerald-300 border border-emerald-800/40 text-[11px] font-medium text-left transition-colors truncate"
              >
                📊 Viewer (Read-Only)
              </button>
            </div>
          </div>
        </div>

        {/* Architecture Note Footer */}
        <div className="text-center mt-6 text-[11px] text-slate-500 font-mono">
          FastAPI Backend Authentication • PostgreSQL Database
        </div>
      </div>
    </div>
  );
};
