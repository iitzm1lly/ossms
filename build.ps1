# OSSMS Clean Build Script for Windows
# This script ensures a completely clean build every time

Write-Host "🧹 Starting clean build process..." -ForegroundColor Green

# Step 1: Clean all build artifacts
Write-Host "📦 Cleaning build artifacts..." -ForegroundColor Yellow
if (Test-Path ".next") { Remove-Item -Recurse -Force ".next" }
if (Test-Path "out") { Remove-Item -Recurse -Force "out" }
if (Test-Path "dist") { Remove-Item -Recurse -Force "dist" }
if (Test-Path "node_modules/.cache") { Remove-Item -Recurse -Force "node_modules/.cache" }

# Step 2: Clean Rust build artifacts
Write-Host "🦀 Cleaning Rust build artifacts..." -ForegroundColor Yellow
Set-Location "src-tauri"
cargo clean
Set-Location ".."

# Step 3: Clean database (optional - uncomment if you want fresh database every time)
# Write-Host "🗄️ Cleaning database..." -ForegroundColor Yellow
# $dbPath = "$env:LOCALAPPDATA\.ossms\ossms.db"
# if (Test-Path $dbPath) { Remove-Item -Force $dbPath }

# Step 4: Install dependencies
Write-Host "📥 Installing dependencies..." -ForegroundColor Yellow
npm install

# Step 5: Build the application
Write-Host "🔨 Building application..." -ForegroundColor Yellow
npm run tauri:build

Write-Host "✅ Clean build completed!" -ForegroundColor Green 