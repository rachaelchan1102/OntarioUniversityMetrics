// Shared chart tokens matching the /mockups design.
//
// The mockups reference CSS custom properties directly from SVG presentation
// attributes (e.g. stroke="var(--line)"), which resolve fine in the browser, so
// charts stay theme-aware without reading the theme in JS.

/** Categorical ramp. Constant across themes, as in the mockup. */
export const RAMP = ['#f0c987', '#3f6188', '#6f95b8', '#9dbdd8', '#c3d8ea'];

/** Brand line/area colour. */
export const LINE_COLOR = '#3f6188';

/** Heavy outline used on dots, bars and other "sticker" marks. */
export const STROKE = 'var(--stroke)';

export const gridProps = {
  strokeDasharray: '4 6',
  stroke: 'var(--line)',
  strokeWidth: 2,
  vertical: false,
} as const;

export const axisTick = { fontSize: 12, fill: 'var(--muted)', fontFamily: 'Poppins' } as const;

export const axisProps = {
  tick: axisTick,
  axisLine: false,
  tickLine: false,
} as const;

/** Tooltip chrome — card surface, 2px border, generous radius. */
export const tooltipStyle = {
  background: 'var(--card)',
  border: '2px solid var(--line)',
  borderRadius: 14,
  color: 'var(--ink)',
  fontFamily: 'Poppins',
  fontSize: 13,
  boxShadow: '0 6px 24px rgba(0,0,0,0.10)',
} as const;

export const tooltipLabelStyle = { color: 'var(--ink)', fontWeight: 600 } as const;
export const tooltipItemStyle = { color: 'var(--muted)' } as const;

/** Dot styling for line/area series. */
export function dotProps(fill: string, r = 5.5) {
  return { r, fill, stroke: STROKE, strokeWidth: 2.5 };
}
