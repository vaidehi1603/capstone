import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus, Info } from 'lucide-react';

export const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendLabel,
  variant = 'default',
  badgeText,
  tooltip,
  onClick,
}) => {
  const iconVariants = {
    default: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/80 dark:text-slate-300 dark:border-slate-700',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30',
    amber: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30',
    cyan: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/10 dark:text-sky-400 dark:border-sky-500/30',
    rose: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/30',
    purple: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/30',
  };

  return (
    <div
      onClick={onClick}
      className={`card-surface card-surface-hover p-5 relative overflow-hidden transition-all duration-200 ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {title}
            </span>
            {badgeText && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 font-mono">
                {badgeText}
              </span>
            )}
            {tooltip && (
              <span title={tooltip} className="cursor-help text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <Info className="w-3.5 h-3.5" />
              </span>
            )}
          </div>
          <div className="text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight font-mono truncate">
            {value}
          </div>
          {subtitle && (
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>

        {Icon && (
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center border shrink-0 ${
              iconVariants[variant] || iconVariants.default
            }`}
          >
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {trend !== undefined && (
        <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2 text-xs">
          {trend > 0 ? (
            <span className="flex items-center gap-1 font-semibold text-rose-600 dark:text-rose-400">
              <ArrowUpRight className="w-3.5 h-3.5" />
              +{trend}%
            </span>
          ) : trend < 0 ? (
            <span className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
              <ArrowDownRight className="w-3.5 h-3.5" />
              {trend}%
            </span>
          ) : (
            <span className="flex items-center gap-1 font-semibold text-slate-500 dark:text-slate-400">
              <Minus className="w-3.5 h-3.5" />
              0%
            </span>
          )}
          {trendLabel && <span className="text-slate-500 dark:text-slate-400">{trendLabel}</span>}
        </div>
      )}
    </div>
  );
};
