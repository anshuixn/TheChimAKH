import { useState, useEffect } from 'react';

export type NetworkTier = 'high' | 'medium' | 'low';

interface NetworkInformation extends EventTarget {
  readonly effectiveType: '2g' | '3g' | '4g' | 'slow-2g';
  readonly saveData: boolean;
  onchange: ((this: NetworkInformation, ev: Event) => unknown) | null;
}

export function useNetworkCapability(): NetworkTier {
  const [tier, setTier] = useState<NetworkTier>(() => {
    if (typeof navigator === 'undefined') return 'high';
    const connection = (navigator as unknown as { connection?: NetworkInformation }).connection;
    if (!connection) return 'high';
    if (connection.saveData) return 'low';
    if (connection.effectiveType === '2g' || connection.effectiveType === 'slow-2g') return 'low';
    if (connection.effectiveType === '3g') return 'medium';
    return 'high';
  });

  useEffect(() => {
    if (typeof navigator === 'undefined') return;
    const connection = (navigator as unknown as { connection?: NetworkInformation }).connection;
    if (!connection) return;

    function updateConnectionStatus() {
      if (!connection) return;
      if (connection.saveData) {
        setTier('low');
        return;
      }
      switch (connection.effectiveType) {
        case 'slow-2g':
        case '2g':
          setTier('low');
          break;
        case '3g':
          setTier('medium');
          break;
        case '4g':
        default:
          setTier('high');
          break;
      }
    }

    const hasAddListener = typeof connection.addEventListener === 'function';
    if (hasAddListener) {
      connection.addEventListener('change', updateConnectionStatus);
    } else if ('onchange' in connection) {
      (connection as unknown as { onchange: () => void }).onchange = updateConnectionStatus;
    }

    return () => {
      if (hasAddListener) {
        connection.removeEventListener('change', updateConnectionStatus);
      } else if ('onchange' in connection) {
        (connection as unknown as { onchange: null }).onchange = null;
      }
    };
  }, []);

  return tier;
}
