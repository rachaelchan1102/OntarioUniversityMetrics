'use client';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import SearchBar from '../components/SearchBar';
import ThemeToggle from '../components/ThemeToggle';
import TrendLineChart from '../components/TrendLineChart';
import HorizontalCarousel from '../components/HorizontalCarousel';
import NotesDropdown from '../components/NotesDropdown';

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
              {/* Subtle parallax SVG wave divider */}
              {/* This divider is now placed after the KPI cards, before Explore Programs */}
      <div className="min-w-0">
        <p className="text-xs font-medium mb-0.5 text-slate-500 dark:text-slate-200">{label}</p>
        <p className={`text-2xl font-bold leading-tight ${c.val}`}>{value}</p>
        {sub && <p className="text-xs mt-0.5 text-slate-400 dark:text-slate-300">{sub}</p>}
      </div>
    </div>
  );
}

export default function HomePage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [trend, setTrend] = useState<number | null>(null);
  const [yearRange, setYearRange] = useState<string | null>(null);
  const [latestAvg, setLatestAvg] = useState<YearPoint | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/stats');
        let data: Stats | null = null;
        try {
          data = await res.json();
        } catch (e) {
          data = null;
        }
        if (data && data.yearly_averages && data.yearly_averages.length > 0) {
          setStats(data);
          setLatestAvg(data.yearly_averages[data.yearly_averages.length - 1]);
          // Fix: Show only the first and last year, e.g. 2022-2026
          const startYear = data.min_year?.split('-')[0];
          const endYear = data.max_year?.split('-')[1];
          if (startYear && endYear) setYearRange(`${startYear}-${endYear}`);
          if (data.yearly_averages.length > 1) {
            const prev = data.yearly_averages[data.yearly_averages.length - 2].avg_grade;
            const curr = data.yearly_averages[data.yearly_averages.length - 1].avg_grade;
            setTrend(Number((curr - prev).toFixed(1)));
          }
        } else {
          setStats(null);
        }
      } catch (err) {
        setStats(null);
      }
    }
    fetchStats();
  }, []);

  return (
    <div>
      <main className="max-w-6xl mx-auto px-5 sm:px-10 py-10 space-y-6">
        {/* Page title */}
        <div>
          <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight mb-2 text-center">
            Ontario University Admissions<br />
            <span className="block text-4xl sm:text-6xl font-extrabold bg-gradient-to-r from-teal-400 to-blue-500 text-transparent bg-clip-text drop-shadow-sm mt-2">Data Explorer</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-300 text-lg sm:text-xl mt-4 text-center max-w-3xl mx-auto">Explore historical admission trends, grade distributions, grade inflation, and comparison against university published averages.</p>
        </div>


        {/* Chart + Top 5 carousel */}
        {stats?.university_averages?.length ? (
          <div className="w-full flex justify-center my-8">
            <HorizontalCarousel
              slides={[
                // Slide 1: Chart
                <div key="chart" className="px-2 pb-4 w-full h-full flex flex-col bg-white dark:bg-[#1e2a3a] border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm">
                  <div className="px-5 pt-5 pb-2">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Average Admission Grade by Year</h2>
                    <p className="text-base text-slate-400 dark:text-slate-300 mt-1">Across all programs & universities</p>
                    {stats && latestAvg && (
                      <span className="inline-flex text-base font-semibold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30 px-3 py-1 rounded-full border border-teal-200 dark:border-teal-800 whitespace-nowrap mt-2 max-w-fit">
                        Latest: {latestAvg.avg_grade.toFixed(1)}%
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-h-[260px] pl-2 sm:pl-4">
                    <TrendLineChart data={stats.yearly_averages} height="100%" />
                  </div>
                </div>,
                // Slide 2: Top 5 Highest
                <div key="highest" className="p-7 h-full bg-white dark:bg-[#1e2a3a] border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm">
                  <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-6 text-center">Top 5 Universities by Highest Average Admission Grade</h2>
                  <ul className="space-y-6">
                    {(() => {
                      const top5 = stats.university_averages.slice(0, 5);
                      const max = Math.max(...top5.map((u: UniversityPoint) => u.avg_grade));
                      return top5.map((u: UniversityPoint, i: number) => (
                        <li key={u.university}>
                          <div className="flex items-center justify-between text-sm sm:text-base">
                            <span className="text-slate-600 dark:text-slate-300 font-semibold truncate max-w-[70%]">
                              <span className="text-slate-400 dark:text-slate-300 mr-2">#{i + 1}</span>{titleCase(u.university)}
                            </span>
                            <span className="font-bold text-slate-700 dark:text-slate-100 shrink-0 ml-4">{u.avg_grade.toFixed(1)}%</span>
                          </div>
                          <div className="mt-1 px-2">
                            <div className="relative h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                              <div
                                className={`absolute left-0 top-0 h-2 rounded-full ${[
                                  'bg-gradient-to-r from-teal-500 to-teal-300',
                                  'bg-gradient-to-r from-blue-500 to-blue-300',
                                  'bg-gradient-to-r from-violet-500 to-violet-300',
                                  'bg-gradient-to-r from-pink-500 to-pink-300',
                                  'bg-gradient-to-r from-amber-500 to-amber-300',
                                ][i]}`}
                                style={{ width: `${parseFloat(u.avg_grade.toString())}%`, minWidth: '10%' }}
                              />
                            </div>
                          </div>
                        </li>
                      ));
                    })()}
                  </ul>
                </div>,
                // Slide 3: Top 5 Lowest
                <div key="lowest" className="p-7 h-full bg-white dark:bg-[#1e2a3a] border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm">
                  <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-6 text-center">Top 5 Universities by Lowest Average Admission Grade</h2>
                  <ul className="space-y-4 mb-6">
                    {(() => {
                      const bottom5 = stats.university_averages.slice(-5).reverse();
                      const max = Math.max(...bottom5.map((u: UniversityPoint) => u.avg_grade));
                      return bottom5.map((u: UniversityPoint, i: number) => (
                        <li key={u.university}>
                          <div className="flex items-center justify-between text-base sm:text-lg">
                            <span className="text-slate-600 dark:text-slate-300 font-semibold truncate max-w-[70%]">
                              <span className="text-slate-400 dark:text-slate-300 mr-2">#{i + 1}</span>{titleCase(u.university)}
                            </span>
                            <span className="font-bold text-slate-700 dark:text-slate-100 shrink-0 ml-4">{u.avg_grade.toFixed(1)}%</span>
                          </div>
                          <div className="mt-1 px-2">
                            <div className="relative h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                              <div
                                className={`absolute left-0 top-0 h-2 rounded-full ${[
                                  'bg-gradient-to-r from-teal-500 to-teal-300',
                                  'bg-gradient-to-r from-blue-500 to-blue-300',
                                  'bg-gradient-to-r from-violet-500 to-violet-300',
                                  'bg-gradient-to-r from-pink-500 to-pink-300',
                                  'bg-gradient-to-r from-amber-500 to-amber-300',
                                ][i]}`}
                                style={{ width: `${parseFloat(u.avg_grade.toString())}%`, minWidth: '10%' }}
                              />
                            </div>
                          </div>
                        </li>
                      ));
                    })()}
                  </ul>
                </div>,
              ]}
            />
          </div>
        ) : null}

        {/* Search bar section below carousel */}
                {/* KPI Cards */}
                <div className="max-w-4xl mx-auto flex justify-center grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
                  {stats ? (
                    <>
                      <KPICard color="blue" label="Admission Records" value={stats.total_records.toLocaleString()} sub="total data points" icon={
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      } />
                      <KPICard color="mint" label="Programs Tracked" value={stats.total_programs.toLocaleString()} sub="unique programs" icon={
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                      } />
                      <KPICard color="purple" label="Universities Tracked" value={stats.total_universities.toLocaleString()} sub="unique universities" icon={
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

        
        <div className="max-w-4xl mx-auto bg-white dark:bg-[#1e2a3a] border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm p-6">
          <h2 className="text-2xl sm:text-4xl font-extrabold text-left mb-2">
            <span className="bg-gradient-to-r from-cyan-500 to-blue-500 text-transparent bg-clip-text">Explore</span>
            <span className="text-slate-800 dark:text-slate-100"> Programs</span>
          </h2>
          <p className="text-base text-slate-400 dark:text-slate-300 mb-4 text-left">Search by name, university, or OUAC code</p>
          <SearchBar />
          <p className="text-sm text-slate-400 dark:text-slate-300 mt-4">e.g. “Computer Science”, “Waterloo”, “WCS”</p>
        </div>

        {/* Notes & Disclaimers Dropdown */}
        <div className="max-w-4xl mx-auto">
          <NotesDropdown />
        </div>
      </main>
    </div>
  );
}
