# VaccineTrack Deployment Instructions

## Quick Deploy Options:

### 1. Vercel (Recommended)
1. Go to https://vercel.com
2. Click "New Project"
3. Drag and drop this entire folder
4. Set environment variables
5. Deploy!

### 2. Heroku
1. Install Heroku CLI
2. Run: `heroku create your-app-name`
3. Run: `git init && git add . && git commit -m "Initial commit"`
4. Run: `heroku config:set NODE_ENV=production`
5. Run: `git push heroku main`

### 3. Render
1. Go to https://render.com
2. Create Web Service
3. Connect GitHub or upload files
4. Set build command: `npm install`
5. Set start command: `node server.js`

### 4. Any Node.js Server
1. Upload files to your server
2. Run: `npm install`
3. Run: `npm start`

## Environment Variables Required:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
JWT_SECRET=your_jwt_secret
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret
NODE_ENV=production
```

## Features Included:
- ✅ Multi-tenant SaaS architecture
- ✅ Parent and clinic dashboards
- ✅ PWA functionality
- ✅ Stripe payment integration
- ✅ JWT authentication
- ✅ Offline capabilities
- ✅ Vaccination tracking
- ✅ Automated reminders
