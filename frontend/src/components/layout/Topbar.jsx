import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useDataMode, DATA_MODES } from '../../context/DataModeContext';
import { healthService } from '../../services/healthService';
import { USER_ROLES, ROLE_BADGE_COLORS } from '../../utils/constants';
import {
  Menu,
  Database,
  ShieldCheck,
  LogOut,
  ChevronDown,
  RefreshCw,
  Building2,
  FlaskConical,
} from 'lucide-react';

export const Topbar = ({ onOpenSidebar }) => {
  const { user, logout, switchDemoRole } = useAuth();
  const { dataMode, setDataMode, isVesit } = useDataMode();
  const [backendHealthy, setBackendHealthy] = useState(null);
  const [dbHealthy, setDbHealthy] = useState(null);
  const [checkingHealth, setCheckingHealth] = useState(false);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [showDataModeDropdown, setShowDataModeDropdown] = useState(false);

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
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold text-slate-100">
              VESIT Carbon Accounting & Forecasting Platform
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              V.E.S. Institute of Technology
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-sans">
            Automated Carbon Accounting & Energy Intelligence • ISO 14064 GHG Standards
          </p>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3">
        {/* DATA MODE SELECTOR */}
        <div className="relative">
          <button
            onClick={() => setShowDataModeDropdown(!showDataModeDropdown)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
              isVesit
                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-700/60 shadow-[0_0_12px_rgba(16,185,129,0.15)]'
                : 'bg-amber-950/60 text-amber-300 border-amber-700/60 shadow-[0_0_12px_rgba(245,158,11,0.15)]'
            }`}
          >
            {isVesit ? (
              <Building2 className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <FlaskConical className="w-3.5 h-3.5 text-amber-400" />
            )}
            <span className="font-mono">
              {isVesit ? 'VESIT Actual Data' : 'Test / Demo Data'}
            </span>
            <ChevronDown className="w-3 h-3 opacity-60" />
          </button>

          {showDataModeDropdown && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowDataModeDropdown(false)}
              />
              <div className="absolute right-0 mt-2 w-56 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95">
                <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 mb-1">
                  Data Source Mode
                </div>
                <button
                  onClick={() => {
                    setDataMode(DATA_MODES.VESIT_ACTUAL);
                    setShowDataModeDropdown(false);
                  }}
                  className={`w-full text-left px-2.5 py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-between ${
                    isVesit
                      ? 'bg-emerald-500/20 text-emerald-300 font-bold'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                    <div>
                      <div className="font-semibold">VESIT Actual Data</div>
                      <div className="text-[10px] text-slate-400 font-normal">2022-2026 Institute Electricity & Assets</div>
                    </div>
                  </div>
                  {isVesit && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                </button>

                <button
                  onClick={() => {
                    setDataMode(DATA_MODES.TEST_DEMO);
                    setShowDataModeDropdown(false);
                  }}
                  className={`w-full text-left px-2.5 py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-between mt-1 ${
                    !isVesit
                      ? 'bg-amber-500/20 text-amber-300 font-bold'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <FlaskConical className="w-3.5 h-3.5 text-amber-400" />
                    <div>
                      <div className="font-semibold">Test / Demo Data</div>
                      <div className="text-[10px] text-slate-400 font-normal">Synthesized Multi-Department Test Set</div>
                    </div>
                  </div>
                  {!isVesit && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Live Campus Data Indicator */}
        <div
          onClick={checkStatus}
          title="System connected and data active"
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs font-medium text-slate-300 hover:border-slate-700 transition-colors"
        >
          <span
            className={`w-2 h-2 rounded-full ${
              backendHealthy !== false
                ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]'
                : 'bg-rose-400 shadow-[0_0_8px_#f43f5e]'
            }`}
          />
          <span className="text-slate-300">Live Campus Data</span>
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

