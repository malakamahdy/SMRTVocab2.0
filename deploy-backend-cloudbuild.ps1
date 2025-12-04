# Deploy backend to Cloud Run using Cloud Build (NO Docker Desktop needed!)
# Cloud Build builds the Docker image in the cloud, so you don't need Docker locally
# Run this with: powershell -ExecutionPolicy Bypass -File .\deploy-backend-cloudbuild.ps1

Write-Host "=== SMRT Vocab Backend Deployment (Cloud Build) ===" -ForegroundColor Cyan
Write-Host "Note: This uses Cloud Build - no Docker Desktop needed!" -ForegroundColor Green
Write-Host ""

# Check prerequisites
Write-Host "Checking prerequisites..." -ForegroundColor Yellow

# Check gcloud
try {
    $gcloudCheck = & gcloud --version 2>&1
    if ($LASTEXITCODE -ne 0) { throw }
    Write-Host "✓ gcloud CLI found" -ForegroundColor Green
} catch {
    Write-Host "✗ gcloud CLI not found!" -ForegroundColor Red
    Write-Host "  Please install from: https://cloud.google.com/sdk/docs/install" -ForegroundColor Yellow
    Write-Host "  Then run: gcloud auth login" -ForegroundColor Yellow
    exit 1
}

# Check template files
$templateCount = (Get-ChildItem -Path "backend\UserWords" -Filter "Template_*.csv" -ErrorAction SilentlyContinue).Count
if ($templateCount -gt 0) {
    Write-Host "✓ Found $templateCount template CSV files" -ForegroundColor Green
} else {
    Write-Host "⚠ Warning: No template CSV files found" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Starting deployment using Cloud Build..." -ForegroundColor Cyan
Write-Host "(This builds the Docker image in the cloud - no local Docker needed!)" -ForegroundColor Gray
Write-Host ""

# Set variables
$PROJECT_ID = "smrtvocab"
$SERVICE_NAME = "smrtvocab-api"
$REGION = "us-central1"
$IMAGE_NAME = "gcr.io/$PROJECT_ID/$SERVICE_NAME"

# Build Docker image using Cloud Build (no local Docker needed!)
Write-Host "Step 1: Building Docker image in the cloud..." -ForegroundColor Yellow
Push-Location backend
try {
    & gcloud builds submit --tag $IMAGE_NAME --project $PROJECT_ID
    if ($LASTEXITCODE -ne 0) {
        throw "Build failed"
    }
    Write-Host "✓ Docker image built successfully in the cloud" -ForegroundColor Green
} catch {
    Write-Host "✗ Docker build failed!" -ForegroundColor Red
    Pop-Location
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "  - Make sure Cloud Build API is enabled: gcloud services enable cloudbuild.googleapis.com" -ForegroundColor White
    Write-Host "  - Check that you are authenticated: gcloud auth login" -ForegroundColor White
    Write-Host "  - Verify project ID: gcloud config set project smrtvocab" -ForegroundColor White
    exit 1
}

# Deploy to Cloud Run
Write-Host ""
Write-Host "Step 2: Deploying to Cloud Run..." -ForegroundColor Yellow
try {
    & gcloud run deploy $SERVICE_NAME `
      --image $IMAGE_NAME `
      --platform managed `
      --region $REGION `
      --allow-unauthenticated `
      --set-env-vars "ALLOWED_ORIGINS=https://smrtvocab.web.app,https://smrtvocab.firebaseapp.com" `
      --project $PROJECT_ID `
      --memory 512Mi `
      --cpu 1 `
      --timeout 300 `
      --max-instances 10
    
    if ($LASTEXITCODE -ne 0) {
        throw "Deployment failed"
    }
    Write-Host "✓ Deployed to Cloud Run successfully" -ForegroundColor Green
} catch {
    Write-Host "✗ Cloud Run deployment failed!" -ForegroundColor Red
    Pop-Location
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "  - Make sure Cloud Run API is enabled: gcloud services enable run.googleapis.com" -ForegroundColor White
    Write-Host "  - Check logs for details" -ForegroundColor White
    exit 1
}

# Get service URL
Write-Host ""
Write-Host "Step 3: Getting service URL..." -ForegroundColor Yellow
try {
    $SERVICE_URL = & gcloud run services describe $SERVICE_NAME --region $REGION --project $PROJECT_ID --format "value(status.url)"
    if (-not $SERVICE_URL) {
        throw "Could not get URL"
    }
    Write-Host "✓ Service URL retrieved" -ForegroundColor Green
} catch {
    Write-Host "✗ Could not retrieve service URL!" -ForegroundColor Red
    Pop-Location
    exit 1
}

Pop-Location

# Success message
Write-Host ""
Write-Host "=== Deployment Successful! ===" -ForegroundColor Green
Write-Host ""
Write-Host "Service URL: $SERVICE_URL" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Create or update frontend\.env.production:" -ForegroundColor White
Write-Host "   VITE_API_BASE_URL=$SERVICE_URL/api" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Build and deploy frontend:" -ForegroundColor White
Write-Host "   cd frontend" -ForegroundColor Gray
Write-Host "   npm run build" -ForegroundColor Gray
Write-Host "   cd .." -ForegroundColor Gray
Write-Host "   firebase deploy --only hosting" -ForegroundColor Gray
Write-Host ""

