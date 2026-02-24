'use client';
import { useTheme } from './ThemeProvider';

interface BoxWhiskerProps {
  min: number;
  q1: number;
  median: number;
  mean: number;
  q3: number;
  max: number;
}

const VW = 500;
const PAD_X = 56;
const MID_Y = 44;
const BOX_HALF = 18;
const VH = 88;

function sx(v: number, domMin: number, domMax: number) {
  if (domMax === domMin) return VW / 2;
  return PAD_X + ((v - domMin) / (domMax - domMin)) * (VW - 2 * PAD_X);
}

export default function BoxWhiskerChart({ min, q1, median, mean, q3, max }: BoxWhiskerProps) {
  const { dark } = useTheme();

  const buf = Math.max(0.5, (max - min) * 0.12);
  const domMin = min - buf;
  const domMax = max + buf;
  const x = (v: number) => sx(v, domMin, domMax);

  const c = {
    whisker:    dark ? '#475569' : '#94a3b8',
    boxFill:    dark ? 'rgba(20,184,166,0.15)' : 'rgba(20,184,166,0.12)',
    boxStroke:  dark ? '#2dd4bf' : '#0d9488',
    medianLine: dark ? '#2dd4bf' : '#0f766e',
    meanDot:    '#f472b6',
  };

  return (
    <div className="w-full select-none space-y-2">
      {/* Pure graphic — no text labels in SVG */}
      <svg viewBox={`0 0 ${VW} ${VH}`} className="w-full" style={{ height: VH }}>
        {/* Whisker line */}
        <line x1={x(min)} y1={MID_Y} x2={x(max)} y2={MID_Y}
          stroke={c.whisker} strokeWidth={2} strokeLinecap="round" />
        {/* End caps */}
        <line x1={x(min)} y1={MID_Y - BOX_HALF + 6} x2={x(min)} y2={MID_Y + BOX_HALF - 6}
          stroke={c.whisker} strokeWidth={2} strokeLinecap="round" />
        <line x1={x(max)} y1={MID_Y - BOX_HALF + 6} x2={x(max)} y2={MID_Y + BOX_HALF - 6}
          stroke={c.whisker} strokeWidth={2} strokeLinecap="round" />
        {/* IQR box */}
        <rect x={x(q1)} y={MID_Y - BOX_HALF}
          width={Math.max(4, x(q3) - x(q1))} height={BOX_HALF * 2}
          fill={c.boxFill} stroke={c.boxStroke} strokeWidth={1.5} rx={4} />
        {/* Median line */}
        <line x1={x(median)} y1={MID_Y - BOX_HALF} x2={x(median)} y2={MID_Y + BOX_HALF}
          stroke={c.medianLine} strokeWidth={3} strokeLinecap="round" />
        {/* Mean diamond */}
        <polygon
          points={`${x(mean)},${MID_Y - 6} ${x(mean) + 6},${MID_Y} ${x(mean)},${MID_Y + 6} ${x(mean) - 6},${MID_Y}`}
          fill={c.meanDot} />
      </svg>

      {/* Stats row — always legible, no positioning math */}
      <div className="grid grid-cols-5 divide-x divide-slate-200 dark:divide-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
        {[
          { label: 'Min',    val: min,    key: false },
          { label: 'Q1',     val: q1,     key: true  },
          { label: 'Median', val: median, key: true  },
          { label: 'Q3',     val: q3,     key: true  },
          { label: 'Max',    val: max,    key: false },
        ].map(({ label, val, key }) => (
          <div key={label} className="flex flex-col items-center py-2.5 px-1 bg-white dark:bg-[#1e2a3a]">
            <span className={`text-sm font-bold tabular-nums ${key ? 'text-teal-600 dark:text-teal-400' : 'text-slate-700 dark:text-slate-200'}`}>
              {val.toFixed(1)}%
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-none">{label}</span>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-5 pt-0.5 text-xs text-slate-500 dark:text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm shrink-0"
            style={{ background: c.boxFill, border: `1.5px solid ${c.boxStroke}` }} />
          IQR (Q1–Q3)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-4 shrink-0 rounded"
            style={{ height: 3, background: c.medianLine }} />
          Median
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-2.5 h-2.5 shrink-0 rotate-45"
            style={{ background: c.meanDot }} />
          Mean
        </span>
      </div>
    </div>
  );
}
