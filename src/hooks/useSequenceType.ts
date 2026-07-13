import { useState } from 'react';

export type SequenceType = 'desktop' | 'mobile';

/**
 * Determines whether to load the mobile or desktop cinematic sequence.
 * Latches the value on initial render to prevent massive network/RAM reloading
 * if the user resizes or rotates their device mid-experience.
 */
export function useSequenceType(): SequenceType {
  const [type] = useState<SequenceType>(() => {
    if (typeof window !== 'undefined') {
      // 768px is the standard mobile/tablet portrait breakpoint
      return window.innerWidth <= 768 ? 'mobile' : 'desktop';
    }
    return 'desktop';
  });

  return type;
}
