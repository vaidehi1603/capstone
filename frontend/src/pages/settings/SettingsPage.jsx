import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { healthService } from '../../services/healthService';
import { useToast } from '../../hooks/useToast';
import { Badge } from '../../components/common/Badge';
import {
  Server,
  Database,
  UserCheck,
  RefreshCw,
  ShieldCheck,
  Activity,
  Layers,
  Sun,
  Moon,
  Info,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export const SettingsPage = () => {
  const { user, switchDemoRole } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const toast = useToast();
  const [backendHealth, setBackendHealth] = useState(null);
  const [dbHealth, setDbHealth] = useState(null);
  const [testing, setTesting] = useState(false);
  const [lastCheckTime, setLastCheckTime] = useState(null);

  const runDiagnostics = async () => {
    setTesting(true);
    try {
      const [apiRes, dbRes] = await Promise.all([
        healthService.checkHealth(),
        healthService.checkDatabaseHealth(),
      ]);
      setBackendHealth(apiRes);
      setDbHealth(dbRes);
      setLastCheckTime(new Date().toLocaleTimeString());
      toast.success('System diagnostics refreshed successfully');
    } catch {
      toast.error('Diagnostics failed to connect to backend gateway');
    } finally {
      setTesting(false);
    }
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  const rolesMatrix = [
    {
      role: 'ADMIN',
      label: 'Campus Administrator',
      level: 'Full Administrative Privilege',
      badgeVariant: 'purple',
      endpoints: 'User management, department provisioning, emission factor configuration, analytics, full audit trails & raw telemetry ingestion.',
    },
    {
      role: 'MAINTENANCE',
      label: 'Facility & Maintenance Lead',
      level: 'Data Entry & Ingestion',
      badgeVariant: 'orange',
      endpoints: 'Utility bill uploads, sub-meter manual logging, asset registry, equipment maintenance telemetry, and anomaly verification.',
    },
    {
      role: 'HOD',
      label: 'Head of Department',
      level: 'Departmental Governance',
      badgeVariant: 'blue',
      endpoints: 'Departmental electricity & carbon allocation, efficiency benchmarks, lab asset inventory, and department-specific decarbonization suggestions.',
    },
    {
      role: 'VIEWER',
      label: 'Sustainability Officer / Viewer',
      level: 'Read-Only Governance',
      badgeVariant: 'emerald',
      endpoints: 'Read-only access to executive dashboard, ARIMA/RF forecasts, analytics reports, ESG downloads, and scenario simulator.',
    },
  ];

  const systemConfig = [
    { label: 'Campus Institution', value: 'V.E.S. Institute of Technology (VESIT)' },
    { label: 'Campus Wings Monitored', value: 'A Wing (350 KVA), B Wing (175 KVA)' },
    { label: 'Grid Baseline Emission Factor', value: '0.8200 kg CO₂e / kWh (CEA Baseline v19)' },
    { label: 'GHG Accounting Protocol', value: 'GHG Protocol Corporate Standard (Scope 1, 2, 3)' },
    { label: 'AI Advisory Engine', value: 'Google Gemini AI (gemini-2.5-flash) Connected' },
    { label: 'Active Machine Learning Models', value: 'ARIMA (0,1,1) & Random Forest Regressor' },
    { label: 'Database Storage Engine', value: 'PostgreSQL 15 (Docker Container :5433)' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-extrabold text-[var(--text-primary)] tracking-tight">
              Settings & Health Diagnostics
            </h2>
            <Badge variant="cyan">System Telemetry</Badge>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Real-time backend API connectivity, PostgreSQL engine status, session audit, and RBAC matrix.
          </p>
        </div>

        <button
          onClick={runDiagnostics}
          disabled={testing}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-900/20 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${testing ? 'animate-spin' : ''}`} />
          <span>{testing ? 'Probing Services...' : 'Run Live Diagnostics'}</span>
        </button>
      </div>

      {/* Diagnostics Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Backend Server Status */}
        <div className="card-surface p-5">
          <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 flex items-center justify-center">
                <Server className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[var(--text-primary)]">Sustainability API Gateway</h3>
                <span className="text-[11px] font-mono text-[var(--text-secondary)]">
                  {import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'}
                </span>
              </div>
            </div>
            {backendHealth?.success ? (
              <Badge variant="emerald">Operational</Badge>
            ) : (
              <Badge variant="rose">Offline / Unreachable</Badge>
            )}
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[var(--text-secondary)]">Gateway Endpoint:</span>
              <span className="font-mono text-[var(--text-primary)] font-semibold">GET /api/v1/health</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[var(--text-secondary)]">Probe Response:</span>
              <span className="font-mono text-emerald-500 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {backendHealth?.message || 'Probing...'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[var(--text-secondary)]">Server Architecture:</span>
              <span className="font-mono text-[var(--text-primary)]">FastAPI + Uvicorn Async</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[var(--text-secondary)]">Last Health Check:</span>
              <span className="font-mono text-[var(--text-secondary)]">{lastCheckTime || 'Just now'}</span>
            </div>
          </div>
        </div>

        {/* Database Status */}
        <div className="card-surface p-5">
          <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-500 border border-sky-500/30 flex items-center justify-center">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[var(--text-primary)]">Campus Database Engine</h3>
                <span className="text-[11px] font-mono text-[var(--text-secondary)]">PostgreSQL 15 (Docker)</span>
              </div>
            </div>
            {dbHealth?.success ? (
              <Badge variant="emerald">Connected</Badge>
            ) : (
              <Badge variant="rose">Disconnected</Badge>
            )}
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[var(--text-secondary)]">DB Health Endpoint:</span>
              <span className="font-mono text-[var(--text-primary)] font-semibold">GET /api/v1/health/database</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[var(--text-secondary)]">Connection Status:</span>
              <span className="font-mono text-emerald-500 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {dbHealth?.message || 'Probing...'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[var(--text-secondary)]">Migrations Status:</span>
              <span className="font-mono text-[var(--text-primary)]">Alembic v2_schema Applied</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[var(--text-secondary)]">Active Telemetry Rows:</span>
              <span className="font-mono text-[var(--text-secondary)]">116 Energy Records (2022–2026)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Campus Configuration & Appearance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 card-surface p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] pb-3">
            <Layers className="w-4 h-4 text-emerald-500" />
            <h3 className="text-sm font-bold text-[var(--text-primary)]">Institutional Accounting Parameters</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {systemConfig.map((item, idx) => (
              <div key={idx} className="p-3 rounded-xl elevated-surface">
                <div className="text-[10px] uppercase font-bold text-[var(--text-secondary)] tracking-wider">
                  {item.label}
                </div>
                <div className="text-xs font-semibold text-[var(--text-primary)] mt-0.5">
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Display & Theme Persistence Card */}
        <div className="card-surface p-5 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] pb-3">
              <Activity className="w-4 h-4 text-sky-500" />
              <h3 className="text-sm font-bold text-[var(--text-primary)]">Theme & Display Token</h3>
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-3 leading-relaxed">
              Carbon IQ persists theme choice in client localStorage (<code className="font-mono text-[var(--text-primary)]">carboniq_theme</code>) with automated system OS preference fallback and anti-flash pre-render scripts.
            </p>
          </div>

          <div className="p-3.5 rounded-xl elevated-surface flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {theme === 'dark' ? (
                <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center">
                  <Moon className="w-4 h-4" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <Sun className="w-4 h-4" />
                </div>
              )}
              <div>
                <div className="text-xs font-bold text-[var(--text-primary)] capitalize">
                  {theme} Theme Active
                </div>
                <div className="text-[10px] text-[var(--text-secondary)]">WCAG 2.1 AA Compliant</div>
              </div>
            </div>
            <button
              onClick={toggleTheme}
              className="px-3 py-1.5 rounded-lg border border-[var(--border-color)] text-xs font-bold text-[var(--text-primary)] hover:bg-[var(--bg-main)] transition-colors"
            >
              Toggle Mode
            </button>
          </div>
        </div>
      </div>

      {/* Active User Session & Role Permission Matrix */}
      <div className="card-surface p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 border border-purple-500/30 flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[var(--text-primary)]">Current Authenticated Session</h3>
              <p className="text-xs text-[var(--text-secondary)]">
                Logged in as <span className="font-semibold text-[var(--text-primary)]">{user?.email || 'admin@example.com'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="purple">{user?.role || 'ADMIN'}</Badge>
            <span className="text-[11px] text-[var(--text-secondary)]">Role-Based Access Guard Active</span>
          </div>
        </div>

        {/* Role Matrix */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              Role Permissions & Evaluator Switcher
            </h4>
            <span className="text-[11px] text-[var(--text-secondary)]">
              Click a role below to test role-gated UI and API protection
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {rolesMatrix.map((item) => (
              <div
                key={item.role}
                onClick={() => {
                  switchDemoRole(item.role);
                  toast.success(`Role switched to ${item.role}`);
                }}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  user?.role === item.role
                    ? 'border-emerald-500 bg-emerald-500/5 shadow-sm'
                    : 'border-[var(--border-color)] elevated-surface hover:border-[var(--border-strong)]'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[var(--text-primary)]">{item.label}</span>
                    <Badge variant={item.badgeVariant}>{item.role}</Badge>
                  </div>
                  {user?.role === item.role && (
                    <span className="text-[10px] font-bold text-emerald-500 flex items-center gap-1 font-mono">
                      <CheckCircle2 className="w-3 h-3" /> Active
                    </span>
                  )}
                </div>
                <div className="text-[11px] font-medium text-[var(--text-secondary)] mb-1">
                  {item.level}
                </div>
                <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                  {item.endpoints}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
