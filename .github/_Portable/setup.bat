@echo off
REM ============================================================================
REM Portable AI Agent System - Automated Setup
REM ============================================================================
REM This script automatically configures the AI agent system for your project
REM Supports: .NET, Node.js, Python, Java, Ruby, Go
REM ============================================================================

echo.
echo ========================================
echo  Portable AI Agent System - Setup
echo ========================================
echo.

REM Check if PowerShell is available
where pwsh >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [INFO] Using PowerShell Core...
    pwsh -NoProfile -ExecutionPolicy Bypass -File "%~dp0setup.ps1"
    goto :END
)

where powershell >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [INFO] Using Windows PowerShell...
    powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0setup.ps1"
    goto :END
)

echo [ERROR] PowerShell not found!
echo [ERROR] Please install PowerShell to use this setup script.
echo [ERROR] Download: https://github.com/PowerShell/PowerShell/releases
pause
exit /b 1

:END
echo.
echo ========================================
echo  Setup Complete!
echo ========================================
echo.
echo Next steps:
echo   1. Review generated files in .github/prompts and .github/instructions
echo   2. Check PROJECT-SETUP-SUMMARY.md for your configuration
echo   3. Test with: @workspace /question "What agents are available?"
echo.
pause
