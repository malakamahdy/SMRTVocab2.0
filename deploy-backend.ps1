# Deploy backend to Cloud Run (PowerShell script for Windows)
# Make sure you're authenticated: gcloud auth login
# Make sure Docker is installed and running
#
# If you get execution policy errors, run:
# Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

$ErrorActionPreference = "Stop"

Write-Host "Building and deploying backend to Cloud Run..." -ForegroundColor Green

# Set variables
$PROJECT_ID = "smrtvocab"
$SERVICE_NAME = "smrtvocab-api"
$REGION = "us-central1"
$IMAGE_NAME = "gcr.io/$PROJECT_ID/$SERVICE_NAME"

# Check if gcloud is installed
try {
    $gcloudVersion = gcloud --version 2>&1
    Write-Host "Using gcloud: $($gcloudVersion[0])" -ForegroundColor Gray
} catch {
    Write-Host "ERROR: gcloud CLI not found. Please install Google Cloud SDK." -ForegroundColor Red
    exit 1
}

# Check if Docker is running
try {
    docker ps | Out-Null
    Write-Host "Docker is running" -ForegroundColor Gray
} catch {
    Write-Host "ERROR: Docker is not running. Please start Docker Desktop." -ForegroundColor Red
    exit 1
}

# Verify we're in the right directory
if (-not (Test-Path "backend/Dockerfile")) {
    Write-Host "ERROR: Dockerfile not found. Make sure you're in the project root directory." -ForegroundColor Red
    exit 1
}

# Verify template CSV files exist
$templateFiles = Get-ChildItem -Path "backend/UserWords" -Filter "Template_*.csv" -ErrorAction SilentlyContinue
if ($templateFiles.Count -eq 0) {
    Write-Host "WARNING: No template CSV files found in backend/UserWords/" -ForegroundColor Yellow
    Write-Host "The app may not work correctly without template files." -ForegroundColor Yellow
} else {
    Write-Host "Found $($templateFiles.Count) template CSV files" -ForegroundColor Gray
}

# Build the Docker image
Write-Host "Building Docker image..." -ForegroundColor Yellow
Set-Location backend
try {
    gcloud builds submit --tag $IMAGE_NAME --project $PROJECT_ID
    if ($LASTEXITCODE -ne 0) {
        throw "Docker build failed"
    }
} catch {
    Write-Host "ERROR: Failed to build Docker image" -ForegroundColor Red
    Set-Location ..
    exit 1
}

# Deploy to Cloud Run
Write-Host "Deploying to Cloud Run..." -ForegroundColor Yellow
try {
    # Deploy without env vars first (we'll set them after)
    gcloud run deploy $SERVICE_NAME `
      --image $IMAGE_NAME `
      --platform managed `
      --region $REGION `
      --allow-unauthenticated `
      --project $PROJECT_ID `
      --memory 512Mi `
      --cpu 1 `
      --timeout 300 `
      --max-instances 10
    
    if ($LASTEXITCODE -ne 0) {
        throw "Cloud Run deployment failed"
    }
    
    # Set environment variables using update command
    # Using --update-env-vars with proper format for comma-separated value
    Write-Host "Setting environment variables..." -ForegroundColor Yellow
    $envVarArg = 'ALLOWED_ORIGINS=https://smrtvocab.web.app,https://smrtvocab.firebaseapp.com'
    gcloud run services update $SERVICE_NAME `
      --update-env-vars $envVarArg `
      --region $REGION `
      --project $PROJECT_ID
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "WARNING: Failed to update environment variables" -ForegroundColor Yellow
        Write-Host "The service was deployed successfully, but env var update failed." -ForegroundColor Yellow
        Write-Host "If env vars were already set, this is not a problem." -ForegroundColor Gray
        Write-Host "If you need to update them, use Cloud Console or run:" -ForegroundColor Yellow
        Write-Host "  gcloud run services update $SERVICE_NAME --region $REGION --update-env-vars ALLOWED_ORIGINS=`"https://smrtvocab.web.app,https://smrtvocab.firebaseapp.com`"" -ForegroundColor Cyan
        # Don't exit with error - deployment succeeded
    } else {
        Write-Host "Environment variables updated successfully" -ForegroundColor Green
    }
    # Note: We don't check $LASTEXITCODE here because deployment already succeeded
    # The env var update failure is non-critical if vars were already set
} catch {
    Write-Host "ERROR: Failed to deploy to Cloud Run" -ForegroundColor Red
    Set-Location ..
    exit 1
}

# Get the service URL
try {
    $SERVICE_URL = gcloud run services describe $SERVICE_NAME --region $REGION --project $PROJECT_ID --format 'value(status.url)'
    
    if (-not $SERVICE_URL) {
        throw "Could not retrieve service URL"
    }
} catch {
    Write-Host "ERROR: Failed to get service URL" -ForegroundColor Red
    Set-Location ..
    exit 1
}

Set-Location ..

Write-Host ""
Write-Host "Backend deployed successfully!" -ForegroundColor Green
Write-Host "Service URL: $SERVICE_URL" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Create or update frontend/.env.production with:" -ForegroundColor Yellow
Write-Host "   VITE_API_BASE_URL=$SERVICE_URL/api" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Build and deploy frontend:" -ForegroundColor Yellow
Write-Host "   cd frontend" -ForegroundColor Gray
Write-Host "   npm run build" -ForegroundColor Gray
Write-Host "   cd .." -ForegroundColor Gray
Write-Host "   firebase deploy --only hosting" -ForegroundColor Gray
Write-Host ""

