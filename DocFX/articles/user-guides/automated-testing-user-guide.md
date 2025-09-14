# Automated Testing System User Guide

## Overview

NOOR Canvas includes a comprehensive automated testing system that runs tests automatically during development without requiring manual intervention. This ensures code quality and catches issues early in the development process.

## How Automated Testing Works

### Automatic Test Execution
Tests run automatically in two scenarios:

1. **After Every Build**: When you build the project, tests run automatically if the build output has changed
2. **Before Every Commit**: When you commit code to Git, tests run to ensure you're not committing broken code

### Smart Caching System
The testing system is intelligent and won't run unnecessary tests:
- If you build the same code twice, tests only run the first time
- If you haven't changed any source code since the last test, tests are skipped
- This saves time while ensuring thorough testing

## What Tests Are Included

### Build Verification Tests
- **Project Compilation**: Ensures all C# code compiles correctly
- **Dependency Resolution**: Verifies all NuGet packages are available
- **Configuration Validation**: Checks app settings and connection strings

### Functional Tests  
- **API Endpoints**: Tests all REST API endpoints respond correctly
- **Database Connectivity**: Verifies database connections work
- **SignalR Hubs**: Tests real-time communication components

### Integration Tests
- **Host Token Generation**: Tests the token creation process
- **Session Management**: Verifies session creation and management
- **Cross-Database Access**: Tests KSESSIONS and KQUR database integration

## Using the Automated Testing System

### Normal Development Workflow
You don't need to do anything special - testing happens automatically:

1. **Write Code**: Make your changes as usual
2. **Build Project**: Run `dotnet build` or use VS Code build (Ctrl+Shift+B)
3. **Tests Run Automatically**: If anything changed, tests execute and show results
4. **Commit Changes**: Use `git commit` - tests run again to ensure commit safety

### Manual Testing Commands
If you want to run tests manually:

```powershell
# Run tests after build (manual)
.hooks\post-build.ps1

# Run tests with detailed output  
.hooks\post-build.ps1 -Verbose

# Skip automatic tests during build
.hooks\post-build.ps1 -SkipTests
```

### Force Test Execution
Sometimes you want to run tests even if nothing changed:

```powershell
# Force tests regardless of cache
.hooks\pre-commit-test.ps1 -Force

# Force with detailed output
.hooks\pre-commit-test.ps1 -Force -Verbose
```

## Understanding Test Results

### Successful Tests
When all tests pass, you'll see:
```
✅ All tests passed (X tests, Y assertions)
🚀 Build and tests completed successfully
```

### Failed Tests
When tests fail, you'll see:
```
❌ Tests failed (X passed, Y failed)
🔍 See test output above for details
```

### Test Skipping
When tests are skipped due to no changes:
```
⚡ Tests skipped - no changes since last run
💾 Using cached test results: PASSED
```

## Test Categories

### Critical Tests (Must Pass)
- Database connection and schema validation
- API endpoint availability and response format
- Core application startup and configuration

### Warning Tests (Should Pass)
- Code style and formatting
- Performance benchmarks
- Documentation completeness

### Information Tests (Nice to Have)
- Code coverage metrics
- Dependency security scans
- Build performance timing

## Troubleshooting Test Issues

### Tests Keep Running When Nothing Changed
This usually means cached test results aren't working:
```powershell
# Clear test cache
Remove-Item .test-cache -Recurse -Force
Remove-Item .build-cache -Recurse -Force
```

### Tests Fail After Working Previously
1. **Check Recent Changes**: What code did you modify?
2. **Database Issues**: Ensure KSESSIONS_DEV database is running
3. **Port Conflicts**: Run `iiskill` to stop conflicting processes
4. **Clean Build**: Try `dotnet clean` followed by `dotnet build`

### Need to Commit Despite Test Failures (Emergency)
In rare emergencies, you can bypass tests:
```bash
# Skip pre-commit tests (use sparingly!)
git commit --no-verify -m "emergency: bypass tests for critical fix"
```

### Tests Take Too Long
The smart caching should make tests fast, but if they're still slow:
1. **Check for Database Issues**: Slow database connections cause delays
2. **Review Test Scope**: Some tests may be running unnecessarily
3. **Consider Parallel Execution**: Tests can be configured to run in parallel

## Best Practices

### Writing Test-Friendly Code
- **Small Functions**: Easier to test individual pieces
- **Clear Dependencies**: Use dependency injection for testable code
- **Error Handling**: Proper exception handling makes tests more reliable

### Responding to Test Failures
1. **Don't Ignore Failures**: Always investigate why tests failed
2. **Fix Root Causes**: Don't just make tests pass, fix the underlying issue
3. **Update Tests**: If requirements changed, update tests to match

### Using Test Results for Quality
- **Green Builds**: Aim to keep all tests passing all the time
- **Quick Feedback**: Pay attention to test results immediately after changes
- **Team Communication**: Share test failures with your team promptly

## Advanced Features

### Custom Test Configuration
You can customize testing behavior by modifying test configuration files:
- `.hooks/post-build.ps1`: Controls after-build testing
- `.hooks/pre-commit-test.ps1`: Controls pre-commit testing
- `Tests/`: Contains actual test implementations

### CI/CD Integration
The automated testing system integrates with:
- **GitHub Actions**: Runs full test suite on every push
- **VS Code**: Tests integrated into build tasks
- **Command Line**: Works with all standard Git and dotnet workflows

### Test Reporting
Test results are available in multiple formats:
- **Console Output**: Real-time feedback during development
- **Test Cache Files**: Stored results for caching decisions
- **CI/CD Artifacts**: Downloadable reports from automated builds

For technical implementation details, see the [Automated Testing Technical Reference](../technical/automated-testing-technical-reference.md).
