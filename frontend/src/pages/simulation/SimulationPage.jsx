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
  Sparkles,
  RotateCcw,
  Sliders,
  Building2,
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-100 tracking-tight">
              Campus Sustainability Impact Simulator
            </h2>
            <Badge variant="cyan">Scenario Modeling</Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Model the carbon reduction and energy savings of green campus capital investments before official deployment.
          </p>
        </div>

        <button
          onClick={handleReset}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset Sliders
        </button>
      </div>

      {/* Simulator Layout: Sliders on Left, Results on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Interactive Policy Sliders */}
        <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              Policy Interventions
            </h3>
            <span className="text-[10px] font-mono text-slate-400">Dynamic Real-Time</span>
          </div>

          {/* Slider 1: Rooftop Solar PV */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                Rooftop Solar PV Expansion
              </span>
              <span className="font-mono font-bold text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/40">
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
              className="w-full accent-amber-400 bg-slate-800 h-2 rounded-lg cursor-pointer"
            />
            <p className="text-[10px] text-slate-400">Offsets grid electricity during daytime peak hours.</p>
          </div>

          {/* Slider 2: HVAC Efficiency */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Wind className="w-3.5 h-3.5 text-cyan-400" />
                Smart HVAC & Chiller Optimization
              </span>
              <span className="font-mono font-bold text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/40">
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
              className="w-full accent-cyan-400 bg-slate-800 h-2 rounded-lg cursor-pointer"
            />
            <p className="text-[10px] text-slate-400">Occupancy-based setpoints and variable speed chiller drives.</p>
          </div>

          {/* Slider 3: Campus Fleet EV Transition */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Bus className="w-3.5 h-3.5 text-emerald-400" />
                EV Campus Shuttle Electrification
              </span>
              <span className="font-mono font-bold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
                {evTransitionPct}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="10"
              value={evTransitionPct}
              onChange={(e) => setEvTransitionPct(Number(e.target.value))}
              className="w-full accent-emerald-400 bg-slate-800 h-2 rounded-lg cursor-pointer"
            />
            <p className="text-[10px] text-slate-400">Replaces diesel transit shuttles with electric battery shuttles.</p>
          </div>

          {/* Slider 4: Waste Diversion */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Trash2 className="w-3.5 h-3.5 text-purple-400" />
                Composting & Circular Diversion
              </span>
              <span className="font-mono font-bold text-purple-400 bg-purple-950/40 px-2 py-0.5 rounded border border-purple-800/40">
                {wasteDiversionPct}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="10"
              value={wasteDiversionPct}
              onChange={(e) => setWasteDiversionPct(Number(e.target.value))}
              className="w-full accent-purple-400 bg-slate-800 h-2 rounded-lg cursor-pointer"
            />
            <p className="text-[10px] text-slate-400">Biogas digester digestion for mess food waste.</p>
          </div>
        </div>

        {/* Right 2 Columns: Simulated Impact & Visualization */}
        <div className="lg:col-span-2 space-y-5">
          {/* Top KPI Impact Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="glass-card rounded-2xl p-4 border border-slate-800">
              <div className="text-[10px] uppercase font-bold text-slate-400">Current Baseline</div>
              <div className="text-xl font-extrabold text-slate-200 font-mono mt-1">
                {formatCarbon(simResult?.baseline_total_kg)}
              </div>
            </div>

            <div className="glass-card rounded-2xl p-4 border border-emerald-500/30 bg-gradient-to-br from-emerald-950/20 to-slate-900">
              <div className="text-[10px] uppercase font-bold text-emerald-400">Projected Emissions</div>
              <div className="text-xl font-extrabold text-emerald-400 font-mono mt-1">
                {formatCarbon(simResult?.projected_total_kg)}
              </div>
            </div>

            <div className="glass-card rounded-2xl p-4 border border-brand-500/40 bg-gradient-to-br from-brand-950/30 to-slate-900">
              <div className="text-[10px] uppercase font-bold text-brand-400">Net Carbon Avoided</div>
              <div className="text-xl font-extrabold text-brand-300 font-mono mt-1">
                -{simResult?.percentage_reduction}%
              </div>
              <div className="text-[11px] text-brand-400/80 font-mono mt-0.5">
                -{formatCarbon(simResult?.total_reduced_kg)}
              </div>
            </div>
          </div>

          {/* Bar Chart Comparison */}
          <div className="glass-card rounded-2xl p-5 border border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-200">
                  Before vs After Policy Intervention Comparison
                </h3>
                <p className="text-[11px] text-slate-400">Emission reduction across Scope 1, 2, and 3</p>
              </div>
              <Badge variant="emerald">Simulated Output</Badge>
            </div>
            <SimulationBarChart breakdown={simResult?.breakdown} />
          </div>

          {/* Target Milestone Achievement */}
          <div className="p-4 rounded-2xl bg-brand-950/30 border border-brand-500/30 flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-brand-400 flex-shrink-0" />
            <div className="text-xs text-slate-200">
              <strong className="text-brand-300">Decarbonization Roadmap Impact: </strong>
              {simResult?.net_zero_milestone_impact}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
