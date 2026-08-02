import { useEffect, useRef, useState } from 'react';

export interface CanvasDimensions {
  width: number;
  height: number;
}

export function useCanvasSizing(
  containerRef: React.RefObject<HTMLDivElement | null>,
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  onResized?: (canvas: HTMLCanvasElement) => void,
): CanvasDimensions {
  const [dimensions, setDimensions] = useState<CanvasDimensions>({ width: 0, height: 0 });
  const timeoutRef = useRef<number | null>(null);
  const firstResizeRef = useRef(true);
  // Track the last applied physical pixel dimensions to skip no-op resizes.
  // This is the CRITICAL guard: on iOS Safari, the URL bar hides/shows during scroll,
  // causing the ResizeObserver to fire repeatedly even though the canvas content area
  // hasn't actually changed. Without this guard, canvas.width = sameValue runs on every
  // scroll start/end, which CLEARS the canvas to transparent black each time.
  const lastAppliedRef = useRef<{ w: number; h: number; cssW: number; cssH: number }>({
    w: 0, h: 0, cssW: 0, cssH: 0,
  });

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const applySizing = (cssWidth: number, cssHeight: number) => {
      const dpr = window.devicePixelRatio || 1.0;
      // Use Math.round to avoid sub-pixel rounding differences between ticks
      const physW = Math.round(cssWidth * dpr);
      const physH = Math.round(cssHeight * dpr);

      // ── KEY GUARD ──────────────────────────────────────────────────────────
      // Assigning canvas.width or canvas.height — even to the same value —
      // erases all canvas pixels to transparent (black on dark backgrounds).
      // On iOS Safari, this fires on every scroll start because the URL bar
      // hide/show changes the viewport height, even by just 1px.
      //
      // We skip the resize if BOTH physical AND css dimensions are unchanged.
      const last = lastAppliedRef.current;
      if (physW === last.w && physH === last.h && cssWidth === last.cssW && cssHeight === last.cssH) {
        return; // Truly no change — skip canvas clear entirely
      }

      lastAppliedRef.current = { w: physW, h: physH, cssW: cssWidth, cssH: cssHeight };

      // Only set canvas.style.width/height if CSS dimensions changed (avoids layout thrash)
      if (cssWidth !== last.cssW || cssHeight !== last.cssH) {
        canvas.style.width = `${String(cssWidth)}px`;
        canvas.style.height = `${String(cssHeight)}px`;
      }

      // Only set canvas.width/height (which CLEARS the canvas) if physical dimensions changed
      if (physW !== last.w || physH !== last.h) {
        canvas.width = physW;
        canvas.height = physH;
        // Synchronously repaint after the clear so the canvas never shows blank to the compositor
        if (onResized) {
          onResized(canvas);
        }
        setDimensions({ width: cssWidth, height: cssHeight });
      }
    };

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0] as ResizeObserverEntry | undefined;
      if (!entry) return;

      // Prefer devicePixelContentBoxSize (physical pixels) if available — avoids
      // double DPR multiplication on browsers that support it.
      let cssWidth: number;
      let cssHeight: number;

      if (entry.devicePixelContentBoxSize.length > 0) {
        // This gives us physical pixels directly — no DPR needed
        // We still store as CSS px for setDimensions (UI layout uses CSS px)
        const dpr = window.devicePixelRatio || 1.0;
        const physW = entry.devicePixelContentBoxSize[0].inlineSize;
        const physH = entry.devicePixelContentBoxSize[0].blockSize;
        cssWidth = physW / dpr;
        cssHeight = physH / dpr;
      } else {
        cssWidth = entry.contentRect.width;
        cssHeight = entry.contentRect.height;
      }

      if (firstResizeRef.current) {
        // Apply immediately on first observation — eliminates blank first frame
        firstResizeRef.current = false;
        applySizing(cssWidth, cssHeight);
        return;
      }

      // Debounce subsequent resizes — true layout changes (orientation flip, window resize)
      // should still be applied; iOS URL bar hide/show will be caught by the guard above.
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = window.setTimeout(() => {
        applySizing(cssWidth, cssHeight);
      }, 100); // 100ms: long enough to batch URL-bar jitter, short enough to feel instant
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerRef, canvasRef]);

  return dimensions;
}
export default useCanvasSizing;
