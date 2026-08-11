'use client';
import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { computeKPIs, computeYoY } from '../../../lib/stats/compute';
import StatCard from '../../../components/ui/StatCard';
import ChartCard from '../../../components/charts/ChartCard';
import AvgByMonthChart from '../../../components/charts/AvgByMonthChart';
import HistogramChart from '../../../components/charts/HistogramChart';
import BoxWhiskerChart from '../../../components/charts/BoxWhiskerChart';
import DataTable from '../../../components/ui/DataTable';
import EmptyState from '../../../components/ui/EmptyState';
import YearFilter from '../../../components/ui/YearFilter';
import SearchBar from '../../../components/search/SearchBar';
import Accordion from '../../../components/ui/Accordion';
import ThemeToggle from '../../../components/theme/ThemeToggle';

/** Uppercase label + big brand value, per the mockup's headline KPI row. */
function HeadlineStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[12px] sm:text-xs font-semibold tracking-label text-muted">{label}</div>
      <div className="text-[21px] sm:text-[27px] font-bold text-brand leading-tight mt-1.5 tabular-nums">{value}</div>
    </div>
  );
}

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
      fetch(`/api/program?slug=${encodeURIComponent(slug)}&year=${encodeURIComponent(year)}`).then(r =>
        r.json().catch(() => ({ program: null, rows: [] }))
      ),
      fetch('/api/years').then(r => (r.ok ? r.json() : { years: [] })),
    ])
      .then(([programData, yearsData]) => {
        // Only overwrite program when we actually get one back — preserves
        // header + year filter when a specific year has no rows
        if (programData.program) setProgram(programData.program);
        setAllRows(programData.rows ?? []);
        setAllYears(yearsData.years ?? []);
      })
      .finally(() => setLoading(false));
  }, [slug, year]);

  const notFound = !loading && !program;
  const noDataForYear = !loading && !!program && rows.length === 0;
  const grades = rows.map((r: any) => r.admission_grade as number);
  const kpis = rows.length ? computeKPIs(rows) : null;

  // Year-over-year change: averaged across all years, or vs the previous year
  // when a specific year is selected.
  let yoy: number | null = null;
  let prevYear: string | null = null;
  if (year === 'ALL') {
    yoy = computeYoY(allRows);
  } else if (year && allYears.length > 1) {
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
    <div className="min-h-screen px-6 pb-20">
      <div className="max-w-wide mx-auto flex justify-end pt-[18px]">
        <ThemeToggle />
      </div>

      {/* Home link + search */}
      <div className="max-w-wide mx-auto mt-3.5 flex items-center gap-4 sm:gap-7">
        <Link href="/" className="flex items-center gap-2.5 text-[12px] sm:text-sm font-medium text-ink shrink-0">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5" />
            <path d="M11 18l-6-6 6-6" />
          </svg>
          Home
        </Link>
        <div className="flex-1 max-w-[640px] ml-auto">
          <SearchBar />
        </div>
      </div>

      <main className="max-w-wide mx-auto space-y-6">
        {loading ? (
          <div className="animate-pulse space-y-6 mt-6">
            <div className="h-64 bg-card border-2 border-line rounded-card" />
            <div className="h-11 w-72 bg-card border-2 border-line rounded-full" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="h-80 bg-card border-2 border-line rounded-card" />
              <div className="h-80 bg-card border-2 border-line rounded-card" />
            </div>
          </div>
        ) : notFound ? (
          <div className="mt-6">
            <EmptyState message="No admissions data found for this program." />
          </div>
        ) : (
          <>
            {/* Program header */}
            <section className="bg-card border-2 border-line rounded-card p-6 sm:px-9 sm:py-8 mt-6">
              <h1 className="text-[21px] sm:text-[27px] font-semibold -tracking-[0.02em] leading-tight">
                {program!.program_name}
              </h1>
              <div className="mt-1.5 text-[12px] sm:text-sm text-muted">
                {program!.university}
                {program!.ouac_code && <> &nbsp;•&nbsp; OUAC {program!.ouac_code}</>}
              </div>

              {(program!.requires_supplemental || program!.published_average) && (
                <div className="flex flex-wrap gap-3 mt-[14px]">
                  {program!.requires_supplemental && (
                    <span className="inline-flex items-center gap-2 bg-[#f0c987] text-[#2f2a24] border-2 border-stroke rounded-full px-4 py-1.5 text-[12px] sm:text-sm font-semibold">
                      Supplemental Required
                    </span>
                  )}
                  {program!.published_average && (
                    <span className="inline-flex items-center gap-2 bg-soft text-brand border-2 border-stroke rounded-full px-4 py-1.5 text-[12px] sm:text-sm font-medium">
                      University estimate: {program!.published_average}
                    </span>
                  )}
                </div>
              )}

              {kpis && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mt-7 pt-[21px] border-t-2 border-line">
                  <HeadlineStat label="AVG GRADE" value={`${kpis.mean.toFixed(1)}%`} />
                  <HeadlineStat label="MEDIAN GRADE" value={`${kpis.median.toFixed(1)}%`} />
                  <HeadlineStat label="ADMISSIONS RECORDED" value={String(kpis.n)} />
                  <HeadlineStat label="GRADE RANGE" value={`${kpis.min.toFixed(1)}–${kpis.max.toFixed(1)}%`} />
                </div>
              )}
            </section>

            <YearFilter years={allYears} selected={year} />

            {noDataForYear ? (
              <EmptyState message={`No admissions data for ${year === 'ALL' ? 'any year' : year}.`} />
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <ChartCard title="Average Grade by Admission Round / Month">
                    <AvgByMonthChart rows={rows} />
                  </ChartCard>
                  <ChartCard title="Grade Distribution">
                    <HistogramChart grades={grades} />
                  </ChartCard>
                </div>

                <div className={`grid grid-cols-1 sm:grid-cols-2 gap-6 ${yoy !== null ? 'lg:grid-cols-3' : ''}`}>
                  {yoy !== null && (
                    <StatCard
                      layout="stacked"
                      glyph={yoy >= 0 ? '↗' : '↘'}
                      label="GRADE INFLATION"
                      value={`${yoy >= 0 ? '+' : ''}${yoy.toFixed(2)}%`}
                      sub={year === 'ALL' ? 'avg change per year' : prevYear ? `vs ${prevYear}` : 'vs prev year'}
                    />
                  )}
                  <StatCard
                    layout="stacked"
                    glyph="σ"
                    label="STD DEVIATION"
                    value={kpis!.std !== null ? kpis!.std.toFixed(2) : '—'}
                    sub="across all records"
                  />
                  <StatCard
                    layout="stacked"
                    glyph="95"
                    label="ABOVE 95%"
                    value={`${kpis!.pct95.toFixed(1)}%`}
                    sub="of admissions"
                  />
                </div>

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

                <Accordion title="All Records" meta={`(${rows.length})`}>
                  <DataTable rows={rows} />
                </Accordion>
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}
