import { useEffect, useState, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { getChapterAndFrameForProgress, EXPERIENCE_CHAPTERS } from './experience.config';
import type { ExperienceChapter } from './experience.config';

gsap.registerPlugin(ScrollTrigger);

interface ProgressHookOptions {
  triggerRef: React.RefObject<HTMLDivElement | null>;
}

export function useExperienceProgress({ triggerRef }: ProgressHookOptions) {
  const [progress, setProgress] = useState(0);
  const [chapter, setChapter] = useState<ExperienceChapter>(EXPERIENCE_CHAPTERS[0]);
  const [frameIndex, setFrameIndex] = useState(1);

  // Store trigger settings as refs to programmatic jump/scrolling
  const scrollTriggerInstanceRef = useRef<globalThis.ScrollTrigger | null>(null);

  useEffect(() => {
    const triggerElement = triggerRef.current;
    if (!triggerElement) return;

    // Use GSAP Context for easy React cleanup
    const ctx = gsap.context(() => {
      scrollTriggerInstanceRef.current = ScrollTrigger.create({
        trigger: triggerElement,
        start: 'top top',
        end: '+=400%', // 4x screen height of scrolling space
        pin: true,
        scrub: true,
        onUpdate: (self) => {
          const rawProgress = self.progress;
          const clamped = Math.max(0, Math.min(1, rawProgress));
          
          const { chapter: ch, frameIndex: fIndex } = getChapterAndFrameForProgress(clamped);

          setProgress(clamped);
          setChapter(ch);
          setFrameIndex(fIndex);
        },
      });
    });

    return () => {
      ctx.revert(); // Reverts all GSAP animations and kills ScrollTriggers
      scrollTriggerInstanceRef.current = null;
    };
  }, [triggerRef]);

  /**
   * Jumps to a specific chapter scroll range start position.
   */
  const scrollToChapter = (targetChapter: ExperienceChapter) => {
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
  };

  return {
    progress,
    chapter,
    frameIndex,
    scrollToChapter,
  };
}
export default useExperienceProgress;
