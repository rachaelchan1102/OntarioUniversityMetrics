'use client';
import {
  BarChart, Bar, Cell, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
} from 'recharts';
import { computeHistogram } from '../../lib/stats/histogram';
import { RAMP, STROKE, axisProps, gridProps, tooltipStyle } from './chartTheme';

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div style={tooltipStyle} className="px-3.5 py-2.5">
      <p className="font-semibold mb-0.5">{label}%</p>
      <p className="text-brand font-bold">{p.pct.toFixed(1)}% of admissions</p>
      <p className="text-muted">{p.count} {p.count === 1 ? 'record' : 'records'}</p>
    </div>
  );
}

export default function HistogramChart({ grades }: { grades: number[] }) {
  if (!grades.length) return <p className="text-sm text-muted text-center py-10">No grade data</p>;

  // Bins are 5 points wide (60–64 … 95–99), matching the mockup's axis labels.
  const data = computeHistogram(grades).map(b => ({ ...b, bin: b.bin.replace('-', '–') }));

  return (
    <ResponsiveContainer width="100%" height={210}>
      <BarChart data={data} margin={{ top: 8, right: 10, left: 0, bottom: 4 }}>
        <CartesianGrid {...gridProps} />
        <XAxis dataKey="bin" {...axisProps} />
        <YAxis tickFormatter={(v: number) => `${v}%`} width={44} {...axisProps} />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--soft)', opacity: 0.4 }} />
        <Bar dataKey="pct" radius={[10, 10, 0, 0]} stroke={STROKE} strokeWidth={2.5}>
          {data.map((_, i) => (
            <Cell key={i} fill={RAMP[i % RAMP.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
