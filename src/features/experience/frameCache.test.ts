import { describe, test, expect, vi } from 'vitest';
import { ProximityFrameCache } from './frameCache';
import type { DecodedFrame } from './frameLoader';

function createMockFrame(isBitmap = false): DecodedFrame {
  if (isBitmap) {
    return {
      close: vi.fn(),
      width: 100,
      height: 100,
    } as unknown as ImageBitmap;
  }
  return new Image() as HTMLImageElement;
}

describe('ProximityFrameCache', () => {
  test('respects max capacity and evicts furthest frame first', () => {
    const cache = new ProximityFrameCache(3);
    const f1 = createMockFrame();
    const f2 = createMockFrame();
    const f3 = createMockFrame();
    const f4 = createMockFrame();

    // Cache elements at index 10, 11, 12 with currentIndex = 10
    cache.set(10, f1, 10);
    cache.set(11, f2, 10);
    cache.set(12, f3, 10);
    expect(cache.size).toBe(3);

    // Set frame 13 with currentIndex = 10
    // Index 12 is distance 2, Index 11 is distance 1, Index 10 is distance 0.
    // Furthest is Index 12, so it should be evicted.
    cache.set(13, f4, 10);
    expect(cache.size).toBe(3);
    expect(cache.has(12)).toBe(false); // evicted
    expect(cache.has(10)).toBe(true);
    expect(cache.has(11)).toBe(true);
    expect(cache.has(13)).toBe(true);
  });

  test('uses least recently accessed as secondary tie-breaker', () => {
    const cache = new ProximityFrameCache(3);
    const f1 = createMockFrame();
    const f2 = createMockFrame();
    const f3 = createMockFrame();
    const f4 = createMockFrame();

    // Current index = 10. Cache frames 8 (distance 2) and 12 (distance 2)
    cache.set(8, f1, 10);
    cache.set(10, f2, 10);
    cache.set(12, f3, 10);

    // Access frame 8 to make it recently accessed
    cache.get(8);

    // Now insert frame 11.
    // Frame 8 (distance 2) and 12 (distance 2) are tied for furthest.
    // Frame 12 was NOT accessed, so it is older (least recently accessed) and must be evicted.
    cache.set(11, f4, 10);
    expect(cache.size).toBe(3);
    expect(cache.has(12)).toBe(false); // evicted
    expect(cache.has(8)).toBe(true);
    expect(cache.has(10)).toBe(true);
    expect(cache.has(11)).toBe(true);
  });

  test('never evicts current frame', () => {
    const cache = new ProximityFrameCache(2);
    const f1 = createMockFrame();
    const f2 = createMockFrame();
    const f3 = createMockFrame();

    cache.set(10, f1, 10);
    cache.set(11, f2, 10);

    // Set frame 12 with currentIndex = 10
    // Frame 11 is distance 1, Frame 10 is distance 0.
    // Frame 11 is technically furthest, but Frame 10 is current frame.
    // Frame 11 must be evicted because we cannot evict current frame 10.
    cache.set(12, f3, 10);
    expect(cache.size).toBe(2);
    expect(cache.has(10)).toBe(true); // preserved current
    expect(cache.has(11)).toBe(false); // evicted
    expect(cache.has(12)).toBe(true);
  });

  test('calls close() on evicted ImageBitmap frames', () => {
    const cache = new ProximityFrameCache(1);
    const bitmap = createMockFrame(true) as ImageBitmap;
    const fallback = createMockFrame(false);

    cache.set(1, bitmap, 1);
    
    // Evict it by inserting index 2
    cache.set(2, fallback, 2);
    
    expect(bitmap.close).toHaveBeenCalledTimes(1);
  });
});
