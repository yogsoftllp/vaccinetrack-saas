#!/bin/bash

# VaccineTrack SaaS Platform - One-Click Deployment Script
# This script automates the entire deployment process to Vercel

set -e

echo "🚀 VaccineTrack SaaS Platform - Automated Deployment"
echo "=================================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the project
echo "🔨 Building project..."
npm run build

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📥 Installing Vercel CLI..."
    npm install -g vercel
fi

# Deploy to Vercel
echo "🌐 Deploying to Vercel..."
echo "Please make sure you have:"
echo "1. Vercel account connected to GitHub"
echo "2. Environment variables set up in Vercel dashboard"
echo "3. Supabase project configured"
echo ""
echo "Required environment variables:"
echo "- SUPABASE_URL"
echo "- SUPABASE_ANON_KEY"
echo "- SUPABASE_SERVICE_ROLE_KEY"
echo "- JWT_SECRET"
echo "- STRIPE_SECRET_KEY"
echo "- STRIPE_WEBHOOK_SECRET"
echo ""

read -p "Are you ready to deploy? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🚀 Starting deployment..."
    vercel --prod
    
    if [ $? -eq 0 ]; then
        echo "✅ Deployment successful!"
        echo "🎉 Your VaccineTrack SaaS platform is now live!"
        echo ""
        echo "Next steps:"
        echo "1. Set up your Supabase database migrations"
        echo "2. Configure Stripe webhook endpoints"
        echo "3. Test the application functionality"
        echo "4. Set up custom domain if needed"
    else
        echo "❌ Deployment failed!"
        echo "Please check the error messages above."
        exit 1
    fi
else
    echo "Deployment cancelled."
    exit 0
fi