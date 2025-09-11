@echo off
REM NOOR Canvas Run Command Wrapper
REM This batch file allows running ncrun from anywhere

setlocal

REM Get the directory where this batch file is located
set "SCRIPT_DIR=%~dp0"

REM Call the PowerShell script
powershell.exe -ExecutionPolicy Bypass -File "%SCRIPT_DIR%ncrun.ps1" %*

endlocal
