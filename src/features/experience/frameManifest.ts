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

let cachedManifest: FrameManifest | null = null;

export async function loadFrameManifest(): Promise<FrameManifest> {
  if (cachedManifest) {
    return cachedManifest;
  }

  const response = await fetch('/experience/desktop/frame-manifest.json');
  if (!response.ok) {
    throw new Error(`Failed to load frame manifest: ${response.statusText}`);
  }

  const data = await response.json() as FrameManifest;
  cachedManifest = data;
  return data;
}
