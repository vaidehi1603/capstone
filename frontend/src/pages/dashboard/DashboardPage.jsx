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
        // Fetch VESIT Actual Records
        const [overviewRes, historyRes, annualRes, appRes] = await Promise.all([
          analyticsService.getDashboardOverview('VESIT_ACTUAL').catch(() => null),
          analyticsService.getVesitHistory().catch(() => ({ history: [] })),
          analyticsService.getVesitAnnualTrends().catch(() => ({ annual_trends: [] })),
          analyticsService.getVesitAppliances().catch(() => null),
        ]);
        setOverview(overviewRes);
        setVesitHistory(historyRes?.history || []);
        setVesitAnnual(annualRes?.annual_trends || []);
        setVesitAppliances(appRes);
      } else {
        // Fetch Test / Demo Records
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

  // Filter history by selected year
  const filteredHistory = selectedYearFilter === 'ALL'
    ? vesitHistory
    : vesitHistory.filter((h) => String(h.year) === selectedYearFilter);

  // Computed Aggregates
  const totalVesitKwh = vesitHistory.reduce((acc, h) => acc + (h.total_kwh || 0), 0);
  const totalVesitCo2e = vesitHistory.reduce((acc, h) => acc + (h.total_co2e || 0), 0);
  const totalAWingKwh = vesitHistory.reduce((acc, h) => acc + (h.a_wing_kwh || 0), 0);
  const totalBWingKwh = vesitHistory.reduce((acc, h) => acc + (h.b_wing_kwh || 0), 0);
  const totalAmountPaid = vesitHistory.reduce((acc, h) => acc + (h.total_amount || 0), 0);
  const avgTariff = totalVesitKwh > 0 ? (totalAmountPaid / totalVesitKwh).toFixed(2) : '14.50';

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading Carbon Intelligence Executive Dashboard..." className="min-h-[60vh]" />;
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
        {/* Institute Executive Banner */}
        <div className="card-surface p-6 relative overflow-hidden bg-gradient-to-r from-emerald-500/10 via-transparent to-sky-500/10 border-emerald-300 dark:border-emerald-500/30">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/40 text-[11px] font-bold uppercase tracking-wider font-mono">
                  Primary Institute Dataset
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-mono border border-slate-200 dark:border-slate-700">
                  Jan 2022 – Jul 2026 (55 Recorded Months)
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 mt-2 tracking-tight">
                V.E.S. Institute of Technology (VESIT)
              </h1>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
                Official Carbon Accounting & Scope 2 Energy Telemetry. Ingested from verified MSEDCL/Tata Power utility records across A Wing (350 KVA Contract Demand), B Wing (175 KVA Demand), and campus infrastructure.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
              <NavLink
                to="/data/electricity"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Manage Electricity Records
              </NavLink>
            </div>
          </div>
        </div>

        {/* Executive KPI Stat Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Campus Carbon"
            value={formatCarbon(totalVesitCo2e)}
            subtitle={`${(totalVesitCo2e / 1000).toFixed(1)} Metric Tonnes CO₂e cumulative`}
            icon={Globe2}
            variant="emerald"
            badgeText="CEA 0.82 Factor"
            tooltip="Calculated in compliance with ISO 14064 using Central Electricity Authority factor (0.82 kgCO2e/kWh)"
          />

          <StatCard
            title="Total Metered Electricity"
            value={`${formatNumber(totalVesitKwh)} kWh`}
            subtitle="55 Recorded Months (2022–2026)"
            icon={Zap}
            variant="cyan"
            badgeText="Grid Metered"
            tooltip="Sum of A Wing + B Wing + Construction utility meters"
          />

          <StatCard
            title="A Wing (350 KVA Demand)"
            value={`${formatNumber(totalAWingKwh)} kWh`}
            subtitle={`${((totalAWingKwh / totalVesitKwh) * 100).toFixed(1)}% of Campus Total`}
            icon={Building2}
            variant="purple"
            badgeText="A Wing Main"
            tooltip="Main academic wing, classrooms, administrative offices, and main server room"
          />

          <StatCard
            title="B Wing (175 KVA Demand)"
            value={`${formatNumber(totalBWingKwh)} kWh`}
            subtitle={`${((totalBWingKwh / totalVesitKwh) * 100).toFixed(1)}% of Campus Total`}
            icon={Building2}
            variant="amber"
            badgeText="B Wing"
            tooltip="Secondary academic wing and laboratory facilities"
          />
        </div>

        {/* Annual Trends & YoY Evolution Strip */}
        <div className="card-surface p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                VESIT Annual Carbon & Electricity Evolution (2022–2026)
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Year-over-Year consumption shifts, grid expenditures, and calculated emissions.
              </p>
            </div>
            <span className="text-[11px] font-mono text-slate-600 dark:text-slate-400">
              Avg Tariff: <strong className="text-emerald-600 dark:text-emerald-400">₹{avgTariff}/kWh</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {vesitAnnual.map((y) => (
              <div
                key={y.year}
                className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-extrabold text-slate-900 dark:text-slate-100 font-mono">{y.year}</span>
                  {y.yoy_change_pct !== null && y.yoy_change_pct !== undefined ? (
                    <span
                      className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                        y.yoy_change_pct >= 0
                          ? 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20'
                          : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
                      }`}
                    >
                      {y.yoy_change_pct >= 0 ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                      {Math.abs(y.yoy_change_pct)}% YoY
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-slate-400">Baseline</span>
                  )}
                </div>

                <div className="my-2.5 space-y-1">
                  <div className="text-base font-black text-slate-900 dark:text-slate-100 font-mono">
                    {formatNumber(y.total_kwh)} <span className="text-[10px] font-normal text-slate-500">kWh</span>
                  </div>
                  <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 font-mono">
                    {y.total_co2e_tons} <span className="text-[10px] text-slate-500 font-normal">tCO₂e</span>
                  </div>
                </div>

                <div className="border-t border-slate-200 dark:border-slate-800/80 pt-2 text-[10px] text-slate-500 dark:text-slate-400 space-y-0.5 font-mono">
                  <div className="flex justify-between">
                    <span>Expenditure:</span>
                    <span className="text-slate-800 dark:text-slate-300">₹{(y.total_expense_inr / 100000).toFixed(1)}L</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Peak Month:</span>
                    <span className="text-sky-600 dark:text-sky-400">{y.max_month}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Wing Trends Chart + Year Selector */}
        <div className="card-surface p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Monthly Wing Electricity Breakdown & Seasonal Trajectory
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Comparison of A Wing (350 KVA) vs B Wing (175 KVA) meter recordings across 2022–2026.
              </p>
            </div>

            {/* Year filter buttons */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950/80 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-mono">
              {['ALL', '2026', '2025', '2024', '2023', '2022'].map((yr) => (
                <button
                  key={yr}
                  onClick={() => setSelectedYearFilter(yr)}
                  className={`px-2.5 py-1 rounded-lg transition-colors ${
                    selectedYearFilter === yr
                      ? 'bg-emerald-600 text-white font-bold shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
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
          <div className="card-surface p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                  VESIT Electrical Asset & Appliance Inventory
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {vesitAppliances.total_equipment_count?.toLocaleString()} Monitored Electrical Devices across Campus
                </p>
              </div>
              <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-sky-50 text-sky-800 border border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800/40">
                Estimated Load ~{vesitAppliances.appliance_energy_estimation?.total_estimated_monthly_kwh?.toLocaleString()} kWh/mo
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800/80 text-center">
                <Wind className="w-5 h-5 text-sky-600 dark:text-sky-400 mx-auto mb-1.5" />
                <div className="text-lg font-black text-slate-900 dark:text-slate-100 font-mono">308</div>
                <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Air Conditioners</div>
                <div className="text-[9px] text-slate-500 font-mono mt-0.5">211x 2TR • 81x 1.5TR</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800/80 text-center">
                <Lightbulb className="w-5 h-5 text-amber-600 dark:text-amber-400 mx-auto mb-1.5" />
                <div className="text-lg font-black text-slate-900 dark:text-slate-100 font-mono">3,235</div>
                <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Lighting Fixtures</div>
                <div className="text-[9px] text-slate-500 font-mono mt-0.5">LEDs + 536 Tubes</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800/80 text-center">
                <Laptop className="w-5 h-5 text-purple-600 dark:text-purple-400 mx-auto mb-1.5" />
                <div className="text-lg font-black text-slate-900 dark:text-slate-100 font-mono">1,400</div>
                <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Computer Labs</div>
                <div className="text-[9px] text-slate-500 font-mono mt-0.5">1400 PCs • 150 Printers</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800/80 text-center">
                <Wind className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mx-auto mb-1.5" />
                <div className="text-lg font-black text-slate-900 dark:text-slate-100 font-mono">1,236</div>
                <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Ceiling Fans</div>
                <div className="text-[9px] text-slate-500 font-mono mt-0.5">Classrooms & Labs</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800/80 text-center">
                <Building2 className="w-5 h-5 text-rose-600 dark:text-rose-400 mx-auto mb-1.5" />
                <div className="text-lg font-black text-slate-900 dark:text-slate-100 font-mono">8</div>
                <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Passenger Lifts</div>
                <div className="text-[9px] text-slate-500 font-mono mt-0.5">A & B Wing Towers</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800/80 text-center">
                <Zap className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mx-auto mb-1.5" />
                <div className="text-lg font-black text-slate-900 dark:text-slate-100 font-mono">9</div>
                <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Water Pumps</div>
                <div className="text-[9px] text-slate-500 font-mono mt-0.5">3HP – 10HP Motors</div>
              </div>
            </div>

            <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
              <p className="leading-relaxed text-[11px]">
                {vesitAppliances.appliance_energy_estimation?.disclaimer}
              </p>
            </div>
          </div>
        )}

        {/* Bottom Row: Recent Invoices & Intelligence Launchers */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Monthly Records Table */}
          <div className="lg:col-span-2 card-surface p-5">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Latest VESIT Electricity Records</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Verified monthly invoices with calculated Scope 2 CO₂e</p>
              </div>
              <NavLink
                to="/data/electricity"
                className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
              >
                Full History <ArrowRight className="w-3.5 h-3.5" />
              </NavLink>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-medium font-mono">
                  <tr>
                    <th className="pb-2">Month</th>
                    <th className="pb-2">A Wing (kWh)</th>
                    <th className="pb-2">B Wing (kWh)</th>
                    <th className="pb-2">Total (kWh)</th>
                    <th className="pb-2">Amount Paid</th>
                    <th className="pb-2 text-right">Computed CO₂e</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
                  {vesitHistory.slice(-6).reverse().map((row) => (
                    <tr key={row.date} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-2.5 font-bold text-slate-800 dark:text-slate-200">{row.month_name} {row.year}</td>
                      <td className="py-2.5 text-sky-700 dark:text-sky-400">{formatNumber(row.a_wing_kwh)}</td>
                      <td className="py-2.5 text-amber-700 dark:text-amber-400">{formatNumber(row.b_wing_kwh)}</td>
                      <td className="py-2.5 font-bold text-slate-900 dark:text-slate-100">{formatNumber(row.total_kwh)}</td>
                      <td className="py-2.5 text-slate-600 dark:text-slate-300">₹{formatNumber(row.total_amount)}</td>
                      <td className="py-2.5 text-right font-bold text-emerald-600 dark:text-emerald-400">
                        {formatCarbon(row.total_co2e)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* AI Advisor & 6-Month Forecaster Launchers */}
          <div className="space-y-4">
            <div className="card-surface p-5 border-emerald-300 dark:border-emerald-500/30 bg-gradient-to-br from-emerald-50/50 to-transparent dark:from-emerald-950/20 dark:to-transparent">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-xs uppercase tracking-wider mb-2 font-mono">
                <Sparkles className="w-4 h-4" />
                Decarbonization Advisory
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                Tailored efficiency strategies for VESIT's 308 AC units, 1,400 lab PCs, and 536 fluorescent tubes with payback modeling.
              </p>
              <NavLink
                to="/recommendations"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors shadow-sm"
              >
                View Recommendations
                <ArrowRight className="w-3.5 h-3.5" />
              </NavLink>
            </div>

            <div className="card-surface p-5 border-sky-300 dark:border-sky-500/30 bg-gradient-to-br from-sky-50/50 to-transparent dark:from-sky-950/20 dark:to-transparent">
              <div className="flex items-center gap-2 text-sky-700 dark:text-sky-400 font-bold text-xs uppercase tracking-wider mb-2 font-mono">
                <Cpu className="w-4 h-4" />
                6-Month ML Forecaster
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                Evaluates ARIMA and Random Forest models across chronological 2022–2026 data to predict seasonal peak load.
              </p>
              <NavLink
                to="/predictions"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-colors shadow-sm"
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
  // VIEW B: TEST / DEMO DATA MODE
  // ==========================================
  const totalEmissions = overview?.total_campus_emissions_kgco2e || 0;
  const scope1 = overview?.scope_breakdown?.scope_1 || 0;
  const scope2 = overview?.scope_breakdown?.scope_2 || 0;
  const _scope3 = overview?.scope_breakdown?.scope_3 || 0;
  const topDept = overview?.top_departments?.[0]?.department_name || 'No Data';

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              Executive Carbon Dashboard
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-300 dark:border-amber-500/30 text-[10px] font-bold uppercase tracking-wider font-mono">
              Test / Demo Mode
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Synthesized multi-department telemetry, scope breakdowns, and automated ISO 14064 calculations.
          </p>
        </div>

        {(isAdmin || isMaintenance) && (
          <button
            onClick={() => setIsAddElectricityOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-sm"
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
          title="Scope 1: Direct Combustion"
          value={formatCarbon(scope1)}
          subtitle="DG generators & campus fleet"
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
        <div className="card-surface p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 mb-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">GHG Scope Breakdown</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Direct vs Indirect vs Supply Chain</p>
            </div>
            <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40">
              ISO 14064
            </span>
          </div>
          <ScopeDonutChart scopeBreakdown={overview?.scope_breakdown} totalEmissions={totalEmissions} />
        </div>

        <div className="card-surface p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 mb-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Department Footprint Ranking</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Ranked by carbon intensity</p>
            </div>
            <NavLink to="/departments" className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold hover:underline">
              View All
            </NavLink>
          </div>
          <DepartmentBarChart departmentRankings={overview?.top_departments} />
        </div>

        <div className="card-surface p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 mb-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Emission Trajectory</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Monthly multi-scope distribution</p>
            </div>
            <NavLink to="/analytics" className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold hover:underline">
              Deep Dive
            </NavLink>
          </div>
          <MonthlyTrendChart />
        </div>
      </div>

      {/* Recent Electricity Entries Table */}
      <div className="card-surface p-5">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Recent Electricity Entries</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Verified energy logs and calculated carbon emissions</p>
          </div>
          <NavLink
            to="/data/electricity"
            className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
          >
            Full History <ArrowRight className="w-3.5 h-3.5" />
          </NavLink>
        </div>

        {electricityRecords.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-xs">
            No electricity data recorded yet in demo set.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-medium">
                <tr>
                  <th className="pb-2">ID</th>
                  <th className="pb-2">Department</th>
                  <th className="pb-2">Consumption (kWh)</th>
                  <th className="pb-2">Source</th>
                  <th className="pb-2">Timestamp</th>
                  <th className="pb-2 text-right">Computed CO₂e</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {electricityRecords.slice(0, 5).map((row) => {
                  const dept = departments.find((d) => d.id === row.department_id);
                  return (
                    <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-2.5 font-mono text-slate-400">#{row.id}</td>
                      <td className="py-2.5 font-medium text-slate-800 dark:text-slate-200">
                        {dept ? `${dept.name} (${dept.code})` : `Dept #${row.department_id}`}
                      </td>
                      <td className="py-2.5 font-mono text-slate-700 dark:text-slate-300">{formatNumber(row.kwh)} kWh</td>
                      <td className="py-2.5">
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-medium font-mono">
                          {row.source}
                        </span>
                      </td>
                      <td className="py-2.5 text-slate-500 dark:text-slate-400">{formatDate(row.timestamp)}</td>
                      <td className="py-2.5 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
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
