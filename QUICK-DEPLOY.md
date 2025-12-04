# Quick Deployment Guide

## If deployment scripts don't work, try these solutions:

### Solution 1: Run with Bypass Execution Policy

```powershell
powershell -ExecutionPolicy Bypass -File .\deploy-backend-simple.ps1
```

### Solution 2: Manual Step-by-Step

1. **Install Google Cloud SDK** (if not installed):
   - Download: https://cloud.google.com/sdk/docs/install
   - Install and restart terminal
   - Run: `gcloud auth login`

2. **Set your project:**
   ```powershell
   gcloud config set project smrtvocab
   ```

3. **Enable required APIs:**
   ```powershell
   gcloud services enable cloudbuild.googleapis.com
   gcloud services enable run.googleapis.com
   ```

4. **Build and deploy:**
   ```powershell
   cd backend
   gcloud builds submit --tag gcr.io/smrtvocab/smrtvocab-api --project smrtvocab
   
   gcloud run deploy smrtvocab-api `
     --image gcr.io/smrtvocab/smrtvocab-api `
     --platform managed `
     --region us-central1 `
     --allow-unauthenticated `
     --set-env-vars "ALLOWED_ORIGINS=https://smrtvocab.web.app,https://smrtvocab.firebaseapp.com" `
     --project smrtvocab `
     --memory 512Mi `
     --cpu 1 `
     --timeout 300 `
     --max-instances 10
   ```

5. **Get the service URL:**
   ```powershell
   gcloud run services describe smrtvocab-api --region us-central1 --project smrtvocab --format 'value(status.url)'
   ```

6. **Update frontend:**
   - Create `frontend\.env.production` with:
     ```
     VITE_API_BASE_URL=https://YOUR-SERVICE-URL/api
     ```
   - Replace `YOUR-SERVICE-URL` with the URL from step 5

### Solution 3: Change Execution Policy (One-time)

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Then run:
```powershell
.\deploy-backend.ps1
```

## Common Errors

### "gcloud not found"
→ Install Google Cloud SDK from https://cloud.google.com/sdk/docs/install

### "Docker not running"
→ Start Docker Desktop

### "Permission denied"
→ Run: `gcloud auth login`

### "Project not found"
→ Run: `gcloud config set project smrtvocab`

### "API not enabled"
→ Run:
```powershell
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
```

## Need Help?

See `DEPLOYMENT-TROUBLESHOOTING.md` for detailed troubleshooting steps.

