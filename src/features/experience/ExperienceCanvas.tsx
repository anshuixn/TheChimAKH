import React, { useRef, useEffect, useCallback } from 'react';
import { useCanvasSizing } from './useCanvasSizing';
import { renderFrame } from './frameRenderer';
import type { ProximityFrameCache } from './frameCache';
import type { DecodedFrame } from './frameLoader';
import styles from './ExperienceCanvas.module.css';

// Brand fill color used only on true cold start (no frame ever loaded)
const FILL_COLOR = '#0C0A09';

interface ExperienceCanvasProps {
  currentIndex: number; // React-state frame index (used to re-trigger useEffect)
  currentIndexRef: React.RefObject<number>; // Hot-path ref: read at RAF time, never stale
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

  // ─── Render state refs ────────────────────────────────────────────────────
  //
  // lastGoodFrameRef: the last bitmap successfully drawn to the canvas.
  // This frame is PINNED in the cache (cache.pin) so that evictEntry() never
  // calls ImageBitmap.close() on it while we still hold a live reference.
  // Calling close() on a referenced ImageBitmap silently makes ctx.drawImage()
  // a no-op — the single root cause of "black frames that appear briefly then
  // recover" during fast scroll.
  const lastGoodFrameRef = useRef<DecodedFrame | null>(null);
  const lastGoodIndexRef = useRef<number>(-1);
  const lastDimensionsRef = useRef<{ w: number; h: number }>({ w: 0, h: 0 });

  // ─── Cache pin management ─────────────────────────────────────────────────
  /**
   * Adopt a new "last good frame": unpin the previous one (allowing eviction)
   * and pin the new one (protecting it from GPU-close while we reference it).
   */
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

  // ─── Synchronous repaint on canvas resize ─────────────────────────────────
  const onCanvasResized = useCallback(
    (canvas: HTMLCanvasElement) => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.fillStyle = FILL_COLOR;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      const frame = lastGoodFrameRef.current;
      if (frame) {
        renderFrame(ctx, frame, canvas.width, canvas.height);
      }
      lastDimensionsRef.current = { w: canvas.width, h: canvas.height };
    },
    [],
  );

  const dimensions = useCanvasSizing(containerRef, canvasRef, onCanvasResized);

  // ─── RAF-gated draw loop ──────────────────────────────────────────────────
  const rafIdRef = useRef<number>(0);

  const scheduleRender = useCallback(() => {
    if (rafIdRef.current) return;
    rafIdRef.current = requestAnimationFrame(() => {
      rafIdRef.current = 0;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // ── Read from the hot-path ref, not the closed-over prop ────────────
      // currentIndexRef.current is updated synchronously by GSAP onUpdate
      // on every RAF tick — it always reflects the true current scroll position.
      // The closed-over `currentIndex` prop may be 1-2 React render cycles
      // behind during a fast fling due to setState batching.
      const target = currentIndexRef.current ?? currentIndex;
      if (typeof target !== 'number' || isNaN(target)) return;

      const sizeChanged =
        canvas.width !== lastDimensionsRef.current.w ||
        canvas.height !== lastDimensionsRef.current.h;
      const indexChanged = target !== lastGoodIndexRef.current;

      if (!indexChanged && !sizeChanged) return;

      // ── Frame resolution priority waterfall ──────────────────────────────
      //
      // Priority A: exact target frame
      let frame: DecodedFrame | null = cache.get(target);
      let resolvedIndex = target;

      // Priority B: nearest cached frame within ±10 of target
      // Narrow window: avoids showing a frame that is visually jarring
      if (!frame) {
        const WINDOW = 10;
        // Backward first: during forward scroll the preloader lags slightly behind
        for (let delta = 1; delta <= WINDOW; delta++) {
          const prev = target - delta;
          if (prev >= 1 && cache.has(prev)) {
            frame = cache.get(prev);
            resolvedIndex = prev;
            break;
          }
        }
        // Forward if backward didn't find anything
        if (!frame) {
          for (let delta = 1; delta <= WINDOW; delta++) {
            const next = target + delta;
            if (next <= totalFrames && cache.has(next)) {
              frame = cache.get(next);
              resolvedIndex = next;
              break;
            }
          }
        }
      }

      // Priority C: hold the last real frame ever drawn
      // This is the "never-go-blank" guarantee — if both A and B fail (e.g. the
      // cache momentarily has a gap wider than 10 frames), the user sees the last
      // frame frozen in place rather than a black flash.
      const usingFallback = !frame;
      if (!frame && lastGoodFrameRef.current) {
        frame = lastGoodFrameRef.current;
        resolvedIndex = lastGoodIndexRef.current;
      }

      // ── Paint ─────────────────────────────────────────────────────────────
      if (frame) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.fillStyle = FILL_COLOR;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        renderFrame(ctx, frame, canvas.width, canvas.height);

        // Only advance lastGoodFrame when we drew the EXACT target.
        // If we drew a Priority B or C fallback, keep retrying exact target
        // on subsequent RAFs — important for the preloader catch-up case.
        if (!usingFallback && resolvedIndex === target) {
          adoptLastGoodFrame(frame, resolvedIndex);
        }
        lastDimensionsRef.current = { w: canvas.width, h: canvas.height };
      } else {
        // True cold start: nothing ever drawn yet — fill brand color
        ctx.fillStyle = FILL_COLOR;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    });
  // currentIndex (prop) in deps triggers useEffect re-run on React state changes,
  // ensuring RAF is scheduled. Hot-path reads currentIndexRef at paint time.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cache, totalFrames, dimensions, adoptLastGoodFrame, currentIndexRef]);

  useEffect(() => {
    scheduleRender();
    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = 0;
      }
    };
  }, [scheduleRender, currentIndex]); // currentIndex re-triggers on React render cycle

  // Unpin on unmount to avoid permanent cache pin leak
  useEffect(() => {
    return () => {
      if (lastGoodIndexRef.current !== -1) {
        cache.unpin(lastGoodIndexRef.current);
      }
    };
  }, [cache]);

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
