import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTheme, THEMES } from '../../context/ThemeContext';
import { useDataMode, DATA_MODES } from '../../context/DataModeContext';
import { healthService } from '../../services/healthService';
import { USER_ROLES } from '../../utils/constants';
import {
  Menu,
  Sun,
  Moon,
  ShieldCheck,
  LogOut,
  ChevronDown,
  Building2,
  FlaskConical,
  Activity,
} from 'lucide-react';

const ROUTE_TITLES = {
  '/': 'Executive Dashboard',
  '/analytics': 'GHG Analytics',
  '/data': 'Data Collection Hub',
  '/data/electricity': 'Electricity Records',
  '/departments': 'Campus Departments',
  '/emission-factors': 'Emission Factors Registry',
  '/predictions': 'Carbon Forecasting',
  '/recommendations': 'Sustainability Recommendations',
  '/simulation': 'Impact Simulator',
  '/reports': 'ESG Audit Reports',
  '/settings': 'System Diagnostics',
};

export const Topbar = ({ onOpenSidebar }) => {
  const { user, logout, switchDemoRole } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const { dataMode, setDataMode, isVesit } = useDataMode();
  const location = useLocation();

  const [backendHealthy, setBackendHealthy] = useState(null);
  const [dbHealthy, setDbHealthy] = useState(null);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [showDataModeDropdown, setShowDataModeDropdown] = useState(false);

  const activeTitle = ROUTE_TITLES[location.pathname] || 'Carbon Intelligence';

  const checkStatus = async () => {
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
    }
  };

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between transition-colors">
      {/* Left: Mobile Menu button & Breadcrumb / Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenSidebar}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {activeTitle}
            </span>
            <span className="hidden sm:inline-block w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20 font-mono">
              VESIT Campus
            </span>
          </div>
          <p className="hidden md:block text-[11px] text-slate-500 dark:text-slate-400">
            Automated Carbon Accounting & Energy Intelligence • ISO 14064 GHG Standards
          </p>
        </div>
      </div>

      {/* Right Actions: Data Mode, Live Status, Theme Toggle, Role Selector, User Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* DATA MODE SELECTOR */}
        <div className="relative">
          <button
            onClick={() => setShowDataModeDropdown(!showDataModeDropdown)}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
              isVesit
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700/60'
                : 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700/60'
            }`}
          >
            {isVesit ? (
              <Building2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <FlaskConical className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            )}
            <span className="hidden md:inline font-mono">
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
              <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95">
                <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800 mb-1 font-mono">
                  Data Source Mode
                </div>
                <button
                  onClick={() => {
                    setDataMode(DATA_MODES.VESIT_ACTUAL);
                    setShowDataModeDropdown(false);
                  }}
                  className={`w-full text-left px-2.5 py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-between ${
                    isVesit
                      ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 font-bold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <div>
                      <div className="font-semibold">VESIT Actual Data</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">
                        2022-2026 Ingested Records
                      </div>
                    </div>
                  </div>
                  {isVesit && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                </button>

                <button
                  onClick={() => {
                    setDataMode(DATA_MODES.TEST_DEMO);
                    setShowDataModeDropdown(false);
                  }}
                  className={`w-full text-left px-2.5 py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-between mt-1 ${
                    !isVesit
                      ? 'bg-amber-50 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300 font-bold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <FlaskConical className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <div>
                      <div className="font-semibold">Test / Demo Data</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">
                        Multi-Department Test Set
                      </div>
                    </div>
                  </div>
                  {!isVesit && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
                </button>
              </div>
            </>
          )}
        </div>

        {/* LIVE CAMPUS DATA INDICATOR */}
        <div
          onClick={checkStatus}
          title="Telemetry Connection Heartbeat"
          className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
        >
          <span
            className={`w-2 h-2 rounded-full ${
              backendHealthy !== false
                ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]'
                : 'bg-rose-500 shadow-[0_0_8px_#ef4444]'
            }`}
          />
          <span className="font-mono text-[11px]">
            {backendHealthy !== false ? 'API Live' : 'API Connecting'}
          </span>
        </div>

        {/* THEME SWITCHER TOGGLE (HIGH PRIORITY) */}
        <button
          onClick={toggleTheme}
          title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          aria-label={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
        >
          {isDark ? (
            <Sun className="w-4 h-4 text-amber-400 transition-transform rotate-0 hover:rotate-90 duration-300" />
          ) : (
            <Moon className="w-4 h-4 text-sky-600 transition-transform -rotate-12 hover:rotate-0 duration-300" />
          )}
        </button>

        {/* ROLE SWITCHER / BADGE */}
        <div className="relative">
          <button
            onClick={() => setShowRoleDropdown(!showRoleDropdown)}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-semibold bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 transition-all"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="font-mono uppercase">{user?.role || 'VIEWER'}</span>
            <ChevronDown className="w-3 h-3 opacity-60" />
          </button>

          {showRoleDropdown && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowRoleDropdown(false)}
              />
              <div className="absolute right-0 mt-2 w-48 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95">
                <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800 mb-1 font-mono">
                  Switch Active Role
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
                        ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-600/20 dark:text-emerald-300 font-bold'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span>{role}</span>
                    {user?.role === role && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* LOGOUT BUTTON */}
        <button
          onClick={logout}
          title="Sign Out"
          aria-label="Sign Out"
          className="p-2 rounded-xl text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
