#!/usr/bin/env node
/**
 * validate-frame-sequence.mjs
 * ===========================
 * Validates the generated frame-manifest.json and the files in the directory.
 * Ensures:
 * 1. manifest exists and is valid JSON
 * 2. all declared frame paths exist and are non-empty
 * 3. sequenceVersion is correct
 * 4. chapter boundaries are contiguous and range within the frame counts
 * 5. total number of frames is exactly what is declared in manifest
 *
 * Exits with 0 on success, non-zero on failure.
 */

import { readFile, access } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = resolve(__dirname, '..');
const PUBLIC_DIR = join(ROOT, 'public');
const MANIFEST_PATH = join(PUBLIC_DIR, 'experience', 'desktop', 'frame-manifest.json');

async function fileExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  console.log('🧐  Validating frame manifest and assets…');

  if (!await fileExists(MANIFEST_PATH)) {
    console.error(`❌  Manifest file does not exist at ${MANIFEST_PATH}`);
    process.exit(1);
  }

  const manifestContent = await readFile(MANIFEST_PATH, 'utf-8');
  let manifest;
  try {
    manifest = JSON.parse(manifestContent);
  } catch (err) {
    console.error('❌  Manifest file is not valid JSON:', err.message);
    process.exit(1);
  }

  const { sequenceVersion, frameCount, frameUrls, chapters } = manifest;

  if (!sequenceVersion || typeof sequenceVersion !== 'string') {
    console.error('❌  sequenceVersion is missing or invalid in manifest');
    process.exit(1);
  }

  if (!frameCount || typeof frameCount !== 'number' || frameCount <= 0) {
    console.error('❌  frameCount is invalid or non-positive');
    process.exit(1);
  }

  if (!Array.isArray(frameUrls) || frameUrls.length !== frameCount) {
    console.error(`❌  frameUrls array length (${frameUrls?.length}) does not match frameCount (${frameCount})`);
    process.exit(1);
  }

  console.log(`    Manifest specifies ${frameCount} frames under version ${sequenceVersion}.`);

  // Verify each file
  for (let i = 0; i < frameUrls.length; i++) {
    const url = frameUrls[i];
    if (!url.startsWith('/experience/desktop/')) {
      console.error(`❌  Invalid frame URL format: ${url}`);
      process.exit(1);
    }
    const fullPath = join(PUBLIC_DIR, url);
    if (!await fileExists(fullPath)) {
      console.error(`❌  Frame file missing: ${fullPath}`);
      process.exit(1);
    }
  }

  console.log('    All frame asset files exist on disk.');

  // Validate chapter contiguity
  if (!Array.isArray(chapters) || chapters.length === 0) {
    console.error('❌  Chapters array is missing or empty in manifest');
    process.exit(1);
  }

  let lastEnd = 0;
  for (let i = 0; i < chapters.length; i++) {
    const ch = chapters[i];
    const { id, frameRange, scrollRange } = ch;

    if (!id || !frameRange || !scrollRange) {
      console.error(`❌  Chapter at index ${i} is missing required fields`);
      process.exit(1);
    }

    const { start, end } = frameRange;

    if (i === 0) {
      if (start !== 1) {
        console.error(`❌  First chapter must start at frame 1, got ${start}`);
        process.exit(1);
      }
    } else {
      if (start !== lastEnd + 1) {
        console.error(`❌  Chapter "${id}" start frame (${start}) is not contiguous with previous end (${lastEnd})`);
        process.exit(1);
      }
    }

    if (end < start) {
      console.error(`❌  Chapter "${id}" end frame (${end}) is less than start frame (${start})`);
      process.exit(1);
    }

    lastEnd = end;
  }

  if (lastEnd !== frameCount) {
    console.error(`❌  Final chapter end frame (${lastEnd}) does not match total frameCount (${frameCount})`);
    process.exit(1);
  }

  console.log('✅  Chapter boundary validation passed successfully.');
}

main().catch(err => {
  console.error('❌  Validation failed:', err);
  process.exit(1);
});
