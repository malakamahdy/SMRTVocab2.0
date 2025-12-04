# Quick Fix: Login Not Working on Firebase

## The Problem

Your frontend is hosted on Firebase, but it's trying to connect to `localhost:5000` which doesn't exist on the internet. You need to:

1. ✅ **Deploy your backend** to Cloud Run
2. ✅ **Tell your frontend** where the backend is (via environment variable)
3. ✅ **Rebuild and redeploy** the frontend

## Step-by-Step Fix (5 minutes)

### Step 1: Deploy Backend (if not already deployed)

Run this in PowerShell from the project root:

```powershell
.\deploy-backend-cloudbuild.ps1
```

**Note:** This script uses Cloud Build - you don't need Docker Desktop! It builds everything in the cloud.

**Save the service URL** shown at the end (looks like: `https://smrtvocab-api-xxxxx-uc.a.run.app`)

### Step 2: Configure Frontend

1. Create file: `frontend/.env.production`
2. Add this line (replace `YOUR-URL` with the URL from Step 1):

```
VITE_API_BASE_URL=https://YOUR-URL/api
```

Example:
```
VITE_API_BASE_URL=https://smrtvocab-api-abc123-uc.a.run.app/api
```

### Step 3: Rebuild and Redeploy Frontend

```powershell
cd frontend
npm run build
cd ..
firebase deploy --only hosting
```

### Step 4: Test

1. Visit: https://smrtvocab.web.app
2. Open browser DevTools (F12) → Console tab
3. Look for: `API Base URL: https://...` (should NOT be localhost)
4. Try logging in

## Common Issues

### "Docker Desktop is not running" Error

**You don't need Docker Desktop!** Use the new script:
```powershell
.\deploy-backend-cloudbuild.ps1
```

See `NO-DOCKER-NEEDED.md` for details.

## Still Not Working?

### Check Backend is Running

```powershell
gcloud run services list --project smrtvocab
```

### Check Backend Logs

```powershell
gcloud run services logs read smrtvocab-api --region us-central1 --project smrtvocab --limit 20
```

### Verify Environment Variable

1. Open `frontend/.env.production`
2. Make sure URL is correct (starts with `https://`, ends with `/api`)
3. Rebuild frontend: `cd frontend && npm run build && cd ..`
4. Redeploy: `firebase deploy --only hosting`

### Common Errors

- **"Cannot connect to backend server"** → Backend not deployed or wrong URL
- **Console shows `localhost:5000`** → Frontend not rebuilt after setting env var
- **CORS error** → Backend CORS config needs Firebase URL (already configured)

## Need More Help?

See `FIREBASE-LOGIN-FIX.md` for detailed troubleshooting.

