// Brand mark from the original design mockups: a bar-chart trio wearing a grad cap.
//
// Drawn inline rather than as an image because the mockup strokes it with
// var(--stroke) — that makes it theme-aware from one source instead of needing
// separate light/dark PNG lockups (which is why those assets were dropped).
// The ramp fills are intentionally constant across themes, matching the mockup.
function LogoMark({ className = 'w-[76px] h-[76px] sm:w-[116px] sm:h-[116px]' }: { className?: string }) {
  return (
    <svg viewBox="0 0 88 88" fill="none" className={`${className} shrink-0`} aria-hidden="true">
      <rect x="16" y="52" width="16" height="22" rx="8" fill="#dae8f4" stroke="var(--stroke)" strokeWidth="2.5" />
      <rect x="36" y="42" width="16" height="32" rx="8" fill="#9dbdd8" stroke="var(--stroke)" strokeWidth="2.5" />
      <rect x="56" y="30" width="16" height="44" rx="8" fill="#3f6188" stroke="var(--stroke)" strokeWidth="2.5" />
      <path d="M51 25 L64 19 L77 25 L64 31 Z" fill="#f0c987" stroke="var(--stroke)" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M77 25 V33 C77 35 74.4 35 74.4 33" stroke="var(--stroke)" strokeWidth="2.2" strokeLinecap="round" fill="none" />
      <circle cx="61" cy="41" r="1.9" fill="#fdfcfa" />
      <circle cx="68" cy="41" r="1.9" fill="#fdfcfa" />
      <path d="M61 46 C62.7 48.4 66.3 48.4 68 46" stroke="#fdfcfa" strokeWidth="2" strokeLinecap="round" fill="none" />
    </svg>
  );
}

/** Full lockup: mark + "ONTARIO / University Metrics" wordmark. */
export default function Logo() {
  return (
    <span className="flex items-center gap-4 sm:gap-5">
      <LogoMark />
      <span className="flex flex-col items-start">
        <span className="text-base sm:text-[23px] font-medium text-brand tracking-wordmark leading-none mb-1.5 sm:mb-2">
          ONTARIO
        </span>
        <span className="text-[34px] sm:text-[60px] font-semibold -tracking-[0.02em] leading-[1.05] whitespace-nowrap">
          University Metrics
        </span>
      </span>
    </span>
  );
}
