# Troubleshooting Guide

Common issues and solutions for the Portable AI Agent System.

---

## Setup Issues

### PowerShell Not Found
**Problem:** `setup.bat` reports PowerShell not available

**Solution:**
```powershell
# Install PowerShell 7+
winget install Microsoft.PowerShell
```

Or download from: https://github.com/PowerShell/PowerShell/releases

---

### Tool Installation Fails
**Problem:** Roslynator, Playwright, or other tools fail to install

**Solution:**
```powershell
# Run setup as Administrator
# Right-click setup.bat → Run as Administrator

# Or skip tool installation and install manually:
.\setup.ps1 -SkipToolInstall

# Then install tools manually:
dotnet tool install -g roslynator.dotnet.cli
npm install -g @playwright/test
npx playwright install
```

---

### Access Denied Errors
**Problem:** Cannot create directories or files

**Solution:**
- Run `setup.bat` as Administrator
- Check folder permissions
- Ensure project directory is not read-only
- Disable antivirus temporarily

---

## Agent Issues

### Agents Don't Respond
**Problem:** Using `@workspace /task` or other commands produces no response

**Solutions:**
1. **Check GitHub Copilot is active**
   - Look for Copilot icon in VS Code status bar
   - Ensure you're logged in

2. **Verify files exist**
   ```powershell
   # Check prompts installed
   Test-Path .github\prompts\task.prompt.md
   Test-Path .github\instructions\SelfAwareness.instructions.md
   ```

3. **Check file syntax**
   - Open `.github/prompts/task.prompt.md`
   - Ensure no `{{PLACEHOLDER}}` markers remain
   - Verify markdown formatting is correct

4. **Reload VS Code**
   - Press `Ctrl+Shift+P`
   - Type "Reload Window"
   - Press Enter

---

### Agent Syntax Errors
**Problem:** Agent reports "unexpected token" or parsing errors

**Solution:**
```powershell
# Check for unreplaced placeholders
Get-ChildItem .github -Recurse -Include *.md | Select-String "{{PLACEHOLDER"

# If found, run setup again:
.github\_Portable\setup.bat
```

---

### Build Validation Fails
**Problem:** Agent reports build errors during validation

**Solutions:**
1. **Verify project builds independently**
   ```powershell
   dotnet build          # .NET
   npm run build         # Node.js
   mvn clean install     # Java
   ```

2. **Check build command**
   - Open `PROJECT-SETUP-SUMMARY.md`
   - Verify build command is correct
   - Update `.github/prompts/task.prompt.md` if needed

3. **Clear build artifacts**
   ```powershell
   # .NET
   dotnet clean
   Remove-Item -Recurse -Force bin,obj
   
   # Node.js
   Remove-Item -Recurse -Force node_modules
   npm install
   ```

---

## Learning System Issues

### Pattern Files Not Created
**Problem:** `Workspaces/Copilot/learning/patterns/*.json` missing

**Solution:**
```powershell
# Re-run setup or create manually:
New-Item -Path "Workspaces\Copilot\learning\patterns" -ItemType Directory -Force

# Create pattern files
@"
{
  "metadata": {
    "project": "YourProject",
    "created": "$(Get-Date -Format 'yyyy-MM-dd')",
    "version": "1.0.0"
  },
  "patterns": []
}
"@ | Set-Content "Workspaces\Copilot\learning\patterns\successful-patterns.json"
```

---

### Learning Not Persisting
**Problem:** Agents don't seem to remember previous work

**Solution:**
1. **Check pattern files are writable**
   ```powershell
   Test-Path Workspaces\Copilot\learning\patterns\successful-patterns.json -PathType Leaf
   ```

2. **Verify JSON syntax**
   - Open pattern files
   - Ensure valid JSON format
   - Use JSON validator if needed

3. **Check file permissions**
   - Ensure files are not read-only
   - Verify VS Code has write access

---

## Validation Issues

### Roslynator Not Found
**Problem:** Code analysis fails with "roslynator command not found"

**Solution:**
```powershell
# Install globally
dotnet tool install -g roslynator.dotnet.cli

# Verify installation
dotnet tool list -g | Select-String roslynator

# If still not found, add to PATH:
# %USERPROFILE%\.dotnet\tools
```

---

### Playwright Tests Fail
**Problem:** E2E tests fail to run or browser not found

**Solution:**
```powershell
# Install Playwright browsers
npx playwright install

# Install specific browser
npx playwright install chromium

# Update Playwright
npm update @playwright/test
npx playwright install
```

---

### ESLint/Prettier Errors
**Problem:** Linting fails or configuration not found

**Solution:**
```powershell
# Install in project
npm install -D eslint prettier

# Create config files
npx eslint --init

# For Prettier
echo {} > .prettierrc.json
```

---

## Performance Issues

### Setup Takes Too Long
**Problem:** Setup script runs for 30+ minutes

**Cause:** Tool installation downloads large files

**Solutions:**
- Use `-SkipToolInstall` and install tools manually later
- Check internet connection speed
- Use local package cache if available

---

### Agent Responses Slow
**Problem:** Agents take long time to respond

**Cause:** Large codebase or complex project

**Solutions:**
1. **Optimize .gitignore**
   - Exclude `bin/`, `obj/`, `node_modules/`
   - Exclude generated files

2. **Reduce scope**
   - Use specific file references
   - Break large tasks into smaller chunks

3. **Check Copilot status**
   - Ensure not rate-limited
   - Check Copilot subscription active

---

## Git Issues

### Checkpoint Commits Fail
**Problem:** Agents report "git commit failed"

**Solution:**
```powershell
# Configure git user (required)
git config user.name "Your Name"
git config user.email "you@example.com"

# Verify git repo exists
git status

# If not a git repo:
git init
git add .
git commit -m "Initial commit"
```

---

### Merge Conflicts During Rollback
**Problem:** Automatic rollback fails due to conflicts

**Solution:**
```powershell
# Manual rollback
git status
git reset --hard HEAD~1

# Or abort and fix manually
git merge --abort
```

---

## Project-Specific Issues

### .NET Project Not Detected
**Problem:** Setup reports "Unknown" project type for .NET solution

**Solution:**
- Ensure `.sln` or `.csproj` files exist in project root or subdirectories
- Run setup from correct directory
- Manually specify project type in `PROJECT-SETUP-SUMMARY.md`

---

### Node.js Dependencies Not Found
**Problem:** Setup doesn't detect React/Vue/Angular

**Solution:**
- Ensure `package.json` exists
- Run `npm install` to create `node_modules/`
- Check dependencies listed in `package.json`

---

### Python Virtual Environment Issues
**Problem:** Setup doesn't detect Python project

**Solution:**
```powershell
# Ensure .py files exist
# Create requirements.txt if missing
pip freeze > requirements.txt

# Activate virtual environment before setup
.\venv\Scripts\Activate.ps1
```

---

## Advanced Troubleshooting

### Dry Run Mode
Preview what setup will do without making changes:
```powershell
.\setup.ps1 -DryRun
```

### Verbose Logging
Enable detailed output:
```powershell
.\setup.ps1 -Verbose
```

### Manual Reset
Remove all AI agent files and start fresh:
```powershell
# Remove generated files (WARNING: This deletes configuration!)
Remove-Item -Recurse -Force .github\prompts
Remove-Item -Recurse -Force .github\instructions
Remove-Item -Recurse -Force Workspaces\Copilot
Remove-Item PROJECT-SETUP-SUMMARY.md

# Re-run setup
.github\_Portable\setup.bat
```

---

## Still Having Issues?

1. **Check setup summary**
   - Review `PROJECT-SETUP-SUMMARY.md`
   - Verify all components installed

2. **Review logs**
   - Check PowerShell error messages
   - Look for specific error codes

3. **Validate manually**
   ```powershell
   # Check all required files
   Test-Path .github\prompts\task.prompt.md
   Test-Path .github\instructions\SelfAwareness.instructions.md
   Test-Path Workspaces\Copilot\learning\patterns
   ```

4. **Consult documentation**
   - [`INSTALLATION-GUIDE.md`](../INSTALLATION-GUIDE.md)
   - [`ADVANCED-USAGE.md`](ADVANCED-USAGE.md)
   - [`README.md`](../README.md)

---

## Getting Help

If you're still stuck:
1. Review error messages carefully
2. Check VS Code output panel
3. Verify prerequisites installed
4. Try manual installation as fallback
5. Check GitHub Copilot status

---

*Last Updated: October 11, 2025*
