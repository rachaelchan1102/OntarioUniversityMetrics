interface Result {
  slug: string;
  program_name: string;
  university: string;
  ouac_code?: string;
  n_total: number;
}

export default function SearchResultsDropdown({
  results,
  onSelect,
  loading,
}: {
  results: Result[];
  onSelect: (slug: string) => void;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-white/10 shadow-lg z-50 p-3">
        <div className="animate-pulse space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 bg-gray-100 dark:bg-white/5 rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (!results.length) return null;

  return (
    <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-white/10 shadow-lg z-50 overflow-hidden">
      {results.map((r) => (
        <button
          key={r.slug}
          onClick={() => onSelect(r.slug)}
          className="w-full text-left px-4 py-3 hover:bg-indigo-50 dark:hover:bg-white/5 border-b border-gray-100 dark:border-white/5 last:border-0 transition-colors"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{r.program_name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {r.university}{r.ouac_code ? ` · ${r.ouac_code}` : ''}
              </p>
            </div>
            <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">{r.n_total} records</span>
          </div>
        </button>
      ))}
    </div>
  );
}
