# Development Workflow User Guide

A user-friendly guide for NOOR Canvas development workflows.

## Getting Started

### Prerequisites

- Visual Studio Code with C# DevKit extension
- .NET 8.0 SDK installed
- Git for version control
- PowerShell 5.1 or later

### Initial Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/asifhussain60/NOOR-CANVAS.git
   cd NOOR-CANVAS
   ```

2. **Open in VS Code**

   ```bash
   code .
   ```

3. **Install dependencies**
   ```bash
   dotnet restore
   ```

## Daily Development Workflow

### 1. Starting Development

Use the global `nc` command to start the development server:

```powershell
nc
```

This will:

- Generate a host token (if needed)
- Build the project
- Start IIS Express x64 on https://localhost:9091
- No browser will open automatically

### 2. Making Code Changes

- Edit your code in VS Code
- Save files (Ctrl+S)
- The system automatically detects changes

### 3. Building and Testing

The system automatically runs tests after builds:

- **Build**: `Ctrl+Shift+B` in VS Code
- **Tests run automatically** if source code changed
- **Skip tests**: Tests are skipped if no changes detected

### 4. Committing Changes

```bash
git add .
git commit -m "Your commit message"
```

Tests run automatically before commit:

- **Pass**: Commit proceeds normally
- **Fail**: Commit is blocked until tests pass

## Available Commands

### Global Commands (Available Anywhere)

- `nc` - Start the development server
- `nct` - Generate host token
- `ncdoc` - View documentation
- `iiskill` - Stop all IIS Express processes

### Command Examples

```powershell
# Start development server
nc

# Start without token generation
nc -SkipTokenGeneration

# Get help
nc -Help

# View documentation
ncdoc

# Stop all servers
iiskill
```

## Understanding the Development Environment

### Ports and URLs

- **HTTPS**: https://localhost:9091 (primary)
- **HTTP**: http://localhost:9090 (fallback)
- **Documentation**: Served by `ncdoc` command

### Project Structure

```
NOOR CANVAS/
├── SPA/NoorCanvas/          # Main application
├── Tests/                   # Test projects
├── DocFX/                   # Documentation
├── Workspaces/Global/       # Global commands
└── .hooks/                  # Automated scripts
```

## Working with Tests

### Automatic Testing

Tests run automatically when:

- Building the project (if code changed)
- Committing code (if source changed)
- Running CI/CD pipelines

### Manual Testing

```powershell
# Run all tests
dotnet test

# Run specific test project
dotnet test Tests/NoorCanvas.Core.Tests/

# Run with detailed output
dotnet test --logger "console;verbosity=detailed"
```

### Understanding Test Results

- **Green/Passed**: All tests successful
- **Red/Failed**: Some tests failed, check output
- **Skipped**: Tests skipped due to no code changes

## Common Scenarios

### First Time Setup

1. Run `nc` to start development server
2. Navigate to https://localhost:9091
3. You should see the NOOR Canvas application

### Adding New Features

1. Create your code changes
2. Build with `Ctrl+Shift+B`
3. Tests run automatically
4. Commit when tests pass

### Fixing Issues

1. Use `iiskill` to stop stuck processes
2. Rebuild with `dotnet clean` and `dotnet build`
3. Check logs in the terminal
4. Refer to troubleshooting guides

### Switching Branches

1. Stop development server with `iiskill`
2. Switch branch: `git checkout branch-name`
3. Restore packages: `dotnet restore`
4. Start server: `nc`

## Troubleshooting Common Issues

### "Port already in use"

```powershell
iiskill
nc
```

### "Build failed"

1. Check the terminal output for errors
2. Fix compilation errors
3. Try `dotnet clean` and rebuild

### "Tests failing"

1. Check test output for specific failures
2. Fix the failing tests
3. Use `dotnet test --logger "console;verbosity=detailed"` for details

### "Can't commit"

Tests are probably failing. Fix tests first:

```powershell
# Run tests manually to see failures
dotnet test

# Fix issues, then try committing again
git commit -m "Your message"
```

## Getting Help

### Documentation Resources

- **User Guides**: `ncdoc` → User Guides
- **Technical Reference**: `ncdoc` → Technical
- **Issue Tracker**: `IssueTracker/` folder
- **Implementation Guide**: `Workspaces/IMPLEMENTATION-TRACKER.MD`

### Commands for Help

```powershell
nc -Help           # Get nc command help
ncdoc             # View full documentation
```

### Support Channels

- Check existing issues in `IssueTracker/`
- Review implementation tracker for current status
- Consult technical documentation for advanced scenarios

_This user guide is automatically updated as new features and workflows are added to NOOR Canvas._
