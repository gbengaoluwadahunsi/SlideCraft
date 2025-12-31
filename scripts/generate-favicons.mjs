/**
 * Favicon Generator Script
 * Run: node scripts/generate-favicons.mjs
 * 
 * This script generates PNG favicons from your SVG icon
 * Required: npm install sharp
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function generateFavicons() {
  // Dynamic import sharp
  let sharp;
  try {
    sharp = (await import('sharp')).default;
  } catch (e) {
    console.error('❌ Sharp is not installed. Run: npm install sharp');
    process.exit(1);
  }

  const svgPath = path.join(__dirname, '../app/icon.svg');
  const publicDir = path.join(__dirname, '../public');

  // Read the SVG file
  const svgBuffer = fs.readFileSync(svgPath);

  const sizes = [
    { name: 'favicon-16x16.png', size: 16 },
    { name: 'favicon-32x32.png', size: 32 },
    { name: 'apple-touch-icon.png', size: 180 },
    { name: 'android-chrome-192x192.png', size: 192 },
    { name: 'android-chrome-512x512.png', size: 512 },
  ];

  console.log('🎨 Generating favicons from icon.svg...\n');

  for (const { name, size } of sizes) {
    try {
      await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toFile(path.join(publicDir, name));
      
      console.log(`✅ Generated ${name} (${size}x${size})`);
    } catch (error) {
      console.error(`❌ Failed to generate ${name}:`, error.message);
    }
  }

  // Also copy favicon.ico (you might want to use a proper ICO converter)
  // For now, we'll use the 32x32 PNG as a base
  try {
    await sharp(svgBuffer)
      .resize(32, 32)
      .png()
      .toFile(path.join(publicDir, 'favicon.ico'));
    
    console.log('✅ Generated favicon.ico (32x32)');
  } catch (error) {
    console.error('❌ Failed to generate favicon.ico:', error.message);
  }

  console.log('\n🎉 All favicons generated! Deploy your site to see changes in Google.');
  console.log('\n📋 Next steps for better SEO ranking:');
  console.log('1. Submit your sitemap to Google Search Console');
  console.log('2. Request indexing for your main pages');
  console.log('3. Get backlinks from other sites');
  console.log('4. Wait 2-4 weeks for Google to update\n');
}

generateFavicons().catch(console.error);












