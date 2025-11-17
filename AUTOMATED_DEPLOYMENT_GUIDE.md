# VaccineTrack SaaS Platform - Automated Deployment Guide

## 🚀 One-Click Deployment

Your VaccineTrack SaaS platform is now ready for automated deployment! This guide will walk you through the complete deployment process.

## 📋 Prerequisites

Before deploying, ensure you have:

1. **GitHub Account**: Connected to your Vercel account
2. **Vercel Account**: With GitHub integration enabled
3. **Supabase Project**: With database configured
4. **Stripe Account**: For payment processing (optional)

## 🔧 Environment Variables

Set these environment variables in your Vercel dashboard:

### Required Variables
```
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
JWT_SECRET=your_jwt_secret_key
```

### Optional Variables (for Stripe integration)
```
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
```

## 🚀 Deployment Options

### Option 1: One-Click Deployment Script

Run the automated deployment script:

```bash
./one-click-deploy.sh
```

This script will:
- Install dependencies
- Build the project
- Deploy to Vercel
- Provide deployment status

### Option 2: GitHub Actions (Automated)

The repository includes GitHub Actions workflow that automatically deploys to Vercel when you push to the main branch.

**Setup steps:**
1. Add these secrets to your GitHub repository:
   - `VERCEL_TOKEN`: Your Vercel API token
   - `VERCEL_ORG_ID`: Your Vercel organization ID
   - `VERCEL_PROJECT_ID`: Your Vercel project ID

2. Push to main branch:
```bash
git push origin main
```

The workflow will automatically:
- Install dependencies
- Run tests
- Build the project
- Deploy to Vercel

### Option 3: Manual Vercel Deployment

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Deploy:
```bash
vercel --prod
```

## 📊 Post-Deployment Setup

### 1. Database Migration

After deployment, run your Supabase migrations:

```bash
# Apply parent isolation schema
supabase db push supabase/migrations/2025111601_create_parent_isolation.sql
```

### 2. Stripe Webhook Configuration (if using Stripe)

1. Go to your Stripe Dashboard
2. Create a webhook endpoint
3. Set the URL to: `https://your-domain.com/api/parent-subscriptions/webhook`
4. Select these events:
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`

### 3. Supabase Configuration

Update your Supabase project settings:

1. **Authentication Settings**:
   - Set JWT secret to match your `JWT_SECRET` environment variable
   - Configure email templates if needed

2. **Database Settings**:
   - Ensure RLS policies are enabled
   - Verify table permissions for `anon` and `authenticated` roles

3. **API Settings**:
   - Add your Vercel deployment URL to allowed origins
   - Configure rate limiting as needed

## 🔍 Verification

After deployment, verify these endpoints:

### Health Check
```
GET https://your-domain.com/api/health
```

### Parent Authentication
```
POST https://your-domain.com/api/parent-auth/register
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "password123",
  "firstName": "Test",
  "lastName": "User",
  "phone": "+1234567890"
}
```

### Landing Page
```
GET https://your-domain.com
```

## 🛠 Troubleshooting

### Common Issues

1. **Build Failures**:
   - Check Node.js version (should be 18+)
   - Verify all dependencies are installed
   - Check for TypeScript compilation errors

2. **Database Connection Issues**:
   - Verify Supabase credentials
   - Check network connectivity
   - Ensure RLS policies are properly configured

3. **Authentication Issues**:
   - Verify JWT secret consistency
   - Check token expiration settings
   - Ensure proper CORS configuration

4. **Stripe Integration Issues**:
   - Verify webhook endpoint URL
   - Check Stripe API keys
   - Ensure webhook events are properly configured

### Getting Help

If you encounter issues:

1. Check the deployment logs in Vercel dashboard
2. Review GitHub Actions workflow logs
3. Check browser console for frontend errors
4. Verify all environment variables are set correctly

## 🎉 Success!

Once deployed, your VaccineTrack SaaS platform will be available at your Vercel domain with:

- ✅ Multi-tenant clinic management
- ✅ Parent portal with vaccination tracking
- ✅ Stripe payment integration
- ✅ PWA functionality with offline support
- ✅ Automated vaccination reminders
- ✅ Comprehensive admin dashboard

## 📈 Next Steps

1. **Custom Domain**: Set up a custom domain in Vercel
2. **Email Configuration**: Configure email notifications
3. **Monitoring**: Set up application monitoring
4. **Scaling**: Configure auto-scaling settings
5. **Security**: Implement additional security measures

---

**🚀 Your VaccineTrack SaaS platform is now live and ready to serve parents and clinics worldwide!**