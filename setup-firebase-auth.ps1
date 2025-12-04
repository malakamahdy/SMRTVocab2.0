# Setup Firebase authentication for deployment
# Run this to authenticate with Firebase using your account

Write-Host "=== Firebase Authentication Setup ===" -ForegroundColor Cyan
Write-Host ""

# Check if already logged in
Write-Host "Checking Firebase authentication status..." -ForegroundColor Yellow
$firebaseAuth = & firebase login:list 2>&1
if ($firebaseAuth -match "No authorized accounts") {
    Write-Host "  Not authenticated. Starting login process..." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "A browser window will open for authentication." -ForegroundColor Cyan
    Write-Host "Please log in with the account that was added to the Firebase project." -ForegroundColor Cyan
    Write-Host ""
    
    & firebase login --no-localhost
} else {
    Write-Host "  ✓ Already authenticated" -ForegroundColor Green
    Write-Host ""
    Write-Host "Current Firebase accounts:" -ForegroundColor Cyan
    & firebase login:list
}

Write-Host ""
Write-Host "Checking Firebase projects..." -ForegroundColor Yellow
$projects = & firebase projects:list 2>&1
if ($projects -match "smrtvocab") {
    Write-Host "  ✓ Found smrtvocab project" -ForegroundColor Green
} else {
    Write-Host "  ⚠ smrtvocab project not found in your account" -ForegroundColor Yellow
    Write-Host "    Make sure you were added to the Firebase project with the correct email" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Setting default project to smrtvocab..." -ForegroundColor Yellow
& firebase use smrtvocab --add

Write-Host ""
Write-Host "=== Next Steps ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "For frontend deployment (Firebase Hosting):" -ForegroundColor Yellow
Write-Host "  cd frontend" -ForegroundColor White
Write-Host "  npm run build" -ForegroundColor White
Write-Host "  cd .." -ForegroundColor White
Write-Host "  firebase deploy --only hosting" -ForegroundColor White
Write-Host ""
Write-Host "For backend deployment (Cloud Run), you still need gcloud CLI:" -ForegroundColor Yellow
Write-Host "  See DEPLOYMENT-TROUBLESHOOTING.md for gcloud setup" -ForegroundColor White
Write-Host ""

