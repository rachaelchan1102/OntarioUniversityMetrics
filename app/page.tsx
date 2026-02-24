'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import SearchBar from '../components/SearchBar';
import ThemeToggle from '../components/ThemeToggle';
import TrendLineChart from '../components/TrendLineChart';

const LOWERCASE_WORDS = new Set(['of', 'the', 'and', 'at', 'in', 'for', 'a', 'an']);
const UNIVERSITY_NAME_OVERRIDES: Record<string, string> = {
  'queens university': "Queen's University",
  'wilfrid laurier university': 'Wilfrid Laurier University',
  'mcmaster university': 'McMaster University',
  'toronto metropolitan university': 'Toronto Metropolitan University',
  'nipissing': 'Nipissing University',
};
function titleCase(str: string) {
  const lower = str.toLowerCase();
  if (UNIVERSITY_NAME_OVERRIDES[lower]) return UNIVERSITY_NAME_OVERRIDES[lower];
  return str.replace(/\S+/g, (word, offset) =>
    offset === 0 || !LOWERCASE_WORDS.has(word.toLowerCase())
      ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      : word.toLowerCase()
  );
}

interface YearPoint {
  academic_year: string;
  avg_grade: number;
  n: number;
}

interface UniversityPoint {
  university: string;
  avg_grade: number;
  n: number;
}

interface Stats {
  total_records: number;
  total_programs: number;
  total_universities: number;
  overall_avg: number;
  min_year: string;
  max_year: string;
  yearly_averages: YearPoint[];
  university_averages: UniversityPoint[];
}

const KPICOLORS = {
  blue:   { icon: 'bg-blue-100 dark:bg-blue-900/60',    iconText: 'text-blue-500 dark:text-blue-400',   val: 'text-blue-700 dark:text-blue-300' },
  mint:   { icon: 'bg-teal-100 dark:bg-teal-900/60',    iconText: 'text-teal-500 dark:text-teal-400',   val: 'text-teal-700 dark:text-teal-300' },
  purple: { icon: 'bg-violet-100 dark:bg-violet-900/60', iconText: 'text-violet-500 dark:text-violet-400', val: 'text-violet-700 dark:text-violet-300' },
  pink:   { icon: 'bg-pink-100 dark:bg-pink-900/60',    iconText: 'text-pink-500 dark:text-pink-400',   val: 'text-pink-700 dark:text-pink-300' },
} as const;

function KPICard({
  icon, label, value, sub, color = 'blue',
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  color?: keyof typeof KPICOLORS;
}) {
  const c = KPICOLORS[color];
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1e2a3a] p-5 flex items-start gap-4 shadow-sm">
      <div className={`mt-0.5 flex items-center justify-center w-9 h-9 rounded-xl shrink-0 ${c.icon}`}>
        <span className={c.iconText}>{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium mb-0.5 text-slate-500 dark:text-slate-200">{label}</p>
        <p className={`text-2xl font-bold leading-tight ${c.val}`}>{value}</p>
        {sub && <p className="text-xs mt-0.5 text-slate-400 dark:text-slate-300">{sub}</p>}
      </div>
    </div>
  );
}

function NotesDropdown() {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1e2a3a] overflow-hidden shadow-sm">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-sm font-medium text-slate-500 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 transition"
      >
        <span className="flex items-center gap-2">
          <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 110 20A10 10 0 0112 2z" />
          </svg>
          Notes &amp; Disclaimers
        </span>
        <svg className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="px-5 pb-5 pt-1 space-y-3 text-sm text-slate-500 dark:text-slate-300 border-t border-slate-100 dark:border-slate-700">
          <div className="flex gap-2.5 pt-2">
            <span className="mt-0.5 shrink-0 text-amber-500">⚠</span>
            <p><span className="font-medium text-slate-700 dark:text-slate-200">Supplemental Required</span>{' '}indicates that admission is based on more than grades alone — portfolio, audition, or other criteria may apply.</p>
          </div>
          <div className="flex gap-2.5">
            <span className="mt-0.5 shrink-0 text-teal-500">ℹ</span>
            <p><span className="font-medium text-slate-700 dark:text-slate-200">Grade data is a subset</span>{' '}of all admitted students — only those who voluntarily shared results are captured here.</p>
          </div>
          <div className="flex gap-2.5">
            <span className="mt-0.5 shrink-0 text-slate-300">🔗</span>
            <p><span className="font-medium text-slate-700 dark:text-slate-200">Data source:</span>{' '}
              Sourced from <a href="https://www.reddit.com/r/OntarioGrade12s/" target="_blank" rel="noopener noreferrer" className="text-teal-600 dark:text-teal-400 hover:underline">r/OntarioGrade12s</a>.
            </p>
          </div>
        </div>
      )}
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
        const start = stats.min_year.split('-')[0];
        const end = stats.max_year.split('-')[1] ?? stats.max_year.split('-')[0];
        return start === end ? start : `${start}–${end}`;
      })()
    : null;

  const latestAvg = stats?.yearly_averages?.at(-1);
  const prevAvg = stats?.yearly_averages?.at(-2);
  const trend = latestAvg && prevAvg
    ? (latestAvg.avg_grade - prevAvg.avg_grade).toFixed(1)
    : null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f1a2b]">
      <main className="max-w-6xl mx-auto px-5 sm:px-10 py-10 space-y-6">

        {/* Page title */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Ontario University Admissions Data Explorer</h1>
          <p className="text-slate-500 dark:text-slate-300 text-sm mt-1">Explore historical admission trends, grade distributions, competitiveness, and deviations from university published averages across Ontario university programs.</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {stats ? (
            <>
              <KPICard color="blue" label="Admission Records" value={stats.total_records.toLocaleString()} sub="total data points" icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              } />
              <KPICard color="mint" label="Programs Tracked" value={stats.total_programs.toLocaleString()} sub="unique programs" icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
              } />
              <KPICard color="purple" label="Overall Average" value={`${stats.overall_avg?.toFixed(1)}%`} sub={trend ? `${Number(trend) >= 0 ? '▲' : '▼'} ${Math.abs(Number(trend))}% vs prev year` : 'all years combined'} icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
              } />
              <KPICard color="pink" label="Year Coverage" value={yearRange!} sub={`${stats.yearly_averages?.length} academic years`} icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              } />
            </>
          ) : (
            [1,2,3,4].map(i => (
              <div key={i} className="h-[88px] bg-white dark:bg-[#1e2a3a] rounded-2xl border border-slate-200 dark:border-slate-700 animate-pulse" />
            ))
          )}
        </div>

        {/* Chart + Search side by side on large screens */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Search + mini stats (now always first) */}
          <div className="lg:col-span-2 flex flex-col gap-4 order-1">
            <div className="bg-white dark:bg-[#1e2a3a] rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-5 flex-1">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-1">Find a Program</p>
              <p className="text-xs text-slate-400 dark:text-slate-300 mb-3">Search by name, university, or OUAC code</p>
              <SearchBar autoFocus />
              <p className="text-xs text-slate-400 dark:text-slate-300 mt-2">e.g. &ldquo;Computer Science&rdquo;, &ldquo;Waterloo&rdquo;, &ldquo;WCS&rdquo;</p>
            </div>
          </div>
          {/* Trend chart */}
          <div className="lg:col-span-3 bg-white dark:bg-[#1e2a3a] rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm order-2">
            <div className="px-5 pt-5 pb-2 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
              <div>
                <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Average Admission Grade by Year</h2>
                <p className="text-xs text-slate-400 dark:text-slate-300 mt-0.5">Across all programs &amp; universities</p>
              </div>
              {stats && latestAvg && (
                <span className="text-xs font-semibold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30 px-2 py-0.5 rounded-full border border-teal-200 dark:border-teal-800">
                  Latest: {latestAvg.avg_grade.toFixed(1)}%
                </span>
              )}
            </div>
            <div className="px-2 pb-4">
              {stats?.yearly_averages?.length ? (
                <TrendLineChart data={stats.yearly_averages} />
              ) : (
                <div className="h-[220px] animate-pulse bg-slate-100 dark:bg-slate-700/30 rounded-xl mx-3" />
              )}
            </div>
          </div>
        </div>

        {/* Top 5 highest and lowest university averages */}
        {stats?.university_averages?.length ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Top 5 highest */}
            <div className="bg-white dark:bg-[#1e2a3a] rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-5">
              <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-2">Top 5 Universities by Highest Average Admission Grade</h2>
              <div className="space-y-3">
                {stats.university_averages.slice(0, 5).map((u, i) => {
                  const pct = ((u.avg_grade - 75) / (100 - 75)) * 100;
                  const barGradient = [
                    'bg-gradient-to-r from-teal-500 to-teal-300',
                    'bg-gradient-to-r from-blue-500 to-blue-300',
                    'bg-gradient-to-r from-violet-500 to-violet-300',
                    'bg-gradient-to-r from-pink-500 to-pink-300',
                    'bg-gradient-to-r from-amber-500 to-amber-300',
                  ][i];
                  return (
                    <div key={u.university}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-slate-600 dark:text-slate-300 font-medium truncate max-w-[70%]">
                          <span className="text-slate-400 dark:text-slate-300 mr-1.5">#{i + 1}</span>{titleCase(u.university)}
                        </span>
                        <span className="font-semibold text-slate-700 dark:text-slate-100 shrink-0 ml-2">{u.avg_grade.toFixed(1)}%</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${barGradient}`} style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            {/* Top 5 lowest */}
            <div className="bg-white dark:bg-[#1e2a3a] rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-5">
              <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-2">Top 5 Universities by Lowest Average Admission Grade</h2>
              <div className="space-y-3">
                {stats.university_averages.slice(-5).reverse().map((u, i) => {
                  const pct = ((u.avg_grade - 75) / (100 - 75)) * 100;
                  const barGradient = [
                    'bg-gradient-to-r from-teal-500 to-teal-300',
                    'bg-gradient-to-r from-blue-500 to-blue-300',
                    'bg-gradient-to-r from-violet-500 to-violet-300',
                    'bg-gradient-to-r from-pink-500 to-pink-300',
                    'bg-gradient-to-r from-amber-500 to-amber-300',
                  ][i];
                  return (
                    <div key={u.university}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-slate-600 dark:text-slate-300 font-medium truncate max-w-[70%]">
                          <span className="text-slate-400 dark:text-slate-300 mr-1.5">#{i + 1}</span>{titleCase(u.university)}
                        </span>
                        <span className="font-semibold text-slate-700 dark:text-slate-100 shrink-0 ml-2">{u.avg_grade.toFixed(1)}%</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${barGradient}`} style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : null}

        {/* Notes */}
        <NotesDropdown />
      </main>
    </div>
  );
}
