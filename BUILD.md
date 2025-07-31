# OSSMS Build Guide

This guide explains how to build the OSSMS application efficiently and troubleshoot common build issues.

## 🚀 Quick Start

### Windows
```powershell
# Production build (Recommended)
.\build-production.ps1

# Or use the clean build script
.\build.ps1

# Or use npm scripts
npm run tauri:build:clean
```

### Unix/Linux/macOS
```bash
# Make script executable (first time only)
chmod +x build.sh

# Run the clean build script
./build.sh

# Or use npm scripts
npm run tauri:build:clean
```

## 📋 Available Build Scripts

| Script | Description | Use Case |
|--------|-------------|----------|
| `npm run dev` | Development server | Local development |
| `npm run tauri dev` | Tauri development | Desktop app development |
| `npm run build` | Next.js build | Frontend only |
| `npm run tauri:build` | Tauri build | Production build |
| `npm run tauri:build:clean` | Clean Tauri build | Remove build artifacts |
| `npm run tauri:build:fresh` | Fresh Tauri build | Complete rebuild |
| `.\build-production.ps1` | Production build script | Automated production build |

## 🏭 Production Build

### Automated Production Build (Recommended)
The `build-production.ps1` script provides a complete, automated production build process:

```powershell
# Run the production build script
.\build-production.ps1
```

This script:
- Cleans previous builds
- Installs dependencies
- Builds the frontend
- Builds the Tauri application in release mode
- Provides clear success/failure feedback

### Manual Production Build
If you prefer manual control:

```bash
# 1. Install dependencies
npm install

# 2. Build the frontend
npm run build

# 3. Build the Tauri application
cd src-tauri
cargo build --release
```

## 🧹 What Gets Cleaned

### Build Artifacts
- `.next/` - Next.js build cache
- `out/` - Static export directory
- `dist/` - Distribution files
- `node_modules/.cache/` - Node.js cache

### Rust Artifacts
- `src-tauri/target/` - Rust build artifacts
- `src-tauri/Cargo.lock` - Dependency lock file (regenerated)

### Database (Optional)
- User data directory (commented out by default)
- Uncomment in build scripts if you want fresh database every time

## ⚡ Build Optimizations

### Rust Optimizations
- **Parallel compilation**: Uses all available CPU cores
- **Incremental builds**: Faster subsequent builds
- **Dependency optimization**: Skips optimization for dependencies in development
- **Conditional features**: Logging only enabled when needed
- **Release optimizations**: Full optimization for production builds

### Next.js Optimizations
- **Memory allocation**: 12GB heap size for large builds
- **Static export**: Optimized for Tauri desktop app
- **Image optimization**: Disabled for desktop performance
- **Type checking**: Skipped during build for speed

## 🔧 Manual Clean Build Steps

If you prefer to run commands manually:

```bash
# 1. Clean build artifacts
rm -rf .next out dist node_modules/.cache

# 2. Clean Rust artifacts
cd src-tauri
cargo clean
cd ..

# 3. Reinstall dependencies (optional)
npm install

# 4. Build the application
npm run tauri:build
```

## 🐛 Troubleshooting

### Memory Issues
If you encounter memory issues during build:

```bash
# Use high memory allocation
npm run build:high-memory

# Or set environment variable
export NODE_OPTIONS="--max-old-space-size=16384"
npm run tauri:build
```

### Database Issues
If the database isn't initializing properly:

```bash
# Remove database and let it recreate
rm -rf ~/.local/share/.ossms/ossms.db  # Linux/macOS
# or
rm -rf %LOCALAPPDATA%\.ossms\ossms.db  # Windows
```

### Rust Build Issues
If Rust compilation fails:

```bash
# Update Rust toolchain
rustup update

# Clean and rebuild
cd src-tauri
cargo clean
cargo build
cd ..
```

### Common Build Errors

#### "Failed to parse Cargo.toml"
- **Cause**: Duplicate sections in Cargo.toml
- **Fix**: Remove duplicate `[profile.release]` sections

#### "Invalid next.config.mjs options"
- **Cause**: Deprecated options like `telemetry`
- **Fix**: Remove deprecated options from next.config.mjs

#### "jobs may not be 0"
- **Cause**: Invalid jobs setting in .cargo/config.toml
- **Fix**: Remove or set jobs to a positive number

#### "tauri does not have that feature"
- **Cause**: Using non-existent Tauri features
- **Fix**: Remove or update to correct feature names

#### "linking with rust-lld failed"
- **Cause**: Missing Tauri CLI or linker configuration
- **Fix**: Install Tauri CLI and ensure proper linker configuration

## 📦 Production Build Features

The production build includes:
- **Optimized binaries**: Stripped debug symbols and optimized for performance
- **Email functionality**: SMTP support for password resets
- **Role-based access**: Complete Admin, Staff, and Viewer role support
- **Database optimization**: SQLite with proper indexing
- **Security features**: Password hashing and secure authentication

## 🔄 Continuous Integration

For CI/CD pipelines, use:

```yaml
# Example GitHub Actions step
- name: Build OSSMS
  run: |
    npm ci
    npm run tauri:build:clean
```

## 📝 Notes

- The database is automatically initialized on first run
- Sample data is seeded only if it doesn't exist
- Build scripts preserve user data by default
- All builds are reproducible and deterministic
- Production builds are optimized for deployment 