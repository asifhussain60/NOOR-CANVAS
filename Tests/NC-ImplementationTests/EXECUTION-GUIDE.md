# NOOR Canvas Authentication Test Harness - Execution Guide

## 🚀 Running the Authentication Tests

### Quick Start
```powershell
# Navigate to test directory
cd "D:\PROJECTS\NOOR CANVAS\Tests\NC-ImplementationTests"

# Restore packages
dotnet restore

# Run all authentication tests
dotnet test --logger console --verbosity normal

# Run specific test categories
dotnet test --filter "Category=HttpClientConfig" --logger console
dotnet test --filter "Category=Integration" --logger console  
dotnet test --filter "Category=UI" --logger console
```

### Test Execution Results

#### Expected Pass Results
```
✅ HttpClientConfigurationTests
  - HttpClientFactory_Configuration_HasCorrectBaseAddress
  - HttpClient_MissingBaseAddress_ThrowsExpectedException  
  - HttpClient_AbsoluteUrl_WorksWithoutBaseAddress
  - HttpClientFactory_EnvironmentConfiguration_SetsCorrectBaseAddress
  - HttpClientFactory_MultipleClients_ConfiguredCorrectly

✅ AuthenticationIntegrationTests (requires running application)
  - Authentication_ValidHostGuid_ReturnsSuccess
  - Authentication_InvalidHostGuid_ReturnsError
  - Authentication_EmptyHostGuid_ReturnsError
  - Authentication_EndpointExists_IsRoutable
  - Authentication_CORS_AllowsOrigin
  - Authentication_ErrorScenarios_HandledCorrectly

✅ LandingComponentTests  
  - Landing_Component_RendersCorrectly
  - Landing_EmptyGuid_ShowsValidationMessage
  - Landing_GuidInput_AcceptsValidFormat
  - Landing_Authentication_ShowsLoadingState
  - Landing_InvalidGuid_ShowsErrorMessage
  - Landing_HttpClientFactory_InjectedCorrectly
  - Landing_Component_HasAccessibilityAttributes
```

### Pre-Test Requirements

#### 1. Application Running (for Integration Tests)
```powershell
# Start NOOR Canvas application first
cd "D:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas"
dotnet run --urls "https://localhost:9091"

# Verify application is running
Invoke-WebRequest -Uri "https://localhost:9091/healthz" -SkipCertificateCheck
```

#### 2. SSL Certificate Trust (Development)
```powershell
# Trust development certificates (one-time setup)
dotnet dev-certs https --trust
```

#### 3. Database Connection (if required)
Ensure SQL Server is running and canvas schema is accessible.

### Test Execution Strategies

#### Strategy 1: Unit Tests Only (No Dependencies)
```powershell
# Run only unit tests that don't require running application
dotnet test --filter "Category=HttpClientConfig" --logger console
```

#### Strategy 2: Full Test Suite (Application Required)
```powershell
# 1. Start application in one terminal
cd "D:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas"
dotnet run --urls "https://localhost:9091"

# 2. Run tests in another terminal
cd "D:\PROJECTS\NOOR CANVAS\Tests\NC-ImplementationTests"
dotnet test --logger console --verbosity normal
```

#### Strategy 3: Continuous Testing (Development)
```powershell
# Watch mode for continuous testing during development
dotnet watch test --logger console
```

### Expected Test Results

#### Test Coverage Validation
- **18 Total Tests**: Comprehensive coverage of Issue-23 scenarios
- **3 Test Categories**: Unit, Integration, UI component testing
- **5 HttpClient Configuration Tests**: Prevent regression of Issue-23
- **6 Integration Tests**: End-to-end authentication workflow validation  
- **7 UI Component Tests**: Blazor Landing.razor functionality

#### Performance Expectations
- **Unit Tests**: < 1 second total execution time
- **Integration Tests**: < 10 seconds (requires running application)
- **UI Tests**: < 5 seconds (Blazor component rendering)

#### Failure Scenarios & Troubleshooting

##### Common Test Failures

**1. "HttpClient BaseAddress is null" (Regression of Issue-23)**
```
Cause: HttpClient configuration missing in Program.cs
Fix: Verify builder.Services.AddHttpClient("default", client => { client.BaseAddress = new Uri(baseAddress); })
```

**2. "Connection refused" (Integration Tests)**
```  
Cause: NOOR Canvas application not running
Fix: Start application on https://localhost:9091 before running integration tests
```

**3. "SSL certificate errors"**
```
Cause: Development certificates not trusted
Fix: Run 'dotnet dev-certs https --trust'
```

**4. "Component not found" (UI Tests)**
```
Cause: Landing.razor component structure changed
Fix: Update component selectors in LandingComponentTests.cs
```

### Debugging Test Failures

#### Verbose Test Output
```powershell
# Get detailed test execution information
dotnet test --logger console --verbosity diagnostic

# Run specific failing test with full output
dotnet test --filter "FullyQualifiedName~HttpClientFactory_Configuration_HasCorrectBaseAddress" --logger console --verbosity diagnostic
```

#### Test Result Files
```powershell
# Generate test results file
dotnet test --logger trx --results-directory "TestResults"

# Generate code coverage report (if coverlet is configured)
dotnet test --collect:"XPlat Code Coverage"
```

### Integration with Development Workflow

#### Pre-Commit Validation
```powershell
# Run tests before committing changes
dotnet test --logger console
if ($LASTEXITCODE -eq 0) {
    git add .
    git commit -m "feature: authentication changes with test validation"
} else {
    Write-Host "Tests failed - fix issues before committing"
}
```

#### CI/CD Pipeline Integration
The tests are designed to run in GitHub Actions with the following workflow:
1. **Restore packages**: `dotnet restore`
2. **Build application**: `dotnet build --no-restore`  
3. **Start application**: Background process on port 9091
4. **Run tests**: `dotnet test --no-build --logger console`
5. **Stop application**: Clean up background processes

### Test Maintenance

#### Adding New Test Cases
```csharp
// Add new test methods following existing patterns
[Fact]
[Trait("Category", "HttpClientConfig")]
public void NewTest_Scenario_ExpectedBehavior()
{
    // Arrange
    // Act  
    // Assert
}
```

#### Updating for Code Changes
- **HttpClient Configuration Changes**: Update HttpClientConfigurationTests.cs
- **API Endpoint Changes**: Update AuthenticationIntegrationTests.cs
- **UI Component Changes**: Update LandingComponentTests.cs selectors

### Success Metrics

#### Test Quality Indicators
- **All 18 tests pass**: No regression of Issue-23 HttpClient BaseAddress problem
- **< 15 second total execution**: Efficient test suite for development workflow
- **Clear failure messages**: Easy debugging when tests fail
- **No false positives**: Reliable test results for CI/CD pipeline

#### Issue-23 Prevention Validation
The test harness specifically validates:
- ✅ HttpClient BaseAddress is properly configured in DI container
- ✅ Relative URLs work correctly with configured BaseAddress
- ✅ Error scenarios are handled gracefully
- ✅ Authentication workflow functions end-to-end
- ✅ Landing.razor component uses IHttpClientFactory pattern correctly

This comprehensive test coverage ensures Issue-23 cannot regress and authentication functionality remains stable across code changes.
