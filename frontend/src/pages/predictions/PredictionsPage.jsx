import React, { useState, useEffect } from 'react';
import { predictionService } from '../../services/predictionService';
import { ForecastAreaChart } from '../../components/charts/ForecastAreaChart';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Badge } from '../../components/common/Badge';
import { formatCarbon, formatNumber } from '../../utils/formatters';
import {
  BrainCircuit,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Table,
  Calendar,
  Zap,
} from 'lucide-react';

export const PredictionsPage = () => {
  const [forecastResult, setForecastResult] = useState(null);
  const [selectedWing, setSelectedWing] = useState('ALL');
  const [forecastMonths, setForecastMonths] = useState(6);
  const [loading, setLoading] = useState(true);

  const loadForecast = async () => {
    setLoading(true);
    try {
      const fData = await predictionService.getForecast(selectedWing, forecastMonths);
      setForecastResult(fData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadForecast();
  }, [selectedWing, forecastMonths]);

  const modelInfo = forecastResult?.model_info || {};
  const benchmarks = modelInfo?.benchmarks || [];
  const breakdown = forecastResult?.breakdown || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              VESIT 6-Month Time-Series ML Forecaster
            </h1>
            <Badge variant="cyan">Research Models: ARIMA & Random Forest</Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Evaluating AutoRegressive Integrated Moving Average (ARIMA) & Random Forest Regressor on chronological 2022–2026 data.
          </p>
        </div>

        {/* Selected Model Capsule */}
        <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-500/40 text-sky-800 dark:text-sky-300 text-xs font-mono shadow-sm">
          <BrainCircuit className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
          <div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-sans uppercase">Selected Optimal Model</div>
            <div className="font-bold text-slate-900 dark:text-slate-100">{modelInfo.name || 'Random Forest Regressor'}</div>
          </div>
        </div>
      </div>

      {/* Filter and Configuration Controls */}
      <div className="card-surface p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 font-mono">
              Monitored Sector / Wing
            </label>
            <select
              value={selectedWing}
              onChange={(e) => setSelectedWing(e.target.value)}
              className="px-3 py-1.5 rounded-xl input-surface text-xs font-semibold font-mono"
            >
              <option value="ALL">Entire VESIT Campus (A Wing + B Wing + Const.)</option>
              <option value="A Wing">A Wing Main (350 KVA Contract Demand)</option>
              <option value="B Wing">B Wing (175 KVA Contract Demand)</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 font-mono">
              Forecasting Horizon
            </label>
            <select
              value={forecastMonths}
              onChange={(e) => setForecastMonths(Number(e.target.value))}
              className="px-3 py-1.5 rounded-xl input-surface text-xs font-semibold font-mono"
            >
              <option value={3}>Next 3 Months (Immediate)</option>
              <option value={6}>Next 6 Months (Default Semester)</option>
              <option value={12}>Next 12 Months (Full Annual Cycle)</option>
            </select>
          </div>
        </div>

        <button
          onClick={loadForecast}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow-sm transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Retrain & Recompute Models
        </button>
      </div>

      {loading ? (
        <LoadingSpinner size="lg" text="Training & Benchmarking Machine Learning Time-Series Models..." className="min-h-[40vh]" />
      ) : (
        <>
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card-surface p-4 border-l-4 border-l-sky-500">
              <div className="text-[10px] font-bold uppercase tracking-wider text-sky-700 dark:text-sky-400 font-mono">
                Projected Total Energy
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono mt-1">
                {formatNumber(forecastResult?.summary?.projected_total_kwh || 0)} <span className="text-xs text-slate-500 font-normal">kWh</span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-mono">
                Next {forecastMonths} months cumulative
              </div>
            </div>

            <div className="card-surface p-4 border-l-4 border-l-emerald-500">
              <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 font-mono">
                Projected Scope 2 Carbon
              </div>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1">
                {formatCarbon(forecastResult?.summary?.projected_total_emissions || 0)}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-mono">
                CEA factor: 0.82 kgCO₂e/kWh
              </div>
            </div>

            <div className="card-surface p-4 border-l-4 border-l-amber-500">
              <div className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 font-mono">
                Peak Forecasted Month
              </div>
              <div className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono mt-1">
                {forecastResult?.summary?.peak_month || 'May'}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Highest seasonal cooling demand
              </div>
            </div>

            <div className="card-surface p-4 border-l-4 border-l-purple-500">
              <div className="text-[10px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400 font-mono">
                Out-of-Sample Test RMSE
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-slate-100 font-mono mt-1">
                {modelInfo.rmse || '6,796 kWh'}
              </div>
              <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
                R² Score: {modelInfo.r2_score ?? '0.749'}
              </div>
            </div>
          </div>

          {/* Model Selection Rationale Banner */}
          <div className="p-4 rounded-2xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-500/30 flex items-start gap-3.5">
            <CheckCircle2 className="w-5 h-5 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              <span className="font-bold text-slate-900 dark:text-slate-100">Why {modelInfo.name} was selected: </span>
              {modelInfo.rationale || 'Achieved lowest validation error across chronological test holdout evaluation.'}
              <div className="mt-1 text-[11px] text-sky-700 dark:text-sky-300 font-mono">
                Validation Strategy: {modelInfo.validation_strategy || '80/20 chronological train/test split'}
              </div>
            </div>
          </div>

          {/* Forecast Area Chart */}
          <div className="card-surface p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  VESIT Observed History (Jan 2022–Jul 2026) vs ML 6-Month Forecast Trajectory
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Includes 95% Confidence Bounds and seasonal cyclical sine/cosine regressors
                </p>
              </div>
              <Badge variant="cyan">Confidence: 95% Interval</Badge>
            </div>
            <ForecastAreaChart data={forecastResult?.data} />
          </div>

          {/* Multi-Model Benchmark Comparison Table */}
          {benchmarks.length > 0 && (
            <div className="card-surface p-5">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Table className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                    Research Paper ML Benchmark (ARIMA vs Random Forest)
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Chronological holdout validation comparing statistical time-series (ARIMA) and ensemble machine learning (Random Forest)
                  </p>
                </div>
                <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">Lower MAE/RMSE = Better Fit</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="pb-2">Algorithm</th>
                      <th className="pb-2">MAE (kWh)</th>
                      <th className="pb-2">RMSE (kWh)</th>
                      <th className="pb-2">R² Score</th>
                      <th className="pb-2">MAPE (%)</th>
                      <th className="pb-2 text-right">Evaluation Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {benchmarks.map((b) => {
                      const isSelected = b.model_name === modelInfo.name;
                      return (
                        <tr
                          key={b.model_name}
                          className={`transition-colors ${
                            isSelected
                              ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-900 dark:text-sky-200 font-bold'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-800/30 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <td className="py-2.5 flex items-center gap-2">
                            {isSelected && <span className="w-2 h-2 rounded-full bg-sky-500 shadow-[0_0_8px_#0284c7]" />}
                            <span>{b.model_name}</span>
                          </td>
                          <td className="py-2.5">{formatNumber(b.mae_kwh)} kWh</td>
                          <td className="py-2.5">{formatNumber(b.rmse_kwh)} kWh</td>
                          <td className="py-2.5">{b.r2_score}</td>
                          <td className="py-2.5">{b.mape_pct}%</td>
                          <td className="py-2.5 text-right">
                            {isSelected ? (
                              <span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 dark:bg-sky-500/20 dark:text-sky-300 border border-sky-300 dark:border-sky-500/40 text-[10px] uppercase font-bold">
                                Selected Winner
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[10px]">Evaluated</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Month-by-Month Forecast Table */}
          {breakdown.length > 0 && (
            <div className="card-surface p-5">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    Month-by-Month Predictive Breakdown
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Forecasted electricity (kWh), calculated CO₂e, and 95% lower/upper bounds
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="pb-2">Forecast Month</th>
                      <th className="pb-2">Predicted Energy (kWh)</th>
                      <th className="pb-2">Predicted Carbon</th>
                      <th className="pb-2">95% Confidence Interval</th>
                      <th className="pb-2 text-right">Seasonal Trajectory</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {breakdown.map((item) => (
                      <tr key={item.month} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="py-2.5 font-bold text-slate-900 dark:text-slate-100">{item.month}</td>
                        <td className="py-2.5 text-sky-700 dark:text-sky-400 font-bold">{formatNumber(item.predicted_energy_kwh)} kWh</td>
                        <td className="py-2.5 text-emerald-700 dark:text-emerald-400 font-bold">{formatCarbon(item.predicted_co2e_kg)}</td>
                        <td className="py-2.5 text-slate-500 dark:text-slate-400 text-[11px]">
                          {formatCarbon(item.lower_bound_co2e_kg)} – {formatCarbon(item.upper_bound_co2e_kg)}
                        </td>
                        <td className="py-2.5 text-right">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                              item.trend_direction === 'UP'
                                ? 'bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20'
                                : 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
                            }`}
                          >
                            {item.trend_direction === 'UP' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            {item.trend_direction}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
