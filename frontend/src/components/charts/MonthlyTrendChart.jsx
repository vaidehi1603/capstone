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
import { formatCarbon } from '../../utils/formatters';
import { CHART_COLORS, getChartTheme } from '../../utils/chartTheme';

export const MonthlyTrendChart = ({ data }) => {
  const { isDark } = useTheme();
  const theme = getChartTheme(isDark);

  const defaultData = [
    { month: 'Oct', total: 6400, electricity: 4800, transport: 1100, waste: 500 },
    { month: 'Nov', total: 7100, electricity: 5300, transport: 1200, waste: 600 },
    { month: 'Dec', total: 5900, electricity: 4400, transport: 1000, waste: 500 },
    { month: 'Jan', total: 6800, electricity: 5100, transport: 1150, waste: 550 },
    { month: 'Feb', total: 7900, electricity: 6000, transport: 1300, waste: 600 },
    { month: 'Mar', total: 8200, electricity: 6200, transport: 1350, waste: 650 },
  ];

  const chartData = (data && data.length > 0 ? data : defaultData).map((d) => ({
    month: d.month,
    electricity: d.electricity || (d.emissions ? d.emissions * 0.75 : 0),
    transport: d.transport || (d.emissions ? d.emissions * 0.18 : 0),
    waste: d.waste || (d.emissions ? d.emissions * 0.07 : 0),
    total: d.total || d.emissions || 0,
  }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const elec = payload.find((p) => p.dataKey === 'electricity');
      const trans = payload.find((p) => p.dataKey === 'transport');
      const wst = payload.find((p) => p.dataKey === 'waste');
      const totalVal = (elec?.value || 0) + (trans?.value || 0) + (wst?.value || 0);

      return (
        <div
          className={`p-3 rounded-xl border shadow-xl text-xs space-y-1.5 min-w-[200px] ${
            isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          }`}
        >
          <div className="font-bold border-b pb-1 border-slate-200 dark:border-slate-800">
            {label} Multi-Scope Distribution
          </div>
          {elec && (
            <div className="flex justify-between items-center font-mono" style={{ color: CHART_COLORS.scope2 }}>
              <span>Scope 2 (Electricity):</span>
              <span className="font-bold">{formatCarbon(elec.value)}</span>
            </div>
          )}
          {trans && (
            <div className="flex justify-between items-center font-mono" style={{ color: CHART_COLORS.scope1 }}>
              <span>Scope 1 (Transport):</span>
              <span className="font-bold">{formatCarbon(trans.value)}</span>
            </div>
          )}
          {wst && (
            <div className="flex justify-between items-center font-mono" style={{ color: CHART_COLORS.scope3 }}>
              <span>Scope 3 (Waste/Water):</span>
              <span className="font-bold">{formatCarbon(wst.value)}</span>
            </div>
          )}
          <div className="border-t pt-1 font-bold font-mono flex justify-between border-slate-200 dark:border-slate-800">
            <span>Monthly Total:</span>
            <span>{formatCarbon(totalVal)}</span>
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
            <linearGradient id="elecGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={CHART_COLORS.scope2} stopOpacity={0.4} />
              <stop offset="95%" stopColor={CHART_COLORS.scope2} stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="transGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={CHART_COLORS.scope1} stopOpacity={0.4} />
              <stop offset="95%" stopColor={CHART_COLORS.scope1} stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="wasteGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={CHART_COLORS.scope3} stopOpacity={0.4} />
              <stop offset="95%" stopColor={CHART_COLORS.scope3} stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray={theme.grid.strokeDasharray} stroke={theme.grid.stroke} />
          <XAxis dataKey="month" stroke={theme.axis.stroke} fontSize={theme.axis.fontSize} tickLine={theme.axis.tickLine} />
          <YAxis
            stroke={theme.axis.stroke}
            fontSize={theme.axis.fontSize}
            tickLine={theme.axis.tickLine}
            tickFormatter={(val) => `${(val / 1000).toFixed(1)}t`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="top"
            height={30}
            formatter={(value) => {
              const labels = {
                electricity: 'Scope 2 Electricity',
                transport: 'Scope 1 Transport',
                waste: 'Scope 3 Waste & Water',
              };
              return (
                <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  {labels[value] || value}
                </span>
              );
            }}
          />
          <Area
            type="monotone"
            dataKey="electricity"
            stackId="1"
            stroke={CHART_COLORS.scope2}
            strokeWidth={2}
            fill="url(#elecGrad)"
            name="electricity"
          />
          <Area
            type="monotone"
            dataKey="transport"
            stackId="1"
            stroke={CHART_COLORS.scope1}
            strokeWidth={2}
            fill="url(#transGrad)"
            name="transport"
          />
          <Area
            type="monotone"
            dataKey="waste"
            stackId="1"
            stroke={CHART_COLORS.scope3}
            strokeWidth={2}
            fill="url(#wasteGrad)"
            name="waste"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
