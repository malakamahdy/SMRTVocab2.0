# Check prerequisites for Firebase deployment
# Run this first to see what's missing

Write-Host "=== Checking Prerequisites for Firebase Deployment ===" -ForegroundColor Cyan
Write-Host ""

$allGood = $true

# Check gcloud
Write-Host "Checking gcloud CLI..." -ForegroundColor Yellow
try {
    $gcloudVersion = & gcloud --version 2>&1 | Select-Object -First 1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✓ gcloud CLI installed: $gcloudVersion" -ForegroundColor Green
        
        # Check authentication
        $authList = & gcloud auth list 2>&1
        if ($authList -match "ACTIVE") {
            Write-Host "  ✓ Authenticated with Google Cloud" -ForegroundColor Green
        } else {
            Write-Host "  ⚠ Not authenticated. Run: gcloud auth login" -ForegroundColor Yellow
            $allGood = $false
        }
        
        # Check project
        $project = & gcloud config get-value project 2>&1
        if ($project -and $project -ne "ERROR") {
            Write-Host "  ✓ Project set to: $project" -ForegroundColor Green
        } else {
            Write-Host "  ⚠ Project not set. Run: gcloud config set project smrtvocab" -ForegroundColor Yellow
            $allGood = $false
        }
    } else {
        throw
    }
} catch {
    Write-Host "  ✗ gcloud CLI not found!" -ForegroundColor Red
    Write-Host "    Install from: https://cloud.google.com/sdk/docs/install" -ForegroundColor Yellow
    Write-Host "    Or use Chocolatey: choco install gcloudsdk" -ForegroundColor Yellow
    $allGood = $false
}

Write-Host ""

# Check Docker
Write-Host "Checking Docker..." -ForegroundColor Yellow
try {
    $dockerVersion = & docker --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✓ Docker installed: $dockerVersion" -ForegroundColor Green
        
        # Check if Docker is running
        $dockerPs = & docker ps 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  ✓ Docker is running" -ForegroundColor Green
        } else {
            Write-Host "  ✗ Docker is not running! Start Docker Desktop" -ForegroundColor Red
            $allGood = $false
        }
    } else {
        throw
    }
} catch {
    Write-Host "  ✗ Docker not found or not running!" -ForegroundColor Red
    Write-Host "    Install Docker Desktop from: https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
    $allGood = $false
}

Write-Host ""

# Check Firebase CLI
Write-Host "Checking Firebase CLI..." -ForegroundColor Yellow
try {
    $firebaseVersion = & firebase --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✓ Firebase CLI installed: $firebaseVersion" -ForegroundColor Green
    } else {
        throw
    }
} catch {
    Write-Host "  ⚠ Firebase CLI not found (optional for backend, required for frontend)" -ForegroundColor Yellow
    Write-Host "    Install with: npm install -g firebase-tools" -ForegroundColor Yellow
}

Write-Host ""

# Check template files
Write-Host "Checking template CSV files..." -ForegroundColor Yellow
$templateFiles = Get-ChildItem -Path "backend\UserWords" -Filter "Template_*.csv" -ErrorAction SilentlyContinue
if ($templateFiles.Count -gt 0) {
    Write-Host "  ✓ Found $($templateFiles.Count) template CSV files" -ForegroundColor Green
} else {
    Write-Host "  ✗ No template CSV files found in backend\UserWords\" -ForegroundColor Red
    Write-Host "    Copy from SMRT-PROJECT\UserWords\Template_*.csv" -ForegroundColor Yellow
    $allGood = $false
}

Write-Host ""

# Check Dockerfile
Write-Host "Checking Dockerfile..." -ForegroundColor Yellow
if (Test-Path "backend\Dockerfile") {
    Write-Host "  ✓ Dockerfile found" -ForegroundColor Green
} else {
    Write-Host "  ✗ Dockerfile not found!" -ForegroundColor Red
    $allGood = $false
}

Write-Host ""

# Summary
if ($allGood) {
    Write-Host "=== All prerequisites met! ===" -ForegroundColor Green
    Write-Host ""
    Write-Host "You can now deploy using:" -ForegroundColor Cyan
    Write-Host "  powershell -ExecutionPolicy Bypass -File .\deploy-backend-simple.ps1" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "=== Some prerequisites are missing ===" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install/configure the missing items above, then run this script again." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Quick install commands:" -ForegroundColor Cyan
    Write-Host "  # Install gcloud (if missing):" -ForegroundColor Gray
    Write-Host "  # Download from: https://cloud.google.com/sdk/docs/install" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  # Authenticate and set project:" -ForegroundColor Gray
    Write-Host "  gcloud auth login" -ForegroundColor White
    Write-Host "  gcloud config set project smrtvocab" -ForegroundColor White
    Write-Host ""
    Write-Host "  # Enable APIs:" -ForegroundColor Gray
    Write-Host "  gcloud services enable cloudbuild.googleapis.com" -ForegroundColor White
    Write-Host "  gcloud services enable run.googleapis.com" -ForegroundColor White
    Write-Host ""
}

