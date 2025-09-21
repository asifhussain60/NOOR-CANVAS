# Testing Framework Technical Reference

Comprehensive technical documentation for NOOR Canvas automated testing system.

## Testing Architecture

### 1. Test Framework Stack

```
┌─────────────────────────────────────────┐
│           User Interface                │
├─────────────────────────────────────────┤
│     VS Code Tasks & Git Hooks          │
├─────────────────────────────────────────┤
│    PowerShell Test Orchestration       │
├─────────────────────────────────────────┤
│        Smart Caching Layer             │
├─────────────────────────────────────────┤
│         MSTest & xUnit                  │
├─────────────────────────────────────────┤
│      .NET Test Host Runtime            │
└─────────────────────────────────────────┘
```

### 2. Smart Caching Implementation

#### Hash Calculation Algorithm

```csharp
public class SourceCodeHasher
{
    public static string CalculateHash(string[] sourcePaths)
    {
        var files = sourcePaths
            .SelectMany(path => Directory.GetFiles(path, "*.cs", SearchOption.AllDirectories))
            .Concat(sourcePaths.SelectMany(path => Directory.GetFiles(path, "*.cshtml", SearchOption.AllDirectories)))
            .Concat(sourcePaths.SelectMany(path => Directory.GetFiles(path, "*.razor", SearchOption.AllDirectories)))
            .OrderBy(f => f)
            .ToArray();

        using var sha256 = SHA256.Create();
        var combinedContent = string.Join("", files.Select(File.ReadAllText));
        return Convert.ToBase64String(sha256.ComputeHash(Encoding.UTF8.GetBytes(combinedContent)));
    }
}
```

#### Cache Management

- **Location**: `.test-cache/` and `.build-cache/` directories
- **Persistence**: File-based cache storage
- **Invalidation**: Automatic on source file modifications
- **Cleanup**: Manual cache clearing options

### 3. Test Execution Modes

#### Post-Build Testing (`.hooks/post-build.ps1`)

```powershell
# Execution pattern
if (Test-BuildArtifactChanged) {
    Invoke-TestSuite -Configuration $Configuration
    Update-BuildCache
} else {
    Write-Host "Build artifacts unchanged - skipping tests"
}
```

#### Pre-Commit Testing (`.hooks/pre-commit-test.ps1`)

```powershell
# Validation pattern
$sourceHash = Get-SourceCodeHash
$lastHash = Get-CachedHash
if ($sourceHash -ne $lastHash -or $Force) {
    $result = Invoke-TestSuite
    if ($result.Failed) { exit 1 }
    Set-CachedHash $sourceHash
}
```

## Test Categories

### 1. Unit Tests (`Tests/NoorCanvas.Core.Tests/`)

- **Controllers**: API endpoint testing
- **Services**: Business logic validation
- **Models**: Data model validation
- **Utilities**: Helper function testing

### 2. Integration Tests (`Tests/NC-ImplementationTests/`)

- **Database**: Entity Framework integration
- **SignalR**: Real-time communication testing
- **Authentication**: Session validation
- **Cross-component**: End-to-end workflows

### 3. Implementation Tests (`Tests/APPLICATION-HEALTH-HARNESS-GUIDE.md`)

- **Phase validation**: Implementation milestone testing
- **System health**: Application health checks
- **Performance**: Load and stress testing
- **Compatibility**: Browser and platform testing

## Configuration Management

### Test Configuration Files

```json
// Tests/NoorCanvas.Core.Tests/appsettings.Test.json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=AHHOME;Database=KSESSIONS_DEV;...",
    "KSessionsDb": "Server=AHHOME;Database=KSESSIONS_DEV;..."
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  }
}
```

### PowerShell Configuration

```powershell
# .hooks/test-config.ps1
$TestConfig = @{
    CacheDir = ".test-cache"
    BuildCacheDir = ".build-cache"
    TestTimeout = 300 # 5 minutes
    RetryAttempts = 3
    ParallelExecution = $true
}
```

## Performance Metrics

### Execution Times (Average)

- **Unit Tests**: 2-5 seconds
- **Integration Tests**: 5-15 seconds
- **Full Test Suite**: 10-30 seconds
- **Cache Hit**: <0.1 seconds

### Success Rates (Target)

- **Build Success**: >95%
- **Test Pass Rate**: >98%
- **Cache Hit Rate**: >80%
- **CI/CD Success**: >90%

## Integration Points

### GitHub Actions Integration

```yaml
# .github/workflows/build-and-test.yml
name: Build and Test
on: [push, pull_request]
jobs:
  test:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup .NET
        uses: actions/setup-dotnet@v3
      - name: Run Tests
        run: .hooks/run-comprehensive-tests.ps1
```

### Visual Studio Code Integration

```json
// .vscode/tasks.json
{
  "label": "run-tests",
  "type": "shell",
  "command": "powershell.exe",
  "args": [".hooks/post-build.ps1", "-Verbose"],
  "group": "test"
}
```

## Troubleshooting

### Common Issues

1. **Test Failures**: Detailed logging and error reporting
2. **Cache Corruption**: Automatic cache validation and cleanup
3. **Environment Issues**: Configuration validation and setup
4. **Performance Problems**: Parallel execution and optimization

### Debugging Commands

```powershell
# Manual test execution
.hooks/pre-commit-test.ps1 -Force -Verbose

# Cache management
Remove-Item .test-cache -Recurse -Force
Remove-Item .build-cache -Recurse -Force

# Test suite validation
dotnet test --logger "console;verbosity=detailed"
```

## Extension Points

### Custom Test Runners

- **API Testing**: REST client integration
- **UI Testing**: Selenium WebDriver integration
- **Performance Testing**: Load testing framework integration
- **Security Testing**: Security scan integration

### Reporting Integration

- **Test Results**: XML and JSON output formats
- **Coverage Reports**: Code coverage analysis
- **Performance Reports**: Execution time tracking
- **Quality Gates**: Pass/fail criteria configuration

_This technical reference is automatically updated as testing framework enhancements are implemented._
