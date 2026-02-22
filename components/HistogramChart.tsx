'use client';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
} from 'recharts';
import { computeHistogram } from '../lib/stats/histogram';
import { useTheme } from './ThemeProvider';

export default function HistogramChart({ grades }: { grades: number[] }) {
  const { dark } = useTheme();
  const tickColor = dark ? '#d1d5db' : '#6b7280';
  const gridColor = dark ? 'rgba(255,255,255,0.06)' : '#e5e7eb';
  const tooltipStyle = dark
    ? { backgroundColor: '#1f1f1f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff' }
    : { backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, color: '#111' };
  const data = computeHistogram(grades);
  if (!grades.length)
    return <p className="text-sm text-gray-500 text-center py-10">No grade data</p>;

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
        <XAxis dataKey="bin" tick={{ fontSize: 11, fill: tickColor }} />
        <YAxis tick={{ fontSize: 11, fill: tickColor }} unit="%" />
        <Tooltip
          contentStyle={tooltipStyle}
          formatter={(v: number) => [`${v.toFixed(1)}%`, '% of admissions']}
        />
        <Bar dataKey="pct" fill="#818cf8" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
