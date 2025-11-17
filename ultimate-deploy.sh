#!/bin/bash

# VaccineTrack Ultimate Auto Deployment
# This script will automatically deploy your app

echo "🚀 VaccineTrack Ultimate Auto Deployment"
echo "========================================"
echo ""

# Function to deploy to Render
deploy_to_render() {
    echo "🎨 Deploying to Render..."
    echo ""
    echo "Step 1: Go to https://render.com"
    echo "Step 2: Click 'New Web Service'"
    echo "Step 3: Connect your GitHub: yogsoftllp/vaccinetrack-saas"
    echo "Step 4: Select branch: deployment-ready"
    echo "Step 5: Configure:"
    echo "   - Name: vaccinetrack-saas"
    echo "   - Build Command: npm install && npm run build"
    echo "   - Start Command: node server.js"
    echo "   - Environment: Node"
    echo "Step 6: Set Environment Variables (copy from below)"
    echo "Step 7: Click Deploy!"
    echo ""
    echo "Environment Variables to set:"
    echo "VITE_SUPABASE_URL=your_supabase_url"
    echo "VITE_SUPABASE_ANON_KEY=your_anon_key"
    echo "VITE_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key"
    echo "JWT_SECRET=your_jwt_secret"
    echo "STRIPE_SECRET_KEY=your_stripe_secret_key"
    echo "STRIPE_WEBHOOK_SECRET=your_webhook_secret"
    echo "NODE_ENV=production"
    echo ""
    echo "🎯 Click this link to start: https://render.com"
}

# Function to deploy to Railway
deploy_to_railway() {
    echo "🚂 Deploying to Railway..."
    echo ""
    echo "Step 1: Go to https://railway.app"
    echo "Step 2: Click 'New Project'"
    echo "Step 3: Click 'Deploy from GitHub'"
    echo "Step 4: Select: yogsoftllp/vaccinetrack-saas"
    echo "Step 5: Select branch: deployment-ready"
    echo "Step 6: Railway will auto-detect and deploy!"
    echo "Step 7: Add environment variables in Settings"
    echo ""
    echo "🎯 Click this link to start: https://railway.app"
}

# Function to create deployable zip
create_deploy_package() {
    echo "📦 Creating Deployable Package..."
    ./create-deploy-package.sh
    echo ""
    echo "✅ Package created in 'deploy-package/' folder!"
    echo "You can upload this to:"
    echo "- Netlify (drag & drop)"
    echo "- Vercel (upload)"
    echo "- Any Node.js hosting"
    echo "- Heroku (with Procfile)"
}

# Function to deploy with Vercel CLI
deploy_vercel_cli() {
    echo "⚡ Deploying with Vercel CLI..."
    if command -v vercel &> /dev/null; then
        echo "Vercel CLI found! Deploying..."
        vercel --prod --yes
    else
        echo "Installing Vercel CLI..."
        npm install -g vercel
        echo "Deploying..."
        vercel --prod --yes
    fi
}

# Main menu
echo "Choose your deployment method:"
echo "1. Railway (Free, Easiest)"
echo "2. Render (Free, Recommended)"
echo "3. Create Deploy Package (Multiple options)"
echo "4. Vercel CLI (If you have token)"
echo "5. Show me all options"
echo ""
read -p "Enter your choice (1-5): " choice

case $choice in
    1)
        deploy_to_railway
        ;;
    2)
        deploy_to_render
        ;;
    3)
        create_deploy_package
        ;;
    4)
        deploy_vercel_cli
        ;;
    5)
        echo ""
        echo "🎯 ALL DEPLOYMENT OPTIONS:"
        echo "=========================="
        echo ""
        echo "1. RAILWAY (Easiest): https://railway.app"
        echo "   - Connect GitHub, select deployment-ready branch"
        echo "   - Auto-detects and deploys"
        echo ""
        echo "2. RENDER (Recommended): https://render.com"
        echo "   - New Web Service → GitHub → deployment-ready"
        echo "   - Build: npm install && npm run build"
        echo "   - Start: node server.js"
        echo ""
        echo "3. NETLIFY: https://netlify.com"
        echo "   - Drag & drop the 'dist' folder"
        echo "   - Or connect GitHub repository"
        echo ""
        echo "4. VERCEL: https://vercel.com"
        echo "   - Connect GitHub repository"
        echo "   - Select deployment-ready branch"
        echo ""
        echo "5. USE DEPLOY PACKAGE:"
        echo "   - Run: ./create-deploy-package.sh"
        echo "   - Upload deploy-package/ folder"
        echo ""
        echo "All options are FREE and ready to use!"
        ;;
    *)
        echo "❌ Invalid choice. Please run the script again."
        ;;
esac

echo ""
echo "🎉 Your VaccineTrack SaaS is ready to deploy!"
echo "Repository: https://github.com/yogsoftllp/vaccinetrack-saas"
echo "Branch: deployment-ready"
echo ""
echo "Don't forget to set your environment variables!"