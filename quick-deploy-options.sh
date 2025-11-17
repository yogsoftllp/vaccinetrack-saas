#!/bin/bash

# VaccineTrack Quick Deploy Script
# This script provides multiple deployment options

echo "🚀 VaccineTrack Quick Deploy Options"
echo "====================================="
echo ""
echo "Choose your deployment method:"
echo "1. Railway (Free, Recommended)"
echo "2. Render (Free)"
echo "3. Netlify (Free)"
echo "4. Create Deploy Package"
echo "5. Vercel CLI (if configured)"
echo ""
read -p "Enter your choice (1-5): " choice

case $choice in
    1)
        echo "🚂 Deploying to Railway..."
        echo "Please go to: https://railway.app"
        echo "1. Create new project"
        echo "2. Deploy from GitHub: yogsoftllp/vaccinetrack-saas"
        echo "3. Select branch: deployment-ready"
        echo "4. Set environment variables"
        echo "5. Deploy!"
        echo ""
        echo "Railway will automatically detect and deploy your app!"
        ;;
    2)
        echo "🎨 Deploying to Render..."
        echo "Please go to: https://render.com"
        echo "1. Create Web Service"
        echo "2. Connect GitHub: yogsoftllp/vaccinetrack-saas"
        echo "3. Select branch: deployment-ready"
        echo "4. Build command: npm install && npm run build"
        echo "5. Start command: node server.js"
        echo "6. Set environment variables"
        echo "7. Deploy!"
        ;;
    3)
        echo "🔥 Deploying to Netlify..."
        echo "Please go to: https://netlify.com"
        echo "1. Drag and drop the 'dist' folder from deploy-package"
        echo "2. Or connect GitHub: yogsoftllp/vaccinetrack-saas"
        echo "3. Set build command: npm run build"
        echo "4. Set publish directory: dist"
        echo "5. Deploy!"
        ;;
    4)
        echo "📦 Creating deployment package..."
        ./create-deploy-package.sh
        echo ""
        echo "✅ Package created in 'deploy-package/' folder!"
        echo "You can now upload this to any hosting provider."
        ;;
    5)
        echo "⚡ Deploying with Vercel CLI..."
        if command -v vercel &> /dev/null; then
            echo "Running: vercel --prod --yes"
            vercel --prod --yes
        else
            echo "❌ Vercel CLI not found. Installing..."
            npm install -g vercel
            echo "Now running: vercel --prod --yes"
            vercel --prod --yes
        fi
        ;;
    *)
        echo "❌ Invalid choice. Please run the script again."
        ;;
esac