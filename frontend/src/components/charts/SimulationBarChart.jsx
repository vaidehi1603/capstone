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
import { formatCarbon } from '../../utils/formatters';

export const SimulationBarChart = ({ breakdown }) => {
  const data = breakdown || [];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-xl text-xs space-y-1">
          <div className="font-bold text-slate-200 border-b border-slate-800 pb-1">{label}</div>
          <div className="text-slate-400">
            Baseline: <span className="font-mono text-slate-200">{formatCarbon(payload[0]?.value)}</span>
          </div>
          <div className="text-emerald-400">
            Projected: <span className="font-mono font-bold">{formatCarbon(payload[1]?.value)}</span>
          </div>
          <div className="text-cyan-400 font-mono text-[11px] pt-1">
            Reduction: -{formatCarbon(payload[0]?.value - payload[1]?.value)}
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
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="category" stroke="#64748b" fontSize={11} tickLine={false} />
          <YAxis
            stroke="#64748b"
            fontSize={11}
            tickLine={false}
            tickFormatter={(val) => `${val} kg`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="top"
            height={36}
            formatter={(value) => (
              <span className="text-xs font-medium text-slate-300">{value}</span>
            )}
          />
          <Bar dataKey="baseline" name="Current Baseline" fill="#64748b" radius={[4, 4, 0, 0]} />
          <Bar dataKey="projected" name="Projected Post-Intervention" fill="#10b981" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
