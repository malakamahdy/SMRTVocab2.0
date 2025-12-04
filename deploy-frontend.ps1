# Deploy frontend to Firebase Hosting
# Since you're authenticated with Firebase CLI, this should work immediately

Write-Host "=== Deploying Frontend to Firebase Hosting ===" -ForegroundColor Cyan
Write-Host ""

# Check Firebase authentication
Write-Host "Checking Firebase authentication..." -ForegroundColor Yellow
$firebaseAuth = & firebase login:list 2>&1
if ($firebaseAuth -match "No authorized accounts") {
    Write-Host "✗ Not authenticated with Firebase!" -ForegroundColor Red
    Write-Host "  Run: firebase login" -ForegroundColor Yellow
    exit 1
} else {
    Write-Host "✓ Authenticated with Firebase" -ForegroundColor Green
}

# Check current project
Write-Host "Checking Firebase project..." -ForegroundColor Yellow
$currentProject = & firebase use 2>&1 | Select-String "smrtvocab"
if ($currentProject) {
    Write-Host "✓ Using project: smrtvocab" -ForegroundColor Green
} else {
    Write-Host "⚠ Setting project to smrtvocab..." -ForegroundColor Yellow
    & firebase use smrtvocab
}

Write-Host ""
Write-Host "Step 1: Building frontend..." -ForegroundColor Yellow
Push-Location frontend

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "  Installing dependencies..." -ForegroundColor Gray
    & npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "✗ npm install failed!" -ForegroundColor Red
        Pop-Location
        exit 1
    }
}

# Build
Write-Host "  Running npm run build..." -ForegroundColor Gray
& npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Build failed!" -ForegroundColor Red
    Pop-Location
    exit 1
}

Write-Host "✓ Frontend built successfully" -ForegroundColor Green
Pop-Location

Write-Host ""
Write-Host "Step 2: Deploying to Firebase Hosting..." -ForegroundColor Yellow
& firebase deploy --only hosting

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "=== Deployment Successful! ===" -ForegroundColor Green
    Write-Host ""
    Write-Host "Your app is live at:" -ForegroundColor Cyan
    Write-Host "  https://smrtvocab.web.app" -ForegroundColor White
    Write-Host "  https://smrtvocab.firebaseapp.com" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "✗ Deployment failed!" -ForegroundColor Red
    Write-Host "  Check the error messages above" -ForegroundColor Yellow
    exit 1
}

