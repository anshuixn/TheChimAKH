import { useState, useEffect } from 'react';
import { useNetworkCapability } from './useNetworkCapability';

export type DeviceTier = 'full' | 'lite' | 'static';

export function useDeviceCapability(): DeviceTier {
  const networkTier = useNetworkCapability();
  const [tier, setTier] = useState<DeviceTier>('full');

  useEffect(() => {
    function evaluateCapability() {
      // 1. Reduced motion preference (UX/Product policy)
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReducedMotion) {
        setTier('static');
        return;
      }

      // 2. Save Data active (Product policy)
      const connection = (navigator as unknown as { connection?: { saveData?: boolean } }).connection;
      if (connection?.saveData === true) {
        setTier('static');
        return;
      }

      // 3. Canvas 2D Support Check (Technical requirement)
      const canvas = typeof document !== 'undefined' ? document.createElement('canvas') : null;
      const hasCanvas2d = !!(canvas?.getContext && canvas.getContext('2d'));
      if (!hasCanvas2d) {
        setTier('static');
        return;
      }

      // 4. Network-based tier selection (Load-time policy)
      if (networkTier === 'low') {
        setTier('static');
        return;
      }

      if (networkTier === 'medium') {
        setTier('lite');
        return;
      }

      setTier('full');
    }

    evaluateCapability();

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
