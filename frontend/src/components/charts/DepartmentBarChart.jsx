import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { useTheme } from '../../hooks/useTheme';
import { formatCarbon } from '../../utils/formatters';
import { getChartTheme } from '../../utils/chartTheme';

// Distinct categorical colors: Blue, Purple, Orange, Green, Magenta
const ACCESSIBLE_BAR_COLORS = ['#0072B2', '#6D5BD0', '#E69F00', '#009E73', '#CC79A7'];

export const DepartmentBarChart = ({ departmentRankings }) => {
  const { isDark } = useTheme();
  const theme = getChartTheme(isDark);

  const data = (departmentRankings || []).map((dept, idx) => ({
    name: dept.department_name,
    emissions: dept.total_kgco2e,
    color: ACCESSIBLE_BAR_COLORS[idx % ACCESSIBLE_BAR_COLORS.length],
  }));

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const entry = payload[0].payload;
      return (
        <div
          className={`p-3 rounded-xl border shadow-xl text-xs ${
            isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          }`}
        >
          <div className="font-semibold mb-1 flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: entry.color }} />
            {entry.name}
          </div>
          <div className="font-mono font-bold" style={{ color: entry.color }}>
            {formatCarbon(entry.emissions)}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-64">
      {data.length === 0 ? (
        <div className="h-full flex items-center justify-center text-center text-slate-500 dark:text-slate-400 text-xs">
          No department emissions recorded yet for selected filter.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray={theme.grid.strokeDasharray} stroke={theme.grid.stroke} horizontal={false} />
            <XAxis
              type="number"
              stroke={theme.axis.stroke}
              fontSize={theme.axis.fontSize}
              tickFormatter={(val) => `${val} kg`}
            />
            <YAxis
              type="category"
              dataKey="name"
              stroke={theme.axis.stroke}
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="emissions" radius={[0, 6, 6, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};
