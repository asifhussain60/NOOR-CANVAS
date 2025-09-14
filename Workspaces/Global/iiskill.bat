@echo off
REM Wrapper to run the iiskill PowerShell script from cmd
setlocal
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0iiskill.ps1" %*
endlocal
