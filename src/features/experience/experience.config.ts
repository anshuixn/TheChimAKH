export const TOTAL_FRAMES = 180;

export interface ExperienceChapter {
  id: string;
  frameRange: { start: number; end: number }; // 1-indexed, inclusive
  scrollRange: { start: number; end: number }; // 0–1 normalized
  eyebrow?: string;
  headline: string;
  body?: string;
  alignment: 'left' | 'right' | 'center';
}

export const EXPERIENCE_CHAPTERS: readonly ExperienceChapter[] = [
  {
    id: 'origin',
    frameRange: { start: 1, end: 20 },
    scrollRange: { start: 0, end: 0.11 },
    eyebrow: 'OUR ORIGIN',
    headline: 'BUILT FROM EARTH.',
    alignment: 'center',
  },
  {
    id: 'foundation',
    frameRange: { start: 21, end: 60 },
    scrollRange: { start: 0.11, end: 0.33 },
    eyebrow: 'OUR FOUNDATION',
    headline: 'ROOTED IN CRAFT.\nBUILT FOR GENERATIONS.',
    alignment: 'left',
  },
  {
    id: 'product',
    frameRange: { start: 61, end: 90 },
    scrollRange: { start: 0.33, end: 0.50 },
    eyebrow: 'THE PRODUCT',
    headline: 'THE RED BRICK.\nSIMPLE. PROVEN. ENDURING.',
    alignment: 'right',
  },
  {
    id: 'manufacturing',
    frameRange: { start: 91, end: 115 },
    scrollRange: { start: 0.50, end: 0.63 },
    eyebrow: 'MANUFACTURING',
    headline: 'SHAPED WITH CONSISTENCY.\nFIRED WITH CONTROL.',
    alignment: 'left',
  },
  {
    id: 'quality',
    frameRange: { start: 116, end: 140 },
    scrollRange: { start: 0.63, end: 0.77 },
    eyebrow: 'QUALITY',
    headline: 'STRENGTH YOU CAN\nBUILD ON.',
    alignment: 'right',
  },
  {
    id: 'capability',
    frameRange: { start: 141, end: 160 },
    scrollRange: { start: 0.77, end: 0.88 },
    eyebrow: 'CAPABILITY',
    headline: 'CONSISTENT PRODUCTION.\nDEPENDABLE SUPPLY.',
    alignment: 'left',
  },
  {
    id: 'scale',
    frameRange: { start: 161, end: 175 },
    scrollRange: { start: 0.88, end: 0.97 },
    eyebrow: 'SCALE',
    headline: 'FROM OUR KILN\nTO YOUR PROJECT.',
    alignment: 'center',
  },
  {
    id: 'impact',
    frameRange: { start: 176, end: 180 },
    scrollRange: { start: 0.97, end: 1.0 },
    headline: "LET'S BUILD SOMETHING\nTHAT LASTS.",
    alignment: 'center',
  },
] as const;

/**
 * Returns the chapter and frame index for a given scroll progress.
 * Follows the half-open scroll intervals [start, end),
 * except progress === 1.0 maps to the final chapter.
 */
export function getChapterAndFrameForProgress(progress: number): {
  chapter: ExperienceChapter;
  frameIndex: number;
} {
  const clampedProgress = Math.max(0, Math.min(1, progress));
  
  // Find chapter matching progress
  let matchedChapter = EXPERIENCE_CHAPTERS[EXPERIENCE_CHAPTERS.length - 1];
  for (const ch of EXPERIENCE_CHAPTERS) {
    if (clampedProgress >= ch.scrollRange.start && clampedProgress < ch.scrollRange.end) {
      matchedChapter = ch;
      break;
    }
  }

  // Handle boundary progress === 1.0 mapping to final chapter
  if (clampedProgress === 1.0) {
    matchedChapter = EXPERIENCE_CHAPTERS[EXPERIENCE_CHAPTERS.length - 1];
  }

  // Map progress linearly within the matched chapter's scroll range to its frame range
  const scrollRangeLength = matchedChapter.scrollRange.end - matchedChapter.scrollRange.start;
  const progressInChapter = scrollRangeLength > 0 
    ? (clampedProgress - matchedChapter.scrollRange.start) / scrollRangeLength
    : 0;

  const frameRangeLength = matchedChapter.frameRange.end - matchedChapter.frameRange.start;
  const calculatedFrame = matchedChapter.frameRange.start + Math.round(progressInChapter * frameRangeLength);
  const frameIndex = Math.max(matchedChapter.frameRange.start, Math.min(matchedChapter.frameRange.end, calculatedFrame));

  return {
    chapter: matchedChapter,
    frameIndex,
  };
}
