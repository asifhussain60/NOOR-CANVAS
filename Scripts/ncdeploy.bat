@echo off
REM ncdeploy.bat - Wrapper to run ncdeploy.ps1 from any directory
REM Place this file in a directory that's in your PATH (e.g., C:\Windows\System32)
REM Or add D:\PROJECTS\NOOR CANVAS\Scripts to your PATH

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "D:\PROJECTS\NOOR CANVAS\Scripts\ncdeploy.ps1" %*
