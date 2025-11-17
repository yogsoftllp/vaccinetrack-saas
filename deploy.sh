#!/bin/bash

# VaccineTrack Automated Deployment Script
# This script automates the deployment process to Vercel

set -e

echo "🚀 VaccineTrack Automated Deployment"
echo "====================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Vercel CLI is installed
check_vercel_cli() {
    if ! command -v vercel &> /dev/null; then
        print_status "Installing Vercel CLI..."
        npm install -g vercel
        print_success "Vercel CLI installed"
    else
        print_success "Vercel CLI found"
    fi
}

# Check if user is logged in to Vercel
check_vercel_login() {
    print_status "Checking Vercel authentication..."
    if vercel whoami &> /dev/null; then
        print_success "User is logged in to Vercel"
    else
        print_error "User not logged in to Vercel"
        print_status "Please run: vercel login"
        exit 1
    fi
}

# Build the project
build_project() {
    print_status "Building project..."
    
    # Clean previous builds
    rm -rf dist
    
    # Install dependencies
    print_status "Installing dependencies..."
    npm ci
    
    # Build the project
    print_status "Building frontend and backend..."
    npm run build
    
    # Verify build artifacts
    if [[ -f "dist/index.html" && -f "dist/api/index.js" ]]; then
        print_success "Build completed successfully"
    else
        print_error "Build failed - missing artifacts"
        exit 1
    fi
}

# Deploy to Vercel
deploy_to_vercel() {
    print_status "Deploying to Vercel..."
    
    # Check if project is already linked
    if [[ -f ".vercel/project.json" ]]; then
        print_status "Existing Vercel project found"
    else
        print_status "Linking to Vercel project..."
        vercel link --yes
    fi
    
    # Pull environment variables
    print_status "Pulling environment variables..."
    vercel env pull .env.production
    
    # Build for production
    print_status "Building for production..."
    vercel build --prod
    
    # Deploy
    print_status "Deploying to production..."
    DEPLOYMENT_URL=$(vercel deploy --prebuilt --prod)
    
    print_success "Deployment completed!"
    print_success "Live URL: $DEPLOYMENT_URL"
    
    # Save deployment info
    echo "DEPLOYMENT_URL=$DEPLOYMENT_URL" > deployment-info.txt
    echo "DEPLOYMENT_TIME=$(date)" >> deployment-info.txt
}

# Post-deployment setup
post_deployment_setup() {
    print_status "Setting up post-deployment configuration..."
    
    # Get the deployment URL
    if [[ -f "deployment-info.txt" ]]; then
        source deployment-info.txt
        
        print_status "Please add the following URL to your Supabase allowed origins:"
        print_warning "$DEPLOYMENT_URL"
        print_warning "$DEPLOYMENT_URL/**"
        
        print_status "Also add these URLs to Stripe webhook endpoints if using payments"
    fi
}

# Main deployment process
main() {
    echo "Starting automated deployment process..."
    
    check_vercel_cli
    check_vercel_login
    build_project
    deploy_to_vercel
    post_deployment_setup
    
    print_success "🎉 Automated deployment completed successfully!"
    print_status "Check deployment-info.txt for details"
}

# Handle script interruption
trap 'print_error "Deployment interrupted"; exit 1' INT TERM

# Run main function
main "$@"