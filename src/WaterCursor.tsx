import React, { useEffect, useRef } from 'react';

/**
 * Custom water-drop cursor.
 *
 * A primary-colored droplet follows the mouse with a slight ease, and a
 * trailing accent-colored droplet lags behind it. On click, a small ripple
 * ring bursts at the cursor. The native cursor is hidden while the custom
 * one is active.
 */
export default function WaterCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const trailRef = useRef<HTMLDivElement>(null);
  const rippleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const dot = dotRef.current;
    const trail = trailRef.current;
    const ripple = rippleRef.current;
    if (!dot || !trail || !ripple) return;

    // Target positions (raw mouse) and eased positions.
    const target = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const eased = { x: target.x, y: target.y };
    const trailEased = { x: target.x, y: target.y };
    let visible = false;
    let raf = 0;

    const onMove = (e: MouseEvent) => {
      target.x = e.clientX;
      target.y = e.clientY;
      if (!visible) {
        visible = true;
        dot.style.opacity = '1';
        trail.style.opacity = '1';
        // Snap both to the cursor so there's no fly-in from the corner.
        eased.x = target.x;
        eased.y = target.y;
        trailEased.x = target.x;
        trailEased.y = target.y;
      }
    };

    const onDown = () => {
      ripple.style.left = `${target.x}px`;
      ripple.style.top = `${target.y}px`;
      ripple.classList.remove('water-ripple');
      void ripple.offsetWidth; // restart animation
      ripple.classList.add('water-ripple');
    };

    const onLeave = () => {
      visible = false;
      dot.style.opacity = '0';
      trail.style.opacity = '0';
    };

    const loop = () => {
      // Ease the droplet toward the cursor (fast, snappy).
      eased.x += (target.x - eased.x) * 0.35;
      eased.y += (target.y - eased.y) * 0.35;
      // Trail lags a bit more.
      trailEased.x += (target.x - trailEased.x) * 0.18;
      trailEased.y += (target.y - trailEased.y) * 0.18;

      dot.style.transform = `translate(${eased.x}px, ${eased.y}px)`;
      trail.style.transform = `translate(${trailEased.x}px, ${trailEased.y}px)`;
      raf = requestAnimationFrame(loop);
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('mousedown', onDown);
    document.documentElement.addEventListener('mouseleave', onLeave);
    raf = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mousedown', onDown);
      document.documentElement.removeEventListener('mouseleave', onLeave);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      {/* Main droplet — primary color, follows the cursor tightly */}
      <div
        ref={dotRef}
        aria-hidden="true"
        className="water-cursor-dot"
        style={{ opacity: 0 }}
      />
      {/* Trailing droplet — accent color, lags behind */}
      <div
        ref={trailRef}
        aria-hidden="true"
        className="water-cursor-trail"
        style={{ opacity: 0 }}
      />
      {/* Click ripple */}
      <div ref={rippleRef} aria-hidden="true" className="water-cursor-ripple" />

      <style>{`
        /* Hide the native cursor while the custom one is active.
           Only on devices with a fine pointer (mouse/trackpad). */
        @media (pointer: fine) {
          * {
            cursor: none !important;
          }
        }

        .water-cursor-dot,
        .water-cursor-trail {
          position: fixed;
          top: 0;
          left: 0;
          z-index: 9999;
          pointer-events: none;
          will-change: transform;
          transition: opacity 0.2s ease-out;
        }

        /* The droplet shape: a rounded teardrop via border-radius. */
        .water-cursor-dot {
          width: 18px;
          height: 18px;
          margin: -9px 0 0 -9px;
          border-radius: 50% 50% 50% 50%;
          background: radial-gradient(circle at 35% 30%, #b39aff, #9E7FFF 60%, #7c5ce0);
          box-shadow: 0 0 12px rgba(158, 127, 255, 0.6);
        }

        .water-cursor-trail {
          width: 10px;
          height: 10px;
          margin: -5px 0 0 -5px;
          border-radius: 50%;
          background: radial-gradient(circle at 35% 30%, #f9a8d4, #f472b6 60%, #db2777);
          box-shadow: 0 0 8px rgba(244, 114, 182, 0.5);
        }

        .water-cursor-ripple {
          position: fixed;
          top: 0;
          left: 0;
          z-index: 9998;
          width: 40px;
          height: 40px;
          margin: -20px 0 0 -20px;
          border-radius: 50%;
          border: 2px solid rgba(158, 127, 255, 0.7);
          pointer-events: none;
          opacity: 0;
          transform: scale(0.2);
        }

        .water-cursor-ripple.water-ripple {
          animation: water-ripple 0.5s ease-out forwards;
        }

        @keyframes water-ripple {
          0% {
            opacity: 0.8;
            transform: scale(0.2);
          }
          100% {
            opacity: 0;
            transform: scale(2.2);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .water-cursor-dot,
          .water-cursor-trail {
            transition: none;
          }
          .water-cursor-ripple.water-ripple {
            animation-duration: 0.01ms;
          }
        }
      `}</style>
    </>
  );
}
