@echo off
REM Portable AI Agent System Setup Script
REM Windows Batch Version

echo.
echo ================================
echo  Portable AI Agent System Setup
echo ================================
echo.

REM Check if PowerShell is available
where powershell >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: PowerShell is required but not found.
    echo Please install PowerShell or use setup.ps1 directly.
    pause
    exit /b 1
)

REM Run the PowerShell setup script
echo Running PowerShell setup script...
echo.
powershell.exe -ExecutionPolicy Bypass -File "%~dp0setup.ps1"

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo Setup encountered errors.
    pause
    exit /b 1
)

echo.
echo Setup complete! Press any key to exit.
pause >nul
