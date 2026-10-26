import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useTheme } from '../../hooks/useTheme';
import { formatNumber } from '../../utils/formatters';
import { CHART_COLORS, getChartTheme } from '../../utils/chartTheme';

export const VesitWingTrendChart = ({ data = [] }) => {
  const { isDark } = useTheme();
  const theme = getChartTheme(isDark);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const aWing = payload.find((p) => p.dataKey === 'a_wing_kwh');
      const bWing = payload.find((p) => p.dataKey === 'b_wing_kwh');
      const constr = payload.find((p) => p.dataKey === 'construction_kwh');
      const total = payload.find((p) => p.dataKey === 'total_kwh');

      return (
        <div
          className={`p-3.5 rounded-xl border shadow-xl text-xs space-y-1.5 min-w-[210px] ${
            isDark
              ? 'bg-slate-900/95 border-slate-700 text-slate-100'
              : 'bg-white border-slate-200 text-slate-900'
          }`}
        >
          <div className="font-bold border-b pb-1 flex items-center justify-between border-slate-200 dark:border-slate-800">
            <span>{label}</span>
            <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">
              0.82 kgCO₂e/kWh
            </span>
          </div>
          {aWing && (
            <div className="flex justify-between items-center font-mono" style={{ color: CHART_COLORS.aWing }}>
              <span className="font-semibold">A Wing (350 KVA):</span>
              <span className="font-bold">{formatNumber(aWing.value)} kWh</span>
            </div>
          )}
          {bWing && (
            <div className="flex justify-between items-center font-mono" style={{ color: CHART_COLORS.bWing }}>
              <span className="font-semibold">B Wing (175 KVA):</span>
              <span className="font-bold">{formatNumber(bWing.value)} kWh</span>
            </div>
          )}
          {constr && constr.value > 0 && (
            <div className="flex justify-between items-center font-mono" style={{ color: CHART_COLORS.construction }}>
              <span className="font-semibold">Construction:</span>
              <span className="font-bold">{formatNumber(constr.value)} kWh</span>
            </div>
          )}
          <div className="border-t pt-1.5 mt-1 flex justify-between items-center font-bold font-mono border-slate-200 dark:border-slate-800">
            <span>Total Campus:</span>
            <span className="text-emerald-600 dark:text-emerald-400">
              {formatNumber(total?.value || 0)} kWh
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  const chartData = data.map((d) => ({
    label: `${d.month_name?.slice(0, 3)} '${String(d.year).slice(-2)}`,
    a_wing_kwh: d.a_wing_kwh || 0,
    b_wing_kwh: d.b_wing_kwh || 0,
    construction_kwh: d.construction_kwh || 0,
    total_kwh: d.total_kwh || 0,
    total_co2e: d.total_co2e || 0,
  }));

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="aWingGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={CHART_COLORS.aWing} stopOpacity={0.35} />
              <stop offset="95%" stopColor={CHART_COLORS.aWing} stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="bWingGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={CHART_COLORS.bWing} stopOpacity={0.35} />
              <stop offset="95%" stopColor={CHART_COLORS.bWing} stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray={theme.grid.strokeDasharray} stroke={theme.grid.stroke} />
          <XAxis dataKey="label" stroke={theme.axis.stroke} fontSize={theme.axis.fontSize} tickLine={theme.axis.tickLine} />
          <YAxis
            stroke={theme.axis.stroke}
            fontSize={theme.axis.fontSize}
            tickLine={theme.axis.tickLine}
            tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="top"
            height={32}
            formatter={(value) => {
              const map = {
                a_wing_kwh: 'A Wing (350 KVA Contract Demand)',
                b_wing_kwh: 'B Wing (175 KVA Contract Demand)',
                construction_kwh: 'Construction Meter',
              };
              return (
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {map[value] || value}
                </span>
              );
            }}
          />
          <Area
            type="monotone"
            dataKey="a_wing_kwh"
            stroke={CHART_COLORS.aWing}
            strokeWidth={2.5}
            fillOpacity={1}
            fill="url(#aWingGrad)"
            name="a_wing_kwh"
          />
          <Area
            type="monotone"
            dataKey="b_wing_kwh"
            stroke={CHART_COLORS.bWing}
            strokeWidth={2.5}
            fillOpacity={1}
            fill="url(#bWingGrad)"
            name="b_wing_kwh"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
