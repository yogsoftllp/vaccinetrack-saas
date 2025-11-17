#!/bin/bash

# VaccineTrack SaaS Platform - Environment Setup Script
# This script helps you set up the required environment variables

set -e

echo "🚀 VaccineTrack SaaS Platform - Environment Setup"
echo "================================================"
echo ""

# Check if .env file exists
if [ -f .env ]; then
    read -p "⚠️  .env file already exists. Do you want to overwrite it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Setup cancelled."
        exit 0
    fi
fi

# Function to prompt for required variables
prompt_required() {
    local var_name=$1
    local description=$2
    local value=""
    
    while [ -z "$value" ]; do
        read -p "Enter $description: " value
        if [ -z "$value" ]; then
            echo "❌ This field is required. Please try again."
        fi
    done
    
    echo "$var_name=$value" >> .env
    echo "✅ $var_name set"
}

# Function to prompt for optional variables
prompt_optional() {
    local var_name=$1
    local description=$2
    local default_value=$3
    local value=""
    
    read -p "Enter $description (default: $default_value): " value
    if [ -z "$value" ]; then
        value=$default_value
    fi
    
    echo "$var_name=$value" >> .env
    echo "✅ $var_name set"
}

# Create new .env file
echo "# VaccineTrack SaaS Platform - Environment Variables" > .env
echo "# Generated on $(date)" >> .env
echo "" >> .env

echo "🔧 Setting up required environment variables..."
echo ""

# Required variables
echo "📊 Supabase Configuration (Required)"
echo "You can find these in your Supabase project settings."
prompt_required "SUPABASE_URL" "Supabase Project URL (format: https://your-project.supabase.co)"
prompt_required "SUPABASE_ANON_KEY" "Supabase Anon Key"
prompt_required "SUPABASE_SERVICE_ROLE_KEY" "Supabase Service Role Key"

echo ""
echo "🔐 JWT Configuration (Required)"
echo "This should be a long, random string for security."
prompt_required "JWT_SECRET" "JWT Secret Key (generate a random string)"

echo ""
echo "💳 Stripe Configuration (Optional)"
echo "Set these up if you want payment processing."
read -p "Do you want to set up Stripe integration? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    prompt_required "STRIPE_SECRET_KEY" "Stripe Secret Key (starts with sk_test_ or sk_live_)"
    prompt_required "STRIPE_WEBHOOK_SECRET" "Stripe Webhook Secret (starts with whsec_)"
fi

echo ""
echo "⚙️  Application Configuration (Optional)"
prompt_optional "NODE_ENV" "Node Environment" "production"
prompt_optional "PORT" "Port Number" "3000"

echo ""
echo "🎉 Environment setup complete!"
echo ""
echo "Your .env file has been created with the following variables:"
echo ""
cat .env | grep -v "^#" | grep -v "^$"
echo ""
echo "Next steps:"
echo "1. Review your .env file to ensure all values are correct"
echo "2. Set up your Supabase database migrations"
echo "3. Deploy using: ./one-click-deploy.sh"
echo "4. Configure Stripe webhooks if using payments"
echo ""
echo "For detailed deployment instructions, see: AUTOMATED_DEPLOYMENT_GUIDE.md"