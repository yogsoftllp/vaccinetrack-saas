#!/bin/bash

# VaccineTrack Auto Deployment Script
# This script deploys the application to Vercel automatically

echo "🚀 Starting VaccineTrack Auto Deployment..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

# Build the project
echo "🔨 Building project..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please check the errors above."
    exit 1
fi

echo "✅ Build successful!"

# Deploy to Vercel
echo "🌐 Deploying to Vercel..."
vercel --prod --yes --token=$VERCEL_TOKEN

if [ $? -eq 0 ]; then
    echo "✅ Deployment successful!"
    echo "🎉 VaccineTrack is now live!"
else
    echo "❌ Deployment failed. Please check the errors above."
    exit 1
fi