'use client';
import {
  BarChart, Bar, Cell, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
} from 'recharts';
import { computeHistogram } from '../lib/stats/histogram';
import { useTheme } from './ThemeProvider';

// Pastel palette — each bin gets a distinct colour
const BIN_COLORS = [
  '#93c5fd', // blue-300
  '#6ee7b7', // emerald-300
  '#c4b5fd', // violet-300
  '#fda4af', // rose-300
  '#fcd34d', // amber-300
  '#7dd3fc', // sky-300
  '#86efac', // green-300
  '#d8b4fe', // purple-300
  '#fdba74', // orange-300
  '#a5f3fc', // cyan-300
  '#f9a8d4', // pink-300
  '#bef264', // lime-300
];

export default function HistogramChart({ grades }: { grades: number[] }) {
  const { dark } = useTheme();
  const tickColor = dark ? '#d1d5db' : '#6b7280';
  const gridColor = dark ? 'rgba(255,255,255,0.06)' : '#e5e7eb';
  const tooltipStyle = dark
    ? { backgroundColor: '#1e2a3a', border: '1px solid rgba(148,163,184,0.15)', borderRadius: 8, color: '#f1f5f9' }
    : { backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, color: '#0f172a' };
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
        <Bar dataKey="pct" radius={[4, 4, 0, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={BIN_COLORS[i % BIN_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
