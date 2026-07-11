import { useState, useEffect } from 'react';
import { useNetworkCapability } from './useNetworkCapability';

export type DeviceTier = 'full' | 'lite' | 'static';

interface NavigatorWithMemory extends Navigator {
  readonly deviceMemory?: number;
}

export function useDeviceCapability(): DeviceTier {
  const networkTier = useNetworkCapability();
  const [tier, setTier] = useState<DeviceTier>('full');

  useEffect(() => {
    function evaluateCapability() {
      // 1. Reduced motion preference
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReducedMotion) {
        setTier('static');
        return;
      }

      // 2. Save Data active
      const connection = (navigator as unknown as { connection?: { saveData?: boolean } }).connection;
      if (connection?.saveData === true) {
        setTier('static');
        return;
      }

      // 3. Viewport width check (Initial mobile strategy: mobile/tablet gets static fallback)
      const width = window.innerWidth;
      if (width < 1024) {
        // Mobile and tablet are forced to static fallback for the initial release
        setTier('static');
        return;
      }

      // 4. Memory and CPU checks
      const memory = (navigator as NavigatorWithMemory).deviceMemory ?? 4;
      const cpus = navigator.hardwareConcurrency;

      if (memory < 2 || cpus < 2 || networkTier === 'low') {
        setTier('static');
        return;
      }

      if (memory < 4 || cpus < 4 || networkTier === 'medium') {
        setTier('lite');
        return;
      }

      setTier('full');
    }

    evaluateCapability();

    // Listen to resize to adapt if screen crosses breakpoints (optional, but clean for rotation)
    const handleResize = () => {
      evaluateCapability();
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [networkTier]);

  return tier;
}
