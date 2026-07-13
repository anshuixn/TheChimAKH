import fs from 'fs';
import path from 'path';

const srcDir = './Mobile Sequense for the Experiance Panel';
const destDir = './public/experience/mobile/sequence';
const manifestPath = './public/experience/mobile/frame-manifest.json';

// Create directories if they don't exist
fs.mkdirSync(destDir, { recursive: true });

const files = fs.readdirSync(srcDir)
  .filter(f => f.endsWith('.jpg'))
  .sort();

console.log(`Found ${files.length} frames to process.`);

const frameUrls = [];

for (let i = 1; i <= 240; i++) {
  // Source is zero-padded up to 3 digits (e.g. ezgif-frame-001.jpg)
  const srcName = `ezgif-frame-${String(i).padStart(3, '0')}.jpg`;
  const srcPath = path.join(srcDir, srcName);
  
  // Destination will be frame-0001.jpg to frame-0240.jpg (padded to 4 digits like desktop)
  const destName = `frame-${String(i).padStart(4, '0')}.jpg`;
  const destPath = path.join(destDir, destName);
  
  if (fs.existsSync(srcPath)) {
    fs.copyFileSync(srcPath, destPath);
    frameUrls.push(`/experience/mobile/sequence/${destName}`);
  } else {
    console.error(`Warning: Missing frame ${srcName}`);
  }
}

// Generate frame-manifest.json
const manifest = {
  version: "1",
  sequenceVersion: "sequence",
  frameCount: frameUrls.length,
  format: "jpeg",
  dimensions: {
    width: 1080,
    height: 1920
  },
  frameUrls: frameUrls,
  chapters: [
    {
      id: "raw-material",
      frameRange: { start: 1, end: 40 },
      scrollRange: { start: 0, end: 0.15 },
      eyebrow: "RAW SILT",
      headline: "Earth"
    },
    {
      id: "shaping",
      frameRange: { start: 41, end: 85 },
      scrollRange: { start: 0.15, end: 0.35 },
      eyebrow: "SHAPING",
      headline: "Precision Form"
    },
    {
      id: "drying",
      frameRange: { start: 86, end: 135 },
      scrollRange: { start: 0.35, end: 0.55 },
      eyebrow: "DRYING",
      headline: "Tempered Silt"
    },
    {
      id: "firing",
      frameRange: { start: 136, end: 190 },
      scrollRange: { start: 0.55, end: 0.75 },
      eyebrow: "FIRING",
      headline: "Intense Heat"
    },
    {
      id: "sorting",
      frameRange: { start: 191, end: 240 },
      scrollRange: { start: 0.75, end: 1.0 },
      eyebrow: "SELECTION",
      headline: "Enduring Brick"
    }
  ],
  generatedAt: new Date().toISOString()
};

fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
console.log(`Successfully generated manifest at ${manifestPath} with ${frameUrls.length} frames.`);
