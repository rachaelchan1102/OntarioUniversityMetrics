'use client';
import React, { useEffect, useRef, useState } from 'react';

interface HorizontalCarouselProps {
  slides: React.ReactNode[];
  /** Initial slide. */
  initialIndex?: number;
  /** Autoplay interval in ms. Pass 0 to disable. */
  autoPlayMs?: number;
}

const GAP = 28;
const MAX_SLIDE = 640;

/**
 * Circular carousel.
 *
 * Slides are positioned by their *signed distance* from the active one
 * (-1 centre-left, 0 centre, +1 centre-right) taking the shortest way around
 * the ring, so there is always a card peeking on both sides and stepping past
 * the last slide wraps to the first. An earlier version translated a single
 * linear track, which read as pagination — nothing sat left of slide one and
 * the arrows dead-ended.
 *
 * Because slides are absolutely positioned they're out of flow, so the wrapper
 * height is measured from the tallest slide.
 *
 * With only two slides there's no distinct left neighbour, so one side stays
 * empty — fine for the three-slide homepage.
 */
export default function HorizontalCarousel({
  slides,
  initialIndex = 0,
  autoPlayMs = 5000,
}: HorizontalCarouselProps) {
  const safeSlides = slides ?? [];
  const count = safeSlides.length;
  const [index, setIndex] = useState(() => Math.min(Math.max(initialIndex, 0), Math.max(count - 1, 0)));
  const [paused, setPaused] = useState(false);
  // Bumped on manual navigation to restart the autoplay timer.
  const [nudge, setNudge] = useState(0);

  const viewportRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [viewportW, setViewportW] = useState(0);
  const [maxH, setMaxH] = useState(0);

  useEffect(() => {
    if (!autoPlayMs || paused || count < 2) return;
    const t = setInterval(() => setIndex(i => (i + 1) % count), autoPlayMs);
    return () => clearInterval(t);
  }, [autoPlayMs, paused, count, nudge]);

  // Track viewport width (for slide sizing) and the tallest slide (for height).
  //
  // Both setters bail out when the value is unchanged. Writing state on every
  // ResizeObserver callback re-rendered the whole carousel (and its charts) on
  // each observation, which is what produces "ResizeObserver loop completed with
  // undelivered notifications" in the console. The rAF defers the measurement
  // out of the observer callback, which is the other half of that fix.
  useEffect(() => {
    let frame = 0;
    const measure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const w = viewportRef.current?.clientWidth ?? 0;
        if (w) setViewportW(prev => (prev === w ? prev : w));
        const heights = slideRefs.current.map(el => el?.offsetHeight ?? 0);
        const tallest = Math.max(0, ...heights);
        if (tallest) setMaxH(prev => (prev === tallest ? prev : tallest));
      });
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (viewportRef.current) ro.observe(viewportRef.current);
    slideRefs.current.forEach(el => el && ro.observe(el));
    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
    };
  }, [count]);

  if (!count) return null;

  const slideW = viewportW ? Math.min(MAX_SLIDE, viewportW - 40) : MAX_SLIDE;
  const step = slideW + GAP;

  const go = (fn: (i: number) => number) => {
    setIndex(fn);
    setNudge(n => n + 1);
  };
  const prev = () => go(i => (i - 1 + count) % count);
  const next = () => go(i => (i + 1) % count);

  const arrowBase =
    'absolute top-1/2 -translate-y-1/2 z-10 w-11 h-11 sm:w-[42px] sm:h-[42px] rounded-full border-2 border-stroke bg-card text-ink flex items-center justify-center transition-colors hover:bg-soft';

  return (
    <section
      className="relative w-full"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div ref={viewportRef} className="overflow-hidden py-3.5">
        <div className="relative" style={{ height: maxH || undefined }}>
          {safeSlides.map((slide, i) => {
            // Shortest signed distance around the ring.
            const rel = (i - index + count) % count;
            const offset = rel === 0 ? 0 : rel <= count / 2 ? rel : rel - count;
            const isCentre = offset === 0;
            const adjacent = Math.abs(offset) <= 1;

            return (
              <div
                key={i}
                ref={el => {
                  slideRefs.current[i] = el;
                }}
                aria-hidden={!isCentre}
                className="absolute top-0 left-1/2 box-border transition-[transform,opacity] duration-[420ms] ease-[cubic-bezier(.4,0,.2,1)]"
                style={{
                  width: slideW,
                  transform: `translateX(calc(-50% + ${offset * step}px)) scale(${isCentre ? 1 : 0.94})`,
                  opacity: isCentre ? 1 : adjacent ? 0.4 : 0,
                  pointerEvents: isCentre ? 'auto' : 'none',
                  zIndex: isCentre ? 2 : 1,
                }}
              >
                {slide}
              </div>
            );
          })}
        </div>
      </div>

      <button onClick={prev} aria-label="Previous" className={`${arrowBase} left-0 sm:left-2`}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>
      <button onClick={next} aria-label="Next" className={`${arrowBase} right-0 sm:right-2`}>
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
