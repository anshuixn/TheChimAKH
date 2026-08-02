import { useEffect, useState, useRef, useCallback } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { getChapterAndFrameForProgress, EXPERIENCE_CHAPTERS } from './experience.config';
import type { ExperienceChapter } from './experience.config';

gsap.registerPlugin(ScrollTrigger);

interface ProgressHookOptions {
  triggerRef: React.RefObject<HTMLDivElement | null>;
  /** Called on every RAF tick with the latest frameIndex — no React re-render cost */
  onFrameIndexChange: (index: number) => void;
}

export function useExperienceProgress({ triggerRef, onFrameIndexChange }: ProgressHookOptions) {
  const [progress, setProgress] = useState(0);
  const [chapter, setChapter] = useState<ExperienceChapter>(EXPERIENCE_CHAPTERS[0]);
  const [frameIndex, setFrameIndex] = useState(1);

  // onFrameIndexChange may change between renders — keep a stable ref
  const onFrameIndexChangeRef = useRef(onFrameIndexChange);
  useEffect(() => {
    onFrameIndexChangeRef.current = onFrameIndexChange;
  });

  const scrollTriggerInstanceRef = useRef<globalThis.ScrollTrigger | null>(null);
  const isMountedRef = useRef(true);

  // Throttle React state updates to max once per rAF (16ms), so GSAP's high-
  // frequency onUpdate never floods the React render pipeline.
  // The hot-path (frameIndex) is now delivered via the ref callback — zero re-render cost.
  const lastSetRef = useRef(0);

  useEffect(() => {
    isMountedRef.current = true;
    const triggerElement = triggerRef.current;
    if (!triggerElement) return;

    const isMobile = window.innerWidth <= 768;

    const ctx = gsap.context(() => {
      scrollTriggerInstanceRef.current = ScrollTrigger.create({
        trigger: triggerElement,
        start: 'top top',
        end: '+=400%',
        pin: true,
        scrub: isMobile ? 0.3 : true,
        onUpdate: (self) => {
          if (!isMountedRef.current) return;
          const rawProgress = self.progress;
          if (typeof rawProgress !== 'number' || isNaN(rawProgress)) return;

          const clamped = Math.max(0, Math.min(1, rawProgress));
          const { chapter: ch, frameIndex: fIndex } = getChapterAndFrameForProgress(clamped);

          // ── Hot path: deliver frameIndex via ref callback (no re-render) ───
          // ExperienceCanvas reads this from currentIndexRef on every RAF tick.
          onFrameIndexChangeRef.current(fIndex);

          // ── Cold path: React state updates (throttled to 1 per rAF) ────────
          // progress and chapter drive UI overlays — they don't need to be
          // pixel-perfect with every scroll event, just visually smooth.
          const now = performance.now();
          if (now - lastSetRef.current < 14) return; // skip if < ~1 rAF interval
          lastSetRef.current = now;

          setProgress(clamped);
          setChapter(ch);
          setFrameIndex(fIndex);
        },
      });
    });

    return () => {
      isMountedRef.current = false;
      ctx.revert();
      scrollTriggerInstanceRef.current = null;
    };
  }, [triggerRef]);

  const scrollToChapter = useCallback((targetChapter: ExperienceChapter) => {
    const trigger = scrollTriggerInstanceRef.current;
    if (!trigger) return;

    const targetProgress = targetChapter.scrollRange.start;
    const scrollStart = trigger.start;
    const scrollEnd = trigger.end;
    const scrollDist = scrollEnd - scrollStart;

    const targetScroll = scrollStart + scrollDist * targetProgress;

    window.scrollTo({
      top: targetScroll,
      behavior: 'smooth',
    });
  }, []);

  return {
    progress,
    chapter,
    frameIndex,
    scrollToChapter,
  };
}
export default useExperienceProgress;
