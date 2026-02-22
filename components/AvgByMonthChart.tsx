'use client';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Dot,
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
    ? { backgroundColor: '#1f1f1f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff' }
    : { backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, color: '#111' };
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

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: tickColor }} />
        <YAxis domain={['auto', 'auto']} tick={{ fontSize: 11, fill: tickColor }} unit="%" />
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(v: number) => [`${v}%`, 'Avg Grade']}
        />
        <Line
          type="monotone"
          dataKey="avg"
          stroke="#6366f1"
          strokeWidth={2}
          dot={<Dot r={4} fill="#6366f1" />}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
