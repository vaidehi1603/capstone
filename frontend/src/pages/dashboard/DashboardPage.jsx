import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { analyticsService } from '../../services/analyticsService';
import { electricityService } from '../../services/electricityService';
import { departmentService } from '../../services/departmentService';
import { useAuth } from '../../hooks/useAuth';
import { StatCard } from '../../components/common/StatCard';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorState } from '../../components/common/ErrorState';
import { ScopeDonutChart } from '../../components/charts/ScopeDonutChart';
import { DepartmentBarChart } from '../../components/charts/DepartmentBarChart';
import { MonthlyTrendChart } from '../../components/charts/MonthlyTrendChart';
import { Modal } from '../../components/common/Modal';
import { ElectricityForm } from '../../components/forms/ElectricityForm';
import { formatCarbon, formatNumber, formatDate, extractErrorMessage } from '../../utils/formatters';
import {
  Flame,
  Zap,
  Globe2,
  Building2,
  Plus,
  ArrowRight,
  Sparkles,
  Cpu,
} from 'lucide-react';

export const DashboardPage = () => {
  const { isAdmin, isMaintenance } = useAuth();
  const [overview, setOverview] = useState(null);
  const [electricityRecords, setElectricityRecords] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAddElectricityOpen, setIsAddElectricityOpen] = useState(false);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      let overviewData = null;
      try {
        overviewData = await analyticsService.getDashboardOverview();
      } catch (e) {
        console.warn('Overview fetch notice (role or empty state)', e);
        overviewData = {
          total_campus_emissions_kgco2e: 0,
          scope_breakdown: { scope_1: 0, scope_2: 0, scope_3: 0 },
          top_departments: [],
        };
      }

      const [elecData, deptData] = await Promise.all([
        electricityService.getElectricityData().catch(() => []),
        departmentService.getDepartments().catch(() => []),
      ]);

      setOverview(overviewData);
      setElectricityRecords(elecData || []);
      setDepartments(deptData || []);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const totalEmissions = overview?.total_campus_emissions_kgco2e || 0;
  const scope1 = overview?.scope_breakdown?.scope_1 || 0;
  const scope2 = overview?.scope_breakdown?.scope_2 || 0;
  const topDept = overview?.top_departments?.[0]?.department_name || 'No Data';

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading Real-Time Carbon Intelligence Dashboard..." className="min-h-[60vh]" />;
  }

  if (error) {
    return <ErrorState title="Failed to Load Dashboard" message={error} onRetry={fetchDashboardData} className="my-8" />;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-100 tracking-tight">
              Executive Carbon Dashboard
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/30 text-[10px] font-bold uppercase tracking-wider font-mono">
              Live GHG Feed
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time carbon emissions telemetry, scope breakdowns, and automated ISO 14064 calculations.
          </p>
        </div>

        {/* Action button if role allows data entry */}
        {(isAdmin || isMaintenance) && (
          <button
            onClick={() => setIsAddElectricityOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition-all shadow-lg shadow-brand-900/40"
          >
            <Plus className="w-4 h-4" />
            Add Electricity Entry
          </button>
        )}
      </div>

      {/* KPI Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Campus Carbon"
          value={formatCarbon(totalEmissions)}
          subtitle="Aggregated Scope 1 + 2 + 3"
          icon={Globe2}
          variant="emerald"
          badgeText="Active Period"
        />

        <StatCard
          title="Scope 2: Grid Electricity"
          value={formatCarbon(scope2)}
          subtitle="Computed at 0.82 kgCO₂e/kWh"
          icon={Zap}
          variant="cyan"
          badgeText="CEA Factor"
        />

        <StatCard
          title="Scope 1: Direct Fleet & DG"
          value={formatCarbon(scope1)}
          subtitle="Combustion & campus transport"
          icon={Flame}
          variant="amber"
          badgeText="Scope 1"
        />

        <StatCard
          title="Top Emitting Unit"
          value={topDept}
          subtitle={`${departments.length} Monitored Departments`}
          icon={Building2}
          variant="purple"
          badgeText="Rank #1"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scope Breakdown Donut */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-2">
            <div>
              <h3 className="text-sm font-bold text-slate-200">GHG Scope Breakdown</h3>
              <p className="text-[11px] text-slate-400">Direct vs Indirect vs Commute</p>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 px-2 py-0.5 rounded bg-emerald-950/40 border border-emerald-800/40">
              ISO 14064
            </span>
          </div>
          <ScopeDonutChart scopeBreakdown={overview?.scope_breakdown} totalEmissions={totalEmissions} />
        </div>

        {/* Department Rankings Bar */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-2">
            <div>
              <h3 className="text-sm font-bold text-slate-200">Department Emissions Ranking</h3>
              <p className="text-[11px] text-slate-400">Top carbon intensive zones</p>
            </div>
            <NavLink to="/departments" className="text-xs text-brand-400 hover:text-brand-300 font-semibold">
              View All
            </NavLink>
          </div>
          <DepartmentBarChart departmentRankings={overview?.top_departments} />
        </div>

        {/* Monthly Trend Area */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-2">
            <div>
              <h3 className="text-sm font-bold text-slate-200">Emission Trajectory</h3>
              <p className="text-[11px] text-slate-400">Monthly trend & seasonal variance</p>
            </div>
            <NavLink to="/analytics" className="text-xs text-brand-400 hover:text-brand-300 font-semibold">
              Deep Dive
            </NavLink>
          </div>
          <MonthlyTrendChart />
        </div>
      </div>

      {/* Bottom Row: Recent Activity & AI Insights Shortcut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Electricity Activity Table */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-200">Recent Electricity Submissions</h3>
              <p className="text-[11px] text-slate-400">Synchronously calculated backend records</p>
            </div>
            <NavLink
              to="/data/electricity"
              className="text-xs font-semibold text-brand-400 hover:text-brand-300 flex items-center gap-1"
            >
              View Full History <ArrowRight className="w-3.5 h-3.5" />
            </NavLink>
          </div>

          {electricityRecords.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs">
              No electricity data recorded yet. Click "Add Electricity Entry" to begin logging campus power.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-slate-400 border-b border-slate-800 font-medium">
                  <tr>
                    <th className="pb-2">ID</th>
                    <th className="pb-2">Department</th>
                    <th className="pb-2">Consumption (kWh)</th>
                    <th className="pb-2">Source</th>
                    <th className="pb-2">Timestamp</th>
                    <th className="pb-2 text-right">Computed CO₂e</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {electricityRecords.slice(0, 5).map((row) => {
                    const dept = departments.find((d) => d.id === row.department_id);
                    return (
                      <tr key={row.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-2.5 font-mono text-slate-500">#{row.id}</td>
                        <td className="py-2.5 font-medium text-slate-200">
                          {dept ? `${dept.name} (${dept.code})` : `Dept #${row.department_id}`}
                        </td>
                        <td className="py-2.5 font-mono text-slate-300">{formatNumber(row.kwh)} kWh</td>
                        <td className="py-2.5">
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-medium">
                            {row.source}
                          </span>
                        </td>
                        <td className="py-2.5 text-slate-400">{formatDate(row.timestamp)}</td>
                        <td className="py-2.5 text-right font-mono font-bold text-emerald-400">
                          {formatCarbon(row.kwh * 0.82)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* AI & What-if Quick Action Cards */}
        <div className="space-y-4">
          <div className="glass-card rounded-2xl p-5 border border-brand-500/30 bg-gradient-to-br from-brand-950/40 to-slate-900">
            <div className="flex items-center gap-2 text-brand-400 font-bold text-xs uppercase tracking-wider mb-2">
              <Sparkles className="w-4 h-4" />
              AI Decarbonization Actions
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              AI recommendations identify peak energy spikes and rooftop solar opportunities with 3.2 year payback.
            </p>
            <NavLink
              to="/recommendations"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-brand-600/80 hover:bg-brand-500 text-white text-xs font-bold transition-colors"
            >
              Explore AI Recommendations
              <ArrowRight className="w-3.5 h-3.5" />
            </NavLink>
          </div>

          <div className="glass-card rounded-2xl p-5 border border-cyan-500/30 bg-gradient-to-br from-cyan-950/40 to-slate-900">
            <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase tracking-wider mb-2">
              <Cpu className="w-4 h-4" />
              What-If Policy Simulation
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Simulate solar PV expansion, EV transit, and smart HVAC setback temperatures on net campus carbon.
            </p>
            <NavLink
              to="/simulation"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-cyan-600/80 hover:bg-cyan-500 text-white text-xs font-bold transition-colors"
            >
              Launch Simulator
              <ArrowRight className="w-3.5 h-3.5" />
            </NavLink>
          </div>
        </div>
      </div>

      {/* Add Electricity Modal */}
      <Modal
        isOpen={isAddElectricityOpen}
        onClose={() => setIsAddElectricityOpen(false)}
        title="Record Campus Electricity Consumption"
        subtitle="Data submission triggers synchronous Scope 2 carbon calculation on the backend."
      >
        <ElectricityForm
          departments={departments}
          onSuccess={() => {
            setIsAddElectricityOpen(false);
            fetchDashboardData();
          }}
          onCancel={() => setIsAddElectricityOpen(false)}
        />
      </Modal>
    </div>
  );
};
