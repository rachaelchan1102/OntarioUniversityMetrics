'use client';
import { Fragment, useState } from 'react';

interface Row {
  id: number;
  academic_year: string;
  admission_grade: number;
  admission_month_label?: string;
  round_label?: string;
  supp_quartile?: number | null;
  supp_notes?: string | null;
  comments?: string | null;
  supplemental_required: number;
}

const PAGE_SIZE = 25;

/**
 * Records grid from the original design mockups: a bordered grid with a tinted header
 * row rather than a <table>.
 *
 * The mockup's fourth column was "Status", but the ETL only imports accepted
 * rows so that value never varies. It's replaced with the notes the submitter
 * left, which is the column that actually carries information. The
 * supplemental-assessment quartile (CASPer for nursing, Western Engineering's
 * SPF) gets its own pill.
 *
 * Both extra columns only appear when the program has data for them, so
 * programs without supplementals keep a clean three-column table.
 *
 * Pagination is kept rather than the mockup's fixed "5 of 47", since popular
 * programs run to hundreds of rows.
 */
export default function DataTable({ rows }: { rows: Row[] }) {
  const [page, setPage] = useState(0);
  const pages = Math.ceil(rows.length / PAGE_SIZE);
  const slice = rows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  if (!rows.length) return null;

  const hasNotes = rows.some(r => r.supp_notes || r.comments);
  const hasQuartile = rows.some(r => r.supp_quartile != null);

  const cols = [
    'Year',
    'Round',
    'Grade',
    ...(hasQuartile ? ['Quartile'] : []),
    ...(hasNotes ? ['Notes'] : []),
  ];
  // Every cell is a direct child of ONE grid so the header and body share column
  // tracks. Wrapping each row in its own nested grid created a separate
  // formatting context per row, and nothing lined up with the header.
  // The first columns size to their content; Notes absorbs what's left.
  const gridStyle = {
    gridTemplateColumns: `max-content max-content max-content${hasQuartile ? ' max-content' : ''}${
      hasNotes ? ' minmax(0,1fr)' : ''
    }`,
  };
  const cellBase = 'px-3 sm:px-4 py-3 text-xs sm:text-sm border-b border-line';

  return (
    <div>
      {/* The Year/Round/Grade/Quartile columns are max-content and nowrap, so on a
          phone they can exceed the viewport. Scroll the table inside its own box
          rather than letting it widen the page. */}
      <div className="overflow-x-auto">
        <div className="grid border-2 border-line rounded-[13px] overflow-hidden" style={gridStyle}>
        {cols.map((c) => (
          <div key={c} className={`${cellBase} bg-thead text-muted font-semibold whitespace-nowrap`}>
            {c}
          </div>
        ))}
        {slice.map((r) => {
          const note = [r.supp_notes, r.comments].filter(Boolean).join(' • ');
          return (
            <Fragment key={r.id}>
              <div className={`${cellBase} text-ink whitespace-nowrap`}>{r.academic_year}</div>
              <div className={`${cellBase} text-muted whitespace-nowrap`}>
                {r.admission_month_label || r.round_label || '—'}
              </div>
              <div className={`${cellBase} text-ink font-semibold whitespace-nowrap tabular-nums`}>
                {r.admission_grade.toFixed(1)}%
              </div>
              {hasQuartile && (
                <div className={`${cellBase} whitespace-nowrap`}>
                  {r.supp_quartile != null ? (
                    <span className="inline-block bg-soft text-brand border-2 border-stroke rounded-full px-2 py-0.5 text-[11px] font-semibold">
                      Q{r.supp_quartile}
                    </span>
                  ) : (
                    <span className="text-muted">—</span>
                  )}
                </div>
              )}
              {hasNotes && (
                <div className={`${cellBase} text-muted align-top`}>
                  {note ? <span className="line-clamp-3">{note}</span> : '—'}
                </div>
              )}
            </Fragment>
          );
        })}
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 mt-3 text-[12px] text-muted">
        <span>
          Showing {slice.length} of {rows.length} record{rows.length === 1 ? '' : 's'}
        </span>
        {pages > 1 && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-3 py-1 rounded-full border-2 border-line disabled:opacity-40 hover:bg-soft transition-colors"
            >
              Prev
            </button>
            <span>
              {page + 1} / {pages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(pages - 1, p + 1))}
              disabled={page === pages - 1}
              className="px-3 py-1 rounded-full border-2 border-line disabled:opacity-40 hover:bg-soft transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
