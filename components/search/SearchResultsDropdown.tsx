interface Result {
  slug: string;
  program_name: string;
  university: string;
  ouac_code?: string;
  n_total: number;
}

// Restyled to the /mockups token set: card surface, 2px line border, big radius.
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
      <div className="absolute top-full left-0 right-0 mt-2 bg-card border-2 border-line rounded-inner shadow-lg z-50 p-3">
        <div className="animate-pulse space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 bg-soft rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!results.length) return null;

  return (
    <div className="absolute top-full left-0 right-0 mt-2 bg-card border-2 border-line rounded-inner shadow-lg z-50 overflow-hidden max-h-[336px] overflow-y-auto">
      {results.map((r) => (
        <button
          key={r.slug}
          onClick={() => onSelect(r.slug)}
          className="w-full text-left px-5 py-3 hover:bg-soft border-b border-line last:border-0 transition-colors"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink truncate">{r.program_name}</p>
              <p className="text-xs text-muted truncate">
                {r.university}
                {r.ouac_code ? ` • ${r.ouac_code}` : ''}
              </p>
            </div>
            <span className="text-xs text-muted shrink-0">{r.n_total} records</span>
          </div>
        </button>
      ))}
    </div>
  );
}
