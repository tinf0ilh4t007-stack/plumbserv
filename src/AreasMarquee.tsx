import React, { useEffect, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';
import { SERVICE_AREAS } from './areas';

export default function AreasMarquee() {
  // Duplicate the list so the marquee loops seamlessly.
  const items = [...SERVICE_AREAS, ...SERVICE_AREAS];

  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const [paused, setPaused] = useState(false);

  // Live state read by handlers — avoids stale closures.
  const pausedRef = useRef(false);
  const draggingRef = useRef(false);
  const dragState = useRef<{ startX: number; startOffset: number; moved: boolean } | null>(null);

  const setPausedBoth = (v: boolean) => {
    pausedRef.current = v;
    setPaused(v);
  };
  const setDraggingBoth = (v: boolean) => {
    draggingRef.current = v;
    setDragging(v);
  };

  // CSS-transform marquee. The track holds the list twice; animating
  // translateX from 0 to -50% loops seamlessly. Runs on the compositor,
  // so it's immune to rAF throttling / scroll-metric races that freeze a
  // JS scrollLeft loop in a fresh browser tab.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      // Read the CURRENT visual offset. If the animation is running, its
      // current keyframe value is what the user sees — capture it so the
      // drag starts exactly where the animation left off.
      const current = getComputedStyle(track).transform;
      const m = current.match(/matrix\(([^)]+)\)/);
      const base = m ? parseFloat(m[1]) : 0;
      dragState.current = { startX: e.clientX, startOffset: base, moved: false };
      setDraggingBoth(true);
      setPausedBoth(true);
      // Remove the animation while dragging so the inline transform is the
      // single source of truth — no more fighting between animation and JS.
      track.classList.add('marquee-dragging');
      track.setPointerCapture(e.pointerId);
    };

    const onPointerMove = (e: PointerEvent) => {
      const ds = dragState.current;
      if (!ds) return;
      const dx = e.clientX - ds.startX;
      if (Math.abs(dx) > 3) ds.moved = true;
      // 1:1 pointer speed — the drag tracks the cursor exactly.
      const half = track.scrollWidth / 2;
      let off = (ds.startOffset + dx) % half;
      if (off > 0) off -= half;
      track.style.transform = `translateX(${off}px)`;
    };

    const endDrag = () => {
      const ds = dragState.current;
      const wasDrag = ds?.moved ?? false;
      const finalOffset = ds ? ds.startOffset + (ds.moved ? 0 : 0) : 0;
      dragState.current = null;
      setDraggingBoth(false);
      track.classList.remove('marquee-dragging');

      if (wasDrag) {
        // Restart the animation from the current dragged offset so it
        // resumes smoothly from where the user left it, in sync.
        const current = getComputedStyle(track).transform;
        const m = current.match(/matrix\(([^)]+)\)/);
        const off = m ? parseFloat(m[1]) : 0;
        const half = track.scrollWidth / 2;
        const startPct = ((off % half) / half) * 100;
        track.style.animation = 'none';
        // Force reflow so the animation restart takes effect.
        void track.offsetWidth;
        track.style.animation = '';
        track.style.setProperty('--marquee-start', `${startPct}%`);
        setPausedBoth(false);
      } else {
        // A plain click (no movement) stays paused.
        setPausedBoth(true);
      }
    };

    track.addEventListener('pointerdown', onPointerDown);
    track.addEventListener('pointermove', onPointerMove);
    track.addEventListener('pointerup', endDrag);
    track.addEventListener('pointercancel', endDrag);
    track.addEventListener('pointerleave', endDrag);

    return () => {
      track.removeEventListener('pointerdown', onPointerDown);
      track.removeEventListener('pointermove', onPointerMove);
      track.removeEventListener('pointerup', endDrag);
      track.removeEventListener('pointercancel', endDrag);
      track.removeEventListener('pointerleave', endDrag);
    };
  }, []);

  // Prevent click-to-select text while dragging.
  useEffect(() => {
    const onDragStart = (e: DragEvent) => e.preventDefault();
    document.addEventListener('dragstart', onDragStart);
    return () => document.removeEventListener('dragstart', onDragStart);
  }, []);

  return (
    <section className="border-y border-[#2F2F2F] bg-[#262626] py-5">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 sm:flex-row sm:items-center sm:gap-6">
        <div className="flex shrink-0 items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#9E7FFF]/15">
            <MapPin className="h-4 w-4 text-[#9E7FFF]" />
          </span>
          <div>
            <p className="text-sm font-semibold text-white">Areas we service</p>
            <p className="text-xs text-[#A3A3A3]">Drag to scroll location</p>
          </div>
        </div>

        <div className="relative flex-1 overflow-hidden">
          {/* edge fades */}
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-[#262626] to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-[#262626] to-transparent" />

          <div
            ref={trackRef}
            className={`marquee-track flex w-max cursor-grab select-none items-center gap-8 py-1 active:cursor-grabbing ${
              paused ? 'marquee-paused' : ''
            }`}
          >
            {items.map((area, i) => (
              <span
                key={i}
                className="flex shrink-0 items-center gap-2 text-sm font-medium uppercase tracking-wide text-[#A3A3A3]"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-[#9E7FFF]" />
                {area}
              </span>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        .marquee-track {
          overflow: hidden;
          animation: marquee-scroll 28s linear infinite;
          will-change: transform;
        }
        .marquee-track.marquee-paused {
          animation-play-state: paused;
        }
        .marquee-track.marquee-dragging {
          animation: none;
        }
        @keyframes marquee-scroll {
          from { transform: translateX(var(--marquee-start, 0%)); }
          to { transform: translateX(calc(var(--marquee-start, 0%) - 50%)); }
        }
        @media (prefers-reduced-motion: reduce) {
          .marquee-track {
            animation: none;
          }
        }
      `}</style>
    </section>
  );
}
