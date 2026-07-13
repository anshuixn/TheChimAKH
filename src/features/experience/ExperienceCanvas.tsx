import React, { useRef, useEffect, useCallback } from 'react';
import { useCanvasSizing } from './useCanvasSizing';
import { renderFrame } from './frameRenderer';
import type { ProximityFrameCache } from './frameCache';
import type { DecodedFrame } from './frameLoader';
import styles from './ExperienceCanvas.module.css';

interface ExperienceCanvasProps {
  currentIndex: number; // 1-indexed requested frame
  cache: ProximityFrameCache;
  totalFrames: number;
}

export const ExperienceCanvas: React.FC<ExperienceCanvasProps> = ({
  currentIndex,
  cache,
  totalFrames,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const dimensions = useCanvasSizing(containerRef, canvasRef);

  // Track last successfully drawn state so we NEVER show a black canvas
  const lastGoodFrameRef = useRef<DecodedFrame | null>(null);
  const lastRenderedIndexRef = useRef<number>(-1);
  const lastDimensionsRef = useRef<{ w: number; h: number }>({ w: 0, h: 0 });

  // Demand-driven RAF — only fires when index or dimensions change
  const rafIdRef = useRef<number>(0);

  const scheduleRender = useCallback(() => {
    if (rafIdRef.current) return; // already queued for this frame
    rafIdRef.current = requestAnimationFrame(() => {
      rafIdRef.current = 0;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      if (typeof currentIndex !== 'number' || isNaN(currentIndex)) return;

      const sizeChanged =
        canvas.width !== lastDimensionsRef.current.w ||
        canvas.height !== lastDimensionsRef.current.h;
      const indexChanged = currentIndex !== lastRenderedIndexRef.current;

      if (!indexChanged && !sizeChanged) return;

      // --- Frame resolution waterfall ---
      let frame: DecodedFrame | null = cache.get(currentIndex);
      let renderedIndex = currentIndex;

      // 1. Search backward (covers forward-scroll gap)
      if (!frame) {
        for (let i = currentIndex - 1; i >= 1; i--) {
          if (cache.has(i)) {
            frame = cache.get(i);
            renderedIndex = i;
            break;
          }
        }
      }

      // 2. Search forward
      if (!frame) {
        for (let i = currentIndex + 1; i <= totalFrames; i++) {
          if (cache.has(i)) {
            frame = cache.get(i);
            renderedIndex = i;
            break;
          }
        }
      }

      // 3. Ultimate fallback: last known-good frame → never show black
      if (!frame && lastGoodFrameRef.current) {
        frame = lastGoodFrameRef.current;
        renderedIndex = lastRenderedIndexRef.current;
      }

      if (frame) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Only clear immediately before a successful draw to prevent flash
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        renderFrame(ctx, frame, canvas.width, canvas.height);

        lastGoodFrameRef.current = frame;
        lastRenderedIndexRef.current = renderedIndex;
        lastDimensionsRef.current = { w: canvas.width, h: canvas.height };
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, cache, totalFrames, dimensions]);

  useEffect(() => {
    scheduleRender();
    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = 0;
      }
    };
  }, [scheduleRender]);

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
