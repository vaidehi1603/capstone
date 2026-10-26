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
import { useTheme } from '../../hooks/useTheme';
import { formatCarbon } from '../../utils/formatters';
import { CHART_COLORS, getChartTheme } from '../../utils/chartTheme';

export const ForecastAreaChart = ({ data }) => {
  const { isDark } = useTheme();
  const theme = getChartTheme(isDark);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const historicalItem = payload.find((p) => p.dataKey === 'historical');
      const forecastItem = payload.find((p) => p.dataKey === 'forecast');
      const upperItem = payload.find((p) => p.dataKey === 'upperBound');
      const lowerItem = payload.find((p) => p.dataKey === 'lowerBound');

      return (
        <div
          className={`p-3.5 rounded-xl border shadow-xl text-xs space-y-1.5 min-w-[210px] ${
            isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          }`}
        >
          <div className="font-bold border-b pb-1 border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <span>{label}</span>
            <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
              {historicalItem && historicalItem.value !== null ? 'Historical Observation' : 'ML Model Projection'}
            </span>
          </div>
          {historicalItem && historicalItem.value !== null && (
            <div className="flex justify-between items-center font-mono" style={{ color: CHART_COLORS.actual }}>
              <span className="font-semibold">Actual Observed:</span>
              <span className="font-bold">{formatCarbon(historicalItem.value)}</span>
            </div>
          )}
          {forecastItem && forecastItem.value !== null && (
            <div className="flex justify-between items-center font-mono" style={{ color: CHART_COLORS.forecast }}>
              <span className="font-semibold">ML Projected:</span>
              <span className="font-bold">{formatCarbon(forecastItem.value)}</span>
            </div>
          )}
          {upperItem && upperItem.value !== null && (
            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono border-t pt-1 border-slate-200 dark:border-slate-800 flex justify-between">
              <span>95% Confidence Band:</span>
              <span>{formatCarbon(lowerItem?.value)} – {formatCarbon(upperItem?.value)}</span>
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
            <linearGradient id="forecastBandGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={CHART_COLORS.forecast} stopOpacity={0.22} />
              <stop offset="95%" stopColor={CHART_COLORS.forecast} stopOpacity={0.03} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray={theme.grid.strokeDasharray} stroke={theme.grid.stroke} />
          <XAxis dataKey="month" stroke={theme.axis.stroke} fontSize={theme.axis.fontSize} tickLine={theme.axis.tickLine} />
          <YAxis
            stroke={theme.axis.stroke}
            fontSize={theme.axis.fontSize}
            tickLine={theme.axis.tickLine}
            tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="top"
            height={36}
            formatter={(value) => (
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 capitalize">{value}</span>
            )}
          />

          {/* 95% Confidence Interval Translucent Band */}
          <Area
            type="monotone"
            dataKey="upperBound"
            stroke="transparent"
            fill="url(#forecastBandGrad)"
            name="95% Confidence Interval"
          />
          <Area
            type="monotone"
            dataKey="lowerBound"
            stroke="transparent"
            fill={isDark ? '#0B1020' : '#F4F7FB'}
            name="Confidence Lower Bound"
          />

          {/* Historical Actual: Solid Line in Purple */}
          <Line
            type="monotone"
            dataKey="historical"
            stroke={CHART_COLORS.actual}
            strokeWidth={3}
            dot={{ fill: CHART_COLORS.actual, r: 4 }}
            activeDot={{ r: 6 }}
            name="Observed Actual (Historical)"
          />

          {/* Forecasted Line: Dashed Line in Vermilion */}
          <Line
            type="monotone"
            dataKey="forecast"
            stroke={CHART_COLORS.forecast}
            strokeWidth={3}
            strokeDasharray="6 4"
            dot={{ fill: CHART_COLORS.forecast, r: 4 }}
            activeDot={{ r: 6 }}
            name="ML Projected Forecast"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
