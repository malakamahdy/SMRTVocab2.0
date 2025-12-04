# Quick Fix: Script Won't Run

## Option 1: Use the New Easy Script

Try this simpler script:

```powershell
powershell -ExecutionPolicy Bypass -File .\deploy-backend-easy.ps1
```

## Option 2: Run Commands Manually (Most Reliable)

If scripts don't work, just run these commands one by one:

### 1. Build the backend
```powershell
cd backend
gcloud builds submit --tag gcr.io/smrtvocab/smrtvocab-api --project smrtvocab
```

Wait for it to finish (takes 5-10 minutes)

### 2. Deploy to Cloud Run
```powershell
gcloud run deploy smrtvocab-api --image gcr.io/smrtvocab/smrtvocab-api --platform managed --region us-central1 --allow-unauthenticated --set-env-vars "ALLOWED_ORIGINS=https://smrtvocab.web.app,https://smrtvocab.firebaseapp.com" --project smrtvocab --memory 512Mi --cpu 1 --timeout 300 --max-instances 10
```

### 3. Get the URL
```powershell
gcloud run services describe smrtvocab-api --region us-central1 --project smrtvocab --format "value(status.url)"
```

**Copy that URL!**

### 4. Configure frontend
Create `frontend\.env.production`:
```
VITE_API_BASE_URL=https://YOUR-URL-HERE/api
```

### 5. Deploy frontend
```powershell
cd ..
cd frontend
npm run build
cd ..
firebase deploy --only hosting
```

## Common Issues

### "Script won't execute"
- Use Option 2 (manual steps) instead
- Or check PowerShell execution policy

### "gcloud not found"
- Install Google Cloud SDK: https://cloud.google.com/sdk/docs/install
- Then run: `gcloud auth login`

### "API not enabled"
Run these:
```powershell
gcloud services enable cloudbuild.googleapis.com --project smrtvocab
gcloud services enable run.googleapis.com --project smrtvocab
```

## See Full Guide

For detailed troubleshooting, see: `DEPLOY-MANUAL-STEPS.md`






