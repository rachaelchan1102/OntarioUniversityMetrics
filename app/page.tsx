'use client';
import { useEffect, useState } from 'react';
import SearchBar from '../components/SearchBar';
import ThemeToggle from '../components/ThemeToggle';

function NotesDropdown() {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-6 rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 transition"
      >
        <span className="flex items-center gap-2">
          <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 110 20A10 10 0 0112 2z" />
          </svg>
          Notes & Disclaimers
        </span>
        <svg
          className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="px-4 pb-4 pt-1 space-y-3 text-sm text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-white/5">
          <div className="flex gap-2.5 pt-2">
            <span className="mt-0.5 shrink-0 text-amber-500">⚠</span>
            <p>
              <span className="font-medium text-gray-700 dark:text-gray-200">Supplemental Required</span>{' '}
              indicates that admission to that program is based on more than grades alone, typically including a required supplemental application, portfolio, audition, or other criteria. A high average does not guarantee an offer.
            </p>
          </div>
          <div className="flex gap-2.5">
            <span className="mt-0.5 shrink-0 text-blue-400">ℹ</span>
            <p>
              <span className="font-medium text-gray-700 dark:text-gray-200">Grade data is a subset</span>{' '}
              of all admitted students. Only those who have voluntarily shared their admission results are captured here. The averages shown may not perfectly reflect actual cutoffs, but become more accurate as more data is contributed over time.
            </p>
          </div>
          <div className="flex gap-2.5">
            <span className="mt-0.5 shrink-0 text-gray-400">🔗</span>
            <p>
              <span className="font-medium text-gray-700 dark:text-gray-200">Data source:</span>{' '}
              Data was sourced from admission results shared by users on{' '}
              <a
                href="https://www.reddit.com/r/OntarioGrade12s/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-500 hover:text-indigo-400 underline underline-offset-2"
              >
                r/OntarioGrade12s
              </a>.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

interface Stats {
  total_records: number;
  total_programs: number;
  total_universities: number;
  min_year: string;
  max_year: string;
}

function StatPill({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="flex flex-col items-center px-5 py-3 bg-white dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm min-w-[100px]">
      <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">{value}</span>
      <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 text-center">{label}</span>
    </div>
  );
}

export default function HomePage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch('/api/stats').then(r => r.ok ? r.json() : null).then(d => d && setStats(d));
  }, []);

  const yearRange = stats
    ? (() => {
        const start = stats.min_year.split('-')[0];        // "2022" from "2022-2023"
        const end   = stats.max_year.split('-')[1] ?? stats.max_year.split('-')[0]; // "2024" from "2023-2024"
        return start === end ? start : `${start}–${end}`;
      })()
    : null;

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-[#212121] px-5 sm:px-12 py-12 sm:py-20">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-end mb-6">
          <ThemeToggle />
        </div>
        {/* Title */}
        <h1 className="text-3xl sm:text-5xl font-bold text-[#2f2f2f] dark:text-white mb-5">Ontario University Admissions Data Explorer</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8">Explore historical admission trends, grade distributions, competitiveness, and deviations from university published averages across Ontario university programs.</p>

        {/* Stats row */}
        <div className="flex flex-wrap gap-3 mt-10 mb-10">
          {stats ? (
            <>
              <StatPill value={stats.total_records.toLocaleString()} label="Admissions records" />
              <StatPill value={stats.total_programs.toLocaleString()} label="Programs" />
              <StatPill value={stats.total_universities.toLocaleString()} label="Universities" />
              <StatPill value={yearRange!} label="Year coverage" />
            </>
          ) : (
            [1,2,3,4].map(i => (
              <div key={i} className="h-[72px] w-[110px] bg-gray-100 dark:bg-white/5 rounded-xl animate-pulse" />
            ))
          )}
        </div>

        {/* Search */}
        <SearchBar autoFocus />
        <p className="text-xs text-gray-400 dark:text-gray-400 mt-3">Try &ldquo;Computer Science&rdquo;, &ldquo;Waterloo&rdquo;, or an OUAC code like &ldquo;WCS&rdquo;</p>

        <NotesDropdown />
      </div>
    </main>
  );
}