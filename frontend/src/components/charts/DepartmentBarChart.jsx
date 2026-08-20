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
import { formatNumber, formatCarbon } from '../../utils/formatters';

const BAR_COLORS = ['#10b981', '#06b6d4', '#3b82f6', '#8b5cf6', '#f59e0b'];

export const DepartmentBarChart = ({ departmentRankings }) => {
  const data = (departmentRankings || []).map((dept, idx) => ({
    name: dept.department_name,
    emissions: dept.total_kgco2e,
    color: BAR_COLORS[idx % BAR_COLORS.length],
  }));

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const entry = payload[0].payload;
      return (
        <div className="bg-slate-900 border border-slate-700 p-3 rounded-xl shadow-xl text-xs">
          <div className="font-semibold text-slate-200 mb-1">{entry.name}</div>
          <div className="text-emerald-400 font-mono font-bold">
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
        <div className="h-full flex items-center justify-center text-center text-slate-500 text-xs">
          No department emissions recorded yet.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
            <XAxis
              type="number"
              stroke="#64748b"
              fontSize={11}
              tickFormatter={(val) => `${val} kg`}
            />
            <YAxis
              type="category"
              dataKey="name"
              stroke="#94a3b8"
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
