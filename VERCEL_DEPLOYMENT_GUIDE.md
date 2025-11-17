# Vercel Deployment Guide for VaccineTrack

## Prerequisites
- Vercel account (sign up at https://vercel.com)
- Your project code ready in this repository

## Step 1: Connect to Vercel

1. Go to https://vercel.com
2. Click "New Project"
3. Import your Git repository (GitHub, GitLab, or Bitbucket)
4. Select the repository containing this VaccineTrack project

## Step 2: Configure Environment Variables

In your Vercel project dashboard:

1. Go to Settings → Environment Variables
2. Add the following variables:

### Required Variables:
```
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
VITE_SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
STRIPE_SECRET_KEY=your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret_here
JWT_SECRET=your_jwt_secret_here_min_32_characters
PORT=3001
NODE_ENV=production
```

### Getting Your Keys:
- **Supabase**: Get from your Supabase project settings
- **Stripe**: Get from your Stripe dashboard (https://dashboard.stripe.com/test/apikeys)
- **JWT Secret**: Generate a secure random string (minimum 32 characters)

## Step 3: Configure Build Settings

Vercel should automatically detect the build configuration from `vercel.json`. The build settings are:

- **Build Command**: `npm run build:vercel`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

## Step 4: Deploy

1. Click "Deploy" in Vercel
2. Wait for the build to complete (should take 2-3 minutes)
3. Once deployed, you'll get a URL like: `https://your-project-name.vercel.app`

## Step 5: Configure Supabase (Important!)

After deployment, you need to add your Vercel URL to Supabase allowed origins:

1. Go to your Supabase project dashboard
2. Navigate to Authentication → URL Configuration
3. Add your Vercel URL to the list of allowed redirect URLs
4. Format: `https://your-project-name.vercel.app/**`

## Step 6: Test Your Deployment

1. Visit your deployed URL
2. Test the landing page functionality
3. Try parent registration and login
4. Test clinic authentication
5. Verify subscription functionality

## Troubleshooting

### Build Fails
- Check that all environment variables are set correctly
- Verify your Supabase and Stripe keys are valid
- Check the build logs in Vercel dashboard

### Authentication Issues
- Ensure Supabase allowed origins include your Vercel URL
- Verify JWT secret is properly set
- Check that user roles are created in Supabase

### API Routes Not Working
- Verify the API routes are accessible at `/api/*`
- Check that the service role key has proper permissions
- Review the health check endpoint: `/api/health`

### PWA Features Not Working
- Ensure HTTPS is enabled (Vercel provides this automatically)
- Check that service worker is registered
- Verify manifest.json is accessible

## Features Available After Deployment

✅ **Landing Page**: Modern, responsive design
✅ **Parent Authentication**: Registration, login, profile management
✅ **Clinic Authentication**: Separate clinic portal access
✅ **Parent Dashboard**: Child management, vaccination tracking
✅ **Subscription Management**: Stripe integration for parent plans
✅ **PWA Functionality**: Offline access, installable app
✅ **Multi-tenant Architecture**: Isolated data for parents and clinics
✅ **Responsive Design**: Works on mobile and desktop

## Support

If you encounter issues:
1. Check Vercel deployment logs
2. Verify all environment variables
3. Test locally first with `npm run build:vercel`
4. Check browser console for client-side errors
5. Review API endpoints with `/api/health`