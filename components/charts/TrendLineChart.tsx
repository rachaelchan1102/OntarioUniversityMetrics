'use client';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';
import { LINE_COLOR, RAMP, STROKE, axisProps, gridProps, tooltipStyle } from './chartTheme';

interface YearPoint {
  academic_year: string;
  avg_grade: number;
  n: number;
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={tooltipStyle} className="px-3.5 py-2.5">
      <p className="font-semibold mb-0.5">{label}</p>
      <p className="text-brand font-bold">{Number(payload[0].value).toFixed(1)}% avg grade</p>
      <p className="text-muted">{Number(payload[0].payload.n).toLocaleString()} records</p>
    </div>
  );
}

export default function TrendLineChart({ data, height = '100%' }: { data: YearPoint[]; height?: number | string }) {
  const formatted = data.map(d => ({
    ...d,
    avg_grade: Number(d.avg_grade),
    n: Number(d.n),
    label: d.academic_year.replace(/(\d{4})-(\d{4})/, (_, a, b) => `${a}–${b.slice(2)}`),
  }));

  const allAvgs = formatted.map(d => d.avg_grade);
  const minVal = Math.floor(Math.min(...allAvgs) - 1);
  const maxVal = Math.ceil(Math.max(...allAvgs) + 1);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={formatted} margin={{ top: 8, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid {...gridProps} />
        <XAxis dataKey="label" {...axisProps} />
        <YAxis
          domain={[minVal, maxVal]}
          ticks={Array.from({ length: maxVal - minVal + 1 }, (_, i) => minVal + i)}
          tickFormatter={(v: number) => `${v}%`}
          width={44}
          {...axisProps}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="avg_grade"
          stroke={LINE_COLOR}
          strokeWidth={4}
          strokeLinecap="round"
          fill="var(--soft)"
          fillOpacity={0.55}
          activeDot={{ r: 7, fill: RAMP[0], stroke: STROKE, strokeWidth: 2.5 }}
          dot={{ r: 5.5, fill: 'var(--soft)', stroke: STROKE, strokeWidth: 2.5 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
