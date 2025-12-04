# Firebase Login Not Working - Fix Guide

## Problem Summary

When your application is hosted on Firebase, the login doesn't work because:
1. **The frontend is trying to connect to `localhost:5000`** - This only works on your local machine
2. **The backend needs to be deployed** - It must be accessible from the internet
3. **The frontend needs the backend URL configured** - Via environment variables

## Quick Diagnosis

1. **Open your browser's Developer Tools** (F12)
2. **Go to the Console tab**
3. **Try to login**
4. **Check the error messages** - You should see either:
   - "Cannot connect to backend server" - Backend not deployed or URL incorrect
   - "API Base URL: http://localhost:5000/api" - Frontend not configured with backend URL

## Solution Steps

### Step 1: Deploy Backend to Cloud Run

Your backend (Flask API) needs to be deployed to Google Cloud Run so it's accessible from Firebase Hosting.

**Option A: Using PowerShell Script (Recommended)**

1. Open PowerShell in the project root
2. Make sure you have `gcloud` CLI installed and authenticated:
   ```powershell
   gcloud auth login
   gcloud config set project smrtvocab
   ```
3. Run the deployment script:
   ```powershell
   .\deploy-backend-simple.ps1
   ```
4. **Save the service URL** that's displayed (e.g., `https://smrtvocab-api-xxxxx-uc.a.run.app`)

**Option B: Manual Deployment**

```powershell
cd backend
gcloud builds submit --tag gcr.io/smrtvocab/smrtvocab-api --project smrtvocab

gcloud run deploy smrtvocab-api `
  --image gcr.io/smrtvocab/smrtvocab-api `
  --platform managed `
  --region us-central1 `
  --allow-unauthenticated `
  --memory 512Mi `
  --cpu 1 `
  --timeout 300 `
  --max-instances 10 `
  --set-env-vars "ALLOWED_ORIGINS=https://smrtvocab.web.app,https://smrtvocab.firebaseapp.com" `
  --project smrtvocab
```

**After deployment, note the Service URL** (it will be displayed in the output)

### Step 2: Configure Frontend Environment Variable

1. Create a file `frontend/.env.production` with the following content:
   ```
   VITE_API_BASE_URL=https://YOUR-SERVICE-URL/api
   ```
   
   **Replace `YOUR-SERVICE-URL`** with the Cloud Run service URL from Step 1.
   
   For example:
   ```
   VITE_API_BASE_URL=https://smrtvocab-api-abc123-uc.a.run.app/api
   ```

2. **Important**: Make sure the URL:
   - Starts with `https://`
   - Ends with `/api`
   - Has no trailing slash

### Step 3: Rebuild and Redeploy Frontend

After setting the environment variable, you must rebuild the frontend and redeploy:

```powershell
cd frontend
npm run build
cd ..
firebase deploy --only hosting
```

**Why rebuild?** Vite (the build tool) bakes environment variables into the build at build time. You can't change them after deployment.

### Step 4: Verify Deployment

1. Visit your Firebase-hosted site: https://smrtvocab.web.app
2. Open Developer Tools (F12) → Console tab
3. You should see: `API Base URL: https://your-backend-url/api`
4. Try logging in

## Common Issues and Solutions

### Issue 1: "Cannot connect to backend server"

**Possible causes:**
- Backend not deployed
- Wrong URL in `.env.production`
- Backend service stopped/scaled to zero

**Solutions:**
1. Check if backend is deployed:
   ```powershell
   gcloud run services list --project smrtvocab
   ```
2. Check backend logs for errors:
   ```powershell
   gcloud run services logs read smrtvocab-api --region us-central1 --project smrtvocab --limit 50
   ```
3. Verify the URL in `frontend/.env.production` matches the Cloud Run service URL
4. Test backend directly in browser:
   - Go to: `https://YOUR-SERVICE-URL/api/settings/get`
   - Should return JSON, not an error

### Issue 2: CORS Errors in Browser Console

**Error message:** "Access to fetch at ... has been blocked by CORS policy"

**Solution:**
- Backend CORS is already configured in `backend/app.py`
- Make sure `ALLOWED_ORIGINS` environment variable includes your Firebase URL
- Redeploy backend if you changed CORS settings

### Issue 3: Frontend Still Using localhost URL

**Symptom:** Console shows `API Base URL: http://localhost:5000/api`

**Cause:** Frontend wasn't rebuilt after setting environment variable

**Solution:**
1. Verify `frontend/.env.production` exists and has correct URL
2. Delete `frontend/dist` folder (old build)
3. Rebuild:
   ```powershell
   cd frontend
   npm run build
   cd ..
   firebase deploy --only hosting
   ```

### Issue 4: Backend Returns 502/503 Errors

**Possible causes:**
- Backend container crashed
- Backend startup failed
- Resource limits exceeded

**Solutions:**
1. Check Cloud Run logs:
   ```powershell
   gcloud run services logs read smrtvocab-api --region us-central1 --project smrtvocab
   ```
2. Verify backend starts locally:
   ```powershell
   cd backend
   python app.py
   ```
3. Check Cloud Run service status in Google Cloud Console

### Issue 5: Login Says "Incorrect email or password" but Credentials are Correct

**Possible causes:**
- Backend CSV files (AccountInformation.csv) not accessible in Cloud Run
- CSV files weren't included in Docker image
- Different backend instance (local vs deployed)

**Solutions:**
1. **Important**: Cloud Run containers are ephemeral - files written at runtime are lost on restart
2. For production, you need to migrate from CSV files to a database (Firestore/Cloud SQL)
3. For testing, you can:
   - Create accounts directly via the deployed backend's register endpoint
   - Or include initial CSV in Docker image (data will persist for that image version)

## Testing Checklist

- [ ] Backend deployed to Cloud Run and URL obtained
- [ ] `frontend/.env.production` created with correct backend URL
- [ ] Frontend rebuilt (`npm run build`)
- [ ] Frontend redeployed to Firebase (`firebase deploy --only hosting`)
- [ ] Browser console shows correct API URL (not localhost)
- [ ] Can access backend directly: `https://YOUR-URL/api/settings/get`
- [ ] No CORS errors in browser console
- [ ] Login works with test credentials

## Next Steps for Production

For a production-ready application, consider:

1. **Database Migration**: Move from CSV files to Firestore or Cloud SQL
   - User accounts
   - Classroom data
   - User progress
   - Assignments

2. **Persistent Storage**: Use Cloud Storage for:
   - Audio files (TTS cache)
   - User-uploaded content

3. **Authentication**: Consider Firebase Authentication instead of CSV-based auth

4. **Environment Variables**: Use Firebase Hosting environment variables or Cloud Run secrets

## Getting Help

If you're still stuck:

1. **Check browser console** for specific error messages
2. **Check backend logs**: `gcloud run services logs read smrtvocab-api --region us-central1 --project smrtvocab`
3. **Verify URLs match**:
   - Frontend `.env.production`: `VITE_API_BASE_URL=https://.../api`
   - Cloud Run service URL
4. **Test backend directly** by visiting API endpoints in browser

## Quick Reference Commands

```powershell
# Deploy backend
.\deploy-backend-simple.ps1

# Get backend URL
gcloud run services describe smrtvocab-api --region us-central1 --project smrtvocab --format 'value(status.url)'

# Check backend logs
gcloud run services logs read smrtvocab-api --region us-central1 --project smrtvocab --limit 50

# Rebuild and deploy frontend
cd frontend
npm run build
cd ..
firebase deploy --only hosting
```






