import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { formatCarbon } from '../../utils/formatters';

export const MonthlyTrendChart = ({ data }) => {
  const defaultData = [
    { month: 'Oct', emissions: 6400, electricity: 4800, transport: 1100, waste: 500 },
    { month: 'Nov', emissions: 7100, electricity: 5300, transport: 1200, waste: 600 },
    { month: 'Dec', emissions: 5900, electricity: 4400, transport: 1000, waste: 500 },
    { month: 'Jan', emissions: 6800, electricity: 5100, transport: 1150, waste: 550 },
    { month: 'Feb', emissions: 7900, electricity: 6000, transport: 1300, waste: 600 },
    { month: 'Mar', emissions: 8200, electricity: 6200, transport: 1350, waste: 650 },
  ];

  const chartData = data && data.length > 0 ? data : defaultData;

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-xl text-xs">
          <div className="font-bold text-slate-200 mb-1">{label} Emission Summary</div>
          <div className="text-emerald-400 font-mono font-semibold">
            Total: {formatCarbon(payload[0].value)}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
        >
          <defs>
            <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stop-color="#10b981" stop-opacity={0.35} />
              <stop offset="95%" stop-color="#10b981" stop-opacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
          <YAxis
            stroke="#64748b"
            fontSize={11}
            tickLine={false}
            tickFormatter={(val) => `${val / 1000}t`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="emissions"
            stroke="#10b981"
            strokeWidth={2.5}
            fillOpacity={1}
            fill="url(#trendGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
