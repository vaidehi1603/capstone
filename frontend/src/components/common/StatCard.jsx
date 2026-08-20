import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

export const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendLabel,
  variant = 'default',
  badgeText,
  onClick,
}) => {
  const iconVariants = {
    default: 'bg-slate-800/80 text-slate-300 border-slate-700',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    cyan: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
    rose: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  };

  return (
    <div
      onClick={onClick}
      className={`glass-card glass-card-hover rounded-2xl p-5 relative overflow-hidden transition-all duration-200 ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</span>
            {badgeText && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                {badgeText}
              </span>
            )}
          </div>
          <div className="text-2xl lg:text-3xl font-extrabold text-slate-100 tracking-tight">{value}</div>
          {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
        </div>

        {Icon && (
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center border shadow-inner ${
              iconVariants[variant] || iconVariants.default
            }`}
          >
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>

      {trend !== undefined && (
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center gap-2 text-xs">
          {trend > 0 ? (
            <span className="flex items-center gap-1 font-semibold text-rose-400">
              <ArrowUpRight className="w-3.5 h-3.5" />
              +{trend}%
            </span>
          ) : trend < 0 ? (
            <span className="flex items-center gap-1 font-semibold text-emerald-400">
              <ArrowDownRight className="w-3.5 h-3.5" />
              {trend}%
            </span>
          ) : (
            <span className="flex items-center gap-1 font-semibold text-slate-400">
              <Minus className="w-3.5 h-3.5" />
              0%
            </span>
          )}
          {trendLabel && <span className="text-slate-500">{trendLabel}</span>}
        </div>
      )}
    </div>
  );
};
