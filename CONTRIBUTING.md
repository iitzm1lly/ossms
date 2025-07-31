# Contributing to OSSMS

Thank you for your interest in contributing to the Office Supply Stock Management System (OSSMS)! This document provides guidelines and information for contributors.

## 🤝 How to Contribute

### Reporting Issues
- Use the [GitHub Issues](https://github.com/your-repo/ossms/issues) page
- Include detailed steps to reproduce the issue
- Provide system information (OS, Node.js version, Rust version)
- Include error messages and logs

### Suggesting Features
- Use the [GitHub Discussions](https://github.com/your-repo/ossms/discussions) page
- Describe the feature and its benefits
- Consider implementation complexity
- Check if it aligns with the project goals

### Code Contributions
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 🛠️ Development Setup

### Prerequisites
- Node.js 18+
- Rust 1.77+
- Git

### Local Development
```bash
# Clone your fork
git clone https://github.com/your-username/ossms.git
cd ossms

# Install dependencies
npm install

# Start development server
npm run tauri dev
```

## 📝 Code Style Guidelines

### Frontend (TypeScript/React)
- Use TypeScript for all new code
- Follow ESLint and Prettier configurations
- Use functional components with hooks
- Implement proper error handling
- Add JSDoc comments for complex functions

### Backend (Rust)
- Follow Rust coding conventions
- Use `cargo clippy` for linting
- Implement proper error handling with `Result<T, E>`
- Add documentation comments (`///`)
- Use meaningful variable and function names

### Database
- All database operations go through the `Database` struct
- Use prepared statements to prevent SQL injection
- Implement proper transaction handling
- Add indexes for frequently queried columns

## 🧪 Testing

### Frontend Testing
```bash
# Run linting
npm run lint

# Type checking
npx tsc --noEmit
```

### Backend Testing
```bash
# Run Rust tests
cd src-tauri
cargo test
cargo clippy
```

### Integration Testing
- Test the complete user workflow
- Verify database operations
- Check error handling scenarios
- Test on different operating systems

## 📦 Building and Testing

### Development Build
```bash
npm run tauri dev
```

### Production Build
```bash
npm run tauri:build:clean
```

### Clean Build (Recommended)
```bash
# Windows
.\build.ps1

# Unix/Linux/macOS
./build.sh
```

## 🔧 Database Development

### Schema Changes
1. Update the schema in `src-tauri/src/database.rs`
2. Add migration logic if needed
3. Update sample data if necessary
4. Test with existing data

### Adding New Tables
```rust
// Example: Adding a new table
fn create_new_table(&self) -> Result<()> {
    self.conn.execute(
        "CREATE TABLE IF NOT EXISTS new_table (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            created_at TEXT NOT NULL
        )",
        [],
    )?;
    Ok(())
}
```

## 🎨 UI/UX Guidelines

### Design System
- Use shadcn/ui components
- Follow Tailwind CSS conventions
- Maintain consistent spacing and typography
- Ensure accessibility (ARIA labels, keyboard navigation)

### Component Structure
```typescript
// Example component structure
interface ComponentProps {
  // Props interface
}

export function Component({ prop1, prop2 }: ComponentProps) {
  // Component logic
  return (
    // JSX with proper accessibility
  );
}
```

## 🔒 Security Guidelines

### Frontend Security
- Validate all user inputs
- Sanitize data before rendering
- Use HTTPS in production
- Implement proper authentication

### Backend Security
- Use parameterized queries
- Validate all inputs
- Implement proper error handling
- Use secure password hashing (bcrypt)

## 📚 Documentation

### Code Documentation
- Add JSDoc comments for TypeScript functions
- Add Rust documentation comments (`///`)
- Update README.md for new features
- Document API changes

### User Documentation
- Update user guides for new features
- Add screenshots for UI changes
- Document configuration options

## 🚀 Pull Request Process

### Before Submitting
1. **Test your changes thoroughly**
   - Test on multiple operating systems
   - Verify all functionality works
   - Check for regressions

2. **Update documentation**
   - Update README.md if needed
   - Add inline code comments
   - Update API documentation

3. **Follow the commit message convention**
   ```
   feat: add new inventory tracking feature
   fix: resolve database connection issue
   docs: update installation instructions
   style: format code according to guidelines
   refactor: improve error handling
   test: add unit tests for user authentication
   ```

### Pull Request Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tested on Windows
- [ ] Tested on macOS
- [ ] Tested on Linux
- [ ] Added unit tests
- [ ] Updated documentation

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No breaking changes
```

## 🏷️ Version Control

### Branch Naming
- `feature/feature-name` - New features
- `fix/bug-description` - Bug fixes
- `docs/documentation-update` - Documentation changes
- `refactor/component-name` - Code refactoring

### Commit Messages
- Use conventional commit format
- Keep messages concise but descriptive
- Reference issues when applicable

## 🆘 Getting Help

### Questions and Discussions
- Use [GitHub Discussions](https://github.com/your-repo/ossms/discussions)
- Check existing issues and pull requests
- Review the documentation

### Development Issues
- Check the troubleshooting section in BUILD.md
- Verify your development environment
- Test with a clean build

## 📄 License

By contributing to OSSMS, you agree that your contributions will be licensed under the MIT License.

## 🙏 Recognition

Contributors will be recognized in:
- The project README.md
- Release notes
- GitHub contributors page

Thank you for contributing to OSSMS! 