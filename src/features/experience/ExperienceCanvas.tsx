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
  // true after at least one frame has been successfully drawn — gate for the cold-start fillRect
  const everDrawnRef = useRef(false);

  const adoptLastGoodFrame = useCallback(
    (frame: DecodedFrame, index: number) => {
      const oldIndex = lastGoodIndexRef.current;
      if (oldIndex !== -1 && oldIndex !== index) cache.unpin(oldIndex);
      cache.pin(index);
      lastGoodFrameRef.current = frame;
      lastGoodIndexRef.current = index;
    },
    [cache],
  );

  const onCanvasResized = useCallback((canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const frame = lastGoodFrameRef.current;
    if (frame) {
      // Repaint last good frame directly — no fillRect, no black flash
      renderFrame(ctx, frame, canvas.width, canvas.height);
    } else {
      // True cold start: no frame ever drawn yet, fill brand color
      ctx.fillStyle = FILL_COLOR;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    lastDimensionsRef.current = { w: canvas.width, h: canvas.height };
  }, []);

  const dimensions = useCanvasSizing(containerRef, canvasRef, onCanvasResized);

  const rafIdRef = useRef<number>(0);
  const dirtyRef = useRef(true);

  const cacheRef = useRef(cache);
  const totalFramesRef = useRef(totalFrames);
  const adoptRef = useRef(adoptLastGoodFrame);
  useEffect(() => { cacheRef.current = cache; }, [cache]);
  useEffect(() => { totalFramesRef.current = totalFrames; }, [totalFrames]);
  useEffect(() => { adoptRef.current = adoptLastGoodFrame; }, [adoptLastGoodFrame]);

  useEffect(() => { dirtyRef.current = true; }, [currentIndex, dimensions]);

  useEffect(() => {
    const paint = () => {
      rafIdRef.current = requestAnimationFrame(paint);

      const canvas = canvasRef.current;
      if (!canvas) return;
      const w = canvas.width;
      const h = canvas.height;
      if (w === 0 || h === 0) return;

      const target = currentIndexRef.current;
      if (typeof target !== 'number' || isNaN(target)) return;

      const sizeChanged = w !== lastDimensionsRef.current.w || h !== lastDimensionsRef.current.h;
      const indexChanged = target !== lastGoodIndexRef.current;
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

      // B: nearest cached within ±10 (covers preloader lag during fast scroll)
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

      // C: hold last good frame — never go blank if we've ever drawn anything
      const usingFallback = !frame;
      if (!frame && lastGoodFrameRef.current) {
        frame = lastGoodFrameRef.current;
        resolvedIndex = lastGoodIndexRef.current;
      }

      // ── Paint ──────────────────────────────────────────────────────────────
      if (frame) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // KEY FIX: do NOT fillRect before drawImage.
        //
        // JPEG frames are 100% opaque — drawImage paints every destination pixel.
        // There is NO need to clear the canvas before drawing.
        //
        // Why this matters on iOS Safari:
        //   - `will-change` creates a GPU compositor layer for the canvas.
        //   - CPU-side JS operations (fillRect, drawImage) are synchronous, but
        //     the GPU texture upload is NOT — it happens between compositor frames.
        //   - If we fillRect first, the GPU can snapshot the canvas mid-upload
        //     (after fillRect, before drawImage completes the GPU upload),
        //     showing one brief brand-color (dark/black) frame to the user.
        //   - By skipping fillRect, the GPU always sees either the old frame
        //     (stale snapshot) or the new frame (updated snapshot) — never brand color.
        //
        // For the cold-start case (no frame ever drawn), we fill once below.
        if (!everDrawnRef.current) {
          // Cold start: first paint ever — fill brand color THEN draw frame
          ctx.fillStyle = FILL_COLOR;
          ctx.fillRect(0, 0, w, h);
          everDrawnRef.current = true;
        }

        renderFrame(ctx, frame, w, h);

        if (!usingFallback && resolvedIndex === target) {
          adoptRef.current(frame, resolvedIndex);
        }
        lastDimensionsRef.current = { w, h };
      } else if (!everDrawnRef.current) {
        // True cold start: nothing in cache yet — fill brand color once
        ctx.fillStyle = FILL_COLOR;
        ctx.fillRect(0, 0, w, h);
      }
      // If frame is null but everDrawnRef is true, do nothing —
      // the canvas already shows the last good frame. No action is better than black.
    };

    rafIdRef.current = requestAnimationFrame(paint);
    return () => { cancelAnimationFrame(rafIdRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
