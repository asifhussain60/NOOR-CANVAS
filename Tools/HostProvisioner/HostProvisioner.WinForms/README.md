# NOOR Canvas Host Provisioner - Windows Forms Application

## Overview

Modern Windows Forms application for generating Host and User tokens for NOOR Canvas sessions. Provides a user-friendly graphical interface with the same functionality as the command-line Host Provisioner utility.

## Features

- **Modern UI Design**: Matches HostLanding.razor color scheme
  - NOOR Green (#006400)
  - NOOR Gold (#C5B358)
  - NOOR Beige (#F8F5F1)
- **NC-Logo**: 200x200px centered at top
- **Environment Detection**: Displays current environment (Development/Production) and target database
- **Token Generation**: Creates both Host and User tokens for a session
- **Clipboard Support**: One-click copy for generated tokens
- **Database Validation**: Verifies session exists and has transcripts before token generation

## Usage

### Running the Application

```powershell
cd Tools\HostProvisioner\HostProvisioner.WinForms
dotnet run
```

### Generating Tokens

1. Enter a **Session ID** (must exist in KSESSIONS database)
2. Click **🔐 Generate Tokens**
3. Host and User tokens will be displayed
4. Click **Copy** buttons to copy tokens to clipboard

## Configuration

The application uses the same configuration files as the CLI tool:

- `appsettings.json` - Base configuration
- `appsettings.Development.json` - Development environment
- `appsettings.Production.json` - Production environment
- `app.config` - Environment detection (modified by ncdeploy)

## Environment Detection

The application automatically detects the environment using:

1. `ASPNETCORE_ENVIRONMENT` environment variable
2. `app.config` file (modified by deployment scripts)
3. Defaults to "Development" if neither is set

## Database Requirements

- **Session must exist** in `dbo.Sessions` table
- **Transcripts must be available** for the session (required for annotation features)

## Token Generation Logic

Uses the same token generation logic as the CLI tool:

1. Validates session exists in KSESSIONS database
2. Verifies session has transcripts available
3. Creates or updates `canvas.Sessions` record
4. Generates 8-character friendly tokens via `SimplifiedTokenService`
5. Tokens are valid for 24 hours

## Build Instructions

```powershell
dotnet build Tools\HostProvisioner\HostProvisioner.WinForms\HostProvisioner.WinForms.csproj
```

## Project Structure

```
HostProvisioner.WinForms/
├── MainForm.cs                    # Main UI form
├── Program.cs                     # Application entry point
├── HostProvisioner.WinForms.csproj # Project file
├── Resources/
│   └── NC-Logo.png               # NOOR Canvas logo (200x200px)
├── appsettings.json              # Configuration
├── appsettings.Development.json  # Dev environment config
├── appsettings.Production.json   # Production config
└── app.config                    # Environment detection
```

## Color Scheme

Matches HostLanding.razor theme:

- **Primary Green**: #006400 (buttons, accents)
- **Gold Accent**: #C5B358 (borders)
- **Beige Background**: #F8F5F1 (form background)
- **White**: #FFFFFF (panels)
- **Brown Text**: #4B3C2B (labels, text)

## Dependencies

- .NET 8.0 Windows Desktop
- Entity Framework Core 8.0
- Microsoft.Extensions.Configuration
- Microsoft.Extensions.DependencyInjection
- NoorCanvas project reference (for DbContext and Services)

## Notes

- Maintains **BOTH** CLI and WinForms applications
- CLI tool remains in `Tools/HostProvisioner/HostProvisioner/`
- WinForms app is in `Tools/HostProvisioner/HostProvisioner.WinForms/`
- Both use the same underlying token generation logic
- Both share the same configuration files
