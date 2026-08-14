import Image from 'next/image';

// Brand mark: the 3D-rendered mascot in /public/oum-mascot.png — three bars with
// the tallest wearing a grad cap.
//
// This replaced a hand-drawn inline SVG version. The SVG was theme-aware via
// var(--stroke), which an image can't be; this render carries its own shading
// and reads on both backgrounds, so no light/dark pair is needed.
//
// Source is 2048x2048; next/image serves a resized variant per breakpoint, so
// the browser never downloads the full asset for a ~116px mark.
// Sized larger than the old SVG mark because this artwork carries ~13% transparent
// padding on each side, so the mascot occupies roughly three quarters of its box.
function LogoMark({ className = 'w-[84px] h-[84px] sm:w-[164px] sm:h-[164px]' }: { className?: string }) {
  return (
    <Image
      src="/oum-mascot.png"
      alt=""
      aria-hidden="true"
      width={2048}
      height={2048}
      priority
      className={`${className} shrink-0 object-contain`}
    />
  );
}

/** Full lockup: mark + "ONTARIO / University Metrics" wordmark. */
export default function Logo() {
  return (
    // min-w-0 lets the text column shrink inside the flex row; without it a
    // flex item refuses to go below its content width and pushes the whole
    // header past the viewport on narrow screens.
    <span className="flex items-center gap-3 sm:gap-5 min-w-0">
      <LogoMark />
      <span className="flex flex-col items-start min-w-0">
        <span className="text-sm sm:text-[23px] font-medium text-brand tracking-wordmark leading-none mb-1 sm:mb-2">
          ONTARIO
        </span>
        {/* Wraps to two lines on phones; stays on one line from sm: up. */}
        <span className="text-[28px] sm:text-[60px] font-semibold -tracking-[0.02em] leading-[1.05] sm:whitespace-nowrap">
          University Metrics
        </span>
      </span>
    </span>
  );
}
