# Platform-Specific Configuration Setup

## Overview
NOOR Canvas supports both Windows and Mac development environments. Connection strings differ between platforms:
- **Windows**: Uses `Server=AHHOME` (local SQL Server)
- **Mac**: Uses `Server=192.168.1.158,1433` (remote SQL Server via IP)

## First-Time Setup

### On Mac
```bash
# 1. Copy template files to actual config files
cd SPA/NoorCanvas
cp appsettings.json.template appsettings.json
cp appsettings.Development.json.template appsettings.Development.json

# 2. Update connection strings in both files
# Replace: Server=YOUR_SERVER
# With:    Server=192.168.1.158,1433

# For appsettings.json:
sed -i '' 's/Server=YOUR_SERVER/Server=192.168.1.158,1433/g' appsettings.json

# For appsettings.Development.json:
sed -i '' 's/Server=YOUR_SERVER/Server=192.168.1.158,1433/g' appsettings.Development.json

# 3. Update password if needed (default is in template)
```

### On Windows
```powershell
# 1. Copy template files to actual config files
cd SPA\NoorCanvas
Copy-Item appsettings.json.template appsettings.json
Copy-Item appsettings.Development.json.template appsettings.Development.json

# 2. Update connection strings in both files
# Replace: Server=YOUR_SERVER
# With:    Server=AHHOME

# For appsettings.json:
(Get-Content appsettings.json) -replace 'Server=YOUR_SERVER', 'Server=AHHOME' | Set-Content appsettings.json

# For appsettings.Development.json:
(Get-Content appsettings.Development.json) -replace 'Server=YOUR_SERVER', 'Server=AHHOME' | Set-Content appsettings.Development.json

# 3. Update password if needed
```

## Important Notes

⚠️ **DO NOT COMMIT** the actual `appsettings.json` or `appsettings.Development.json` files!

These files are now in `.gitignore` to prevent accidental commits of platform-specific or sensitive configuration.

### Files That Are Git-Ignored (Platform-Specific)
- `SPA/NoorCanvas/appsettings.json`
- `SPA/NoorCanvas/appsettings.Development.json`
- `config/sharedsettings.local.json`

### Files That Are Committed (Templates)
- `SPA/NoorCanvas/appsettings.json.template`
- `SPA/NoorCanvas/appsettings.Development.json.template`

## Switching Between Platforms

When switching from Mac to Windows or vice versa, simply update the `Server` value in:
- `SPA/NoorCanvas/appsettings.json`
- `SPA/NoorCanvas/appsettings.Development.json`

Or re-run the setup commands above for your platform.

## Verification

After setup, verify your configuration:

```bash
# Check if files exist (should show both files)
ls -la SPA/NoorCanvas/appsettings*.json

# Verify connection string
grep "Server=" SPA/NoorCanvas/appsettings.json
```

You should see your platform-specific server name in the output.
