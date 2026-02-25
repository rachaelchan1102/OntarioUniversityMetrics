import React, { useEffect, useRef, useState } from 'react';

interface UniversityPoint {
  university: string;
  avg_grade: number;
}

interface AlternatingTop5ListsProps {
  highest: UniversityPoint[];
  lowest: UniversityPoint[];
}

export default function AlternatingTop5Lists({ highest, lowest }: AlternatingTop5ListsProps) {
  const [showHighest, setShowHighest] = useState(true);
  const [paused, setPaused] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!paused) {
      intervalRef.current = setInterval(() => {
        setShowHighest((prev) => !prev);
      }, 4000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [paused]);

  const handleMouseEnter = () => setPaused(true);
  const handleMouseLeave = () => setPaused(false);

  const list = showHighest ? highest : lowest;
  const title = showHighest
    ? 'Top 5 Universities by Highest Average Admission Grade'
    : 'Top 5 Universities by Lowest Average Admission Grade';

  return (
    <div
      className="relative bg-white dark:bg-[#1e2a3a] rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-5 h-[220px] overflow-hidden transition-colors"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      tabIndex={0}
      onFocus={handleMouseEnter}
      onBlur={handleMouseLeave}
    >
      <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-2 text-center">{title}</h2>
      <ul className="space-y-3">
        {list.map((u, i) => (
          <li key={u.university} className="flex items-center justify-between text-xs mb-1 group cursor-pointer">
            <span className="text-slate-600 dark:text-slate-300 font-medium truncate max-w-[70%]">
              <span className="text-slate-400 dark:text-slate-300 mr-1.5">#{i + 1}</span>{u.university}
            </span>
            <span className="font-semibold text-slate-700 dark:text-slate-100 shrink-0 ml-2">
              {u.avg_grade.toFixed(1)}%
            </span>
            {/* Tooltip on hover */}
            <span className="absolute left-1/2 top-0 z-10 hidden group-hover:block bg-slate-900 text-white text-xs rounded px-2 py-1 mt-6 -translate-x-1/2 pointer-events-none">
              {u.university}: {u.avg_grade.toFixed(2)}%
            </span>
          </li>
        ))}
      </ul>
      {/* Indicator dots */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2">
        <span className={`w-2 h-2 rounded-full ${showHighest ? 'bg-teal-400' : 'bg-slate-400'} transition-colors`} />
        <span className={`w-2 h-2 rounded-full ${!showHighest ? 'bg-teal-400' : 'bg-slate-400'} transition-colors`} />
      </div>
    </div>
  );
}
