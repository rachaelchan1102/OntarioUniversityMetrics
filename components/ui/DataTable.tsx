'use client';
import { useState } from 'react';

interface Row {
  id: number;
  academic_year: string;
  admission_grade: number;
  admission_month_label?: string;
  round_label?: string;
  status_normalized?: string;
  supplemental_required: number;
}

const PAGE_SIZE = 25;

const COLS = ['Year', 'Round', 'Grade', 'Status'];

/**
 * Records grid from the /mockups design: a bordered 4-column grid with a tinted
 * header row rather than a <table>.
 *
 * Pagination is kept rather than the mockup's fixed "showing 5 of 47", since
 * popular programs run to hundreds of rows.
 */
export default function DataTable({ rows }: { rows: Row[] }) {
  const [page, setPage] = useState(0);
  const pages = Math.ceil(rows.length / PAGE_SIZE);
  const slice = rows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  if (!rows.length) return null;

  const cellBase = 'px-3 sm:px-4 py-3 text-xs sm:text-sm border-b border-line';

  return (
    <div>
      <div className="grid grid-cols-4 border-2 border-line rounded-[13px] overflow-hidden">
        {COLS.map((c) => (
          <div key={c} className={`${cellBase} bg-thead text-muted font-semibold`}>
            {c}
          </div>
        ))}
        {slice.map((r) => (
          <div key={r.id} className="col-span-4 grid grid-cols-4">
            <div className={`${cellBase} text-ink`}>{r.academic_year}</div>
            <div className={`${cellBase} text-muted`}>{r.admission_month_label || r.round_label || '—'}</div>
            <div className={`${cellBase} text-ink font-semibold`}>{r.admission_grade.toFixed(1)}%</div>
            <div className={`${cellBase} text-muted capitalize`}>
              {r.status_normalized === 'accepted' ? 'Admitted' : r.status_normalized || '—'}
            </div>
          </div>
        ))}
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
