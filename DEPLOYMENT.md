# Firebase Deployment Guide

This guide will help you deploy the SMRT Vocab app to Firebase.

## Prerequisites

1. **Google Cloud SDK (gcloud)** installed and configured
   - Download from: https://cloud.google.com/sdk/docs/install
   - Authenticate: `gcloud auth login`
   - Set project: `gcloud config set project smrtvocab`

2. **Docker** installed and running
   - Required for building Cloud Run containers

3. **Firebase CLI** installed
   - `npm install -g firebase-tools`
   - Authenticate: `firebase login`

## Current Issues Fixed

✅ Frontend API URL now uses environment variables
✅ Backend CORS configured for Firebase Hosting domain
✅ Dockerfile created for Cloud Run deployment
✅ Backend configured for production environment
✅ `.dockerignore` updated to include template CSV files (excludes user data)
✅ `.gcloudignore` created to optimize Cloud Build
✅ Deployment scripts improved with error handling and validation
✅ App initialization ensures directories exist on startup

## Deployment Steps

### Step 1: Deploy Backend to Cloud Run

The backend needs to be deployed to Cloud Run so it's accessible from the internet.

**Option A: Using PowerShell (Windows)**
```powershell
.\deploy-backend.ps1
```

**Option B: Using Bash (Linux/Mac)**
```bash
chmod +x deploy-backend.sh
./deploy-backend.sh
```

**Option C: Manual Deployment**

1. Build and deploy:
```bash
cd backend
gcloud builds submit --tag gcr.io/smrtvocab/smrtvocab-api --project smrtvocab

gcloud run deploy smrtvocab-api \
  --image gcr.io/smrtvocab/smrtvocab-api \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars "ALLOWED_ORIGINS=https://smrtvocab.web.app,https://smrtvocab.firebaseapp.com" \
  --project smrtvocab
```

2. **Save the service URL** that's displayed after deployment (e.g., `https://smrtvocab-api-xxxxx-uc.a.run.app`)

### Step 2: Configure Frontend Environment

1. Create `frontend/.env.production` file:
```env
VITE_API_BASE_URL=https://YOUR-CLOUD-RUN-URL/api
```

Replace `YOUR-CLOUD-RUN-URL` with the URL from Step 1.

### Step 3: Build and Deploy Frontend

```bash
cd frontend
npm install
npm run build
cd ..
firebase deploy --only hosting
```

## Testing

1. Visit https://smrtvocab.web.app
2. Try logging in with test account: `test@test` / `test`
3. Check browser console for any errors

## Troubleshooting

### Login Not Working

1. **Check API URL**: Open browser DevTools → Network tab → Check if API calls are going to the correct URL
2. **Check CORS**: Backend logs should show CORS errors if there's an issue
3. **Check Backend Logs**: 
   ```bash
   gcloud run services logs read smrtvocab-api --region us-central1 --project smrtvocab
   ```

### Backend Not Accessible

1. **Check Cloud Run Service**: Visit Google Cloud Console → Cloud Run → Check if service is running
2. **Check Permissions**: Ensure service allows unauthenticated access
3. **Test Backend Directly**: Try accessing `https://YOUR-CLOUD-RUN-URL/api/settings/get` in browser

### File Storage Issues

**Important**: Cloud Run containers are ephemeral. Files written to the filesystem will be lost when containers restart.

**Current Behavior:**
- Template CSV files are included in the Docker image (persistent)
- User data CSV files are created at runtime but will be lost on container restart
- Audio files are generated and cached, but will be lost on restart

**For Production Use**, consider migrating to:
- **Firestore** for CSV data (users, classrooms, assignments, progress)
- **Cloud Storage** for audio files (persistent TTS cache)
- **Cloud SQL** or **Firestore** for account information

**Workaround for Testing:**
- The app will work for testing and demos
- User registrations and study progress will persist during a single session
- Data will be lost when the Cloud Run service restarts or scales to zero

## Environment Variables

### Backend (Cloud Run)
- `ALLOWED_ORIGINS`: Comma-separated list of allowed origins for CORS
- `PORT`: Port number (set automatically by Cloud Run)
- `FLASK_ENV`: Set to `production`

### Frontend (Build-time)
- `VITE_API_BASE_URL`: Backend API URL (set in `.env.production`)

## Quick Deploy Script

After initial setup, you can use the provided scripts to redeploy:

**Windows (PowerShell):**
```powershell
.\deploy-backend.ps1
```

**Linux/Mac (Bash):**
```bash
chmod +x deploy-backend.sh
./deploy-backend.sh
```

**Manual Deployment:**

```bash
# Deploy backend
cd backend
gcloud builds submit --tag gcr.io/smrtvocab/smrtvocab-api --project smrtvocab
gcloud run deploy smrtvocab-api \
  --image gcr.io/smrtvocab/smrtvocab-api \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --timeout 300 \
  --max-instances 10 \
  --set-env-vars "ALLOWED_ORIGINS=https://smrtvocab.web.app,https://smrtvocab.firebaseapp.com" \
  --project smrtvocab

# Get service URL and update frontend/.env.production
SERVICE_URL=$(gcloud run services describe smrtvocab-api --region us-central1 --project smrtvocab --format 'value(status.url)')
echo "VITE_API_BASE_URL=${SERVICE_URL}/api" > ../frontend/.env.production

# Deploy frontend
cd ../frontend
npm run build
cd ..
firebase deploy --only hosting
```

## Deployment Checklist

Before deploying, ensure:

- [ ] Google Cloud SDK (gcloud) is installed and authenticated
- [ ] Docker is installed and running
- [ ] Firebase CLI is installed and authenticated
- [ ] Template CSV files exist in `backend/UserWords/Template_*.csv`
- [ ] Project ID matches in `.firebaserc` and deployment scripts
- [ ] Frontend `.env.production` is configured with backend URL (after first backend deployment)

## Troubleshooting Deployment

### Docker Build Fails

1. **Check template CSV files**: Ensure `backend/UserWords/Template_*.csv` files exist
2. **Check .dockerignore**: Verify it's not excluding necessary files
3. **Check Dockerfile**: Ensure all dependencies are listed in requirements.txt

### Cloud Run Deployment Fails

1. **Check permissions**: Ensure you have Cloud Run Admin role
2. **Check project**: Verify project ID is correct
3. **Check quotas**: Ensure you haven't exceeded Cloud Run quotas
4. **Check logs**: `gcloud run services logs read smrtvocab-api --region us-central1 --project smrtvocab`

### Backend Not Responding

1. **Check service status**: Visit Google Cloud Console → Cloud Run
2. **Check logs**: Look for startup errors
3. **Check CORS**: Verify ALLOWED_ORIGINS includes your frontend URL
4. **Test endpoint**: Try accessing `https://YOUR-SERVICE-URL/api/settings/get` directly

