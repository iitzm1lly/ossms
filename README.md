# OSSMS - Office Supply Stock Management System

A modern, cross-platform desktop application for managing office supplies and inventory, built with Next.js, Tauri, and SQLite.

## 🚀 Features

- **User Management**: Secure authentication and role-based access control
- **Inventory Management**: Track supplies, quantities, and locations
- **Stock Movement**: Monitor stock in/out with detailed history
- **Reporting**: Generate low-stock alerts and movement reports
- **Cross-Platform**: Works on Windows, macOS, and Linux
- **Offline-First**: Local SQLite database for reliable operation
- **Modern UI**: Beautiful, responsive interface built with Tailwind CSS

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
npm run tauri build
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

## 🏗️ Project Structure

```
ossms/
├── app/                    # Next.js app directory
│   ├── (dashboard)/       # Dashboard routes
│   ├── globals.css        # Global styles
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── ui/               # UI components (shadcn/ui)
│   └── services/         # API services
├── lib/                  # Utility functions
├── src-tauri/           # Rust backend
│   ├── src/             # Rust source code
│   ├── Cargo.toml       # Rust dependencies
│   └── tauri.conf.json  # Tauri configuration
├── public/              # Static assets
└── styles/              # Additional styles
```

## 🔧 Configuration

### Environment Variables
Create a `.env.local` file for local development:
```env
NEXT_PUBLIC_APP_NAME=OSSMS
NEXT_PUBLIC_APP_VERSION=1.0.0
```

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
npm run tauri build
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

## 📚 API Reference

### Authentication
- `POST /api/login` - User authentication
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

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/your-repo/ossms/issues)
- **Documentation**: [Wiki](https://github.com/your-repo/ossms/wiki)
- **Discussions**: [GitHub Discussions](https://github.com/your-repo/ossms/discussions)

## 🗺️ Roadmap

- [ ] Multi-language support
- [ ] Advanced reporting
- [ ] Barcode scanning
- [ ] Cloud synchronization
- [ ] Mobile app
- [ ] API for external integrations

---

**OSSMS** - Making office supply management simple and efficient. 