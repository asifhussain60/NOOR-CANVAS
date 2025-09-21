# Global Commands User Guide

## Overview

NOOR Canvas provides a suite of global commands that make development and administration tasks easier. These commands are available from any directory on your system and provide consistent, reliable functionality for common operations.

## Available Commands

### NC - Application Runner

The primary command for starting the NOOR Canvas application during development.

**When to use**: Starting the development server for testing or development work.

**What it does**:

- Generates required host tokens
- Builds the application
- Starts IIS Express x64 server
- Makes the application available at https://localhost:9091

**Basic Usage**:

```powershell
nc
```

This will start the complete development workflow automatically.

### NCT - Token Generator

Creates secure host tokens required for session management.

**When to use**: When you need to generate new host tokens for testing or administration.

**What it does**:

- Generates cryptographically secure GUIDs
- Stores tokens in the database
- Provides tokens for session creation

**Basic Usage**:

```powershell
nct
```

### NCDOC - Documentation Site

Opens the complete NOOR Canvas documentation in your browser.

**When to use**: When you need to reference documentation, guides, or API information.

**What it does**:

- Builds the latest documentation
- Starts a local documentation server
- Opens your browser to the documentation site

**Basic Usage**:

```powershell
ncdoc
```

### IISKILL - Process Manager

Safely stops all IIS Express processes when needed.

**When to use**: When the development server becomes unresponsive or you need to force-stop all instances.

**What it does**:

- Finds all running IIS Express processes
- Terminates them safely
- Cleans up any locked files

**Basic Usage**:

```powershell
iiskill
```

## Common Workflows

### Starting Development Work

1. Open PowerShell in any directory
2. Run `nc` to start the application
3. Wait for "Application started successfully" message
4. Open browser to https://localhost:9091

### Stopping Development Work

1. Press Ctrl+C in the NC command window, OR
2. Run `iiskill` from any PowerShell window

### Accessing Documentation

1. Run `ncdoc` from any directory
2. Documentation will open in your default browser
3. Browse user guides, technical references, and API docs

### Troubleshooting Server Issues

1. Run `iiskill` to stop all processes
2. Wait 5 seconds
3. Run `nc` to restart clean

## Tips for Success

- **Always use HTTPS**: The application is configured for https://localhost:9091
- **Port conflicts**: If you get port errors, run `iiskill` first
- **Token issues**: Run `nct` to generate fresh tokens if authentication fails
- **Documentation updates**: Run `ncdoc` to see the latest documentation changes

## Getting Help

Each command provides built-in help:

```powershell
nc -Help
nct -Help
ncdoc -Help
iiskill -Help
```

For more detailed technical information, see the [Global Commands Technical Reference](../technical/global-commands-technical-reference.md).
