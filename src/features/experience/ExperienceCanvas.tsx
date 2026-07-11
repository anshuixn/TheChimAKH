import React, { useRef, useEffect } from 'react';
import { useCanvasSizing } from './useCanvasSizing';
import { renderFrame } from './frameRenderer';
import type { ProximityFrameCache } from './frameCache';
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
  
  const lastRenderedIndexRef = useRef<number>(-1);
  const lastDimensionsRef = useRef<{ w: number; h: number }>({ w: 0, h: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId: number;

    const draw = () => {
      const dpr = Math.min(2.0, window.devicePixelRatio || 1.0);
      const canvasWidth = dimensions.width * dpr;
      const canvasHeight = dimensions.height * dpr;

      // Check if we actually need to render (index changed or dimensions changed)
      const indexChanged = currentIndex !== lastRenderedIndexRef.current;
      const sizeChanged = 
        canvasWidth !== lastDimensionsRef.current.w || 
        canvasHeight !== lastDimensionsRef.current.h;

      if (!indexChanged && !sizeChanged) {
        rafId = requestAnimationFrame(draw);
        return;
      }

      // Try to get desired frame from cache
      let frame = cache.get(currentIndex);
      let renderedIndex = currentIndex;

      // Frame failure recovery policy:
      // If desired frame is not loaded, look for nearest loaded frame
      if (!frame) {
        let found = false;
        
        // 1. Look for nearest loaded previous frame
        for (let i = currentIndex - 1; i >= 1; i--) {
          if (cache.has(i)) {
            frame = cache.get(i);
            renderedIndex = i;
            found = true;
            break;
          }
        }

        // 2. If no previous, look for nearest loaded next frame
        if (!found) {
          for (let i = currentIndex + 1; i <= totalFrames; i++) {
            if (cache.has(i)) {
              frame = cache.get(i);
              renderedIndex = i;
              break;
            }
          }
        }
      }

      if (frame) {
        // Clear canvas and draw
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        renderFrame(ctx, frame, canvas.width, canvas.height);
        
        // Track actually drawn index and size
        lastRenderedIndexRef.current = renderedIndex;
        lastDimensionsRef.current = { w: canvas.width, h: canvas.height };
      }

      rafId = requestAnimationFrame(draw);
    };

    rafId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [currentIndex, cache, dimensions, totalFrames]);

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
