@echo off
:: Copilot Manager Refresh Script
:: Re-run the migration against a new prompt.keys.zip and update the database.

echo ===============================
echo Copilot Manager – Data Refresh
echo ===============================
echo.

set /p KEYS_PATH="Enter the full path to the new prompt.keys.zip: "
if "%KEYS_PATH%"=="" (
  set KEYS_PATH=prompt.keys.zip
)
if not exist "%KEYS_PATH%" (
  echo [ERROR] The file "%KEYS_PATH%" does not exist.
  goto END
)

set /p DB_PATH="Enter path to the existing database [copilot_manager\copilot_manager.db]: "
if "%DB_PATH%"=="" (
  set DB_PATH=copilot_manager\copilot_manager.db
)

set /p OPEN_DASH="Open dashboard after refresh? (Y/N) [Y]: "
if "%OPEN_DASH%"=="" set OPEN_DASH=Y

echo.
echo Activating virtual environment...
call copilot_manager\.venv\Scripts\activate

echo Running migration...
python copilot_manager\migrate.py --keys "%KEYS_PATH%" --db "%DB_PATH%"
if errorlevel 1 (
  echo [ERROR] Migration failed.
  goto END
)

echo Refresh complete.

if /I "%OPEN_DASH%"=="Y" (
  start "" "%cd%\copilot_manager\views\index.html"
)

:END
echo.
echo Refresh script finished.