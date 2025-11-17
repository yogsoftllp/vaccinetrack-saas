#!/bin/bash

# VaccineTrack GitHub & Vercel Setup Script
# This script helps set up the correct GitHub repository and deployment

echo "🚀 VaccineTrack GitHub & Vercel Setup"
echo "======================================"
echo "This script will help you set up the correct GitHub repository"
echo "for admin@yogsoft.com and deploy to Vercel"
echo ""

# Check if git is configured correctly
echo "📋 Checking Git Configuration..."
echo "Current email: $(git config user.email)"
echo "Current name: $(git config user.name)"
echo ""

# Instructions for GitHub setup
echo "📖 Next Steps:"
echo "1. Go to https://github.com and sign in with admin@yogsoft.com"
echo "2. Create a new repository named 'vaccinetrack-saas'"
echo "3. Make it PUBLIC (for easier Vercel deployment)"
echo "4. DON'T initialize with README, .gitignore, or license"
echo "5. Copy the repository URL (should look like: https://github.com/yourusername/vaccinetrack-saas.git)"
echo ""

# Wait for user to create repository
echo "Press Enter when you've created the GitHub repository and copied the URL..."
read -p ""

# Get repository URL from user
read -p "Enter your GitHub repository URL: " REPO_URL

# Configure git remote
echo "🔗 Configuring Git remote..."
git remote remove origin 2>/dev/null || true
git remote add origin "$REPO_URL"

# Push to GitHub
echo "📤 Pushing code to GitHub..."
git branch -M main
git push -u origin main

if [ $? -eq 0 ]; then
    echo "✅ Successfully pushed to GitHub!"
    echo ""
    echo "🎯 Next Steps:"
    echo "1. Go to https://vercel.com and sign in with the same GitHub account"
    echo "2. Click 'New Project'"
    echo "3. Import your 'vaccinetrack-saas' repository"
    echo "4. Set environment variables (see vercel-env-template.txt)"
    echo "5. Click 'Deploy'"
    echo ""
    echo "📋 Environment Variables to Add:"
    echo "- VITE_SUPABASE_URL (provided)"
    echo "- VITE_SUPABASE_ANON_KEY (provided)"
    echo "- VITE_SUPABASE_SERVICE_ROLE_KEY (provided)"
    echo "- JWT_SECRET (generate yourself - min 32 chars)"
    echo "- STRIPE_SECRET_KEY (optional)"
    echo ""
    echo "🔗 Your repository: $REPO_URL"
else
    echo "❌ Failed to push to GitHub. Please check:"
    echo "- Repository URL is correct"
    echo "- You have permission to push"
    echo "- GitHub credentials are correct"
fi

echo ""
echo "🎉 Setup complete! Now go to Vercel to deploy your VaccineTrack application!"