# Build Processes

## Overview

NOOR Canvas uses a sophisticated build system that integrates automatic testing, smart caching, and comprehensive validation. This document covers all build-related processes and procedures.

## Standard Build Process

### Basic Build Command

```powershell
# Build the application
cd "D:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas"
dotnet build
```

### Build with Automatic Testing

When you run `dotnet build`, the system automatically:

1. Compiles all C# source code
2. Restores NuGet packages if needed
3. Checks build artifact changes
4. Runs tests if build output changed
5. Updates build cache

### Build Configurations

#### Debug Configuration (Development)

```powershell
dotnet build --configuration Debug
```

- Includes debugging symbols
- Optimized for development speed
- Verbose logging enabled
- Source maps included

#### Release Configuration (Production)

```powershell
dotnet build --configuration Release
```

- Optimized for performance
- Debugging symbols removed
- Minimal logging
- Compressed output

## Advanced Build Options

### Clean Build

```powershell
# Remove all build artifacts and rebuild
dotnet clean
dotnet build
```

### No-Restore Build

```powershell
# Build without restoring packages (faster)
dotnet build --no-restore
```

### Verbose Build Output

```powershell
# Detailed build information
dotnet build --verbosity detailed
```

## Build Integration with Testing

### Automatic Test Execution

The build process includes automatic test execution through the post-build hook system:

1. **Build Completion**: `dotnet build` completes successfully
2. **Hash Calculation**: System calculates hash of build artifacts
3. **Cache Check**: Compares with previous build hash
4. **Test Execution**: If artifacts changed, runs comprehensive test suite
5. **Result Caching**: Stores test results for future builds

### Manual Test Control

```powershell
# Build with verbose test output
dotnet build; .hooks\post-build.ps1 -Verbose

# Build without automatic tests
dotnet build; .hooks\post-build.ps1 -SkipTests

# Force tests regardless of cache
dotnet build; .hooks\post-build.ps1 -Force
```

## Build Performance Optimization

### Smart Caching

The build system uses intelligent caching to improve performance:

- **Artifact Hashing**: Only runs tests when build output actually changes
- **Incremental Compilation**: Recompiles only changed files
- **Package Caching**: Reuses downloaded NuGet packages

### Parallel Builds

```powershell
# Use multiple CPU cores for building
dotnet build --configuration Release -m
```

### Build Performance Metrics

The system tracks build performance:

- Compilation time
- Package restore time
- Test execution time
- Cache hit rates

## Build Validation

### Pre-Build Validation

Before building, the system validates:

- Source code syntax
- Project file integrity
- Package reference consistency
- Configuration file validity

### Post-Build Validation

After building, the system verifies:

- All assemblies created successfully
- No compilation warnings (in Release mode)
- All tests pass (if enabled)
- Output file integrity

## Build Environments

### Development Environment

- **Database**: KSESSIONS_DEV
- **Ports**: 9090 (HTTP), 9091 (HTTPS)
- **Logging**: Verbose, structured logging
- **Testing**: Automatic test execution enabled

### CI/CD Environment

- **Clean Build**: Always starts from clean state
- **All Tests**: Runs complete test suite
- **Artifact Generation**: Creates deployment packages
- **Quality Gates**: Enforces code quality standards

### Production Environment

- **Optimized Build**: Release configuration only
- **Security**: All debugging features disabled
- **Performance**: Optimized for runtime speed
- **Validation**: Extensive pre-deployment checks

## Build Tools Integration

### Visual Studio Code

```json
// .vscode/tasks.json build task
{
  "label": "build",
  "command": "dotnet",
  "type": "process",
  "args": ["build", "${workspaceFolder}/SPA/NoorCanvas/NoorCanvas.csproj"],
  "group": {
    "kind": "build",
    "isDefault": true
  }
}
```

### Command Line Interface

```powershell
# Global NC command includes build
nc  # Builds automatically before starting server

# Manual build commands
dotnet build
dotnet publish
dotnet pack
```

### MSBuild Integration

The build process integrates with MSBuild for:

- Custom build targets
- Pre/post-build events
- Conditional compilation
- Resource generation

## Troubleshooting Build Issues

### Common Build Errors

#### Compilation Errors

```
Error CS0103: The name 'variable' does not exist in the current context
```

**Solution**: Check variable declarations and scope

#### Package Restore Errors

```
Error NU1101: Unable to find package 'PackageName'
```

**Solution**: Verify package source and connectivity

```powershell
dotnet nuget list source
dotnet restore --force
```

#### File Lock Errors

```
Error MSB3027: Could not copy file - file is locked
```

**Solution**: Stop running processes

```powershell
iiskill
dotnet build
```

### Build Performance Issues

#### Slow Builds

1. **Check Antivirus**: Exclude project directories from real-time scanning
2. **Clean Temp Files**: Remove obj/ and bin/ directories
3. **Package Cache**: Clear NuGet cache if corrupted

```powershell
dotnet nuget locals all --clear
```

#### Memory Issues

1. **Close Applications**: Free up system memory
2. **Build Configuration**: Use Release mode for large projects
3. **Parallel Limits**: Reduce parallel build processes

### Build Environment Issues

#### Path Problems

Ensure correct working directory:

```powershell
# Always build from project directory
cd "D:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas"
dotnet build
```

#### Environment Variables

Verify required environment variables:

```powershell
$env:DOTNET_ROOT
$env:PATH
$env:ASPNETCORE_ENVIRONMENT
```

## Build Monitoring and Metrics

### Build Success Tracking

The system tracks build metrics:

- Build success/failure rates
- Average build times
- Cache effectiveness
- Test execution results

### Performance Analysis

```powershell
# Build with timing information
dotnet build --verbosity normal | Tee-Object -FilePath build-log.txt

# Analyze build performance
Measure-Command { dotnet build }
```

### Quality Metrics

- Code coverage percentages
- Test pass rates
- Static analysis results
- Security scan results

## Best Practices

### Daily Development

1. **Clean Builds**: Start each day with a clean build
2. **Incremental Work**: Make small, testable changes
3. **Regular Testing**: Let automatic tests catch issues early
4. **Cache Maintenance**: Clear caches when experiencing issues

### Team Collaboration

1. **Consistent Environment**: Use same .NET version across team
2. **Build Documentation**: Keep build procedures documented
3. **Shared Configuration**: Use consistent build settings
4. **Issue Reporting**: Report build issues promptly

### Performance Optimization

1. **Selective Building**: Build only changed projects when possible
2. **Cache Utilization**: Leverage build and test caching
3. **Resource Management**: Monitor system resources during builds
4. **Tool Updates**: Keep build tools current

For more detailed technical implementation, see the [Build System Technical Reference](../technical/build-system-technical-reference.md).
