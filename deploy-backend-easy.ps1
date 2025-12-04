# Simple backend deployment script - No Docker Desktop needed!
# Just run: powershell -ExecutionPolicy Bypass -File .\deploy-backend-easy.ps1

$ErrorActionPreference = "Continue"

Write-Host ""
Write-Host "=== SMRT Vocab Backend Deployment ===" -ForegroundColor Cyan
Write-Host "Using Cloud Build (no Docker Desktop needed)" -ForegroundColor Green
Write-Host ""

# Variables
$PROJECT_ID = "smrtvocab"
$SERVICE_NAME = "smrtvocab-api"
$REGION = "us-central1"
$IMAGE_NAME = "gcr.io/$PROJECT_ID/$SERVICE_NAME"

# Check gcloud
Write-Host "Step 1: Checking gcloud CLI..." -ForegroundColor Yellow
& gcloud --version 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ERROR - gcloud not found!" -ForegroundColor Red
    Write-Host "  Install from: https://cloud.google.com/sdk/docs/install" -ForegroundColor Yellow
    exit 1
}
Write-Host "  OK - gcloud found" -ForegroundColor Green

# Check authentication
Write-Host ""
Write-Host "Step 2: Checking authentication..." -ForegroundColor Yellow

# Get current active account
$currentAccountOutput = & gcloud config get-value account 2>&1
$currentAccount = ($currentAccountOutput | Where-Object { $_ -notmatch "WARNING" -and $_ -notmatch "ERROR" -and $_ -match "@" }) -join ""

# Get list of authenticated accounts
$authListOutput = & gcloud auth list --format="value(account)" 2>&1
$authAccounts = @($authListOutput | Where-Object { $_ -notmatch "WARNING" -and $_ -notmatch "ERROR" -and $_ -match "@" })

if ([string]::IsNullOrWhiteSpace($currentAccount) -or $currentAccount -match "unset" -or $currentAccount -match "None") {
    if ($authAccounts.Count -gt 0) {
        # Prefer vosspurkey@gmail.com if available, otherwise use first account
        $targetAccount = $authAccounts | Where-Object { $_ -match "vosspurkey@gmail.com" } | Select-Object -First 1
        if ([string]::IsNullOrWhiteSpace($targetAccount)) {
            $targetAccount = $authAccounts[0]
        }
        Write-Host "  Setting active account to: $targetAccount" -ForegroundColor Gray
        & gcloud config set account $targetAccount 2>&1 | Out-Null
        if ($LASTEXITCODE -ne 0) {
            Write-Host "  ERROR - Failed to set account!" -ForegroundColor Red
            exit 1
        }
        $account = $targetAccount
    } else {
        Write-Host "  Warning - No authenticated accounts found. Logging in..." -ForegroundColor Yellow
        & gcloud auth login
        if ($LASTEXITCODE -ne 0) {
            Write-Host "  ERROR - Authentication failed!" -ForegroundColor Red
            Write-Host "  Run: gcloud auth login" -ForegroundColor Yellow
            exit 1
        }
        $accountOutput = & gcloud config get-value account 2>&1
        $account = ($accountOutput | Where-Object { $_ -notmatch "WARNING" -and $_ -notmatch "ERROR" -and $_ -match "@" }) -join ""
    }
} else {
    $account = $currentAccount
}

Write-Host "  OK - Active account: $account" -ForegroundColor Green

# Verify account has access to the project
Write-Host "  Verifying account access..." -ForegroundColor Gray
& gcloud projects describe $PROJECT_ID 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ERROR - Account does not have access to project $PROJECT_ID!" -ForegroundColor Red
    Write-Host "  Make sure $account has Owner or Editor role on the project" -ForegroundColor Yellow
    exit 1
}
Write-Host "  OK - Account has access to project" -ForegroundColor Green

# Set project
Write-Host ""
Write-Host "Step 3: Setting project..." -ForegroundColor Yellow
& gcloud config set project $PROJECT_ID 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ERROR - Failed to set project!" -ForegroundColor Red
    exit 1
}
Write-Host "  OK - Project set to: $PROJECT_ID" -ForegroundColor Green

# Enable required APIs
Write-Host ""
Write-Host "Step 4: Enabling required APIs..." -ForegroundColor Yellow
Write-Host "  Checking Cloud Build API..." -ForegroundColor Gray
& gcloud services enable cloudbuild.googleapis.com --project $PROJECT_ID 2>&1 | Out-Null

Write-Host "  Checking Cloud Run API..." -ForegroundColor Gray
& gcloud services enable run.googleapis.com --project $PROJECT_ID 2>&1 | Out-Null

Write-Host "  OK - APIs enabled (or already enabled)" -ForegroundColor Green

# Check if backend directory exists
Write-Host ""
Write-Host "Step 5: Checking backend directory..." -ForegroundColor Yellow
if (-not (Test-Path "backend")) {
    Write-Host "  ✗ ERROR - backend directory not found!" -ForegroundColor Red
    Write-Host "  Make sure you're in the project root directory" -ForegroundColor Yellow
    exit 1
}
Write-Host "  OK - Backend directory found" -ForegroundColor Green

Write-Host ""
Write-Host "Step 6: Fixing Cloud Build permissions..." -ForegroundColor Yellow

# Get current user account
$currentAccountOutput = & gcloud config get-value account 2>&1
$userAccount = ($currentAccountOutput | Where-Object { $_ -notmatch "WARNING" -and $_ -notmatch "ERROR" -and $_ -match "@" }) -join ""

# Get the Cloud Build service account email
$cloudBuildSA = "$PROJECT_ID@cloudbuild.gserviceaccount.com"

Write-Host "  Granting permissions to user account: $userAccount" -ForegroundColor Gray

# Grant Service Usage Admin role to user (sometimes needed even for Owners)
Write-Host "  Granting Service Usage Admin role to user..." -ForegroundColor Gray
& gcloud projects add-iam-policy-binding $PROJECT_ID `
    --member="user:$userAccount" `
    --role="roles/serviceusage.admin" `
    --condition=None 2>&1 | Out-Null

# Grant Service Usage Consumer role to user (required for Cloud Build)
Write-Host "  Granting Service Usage Consumer role to user..." -ForegroundColor Gray
& gcloud projects add-iam-policy-binding $PROJECT_ID `
    --member="user:$userAccount" `
    --role="roles/serviceusage.serviceUsageConsumer" `
    --condition=None 2>&1 | Out-Null

# Grant Cloud Build Editor role to user (gives necessary permissions)
Write-Host "  Granting Cloud Build Editor role to user..." -ForegroundColor Gray
& gcloud projects add-iam-policy-binding $PROJECT_ID `
    --member="user:$userAccount" `
    --role="roles/cloudbuild.builds.editor" `
    --condition=None 2>&1 | Out-Null

# Grant Storage Admin role to user (for bucket access)
Write-Host "  Granting Storage Admin role to user..." -ForegroundColor Gray
& gcloud projects add-iam-policy-binding $PROJECT_ID `
    --member="user:$userAccount" `
    --role="roles/storage.admin" `
    --condition=None 2>&1 | Out-Null

Write-Host "  Granting permissions to Cloud Build service account..." -ForegroundColor Gray

# Grant Storage Admin role to Cloud Build service account (for bucket access)
Write-Host "  Granting Storage Admin role to Cloud Build service account..." -ForegroundColor Gray
& gcloud projects add-iam-policy-binding $PROJECT_ID `
    --member="serviceAccount:$cloudBuildSA" `
    --role="roles/storage.admin" `
    --condition=None 2>&1 | Out-Null

# Grant Service Usage Consumer role to Cloud Build service account
Write-Host "  Granting Service Usage Consumer role to Cloud Build service account..." -ForegroundColor Gray
& gcloud projects add-iam-policy-binding $PROJECT_ID `
    --member="serviceAccount:$cloudBuildSA" `
    --role="roles/serviceusage.serviceUsageConsumer" `
    --condition=None 2>&1 | Out-Null

Write-Host "  OK - Permissions granted" -ForegroundColor Green
Write-Host "  Note: Permissions may take 1-2 minutes to propagate..." -ForegroundColor Yellow

Write-Host ""
Write-Host "Step 7: Preparing Cloud Build bucket..." -ForegroundColor Yellow
$bucketName = "${PROJECT_ID}_cloudbuild"
Write-Host "  Checking if bucket exists..." -ForegroundColor Gray

# Check if bucket exists
& gsutil ls -b "gs://$bucketName" 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "  Bucket does not exist, creating it..." -ForegroundColor Gray
    & gsutil mb -p $PROJECT_ID -l us-central1 "gs://$bucketName" 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  OK - Bucket created" -ForegroundColor Green
    } else {
        Write-Host "  Warning - Could not create bucket (may already exist or permissions issue)" -ForegroundColor Yellow
    }
} else {
    Write-Host "  OK - Bucket exists" -ForegroundColor Green
}

Write-Host ""
Write-Host "Step 8: Building Docker image in the cloud..." -ForegroundColor Yellow
Write-Host "  This may take 3-5 minutes..." -ForegroundColor Gray
Set-Location backend

# Wait a moment for permissions to propagate
Start-Sleep -Seconds 5

# Build the image (permissions should now be set)
& gcloud builds submit --tag $IMAGE_NAME --project $PROJECT_ID
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ERROR - Build failed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "If you see permission errors:" -ForegroundColor Yellow
    Write-Host "  1. Permissions may need a few minutes to propagate" -ForegroundColor White
    Write-Host "  2. Try running the script again in 2-3 minutes" -ForegroundColor White
    Write-Host "  3. Or manually grant permissions:" -ForegroundColor White
    Write-Host "     gcloud projects add-iam-policy-binding $PROJECT_ID --member=`"serviceAccount:$cloudBuildSA`" --role=`"roles/storage.admin`"" -ForegroundColor Gray
    Write-Host "     gcloud projects add-iam-policy-binding $PROJECT_ID --member=`"serviceAccount:$cloudBuildSA`" --role=`"roles/serviceusage.serviceUsageConsumer`"" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Other troubleshooting:" -ForegroundColor Yellow
    Write-Host "  1. Check that Cloud Build API is enabled" -ForegroundColor White
    Write-Host "  2. Verify you have Owner role on the project" -ForegroundColor White
    Write-Host "  3. Check the error message above for details" -ForegroundColor White
    Set-Location ..
    exit 1
}
Write-Host "  OK - Image built successfully" -ForegroundColor Green

Write-Host ""
Write-Host "Step 9: Configuring environment variables..." -ForegroundColor Yellow

# Check for Gemini API key in local .env file or environment
$geminiApiKey = $null
$backendEnvFile = "backend\.env"
if (Test-Path $backendEnvFile) {
    Write-Host "  Checking backend\.env file for GEMINI_API_KEY..." -ForegroundColor Gray
    $envContent = Get-Content $backendEnvFile -Raw
    if ($envContent -match 'GEMINI_API_KEY\s*=\s*(.+)') {
        $geminiApiKey = $matches[1].Trim()
        Write-Host "  Found GEMINI_API_KEY in .env file" -ForegroundColor Green
    }
}

# If not found, check environment variable
if ([string]::IsNullOrWhiteSpace($geminiApiKey)) {
    $geminiApiKey = $env:GEMINI_API_KEY
    if (-not [string]::IsNullOrWhiteSpace($geminiApiKey)) {
        Write-Host "  Found GEMINI_API_KEY in environment variables" -ForegroundColor Green
    }
}

# If still not found, prompt user
if ([string]::IsNullOrWhiteSpace($geminiApiKey)) {
    Write-Host "  GEMINI_API_KEY not found. Guided reading features will not work." -ForegroundColor Yellow
    Write-Host "  You can add it later by running:" -ForegroundColor Gray
    Write-Host "    gcloud run services update smrtvocab-api --region us-central1 --update-env-vars GEMINI_API_KEY=YOUR_KEY" -ForegroundColor Gray
    Write-Host ""
}

Write-Host ""
Write-Host "Step 10: Deploying to Cloud Run..." -ForegroundColor Yellow

# Create a temporary env file in YAML format
$envFile = ".\temp-env-vars.yaml"
$envContent = @"
ALLOWED_ORIGINS: "https://smrtvocab.web.app,https://smrtvocab.firebaseapp.com"
"@

# Add Gemini API key if available
if (-not [string]::IsNullOrWhiteSpace($geminiApiKey)) {
    $envContent += "`nGEMINI_API_KEY: `"$geminiApiKey`""
}

$envContent | Out-File -FilePath $envFile -Encoding utf8

try {
    & gcloud run deploy $SERVICE_NAME `
        --image $IMAGE_NAME `
        --platform managed `
        --region $REGION `
        --allow-unauthenticated `
        --env-vars-file $envFile `
        --project $PROJECT_ID `
        --memory 512Mi `
        --cpu 1 `
        --timeout 300 `
        --max-instances 10 `
        --quiet
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  ERROR - Deployment failed!" -ForegroundColor Red
        Write-Host ""
        Write-Host "Troubleshooting:" -ForegroundColor Yellow
        Write-Host "  1. Check that Cloud Run API is enabled" -ForegroundColor White
        Write-Host "  2. Verify you have permissions for the project" -ForegroundColor White
        Write-Host "  3. Check the error message above for details" -ForegroundColor White
        Set-Location ..
        exit 1
    }
    Write-Host "  OK - Deployed successfully" -ForegroundColor Green
} finally {
    # Clean up temp file
    if (Test-Path $envFile) {
        Remove-Item $envFile -Force
    }
}

Write-Host ""
Write-Host "Step 11: Getting service URL..." -ForegroundColor Yellow

$SERVICE_URL = & gcloud run services describe $SERVICE_NAME --region $REGION --project $PROJECT_ID --format "value(status.url)" 2>&1

if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($SERVICE_URL) -or $SERVICE_URL -match "ERROR") {
    Write-Host "  ERROR - Could not get service URL!" -ForegroundColor Red
    Write-Host "  You can get it manually with:" -ForegroundColor Yellow
    Write-Host "  gcloud run services describe $SERVICE_NAME --region $REGION --project $PROJECT_ID --format 'value(status.url)'" -ForegroundColor Gray
    Set-Location ..
    exit 1
}

Write-Host "  OK - Got service URL" -ForegroundColor Green

Set-Location ..

Write-Host ""
Write-Host "Step 12: Creating frontend configuration..." -ForegroundColor Yellow

$envContent = "VITE_API_BASE_URL=$SERVICE_URL/api"
$envPath = "frontend\.env.production"

# Create frontend directory if it doesn't exist
if (-not (Test-Path "frontend")) {
    Write-Host "  Warning - Frontend directory not found, skipping config file creation" -ForegroundColor Yellow
} else {
    try {
        $envContent | Out-File -FilePath $envPath -Encoding utf8 -NoNewline
        Write-Host "  OK - Created $envPath" -ForegroundColor Green
        Write-Host "  Content: $envContent" -ForegroundColor Gray
    } catch {
        Write-Host "  Warning - Could not create frontend config file automatically" -ForegroundColor Yellow
        Write-Host "  Create it manually: frontend\.env.production" -ForegroundColor White
        Write-Host "  Content: VITE_API_BASE_URL=$SERVICE_URL/api" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "=== DEPLOYMENT SUCCESSFUL! ===" -ForegroundColor Green
Write-Host ""
Write-Host "Backend URL: $SERVICE_URL" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps to deploy frontend:" -ForegroundColor Yellow
Write-Host "1. Build the frontend:" -ForegroundColor White
Write-Host "   cd frontend" -ForegroundColor Gray
Write-Host "   npm run build" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Deploy to Firebase:" -ForegroundColor White
Write-Host "   cd .." -ForegroundColor Gray
Write-Host "   firebase deploy --only hosting" -ForegroundColor Gray
Write-Host ""
Write-Host "Your backend is now live and ready to use!" -ForegroundColor Green
Write-Host ""


