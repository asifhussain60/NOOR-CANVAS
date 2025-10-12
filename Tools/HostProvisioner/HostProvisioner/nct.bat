@echo off
REM NoorCanvas Token (NCT) - Host Provisioner Wrapper
REM This batch file simplifies running the Host Provisioner for production token generation

setlocal

REM Set production environment
set ASPNETCORE_ENVIRONMENT=Production

REM Get the directory where this batch file is located
set SCRIPT_DIR=%~dp0

REM Run the Host Provisioner executable with all arguments passed through
"%SCRIPT_DIR%HostProvisioner.exe" %*

endlocal
