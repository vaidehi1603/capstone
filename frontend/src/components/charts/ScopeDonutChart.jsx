import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useTheme } from '../../hooks/useTheme';
import { formatCarbon } from '../../utils/formatters';
import { CHART_COLORS } from '../../utils/chartTheme';

const SCOPE_PALETTE = {
  'Scope 1: Direct Combustion': CHART_COLORS.scope1,   // #E69F00 - Orange
  'Scope 2: Grid Electricity': CHART_COLORS.scope2,    // #0072B2 - Blue
  'Scope 3: Indirect & Waste': CHART_COLORS.scope3,    // #009E73 - Green
};

export const ScopeDonutChart = ({ scopeBreakdown, totalEmissions }) => {
  const { isDark } = useTheme();

  const data = [
    {
      name: 'Scope 1: Direct Combustion',
      value: scopeBreakdown?.scope_1 || 0,
      color: SCOPE_PALETTE['Scope 1: Direct Combustion'],
    },
    {
      name: 'Scope 2: Grid Electricity',
      value: scopeBreakdown?.scope_2 || 0,
      color: SCOPE_PALETTE['Scope 2: Grid Electricity'],
    },
    {
      name: 'Scope 3: Indirect & Waste',
      value: scopeBreakdown?.scope_3 || 0,
      color: SCOPE_PALETTE['Scope 3: Indirect & Waste'],
    },
  ];

  const total = data.reduce((acc, curr) => acc + curr.value, 0);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const entry = payload[0].payload;
      const pct = total > 0 ? ((entry.value / total) * 100).toFixed(1) : 0;
      return (
        <div
          className={`p-3 rounded-xl border shadow-xl text-xs ${
            isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          }`}
        >
          <div className="flex items-center gap-2 font-semibold mb-1">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
            {entry.name}
          </div>
          <div className="font-mono font-bold" style={{ color: entry.color }}>
            {formatCarbon(entry.value)} ({pct}%)
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-64 relative flex items-center justify-center">
      {total === 0 ? (
        <div className="text-center text-slate-500 dark:text-slate-400 text-xs">
          No emissions data recorded yet for active period.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={4}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="transparent" />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value) => (
                <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};
