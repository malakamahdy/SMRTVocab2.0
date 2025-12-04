# Install Google Cloud SDK for backend deployment
# This script will attempt to install gcloud CLI

Write-Host "=== Installing Google Cloud SDK ===" -ForegroundColor Cyan
Write-Host ""

# Check if already installed
$gcloudCheck = Get-Command gcloud -ErrorAction SilentlyContinue
if ($gcloudCheck) {
    Write-Host "✓ gcloud CLI is already installed!" -ForegroundColor Green
    & gcloud --version
    exit 0
}

Write-Host "gcloud CLI not found. Installing..." -ForegroundColor Yellow
Write-Host ""

# Try Chocolatey first
$choco = Get-Command choco -ErrorAction SilentlyContinue
if ($choco) {
    Write-Host "Found Chocolatey. Installing via Chocolatey..." -ForegroundColor Yellow
    Write-Host "This may require administrator privileges." -ForegroundColor Yellow
    Write-Host ""
    
    try {
        & choco install gcloudsdk -y
        if ($LASTEXITCODE -eq 0) {
            Write-Host ""
            Write-Host "✓ Installation successful!" -ForegroundColor Green
            Write-Host ""
            Write-Host "Please restart your terminal, then run:" -ForegroundColor Yellow
            Write-Host "  gcloud auth login" -ForegroundColor White
            Write-Host "  gcloud config set project smrtvocab" -ForegroundColor White
            exit 0
        }
    } catch {
        Write-Host "Chocolatey installation failed. Trying alternative..." -ForegroundColor Yellow
    }
}

# Try winget
$winget = Get-Command winget -ErrorAction SilentlyContinue
if ($winget) {
    Write-Host "Found winget. Installing via winget..." -ForegroundColor Yellow
    Write-Host ""
    
    try {
        & winget install Google.CloudSDK
        if ($LASTEXITCODE -eq 0) {
            Write-Host ""
            Write-Host "✓ Installation successful!" -ForegroundColor Green
            Write-Host ""
            Write-Host "Please restart your terminal, then run:" -ForegroundColor Yellow
            Write-Host "  gcloud auth login" -ForegroundColor White
            Write-Host "  gcloud config set project smrtvocab" -ForegroundColor White
            exit 0
        }
    } catch {
        Write-Host "winget installation failed." -ForegroundColor Yellow
    }
}

# Manual installation instructions
Write-Host ""
Write-Host "=== Manual Installation Required ===" -ForegroundColor Yellow
Write-Host ""
Write-Host "Please install Google Cloud SDK manually:" -ForegroundColor Cyan
Write-Host ""
Write-Host "Option 1: Download installer" -ForegroundColor White
Write-Host "  1. Visit: https://cloud.google.com/sdk/docs/install" -ForegroundColor Gray
Write-Host "  2. Download the Windows installer" -ForegroundColor Gray
Write-Host "  3. Run the installer" -ForegroundColor Gray
Write-Host "  4. Restart your terminal" -ForegroundColor Gray
Write-Host ""
Write-Host "Option 2: Use PowerShell (if you have admin rights)" -ForegroundColor White
Write-Host "  (New-Object Net.WebClient).DownloadFile('https://dl.google.com/dl/cloudsdk/channels/rapid/GoogleCloudSDKInstaller.exe', `$env:TEMP\GoogleCloudSDKInstaller.exe)" -ForegroundColor Gray
Write-Host "  & `$env:TEMP\GoogleCloudSDKInstaller.exe" -ForegroundColor Gray
Write-Host ""
Write-Host "After installation, restart terminal and run:" -ForegroundColor Yellow
Write-Host "  gcloud auth login" -ForegroundColor White
Write-Host "  gcloud config set project smrtvocab" -ForegroundColor White
Write-Host "  gcloud services enable cloudbuild.googleapis.com" -ForegroundColor White
Write-Host "  gcloud services enable run.googleapis.com" -ForegroundColor White
Write-Host ""

