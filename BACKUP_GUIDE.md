# OSSMS Data Backup Guide

This guide provides comprehensive instructions for backing up your OSSMS data to ensure data safety and recovery.

## 📍 Database Location

The OSSMS database is stored in the following locations:

### Windows
```
%LOCALAPPDATA%\.ossms\ossms.db
```
**Typical path**: `C:\Users\[YourUsername]\AppData\Local\.ossms\ossms.db`

### macOS
```
~/Library/Application Support/.ossms/ossms.db
```
**Typical path**: `/Users/[YourUsername]/Library/Application Support/.ossms/ossms.db`

### Linux
```
~/.local/share/.ossms/ossms.db
```
**Typical path**: `/home/[YourUsername]/.local/share/.ossms/ossms.db`

## 🔍 Finding Your Database

### Method 1: Using File Explorer/Finder
1. **Windows**: Press `Win + R`, type `%LOCALAPPDATA%`, press Enter
2. **macOS**: Open Finder, press `Cmd + Shift + G`, type `~/Library/Application Support`
3. **Linux**: Open file manager, navigate to `~/.local/share`

Then look for the `.ossms` folder and the `ossms.db` file inside.

### Method 2: Using Command Line
```bash
# Windows (PowerShell)
Get-ChildItem -Path "$env:LOCALAPPDATA\.ossms" -Recurse

# macOS/Linux
ls -la ~/.local/share/.ossms/
# or
ls -la ~/Library/Application\ Support/.ossms/
```

## 💾 Backup Methods

### Method 1: Simple File Copy (Recommended)

#### Windows
```powershell
# Create backup directory
New-Item -ItemType Directory -Path "C:\OSSMS_Backups" -Force

# Copy database with timestamp
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
Copy-Item "$env:LOCALAPPDATA\.ossms\ossms.db" "C:\OSSMS_Backups\ossms_backup_$timestamp.db"

# Verify backup
Get-ChildItem "C:\OSSMS_Backups\ossms_backup_$timestamp.db"
```

#### macOS/Linux
```bash
# Create backup directory
mkdir -p ~/OSSMS_Backups

# Copy database with timestamp
timestamp=$(date +"%Y-%m-%d_%H-%M-%S")
cp ~/.local/share/.ossms/ossms.db ~/OSSMS_Backups/ossms_backup_$timestamp.db

# Verify backup
ls -la ~/OSSMS_Backups/ossms_backup_$timestamp.db
```

### Method 2: SQLite Backup (More Reliable)

#### Windows
```powershell
# Install SQLite if not already installed
# Download from https://www.sqlite.org/download.html

# Create backup using SQLite
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
sqlite3 "$env:LOCALAPPDATA\.ossms\ossms.db" ".backup 'C:\OSSMS_Backups\ossms_backup_$timestamp.db'"
```

#### macOS/Linux
```bash
# Install SQLite if not already installed
# macOS: brew install sqlite3
# Ubuntu/Debian: sudo apt-get install sqlite3

# Create backup using SQLite
timestamp=$(date +"%Y-%m-%d_%H-%M-%S")
sqlite3 ~/.local/share/.ossms/ossms.db ".backup ~/OSSMS_Backups/ossms_backup_$timestamp.db"
```

### Method 3: Automated Backup Script

#### Windows PowerShell Script
Create a file named `backup-ossms.ps1`:

```powershell
# OSSMS Backup Script
param(
    [string]$BackupPath = "C:\OSSMS_Backups"
)

# Create backup directory if it doesn't exist
if (!(Test-Path $BackupPath)) {
    New-Item -ItemType Directory -Path $BackupPath -Force
}

# Get database path
$dbPath = "$env:LOCALAPPDATA\.ossms\ossms.db"

# Check if database exists
if (!(Test-Path $dbPath)) {
    Write-Error "Database not found at: $dbPath"
    exit 1
}

# Create timestamp
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$backupFile = "$BackupPath\ossms_backup_$timestamp.db"

# Create backup
try {
    Copy-Item $dbPath $backupFile
    Write-Host "Backup created successfully: $backupFile"
    
    # Get file size
    $size = (Get-Item $backupFile).Length
    Write-Host "Backup size: $([math]::Round($size/1MB, 2)) MB"
    
    # List recent backups
    Write-Host "`nRecent backups:"
    Get-ChildItem $BackupPath -Filter "ossms_backup_*.db" | 
        Sort-Object LastWriteTime -Descending | 
        Select-Object -First 5 | 
        ForEach-Object { Write-Host "  $($_.Name) - $($_.LastWriteTime)" }
        
} catch {
    Write-Error "Backup failed: $($_.Exception.Message)"
    exit 1
}
```

#### macOS/Linux Bash Script
Create a file named `backup-ossms.sh`:

```bash
#!/bin/bash

# OSSMS Backup Script
BACKUP_PATH="${HOME}/OSSMS_Backups"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_PATH"

# Get database path
if [[ "$OSTYPE" == "darwin"* ]]; then
    DB_PATH="${HOME}/Library/Application Support/.ossms/ossms.db"
else
    DB_PATH="${HOME}/.local/share/.ossms/ossms.db"
fi

# Check if database exists
if [ ! -f "$DB_PATH" ]; then
    echo "Error: Database not found at: $DB_PATH"
    exit 1
fi

# Create timestamp
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_FILE="$BACKUP_PATH/ossms_backup_$TIMESTAMP.db"

# Create backup
if cp "$DB_PATH" "$BACKUP_FILE"; then
    echo "Backup created successfully: $BACKUP_FILE"
    
    # Get file size
    SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo "Backup size: $SIZE"
    
    # List recent backups
    echo ""
    echo "Recent backups:"
    ls -la "$BACKUP_PATH"/ossms_backup_*.db 2>/dev/null | tail -5
else
    echo "Error: Backup failed"
    exit 1
fi
```

Make it executable:
```bash
chmod +x backup-ossms.sh
```

## 🔄 Restore Procedures

### Method 1: Simple File Restore

1. **Stop OSSMS** - Close the application completely
2. **Backup current database** (optional but recommended)
3. **Replace database file**:
   ```bash
   # Windows
   Copy-Item "C:\OSSMS_Backups\ossms_backup_2024-01-15_14-30-00.db" "$env:LOCALAPPDATA\.ossms\ossms.db"
   
   # macOS/Linux
   cp ~/OSSMS_Backups/ossms_backup_2024-01-15_14-30-00.db ~/.local/share/.ossms/ossms.db
   ```
4. **Start OSSMS** - Launch the application

### Method 2: SQLite Restore

```bash
# Windows
sqlite3 "$env:LOCALAPPDATA\.ossms\ossms.db" ".restore 'C:\OSSMS_Backups\ossms_backup_2024-01-15_14-30-00.db'"

# macOS/Linux
sqlite3 ~/.local/share/.ossms/ossms.db ".restore ~/OSSMS_Backups/ossms_backup_2024-01-15_14-30-00.db"
```

## 📅 Automated Backup Schedule

### Windows Task Scheduler
1. Open Task Scheduler
2. Create Basic Task
3. Set trigger (e.g., daily at 2 AM)
4. Action: Start a program
5. Program: `powershell.exe`
6. Arguments: `-ExecutionPolicy Bypass -File "C:\path\to\backup-ossms.ps1"`

### macOS/Linux Cron Job
```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * /path/to/backup-ossms.sh

# Add weekly backup on Sundays at 3 AM
0 3 * * 0 /path/to/backup-ossms.sh
```

## 🔒 Backup Security

### Encryption (Optional)
```bash
# Encrypt backup
gpg --encrypt --recipient your-email@example.com ossms_backup_2024-01-15_14-30-00.db

# Decrypt backup
gpg --decrypt ossms_backup_2024-01-15_14-30-00.db.gpg > ossms_backup_2024-01-15_14-30-00.db
```

### Cloud Backup
- **Google Drive**: Upload backup files to Google Drive
- **Dropbox**: Sync backup folder to Dropbox
- **OneDrive**: Sync backup folder to OneDrive
- **AWS S3**: Use AWS CLI to upload backups

## 📊 What's Backed Up

The database contains:
- **Users**: All user accounts, roles, and permissions
- **Supplies**: Complete inventory with quantities, locations, suppliers
- **Supply History**: All stock movements and transactions
- **Password Reset Tokens**: Temporary tokens for password resets

## ⚠️ Important Notes

1. **Always close OSSMS** before backing up or restoring
2. **Test your backups** by restoring to a test location
3. **Keep multiple backup versions** for safety
4. **Store backups in different locations** (local + cloud)
5. **Verify backup integrity** after creation
6. **Document your backup procedures** for your team

## 🚨 Emergency Recovery

If your database is corrupted or lost:

1. **Stop using OSSMS** immediately
2. **Locate your most recent backup**
3. **Restore using the procedures above**
4. **Verify data integrity** after restoration
5. **Create a new backup** once restored

## 📞 Troubleshooting

### Database Not Found
- Check if OSSMS has been run at least once
- Verify the database path for your operating system
- Ensure you have proper permissions

### Backup Fails
- Check available disk space
- Verify file permissions
- Ensure OSSMS is completely closed

### Restore Fails
- Verify backup file integrity
- Check file permissions
- Ensure OSSMS is completely closed
- Try SQLite restore method instead of file copy

---

**Last Updated**: August 2025  
**Version**: 1.0  
**Maintainer**: OSSMS Contributors
