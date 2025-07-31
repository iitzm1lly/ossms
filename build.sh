#!/bin/bash

# OSSMS Clean Build Script for Unix/Linux
# This script ensures a completely clean build every time

echo "🧹 Starting clean build process..."

# Step 1: Clean all build artifacts
echo "📦 Cleaning build artifacts..."
rm -rf .next out dist node_modules/.cache

# Step 2: Clean Rust build artifacts
echo "🦀 Cleaning Rust build artifacts..."
cd src-tauri
cargo clean
cd ..

# Step 3: Clean database (optional - uncomment if you want fresh database every time)
# echo "🗄️ Cleaning database..."
# DB_PATH="$HOME/.local/share/.ossms/ossms.db"
# if [ -f "$DB_PATH" ]; then
#     rm -f "$DB_PATH"
# fi

# Step 4: Install dependencies
echo "📥 Installing dependencies..."
npm install

# Step 5: Build the application
echo "🔨 Building application..."
npm run tauri:build

echo "✅ Clean build completed!" 