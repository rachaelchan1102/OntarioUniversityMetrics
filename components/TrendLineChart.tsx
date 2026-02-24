'use client';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

interface YearPoint {
  academic_year: string;
  avg_grade: number;
  n: number;
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-[#1e2a3a] border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg px-3 py-2 text-xs">
      <p className="font-semibold text-slate-700 dark:text-slate-200 mb-1">{label}</p>
      <p className="text-teal-600 dark:text-teal-400 font-bold">{payload[0].value.toFixed(1)}% avg grade</p>
      <p className="text-slate-400 dark:text-slate-500">{payload[0].payload.n.toLocaleString()} records</p>
    </div>
  );
}

export default function TrendLineChart({ data }: { data: YearPoint[] }) {
  const formatted = data.map(d => ({
    ...d,
    label: d.academic_year.replace(/(\d{4})-(\d{4})/, (_, a, b) => `${a}–${b.slice(2)}`),
  }));

  const allAvgs = formatted.map(d => d.avg_grade);
  const minVal = Math.floor(Math.min(...allAvgs) - 1);
  const maxVal = Math.ceil(Math.max(...allAvgs) + 1);

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={formatted} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
        <defs>
          <linearGradient id="gradeGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#0d9488" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.07} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: 'currentColor', opacity: 0.5 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          domain={[minVal, maxVal]}
          ticks={Array.from({ length: maxVal - minVal + 1 }, (_, i) => minVal + i)}
          tick={{ fontSize: 11, fill: 'currentColor', opacity: 0.5 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v: number) => `${v}%`}
          width={42}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="avg_grade"
          stroke="#0d9488"
          strokeWidth={2.5}
          fill="url(#gradeGradient)"
          dot={{ r: 4, fill: '#0d9488', strokeWidth: 0 }}
          activeDot={{ r: 6, fill: '#0d9488', strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
