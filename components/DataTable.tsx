'use client';
import { useState } from 'react';

interface Row {
  id: number;
  academic_year: string;
  admission_grade: number;
  admission_month_label?: string;
  round_label?: string;
  supplemental_required: number;
}

const PAGE_SIZE = 25;

export default function DataTable({ rows }: { rows: Row[] }) {
  const [page, setPage] = useState(0);
  const pages = Math.ceil(rows.length / PAGE_SIZE);
  const slice = rows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  if (!rows.length) return null;

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700">
              <th className="py-2.5 pr-6 font-medium text-slate-500 dark:text-slate-200">Year</th>
              <th className="py-2.5 pr-6 font-medium text-slate-500 dark:text-slate-200">Grade</th>
              <th className="py-2.5 font-medium text-slate-500 dark:text-slate-200">Round / Month</th>
            </tr>
          </thead>
          <tbody>
            {slice.map((r) => (
              <tr key={r.id} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-white/5">
                <td className="py-2.5 pr-6 text-slate-600 dark:text-slate-200">{r.academic_year}</td>
                <td className="py-2.5 pr-6 font-semibold text-slate-900 dark:text-white">{r.admission_grade.toFixed(1)}%</td>
                <td className="py-2.5 text-slate-500 dark:text-slate-300">{r.admission_month_label || r.round_label || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pages > 1 && (
          <div className="flex items-center justify-between mt-4 text-sm text-slate-500 dark:text-slate-300">
          <span>{rows.length} records</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-white/5 transition"
            >Prev</button>
            <span>{page + 1} / {pages}</span>
            <button
              onClick={() => setPage((p) => Math.min(pages - 1, p + 1))}
              disabled={page === pages - 1}
              className="px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-white/5 transition"
            >Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
