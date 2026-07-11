import { useEffect, useRef, useState } from 'react';

export interface CanvasDimensions {
  width: number;
  height: number;
}

export function useCanvasSizing(
  containerRef: React.RefObject<HTMLDivElement | null>,
  canvasRef: React.RefObject<HTMLCanvasElement | null>
): CanvasDimensions {
  const [dimensions, setDimensions] = useState<CanvasDimensions>({ width: 0, height: 0 });
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0] as ResizeObserverEntry | undefined;
      if (!entry) return;

      // Extract width/height from borderBoxSize or contentRect (avoiding layout thrashing)
      const width = entry.contentRect.width;
      const height = entry.contentRect.height;

      // Debounce canvas dimension adjustments to avoid lag on drag
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = window.setTimeout(() => {
        const dpr = Math.min(2.0, window.devicePixelRatio || 1.0);
        
        // DPR scaled inner coordinates
        canvas.width = width * dpr;
        canvas.height = height * dpr;

        // Visual CSS size matches container exactly
        canvas.style.width = `${String(width)}px`;
        canvas.style.height = `${String(height)}px`;

        setDimensions({ width, height });
      }, 100);
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, [containerRef, canvasRef]);

  return dimensions;
}
export default useCanvasSizing;
