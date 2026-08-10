'use client';
import { useRouter, usePathname } from 'next/navigation';

export default function YearFilter({
  years,
  selected,
}: {
  years: string[];
  selected: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const options = ['ALL', ...years];

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((y) => (
        <button
          key={y}
          onClick={() => router.push(`${pathname}?year=${y}`)}
          className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${
            selected === y
              ? 'bg-teal-600 text-white shadow-sm'
              : 'bg-white text-slate-600 border border-slate-200 hover:border-teal-400 hover:text-teal-700 dark:bg-[#1e2a3a] dark:text-slate-400 dark:border-slate-700 dark:hover:border-teal-600 dark:hover:text-teal-400'
          }`}
        >
          {y === 'ALL' ? 'All Years' : y}
        </button>
      ))}
    </div>
  );
}
