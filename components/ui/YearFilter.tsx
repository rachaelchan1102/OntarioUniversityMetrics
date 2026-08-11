'use client';
import { useRouter, usePathname } from 'next/navigation';

// Pill row from the /mockups design: active pill is solid brand with white text,
// inactive pills are card-coloured. Both carry the heavy 2px stroke outline.
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
    <div className="flex flex-wrap gap-3">
      {options.map((y) => {
        const active = selected === y;
        return (
          <button
            key={y}
            onClick={() => router.push(`${pathname}?year=${y}`)}
            aria-pressed={active}
            className={`text-[12px] font-medium border-2 border-stroke rounded-full px-5 py-2 transition-colors ${
              active ? 'bg-brand text-white' : 'bg-card text-ink hover:bg-soft'
            }`}
          >
            {y === 'ALL' ? 'All Years' : y}
          </button>
        );
      })}
    </div>
  );
}
