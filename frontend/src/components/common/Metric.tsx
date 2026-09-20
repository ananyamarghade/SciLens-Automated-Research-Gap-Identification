import React from 'react';
import { clsx } from 'clsx';

interface MetricProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon?: React.ReactNode;
  trend?: {
    direction: 'up' | 'down' | 'neutral';
    text: string;
  };
  className?: string;
  isCard?: boolean;
}

export const Metric: React.FC<MetricProps> = ({
  label,
  value,
  subtext,
  icon,
  trend,
  className,
  isCard = true,
}) => {
  if (isCard) {
    return (
      <div
        className={clsx(
          'p-4 rounded-2xl bg-white dark:bg-[#0C1528] border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group',
          className
        )}
      >
        <div className="flex items-start justify-between gap-2 mb-2">
          <span className="text-[11px] font-mono tracking-wider uppercase text-slate-500 dark:text-slate-400 font-medium">
            {label}
          </span>
          {icon && (
            <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-500/20 text-scilens-teal dark:text-scilens-glowteal flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
              {icon}
            </div>
          )}
        </div>

        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl md:text-3xl font-serif font-bold text-scilens-navy dark:text-white tracking-tight">
              {value}
            </span>
            {trend && (
              <span
                className={clsx(
                  'text-[11px] font-mono font-medium px-1.5 py-0.5 rounded-full',
                  trend.direction === 'up' &&
                    'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60',
                  trend.direction === 'down' &&
                    'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/60',
                  trend.direction === 'neutral' &&
                    'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                )}
              >
                {trend.text}
              </span>
            )}
          </div>

          {subtext && (
            <span className="text-xs text-slate-400 dark:text-slate-500 mt-1 block font-sans">
              {subtext}
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={clsx('flex flex-col py-1', className)}>
      <span className="text-[11px] font-mono tracking-wider uppercase text-slate-500 dark:text-slate-400 font-medium mb-1">
        {label}
      </span>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl md:text-3xl font-serif font-bold text-scilens-navy dark:text-white">
          {value}
        </span>
        {trend && (
          <span
            className={clsx(
              'text-xs font-mono',
              trend.direction === 'up' && 'text-emerald-600 dark:text-emerald-400',
              trend.direction === 'down' && 'text-rose-600 dark:text-rose-400',
              trend.direction === 'neutral' && 'text-slate-400 dark:text-slate-500'
            )}
          >
            {trend.text}
          </span>
        )}
      </div>
      {subtext && (
        <span className="text-xs text-slate-400 dark:text-slate-500 mt-1 font-sans">
          {subtext}
        </span>
      )}
    </div>
  );
};
