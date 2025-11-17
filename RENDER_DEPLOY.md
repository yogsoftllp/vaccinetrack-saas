# Simplified Render Deployment for VaccineTrack

This is a simplified deployment configuration that deploys the frontend as a static site and uses a minimal backend server.

## Quick Deploy Instructions

### 1. Frontend (Static Site)

**Service Type**: Static Site
**Name**: vaccinetrack-frontend
**Build Command**: `npm install && npm run build:frontend`
**Publish Directory**: `dist`

**Environment Variables**:
```
NODE_VERSION=18
```

### 2. Backend (Web Service)

**Service Type**: Web Service
**Name**: vaccinetrack-backend
**Build Command**: `npm install`
**Start Command**: `npm run server:dev`

**Environment Variables** (add these in Render dashboard):
```
NODE_VERSION=18
PORT=10000
NODE_ENV=production
JWT_SECRET=your-super-secret-jwt-key-here
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

## Manual Deployment Steps

1. **Create Render Account**: Go to https://render.com and sign up

2. **Deploy Frontend**:
   - Click "New" → "Static Site"
   - Connect your GitHub repository
   - Use the settings above
   - Deploy

3. **Deploy Backend**:
   - Click "New" → "Web Service"
   - Connect the same repository
   - Use the backend settings above
   - Add all environment variables
   - Deploy

4. **Configure Frontend API URL**:
   - After backend is deployed, get the backend URL
   - Add to frontend environment variables:
     ```
     VITE_API_URL=https://your-backend-url.onrender.com
     ```
   - Redeploy frontend

5. **Configure Supabase**:
   - Add both Render URLs to Supabase "Allowed Origins"
   - Run database migrations

6. **Test Deployment**:
   - Visit your frontend URL
   - Test parent registration/login
   - Test clinic functionality
   - Verify PWA installability

## Features Available After Deployment

✅ **PWA Installable App**: Works offline with vaccination schedules
✅ **Multi-tenant SaaS**: Separate parent and clinic portals
✅ **Payment Integration**: Stripe subscription management
✅ **Real-time Database**: Supabase with Row Level Security
✅ **Complete Vaccination Tracking**: CDC-based schedules and reminders

## Monitoring

- Check Render dashboard for service health
- Monitor logs for any errors
- Set up alerts for downtime

## Support

- Render Documentation: https://render.com/docs
- Check deployment logs in Render dashboard
- Verify all environment variables are set correctly