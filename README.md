# OSSMS - Office Supply Stock Management System

A modern, cross-platform desktop application for managing office supplies and inventory, built with Next.js, Tauri, and SQLite.

## 🚀 Features

- **User Management**: Secure authentication and role-based access control (Admin, Staff, Viewer)
- **Inventory Management**: Track supplies, quantities, and locations with intelligent stock status calculation
- **Stock Movement**: Monitor stock in/out with detailed history and user attribution
- **Advanced Reporting**: Generate low-stock alerts and movement reports with modern PDF exports
- **Data Visualization**: Interactive charts and graphs for stock movement analysis
- **Email Notifications**: Password reset functionality with SMTP support
- **Cross-Platform**: Works on Windows, macOS, and Linux
- **Offline-First**: Local SQLite database for reliable operation
- **Modern UI**: Beautiful, responsive interface built with Tailwind CSS and shadcn/ui

## 📋 Prerequisites

- **Node.js** 18+ and npm
- **Rust** 1.77+ and Cargo
- **Git**

### Installing Prerequisites

#### Windows
```powershell
# Install Node.js from https://nodejs.org/
# Install Rust
winget install Rust.Rust
# or
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

#### macOS
```bash
# Install Node.js
brew install node

# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

#### Linux
```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ossms
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build the application**
   ```bash
   npm run tauri:build:clean
   ```

## 🚀 Quick Start

### Development Mode
```bash
npm run tauri dev
```

### Production Build
```bash
# Using the production build script (Recommended)
.\build-production.ps1

# Or manually
npm run build
cd src-tauri
cargo build --release
```

### Clean Build (Recommended)
```bash
# Windows
.\build.ps1

# Unix/Linux/macOS
./build.sh
```

## 📦 Build Scripts

| Script | Description | Use Case |
|--------|-------------|----------|
| `npm run dev` | Development server | Local development |
| `npm run tauri dev` | Tauri development | Desktop app development |
| `npm run build` | Next.js build | Frontend only |
| `npm run tauri:build` | Tauri build | Production build |
| `npm run tauri:build:clean` | Clean Tauri build | Remove build artifacts |
| `npm run tauri:build:fresh` | Fresh Tauri build | Complete rebuild |
| `.\build-production.ps1` | Production build script | Automated production build |

## 🏗️ Project Structure

```
ossms/
├── app/                    # Next.js app directory
│   ├── (dashboard)/       # Dashboard routes
│   │   ├── dashboard/     # Main dashboard
│   │   ├── inventory/     # Inventory management
│   │   ├── item-history/  # Stock movement history
│   │   ├── reports/       # Reporting system
│   │   └── users/         # User management
│   ├── globals.css        # Global styles
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── ui/               # UI components (shadcn/ui)
│   └── services/         # API services
├── lib/                  # Utility functions
│   ├── utils.ts          # Stock status calculation
│   ├── permissions.ts    # Role-based access control
│   └── actions.ts        # API actions
├── src-tauri/           # Rust backend
│   ├── src/             # Rust source code
│   ├── Cargo.toml       # Rust dependencies
│   └── tauri.conf.json  # Tauri configuration
├── public/              # Static assets
└── hooks/               # Custom React hooks
```

## 🔧 Configuration

### Environment Variables
Create a `.env.local` file for local development:
```env
NEXT_PUBLIC_APP_NAME=OSSMS
NEXT_PUBLIC_APP_VERSION=1.0.0
```

### Email Configuration (Optional)
For password reset functionality, update the hardcoded credentials in `src-tauri/src/main.rs`:

```rust
// Hardcoded email configuration
const SMTP_EMAIL: &str = "your-email@gmail.com";  // Replace with your email
const SMTP_PASSWORD: &str = "your-app-password";  // Replace with your app password
```

**Note**: For Gmail, you need to:
1. Enable 2-Factor Authentication
2. Generate an App Password (16 characters, no spaces)
3. Replace the values in the code with your actual credentials

### Database
The application uses SQLite for data storage. The database is automatically created at:
- **Windows**: `%LOCALAPPDATA%\.ossms\ossms.db`
- **macOS**: `~/Library/Application Support/.ossms/ossms.db`
- **Linux**: `~/.local/share/.ossms/ossms.db`

## 🧪 Development

### Code Style
- **Frontend**: TypeScript, ESLint, Prettier
- **Backend**: Rust with clippy
- **Styling**: Tailwind CSS with shadcn/ui components

### Testing
```bash
# Run linting
npm run lint

# Type checking
npx tsc --noEmit
```

### Database Development
The database schema is defined in `src-tauri/src/database.rs`. Sample data is automatically seeded on first run.

## 🚀 Deployment

### Building for Distribution
```bash
# Automated production build
.\build-production.ps1

# Or manual build
npm run build
cd src-tauri
cargo build --release
```

The executable will be created in `src-tauri/target/release/`:
- **Windows**: `app.exe`
- **macOS**: `app.app`
- **Linux**: `app`

### Distribution
- **Windows**: Use the `.exe` file directly
- **macOS**: Create a `.dmg` from the `.app` bundle
- **Linux**: Package as `.deb`, `.rpm`, or `.AppImage`

## 🐛 Troubleshooting

### Build Issues
1. **Memory Issues**: Use `npm run build:high-memory`
2. **Rust Issues**: Run `rustup update` and `cargo clean`
3. **Node Issues**: Clear cache with `npm run build:clean`

### Database Issues
```bash
# Reset database (WARNING: This will delete all data)
# Windows
Remove-Item "$env:LOCALAPPDATA\.ossms\ossms.db"

# Unix/Linux/macOS
rm ~/.local/share/.ossms/ossms.db
```

### Common Errors
- **"Failed to parse Cargo.toml"**: Check for duplicate sections
- **"Invalid next.config.mjs"**: Remove deprecated options
- **"jobs may not be 0"**: Fix `.cargo/config.toml` settings
- **"linking with rust-lld failed"**: Ensure Tauri CLI is installed

## 📚 API Reference

### Authentication
- `POST /api/login` - User authentication
- `POST /api/forgot-password` - Request password reset
- `POST /api/reset-password` - Reset password with token
- `GET /api/users` - Get all users
- `POST /api/users` - Create new user

### Inventory
- `GET /api/supplies` - Get all supplies
- `POST /api/supplies` - Create new supply
- `PUT /api/supplies/:id` - Update supply
- `DELETE /api/supplies/:id` - Delete supply

### History
- `GET /api/history` - Get supply history
- `DELETE /api/history/:id` - Delete history record

### Reports
- `GET /api/reports/low-stock` - Get low stock report
- `GET /api/reports/stock-movement` - Get stock movement report

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

### Logo Usage
This software includes logos from the University of Santo Tomas and the College of Information and Computing Sciences. These logos are used for educational purposes only and are not part of the MIT license. See [LOGO_LICENSE.md](LOGO_LICENSE.md) for detailed usage guidelines and restrictions.

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/your-repo/ossms/issues) *(Coming Soon)*
- **Documentation**: [Wiki](https://github.com/your-repo/ossms/wiki) *(Coming Soon)*
- **Discussions**: [GitHub Discussions](https://github.com/your-repo/ossms/discussions) *(Coming Soon)*

### Alternative Support Options
- **In-App Support**: Use the Support page within the application
- **Email Support**: Contact your system administrator
- **Local Documentation**: See [DOCUMENTATION.md](DOCUMENTATION.md) for detailed guides
- **Troubleshooting**: Check the [Troubleshooting](#-troubleshooting) section above

## 🗺️ Roadmap

- [ ] Multi-language support
- [ ] Advanced reporting with charts
- [ ] Barcode scanning
- [ ] Cloud synchronization
- [ ] Mobile app
- [ ] API for external integrations
- [ ] Configurable stock status thresholds
- [ ] Advanced alerts and notifications

---

**OSSMS** - Making office supply management simple and efficient. 