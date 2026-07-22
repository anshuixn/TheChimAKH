import { useEffect, useMemo, useRef, useState } from 'react';
import { loadFrame } from './frameLoader';
import { ProximityFrameCache } from './frameCache';
import { EXPERIENCE_CHAPTERS } from './experience.config';
import { useNetworkCapability } from './useNetworkCapability';
import { useDeviceCapability } from './useDeviceCapability';

interface PreloaderOptions {
  frameUrls: string[];
  currentIndex: number; // 1-indexed current frame
  onFrameLoaded: (index: number) => void;
  maxCacheSize?: number;
}

export function useFramePreloader({
  frameUrls,
  currentIndex,
  onFrameLoaded,
  maxCacheSize = 80,
}: PreloaderOptions) {
  const networkTier = useNetworkCapability();
  const deviceTier = useDeviceCapability();
  
  const activeRequestsRef = useRef<Map<number, AbortController>>(new Map());
  const [loadedCount, setLoadedCount] = useState(0);

  // Initialize the cache once
  const cache = useMemo(() => new ProximityFrameCache(maxCacheSize), [maxCacheSize]);

  // Determine window size based on capabilities (number of future frames to preload)
  // Mobile requires a much larger window since frames are loaded while scrolling
  let preloadWindow = 40;
  if (deviceTier === 'lite' || networkTier === 'medium') {
    preloadWindow = 25;
  } else if (deviceTier === 'static' || networkTier === 'low') {
    preloadWindow = 12;
  }

  useEffect(() => {
    // 1. Establish priorities for preloading
    const getLoadPriorities = (): number[] => {
      const priorities: number[] = [];

      // Priority 1: Current frame
      if (!cache.has(currentIndex)) {
        priorities.push(currentIndex);
      }

      // Priority 2: Immediate future frames
      for (let i = 1; i <= preloadWindow; i++) {
        const idx = currentIndex + i;
        if (idx <= frameUrls.length && !cache.has(idx)) {
          priorities.push(idx);
        }
      }

      // Priority 3: Immediate previous frames (buffer backward for reverse scroll)
      for (let i = 1; i <= 20; i++) {
        const idx = currentIndex - i;
        if (idx >= 1 && !cache.has(idx)) {
          priorities.push(idx);
        }
      }

      // Priority 4: Chapter boundary frames (start frames of each chapter)
      EXPERIENCE_CHAPTERS.forEach((ch) => {
        const startFrame = ch.frameRange.start;
        if (!cache.has(startFrame) && !priorities.includes(startFrame)) {
          priorities.push(startFrame);
        }
      });

      // Priority 5: Rest of the frames, sorted by proximity to currentIndex
      const remaining: { index: number; dist: number }[] = [];
      for (let idx = 1; idx <= frameUrls.length; idx++) {
        if (!cache.has(idx) && !priorities.includes(idx)) {
          remaining.push({ index: idx, dist: Math.abs(idx - currentIndex) });
        }
      }
      remaining.sort((a, b) => a.dist - b.dist);
      remaining.forEach((r) => priorities.push(r.index));

      return priorities;
    };

    // 2. Start preloading the queue
    const loadQueue = () => {
      // Do not load when tab is hidden
      if (typeof document !== 'undefined' && document.hidden) {
        return;
      }

      // Abort active requests that are now too far from current index to yield connection pool slots
      // 60 frame distance: wide enough that reverse scroll doesn't cause re-fetches
      const maxKeepDistance = 60;
      const toAbort: number[] = [];
      activeRequestsRef.current.forEach((_, idx) => {
        if (Math.abs(idx - currentIndex) > maxKeepDistance) {
          toAbort.push(idx);
        }
      });
      toAbort.forEach((idx) => {
        const controller = activeRequestsRef.current.get(idx);
        if (controller) {
          controller.abort();
          activeRequestsRef.current.delete(idx);
        }
      });

      const queue = getLoadPriorities();
      if (queue.length === 0) {
        return;
      }

      // Increased concurrency: more parallel loads = frames ready faster during scroll
      // 12 parallel is safe — browsers limit to ~6-8 per origin so extras queue efficiently
      const maxConcurrent = networkTier === 'high' ? 12 : networkTier === 'medium' ? 8 : 4;
      const batch = queue.slice(0, maxConcurrent);

      batch.forEach((index) => {
        // Skip if already in flight
        if (activeRequestsRef.current.has(index)) return;

        const controller = new AbortController();
        activeRequestsRef.current.set(index, controller);

        const url = frameUrls[index - 1];
        if (!url) {
          activeRequestsRef.current.delete(index);
          return;
        }

        loadFrame(url, controller.signal)
          .then((decodedFrame) => {
            cache.set(index, decodedFrame, currentIndex);
            setLoadedCount((prev) => prev + 1);
            onFrameLoaded(index);
          })
          .catch((err: unknown) => {
            if (err instanceof DOMException && err.name === 'AbortError') {
              // Silence AbortErrors
              return;
            }
            console.error(`[Preloader] Failed to load frame ${String(index)}:`, err);
          })
          .finally(() => {
            activeRequestsRef.current.delete(index);
          });
      });
    };

    loadQueue();

    // 3. Handle visibility change — pause preloading when tab is inactive
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Cancel all active in-flight preloads to yield network
        activeRequestsRef.current.forEach((controller) => { controller.abort(); });
        activeRequestsRef.current.clear();
      } else {
        loadQueue();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [currentIndex, frameUrls, preloadWindow, networkTier, deviceTier, cache, onFrameLoaded]);

  // Clean up all requests and release cache on unmount
  useEffect(() => {
    const activeRequests = activeRequestsRef.current;
    return () => {
      activeRequests.forEach((controller) => { controller.abort(); });
      activeRequests.clear();
      cache.clear();
    };
  }, [cache]);

  return {
    cache,
    loadedCount,
    totalFrames: frameUrls.length,
  };
}
