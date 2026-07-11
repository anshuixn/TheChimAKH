#!/usr/bin/env node
/**
 * check-placeholders.mjs
 * =======================
 * Scans the codebase for the string "[PLACEHOLDER — REQUIRES VERIFIED BUSINESS DATA]"
 * or general "PLACEHOLDER" markers to report unconfigured production data.
 *
 * Exits with 0 in development/build, but prints warnings.
 * Can be configured to fail the build when strict production mode is active.
 */

import { readdir, readFile, stat } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = resolve(__dirname, '..');

const IGNORE_DIRS = new Set([
  'node_modules',
  'dist',
  '.git',
  '.vercel',
  'playwright-report',
  'test-results',
  'coverage',
  'public',
]);

const IGNORE_FILES = new Set([
  'check-placeholders.mjs',
  'task.md',
  'implementation_plan.md',
  'package.json',
  'package-lock.json',
]);

async function scanDir(dir, results = []) {
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const path = join(dir, entry.name);

    if (entry.isDirectory()) {
      if (!IGNORE_DIRS.has(entry.name)) {
        await scanDir(path, results);
      }
    } else if (entry.isFile()) {
      if (!IGNORE_FILES.has(entry.name) && !entry.name.endsWith('.jpg') && !entry.name.endsWith('.png') && !entry.name.endsWith('.ico')) {
        const content = await readFile(path, 'utf-8');
        const lines = content.split('\n');

        for (let i = 0; i < lines.length; i++) {
          if (lines[i].includes('PLACEHOLDER — REQUIRES VERIFIED BUSINESS DATA') || lines[i].includes('PLACEHOLDER')) {
            results.push({
              file: path.replace(ROOT + '/', ''),
              line: i + 1,
              content: lines[i].trim(),
            });
          }
        }
      }
    }
  }

  return results;
}

async function main() {
  console.log('🔍  Scanning for unresolved business placeholders…');
  const results = await scanDir(ROOT);

  if (results.length === 0) {
    console.log('✅  No business placeholders found. Code is production-ready.');
    process.exit(0);
  }

  console.warn(`⚠️   Found ${results.length} placeholder(s) in codebase:`);
  for (const r of results) {
    console.warn(`    • [${r.file}:${r.line}]: ${r.content}`);
  }

  // Always succeed in local dev build. In production verify:production step, we could fail if strict mode is set.
  if (process.env.STRICT_PRODUCTION === 'true') {
    console.error('❌  Fail-closed: placeholders present in strict production mode!');
    process.exit(1);
  }

  console.log('💡  Note: Placeholders will be flagged as strict failures in production pipelines.');
}

main().catch(err => {
  console.error('❌  Placeholder scan failed:', err);
  process.exit(1);
});
