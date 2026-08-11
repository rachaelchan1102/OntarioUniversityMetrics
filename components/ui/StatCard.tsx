import { ReactNode } from 'react';

/**
 * Stat card from the /mockups design: a soft-filled glyph badge with a heavy
 * stroke outline, a small caps-ish label, a large brand-coloured value, and a
 * muted note.
 *
 * `layout="inline"` puts the badge beside the label (homepage KPI row);
 * `layout="stacked"` puts it above (program page metric row).
 */
export default function StatCard({
  label,
  value,
  sub,
  glyph,
  layout = 'inline',
  className = '',
}: {
  label: string;
  value: ReactNode;
  sub?: string;
  /** Short text or icon inside the badge, e.g. "Ad", "σ", "↗". */
  glyph?: ReactNode;
  layout?: 'inline' | 'stacked';
  className?: string;
}) {
  const badge = glyph ? (
    <span className="w-[30px] h-[30px] shrink-0 rounded-badge bg-soft border-2 border-stroke flex items-center justify-center text-[12px] font-bold text-brand">
      {glyph}
    </span>
  ) : null;

  if (layout === 'stacked') {
    return (
      <div className={`bg-card border-2 border-line rounded-card p-6 sm:p-7 ${className}`}>
        {badge}
        <div className="text-xs font-semibold tracking-label text-muted mt-4">{label}</div>
        <div className="text-[22px] sm:text-[27px] font-bold text-brand leading-tight mt-1">{value}</div>
        {sub && <div className="text-sm text-muted">{sub}</div>}
      </div>
    );
  }

  return (
    <div className={`bg-card border-2 border-line rounded-panel p-5 sm:p-[18px] ${className}`}>
      <div className="flex items-center gap-3 mb-3.5">
        {badge}
        <div className="text-sm font-medium text-muted">{label}</div>
      </div>
      <div className="text-[21px] sm:text-[26px] font-bold text-brand leading-tight">{value}</div>
      {sub && <div className="text-[12px] text-muted mt-1">{sub}</div>}
    </div>
  );
}
