import React from 'react';
import {
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { formatCarbon } from '../../utils/formatters';

export const ForecastAreaChart = ({ data }) => {
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const historicalItem = payload.find((p) => p.dataKey === 'historical');
      const forecastItem = payload.find((p) => p.dataKey === 'forecast');
      const upperItem = payload.find((p) => p.dataKey === 'upperBound');
      const lowerItem = payload.find((p) => p.dataKey === 'lowerBound');

      return (
        <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-xl text-xs space-y-1">
          <div className="font-bold text-slate-200 border-b border-slate-800 pb-1">{label}</div>
          {historicalItem && historicalItem.value !== null && (
            <div className="text-emerald-400 font-mono">
              Actual Observed: <span className="font-bold">{formatCarbon(historicalItem.value)}</span>
            </div>
          )}
          {forecastItem && forecastItem.value !== null && (
            <div className="text-cyan-400 font-mono">
              ML Projected: <span className="font-bold">{formatCarbon(forecastItem.value)}</span>
            </div>
          )}
          {upperItem && upperItem.value !== null && (
            <div className="text-slate-400 font-mono text-[10px]">
              95% Range: {formatCarbon(lowerItem?.value)} – {formatCarbon(upperItem?.value)}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="forecastBand" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
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
              <span className="text-xs font-medium text-slate-300 capitalize">{value}</span>
            )}
          />

          {/* 95% Confidence Band */}
          <Area
            type="monotone"
            dataKey="upperBound"
            stroke="transparent"
            fill="url(#forecastBand)"
            name="95% Confidence Band"
          />
          <Area
            type="monotone"
            dataKey="lowerBound"
            stroke="transparent"
            fill="#090d16"
            name="Lower Bound"
          />

          {/* Historical Actual Line */}
          <Line
            type="monotone"
            dataKey="historical"
            stroke="#10b981"
            strokeWidth={3}
            dot={{ fill: '#10b981', r: 4 }}
            activeDot={{ r: 6 }}
            name="Historical Actual"
          />

          {/* Forecasted Line */}
          <Line
            type="monotone"
            dataKey="forecast"
            stroke="#06b6d4"
            strokeWidth={3}
            strokeDasharray="5 5"
            dot={{ fill: '#06b6d4', r: 4 }}
            activeDot={{ r: 6 }}
            name="ML Projected Forecast"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
