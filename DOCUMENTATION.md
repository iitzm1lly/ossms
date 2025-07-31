# OSSMS Documentation Index

This document provides an overview of all documentation files in the OSSMS project and their purposes.

## 📚 Core Documentation

### [README.md](README.md)
**Purpose**: Main project documentation and getting started guide
**Audience**: New users, developers, contributors
**Content**:
- Project overview and features
- Installation instructions
- Quick start guide
- Project structure
- Configuration options (including email setup)
- Troubleshooting guide
- API reference
- Production build instructions

### [BUILD.md](BUILD.md)
**Purpose**: Build system documentation and troubleshooting
**Audience**: Developers, DevOps engineers
**Content**:
- Build scripts and commands
- Production build automation
- Build optimizations
- Manual build steps
- Common build errors and solutions
- Production build features

### [CONTRIBUTING.md](CONTRIBUTING.md)
**Purpose**: Guidelines for contributors
**Audience**: Contributors, developers
**Content**:
- How to contribute
- Development setup
- Code style guidelines
- Testing procedures
- Pull request process
- Security guidelines

### [CHANGELOG.md](CHANGELOG.md)
**Purpose**: Version history and changes
**Audience**: Users, developers, maintainers
**Content**:
- Version history
- Feature additions
- Bug fixes
- Breaking changes
- Migration guides
- Production-ready features

## 📋 Configuration Files

### [package.json](package.json)
**Purpose**: Node.js project configuration
**Content**:
- Dependencies and dev dependencies
- Build scripts
- Project metadata

### [src-tauri/Cargo.toml](src-tauri/Cargo.toml)
**Purpose**: Rust project configuration
**Content**:
- Rust dependencies
- Build profiles
- Feature flags

### [next.config.mjs](next.config.mjs)
**Purpose**: Next.js configuration
**Content**:
- Build optimizations
- Static export settings
- Performance configurations

## 🛠️ Build Scripts

### [build-production.ps1](build-production.ps1)
**Purpose**: Automated production build script for Windows
**Content**:
- Complete production build process
- Automated dependency installation
- Build artifact cleanup
- Success/failure feedback

### [build.ps1](build.ps1)
**Purpose**: Windows PowerShell build script
**Content**:
- Clean build process for Windows
- Automated dependency installation
- Build artifact cleanup

### [build.sh](build.sh)
**Purpose**: Unix/Linux/macOS build script
**Content**:
- Clean build process for Unix systems
- Automated dependency installation
- Build artifact cleanup

## 📁 Project Structure

```
ossms/
├── README.md              # Main documentation
├── BUILD.md               # Build system guide
├── CONTRIBUTING.md        # Contribution guidelines
├── CHANGELOG.md           # Version history
├── LICENSE                # MIT License
├── DOCUMENTATION.md       # This file
├── build-production.ps1   # Production build script
├── build.ps1              # Windows build script
├── build.sh               # Unix build script
├── package.json           # Node.js configuration
├── next.config.mjs        # Next.js configuration
├── src-tauri/
│   ├── Cargo.toml         # Rust configuration
│   └── .cargo/
│       └── config.toml    # Cargo build optimizations
└── app/
    └── globals.css        # Global styles
```

## 🎯 Documentation Guidelines

### Writing Documentation
- Use clear, concise language
- Include code examples where helpful
- Keep information up to date
- Use consistent formatting
- Include troubleshooting sections

### Maintaining Documentation
- Update when features change
- Review and update regularly
- Test all code examples
- Keep links working
- Version documentation with releases

## 🔍 Finding Information

### For New Users
1. Start with [README.md](README.md)
2. Follow the installation guide
3. Check [BUILD.md](BUILD.md) for build issues
4. Review email configuration for password resets

### For Developers
1. Read [CONTRIBUTING.md](CONTRIBUTING.md)
2. Review [BUILD.md](BUILD.md) for build process
3. Check [CHANGELOG.md](CHANGELOG.md) for recent changes
4. Use production build script for deployment

### For Contributors
1. Read [CONTRIBUTING.md](CONTRIBUTING.md) thoroughly
2. Follow the pull request process
3. Update relevant documentation
4. Test production builds

### For Troubleshooting
1. Check [BUILD.md](BUILD.md) for build issues
2. Review [README.md](README.md) troubleshooting section
3. Search GitHub issues for similar problems
4. Verify email configuration for password resets

## 📝 Documentation Standards

### File Naming
- Use descriptive names
- Follow kebab-case for file names
- Use `.md` extension for markdown files

### Content Structure
- Use clear headings
- Include table of contents for long documents
- Use consistent formatting
- Include examples and code snippets

### Links and References
- Use relative links within the project
- Keep links up to date
- Test all links regularly

## 🚀 Production Features

### Current Production-Ready Features
- **Email Functionality**: SMTP support for password resets
- **Role-Based Access**: Complete Admin, Staff, and Viewer support
- **Production Builds**: Automated build scripts
- **Database Optimization**: SQLite with proper indexing
- **Security**: Password hashing and secure authentication

### Build Automation
- Automated production build script
- Clean build processes
- Optimized for deployment
- Cross-platform compatibility

---

**Last Updated**: January 2024
**Maintainer**: OSSMS Contributors 