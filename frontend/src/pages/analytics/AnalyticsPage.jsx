import React, { useState, useEffect } from 'react';
import { analyticsService } from '../../services/analyticsService';
import { departmentService } from '../../services/departmentService';
import { ScopeDonutChart } from '../../components/charts/ScopeDonutChart';
import { DepartmentBarChart } from '../../components/charts/DepartmentBarChart';
import { MonthlyTrendChart } from '../../components/charts/MonthlyTrendChart';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorState } from '../../components/common/ErrorState';
import { Badge } from '../../components/common/Badge';
import { formatCarbon, extractErrorMessage } from '../../utils/formatters';
import {
  BarChart3,
  Activity,
  PieChart as PieIcon,
  RefreshCw,
} from 'lucide-react';

export const AnalyticsPage = () => {
  const [overview, setOverview] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const [ovData, deptData] = await Promise.all([
        analyticsService.getDashboardOverview().catch(() => ({
          total_campus_emissions_kgco2e: 0,
          scope_breakdown: { scope_1: 0, scope_2: 0, scope_3: 0 },
          top_departments: [],
        })),
        departmentService.getDepartments().catch(() => []),
      ]);
      setOverview(ovData);
      setDepartments(deptData || []);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  const total = overview?.total_campus_emissions_kgco2e || 0;
  const scope2 = overview?.scope_breakdown?.scope_2 || 0;
  const scope2Pct = total > 0 ? ((scope2 / total) * 100).toFixed(1) : '100.0';

  if (loading) {
    return <LoadingSpinner size="lg" text="Processing Multi-Scope GHG Analytics..." className="min-h-[50vh]" />;
  }

  if (error) {
    return <ErrorState title="Failed to Load Analytics" message={error} onRetry={loadAnalytics} className="my-8" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-100 tracking-tight">
              GHG Carbon Intelligence & Multi-Scope Analytics
            </h2>
            <Badge variant="emerald">ISO 14064 Standard</Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Departmental emission intensity profiles, scope distributions, and energy-carbon correlation.
          </p>
        </div>

        <button
          onClick={loadAnalytics}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh Analytics
        </button>
      </div>

      {/* Metric Highlights Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card rounded-2xl p-5 border border-slate-800">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Total Inventory Emitted
          </div>
          <div className="text-2xl font-extrabold text-slate-100 font-mono mt-1">
            {formatCarbon(total)}
          </div>
          <div className="text-xs text-slate-400 mt-1">Direct + Grid + Supply chain</div>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-slate-800">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Scope 2 Electricity Dominance
          </div>
          <div className="text-2xl font-extrabold text-emerald-400 font-mono mt-1">
            {scope2Pct}%
          </div>
          <div className="text-xs text-slate-400 mt-1">Primary decarbonization target</div>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-slate-800">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Monitored Department Zones
          </div>
          <div className="text-2xl font-extrabold text-purple-400 font-mono mt-1">
            {departments.length} Zones
          </div>
          <div className="text-xs text-slate-400 mt-1">Active telemetry endpoints</div>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scope Breakdown */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-200">Emissions by Scope</h3>
              <p className="text-[11px] text-slate-400">Distribution across Scope 1, 2, and 3</p>
            </div>
            <PieIcon className="w-4 h-4 text-emerald-400" />
          </div>
          <ScopeDonutChart scopeBreakdown={overview?.scope_breakdown} totalEmissions={total} />
        </div>

        {/* Department Ranking */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-200">Departmental Carbon Footprint</h3>
              <p className="text-[11px] text-slate-400">Ranked by total kg CO₂e emitted</p>
            </div>
            <BarChart3 className="w-4 h-4 text-cyan-400" />
          </div>
          <DepartmentBarChart departmentRankings={overview?.top_departments} />
        </div>
      </div>

      {/* Full Width Monthly Trend */}
      <div className="glass-card rounded-2xl p-5 border border-slate-800">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-200">Historical Monthly Carbon Profile</h3>
            <p className="text-[11px] text-slate-400">Aggregate emissions trend over time</p>
          </div>
          <Activity className="w-4 h-4 text-brand-400" />
        </div>
        <MonthlyTrendChart />
      </div>
    </div>
  );
};
