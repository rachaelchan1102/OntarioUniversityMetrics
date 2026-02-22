import StatCard from './StatCard';

interface KPIs {
  n: number;
  mean: number;
  median: number;
  min: number;
  max: number;
  std: number | null;
  pct90: number;
  pct95: number;
}

export default function KPIGrid({ kpis }: { kpis: KPIs }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <StatCard label="Total Admissions Recorded" value={kpis.n} highlight />
      <StatCard label="Average Grade" value={kpis.mean.toFixed(1) + '%'} />
      <StatCard label="Median Grade" value={kpis.median.toFixed(1) + '%'} />
      <StatCard label="Range" value={`${kpis.min.toFixed(1)}–${kpis.max.toFixed(1)}%`} />
      {kpis.std !== null && <StatCard label="Std Dev" value={kpis.std.toFixed(2)} />}
      <StatCard label="Above 90%" value={kpis.pct90.toFixed(1) + '%'} sub="of admissions" />
      <StatCard label="Above 95%" value={kpis.pct95.toFixed(1) + '%'} sub="of admissions" />
    </div>
  );
}
