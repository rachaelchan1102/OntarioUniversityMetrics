'use client';
import Accordion, { AlertBadge } from './Accordion';

// Styled to the /mockups design. The mockup's placeholder body was a single
// generic paragraph; the real disclaimers below are kept because they're
// substantive and carry the data-source attribution.
export default function NotesDropdown() {
  return (
    <Accordion title="Notes & Disclaimers" badge={<AlertBadge />}>
      <ul className="space-y-3 text-sm leading-relaxed text-muted max-w-[820px] pl-0 sm:pl-9">
        <li>
          <b className="text-ink font-semibold">Self-reported data.</b> Figures are compiled from
          admissions results students shared voluntarily, so they represent a subset of admitted
          students and tend to skew upward.
        </li>
        <li>
          <b className="text-ink font-semibold">Supplemental required</b> means admission considers
          more than grades alone — a portfolio, audition, or written application may apply.
        </li>
        <li>
          <b className="text-ink font-semibold">University estimates</b> are the ranges schools
          publish themselves, shown for comparison against the self-reported averages.
        </li>
        <li>
          <b className="text-ink font-semibold">Source:</b>{' '}
          <a
            href="https://www.reddit.com/r/OntarioGrade12s/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand underline"
          >
            r/OntarioGrade12s
          </a>
          .
        </li>
      </ul>
    </Accordion>
  );
}
