'use client';
import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { computeKPIs } from '../../../lib/stats/compute';
import KPIGrid from '../../../components/KPIGrid';
import ChartCard from '../../../components/ChartCard';
import AvgByMonthChart from '../../../components/AvgByMonthChart';
import HistogramChart from '../../../components/HistogramChart';
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
  const [rows, setRows] = useState<any[]>([]);
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
      setRows(programData.rows ?? []);
      setAllYears(yearsData.years ?? []);
    }).finally(() => setLoading(false));
  }, [slug, year]);

  const notFound = !loading && !program;            // true only if the slug itself doesn't exist
  const noDataForYear = !loading && !!program && rows.length === 0;  // program exists, but no rows for this filter
  const grades = rows.map((r: any) => r.admission_grade as number);
  const kpis = rows.length ? computeKPIs(rows) : null;

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-[#212121] px-4 py-8 max-w-5xl mx-auto space-y-6">
      {/* Search bar */}
      <div className="flex items-center gap-3">
        <Link href="/" className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-white/10 transition shrink-0" title="Home">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span className="hidden sm:inline">Home</span>
        </Link>
        <SearchBar />
        <ThemeToggle />
      </div>

      {loading ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-white/10 rounded w-1/2" />
          <div className="h-4 bg-gray-100 dark:bg-white/5 rounded w-1/3" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[1,2,3,4].map(i => <div key={i} className="h-20 bg-gray-100 dark:bg-white/5 rounded-xl" />)}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-64 bg-gray-100 dark:bg-white/5 rounded-xl" />
            <div className="h-64 bg-gray-100 dark:bg-white/5 rounded-xl" />
          </div>
        </div>
      ) : notFound ? (
        <EmptyState message="No admissions data found for this program." />
      ) : (
        <>
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{program!.program_name}</h1>
            <p className="text-gray-500 dark:text-gray-300 text-sm mt-1">
              {program!.university}
              {program!.ouac_code && <span className="ml-2 text-gray-400 dark:text-gray-400">&middot; OUAC {program!.ouac_code}</span>}
            </p>
            {program!.requires_supplemental && (
              <span className="inline-flex items-center gap-1 mt-2 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700 border border-orange-200">
                <svg className="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
                Supplemental Required
              </span>
            )}
            {program!.published_average && (
              <p className="text-sm text-gray-500 dark:text-gray-300 mt-2">
                <span className="font-medium text-gray-700 dark:text-white">University Published Estimate:</span>{' '}
                {program!.published_average}
              </p>
            )}
          </div>

          {/* Year filter — always visible so the user can switch back */}
          <YearFilter years={allYears} selected={year} />

          {noDataForYear ? (
            <EmptyState message={`No admissions data for ${year === 'ALL' ? 'any year' : year}.`} />
          ) : (
            <>
              {/* KPIs */}
              {kpis && <KPIGrid kpis={kpis} />}

              {/* Charts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ChartCard title="Average Grade by Admission Round / Month">
                  <AvgByMonthChart rows={rows} />
                </ChartCard>
                <ChartCard title="Grade Distribution">
                  <HistogramChart grades={grades} />
                </ChartCard>
              </div>

              {/* Raw data table */}
              <div className="bg-white dark:bg-[#2a2a2a] rounded-xl border border-gray-200 dark:border-white/10 p-4">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4">All Records ({rows.length})</h3>
                <DataTable rows={rows} />
              </div>
            </>
          )}
        </>
      )}
    </main>
  );
}
