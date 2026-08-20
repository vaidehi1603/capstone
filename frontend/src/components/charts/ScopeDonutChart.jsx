import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { formatNumber, formatCarbon } from '../../utils/formatters';

const SCOPE_COLORS = {
  'Scope 1: Direct': '#f59e0b',      // Amber
  'Scope 2: Electricity': '#10b981', // Emerald
  'Scope 3: Indirect': '#06b6d4',    // Cyan
};

export const ScopeDonutChart = ({ scopeBreakdown, totalEmissions }) => {
  const data = [
    {
      name: 'Scope 1: Direct',
      value: scopeBreakdown?.scope_1 || 0,
      color: SCOPE_COLORS['Scope 1: Direct'],
    },
    {
      name: 'Scope 2: Electricity',
      value: scopeBreakdown?.scope_2 || 0,
      color: SCOPE_COLORS['Scope 2: Electricity'],
    },
    {
      name: 'Scope 3: Indirect',
      value: scopeBreakdown?.scope_3 || 0,
      color: SCOPE_COLORS['Scope 3: Indirect'],
    },
  ];

  const total = data.reduce((acc, curr) => acc + curr.value, 0);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const entry = payload[0].payload;
      const pct = total > 0 ? ((entry.value / total) * 100).toFixed(1) : 0;
      return (
        <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-xl text-xs">
          <div className="flex items-center gap-2 font-semibold text-slate-200 mb-1">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
            {entry.name}
          </div>
          <div className="text-slate-300 font-mono">
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
        <div className="text-center text-slate-500 text-xs">
          No emissions data recorded yet.
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
                <span className="text-[11px] font-medium text-slate-400">{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};
