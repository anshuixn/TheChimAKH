import { describe, test, expect } from 'vitest';
import { EXPERIENCE_CHAPTERS, getChapterAndFrameForProgress, TOTAL_FRAMES } from './experience.config';

describe('Experience Config & Progress Mapping', () => {
  test('chapters are contiguous and covers entire sequence', () => {
    let lastEndFrame = 0;
    let lastEndScroll = 0;

    EXPERIENCE_CHAPTERS.forEach((ch, idx) => {
      // Frame Contiguity
      if (idx === 0) {
        expect(ch.frameRange.start).toBe(1);
      } else {
        expect(ch.frameRange.start).toBe(lastEndFrame + 1);
      }
      expect(ch.frameRange.end).toBeGreaterThanOrEqual(ch.frameRange.start);
      lastEndFrame = ch.frameRange.end;

      // Scroll Contiguity
      if (idx === 0) {
        expect(ch.scrollRange.start).toBe(0);
      } else {
        expect(ch.scrollRange.start).toBeCloseTo(lastEndScroll, 5);
      }
      expect(ch.scrollRange.end).toBeGreaterThan(ch.scrollRange.start);
      lastEndScroll = ch.scrollRange.end;
    });

    expect(lastEndFrame).toBe(TOTAL_FRAMES);
    expect(lastEndScroll).toBe(1.0);
  });

  test('boundary progress 0 maps to frame 1 of first chapter', () => {
    const { chapter, frameIndex } = getChapterAndFrameForProgress(0);
    expect(chapter.id).toBe('origin');
    expect(frameIndex).toBe(1);
  });

  test('boundary progress 1 maps to frame 180 of final chapter', () => {
    const { chapter, frameIndex } = getChapterAndFrameForProgress(1);
    expect(chapter.id).toBe('impact');
    expect(frameIndex).toBe(180);
  });

  test('progress mapping is monotonic', () => {
    let lastFrame = 0;
    for (let p = 0; p <= 100; p++) {
      const progress = p / 100;
      const { frameIndex } = getChapterAndFrameForProgress(progress);
      expect(frameIndex).toBeGreaterThanOrEqual(lastFrame);
      lastFrame = frameIndex;
    }
  });

  test('half-open scroll interval borders mapping', () => {
    // 0.11 is the boundary between origin and foundation
    // progress < 0.11 should map to origin
    const { chapter: ch1 } = getChapterAndFrameForProgress(0.1099);
    expect(ch1.id).toBe('origin');

    // progress === 0.11 should map to foundation
    const { chapter: ch2 } = getChapterAndFrameForProgress(0.11);
    expect(ch2.id).toBe('foundation');
  });
});
