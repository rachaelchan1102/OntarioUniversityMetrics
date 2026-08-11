'use client';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
} from 'recharts';
import { LINE_COLOR, RAMP, STROKE, axisProps, gridProps, tooltipStyle } from './chartTheme';

interface Row {
  admission_month_label?: string;
  round_label?: string;
  round_order?: number;
  admission_grade: number;
}

// Academic-year month order: Sep -> Jun
const MONTH_ORDER: Record<string, number> = {
  Sep: 0, Oct: 1, Nov: 2, Dec: 3,
  Jan: 4, Feb: 5, Mar: 6, Apr: 7, May: 8, Jun: 9,
};

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div style={tooltipStyle} className="px-3.5 py-2.5">
      <p className="font-semibold mb-0.5">{label}</p>
      <p className="text-brand font-bold">{p.avg}% avg grade</p>
      <p className="text-muted">{p.n.toLocaleString()} {p.n === 1 ? 'record' : 'records'}</p>
    </div>
  );
}

export default function AvgByMonthChart({ rows }: { rows: Row[] }) {
  const map: Record<string, { sum: number; n: number; order: number }> = {};
  for (const r of rows) {
    const key = r.admission_month_label || r.round_label || 'Unknown';
    if (key === 'Unknown') continue;
    if (!map[key]) {
      const monthIdx = MONTH_ORDER[key];
      map[key] = { sum: 0, n: 0, order: monthIdx !== undefined ? monthIdx : (r.round_order ?? 99) };
    }
    map[key].sum += r.admission_grade;
    map[key].n++;
  }
  const data = Object.entries(map)
    .map(([label, v]) => ({ label, avg: +(v.sum / v.n).toFixed(1), n: v.n, order: v.order }))
    .sort((a, b) => a.order - b.order);

  if (!data.length) return <p className="text-sm text-muted text-center py-10">No date data available</p>;

  const allAvgs = data.map(d => d.avg);
  const minVal = Math.floor(Math.min(...allAvgs) - 1);
  const maxVal = Math.ceil(Math.max(...allAvgs) + 1);

  return (
    <ResponsiveContainer width="100%" height={210}>
      <AreaChart data={data} margin={{ top: 8, right: 10, left: 0, bottom: 4 }}>
        <CartesianGrid {...gridProps} />
        <XAxis dataKey="label" tick={{ ...axisProps.tick, fontSize: 13 }} axisLine={false} tickLine={false} />
        <YAxis
          domain={[minVal, maxVal]}
          tickCount={5}
          tickFormatter={(v: number) => `${v}%`}
          width={44}
          {...axisProps}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="avg"
          stroke={LINE_COLOR}
          strokeWidth={4}
          strokeLinecap="round"
          fill="var(--soft)"
          fillOpacity={0.5}
          dot={{ r: 5.5, fill: RAMP[3], stroke: STROKE, strokeWidth: 2.5 }}
          activeDot={{ r: 6.5, fill: RAMP[0], stroke: STROKE, strokeWidth: 2.5 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
