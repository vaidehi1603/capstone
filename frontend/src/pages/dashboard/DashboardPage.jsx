import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { analyticsService } from '../../services/analyticsService';
import { electricityService } from '../../services/electricityService';
import { departmentService } from '../../services/departmentService';
import { useAuth } from '../../hooks/useAuth';
import { useDataMode } from '../../context/DataModeContext';
import { StatCard } from '../../components/common/StatCard';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorState } from '../../components/common/ErrorState';
import { ScopeDonutChart } from '../../components/charts/ScopeDonutChart';
import { DepartmentBarChart } from '../../components/charts/DepartmentBarChart';
import { MonthlyTrendChart } from '../../components/charts/MonthlyTrendChart';
import { VesitWingTrendChart } from '../../components/charts/VesitWingTrendChart';
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
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  Layers,
  Laptop,
  Wind,
  Lightbulb,
  FileSpreadsheet,
} from 'lucide-react';

export const DashboardPage = () => {
  const { isAdmin, isMaintenance } = useAuth();
  const { isVesit } = useDataMode();
  const [overview, setOverview] = useState(null);
  const [vesitHistory, setVesitHistory] = useState([]);
  const [vesitAnnual, setVesitAnnual] = useState([]);
  const [vesitAppliances, setVesitAppliances] = useState(null);
  const [selectedYearFilter, setSelectedYearFilter] = useState('ALL');
  const [electricityRecords, setElectricityRecords] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAddElectricityOpen, setIsAddElectricityOpen] = useState(false);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (isVesit) {
        // Fetch VESIT Actual Data
        const [overviewRes, historyRes, annualRes, appRes] = await Promise.all([
          analyticsService.getDashboardOverview('VESIT_ACTUAL').catch(() => null),
          analyticsService.getVesitHistory().catch(() => ({ history: [] })),
          analyticsService.getVesitAnnualTrends().catch(() => ({ annual_trends: [] })),
          analyticsService.getVesitAppliances().catch(() => null),
        ]);
        setOverview(overviewRes);
        setVesitHistory(historyRes.history || []);
        setVesitAnnual(annualRes.annual_trends || []);
        setVesitAppliances(appRes);
      } else {
        // Fetch Test/Demo Data
        const [overviewData, elecData, deptData] = await Promise.all([
          analyticsService.getDashboardOverview('TEST_DEMO').catch(() => ({
            total_campus_emissions_kgco2e: 0,
            scope_breakdown: { scope_1: 0, scope_2: 0, scope_3: 0 },
            top_departments: [],
          })),
          electricityService.getElectricityData().catch(() => []),
          departmentService.getDepartments().catch(() => []),
        ]);
        setOverview(overviewData);
        setElectricityRecords(elecData || []);
        setDepartments(deptData || []);
      }
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [isVesit]);

  // Filter history by year tab
  const filteredHistory = selectedYearFilter === 'ALL'
    ? vesitHistory
    : vesitHistory.filter((h) => String(h.year) === selectedYearFilter);

  // Compute VESIT overall aggregates
  const totalVesitKwh = vesitHistory.reduce((acc, h) => acc + (h.total_kwh || 0), 0);
  const totalVesitCo2e = vesitHistory.reduce((acc, h) => acc + (h.total_co2e || 0), 0);
  const totalAWingKwh = vesitHistory.reduce((acc, h) => acc + (h.a_wing_kwh || 0), 0);
  const totalBWingKwh = vesitHistory.reduce((acc, h) => acc + (h.b_wing_kwh || 0), 0);
  const totalAmountPaid = vesitHistory.reduce((acc, h) => acc + (h.total_amount || 0), 0);
  const avgTariff = totalVesitKwh > 0 ? (totalAmountPaid / totalVesitKwh).toFixed(2) : '14.50';

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading Carbon Intelligence Dashboard..." className="min-h-[60vh]" />;
  }

  if (error) {
    return <ErrorState title="Failed to Load Dashboard" message={error} onRetry={fetchDashboardData} className="my-8" />;
  }

  // ==========================================
  // VIEW A: VESIT ACTUAL DATA MODE (DEFAULT)
  // ==========================================
  if (isVesit) {
    return (
      <div className="space-y-6">
        {/* Institute Banner */}
        <div className="glass-card rounded-2xl p-6 border border-emerald-500/30 bg-gradient-to-r from-slate-900 via-slate-900/90 to-emerald-950/40 relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold uppercase tracking-wider font-mono">
                  Primary Institute Dataset
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 font-mono border border-slate-700">
                  Jan 2022 – Jul 2026
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-100 mt-2 tracking-tight">
                V.E.S. Institute of Technology (VESIT)
              </h2>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                Official Carbon Accounting & Scope 2 Energy Telemetry. Ingested from verified MSEDCL/Tata Power utility records across A Wing (350 KVA Contract Demand), B Wing (175 KVA Demand), and campus infrastructure.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start md:self-auto">
              <NavLink
                to="/data/upload"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-950/50"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Upload Electricity Bill
              </NavLink>
            </div>
          </div>
        </div>

        {/* Executive KPI Stat Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Institute Carbon"
            value={formatCarbon(totalVesitCo2e)}
            subtitle={`${(totalVesitCo2e / 1000).toFixed(1)} Metric Tonnes CO₂e`}
            icon={Globe2}
            variant="emerald"
            badgeText="CEA 0.82 Factor"
          />

          <StatCard
            title="Total Metered Electricity"
            value={`${formatNumber(totalVesitKwh)} kWh`}
            subtitle="55 Recorded Months (2022–2026)"
            icon={Zap}
            variant="cyan"
            badgeText="Grid Metered"
          />

          <StatCard
            title="A Wing (350 KVA Demand)"
            value={`${formatNumber(totalAWingKwh)} kWh`}
            subtitle={`${((totalAWingKwh / totalVesitKwh) * 100).toFixed(1)}% of Campus Total`}
            icon={Building2}
            variant="purple"
            badgeText="A Wing Main"
          />

          <StatCard
            title="B Wing (175 KVA Demand)"
            value={`${formatNumber(totalBWingKwh)} kWh`}
            subtitle={`${((totalBWingKwh / totalVesitKwh) * 100).toFixed(1)}% of Campus Total`}
            icon={Building2}
            variant="amber"
            badgeText="B Wing"
          />
        </div>

        {/* Annual Trends & YoY Comparison Strip */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3 mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                VESIT Annual Carbon & Electricity Evolution (2022–2026)
              </h3>
              <p className="text-[11px] text-slate-400">
                Year-over-Year consumption shifts, grid expenses, and carbon emissions.
              </p>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              Avg Tariff: <strong className="text-emerald-400">₹{avgTariff}/kWh</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {vesitAnnual.map((y) => (
              <div
                key={y.year}
                className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-extrabold text-slate-100">{y.year}</span>
                  {y.yoy_change_pct !== null && y.yoy_change_pct !== undefined ? (
                    <span
                      className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                        y.yoy_change_pct >= 0
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}
                    >
                      {y.yoy_change_pct >= 0 ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                      {Math.abs(y.yoy_change_pct)}% YoY
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-slate-500">Baseline</span>
                  )}
                </div>

                <div className="my-2.5 space-y-1">
                  <div className="text-base font-black text-slate-100 font-mono">
                    {formatNumber(y.total_kwh)} <span className="text-[10px] font-normal text-slate-400">kWh</span>
                  </div>
                  <div className="text-xs font-semibold text-emerald-400 font-mono">
                    {y.total_co2e_tons} <span className="text-[10px] text-slate-400 font-normal">tCO₂e</span>
                  </div>
                </div>

                <div className="border-t border-slate-800/80 pt-2 text-[10px] text-slate-400 space-y-0.5 font-mono">
                  <div className="flex justify-between">
                    <span>Expense:</span>
                    <span className="text-slate-300">₹{(y.total_expense_inr / 100000).toFixed(1)}L</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Peak Month:</span>
                    <span className="text-cyan-400">{y.max_month}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Wing Trends Chart + Year Tabs */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3 mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-100">
                Monthly Wing Electricity Breakdown & Seasonal Cooling Trajectory
              </h3>
              <p className="text-[11px] text-slate-400">
                Comparison of A Wing (350 KVA) vs B Wing (175 KVA) meter recordings (2022–2026).
              </p>
            </div>

            {/* Year filter tabs */}
            <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800 text-xs font-mono">
              {['ALL', '2026', '2025', '2024', '2023', '2022'].map((yr) => (
                <button
                  key={yr}
                  onClick={() => setSelectedYearFilter(yr)}
                  className={`px-2.5 py-1 rounded-lg transition-colors ${
                    selectedYearFilter === yr
                      ? 'bg-brand-600 text-white font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {yr}
                </button>
              ))}
            </div>
          </div>

          <VesitWingTrendChart data={filteredHistory} />
        </div>

        {/* VESIT Electrical Load & Asset Inventory Overview */}
        {vesitAppliances && (
          <div className="glass-card rounded-2xl p-5 border border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  VESIT Electrical Asset & Appliance Inventory
                </h3>
                <p className="text-[11px] text-slate-400">
                  {vesitAppliances.total_equipment_count?.toLocaleString()} Monitored Electrical Devices across Campus
                </p>
              </div>
              <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-cyan-950/40 text-cyan-300 border border-cyan-800/40">
                Estimated Load ~{vesitAppliances.appliance_energy_estimation?.total_estimated_monthly_kwh?.toLocaleString()} kWh/mo
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/80 text-center">
                <Wind className="w-5 h-5 text-cyan-400 mx-auto mb-1.5" />
                <div className="text-lg font-black text-slate-100 font-mono">308</div>
                <div className="text-[11px] font-bold text-slate-300">Air Conditioners</div>
                <div className="text-[9px] text-slate-500 font-mono mt-0.5">211x 2TR • 81x 1.5TR</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/80 text-center">
                <Lightbulb className="w-5 h-5 text-amber-400 mx-auto mb-1.5" />
                <div className="text-lg font-black text-slate-100 font-mono">3,235</div>
                <div className="text-[11px] font-bold text-slate-300">Lighting Fixtures</div>
                <div className="text-[9px] text-slate-500 font-mono mt-0.5">LEDs + 536 Tubes</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/80 text-center">
                <Laptop className="w-5 h-5 text-purple-400 mx-auto mb-1.5" />
                <div className="text-lg font-black text-slate-100 font-mono">1,400</div>
                <div className="text-[11px] font-bold text-slate-300">Computer Labs</div>
                <div className="text-[9px] text-slate-500 font-mono mt-0.5">1400 PCs • 150 Printers</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/80 text-center">
                <Wind className="w-5 h-5 text-emerald-400 mx-auto mb-1.5" />
                <div className="text-lg font-black text-slate-100 font-mono">1,236</div>
                <div className="text-[11px] font-bold text-slate-300">Ceiling Fans</div>
                <div className="text-[9px] text-slate-500 font-mono mt-0.5">Classrooms & Labs</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/80 text-center">
                <Building2 className="w-5 h-5 text-rose-400 mx-auto mb-1.5" />
                <div className="text-lg font-black text-slate-100 font-mono">8</div>
                <div className="text-[11px] font-bold text-slate-300">Passenger Lifts</div>
                <div className="text-[9px] text-slate-500 font-mono mt-0.5">A & B Wing Towers</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/80 text-center">
                <Zap className="w-5 h-5 text-brand-400 mx-auto mb-1.5" />
                <div className="text-lg font-black text-slate-100 font-mono">9</div>
                <div className="text-[11px] font-bold text-slate-300">Water Pumps</div>
                <div className="text-[9px] text-slate-500 font-mono mt-0.5">3HP – 10HP Motors</div>
              </div>
            </div>

            <div className="mt-4 p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-start gap-2.5 text-xs text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
              <p className="leading-relaxed text-[11px]">
                {vesitAppliances.appliance_energy_estimation?.disclaimer}
              </p>
            </div>
          </div>
        )}

        {/* Bottom Row: Recent Invoices & AI / What-If Launchers */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Monthly Records Table */}
          <div className="lg:col-span-2 glass-card rounded-2xl p-5 border border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-100">Latest VESIT Electricity Records</h3>
                <p className="text-[11px] text-slate-400">Recent monthly invoices with calculated Scope 2 CO₂e</p>
              </div>
              <NavLink
                to="/data/electricity"
                className="text-xs font-semibold text-brand-400 hover:text-brand-300 flex items-center gap-1"
              >
                Full 55-Month Dataset <ArrowRight className="w-3.5 h-3.5" />
              </NavLink>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-slate-400 border-b border-slate-800 font-medium font-mono">
                  <tr>
                    <th className="pb-2">Month</th>
                    <th className="pb-2">A Wing (kWh)</th>
                    <th className="pb-2">B Wing (kWh)</th>
                    <th className="pb-2">Total (kWh)</th>
                    <th className="pb-2">Amount Paid</th>
                    <th className="pb-2 text-right">Computed CO₂e</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {vesitHistory.slice(-6).reverse().map((row) => (
                    <tr key={row.date} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-2.5 font-bold text-slate-200">{row.month_name} {row.year}</td>
                      <td className="py-2.5 text-cyan-400">{formatNumber(row.a_wing_kwh)}</td>
                      <td className="py-2.5 text-emerald-400">{formatNumber(row.b_wing_kwh)}</td>
                      <td className="py-2.5 font-bold text-slate-100">{formatNumber(row.total_kwh)}</td>
                      <td className="py-2.5 text-slate-300">₹{formatNumber(row.total_amount)}</td>
                      <td className="py-2.5 text-right font-bold text-emerald-400">
                        {formatCarbon(row.total_co2e)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* AI Advisor & What-If Launchers */}
          <div className="space-y-4">
            <div className="glass-card rounded-2xl p-5 border border-brand-500/30 bg-gradient-to-br from-brand-950/40 to-slate-900">
              <div className="flex items-center gap-2 text-brand-400 font-bold text-xs uppercase tracking-wider mb-2">
                <Sparkles className="w-4 h-4" />
                Google Gemini AI Advisor
              </div>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                Analyzes VESIT's 308 AC units, 1,400 lab PCs, and 536 fluorescent tubes with custom payback schedules.
              </p>
              <NavLink
                to="/recommendations"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-brand-600/80 hover:bg-brand-500 text-white text-xs font-bold transition-colors"
              >
                View AI Recommendations
                <ArrowRight className="w-3.5 h-3.5" />
              </NavLink>
            </div>

            <div className="glass-card rounded-2xl p-5 border border-cyan-500/30 bg-gradient-to-br from-cyan-950/40 to-slate-900">
              <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase tracking-wider mb-2">
                <Cpu className="w-4 h-4" />
                6-Month ML Forecaster
              </div>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                Evaluates Ridge Regression, Random Forest, & Gradient Boosting across chronological 2022–2026 data.
              </p>
              <NavLink
                to="/predictions"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-cyan-600/80 hover:bg-cyan-500 text-white text-xs font-bold transition-colors"
              >
                Open ML Forecast
                <ArrowRight className="w-3.5 h-3.5" />
              </NavLink>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW B: TEST / DEMO DATA MODE (PRESERVED)
  // ==========================================
  const totalEmissions = overview?.total_campus_emissions_kgco2e || 0;
  const scope1 = overview?.scope_breakdown?.scope_1 || 0;
  const scope2 = overview?.scope_breakdown?.scope_2 || 0;
  const topDept = overview?.top_departments?.[0]?.department_name || 'No Data';

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-100 tracking-tight">
              Executive Carbon Dashboard
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-bold uppercase tracking-wider font-mono">
              Test / Demo Mode
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Synthesized multi-department telemetry, scope breakdowns, and automated ISO 14064 calculations.
          </p>
        </div>

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

      {/* Recent Electricity Activity Table */}
      <div className="glass-card rounded-2xl p-5 border border-slate-800">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-200">Recent Electricity Entries</h3>
            <p className="text-[11px] text-slate-400">Verified campus energy logs and calculated carbon emissions</p>
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
            No electricity data recorded yet in demo set.
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

      {/* Add Electricity Modal */}
      <Modal
        isOpen={isAddElectricityOpen}
        onClose={() => setIsAddElectricityOpen(false)}
        title="Record Campus Electricity Consumption"
        subtitle="Input verified electricity metrics for automated Scope 2 carbon calculation."
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
