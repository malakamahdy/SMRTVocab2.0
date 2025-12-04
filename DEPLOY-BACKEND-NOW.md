# Quick Backend Deployment Guide

## One-Command Deployment

Simply run this command from the project root:

```powershell
powershell -ExecutionPolicy Bypass -File .\deploy-backend-easy.ps1
```

The script will:
1. ✅ Check if gcloud CLI is installed
2. ✅ Verify authentication (prompts login if needed)
3. ✅ Set the correct Google Cloud project
4. ✅ Enable required APIs automatically
5. ✅ Build your Docker image in the cloud (no Docker Desktop needed!)
6. ✅ Deploy to Cloud Run
7. ✅ Get your backend URL
8. ✅ Create frontend config file automatically

## Prerequisites

1. **Google Cloud SDK** - If not installed:
   - Download: https://cloud.google.com/sdk/docs/install
   - Install and restart your terminal
   - Run: `gcloud auth login`

2. **Project Access** - Make sure you have access to the `smrtvocab` Google Cloud project

## After Deployment

Once the script completes successfully:

1. **Build your frontend:**
   ```powershell
   cd frontend
   npm run build
   cd ..
   ```

2. **Deploy frontend to Firebase:**
   ```powershell
   firebase deploy --only hosting
   ```

## Troubleshooting

### "gcloud not found"
→ Install Google Cloud SDK from https://cloud.google.com/sdk/docs/install

### "Permission denied" or "Authentication failed"
→ Run: `gcloud auth login`

### "API not enabled"
→ The script should enable APIs automatically, but if it fails:
```powershell
gcloud services enable cloudbuild.googleapis.com --project smrtvocab
gcloud services enable run.googleapis.com --project smrtvocab
```

### Build fails
→ Check that all files in `backend/` are present, especially:
- `requirements.txt`
- `Dockerfile`
- `app.py`
- Template CSV files in `UserWords/` directory

### Deployment succeeds but frontend can't connect
→ Make sure you:
1. Created `frontend/.env.production` with: `VITE_API_BASE_URL=https://YOUR-SERVICE-URL/api`
2. Rebuilt the frontend: `cd frontend && npm run build`
3. Redeployed to Firebase: `firebase deploy --only hosting`

## Manual Steps (if script fails)

If the automated script doesn't work, follow these manual steps:

1. **Set project:**
   ```powershell
   gcloud config set project smrtvocab
   ```

2. **Enable APIs:**
   ```powershell
   gcloud services enable cloudbuild.googleapis.com
   gcloud services enable run.googleapis.com
   ```

3. **Build image:**
   ```powershell
   cd backend
   gcloud builds submit --tag gcr.io/smrtvocab/smrtvocab-api --project smrtvocab
   ```

4. **Deploy:**
   ```powershell
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

5. **Get URL:**
   ```powershell
   gcloud run services describe smrtvocab-api --region us-central1 --project smrtvocab --format 'value(status.url)'
   ```

6. **Create frontend config:**
   - Create `frontend/.env.production`
   - Add: `VITE_API_BASE_URL=https://YOUR-SERVICE-URL/api`
   - Replace `YOUR-SERVICE-URL` with the URL from step 5

## Need Help?

Check `DEPLOYMENT-TROUBLESHOOTING.md` for more detailed troubleshooting.

