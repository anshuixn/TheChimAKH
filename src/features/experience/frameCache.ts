import type { DecodedFrame } from './frameLoader';

export interface CacheEntry {
  index: number;
  frame: DecodedFrame;
  lastAccessed: number; // timestamp or access counter
}

export class ProximityFrameCache {
  private cache = new Map<number, CacheEntry>();
  private maxCapacity: number;
  private accessCounter = 0;

  constructor(maxCapacity = 80) {
    this.maxCapacity = maxCapacity;
  }

  public get(index: number): DecodedFrame | null {
    const entry = this.cache.get(index);
    if (!entry) return null;
    
    // Update access counter
    this.accessCounter++;
    entry.lastAccessed = this.accessCounter;
    
    return entry.frame;
  }

  public set(index: number, frame: DecodedFrame, currentIndex: number): void {
    // If already exists, update and return
    const existing = this.cache.get(index);
    if (existing) {
      this.accessCounter++;
      existing.lastAccessed = this.accessCounter;
      existing.frame = frame;
      return;
    }

    // Check if we need to evict
    if (this.cache.size >= this.maxCapacity) {
      this.evict(currentIndex);
    }

    this.accessCounter++;
    this.cache.set(index, {
      index,
      frame,
      lastAccessed: this.accessCounter,
    });
  }

  /**
   * Proximity-aware eviction policy:
   * 1. Primary sort: Maximum distance from current index (Math.abs(index - currentIndex)).
   * 2. Secondary sort (tie-breaker): Least recently accessed (oldest lastAccessed counter).
   * 3. Never evict the current index frame unless it is the only item in the cache.
   */
  private evict(currentIndex: number): void {
    if (this.cache.size === 0) return;

    let bestCandidate: CacheEntry | null = null;
    let maxDistance = -1;

    for (const entry of this.cache.values()) {
      // Never evict current frame if other options exist
      if (entry.index === currentIndex && this.cache.size > 1) {
        continue;
      }

      const distance = Math.abs(entry.index - currentIndex);
      
      if (distance > maxDistance) {
        maxDistance = distance;
        bestCandidate = entry;
      } else if (distance === maxDistance && bestCandidate) {
        // Tie-breaker: least recently accessed
        if (entry.lastAccessed < bestCandidate.lastAccessed) {
          bestCandidate = entry;
        }
      }
    }

    if (bestCandidate) {
      this.evictEntry(bestCandidate.index);
    }
  }

  private evictEntry(index: number): void {
    const entry = this.cache.get(index);
    if (!entry) return;

    // Call close() if it exists on the frame (e.g. ImageBitmap) to release GPU memory immediately
    if ('close' in entry.frame && typeof entry.frame.close === 'function') {
      entry.frame.close();
    }
    
    // Release strong references for GC
    this.cache.delete(index);
  }

  public clear(): void {
    // Clone keys first to avoid modifying the map size during iteration
    const keys = Array.from(this.cache.keys());
    for (const index of keys) {
      this.evictEntry(index);
    }
    this.cache.clear();
  }

  public get size(): number {
    return this.cache.size;
  }

  public has(index: number): boolean {
    return this.cache.has(index);
  }
}
