import React, { useEffect, useRef, useState } from 'react';

interface VerticalCarouselProps {
  slides: React.ReactNode[];
  intervalMs?: number;
  height?: number | string;
}

export default function VerticalCarousel({ slides, intervalMs = 4000, height = 240 }: VerticalCarouselProps) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!paused && slides.length > 1) {
      intervalRef.current = setInterval(() => {
        setIndex(i => (i + 1) % slides.length);
      }, intervalMs);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [paused, slides.length, intervalMs]);

  const handleMouseEnter = () => setPaused(true);
  const handleMouseLeave = () => setPaused(false);

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1e2a3a] shadow-sm"
      style={{ height }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      tabIndex={0}
      onFocus={handleMouseEnter}
      onBlur={handleMouseLeave}
    >
      <div
        className="transition-transform duration-700 ease-in-out"
        style={{ transform: `translateY(-${index * 100}%)`, height: `calc(${slides.length} * 100%)` }}
      >
        {slides.map((slide, i) => (
          <div key={i} style={{ height, minHeight: height }} className="flex items-center justify-center w-full">
            {slide}
          </div>
        ))}
      </div>
      {/* Indicator dots */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {slides.map((_, i) => (
          <span
            key={i}
            className={`w-2 h-2 rounded-full ${i === index ? 'bg-teal-400' : 'bg-slate-400'} transition-colors`}
          />
        ))}
      </div>
    </div>
  );
}
