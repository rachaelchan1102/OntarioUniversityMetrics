'use client';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Dot,
} from 'recharts';
import { useTheme } from './ThemeProvider';

interface Row {
  admission_month_label?: string;
  round_label?: string;
  round_order?: number;
  admission_grade: number;
}

// Academic-year month order: Sep → Jun
const MONTH_ORDER: Record<string, number> = {
  Sep: 0, Oct: 1, Nov: 2, Dec: 3,
  Jan: 4, Feb: 5, Mar: 6, Apr: 7, May: 8, Jun: 9,
};

export default function AvgByMonthChart({ rows }: { rows: Row[] }) {
  const { dark } = useTheme();
  const tickColor = dark ? '#d1d5db' : '#6b7280';
  const gridColor = dark ? 'rgba(255,255,255,0.06)' : '#e5e7eb';
  const tooltipStyle = dark
    ? { backgroundColor: '#1e2a3a', border: '1px solid rgba(148,163,184,0.15)', borderRadius: 8, color: '#f1f5f9' }
    : { backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, color: '#0f172a' };
  const map: Record<string, { sum: number; n: number; order: number }> = {};
  for (const r of rows) {
    const key = r.admission_month_label || r.round_label || 'Unknown';
    if (key === 'Unknown') continue;
    if (!map[key]) {
      // Use academic-year month order when available, fall back to round_order
      const monthIdx = MONTH_ORDER[key];
      map[key] = { sum: 0, n: 0, order: monthIdx !== undefined ? monthIdx : (r.round_order ?? 99) };
    }
    map[key].sum += r.admission_grade;
    map[key].n++;
  }
  const data = Object.entries(map)
    .map(([label, v]) => ({ label, avg: +(v.sum / v.n).toFixed(1), n: v.n, order: v.order }))
    .sort((a, b) => a.order - b.order);

  if (!data.length)
    return <p className="text-sm text-gray-500 text-center py-10">No date data available</p>;

  const allAvgs = data.map(d => d.avg);
  const minVal = Math.floor(Math.min(...allAvgs) - 1);
  const maxVal = Math.ceil(Math.max(...allAvgs) + 1);

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
        <defs>
          <linearGradient id="avgGradeGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#818cf8" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: tickColor }} />
        <YAxis
          domain={[minVal, maxVal]}
          tickCount={5}
          tickFormatter={(v: number) => `${v}%`}
          tick={{ fontSize: 11, fill: tickColor }}
          width={42}
        />
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(v: number) => [`${v}%`, 'Avg Grade']}
        />
        <Area
          type="monotone"
          dataKey="avg"
          stroke="#818cf8"
          strokeWidth={2.5}
          fill="url(#avgGradeGradient)"
          dot={<Dot r={4} fill="#818cf8" stroke="none" />}
          activeDot={{ r: 6, fill: '#a5b4fc' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
