import React, { useEffect, useRef, useState } from 'react';

interface HorizontalCarouselProps {
  slides: React.ReactNode[];
  intervalMs?: number;
}

export default function HorizontalCarousel({ slides, intervalMs = 4000 }: HorizontalCarouselProps) {
  const safeSlides = slides ?? [];
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!paused && safeSlides.length > 1) {
      intervalRef.current = setInterval(() => {
        setIndex(i => (i + 1) % safeSlides.length);
      }, intervalMs);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [paused, safeSlides.length, intervalMs]);

  const handleMouseEnter = () => setPaused(true);
  const handleMouseLeave = () => setPaused(false);

  const goTo = (i: number) => setIndex(i);
  const prev = () => setIndex(i => (i - 1 + safeSlides.length) % safeSlides.length);
  const next = () => setIndex(i => (i + 1) % safeSlides.length);

  // Dynamically determine the max height of all slides
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [maxHeight, setMaxHeight] = useState<number>(0);

  useEffect(() => {
    // After mount or index change, update maxHeight
    const heights = slideRefs.current.map(ref => ref?.offsetHeight || 0);
    setMaxHeight(Math.max(...heights, 320));
  }, [safeSlides, index]);

  const getCardProps = (i: number) => {
    const pos = (i - index + safeSlides.length) % safeSlides.length;
    if (pos === 0) {
      // Center
      return {
        style: {
          transform: 'scale(1) translateY(0px)',
          opacity: 1,
          zIndex: 3,
          boxShadow: '0 8px 32px 0 rgba(0,0,0,0.10)',
        },
        className: 'carousel-card center',
      };
    } else if (pos === safeSlides.length - 1) {
      // Left
      return {
        style: {
          transform: 'scale(0.82) translateX(-60%) translateY(16px)',
          opacity: 0.5,
          zIndex: 2,
          filter: 'blur(0.5px)',
        },
        className: 'carousel-card left',
      };
    } else if (pos === 1) {
      // Right
      return {
        style: {
          transform: 'scale(0.82) translateX(60%) translateY(16px)',
          opacity: 0.5,
          zIndex: 2,
          filter: 'blur(0.5px)',
        },
        className: 'carousel-card right',
      };
    } else {
      // Hidden
      return {
        style: { display: 'none' },
        className: 'carousel-card hidden',
      };
    }
  };

  return (
    <div
      className="relative flex items-center justify-center w-full py-8"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      tabIndex={0}
      onFocus={handleMouseEnter}
      onBlur={handleMouseLeave}
    >
      {/* Left arrow */}
      <button
        className="absolute left-0 z-20 bg-white/80 dark:bg-[#1e2a3a]/80 rounded-full p-2 shadow hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        onClick={prev}
        aria-label="Previous"
        style={{ top: '50%', transform: 'translateY(-50%)' }}
      >
        <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
      </button>
      {/* Carousel cards */}
      <div className="relative flex items-center justify-center w-full max-w-4xl" style={{height: maxHeight ? `${maxHeight}px` : 'auto'}}>
        {safeSlides.map((slide, i) => {
          const { style, className } = getCardProps(i);
          return (
            <div
              key={i}
              ref={el => { slideRefs.current[i] = el; }}
              className={`absolute transition-all duration-700 ease-in-out ${className}`}
              style={{
                left: '50%',
                top: '50%',
                width: window.innerWidth < 640 ? '98vw' : '480px', // Responsive: 98vw for mobile, 480px for desktop
                maxWidth: window.innerWidth < 640 ? '98vw' : '480px',
                minHeight: '0',
                height: maxHeight ? `${maxHeight}px` : 'auto',
                transform: `${style.transform} translate(-50%, -50%)`,
                opacity: style.opacity,
                zIndex: style.zIndex,
                boxShadow: style.boxShadow,
                filter: style.filter,
                display: style.display,
                background: 'white',
                borderRadius: '1.25rem',
                overflow: 'hidden',
                pointerEvents: className.includes('center') ? 'auto' : 'none',
                transition: 'all 0.7s cubic-bezier(.4,0,.2,1)',
              }}
            >
              <div style={{height: '100%', width: '100%'}}>
                {slide}
              </div>
            </div>
          );
        })}
      </div>
      {/* Right arrow */}
      <button
        className="absolute right-0 z-20 bg-white/80 dark:bg-[#1e2a3a]/80 rounded-full p-2 shadow hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        onClick={next}
        aria-label="Next"
        style={{ top: '50%', transform: 'translateY(-50%)' }}
      >
        <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
      </button>
      {/* Indicator dots */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {safeSlides.map((_, i) => (
          <span
            key={i}
            className={`w-2 h-2 rounded-full ${i === index ? 'bg-teal-400' : 'bg-slate-400'} transition-colors cursor-pointer`}
            onClick={() => goTo(i)}
          />
        ))}
      </div>
    </div>
  );
}
