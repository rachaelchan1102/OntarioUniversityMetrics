'use client';
import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { computeKPIs, computeYoY } from '../../../lib/stats/compute';
import StatCard from '../../../components/StatCard';
import ChartCard from '../../../components/ChartCard';
import AvgByMonthChart from '../../../components/AvgByMonthChart';
import HistogramChart from '../../../components/HistogramChart';
import BoxWhiskerChart from '../../../components/BoxWhiskerChart';
import DataTable from '../../../components/DataTable';
import EmptyState from '../../../components/EmptyState';
import YearFilter from '../../../components/YearFilter';
import SearchBar from '../../../components/SearchBar';
import Link from 'next/link';
import ThemeToggle from '../../../components/ThemeToggle';

export default function ProgramPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = decodeURIComponent(params.slug as string);
  const year = searchParams.get('year') || 'ALL';

  const [program, setProgram] = useState<any>(null);
  const [allRows, setAllRows] = useState<any[]>([]);
  const rows = year === 'ALL' ? allRows : allRows.filter(r => r.academic_year === year);
  const [allYears, setAllYears] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`/api/program?slug=${encodeURIComponent(slug)}&year=${encodeURIComponent(year)}`).then(r => r.json().catch(() => ({ program: null, rows: [] }))),
      fetch('/api/years').then(r => r.ok ? r.json() : { years: [] }),
    ]).then(([programData, yearsData]) => {
      // Only overwrite program when we actually get one back — preserves
      // header + year filter when a specific year has no rows
      if (programData.program) setProgram(programData.program);
      setAllRows(programData.rows ?? []);
      setAllYears(yearsData.years ?? []);
    }).finally(() => setLoading(false));
  }, [slug, year]);

  const notFound = !loading && !program;            // true only if the slug itself doesn't exist
  const noDataForYear = !loading && !!program && rows.length === 0;  // program exists, but no rows for this filter
  const grades = rows.map((r: any) => r.admission_grade as number);
  const kpis = rows.length ? computeKPIs(rows) : null;

  // Compute year-over-year change for selected year (if not ALL)
  let yoy: number | null = null;
  let prevYear: string | null = null;
  if (year === 'ALL') {
    yoy = computeYoY(allRows);
  } else if (year && year !== 'ALL' && allYears.length > 1) {
    // Ensure years are sorted ascending (oldest to newest)
    const sortedYears = [...allYears].sort();
    const idx = sortedYears.indexOf(year);
    if (idx > 0) {
      prevYear = sortedYears[idx - 1];
      const thisYearRows = allRows.filter(r => r.academic_year === year);
      const prevYearRows = allRows.filter(r => r.academic_year === prevYear);
      if (thisYearRows.length && prevYearRows.length) {
        const thisAvg = thisYearRows.reduce((a, b) => a + b.admission_grade, 0) / thisYearRows.length;
        const prevAvg = prevYearRows.reduce((a, b) => a + b.admission_grade, 0) / prevYearRows.length;
        yoy = thisAvg - prevAvg;
      }
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0f1a2b]">
      <div className="max-w-6xl mx-auto px-5 sm:px-10 pt-6 flex items-center gap-3 justify-between">
        <Link href="/" className="flex items-center gap-1.5 shrink-0 text-slate-500 hover:text-slate-900 dark:hover:text-white transition" title="Home">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 16l-4-4m0 0l4-4m-4 4h18" />
          </svg>
          <span className="font-medium text-sm">Home</span>
        </Link>
        <div className="flex-1 max-w-lg">
          <SearchBar />
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-5 sm:px-10 py-8 space-y-5">
        {loading ? (
          <div className="space-y-5 animate-pulse">
            <div className="bg-white dark:bg-[#1e2a3a] rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-teal-500/30 via-blue-500/30 to-violet-500/30" />
              <div className="px-6 py-5 space-y-3">
                <div className="h-7 bg-slate-200 dark:bg-slate-700/50 rounded-xl w-2/3" />
                <div className="h-4 bg-slate-100 dark:bg-slate-700/30 rounded-lg w-1/3" />
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 mt-2 border-t border-slate-100 dark:border-slate-700/40">
                  {[1,2,3,4].map(i => <div key={i} className="h-10 bg-slate-100 dark:bg-slate-700/30 rounded-xl" />)}
                </div>
              </div>
            </div>
            <div className="h-9 bg-white dark:bg-[#1e2a3a] rounded-xl border border-slate-200 dark:border-slate-700 w-56" />
            <div className="grid grid-cols-2 gap-4">
              <div className="h-64 bg-white dark:bg-[#1e2a3a] rounded-2xl border border-slate-200 dark:border-slate-700" />
              <div className="h-64 bg-white dark:bg-[#1e2a3a] rounded-2xl border border-slate-200 dark:border-slate-700" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[1,2,3].map(i => <div key={i} className="h-24 bg-white dark:bg-[#1e2a3a] rounded-2xl border border-slate-200 dark:border-slate-700" />)}
            </div>
            <div className="h-48 bg-white dark:bg-[#1e2a3a] rounded-2xl border border-slate-200 dark:border-slate-700" />
          </div>
        ) : notFound ? (
          <EmptyState message="No admissions data found for this program." />
        ) : (
          <>
            {/* Program header */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1e2a3a] px-6 py-6"
              style={{ boxShadow: '0 4px 20px -2px rgba(100, 116, 139, 0.25), 0 1px 4px 0 rgba(100, 116, 139, 0.1)' }}>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{program!.program_name}</h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 flex flex-wrap items-center gap-x-2">
                  <span>{program!.university}</span>
                  {program!.ouac_code && (
                    <span className="inline-flex items-center gap-1 text-slate-400 dark:text-slate-500">
                      <span className="w-1 h-1 rounded-full bg-current" />
                      OUAC {program!.ouac_code}
                    </span>
                  )}
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  {program!.requires_supplemental && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800">
                      <svg className="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                      </svg>
                      Supplemental Required
                    </span>
                  )}
                  {program!.published_average && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-teal-50 text-teal-700 border border-teal-200 dark:bg-teal-900/20 dark:text-teal-400 dark:border-teal-800">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
                      </svg>
                      University estimate: {program!.published_average}
                    </span>
                  )}
                </div>
                {kpis && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5 pt-4 border-t border-slate-100 dark:border-slate-700/60">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">Avg Grade</p>
                      <p className="text-2xl font-bold text-teal-600 dark:text-teal-400 mt-0.5 tabular-nums">{kpis.mean.toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">Median Grade</p>
                      <p className="text-2xl font-bold text-violet-600 dark:text-violet-400 mt-0.5 tabular-nums">{kpis.median.toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">Admissions Recorded</p>
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-0.5 tabular-nums">{kpis.n}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">Grade Range</p>
                      <p className="text-2xl font-bold text-pink-600 dark:text-pink-400 mt-0.5 tabular-nums">{kpis.min.toFixed(1)}–{kpis.max.toFixed(1)}%</p>
                    </div>
                  </div>
                )}
            </div>

            {/* Year filter */}
            <YearFilter years={allYears} selected={year} />

            {noDataForYear ? (
              <EmptyState message={`No admissions data for ${year === 'ALL' ? 'any year' : year}.`} />
            ) : (
              <>
                {/* Row 1: Trend chart | Histogram — equal halves */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ChartCard title="Average Grade by Admission Round / Month">
                    <AvgByMonthChart rows={rows} />
                  </ChartCard>
                  <ChartCard title="Grade Distribution">
                    <HistogramChart grades={grades} />
                  </ChartCard>
                </div>

                {/* Row 2: stat cards as compact horizontal strip */}
                <div className={`grid grid-cols-2 gap-4 ${yoy !== null ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
                  {yoy !== null && (
                    <StatCard
                      label="Grade Inflation"
                      value={(yoy >= 0 ? '+' : '') + yoy.toFixed(2) + '%'}
                      sub={year === 'ALL' ? 'avg change per year' : (prevYear ? `vs ${prevYear}` : 'vs prev year')}
                      color={yoy >= 0 ? 'mint' : 'pink'}
                      icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={yoy >= 0 ? 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' : 'M13 17h8m0 0V9m0 8l-8-8-4 4-6-6'} /></svg>}
                    />
                  )}
                  <StatCard
                    label="Std Deviation"
                    value={kpis!.std !== null ? kpis!.std.toFixed(2) : '—'}
                    color="blue"
                    icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
                  />
                  <StatCard
                    label="Above 95%"
                    value={kpis!.pct95.toFixed(1) + '%'}
                    sub="of admissions"
                    color="purple"
                    icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>}
                  />
                </div>

                {/* Row 3: Box & Whisker full width */}
                <ChartCard title="Interquartile Range (IQR)">
                  <BoxWhiskerChart
                    min={kpis!.min}
                    q1={kpis!.q1}
                    median={kpis!.median}
                    mean={kpis!.mean}
                    q3={kpis!.q3}
                    max={kpis!.max}
                  />
                </ChartCard>

                {/* Collapsible raw data table */}
                <details className="group bg-white dark:bg-[#1e2a3a] rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                  <summary className="flex items-center justify-between px-5 py-4 cursor-pointer select-none list-none">
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                      All Records <span className="font-normal text-slate-400">({rows.length})</span>
                    </span>
                    <svg
                      className="w-4 h-4 text-slate-400 transition-transform duration-200 group-open:rotate-180"
                      fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <div className="px-5 pb-5 pt-1 border-t border-slate-100 dark:border-slate-700/60">
                    <DataTable rows={rows} />
                  </div>
                </details>
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}
