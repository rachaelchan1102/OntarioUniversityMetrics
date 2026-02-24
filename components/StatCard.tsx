import type { ReactNode } from 'react';

type CardColor = 'blue' | 'mint' | 'purple' | 'pink';

const P: Record<CardColor, { iconBg: string; iconText: string; val: string }> = {
  blue:   { iconBg: 'bg-blue-100 dark:bg-blue-900/60',    iconText: 'text-blue-500 dark:text-blue-400',    val: 'text-blue-700 dark:text-blue-300' },
  mint:   { iconBg: 'bg-teal-100 dark:bg-teal-900/60',    iconText: 'text-teal-500 dark:text-teal-400',    val: 'text-teal-700 dark:text-teal-300' },
  purple: { iconBg: 'bg-violet-100 dark:bg-violet-900/60', iconText: 'text-violet-500 dark:text-violet-400', val: 'text-violet-700 dark:text-violet-300' },
  pink:   { iconBg: 'bg-pink-100 dark:bg-pink-900/60',    iconText: 'text-pink-500 dark:text-pink-400',    val: 'text-pink-700 dark:text-pink-300' },
};

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon?: ReactNode;
  color?: CardColor;
  className?: string;
}

export default function StatCard({ label, value, sub, icon, color = 'blue', className = '' }: StatCardProps) {
  const p = P[color];
  return (
    <div className={`rounded-2xl p-5 bg-white dark:bg-[#1e2a3a] border border-slate-200 dark:border-slate-700 shadow-sm ${className}`}>
      {icon && (
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-3 ${p.iconBg}`}>
          <span className={p.iconText}>{icon}</span>
        </div>
      )}
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-600 dark:text-slate-300">{label}</p>
      <p className={`text-2xl font-bold mt-1 leading-tight ${p.val}`}>{value}</p>
      {sub && <p className="text-sm mt-1 text-slate-500 dark:text-slate-400">{sub}</p>}
    </div>
  );
}
