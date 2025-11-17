# 🤖 VaccineTrack Automated Deployment Setup

This guide will help you set up fully automated deployment for your VaccineTrack application.

## 🚀 Quick Start (Recommended)

### Option 1: One-Command Deployment
```bash
# Make the script executable and run
chmod +x quick-deploy.sh
./quick-deploy.sh
```

Then manually deploy to Vercel:
1. Go to [vercel.com](https://vercel.com)
2. Import your Git repository
3. Set environment variables
4. Deploy!

### Option 2: Full Automation (Advanced)
```bash
# For complete automation with Vercel CLI
chmod +x deploy.sh
./deploy.sh
```

## 📋 Prerequisites

Before setting up automation, ensure you have:
- [ ] GitHub repository with your code
- [ ] Vercel account ([sign up here](https://vercel.com))
- [ ] Environment variables ready (see `vercel-env-template.txt`)

## 🔧 GitHub Actions Setup

### 1. Repository Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions

Add these secrets:

```
VERCEL_TOKEN=your_vercel_token_here
VERCEL_ORG_ID=your_vercel_org_id_here
VERCEL_PROJECT_ID=your_vercel_project_id_here
```

**How to get these values:**
- `VERCEL_TOKEN`: Go to Vercel → Settings → Tokens → Create Token
- `VERCEL_ORG_ID`: Run `vercel whoami` in terminal
- `VERCEL_PROJECT_ID`: Found in your Vercel project settings

### 2. Automated Workflows

Two workflows are provided:

#### Build Workflow (`.github/workflows/build.yml`)
- Triggers on every push/PR
- Builds and tests your application
- Uploads build artifacts
- Comments on PRs with build status

#### Vercel Deploy Workflow (`.github/workflows/deploy-vercel.yml`)
- Automatically deploys to Vercel
- Requires Vercel CLI setup
- Full CI/CD pipeline

## 🎯 Environment Variables

Create these in your Vercel dashboard:

```bash
# Required - Get from Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Required - Get from Stripe
STRIPE_SECRET_KEY=sk_test_your_stripe_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Required - Generate yourself
JWT_SECRET=your_32_character_secret_minimum

# Optional
NODE_ENV=production
PORT=3001
```

## 🔄 Automated Build Process

The automation handles:

1. **Code Quality Checks**
   - Dependency installation
   - Linting (if available)
   - Build verification

2. **Build Process**
   - Frontend compilation (Vite)
   - Backend preparation
   - PWA manifest generation
   - Service worker setup

3. **Deployment**
   - Vercel integration
   - Environment variable injection
   - Domain configuration
   - SSL certificate setup

4. **Post-Deployment**
   - Health checks
   - URL commenting on PRs
   - Build artifact storage

## 📱 Features After Deployment

✅ **Landing Page**: Modern, responsive design  
✅ **Parent Portal**: Registration, login, dashboard  
✅ **Clinic Portal**: Separate authentication system  
✅ **PWA**: Installable app with offline functionality  
✅ **Payments**: Stripe integration for subscriptions  
✅ **Multi-tenant**: Isolated data for parents vs clinics  
✅ **Vaccination Tracking**: Automated reminders and scheduling  

## 🚨 Troubleshooting

### Build Fails
```bash
# Check build locally first
npm run build

# Check for TypeScript errors
npm run check

# Verify environment variables
cat .env
```

### Deployment Issues
```bash
# Check Vercel logs
vercel logs your-project-name.vercel.app

# Verify environment variables in Vercel
vercel env ls

# Test API endpoints
curl https://your-project.vercel.app/api/health
```

### Authentication Problems
- Ensure Supabase allowed origins include your Vercel URL
- Check JWT secret is properly set
- Verify user roles exist in Supabase

## 🔗 Integration Checklist

**Before Going Live:**
- [ ] Add Vercel URL to Supabase allowed origins
- [ ] Configure Stripe webhook endpoints
- [ ] Test parent registration flow
- [ ] Test clinic authentication
- [ ] Verify PWA install prompt
- [ ] Test offline functionality
- [ ] Check vaccination reminder system
- [ ] Validate subscription management

## 📞 Support

If you encounter issues:
1. Check the build logs in GitHub Actions
2. Verify all environment variables are set
3. Test locally with `npm run build`
4. Check Vercel deployment logs
5. Review the troubleshooting section above

## 🎉 Success!

Once automated, every push to your main branch will:
1. Automatically build your project
2. Run quality checks
3. Deploy to Vercel
4. Comment with deployment status
5. Notify you of any issues

Your VaccineTrack application will be continuously deployed and ready for users!