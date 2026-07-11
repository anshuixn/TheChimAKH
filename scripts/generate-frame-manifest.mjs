#!/usr/bin/env node
/**
 * generate-frame-manifest.mjs
 * ============================
 * Reads source frames from REFERANCE_IMAGES/, copies them to
 * public/experience/desktop/<sequenceVersion>/ with canonical zero-padded names,
 * and emits public/experience/desktop/frame-manifest.json.
 *
 * Usage:
 *   node scripts/generate-frame-manifest.mjs
 *   npm run generate:manifest
 *
 * Output:
 *   public/experience/desktop/<sequenceVersion>/frame-0001.jpg
 *   ...
 *   public/experience/desktop/<sequenceVersion>/frame-0181.jpg
 *   public/experience/desktop/frame-manifest.json
 */

import { createHash } from 'node:crypto';
import { copyFile, mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = resolve(__dirname, '..');
const SOURCE_DIR = join(ROOT, 'REFERANCE_IMAGES');
const PUBLIC_EXPERIENCE_DIR = join(ROOT, 'public', 'experience', 'desktop');
const MANIFEST_PATH = join(PUBLIC_EXPERIENCE_DIR, 'frame-manifest.json');

// Poster image for entrance screen
const POSTER_SOURCE = join(ROOT, 'REFERANCE_IMAGES', 'image 06.png');
const POSTER_DEST_DIR = join(ROOT, 'public', 'experience', 'posters');
const POSTER_DEST = join(POSTER_DEST_DIR, 'poster-entrance.png');

/**
 * Collect all JPEG frame files from the source directory.
 * Accepts: ezgif-frame-NNN.jpg, frame-NNN.jpg, NNN.jpg
 * Returns sorted array of absolute paths.
 */
async function collectSourceFrames(dir) {
  const entries = await readdir(dir, { withFileTypes: true });

  const jpegs = entries
    .filter(e => e.isFile() && /\.(jpe?g)$/i.test(e.name))
    .map(e => e.name)
    .sort(); // lexicographic sort preserves numeric order when zero-padded

  if (jpegs.length === 0) {
    throw new Error(`No JPEG files found in ${dir}`);
  }

  return jpegs.map(name => join(dir, name));
}

/**
 * Derive a content-based version from the first + last + count of frame files.
 * This is intentionally fast (not reading all 181 files) and stable — it changes
 * when the frame set changes.
 */
async function deriveSequenceVersion(framePaths) {
  const hash = createHash('sha256');
  hash.update(String(framePaths.length));

  // Hash content of first and last frames for sensitivity to edge changes
  const first = await readFile(framePaths[0]);
  const last = await readFile(framePaths[framePaths.length - 1]);
  hash.update(first);
  hash.update(last);

  // Include all filenames for sensitivity to reordering
  for (const p of framePaths) {
    hash.update(p.split('/').pop() ?? '');
  }

  return hash.digest('hex').slice(0, 12);
}

/**
 * Chapter configuration — single source of truth.
 * Mirror of src/features/experience/experience.config.ts
 * (kept in sync manually; the manifest generator does not import TS files)
 */
const CHAPTERS = [
  { id: 'origin',        frameRange: { start: 1,   end: 20  }, scrollRange: { start: 0,    end: 0.11 }, eyebrow: 'OUR ORIGIN',     headline: 'BUILT FROM EARTH.' },
  { id: 'foundation',    frameRange: { start: 21,  end: 60  }, scrollRange: { start: 0.11, end: 0.33 }, eyebrow: 'OUR FOUNDATION', headline: 'ROOTED IN CRAFT.\nBUILT FOR GENERATIONS.' },
  { id: 'product',       frameRange: { start: 61,  end: 90  }, scrollRange: { start: 0.33, end: 0.50 }, eyebrow: 'THE PRODUCT',     headline: 'THE RED BRICK.\nSIMPLE. PROVEN. ENDURING.' },
  { id: 'manufacturing', frameRange: { start: 91,  end: 115 }, scrollRange: { start: 0.50, end: 0.63 }, eyebrow: 'MANUFACTURING',   headline: 'SHAPED WITH CONSISTENCY.\nFIRED WITH CONTROL.' },
  { id: 'quality',       frameRange: { start: 116, end: 140 }, scrollRange: { start: 0.63, end: 0.77 }, eyebrow: 'QUALITY',         headline: 'STRENGTH YOU CAN\nBUILD ON.' },
  { id: 'capability',    frameRange: { start: 141, end: 160 }, scrollRange: { start: 0.77, end: 0.88 }, eyebrow: 'CAPABILITY',      headline: 'CONSISTENT PRODUCTION.\nDEPENDABLE SUPPLY.' },
  { id: 'scale',         frameRange: { start: 161, end: 175 }, scrollRange: { start: 0.88, end: 0.97 }, eyebrow: 'SCALE',           headline: 'FROM OUR KILN\nTO YOUR PROJECT.' },
  { id: 'impact',        frameRange: { start: 176, end: 180 }, scrollRange: { start: 0.97, end: 1.0  },                              headline: "LET'S BUILD SOMETHING\nTHAT LASTS." },
];

async function main() {
  console.log('🔍  Scanning source frames…');
  const sourcePaths = await collectSourceFrames(SOURCE_DIR);
  console.log(`    Found ${sourcePaths.length} source JPEG files.`);

  console.log('🔑  Deriving sequence version…');
  const sequenceVersion = await deriveSequenceVersion(sourcePaths);
  console.log(`    sequenceVersion: ${sequenceVersion}`);

  const versionedDir = join(PUBLIC_EXPERIENCE_DIR, sequenceVersion);
  await mkdir(versionedDir, { recursive: true });
  await mkdir(POSTER_DEST_DIR, { recursive: true });

  console.log(`📁  Copying ${sourcePaths.length} frames to ${versionedDir}…`);

  let totalBytes = 0;
  const frameUrls = [];

  for (let i = 0; i < sourcePaths.length; i++) {
    const src = sourcePaths[i];
    const frameNumber = i + 1;
    const dest = join(versionedDir, `frame-${String(frameNumber).padStart(4, '0')}.jpg`);
    await copyFile(src, dest);

    const content = await readFile(src);
    totalBytes += content.length;

    frameUrls.push(`/experience/desktop/${sequenceVersion}/frame-${String(frameNumber).padStart(4, '0')}.jpg`);

    if (frameNumber % 30 === 0 || frameNumber === sourcePaths.length) {
      process.stdout.write(`    ${frameNumber}/${sourcePaths.length} frames copied (${(totalBytes / 1024 / 1024).toFixed(1)} MB so far)\r`);
    }
  }

  console.log('\n');

  // Copy entrance poster
  try {
    await copyFile(POSTER_SOURCE, POSTER_DEST);
    console.log('🖼   Entrance poster copied.');
  } catch {
    console.warn('⚠️   Could not copy entrance poster — check REFERANCE_IMAGES/image 06.png');
  }

  // Determine frame dimensions from first frame (JPEG SOF marker)
  // For now, record as 0x0 — update after measuring actual files
  // [PLACEHOLDER — REQUIRES MEASURING ACTUAL FRAME DIMENSIONS]
  const frameDimensions = { width: 0, height: 0 };

  const manifest = {
    version: '1',
    sequenceVersion,
    frameCount: sourcePaths.length,
    format: 'jpeg',
    dimensions: frameDimensions,
    frameUrls,
    chapters: CHAPTERS,
    generatedAt: new Date().toISOString(),
  };

  await writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2), 'utf-8');

  const manifestSize = JSON.stringify(manifest).length;
  console.log(`✅  Manifest written to ${MANIFEST_PATH}`);
  console.log(`    Total frames: ${sourcePaths.length}`);
  console.log(`    Total size:   ${(totalBytes / 1024 / 1024).toFixed(2)} MB`);
  console.log(`    Manifest:     ${(manifestSize / 1024).toFixed(1)} KB`);
  console.log(`    Version path: /experience/desktop/${sequenceVersion}/`);
}

main().catch(err => {
  console.error('❌  Frame manifest generation failed:', err.message);
  process.exit(1);
});
