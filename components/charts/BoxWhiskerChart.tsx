'use client';
import { RAMP, STROKE } from './chartTheme';

interface BoxWhiskerProps {
  min: number;
  q1: number;
  median: number;
  mean: number;
  q3: number;
  max: number;
}

// Geometry from the mockup's IQR panel: a 1000x120 viewBox with the whisker
// spanning x=131 to x=885.
const VB_W = 1000;
const VB_H = 120;
const LEFT = 131;
const RIGHT = 885;
const MID_Y = 60;

/**
 * Interquartile range plot from the original design mockups: whisker line with end
 * caps, a soft-filled IQR box, a brand median rule, an amber mean dot, then a
 * five-cell quartile readout and a legend.
 */
export default function BoxWhiskerChart({ min, q1, median, mean, q3, max }: BoxWhiskerProps) {
  // Guard the degenerate single-value case so nothing divides by zero.
  const span = max - min;
  const x = (v: number) => (span === 0 ? (LEFT + RIGHT) / 2 : LEFT + ((v - min) / span) * (RIGHT - LEFT));

  const boxX = x(q1);
  const boxW = Math.max(x(q3) - boxX, 4);

  const cells: { value: number; label: string }[] = [
    { value: min, label: 'Min' },
    { value: q1, label: 'Q1' },
    { value: median, label: 'Median' },
    { value: q3, label: 'Q3' },
    { value: max, label: 'Max' },
  ];

  return (
    <div>
      <svg viewBox={`0 0 ${VB_W} ${VB_H}`} width="100%" height="108" fill="none" className="mt-3">
        {/* whisker */}
        <line x1={x(min)} y1={MID_Y} x2={x(max)} y2={MID_Y} stroke="var(--muted)" strokeWidth="3" strokeLinecap="round" />
        <line x1={x(min)} y1={MID_Y - 20} x2={x(min)} y2={MID_Y + 20} stroke={STROKE} strokeWidth="3" strokeLinecap="round" />
        <line x1={x(max)} y1={MID_Y - 20} x2={x(max)} y2={MID_Y + 20} stroke={STROKE} strokeWidth="3" strokeLinecap="round" />
        {/* IQR box */}
        <rect x={boxX} y={MID_Y - 30} width={boxW} height="60" rx="14" fill="var(--soft)" stroke={STROKE} strokeWidth="3" />
        {/* median */}
        <line x1={x(median)} y1={MID_Y - 30} x2={x(median)} y2={MID_Y + 30} stroke="#3f6188" strokeWidth="5" strokeLinecap="round" />
        {/* mean */}
        <circle cx={x(mean)} cy={MID_Y} r="8" fill={RAMP[0]} stroke={STROKE} strokeWidth="3" />
      </svg>

      <div className="grid grid-cols-5 border-2 border-line rounded-inner overflow-hidden mt-[14px]">
        {cells.map((c, i) => (
          <div
            key={c.label}
            className={`py-4 px-2 text-center ${i < cells.length - 1 ? 'border-r-2 border-line' : ''}`}
          >
            <div className="text-sm sm:text-[15px] font-bold text-brand">{c.value.toFixed(1)}%</div>
            <div className="text-[12px] sm:text-[13px] text-muted mt-0.5">{c.label}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap justify-center gap-x-7 gap-y-2 mt-[14px] text-sm text-muted">
        <span className="flex items-center gap-2">
          <span className="w-4 h-4 rounded-[10px] bg-soft border-2 border-stroke" />
          IQR (Q1–Q3)
        </span>
        <span className="flex items-center gap-2">
          <span className="w-5 h-[10px] rounded-[10px] bg-[#3f6188]" />
          Median
        </span>
        <span className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-full bg-[#f0c987] border-2 border-stroke" />
          Mean
        </span>
      </div>
    </div>
  );
}
