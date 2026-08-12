'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import SearchResultsDropdown from './SearchResultsDropdown';

interface Result {
  slug: string;
  program_name: string;
  university: string;
  ouac_code?: string;
  n_total: number;
}

/**
 * Pill search field from the original design mockups.
 *
 * `size="hero"` is the tall 56px version inside the homepage "Explore Programs"
 * card; `size="bar"` is the 48px version in the program page header.
 * `fill` lets the homepage suggestion chips populate the query.
 */
export default function SearchBar({
  autoFocus = false,
  size = 'bar',
  fill,
}: {
  autoFocus?: boolean;
  size?: 'hero' | 'bar';
  fill?: string;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Chip clicks push a value in from the parent.
  useEffect(() => {
    if (fill) {
      setQuery(fill);
      inputRef.current?.focus();
    }
  }, [fill]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setOpen(false);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.results || []);
        setOpen(true);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, []);

  function handleSelect(slug: string) {
    setOpen(false);
    setQuery('');
    router.push(`/program/${slug}`);
  }

  const hero = size === 'hero';

  return (
    <div ref={containerRef} className="relative w-full">
      <div
        className={`flex items-center gap-3 border-2 border-stroke rounded-full ${
          hero ? 'h-14 px-5 bg-page' : 'h-12 px-4 sm:px-[14px] bg-card'
        }`}
      >
        <svg
          width={hero ? 20 : 18}
          height={hero ? 20 : 18}
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--muted)"
          strokeWidth="2.5"
          strokeLinecap="round"
          className="shrink-0"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3.5-3.5" />
        </svg>
        <input
          ref={inputRef}
          autoFocus={autoFocus}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search programs, universities, OUAC codes..."
          className={`flex-1 min-w-0 border-none outline-none bg-transparent text-ink placeholder:text-muted ${
            hero ? 'text-sm' : 'text-[12px]'
          }`}
        />
        {query && (
          <button
            onClick={() => { setQuery(''); setResults([]); setOpen(false); }}
            aria-label="Clear search"
            className="text-muted hover:text-ink shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      {open && <SearchResultsDropdown results={results} onSelect={handleSelect} loading={loading} />}
    </div>
  );
}
