// Simple Node.js script to create different icon sizes using SVG
// This creates placeholder PNG files that can be replaced with actual PNG exports

import { readFileSync, writeFileSync } from 'fs';

const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];
const baseSvg = readFileSync('/Users/amit/Documents/trae_projects/vaccinetrack-saas/public/icons/icon.svg', 'utf8');

// For now, we'll create SVG files for each size (browsers can scale SVG)
// In production, you'd convert these to PNG using a tool like sharp or online converter

iconSizes.forEach(size => {
  const sizedSvg = baseSvg.replace('viewBox="0 0 512 512"', `viewBox="0 0 512 512" width="${size}" height="${size}"`);
  const outputPath = `/Users/amit/Documents/trae_projects/vaccinetrack-saas/public/icons/icon-${size}x${size}.svg`;
  writeFileSync(outputPath, sizedSvg);
  
  // Also create a simple PNG placeholder (in production, convert SVG to PNG)
  const pngPlaceholder = `<!-- SVG Icon ${size}x${size} - Convert to PNG in production -->\n${sizedSvg}`;
  const pngPath = `/Users/amit/Documents/trae_projects/vaccinetrack-saas/public/icons/icon-${size}x${size}.png`;
  writeFileSync(pngPath, pngPlaceholder);
});

console.log('Created icon files for sizes:', iconSizes.join(', '));
console.log('Note: Convert SVG files to PNG format for production use');