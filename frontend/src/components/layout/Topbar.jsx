import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { healthService } from '../../services/healthService';
import { USER_ROLES, ROLE_BADGE_COLORS } from '../../utils/constants';
import {
  Menu,
  Database,
  ShieldCheck,
  LogOut,
  ChevronDown,
  RefreshCw,
} from 'lucide-react';

export const Topbar = ({ onOpenSidebar }) => {
  const { user, logout, switchDemoRole } = useAuth();
  const [backendHealthy, setBackendHealthy] = useState(null);
  const [dbHealthy, setDbHealthy] = useState(null);
  const [checkingHealth, setCheckingHealth] = useState(false);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);

  const checkStatus = async () => {
    setCheckingHealth(true);
    try {
      const [apiRes, dbRes] = await Promise.all([
        healthService.checkHealth(),
        healthService.checkDatabaseHealth(),
      ]);
      setBackendHealthy(apiRes?.success === true);
      setDbHealthy(dbRes?.success === true);
    } catch {
      setBackendHealthy(false);
      setDbHealthy(false);
    } finally {
      setCheckingHealth(false);
    }
  };

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 30000); // 30s heartbeat
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-30 h-16 bg-slate-900/80 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-6 flex items-center justify-between">
      {/* Left: Mobile Menu button & Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenSidebar}
          className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 lg:hidden transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:block">
          <h1 className="text-sm font-bold text-slate-100">
            Smart Campus Carbon Intelligence Platform
          </h1>
          <p className="text-[11px] text-slate-400 font-mono">
            AI-Driven Sustainability Framework • ISO 14064 GHG Accounting
          </p>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3">
        {/* Backend & DB Health Badge */}
        <div
          onClick={checkStatus}
          title="Click to refresh backend health"
          className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-950/60 border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors"
        >
          <div className="flex items-center gap-1.5 text-[11px] font-mono">
            <span
              className={`w-2 h-2 rounded-full ${
                backendHealthy === true
                  ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]'
                  : backendHealthy === false
                  ? 'bg-rose-400 shadow-[0_0_8px_#f43f5e]'
                  : 'bg-amber-400 animate-pulse'
              }`}
            />
            <span className="text-slate-400 font-medium">FastAPI</span>
          </div>
          <span className="text-slate-700">|</span>
          <div className="flex items-center gap-1.5 text-[11px] font-mono">
            <Database
              className={`w-3 h-3 ${
                dbHealthy === true ? 'text-emerald-400' : 'text-slate-500'
              }`}
            />
            <span className="text-slate-400 font-medium">PostgreSQL</span>
          </div>
          {checkingHealth && <RefreshCw className="w-3 h-3 text-slate-400 animate-spin ml-1" />}
        </div>

        {/* Role Switcher for Final-Year Project Evaluation */}
        <div className="relative">
          <button
            onClick={() => setShowRoleDropdown(!showRoleDropdown)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
              ROLE_BADGE_COLORS[user?.role] || 'bg-slate-800 text-slate-300 border-slate-700'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="font-mono">{user?.role || 'VIEWER'}</span>
            <ChevronDown className="w-3 h-3 opacity-60" />
          </button>

          {showRoleDropdown && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowRoleDropdown(false)}
              />
              <div className="absolute right-0 mt-2 w-48 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95">
                <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 mb-1">
                  Switch Role (Evaluation)
                </div>
                {Object.values(USER_ROLES).map((role) => (
                  <button
                    key={role}
                    onClick={() => {
                      switchDemoRole(role);
                      setShowRoleDropdown(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center justify-between ${
                      user?.role === role
                        ? 'bg-brand-600/20 text-brand-300 font-bold'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span>{role}</span>
                    {user?.role === role && <span className="w-1.5 h-1.5 rounded-full bg-brand-400" />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* User initials & Quick Sign Out */}
        <button
          onClick={logout}
          title="Sign Out"
          className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
