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
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            selected === y
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white text-gray-600 border border-gray-200 hover:border-indigo-300 hover:text-indigo-600 dark:bg-white/5 dark:text-gray-400 dark:border-white/10 dark:hover:border-indigo-500 dark:hover:text-indigo-400'
          }`}
        >
          {y === 'ALL' ? 'All Years' : y}
        </button>
      ))}
    </div>
  );
}
