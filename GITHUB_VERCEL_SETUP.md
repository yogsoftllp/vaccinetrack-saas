# 🔧 GitHub & Vercel Setup Guide for admin@yogsoft.com

## 🎯 Objective: Deploy VaccineTrack to Vercel from YOUR GitHub Account

Since your project is currently in local workspace, we need to:
1. Create a GitHub repository under your account (admin@yogsoft.com)
2. Push the VaccineTrack code to your repository
3. Connect Vercel to YOUR repository
4. Deploy successfully

## 📋 Prerequisites

- Your GitHub account: admin@yogsoft.com
- Vercel account connected to the same GitHub account
- VaccineTrack project code ready (✅ already built successfully)

## 🚀 Step-by-Step Process

### Step 1: Create GitHub Repository

1. **Go to GitHub**: https://github.com
2. **Sign in** with admin@yogsoft.com
3. **Create new repository**:
   - Click "+" → "New repository"
   - Repository name: `vaccinetrack-saas`
   - Description: "VaccineTrack - Multi-tenant vaccination tracking SaaS platform with PWA"
   - Make it **Public** (for easier Vercel deployment)
   - **Don't** initialize with README (we have our own)
   - **Don't** add .gitignore (we have our own)
   - **Don't** add license (we'll add later if needed)
   - Click "Create repository"

4. **Copy the repository URL** (should look like):
   ```
   https://github.com/yourusername/vaccinetrack-saas.git
   ```

### Step 2: Configure Local Git Repository

In your terminal, run these commands:

```bash
# Set your correct email (if not already set)
git config user.email "admin@yogsoft.com"
git config user.name "Your Name"

# Add the GitHub remote (replace with YOUR repository URL)
git remote add origin https://github.com/yourusername/vaccinetrack-saas.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### Step 3: Verify GitHub Repository

1. Go to your repository on GitHub
2. Verify all files are there:
   - `src/` folder with React components
   - `api/` folder with backend code
   - `public/` folder with assets
   - Configuration files (vercel.json, package.json, etc.)
   - GitHub Actions workflows in `.github/workflows/`

### Step 4: Connect Vercel to YOUR Repository

1. **Go to Vercel**: https://vercel.com
2. **Sign in** with the same GitHub account (admin@yogsoft.com)
3. **Create New Project**:
   - Click "New Project"
   - You should see your `vaccinetrack-saas` repository
   - Click "Import"

### Step 5: Configure Vercel Project

Vercel should auto-detect these settings:
- **Framework**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

If not detected, set them manually.

### Step 6: Set Environment Variables

Add these environment variables in Vercel:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://nvzwphocyychznptuycu.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52endwaG9jeXljaHpucHR1eWN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMwMDQ4MDMsImV4cCI6MjA3ODU4MDgwM30._VZm-17s22HZM9RnrK0BPJWLjnsI7wb19V8M6VVAzag
VITE_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52endwaG9jeXljaHpucHR1eWN1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzAwNDgwMywiZXhwIjoyMDc4NTgwODAzfQ.Xt5r1_BhYCMO-RMb5p0v_93Na1DmwPQO__JGuwQbYmg

# JWT Secret (Generate your own - minimum 32 characters)
JWT_SECRET=your_super_secret_key_here_minimum_32_characters

# Stripe (Optional - for payments)
STRIPE_SECRET_KEY=sk_test_your_stripe_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Server Configuration
NODE_ENV=production
PORT=3001
```

### Step 7: Deploy

1. Click "Deploy" button
2. Wait 2-3 minutes for build to complete
3. You'll get your deployment URL

### Step 8: Post-Deployment Setup

1. **Add Vercel URL to Supabase**:
   - Go to Supabase dashboard
   - Authentication → URL Configuration
   - Add: `https://your-project-name.vercel.app` and `https://your-project-name.vercel.app/**`

2. **Test your deployment**:
   - Visit your Vercel URL
   - Test parent registration
   - Test clinic login
   - Test PWA installation

## 🔧 Common Issues & Solutions

### Issue: "Repository not found" in Vercel
**Solution**: Ensure you're signed into Vercel with the same GitHub account (admin@yogsoft.com)

### Issue: "Permission denied" when pushing to GitHub
**Solution**: 
```bash
# Check your GitHub credentials
git config user.email
# Should show: admin@yogsoft.com

# If wrong, fix it:
git config user.email "admin@yogsoft.com"
git config user.name "Your Name"
```

### Issue: Build fails on Vercel
**Solution**: 
- Check environment variables are set correctly
- Verify all Supabase keys are valid
- Check Vercel build logs for specific errors

### Issue: Authentication not working
**Solution**: 
- Ensure Supabase allowed origins include your Vercel URL
- Check JWT secret is properly configured
- Verify user roles exist in database

## ✅ Success Verification

After completing these steps, you should have:
- ✅ GitHub repository under admin@yogsoft.com
- ✅ All VaccineTrack code pushed to your repository
- ✅ Vercel connected to YOUR repository
- ✅ Successful deployment
- ✅ Working application at your Vercel URL

## 🎯 What You'll Get

- **Multi-tenant SaaS Platform**: Parent and clinic portals
- **PWA**: Installable app with offline functionality
- **Authentication**: JWT-based login for both user types
- **Payments**: Stripe integration for subscriptions
- **Vaccination Tracking**: Automated reminders and scheduling
- **Responsive Design**: Works on mobile and desktop
- **Automated Deployment**: CI/CD pipeline with GitHub Actions

**Estimated Time**: 20-30 minutes

Ready to start? Create your GitHub repository first, then let me know the repository URL so I can help you with the next steps! 🚀