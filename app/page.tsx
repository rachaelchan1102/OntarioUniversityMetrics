'use client';
import { useEffect, useState } from 'react';
import SearchBar from '../components/search/SearchBar';
import TrendLineChart from '../components/charts/TrendLineChart';
import HorizontalCarousel from '../components/ui/HorizontalCarousel';
import NotesDropdown from '../components/ui/NotesDropdown';
import StatCard from '../components/ui/StatCard';
import Logo from '../components/ui/Logo';
import ThemeToggle from '../components/theme/ThemeToggle';
import { RAMP } from '../components/charts/chartTheme';
import { displayUniversity } from '../lib/format/universityNames';

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
  last_updated: string | null;
}

const SUGGESTIONS = ['Computer Science', 'Waterloo', 'WCS'];

/** Ranked bar row used by both Top 5 slides. */
function RankRow({ rank, name, value, width, color }: {
  rank: number; name: string; value: string; width: string; color: string;
}) {
  return (
    <li className="flex flex-col gap-2">
      <div className="flex items-baseline gap-2.5">
        <span className="text-[12px] font-semibold text-muted">#{rank}</span>
        <span className="text-[12px] sm:text-sm font-medium truncate">{name}</span>
        <span className="ml-auto text-[12px] sm:text-sm font-semibold shrink-0">{value}</span>
      </div>
      <div className="h-3.5 rounded-full bg-soft border-2 border-stroke overflow-hidden">
        <div
          className="h-full rounded-full border-r-2 border-stroke"
          style={{ width, background: color }}
        />
      </div>
    </li>
  );
}

/** Scale bar widths so the smallest value still reads as a bar, per the mockup. */
function toRows(data: UniversityPoint[]) {
  const values = data.map(d => Number(d.avg_grade));
  const max = Math.max(...values);
  const min = Math.min(...values);
  return data.map((d, i) => {
    const v = Number(d.avg_grade);
    return {
      rank: i + 1,
      name: displayUniversity(d.university),
      value: `${v.toFixed(1)}%`,
      color: RAMP[i % RAMP.length],
      width: `${(30 + (70 * (v - min + 0.6)) / (max - min + 0.6)).toFixed(1)}%`,
    };
  });
}

function TopFiveCard({ title, rows }: { title: string; rows: ReturnType<typeof toRows> }) {
  return (
    <div className="h-full bg-card border-2 border-line rounded-card p-6 sm:px-8 sm:py-[24px]">
      <h2 className="text-base sm:text-lg font-semibold mb-5 sm:mb-[18px]">{title}</h2>
      <ul className="flex flex-col gap-4 sm:gap-[14px]">
        {rows.map(r => <RankRow key={r.name} {...r} />)}
      </ul>
    </div>
  );
}

export default function HomePage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [yearRange, setYearRange] = useState<string | null>(null);
  const [latestAvg, setLatestAvg] = useState<YearPoint | null>(null);
  const [fill, setFill] = useState<string | undefined>();

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/stats');
        let data: Stats | null = null;
        try {
          data = await res.json();
        } catch {
          data = null;
        }
        if (data && data.yearly_averages && data.yearly_averages.length > 0) {
          setStats(data);
          setLatestAvg(data.yearly_averages[data.yearly_averages.length - 1]);
          const startYear = data.min_year?.split('-')[0];
          const endYear = data.max_year?.split('-')[1];
          if (startYear && endYear) setYearRange(`${startYear}–${endYear}`);
        } else {
          setStats(null);
        }
      } catch {
        setStats(null);
      }
    }
    fetchStats();
  }, []);

  const uniAverages = stats?.university_averages ?? [];
  const topHigh = uniAverages.length ? toRows(uniAverages.slice(0, 5)) : [];
  const topLow = uniAverages.length ? toRows([...uniAverages].reverse().slice(0, 5)) : [];

  return (
    <div className="min-h-screen px-6 pb-20">
      <div className="max-w-shell mx-auto flex justify-end pt-[18px]">
        <ThemeToggle />
      </div>

      {/* Brand header */}
      <header className="max-w-[940px] mx-auto mt-3.5 flex flex-col items-center text-center gap-4 sm:gap-[14px]">
        <h1>
          <Logo />
          <span className="sr-only">Ontario University Metrics</span>
        </h1>
        <p className="max-w-[880px] text-[15px] sm:text-[18px] leading-relaxed text-muted text-pretty">
          Explore historical admission trends, grade distributions, grade inflation, and comparison
          against university published averages.
        </p>
      </header>

      {/* Chart + Top 5 carousel */}
      {topHigh.length > 0 && (
        <div className="max-w-shell mx-auto mt-10 sm:mt-[42px]">
          <HorizontalCarousel
            initialIndex={0}
            slides={[
              <div key="chart" className="h-full bg-card border-2 border-line rounded-card p-6 sm:px-8 sm:pt-[24px] sm:pb-[21px]">
                <h2 className="text-base sm:text-lg font-semibold">Average Admission Grade Over Time</h2>
                <p className="text-sm text-muted mt-1">Across all programs and universities</p>
                {latestAvg && (
                  <span className="inline-block mt-3.5 mb-2 bg-soft text-brand border-2 border-stroke rounded-full px-3.5 py-1 text-[12px] font-semibold">
                    Latest: {Number(latestAvg.avg_grade).toFixed(1)}%
                  </span>
                )}
                <div className="h-[152px] mt-1">
                  <TrendLineChart data={stats!.yearly_averages} height="100%" />
                </div>
              </div>,
              <TopFiveCard key="high" title="Top 5 Universities by Highest Average Admission Grade" rows={topHigh} />,
              <TopFiveCard key="low" title="Top 5 Universities by Lowest Average Admission Grade" rows={topLow} />,
            ]}
          />
        </div>
      )}

      {/* KPI row */}
      {stats && (
        <section className="max-w-shell mx-auto mt-10 sm:mt-11 grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          <StatCard glyph="Ad" label="Admission Records" value={stats.total_records.toLocaleString()} sub="total data points" />
          <StatCard glyph="Pr" label="Programs Tracked" value={stats.total_programs.toLocaleString()} sub="unique programs" />
          <StatCard glyph="Un" label="Universities Tracked" value={stats.total_universities.toLocaleString()} sub="unique universities" />
          <StatCard glyph="Yr" label="Year Coverage" value={yearRange ?? '—'} sub={`${stats.yearly_averages.length} academic years`} />
        </section>
      )}

      {/* Search */}
      <section className="max-w-shell mx-auto mt-7 bg-card border-2 border-line rounded-card p-6 sm:px-9 sm:pt-[27px] sm:pb-[30px]">
        <h2 className="text-xl sm:text-[24px] font-semibold -tracking-[0.01em]">
          <span className="text-brand">Explore</span> Programs
        </h2>
        <p className="text-[12px] text-muted mt-1">Search by name, university, or OUAC code</p>
        <div className="mt-5">
          <SearchBar size="hero" fill={fill} />
        </div>
        <div className="flex items-center gap-2.5 mt-4 flex-wrap">
          <span className="text-[12px] text-muted">Try</span>
          {SUGGESTIONS.map(s => (
            <button
              key={s}
              onClick={() => setFill(s)}
              className="text-[12px] font-medium text-brand bg-soft border-2 border-stroke rounded-full px-3.5 py-1 transition-opacity hover:opacity-80"
            >
              {s}
            </button>
          ))}
        </div>
      </section>

      {/* Notes */}
      <div className="max-w-shell mx-auto mt-6">
        <NotesDropdown />
      </div>

      {stats?.last_updated && (
        <div className="max-w-shell mx-auto mt-[21px] text-[12px] text-muted">
          Last updated:{' '}
          {new Date(stats.last_updated).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </div>
      )}
    </div>
  );
}
