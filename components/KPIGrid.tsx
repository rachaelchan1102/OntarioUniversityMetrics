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
  q1: number;
  q3: number;
}

const I = (d: string) => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} />
  </svg>
);

export default function KPIGrid({ kpis }: { kpis: KPIs }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          label="Total Admissions"
          value={kpis.n}
          color="blue"
          icon={I('M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z')}
        />
        <StatCard
          label="Average Grade"
          value={kpis.mean.toFixed(1) + '%'}
          color="mint"
          icon={I('M13 7h8m0 0v8m0-8l-8 8-4-4-6 6')}
        />
        <StatCard
          label="Median Grade"
          value={kpis.median.toFixed(1) + '%'}
          color="purple"
          icon={I('M4 6h16M4 12h16M4 18h7')}
        />
        <StatCard
          label="Grade Range"
          value={`${kpis.min.toFixed(1)}–${kpis.max.toFixed(1)}%`}
          color="pink"
          icon={I('M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4')}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        {kpis.std !== null ? (
          <StatCard
            label="Std Deviation"
            value={kpis.std.toFixed(2)}
            color="blue"
            icon={I('M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z')}
          />
        ) : <div />}
        <StatCard
          label="Above 95%"
          value={kpis.pct95.toFixed(1) + '%'}
          sub="of admissions"
          color="purple"
          icon={I('M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z')}
        />
      </div>
    </div>
  );
}
