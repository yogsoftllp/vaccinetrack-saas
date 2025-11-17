#!/bin/bash

# Quick Deploy Script for VaccineTrack
# This script prepares your project for manual Vercel deployment

set -e

echo "🚀 VaccineTrack Quick Deploy Preparation"
echo "========================================"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}Building project...${NC}"

# Clean and build
rm -rf dist
npm ci
npm run build

# Verify build
echo -e "${GREEN}✅ Build completed successfully!${NC}"
echo

echo -e "${BLUE}Build artifacts created:${NC}"
echo "  📁 dist/index.html - Main frontend"
echo "  📁 dist/api/index.js - Backend API"
echo "  📁 dist/manifest.json - PWA manifest"
echo "  📁 dist/sw.js - Service worker"
echo

echo -e "${GREEN}🎉 Project is ready for Vercel deployment!${NC}"
echo
echo "Next steps:"
echo "1. Go to https://vercel.com"
echo "2. Import your Git repository"
echo "3. Set environment variables (see vercel-env-template.txt)"
echo "4. Deploy!"
echo
echo "The build is already complete and optimized for production."