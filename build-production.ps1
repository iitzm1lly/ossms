# OSSMS Production Build Script
# This script builds the production version of the Tauri application

Write-Host "=== OSSMS Production Build ===" -ForegroundColor Green
Write-Host "Starting production build process..." -ForegroundColor Yellow

# Check if we're in the correct directory
if (-not (Test-Path "src-tauri")) {
    Write-Host "Error: src-tauri directory not found. Please run this script from the project root." -ForegroundColor Red
    exit 1
}

# Clean previous builds
Write-Host "Cleaning previous builds..." -ForegroundColor Yellow
if (Test-Path "src-tauri/target") {
    Remove-Item -Recurse -Force "src-tauri/target"
}

# Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Yellow
npm install

# Build the frontend
Write-Host "Building frontend..." -ForegroundColor Yellow
npm run build

# Build the Tauri application
Write-Host "Building Tauri application..." -ForegroundColor Yellow
cd src-tauri
cargo build --release

# Check if build was successful
if ($LASTEXITCODE -eq 0) {
    Write-Host "=== Build Successful! ===" -ForegroundColor Green
    Write-Host "Production build completed successfully." -ForegroundColor Green
    Write-Host "The executable can be found in: src-tauri/target/release/" -ForegroundColor Cyan
} else {
    Write-Host "=== Build Failed! ===" -ForegroundColor Red
    Write-Host "Please check the error messages above." -ForegroundColor Red
    exit 1
}

cd ..
Write-Host "Production build process completed!" -ForegroundColor Green 