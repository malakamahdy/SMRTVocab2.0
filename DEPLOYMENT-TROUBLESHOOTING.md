# Deployment Troubleshooting Guide

## Common Issues and Solutions

### Issue 1: `gcloud` command not found

**Error:** `gcloud : The term 'gcloud' is not recognized`

**Solution:** Install Google Cloud SDK

**Windows:**
1. Download Google Cloud SDK installer from: https://cloud.google.com/sdk/docs/install
2. Run the installer and follow the prompts
3. Restart your terminal/PowerShell
4. Verify installation: `gcloud --version`
5. Authenticate: `gcloud auth login`
6. Set your project: `gcloud config set project smrtvocab`

**Alternative - Using Chocolatey (Windows):**
```powershell
choco install gcloudsdk
```

**Alternative - Using PowerShell:**
```powershell
# Download and install
(New-Object Net.WebClient).DownloadFile("https://dl.google.com/dl/cloudsdk/channels/rapid/GoogleCloudSDKInstaller.exe", "$env:Temp\GoogleCloudSDKInstaller.exe")
& $env:Temp\GoogleCloudSDKInstaller.exe
```

### Issue 2: Docker not running

**Error:** `Cannot connect to the Docker daemon`

**Solution:**
1. Start Docker Desktop
2. Wait for Docker to fully start (whale icon in system tray)
3. Verify: `docker ps`

### Issue 3: Permission denied errors

**Error:** `Permission denied` or `403 Forbidden`

**Solutions:**
1. **Authenticate with Google Cloud:**
   ```powershell
   gcloud auth login
   ```

2. **Set the correct project:**
   ```powershell
   gcloud config set project smrtvocab
   ```

3. **Enable required APIs:**
   ```powershell
   gcloud services enable cloudbuild.googleapis.com
   gcloud services enable run.googleapis.com
   ```

4. **Grant yourself necessary roles:**
   - Go to Google Cloud Console → IAM & Admin → IAM
   - Find your account and ensure you have:
     - Cloud Run Admin
     - Service Account User
     - Cloud Build Editor

### Issue 4: Template CSV files not found

**Error:** `ERROR: Template CSV files not found`

**Solution:**
1. Verify template files exist:
   ```powershell
   Get-ChildItem backend\UserWords\Template_*.csv
   ```

2. If missing, copy from SMRT-PROJECT:
   ```powershell
   Copy-Item SMRT-PROJECT\UserWords\Template_*.csv backend\UserWords\
   ```

### Issue 5: Build fails with Docker errors

**Error:** Docker build errors or image push failures

**Solutions:**
1. **Check Docker is running:**
   ```powershell
   docker ps
   ```

2. **Test Docker build locally:**
   ```powershell
   cd backend
   docker build -t test-build .
   ```

3. **Check Dockerfile syntax:**
   - Ensure all COPY commands reference existing files
   - Verify template CSV files are not excluded in .dockerignore

### Issue 6: Cloud Run deployment fails

**Error:** Service deployment errors

**Solutions:**
1. **Check quotas:**
   - Visit: https://console.cloud.google.com/iam-admin/quotas
   - Ensure Cloud Run quotas are not exceeded

2. **Check billing:**
   - Ensure billing is enabled for the project
   - Visit: https://console.cloud.google.com/billing

3. **Check logs:**
   ```powershell
   gcloud run services logs read smrtvocab-api --region us-central1 --project smrtvocab --limit 50
   ```

## Step-by-Step Deployment (Manual)

If the automated script fails, follow these steps manually:

### Step 1: Install Prerequisites

1. **Install Google Cloud SDK:**
   - Download from: https://cloud.google.com/sdk/docs/install
   - Run installer
   - Restart terminal

2. **Authenticate:**
   ```powershell
   gcloud auth login
   gcloud config set project smrtvocab
   ```

3. **Enable APIs:**
   ```powershell
   gcloud services enable cloudbuild.googleapis.com
   gcloud services enable run.googleapis.com
   ```

### Step 2: Build Docker Image

```powershell
cd backend
gcloud builds submit --tag gcr.io/smrtvocab/smrtvocab-api --project smrtvocab
```

**If this fails:**
- Check you're in the `backend` directory
- Verify Dockerfile exists: `Test-Path Dockerfile`
- Check template files: `Get-ChildItem UserWords\Template_*.csv`

### Step 3: Deploy to Cloud Run

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

### Step 4: Get Service URL

```powershell
$SERVICE_URL = gcloud run services describe smrtvocab-api --region us-central1 --project smrtvocab --format 'value(status.url)'
Write-Host "Service URL: $SERVICE_URL"
```

### Step 5: Update Frontend Configuration

Create `frontend\.env.production`:
```env
VITE_API_BASE_URL=https://YOUR-SERVICE-URL/api
```

Replace `YOUR-SERVICE-URL` with the URL from Step 4.

## Alternative: Using Firebase Functions

If Cloud Run deployment continues to fail, consider using Firebase Functions:

1. **Install Firebase CLI:**
   ```powershell
   npm install -g firebase-tools
   ```

2. **Initialize Functions:**
   ```powershell
   firebase init functions
   ```

3. **Use Python runtime** (Firebase Functions supports Python 3.11)

Note: This requires restructuring the backend code for Firebase Functions format.

## Getting Help

If you continue to experience issues:

1. **Check Cloud Build logs:**
   ```powershell
   gcloud builds list --project smrtvocab --limit 5
   ```

2. **Check Cloud Run logs:**
   ```powershell
   gcloud run services logs read smrtvocab-api --region us-central1 --project smrtvocab
   ```

3. **Verify project settings:**
   ```powershell
   gcloud config list
   ```

4. **Test backend locally first:**
   ```powershell
   cd backend
   python app.py
   ```
   Then test in browser: http://localhost:5000/api/settings/get

## Quick Diagnostic Commands

Run these to check your setup:

```powershell
# Check gcloud
gcloud --version

# Check Docker
docker --version
docker ps

# Check project
gcloud config get-value project

# Check authentication
gcloud auth list

# Check APIs enabled
gcloud services list --enabled --project smrtvocab

# Check template files
Get-ChildItem backend\UserWords\Template_*.csv

# Check Dockerfile
Test-Path backend\Dockerfile
```

