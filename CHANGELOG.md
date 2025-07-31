# Changelog

All notable changes to the OSSMS project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Production build script (`build-production.ps1`) for automated builds
- Email functionality with SMTP support for password resets
- Comprehensive role-based access control (Admin, Staff, Viewer)
- Password reset functionality with token-based authentication
- Production-ready documentation updates

### Changed
- Optimized Rust compilation settings for production builds
- Updated Next.js configuration for better performance
- Enhanced build scripts for automated production deployment
- Improved error handling and user feedback

### Fixed
- Staff role permissions and dashboard access issues
- Case sensitivity issues with user roles
- Email sending functionality in production environment
- Build optimization and linking issues on Windows
- Database initialization and user permission handling

## [1.0.0] - 2024-01-XX

### Added
- Initial release of OSSMS
- User authentication and management with role-based access
- Inventory management system with categories and subcategories
- Stock movement tracking with detailed history
- Reporting functionality (low-stock alerts, movement reports)
- Cross-platform desktop application (Windows, macOS, Linux)
- SQLite database backend with automatic initialization
- Modern React/Next.js frontend with Tailwind CSS
- Tauri desktop framework integration
- Password reset functionality with email notifications
- Production build automation

### Features
- **User Management**
  - User registration and authentication
  - Role-based access control (Admin, Staff, Viewer)
  - Password hashing with bcrypt
  - User profile management
  - Password reset via email with SMTP support

- **Inventory Management**
  - Add, edit, and delete supplies
  - Category and subcategory organization
  - Quantity tracking with minimum thresholds
  - Location and supplier information
  - Cost tracking and management

- **Stock Movement**
  - Stock in/out tracking with timestamps
  - Detailed history with user attribution
  - Notes and reasons for movements
  - Historical data analysis

- **Reporting**
  - Low stock alerts and notifications
  - Stock movement reports
  - Historical data analysis
  - Export functionality

- **Technical Features**
  - Offline-first architecture
  - Local SQLite database with automatic setup
  - Cross-platform compatibility
  - Modern UI with Tailwind CSS and shadcn/ui
  - Responsive design for desktop applications
  - Production-ready build system

### Technical Stack
- **Frontend**: Next.js 14, React 18, TypeScript
- **Backend**: Rust, Tauri 2.7
- **Database**: SQLite with rusqlite
- **UI**: Tailwind CSS, shadcn/ui components
- **Authentication**: bcrypt password hashing
- **Email**: SMTP support with lettre
- **Build**: Optimized for desktop deployment

### User Roles
- **Admin**: Full system access and user management
- **Staff**: Inventory management and reporting access
- **Viewer**: Read-only access to inventory and reports

---

## Version History

### Version 1.0.0
- Initial stable release
- Complete inventory management system
- Cross-platform desktop application
- Production-ready build system
- Email functionality for password resets
- Comprehensive role-based access control

---

## Migration Guide

### From Development to 1.0.0
- No migration required for new installations
- Database schema is automatically created
- Sample data is seeded on first run
- User roles are automatically assigned based on database entries

---

## Support

For support and questions:
- Check the [README.md](README.md) for setup instructions
- Review [BUILD.md](BUILD.md) for build troubleshooting
- Open an issue on GitHub for bugs
- Use GitHub Discussions for questions

---

**Note**: This changelog follows the [Keep a Changelog](https://keepachangelog.com/) format and uses [Semantic Versioning](https://semver.org/). 