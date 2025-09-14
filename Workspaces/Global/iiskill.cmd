@echo off
REM CMD wrapper to run the iiskill PowerShell script
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0iiskill.ps1" %*
