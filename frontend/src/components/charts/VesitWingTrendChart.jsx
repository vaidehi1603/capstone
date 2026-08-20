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
import { formatNumber } from '../../utils/formatters';

export const VesitWingTrendChart = ({ data = [] }) => {
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const aWing = payload.find((p) => p.dataKey === 'a_wing_kwh');
      const bWing = payload.find((p) => p.dataKey === 'b_wing_kwh');
      const constr = payload.find((p) => p.dataKey === 'construction_kwh');
      const total = payload.find((p) => p.dataKey === 'total_kwh');

      return (
        <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700 p-3.5 rounded-xl shadow-2xl text-xs space-y-1.5 min-w-[200px]">
          <div className="font-bold text-slate-100 border-b border-slate-800 pb-1 flex items-center justify-between">
            <span>{label}</span>
            <span className="text-[10px] text-emerald-400 font-mono">0.82 kgCO₂e/kWh</span>
          </div>
          {aWing && (
            <div className="flex justify-between items-center text-cyan-400 font-mono">
              <span>A Wing (350 KVA):</span>
              <span className="font-bold">{formatNumber(aWing.value)} kWh</span>
            </div>
          )}
          {bWing && (
            <div className="flex justify-between items-center text-emerald-400 font-mono">
              <span>B Wing (175 KVA):</span>
              <span className="font-bold">{formatNumber(bWing.value)} kWh</span>
            </div>
          )}
          {constr && constr.value > 0 && (
            <div className="flex justify-between items-center text-amber-400 font-mono">
              <span>Construction:</span>
              <span className="font-bold">{formatNumber(constr.value)} kWh</span>
            </div>
          )}
          <div className="border-t border-slate-800 pt-1.5 mt-1 flex justify-between items-center text-slate-100 font-bold font-mono">
            <span>Total Campus:</span>
            <span className="text-emerald-400">{formatNumber(total?.value || 0)} kWh</span>
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
              <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="bWingGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="label" stroke="#64748b" fontSize={10} tickLine={false} />
          <YAxis
            stroke="#64748b"
            fontSize={10}
            tickLine={false}
            tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="top"
            height={32}
            formatter={(value) => {
              const map = {
                a_wing_kwh: 'A Wing (350 KVA)',
                b_wing_kwh: 'B Wing (175 KVA)',
                construction_kwh: 'Construction',
              };
              return <span className="text-xs font-medium text-slate-300">{map[value] || value}</span>;
            }}
          />
          <Area
            type="monotone"
            dataKey="a_wing_kwh"
            stroke="#06b6d4"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#aWingGrad)"
            name="a_wing_kwh"
          />
          <Area
            type="monotone"
            dataKey="b_wing_kwh"
            stroke="#10b981"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#bWingGrad)"
            name="b_wing_kwh"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
