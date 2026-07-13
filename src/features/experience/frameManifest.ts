export interface RawManifestChapter {
  id: string;
  frameRange: { start: number; end: number };
  scrollRange: { start: number; end: number };
  eyebrow?: string;
  headline: string;
}

export interface FrameManifest {
  version: string;
  sequenceVersion: string;
  frameCount: number;
  format: string;
  dimensions: { width: number; height: number };
  frameUrls: string[];
  chapters: RawManifestChapter[];
  generatedAt: string;
}

import type { SequenceType } from '../../hooks/useSequenceType';

const cachedManifests: Record<SequenceType, FrameManifest | null> = {
  desktop: null,
  mobile: null,
};

export async function loadFrameManifest(type: SequenceType = 'desktop'): Promise<FrameManifest> {
  if (cachedManifests[type]) {
    return cachedManifests[type];
  }

  const response = await fetch(`/experience/${type}/frame-manifest.json`);
  if (!response.ok) {
    throw new Error(`Failed to load frame manifest for ${type}: ${response.statusText}`);
  }

  const data = await response.json() as FrameManifest;
  cachedManifests[type] = data;
  return data;
}
