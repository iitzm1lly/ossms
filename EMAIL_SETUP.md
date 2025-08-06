# Email Setup Guide for OSSMS

This guide will help you set up email functionality for password reset in OSSMS.

## 🚀 Quick Setup

### Step 1: Get Your Gmail App Password

1. **Enable 2-Factor Authentication**
   - Go to https://myaccount.google.com/
   - Navigate to **Security** → **2-Step Verification**
   - Enable 2-Step Verification

2. **Generate App Password**
   - Go to **Security** → **App passwords**
   - Select **Mail** and **Other**
   - Click **Generate**
   - Copy the 16-character password (no spaces)

### Step 2: Update the Code

1. **Open the file**: `src-tauri/src/main.rs`

2. **Find the email configuration section** (around line 20-30):
   ```rust
   // Hardcoded email configuration
   const SMTP_EMAIL: &str = "your-email@gmail.com";  // Replace with your email
   const SMTP_PASSWORD: &str = "your-app-password";  // Replace with your app password
   ```

3. **Replace the values**:
   ```rust
   // Hardcoded email configuration
   const SMTP_EMAIL: &str = "admin@ust.edu.ph";  // Your actual email
   const SMTP_PASSWORD: &str = "abcd efgh ijkl mnop";  // Your app password
   ```

### Step 3: Build and Test

1. **Build the application**:
   ```bash
   npm run tauri:build
   ```

2. **Test password reset**:
   - Run the application
   - Go to login page
   - Click "Forgot Password?"
   - Enter your email address
   - Check if you receive the reset email

## 🔧 Alternative Email Providers

### Outlook/Hotmail
```rust
const SMTP_EMAIL: &str = "your-email@outlook.com";
const SMTP_PASSWORD: &str = "your-app-password";
```

### Yahoo
```rust
const SMTP_EMAIL: &str = "your-email@yahoo.com";
const SMTP_PASSWORD: &str = "your-app-password";
```

## ⚠️ Security Notes

- **Never commit your real credentials** to version control
- **Use App Passwords** instead of your regular password
- **Keep your credentials secure** and don't share them
- **Consider using environment variables** for production deployments

## 🐛 Troubleshooting

### "Authentication failed"
- Ensure 2-Factor Authentication is enabled
- Use the App Password, not your regular password
- Check that the email and password are correct

### "Connection timeout"
- Check your internet connection
- Verify firewall settings
- Try a different email provider

### "Email not received"
- Check spam/junk folder
- Verify email address is correct
- Wait a few minutes for delivery

## 📋 Example Configuration

Here's a complete example:

```rust
// ============================================================================
// EMAIL CONFIGURATION - UPDATE THESE VALUES FOR YOUR EMAIL SETUP
// ============================================================================
// 
// To set up email password reset functionality:
// 1. Replace "your-email@gmail.com" with your actual Gmail address
// 2. Replace "your-app-password" with your Gmail App Password
// 3. Make sure 2-Factor Authentication is enabled on your Gmail account
// 4. Generate an App Password from Google Account settings
//
// Example:
// const SMTP_EMAIL: &str = "admin@ust.edu.ph";
// const SMTP_PASSWORD: &str = "abcd efgh ijkl mnop";
//
// ============================================================================

// Hardcoded email configuration
const SMTP_EMAIL: &str = "admin@ust.edu.ph";  // Replace with your email
const SMTP_PASSWORD: &str = "abcd efgh ijkl mnop";  // Replace with your app password
```

## ✅ Success Indicators

- ✅ Email configuration is updated in `src-tauri/src/main.rs`
- ✅ App Password is generated and copied correctly
- ✅ Application builds successfully
- ✅ Password reset email is received
- ✅ Token in email works for password reset

---

**Note**: This setup uses hardcoded credentials for easier deployment. For production environments, consider using environment variables for better security. 