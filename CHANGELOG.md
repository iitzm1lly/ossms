# Changelog

All notable changes to the OSSMS project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Stock Status Calculation Improvements**: Centralized and consistent stock status calculation across all components
- **Modernized PDF Reports**: Updated low stock and stock movement reports with institutional branding and optimized layout
- **Enhanced User Experience**: Added hover tooltips explaining stock status thresholds
- **Space-Optimized PDFs**: Reduced margins, padding, and font sizes for better content density
- **Institutional Branding**: Added UST and CICS logos to PDF reports
- **Improved Report Filtering**: Low stock reports now correctly filter to show only low stock items
- **Chart Spacing Optimization**: Improved text spacing and readability in history dashboard charts
- **Updated Sample Data**: Replaced generic sample users with UST-specific user details for the following individuals (Arne B. Barcelo, Madonna G. Kho, Roma Faith P. Gonzaga, Aristotle B. Garcia)

### Changed
- **Stock Status Logic**: Fixed inconsistent calculations that caused items like AA Batteries (18 pieces) to show incorrect status
- **PDF Report Styling**: Updated color scheme to match dashboard design with professional layout
- **Report Content**: Updated summary sections to reflect only relevant data (low stock items only)
- **Debug Information**: Removed all debug console logs and test files for cleaner production code
- **Typography**: Optimized font sizes and spacing in PDF reports for better readability
- **Chart Layout**: Enhanced chart margins, font sizes, and container heights for better text spacing

### Fixed
- **Stock Status Consistency**: All components now use the same calculation logic
- **Report Accuracy**: Low stock reports now show only items with "Low" status
- **PDF Layout**: Improved space usage and content density in reports
- **User Interface**: Added helpful tooltips explaining stock status thresholds
- **Code Cleanliness**: Removed obsolete debug files and console statements
- **Chart Readability**: Fixed cramped text spacing in history dashboard charts, especially x-axis labels

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