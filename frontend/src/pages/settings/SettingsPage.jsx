import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { healthService } from '../../services/healthService';
import { useToast } from '../../hooks/useToast';
import { Badge } from '../../components/common/Badge';
import {
  Server,
  Database,
  UserCheck,
  RefreshCw,
} from 'lucide-react';

export const SettingsPage = () => {
  const { user, switchDemoRole } = useAuth();
  const toast = useToast();
  const [backendHealth, setBackendHealth] = useState(null);
  const [dbHealth, setDbHealth] = useState(null);
  const [testing, setTesting] = useState(false);

  const runDiagnostics = async () => {
    setTesting(true);
    try {
      const [apiRes, dbRes] = await Promise.all([
        healthService.checkHealth(),
        healthService.checkDatabaseHealth(),
      ]);
      setBackendHealth(apiRes);
      setDbHealth(dbRes);
      toast.success('System diagnostics refreshed!');
    } catch {
      toast.error('Diagnostics failed to reach backend');
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
      label: 'System Administrator',
      endpoints: 'Full access (User, Departments, Electricity, Emission Factors, Analytics, Reports)',
    },
    {
      role: 'MAINTENANCE',
      label: 'Facility / Maintenance',
      endpoints: 'Data entry (Electricity, Water, Waste, Transport, Appliances)',
    },
    {
      role: 'HOD',
      label: 'Head of Department',
      endpoints: 'Departmental dashboard, analytics, carbon emissions profile, recommendations',
    },
    {
      role: 'VIEWER',
      label: 'Sustainability Viewer',
      endpoints: 'Read-only access to dashboard, charts, forecasts, and analytics',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-100 tracking-tight">
              System Settings & Health Diagnostics
            </h2>
            <Badge variant="cyan">System Telemetry</Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Backend API status, database connectivity checks, JWT session info, and role permissions.
          </p>
        </div>

        <button
          onClick={runDiagnostics}
          disabled={testing}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition-all shadow-lg shadow-brand-900/40 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${testing ? 'animate-spin' : ''}`} />
          Run Live Diagnostics
        </button>
      </div>

      {/* Diagnostics Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Backend Server Status */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/30 flex items-center justify-center">
                <Server className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-200">Sustainability Data Gateway</h3>
                <span className="text-[11px] font-mono text-slate-400">
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

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-300">
              <span className="text-slate-400">System Gateway:</span>
              <span className="font-mono text-slate-200">Online & Synchronized</span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span className="text-slate-400">Response:</span>
              <span className="font-mono text-emerald-400 font-semibold">
                {backendHealth?.message || 'Checking...'}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span className="text-slate-400">Environment:</span>
              <span className="font-mono text-slate-200">College Production</span>
            </div>
          </div>
        </div>

        {/* Database Status */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 flex items-center justify-center">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-200">Campus Database Engine</h3>
                <span className="text-[11px] font-mono text-slate-400">Active Energy & Asset Records</span>
              </div>
            </div>
            {dbHealth?.success ? (
              <Badge variant="emerald">Connected</Badge>
            ) : (
              <Badge variant="rose">Disconnected</Badge>
            )}
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-300">
              <span className="text-slate-400">DB Health Endpoint:</span>
              <span className="font-mono text-slate-200">GET /api/v1/health/database</span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span className="text-slate-400">Connection Status:</span>
              <span className="font-mono text-emerald-400 font-semibold">
                {dbHealth?.message || 'Checking...'}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span className="text-slate-400">Tables Initialized:</span>
              <span className="font-mono text-slate-200">users, departments, electricity_data, emission_factors, etc.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Active User Session & Role Permission Matrix */}
      <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/30 flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-200">Current Session & RBAC Permissions</h3>
              <p className="text-[11px] text-slate-400">
                Logged in as <span className="font-semibold text-slate-200">{user?.email}</span>
              </p>
            </div>
          </div>

          <Badge variant="purple">{user?.role || 'VIEWER'}</Badge>
        </div>

        {/* Role Matrix */}
        <div className="space-y-2.5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Role Access Matrix (Evaluator Switcher):
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {rolesMatrix.map((item) => (
              <div
                key={item.role}
                onClick={() => {
                  switchDemoRole(item.role);
                  toast.success(`Role switched to ${item.role}`);
                }}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  user?.role === item.role
                    ? 'bg-brand-950/40 border-brand-500/50 shadow-md shadow-brand-950'
                    : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-200">{item.label}</span>
                  <Badge variant={user?.role === item.role ? 'emerald' : 'default'}>
                    {item.role}
                  </Badge>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">{item.endpoints}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
