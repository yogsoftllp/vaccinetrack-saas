# Deploy to Render

This guide will help you deploy VaccineTrack to Render with both frontend and backend services.

## Prerequisites

1. Render account (https://render.com)
2. Supabase project configured
3. Stripe account for payments (optional)
4. All environment variables ready

## Step 1: Fork and Connect Repository

1. Fork this repository to your GitHub account
2. Go to [Render Dashboard](https://dashboard.render.com)
3. Click "New Web Service"
4. Connect your GitHub repository
5. Select the repository and branch

## Step 2: Deploy Frontend (Static Site)

**Service Type**: Static Site
**Name**: vaccinetrack-frontend
**Build Command**: `npm run build:frontend`
**Publish Directory**: `dist`

**Environment Variables**:
```
NODE_VERSION=18
NPM_VERSION=9
```

## Step 3: Deploy Backend (Web Service)

**Service Type**: Web Service
**Name**: vaccinetrack-backend
**Build Command**: `npm install`
**Start Command**: `npm run server:dev`

**Environment Variables**:
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

## Step 4: Configure Frontend API URL

After both services are deployed:

1. Get your backend URL from Render dashboard
2. Update frontend environment variables:
   ```
   VITE_API_URL=https://your-backend-url.onrender.com
   ```
3. Redeploy frontend service

## Step 5: Configure Supabase

1. Go to your Supabase project settings
2. Add your Render frontend URL to "Allowed Origins"
3. Add your Render backend URL to "Allowed Origins"
4. Update your database with the migration files

## Step 6: Configure Stripe (Optional)

1. Add your backend webhook endpoint: `https://your-backend-url.onrender.com/api/stripe/webhook`
2. Test the webhook connection
3. Configure your subscription plans

## Features After Deployment

✅ **PWA Functionality**: Installable app with offline support
✅ **Multi-tenant SaaS**: Separate clinic and parent portals
✅ **Payment Integration**: Stripe subscription management
✅ **Real-time Database**: Supabase with Row Level Security
✅ **Authentication**: JWT-based auth with role management
✅ **Vaccination Tracking**: Complete vaccination schedule management

## Monitoring and Maintenance

- Monitor logs in Render dashboard
- Set up alerts for service health
- Regular backups of your Supabase database
- Keep dependencies updated

## Troubleshooting

### Common Issues:

1. **Build Failures**: Check Node.js version compatibility
2. **Environment Variables**: Ensure all required variables are set
3. **CORS Issues**: Verify Supabase allowed origins
4. **Database Connection**: Check Supabase connection strings

### Support:

- Render Documentation: https://render.com/docs
- Supabase Documentation: https://supabase.com/docs
- Check deployment logs in Render dashboard

## Security Considerations

- Use strong JWT secrets
- Enable SSL/TLS on all services
- Regular security updates
- Monitor for vulnerabilities
- Implement proper access controls