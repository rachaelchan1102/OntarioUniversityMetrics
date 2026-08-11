'use client';
import React, { useEffect, useRef, useState } from 'react';

interface HorizontalCarouselProps {
  slides: React.ReactNode[];
  /** Initial slide. The mockup opens on the middle card. */
  initialIndex?: number;
  /** Autoplay interval in ms. Pass 0 to disable. */
  autoPlayMs?: number;
}

const GAP = 28;
const MAX_SLIDE = 640;

/**
 * Sliding track carousel from the /mockups design: one centred card, neighbours
 * dimmed and slightly scaled down, arrows either side, dots below.
 *
 * Slide width is measured rather than fixed at the mockup's 640px so it still
 * centres correctly on narrow screens. Slides supply their own background and
 * border — this component only positions them.
 */
export default function HorizontalCarousel({
  slides,
  initialIndex,
  autoPlayMs = 5000,
}: HorizontalCarouselProps) {
  const safeSlides = slides ?? [];
  const count = safeSlides.length;
  const [index, setIndex] = useState(() =>
    Math.min(Math.max(initialIndex ?? Math.floor(count / 2), 0), Math.max(count - 1, 0))
  );
  const [paused, setPaused] = useState(false);
  // Bumped on manual navigation to restart the autoplay timer.
  const [nudge, setNudge] = useState(0);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [viewportW, setViewportW] = useState(0);

  // Autoplay wraps around; the arrows stay bounded as in the mockup.
  useEffect(() => {
    if (!autoPlayMs || paused || count < 2) return;
    const t = setInterval(() => setIndex(i => (i + 1) % count), autoPlayMs);
    return () => clearInterval(t);
  }, [autoPlayMs, paused, count, nudge]);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const measure = () => setViewportW(el.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  if (!count) return null;

  const slideW = viewportW ? Math.min(MAX_SLIDE, viewportW - 40) : MAX_SLIDE;
  const leadIn = Math.max((viewportW - slideW) / 2, 0);
  const trackX = -(index * (slideW + GAP));

  const go = (fn: (i: number) => number) => {
    setIndex(fn);
    setNudge(n => n + 1);
  };
  const prev = () => go(i => Math.max(0, i - 1));
  const next = () => go(i => Math.min(count - 1, i + 1));

  const arrowBase =
    'absolute top-1/2 -translate-y-1/2 z-10 w-11 h-11 sm:w-[42px] sm:h-[42px] rounded-full border-2 border-stroke bg-card text-ink flex items-center justify-center transition-colors hover:bg-soft disabled:opacity-35 disabled:cursor-default';

  return (
    <section
      className="relative w-full"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div ref={viewportRef} className="overflow-hidden py-3.5">
        <div
          className="flex transition-transform duration-[380ms] ease-[cubic-bezier(.4,0,.2,1)]"
          style={{ gap: `${GAP}px`, paddingLeft: `${leadIn}px`, transform: `translateX(${trackX}px)` }}
        >
          {safeSlides.map((slide, i) => (
            <div
              key={i}
              aria-hidden={i !== index}
              className="shrink-0 box-border transition-[opacity,transform] duration-300"
              style={{
                flex: `0 0 ${slideW}px`,
                opacity: i === index ? 1 : 0.4,
                transform: `scale(${i === index ? 1 : 0.94})`,
                pointerEvents: i === index ? 'auto' : 'none',
              }}
            >
              {slide}
            </div>
          ))}
        </div>
      </div>

      <button onClick={prev} disabled={index === 0} aria-label="Previous" className={`${arrowBase} left-0 sm:left-2`}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>
      <button onClick={next} disabled={index === count - 1} aria-label="Next" className={`${arrowBase} right-0 sm:right-2`}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 6l6 6-6 6" />
        </svg>
      </button>

      <div className="flex justify-center gap-2.5 mt-5">
        {safeSlides.map((_, i) => (
          <button
            key={i}
            onClick={() => go(() => i)}
            aria-label={`Go to slide ${i + 1}`}
            aria-current={i === index}
            className={`w-3 h-3 p-0 rounded-full border-2 border-stroke transition-colors ${
              i === index ? 'bg-brand' : 'bg-card'
            }`}
          />
        ))}
      </div>
    </section>
  );
}
