import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('===================================================');
console.log('     PRODUCTION HARDENING VERIFICATION ENGINE     ');
console.log('===================================================\n');

let issuesFound = 0;

// 1. Validate Frame Manifest CONTIGUITY
const manifestPath = path.join(rootDir, 'public', 'experience', 'desktop', 'frame-manifest.json');
if (fs.existsSync(manifestPath)) {
  try {
    const raw = fs.readFileSync(manifestPath, 'utf8');
    const parsed = JSON.parse(raw);
    console.log(`✓ Frame Manifest located. Version: ${parsed.version}, Count: ${parsed.frames?.length}`);
    
    // Contiguity verification
    const frames = parsed.frames || [];
    let contiguous = true;
    for (let i = 0; i < frames.length; i++) {
      const idx = frames[i].index;
      if (idx !== i + 1) {
        contiguous = false;
        console.error(`[ERROR] Gap in frame manifest sequence at index: ${idx}, expected: ${i + 1}`);
        issuesFound++;
      }
    }
    if (contiguous) {
      console.log('✓ Frame manifest sequence is contiguously aligned.');
    }
  } catch (err) {
    console.error('[ERROR] Failed parsing frame manifest:', err.message);
    issuesFound++;
  }
} else {
  console.error('[ERROR] Frame manifest does not exist at /public/experience/desktop/frame-manifest.json');
  issuesFound++;
}

// 2. Validate .env.example contains all required production configuration flags
const envExamplePath = path.join(rootDir, '.env.example');
if (fs.existsSync(envExamplePath)) {
  const content = fs.readFileSync(envExamplePath, 'utf8');
  const requiredKeys = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'IP_HASH_SECRET',
    'TURNSTILE_SECRET_KEY',
    'ALLOWED_ORIGINS',
    'PREVIEW_ALLOWED_ORIGINS',
  ];
  let keysFound = true;
  for (const key of requiredKeys) {
    if (!content.includes(key)) {
      keysFound = false;
      console.error(`[ERROR] .env.example is missing required production variable: ${key}`);
      issuesFound++;
    }
  }
  if (keysFound) {
    console.log('✓ .env.example contains all required production security variables.');
  }
} else {
  console.error('[ERROR] .env.example template file is missing from root.');
  issuesFound++;
}

// 3. Scan codebase for active dev bypass modes that could slip into production
const filesToScan = [
  'api/_lib/env.ts',
  'api/_lib/rateLimit.ts',
  'api/_lib/turnstile.ts',
];

let bypassSafe = true;
for (const file of filesToScan) {
  const fullPath = path.join(rootDir, file);
  if (fs.existsSync(fullPath)) {
    const code = fs.readFileSync(fullPath, 'utf8');
    // Check if there is bypass logic that doesn't check isProduction()
    if (code.includes('development_bypass') && !code.includes('isProduction()') && !code.includes('!isProduction()')) {
      bypassSafe = false;
      console.error(`[WARNING] Dev bypass trace found in ${file} without safety gate checks.`);
      issuesFound++;
    }
  }
}
if (bypassSafe) {
  console.log('✓ No raw bypass escapes detected in server-side API libraries.');
}

console.log('\n---------------------------------------------------');
if (issuesFound === 0) {
  console.log('STATUS: VERIFICATION SUCCESS. BUILD STABLE FOR PROD.');
  process.exit(0);
} else {
  console.error(`STATUS: VERIFICATION FAILED. ${issuesFound} ISSUES MUST BE RETRIEVED.`);
  process.exit(1);
}
