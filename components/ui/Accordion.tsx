'use client';
import { ReactNode, useState } from 'react';

/**
 * Disclosure panel from the original design mockups — used for "Notes & Disclaimers" on
 * the homepage and "All Records" on the program page. Header is a full-width
 * button with a Show/Hide affordance pushed to the right.
 */
export default function Accordion({
  title,
  badge,
  meta,
  defaultOpen = false,
  children,
}: {
  title: ReactNode;
  /** Optional leading badge, e.g. the amber "!" marker. */
  badge?: ReactNode;
  /** Optional muted text after the title, e.g. a record count. */
  meta?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="bg-card border-2 border-line rounded-panel overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        className="w-full flex items-center gap-3 px-6 sm:px-7 py-5 bg-transparent border-none cursor-pointer text-left text-[14px] sm:text-base font-semibold text-ink"
      >
        {badge}
        <span>
          {title}
          {meta ? <span className="text-muted font-medium"> {meta}</span> : null}
        </span>
        <span className="ml-auto text-[12px] sm:text-sm font-medium text-muted shrink-0">
          {open ? 'Hide' : 'Show'}
        </span>
      </button>
      {open && <div className="px-6 sm:px-7 pb-6">{children}</div>}
    </section>
  );
}

/** The amber circular "!" badge the mockup puts beside "Notes & Disclaimers". */
export function AlertBadge() {
  return (
    <span className="w-[21px] h-[21px] shrink-0 rounded-full bg-[#f0c987] border-2 border-stroke flex items-center justify-center text-sm font-bold text-[#2f2a24]">
      !
    </span>
  );
}
