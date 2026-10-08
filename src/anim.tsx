/*
 * TYPOGRAPHY-IN-MOTION components (correct-by-construction — do not reimplement inline).
 *
 * WordsPullUp — splits text on spaces; each word slides up (y:20→0) with an 0.08s stagger when
 * scrolled into view (once). showAsterisk adds the superscript * on the final word.
 * WordsPullUpMultiStyle — same entrance, but takes {text, className} segments so one heading can
 * pivot typefaces mid-sentence (the serif-italic accent).
 * ScrollRevealText — the scroll-linked reading effect: each character's opacity eases 0.2→1 as
 * the paragraph crosses the viewport (offset ['start 0.8','end 0.2']), staggered by index.
 */
import React, { useRef } from 'react';
import { motion, useInView, useScroll, useTransform, type MotionValue } from 'framer-motion';

export function WordsPullUp({
  text,
  className = '',
  style,
  showAsterisk = false,
}: {
  text: string;
  className?: string;
  style?: React.CSSProperties;
  showAsterisk?: boolean;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { once: true });
  const words = text.split(' ');

  return (
    <div ref={ref} className={`inline-flex flex-wrap ${className}`} style={style}>
      {words.map((word, i) => (
        <motion.span
          key={`${word}-${i}`}
          initial={{ y: 20, opacity: 0 }}
          animate={inView ? { y: 0, opacity: 1 } : {}}
          transition={{ delay: i * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="relative inline-block"
        >
          {word}
          {showAsterisk && i === words.length - 1 && (
            <span className="absolute top-[0.65em] -right-[0.3em] text-[0.31em]">*</span>
          )}
          {i < words.length - 1 ? '\u00A0' : ''}
        </motion.span>
      ))}
    </div>
  );
}

export function WordsPullUpMultiStyle({
  segments,
  className = '',
}: {
  segments: Array<{ text: string; className?: string }>;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { once: true });
  const words = segments.flatMap((seg) => seg.text.split(' ').map((word) => ({ word, className: seg.className ?? '' })));

  return (
    <div ref={ref} className={`inline-flex flex-wrap justify-center ${className}`}>
      {words.map(({ word, className: wordClass }, i) => (
        <motion.span
          key={`${word}-${i}`}
          initial={{ y: 20, opacity: 0 }}
          animate={inView ? { y: 0, opacity: 1 } : {}}
          transition={{ delay: i * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className={`inline-block ${wordClass}`}
        >
          {word}
          {i < words.length - 1 ? '\u00A0' : ''}
        </motion.span>
      ))}
    </div>
  );
}

function AnimatedLetter({
  char,
  index,
  total,
  progress,
}: {
  char: string;
  index: number;
  total: number;
  progress: MotionValue<number>;
}) {
  const charProgress = index / total;
  const opacity = useTransform(progress, [charProgress - 0.1, charProgress + 0.05], [0.2, 1]);

  return <motion.span style={{ opacity }}>{char}</motion.span>;
}

export function ScrollRevealText({ text, className = '' }: { text: string; className?: string }) {
  const ref = useRef<HTMLParagraphElement | null>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.8', 'end 0.2'] });
  const chars = text.split('');

  return (
    <p ref={ref} className={className}>
      {chars.map((char, i) => (
        <AnimatedLetter key={i} char={char} index={i} total={chars.length} progress={scrollYProgress} />
      ))}
    </p>
  );
}
