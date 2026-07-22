import React, { useRef, useEffect, useCallback } from 'react';
import { useCanvasSizing } from './useCanvasSizing';
import { renderFrame } from './frameRenderer';
import type { ProximityFrameCache } from './frameCache';
import type { DecodedFrame } from './frameLoader';
import styles from './ExperienceCanvas.module.css';

// Brand fill color used when a frame isn't available yet — never pure black
const FILL_COLOR = '#0C0A09';

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

  // Track last successfully drawn state so we NEVER show a black canvas
  const lastGoodFrameRef = useRef<DecodedFrame | null>(null);
  const lastRenderedIndexRef = useRef<number>(-1);
  const lastDimensionsRef = useRef<{ w: number; h: number }>({ w: 0, h: 0 });

  /**
   * Synchronous repaint of the last known-good frame.
   * Called immediately after canvas dimensions are reset (which wipes the canvas)
   * so the user never sees a black flash between resize and the next React render.
   */
  const onCanvasResized = useCallback((canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    // Always fill with brand color first — never show browser-default transparent/black
    ctx.fillStyle = FILL_COLOR;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const frame = lastGoodFrameRef.current;
    if (frame) {
      renderFrame(ctx, frame, canvas.width, canvas.height);
    }
    lastDimensionsRef.current = { w: canvas.width, h: canvas.height };
  }, []);

  const dimensions = useCanvasSizing(containerRef, canvasRef, onCanvasResized);

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

        // Fill brand color then draw frame — never show transparent/black canvas
        ctx.fillStyle = FILL_COLOR;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        renderFrame(ctx, frame, canvas.width, canvas.height);

        lastGoodFrameRef.current = frame;
        lastRenderedIndexRef.current = renderedIndex;
        lastDimensionsRef.current = { w: canvas.width, h: canvas.height };
      } else {
        // No frame found at all — fill brand color so it's never black
        ctx.fillStyle = FILL_COLOR;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
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
