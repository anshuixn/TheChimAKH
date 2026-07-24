import React, { useRef, useEffect, useCallback } from 'react';
import { useCanvasSizing } from './useCanvasSizing';
import { renderFrame } from './frameRenderer';
import type { ProximityFrameCache } from './frameCache';
import type { DecodedFrame } from './frameLoader';
import styles from './ExperienceCanvas.module.css';

const FILL_COLOR = '#0C0A09';

interface ExperienceCanvasProps {
  currentIndex: number; // React-state index — used only to re-trigger useEffect
  currentIndexRef: React.RefObject<number>; // Hot-path ref — read at RAF paint time
  cache: ProximityFrameCache;
  totalFrames: number;
}

export const ExperienceCanvas: React.FC<ExperienceCanvasProps> = ({
  currentIndex,
  currentIndexRef,
  cache,
  totalFrames,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const lastGoodFrameRef = useRef<DecodedFrame | null>(null);
  const lastGoodIndexRef = useRef<number>(-1);
  const lastDimensionsRef = useRef<{ w: number; h: number }>({ w: 0, h: 0 });

  const adoptLastGoodFrame = useCallback(
    (frame: DecodedFrame, index: number) => {
      const oldIndex = lastGoodIndexRef.current;
      if (oldIndex !== -1 && oldIndex !== index) {
        cache.unpin(oldIndex);
      }
      cache.pin(index);
      lastGoodFrameRef.current = frame;
      lastGoodIndexRef.current = index;
    },
    [cache],
  );

  const onCanvasResized = useCallback((canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = FILL_COLOR;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const frame = lastGoodFrameRef.current;
    if (frame) renderFrame(ctx, frame, canvas.width, canvas.height);
    lastDimensionsRef.current = { w: canvas.width, h: canvas.height };
  }, []);

  const dimensions = useCanvasSizing(containerRef, canvasRef, onCanvasResized);

  // ── Single persistent RAF loop ─────────────────────────────────────────────
  //
  // KEY FIX: instead of scheduling one-shot RAFs (which get cancelled and
  // rescheduled on every React re-render), we run ONE persistent rAF loop that
  // reads the hot-path ref on every tick. This means:
  //   - Zero RAF cancellation/rescheduling overhead
  //   - Zero React re-render interference with the paint cycle
  //   - The canvas always paints on the NEXT frame boundary after a scroll event,
  //     regardless of when React decides to flush its render queue
  const rafIdRef = useRef<number>(0);
  // Dirty flag: set to true when scroll position changed since last paint.
  // The RAF loop checks this and skips the drawImage call if nothing changed.
  const dirtyRef = useRef(true);

  // Keep stable refs to avoid re-starting the RAF loop on every render
  const cacheRef = useRef(cache);
  const totalFramesRef = useRef(totalFrames);
  const adoptRef = useRef(adoptLastGoodFrame);
  useEffect(() => { cacheRef.current = cache; }, [cache]);
  useEffect(() => { totalFramesRef.current = totalFrames; }, [totalFrames]);
  useEffect(() => { adoptRef.current = adoptLastGoodFrame; }, [adoptLastGoodFrame]);

  // Mark dirty whenever the React-state index changes (belt-and-suspenders alongside hot ref)
  useEffect(() => {
    dirtyRef.current = true;
  }, [currentIndex, dimensions]);

  // Start the persistent RAF loop once on mount, stop it on unmount
  useEffect(() => {
    const paint = () => {
      rafIdRef.current = requestAnimationFrame(paint);

      const canvas = canvasRef.current;
      if (!canvas) return;

      const w = canvas.width;
      const h = canvas.height;
      if (w === 0 || h === 0) return;

      // Read latest index from hot-path ref — always current even mid-fling
      const target = currentIndexRef.current;
      if (typeof target !== 'number' || isNaN(target)) return;

      const sizeChanged = w !== lastDimensionsRef.current.w || h !== lastDimensionsRef.current.h;
      const indexChanged = target !== lastGoodIndexRef.current;

      // Skip paint if nothing changed — saves ~0.3ms of GPU work per idle frame
      if (!dirtyRef.current && !sizeChanged && !indexChanged) return;
      dirtyRef.current = false;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // ── Frame resolution waterfall ─────────────────────────────────────────
      const c = cacheRef.current;
      const tf = totalFramesRef.current;

      // A: exact target
      let frame: DecodedFrame | null = c.get(target);
      let resolvedIndex = target;

      // B: nearest within ±10
      if (!frame) {
        const WINDOW = 10;
        for (let d = 1; d <= WINDOW; d++) {
          const prev = target - d;
          if (prev >= 1 && c.has(prev)) { frame = c.get(prev); resolvedIndex = prev; break; }
        }
        if (!frame) {
          for (let d = 1; d <= WINDOW; d++) {
            const next = target + d;
            if (next <= tf && c.has(next)) { frame = c.get(next); resolvedIndex = next; break; }
          }
        }
      }

      // C: hold last good (never go blank)
      const usingFallback = !frame;
      if (!frame && lastGoodFrameRef.current) {
        frame = lastGoodFrameRef.current;
        resolvedIndex = lastGoodIndexRef.current;
      }

      // ── Paint ──────────────────────────────────────────────────────────────
      if (frame) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.fillStyle = FILL_COLOR;
        ctx.fillRect(0, 0, w, h);
        renderFrame(ctx, frame, w, h);
        if (!usingFallback && resolvedIndex === target) {
          adoptRef.current(frame, resolvedIndex);
        }
        lastDimensionsRef.current = { w, h };
      } else {
        ctx.fillStyle = FILL_COLOR;
        ctx.fillRect(0, 0, w, h);
      }
    };

    rafIdRef.current = requestAnimationFrame(paint);
    return () => {
      cancelAnimationFrame(rafIdRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps: loop starts once, reads everything through refs

  // Unpin on unmount
  useEffect(() => {
    return () => {
      if (lastGoodIndexRef.current !== -1) {
        cacheRef.current.unpin(lastGoodIndexRef.current);
      }
    };
  }, []);

  return (
    <div
      className={styles.canvasContainer}
      ref={containerRef}
      role="img"
      aria-label="Cinematic animated frame sequence showcasing brick manufacturing"
    >
      <canvas ref={canvasRef} className={styles.canvasElement} />
    </div>
  );
};

export default ExperienceCanvas;
