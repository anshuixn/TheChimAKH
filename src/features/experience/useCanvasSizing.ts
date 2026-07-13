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
  const firstResizeRef = useRef(true);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const applySizing = (width: number, height: number) => {
      const dpr = Math.min(2.0, window.devicePixelRatio || 1.0);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${String(width)}px`;
      canvas.style.height = `${String(height)}px`;
      setDimensions({ width, height });
    };

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0] as ResizeObserverEntry | undefined;
      if (!entry) return;

      const width = entry.contentRect.width;
      const height = entry.contentRect.height;

      if (firstResizeRef.current) {
        // Apply immediately on first observation — eliminates blank first frame
        firstResizeRef.current = false;
        applySizing(width, height);
        return;
      }

      // Debounce subsequent resize events (50ms is enough to avoid thrash)
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = window.setTimeout(() => {
        applySizing(width, height);
      }, 50);
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
