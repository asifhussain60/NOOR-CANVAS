@echo off
rem NOOR Canvas Token (nct) - Interactive Host Provisioner Launcher
rem Clears terminal and launches the interactive Host Provisioner tool

cls
echo 🔐 NOOR Canvas Token (nct) - Host GUID Generator
echo ===============================================
echo.

if "%1"=="-Help" goto :help
if "%1"=="help" goto :help
if "%1"=="/?" goto :help

echo 🚀 Launching Interactive Host Provisioner...
echo.

cd /d "D:\PROJECTS\NOOR CANVAS\Tools\HostProvisioner\HostProvisioner"
dotnet run

if %errorlevel% neq 0 (
    echo.
    echo ❌ Host Provisioner failed to start
    echo Try building the project first
)

echo.
echo 💡 Tip: Use 'nct -Help' to see all available options
goto :eof

:help
echo NOOR Canvas Token (nct) - Interactive Host Provisioner
echo =====================================================
echo.
echo DESCRIPTION:
echo   Interactive tool to generate Host GUIDs for NOOR Canvas sessions
echo.
echo USAGE:
echo   nct                    # Launch interactive Host Provisioner (default)
echo   nct -Help              # Show this help
echo.
echo FEATURES:
echo   • Interactive session ID input
echo   • Automatic GUID generation with HMAC-SHA256 hashing
echo   • Complete hash token display
echo   • Ready-to-use Host GUIDs for authentication
echo   • Generate multiple tokens in one session
echo.
echo EXAMPLE OUTPUT:
echo   📊 Session ID: 123
echo   🆔 Host GUID: 12345678-1234-1234-1234-123456789abc
echo   🔐 Complete Hash: ABC123XYZ789...
echo.
goto :eof
