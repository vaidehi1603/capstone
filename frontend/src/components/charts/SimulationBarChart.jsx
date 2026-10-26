import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useTheme } from '../../hooks/useTheme';
import { formatCarbon } from '../../utils/formatters';
import { CHART_COLORS, getChartTheme } from '../../utils/chartTheme';

export const SimulationBarChart = ({ breakdown }) => {
  const { isDark } = useTheme();
  const theme = getChartTheme(isDark);
  const data = breakdown || [];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const baseVal = payload[0]?.value || 0;
      const projVal = payload[1]?.value || 0;
      const reduction = baseVal - projVal;
      const pctReduction = baseVal > 0 ? ((reduction / baseVal) * 100).toFixed(1) : '0';

      return (
        <div
          className={`p-3.5 rounded-xl border shadow-xl text-xs space-y-1.5 min-w-[210px] ${
            isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          }`}
        >
          <div className="font-bold border-b pb-1 border-slate-200 dark:border-slate-800">
            {label} Policy Scenario
          </div>
          <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 font-mono">
            <span>Current Baseline:</span>
            <span>{formatCarbon(baseVal)}</span>
          </div>
          <div className="flex justify-between items-center font-bold font-mono" style={{ color: CHART_COLORS.projected }}>
            <span>Projected Outcome:</span>
            <span>{formatCarbon(projVal)}</span>
          </div>
          <div className="border-t pt-1 flex justify-between items-center font-mono font-bold text-emerald-600 dark:text-emerald-400 border-slate-200 dark:border-slate-800">
            <span>Reduction Impact:</span>
            <span>-{formatCarbon(reduction)} ({pctReduction}%)</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray={theme.grid.strokeDasharray} stroke={theme.grid.stroke} />
          <XAxis dataKey="category" stroke={theme.axis.stroke} fontSize={theme.axis.fontSize} tickLine={theme.axis.tickLine} />
          <YAxis
            stroke={theme.axis.stroke}
            fontSize={theme.axis.fontSize}
            tickLine={theme.axis.tickLine}
            tickFormatter={(val) => `${val} kg`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="top"
            height={36}
            formatter={(value) => (
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{value}</span>
            )}
          />
          <Bar
            dataKey="baseline"
            name="Current Campus Baseline"
            fill={CHART_COLORS.baseline}
            radius={[4, 4, 0, 0]}
          />
          <Bar
            dataKey="projected"
            name="Projected Post-Intervention"
            fill={CHART_COLORS.projected}
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
