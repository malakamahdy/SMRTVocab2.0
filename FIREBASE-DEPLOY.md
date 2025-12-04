# Firebase Deployment Guide (Using IDE/Firebase CLI)

Since you're already authenticated with Firebase CLI and have access to the project, here's how to deploy:

## Current Status

✅ **Firebase CLI**: Authenticated as vosspurkey@gmail.com  
✅ **Firebase Project**: smrtvocab (current)  
✅ **Firebase CLI Version**: 14.17.0  

## Frontend Deployment (Firebase Hosting)

Since you're authenticated with Firebase, you can deploy the frontend directly:

### Step 1: Build the Frontend

```powershell
cd frontend
npm run build
cd ..
```

### Step 2: Deploy to Firebase Hosting

```powershell
firebase deploy --only hosting
```

That's it! Your frontend will be live at:
- https://smrtvocab.web.app
- https://smrtvocab.firebaseapp.com

## Backend Deployment (Cloud Run)

For the backend, you need `gcloud` CLI, but you can authenticate it with the same Google account.

### Option 1: Install gcloud and Authenticate (Recommended)

1. **Install Google Cloud SDK:**
   - Download: https://cloud.google.com/sdk/docs/install
   - Or use Chocolatey: `choco install gcloudsdk`

2. **Authenticate with the same account:**
   ```powershell
   gcloud auth login
   ```
   (Use vosspurkey@gmail.com - same account as Firebase)

3. **Set the project:**
   ```powershell
   gcloud config set project smrtvocab
   ```

4. **Enable required APIs:**
   ```powershell
   gcloud services enable cloudbuild.googleapis.com
   gcloud services enable run.googleapis.com
   ```

5. **Deploy backend:**
   ```powershell
   powershell -ExecutionPolicy Bypass -File .\deploy-backend-simple.ps1
   ```

### Option 2: Use Firebase Functions (Alternative)

If you prefer to stay within Firebase ecosystem, you could migrate the backend to Firebase Functions, but this requires code restructuring.

### Option 3: Manual Cloud Run Deployment via Console

1. Go to: https://console.cloud.google.com/cloud-build/builds?project=smrtvocab
2. Click "Create Build"
3. Upload the backend folder as a zip
4. Use the Dockerfile to build
5. Deploy to Cloud Run from the console

## Quick Deploy Script (Frontend Only)

Since you're authenticated with Firebase, you can use this simple script:

```powershell
# Build and deploy frontend
cd frontend
npm run build
cd ..
firebase deploy --only hosting
```

## After Backend Deployment

Once the backend is deployed to Cloud Run:

1. **Get the backend URL** (from Cloud Run console or deployment output)

2. **Create `frontend\.env.production`:**
   ```
   VITE_API_BASE_URL=https://YOUR-BACKEND-URL/api
   ```

3. **Rebuild and redeploy frontend:**
   ```powershell
   cd frontend
   npm run build
   cd ..
   firebase deploy --only hosting
   ```

## Troubleshooting

### Firebase Authentication Issues

If you need to re-authenticate:
```powershell
firebase login
firebase use smrtvocab
```

### Check Current Project

```powershell
firebase use
```

### View Deployment History

```powershell
firebase hosting:channel:list
```

## Summary

- **Frontend**: Use `firebase deploy --only hosting` (you're all set!)
- **Backend**: Need `gcloud` CLI, authenticate with same Google account, then deploy to Cloud Run

Since you're already in the Firebase project, frontend deployment should work immediately!

