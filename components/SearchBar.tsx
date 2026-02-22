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

export default function SearchBar({ autoFocus = false }: { autoFocus?: boolean }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

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

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="flex items-center bg-white dark:bg-transparent border border-gray-200 dark:border-white/40 rounded-2xl px-4 py-3 sm:px-5 sm:py-4 gap-3 focus-within:border-indigo-400 dark:focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-500/30 transition shadow-lg dark:shadow-none">
        <svg className="w-4 h-4 text-gray-400 dark:text-gray-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          autoFocus={autoFocus}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search programs, universities, OUAC codes…"
          className="flex-1 outline-none text-base text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400 bg-transparent"
        />
        {query && (
          <button
            onClick={() => { setQuery(''); setResults([]); setOpen(false); }}
            className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      {open && (
        <SearchResultsDropdown
          results={results}
          onSelect={handleSelect}
          loading={loading}
        />
      )}
    </div>
  );
}
