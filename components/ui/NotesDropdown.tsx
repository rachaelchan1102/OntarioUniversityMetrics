import { useState } from 'react';

export default function NotesDropdown() {
  const [open, setOpen] = useState(false);
  return (
    <div className="max-w-4xl mx-auto mt-10 mb-4">
      <div
        className="flex items-center justify-between cursor-pointer bg-slate-50 dark:bg-[#232f3e] border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-slate-600 dark:text-slate-300 text-sm"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <div className="flex items-center gap-2">
          <span className="text-lg text-blue-400">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" /><path d="M12 8v4m0 4h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
          </span>
          <span className="font-semibold text-base text-slate-700 dark:text-slate-100">Notes & Disclaimers</span>
        </div>
        <span className="ml-2 text-xl text-slate-400">{open ? '▲' : '▼'}</span>
      </div>
      {open && (
        <div className="bg-white dark:bg-[#1e2a3a] border-x border-b border-slate-200 dark:border-slate-700 rounded-b-2xl p-5 pt-4 text-slate-700 dark:text-slate-200 text-sm space-y-3">
          <div className="flex items-start gap-2">
            <span className="text-yellow-400 mt-0.5">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M12 9v4m0 4h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" /></svg>
            </span>
            <span><b>Supplemental Required</b> indicates that admission is based on more than grades alone — portfolio, audition, or other criteria may apply.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-teal-400 mt-0.5">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" /><path d="M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
            </span>
            <span><b>Grade data is a subset</b> of all admitted students — only those who voluntarily shared results are captured here.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-slate-400 mt-0.5">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M8 12h8m-4-4v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" /></svg>
            </span>
            <span><b>Data source:</b> Sourced from <a href="https://www.reddit.com/r/OntarioGrade12s/" target="_blank" rel="noopener noreferrer" className="text-teal-500 underline">r/OntarioGrade12s</a>.</span>
          </div>
        </div>
      )}
    </div>
  );
}
