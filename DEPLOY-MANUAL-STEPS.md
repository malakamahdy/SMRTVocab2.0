# Manual Deployment Steps (If Scripts Don't Work)

If the PowerShell scripts aren't working, you can deploy manually with these commands:

## Step 1: Build and Deploy Backend

Open PowerShell in the project root directory and run these commands one by one:

### 1. Navigate to backend directory
```powershell
cd backend
```

### 2. Build Docker image (uses Cloud Build - no Docker Desktop needed)
```powershell
gcloud builds submit --tag gcr.io/smrtvocab/smrtvocab-api --project smrtvocab
```

This will:
- Upload your code to Google Cloud
- Build the Docker image in the cloud
- Take a few minutes

### 3. Deploy to Cloud Run
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

### 4. Get the service URL
```powershell
gcloud run services describe smrtvocab-api --region us-central1 --project smrtvocab --format "value(status.url)"
```

**Save this URL!** It will look like: `https://smrtvocab-api-xxxxx-uc.a.run.app`

### 5. Go back to project root
```powershell
cd ..
```

## Step 2: Configure Frontend

### 1. Create environment file
Create a file named `.env.production` in the `frontend` folder with this content:

```
VITE_API_BASE_URL=https://YOUR-SERVICE-URL/api
```

Replace `YOUR-SERVICE-URL` with the URL from Step 1.4 (without the `/api` at the end).

Example:
```
VITE_API_BASE_URL=https://smrtvocab-api-abc123-uc.a.run.app/api
```

## Step 3: Build and Deploy Frontend

### 1. Navigate to frontend directory
```powershell
cd frontend
```

### 2. Build the frontend
```powershell
npm run build
```

### 3. Go back to project root
```powershell
cd ..
```

### 4. Deploy to Firebase
```powershell
firebase deploy --only hosting
```

## Troubleshooting

### "API not enabled" errors

Enable the required APIs:
```powershell
gcloud services enable cloudbuild.googleapis.com --project smrtvocab
gcloud services enable run.googleapis.com --project smrtvocab
```

### "Permission denied" errors

Make sure you're authenticated:
```powershell
gcloud auth login
gcloud config set project smrtvocab
```

### Build takes forever

Cloud Build can take 5-10 minutes. This is normal for the first build. Be patient!

## Verify Deployment

1. Visit your Firebase site: https://smrtvocab.web.app
2. Open browser DevTools (F12) → Console
3. Look for: `API Base URL: https://...` (should NOT be localhost)
4. Try logging in

If you see the correct API URL in the console, the deployment worked!






