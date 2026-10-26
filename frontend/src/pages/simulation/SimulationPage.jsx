import React, { useState, useEffect, useCallback } from 'react';
import { simulationService } from '../../services/simulationService';
import { useDataMode } from '../../context/DataModeContext';
import { SimulationBarChart } from '../../components/charts/SimulationBarChart';
import { Badge } from '../../components/common/Badge';
import { formatCarbon } from '../../utils/formatters';
import {
  Sun,
  Wind,
  Bus,
  Trash2,
  RotateCcw,
  Sliders,
  Info,
} from 'lucide-react';

export const SimulationPage = () => {
  const { isVesit } = useDataMode();
  const [solarOffsetPct, setSolarOffsetPct] = useState(25);
  const [hvacEfficiencyPct, setHvacEfficiencyPct] = useState(20);
  const [evTransitionPct, setEvTransitionPct] = useState(40);
  const [wasteDiversionPct, setWasteDiversionPct] = useState(50);

  const [simResult, setSimResult] = useState(null);

  const runSim = useCallback(async () => {
    try {
      const result = await simulationService.runSimulation({
        solarOffsetPct,
        hvacEfficiencyPct,
        evTransitionPct,
        wasteDiversionPct,
        baselineTotalKg: isVesit ? 418993 : 8200,
      });
      setSimResult(result);
    } catch (e) {
      console.error(e);
    }
  }, [solarOffsetPct, hvacEfficiencyPct, evTransitionPct, wasteDiversionPct, isVesit]);

  useEffect(() => {
    runSim();
  }, [runSim]);

  const handleReset = () => {
    setSolarOffsetPct(0);
    setHvacEfficiencyPct(0);
    setEvTransitionPct(0);
    setWasteDiversionPct(0);
  };

  const totalReductionKg = (simResult?.baseline_total_kg || 0) - (simResult?.projected_total_kg || 0);
  const pctReduction = simResult?.baseline_total_kg > 0
    ? ((totalReductionKg / simResult.baseline_total_kg) * 100).toFixed(1)
    : '0.0';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              Campus Sustainability Impact Simulator
            </h1>
            <Badge variant="cyan">Scenario Modeling</Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Simulate the carbon reduction and energy offsets of proposed green capital investments before official deployment.
          </p>
        </div>

        <button
          onClick={handleReset}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors shadow-sm"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset Sliders
        </button>
      </div>

      {/* Simulator Layout: Sliders on Left, Results on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Interactive Policy Sliders */}
        <div className="card-surface p-5 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              Policy Interventions
            </h2>
            <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">Dynamic Real-Time</span>
          </div>

          {/* Slider 1: Rooftop Solar PV */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                Rooftop Solar PV Expansion
              </span>
              <span className="font-mono font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800/40">
                {solarOffsetPct}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={solarOffsetPct}
              onChange={(e) => setSolarOffsetPct(Number(e.target.value))}
              className="w-full accent-amber-500 bg-slate-200 dark:bg-slate-800 h-2 rounded-lg cursor-pointer"
            />
            <p className="text-[10px] text-slate-500 dark:text-slate-400">Offsets daytime grid electricity across A & B Wings.</p>
          </div>

          {/* Slider 2: HVAC Efficiency */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Wind className="w-3.5 h-3.5 text-sky-500" />
                Smart HVAC Optimization
              </span>
              <span className="font-mono font-bold text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 px-2 py-0.5 rounded border border-sky-200 dark:border-sky-800/40">
                {hvacEfficiencyPct}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              step="5"
              value={hvacEfficiencyPct}
              onChange={(e) => setHvacEfficiencyPct(Number(e.target.value))}
              className="w-full accent-sky-500 bg-slate-200 dark:bg-slate-800 h-2 rounded-lg cursor-pointer"
            />
            <p className="text-[10px] text-slate-500 dark:text-slate-400">Occupancy-based setpoint schedules for 308 AC units.</p>
          </div>

          {/* Slider 3: Campus Fleet EV Transition */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Bus className="w-3.5 h-3.5 text-emerald-500" />
                Green Fleet / EV Transition
              </span>
              <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/40">
                {evTransitionPct}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={evTransitionPct}
              onChange={(e) => setEvTransitionPct(Number(e.target.value))}
              className="w-full accent-emerald-500 bg-slate-200 dark:bg-slate-800 h-2 rounded-lg cursor-pointer"
            />
            <p className="text-[10px] text-slate-500 dark:text-slate-400">Electrifies campus transport and security vans (Scope 1).</p>
          </div>

          {/* Slider 4: Waste Diversion */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Trash2 className="w-3.5 h-3.5 text-purple-500" />
                Composting & Waste Diversion
              </span>
              <span className="font-mono font-bold text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 rounded border border-purple-200 dark:border-purple-800/40">
                {wasteDiversionPct}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={wasteDiversionPct}
              onChange={(e) => setWasteDiversionPct(Number(e.target.value))}
              className="w-full accent-purple-500 bg-slate-200 dark:bg-slate-800 h-2 rounded-lg cursor-pointer"
            />
            <p className="text-[10px] text-slate-500 dark:text-slate-400">Cafeteria food waste diversion to on-campus compost pit.</p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-start gap-2 text-xs text-slate-500 dark:text-slate-400">
            <Info className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              <strong>Simulation Mode:</strong> Adjusting these parameters models scenario outcomes dynamically without altering historical campus records.
            </p>
          </div>
        </div>

        {/* Right Column: Comparative Simulation Results */}
        <div className="lg:col-span-2 space-y-5">
          {/* Summary Impact Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card-surface p-4">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono">
                Current Campus Baseline
              </div>
              <div className="text-xl font-black text-slate-900 dark:text-slate-100 font-mono mt-1">
                {formatCarbon(simResult?.baseline_total_kg || 0)}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-mono">
                Historical annual baseline
              </div>
            </div>

            <div className="card-surface p-4 border-l-4 border-l-emerald-500">
              <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 font-mono">
                Projected Outcome
              </div>
              <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1">
                {formatCarbon(simResult?.projected_total_kg || 0)}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-mono">
                Post-intervention footprint
              </div>
            </div>

            <div className="card-surface p-4 border-l-4 border-l-sky-500">
              <div className="text-[10px] font-bold uppercase tracking-wider text-sky-700 dark:text-sky-400 font-mono">
                Potential Carbon Reduction
              </div>
              <div className="text-xl font-black text-sky-600 dark:text-sky-400 font-mono mt-1">
                -{formatCarbon(totalReductionKg)}
              </div>
              <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold mt-1 font-mono">
                ▼ {pctReduction}% Net Abatement
              </div>
            </div>
          </div>

          {/* Comparative Bar Chart */}
          <div className="card-surface p-5">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Category Baseline vs Projected Reduction Comparison
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Neutral slate represents baseline; distinct green illustrates projected outcome
                </p>
              </div>
              <Badge variant="emerald">Projected: -{pctReduction}%</Badge>
            </div>
            <SimulationBarChart breakdown={simResult?.breakdown} />
          </div>
        </div>
      </div>
    </div>
  );
};
