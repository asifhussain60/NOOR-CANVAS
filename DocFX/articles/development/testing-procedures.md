# Testing Procedures

## Overview

NOOR Canvas implements a comprehensive testing strategy that includes unit tests, integration tests, and automated testing workflows. This document covers all testing procedures and best practices.

## Test Categories

### Unit Tests

**Location**: `Tests/NoorCanvas.Core.Tests/`
**Purpose**: Test individual components in isolation
**Framework**: xUnit.NET with Moq for mocking

```powershell
# Run unit tests only
dotnet test Tests/NoorCanvas.Core.Tests/ --filter Category=Unit
```

### Integration Tests

**Location**: `Tests/NC-ImplementationTests/`
**Purpose**: Test component interactions and system integration
**Framework**: xUnit.NET with ASP.NET Core Test Host

```powershell
# Run integration tests only
dotnet test Tests/NC-ImplementationTests/ --filter Category=Integration
```

### End-to-End Tests

**Location**: `Tests/NC-E2ETests/` (when implemented)
**Purpose**: Test complete user workflows
**Framework**: Playwright or Selenium

## Automated Testing Workflow

### Automatic Test Execution

Tests run automatically in two scenarios:

#### 1. Post-Build Testing

```powershell
# Tests run automatically after successful build
dotnet build  # Triggers automatic test execution
```

#### 2. Pre-Commit Testing

```bash
# Tests run automatically before commit
git add .
git commit -m "feature: add new functionality"
# Tests execute automatically to validate commit
```

### Manual Test Execution

```powershell
# Run all tests manually
dotnet test

# Run tests with verbose output
dotnet test --logger "console;verbosity=detailed"

# Run specific test project
dotnet test Tests/NoorCanvas.Core.Tests/

# Run tests matching pattern
dotnet test --filter "FullyQualifiedName~SessionController"
```

## Test Organization

### Test Project Structure

```
Tests/
├── NoorCanvas.Core.Tests/           # Unit tests
│   ├── Controllers/                 # Controller tests
│   ├── Services/                    # Service tests
│   ├── Models/                      # Model tests
│   └── Utilities/                   # Test utilities
├── NC-ImplementationTests/          # Integration tests
│   ├── DatabaseTests/               # Database integration
│   ├── ApiTests/                    # API endpoint tests
│   ├── SignalRTests/                # Real-time communication
│   └── AuthenticationTests/         # Token and auth tests
└── NC-E2ETests/                     # End-to-end tests (future)
    ├── UserWorkflows/               # Complete user scenarios
    ├── CrossBrowser/                # Browser compatibility
    └── Performance/                 # Performance benchmarks
```

### Test Naming Conventions

```csharp
// Unit test naming: MethodName_Scenario_ExpectedBehavior
[Fact]
public void CreateSession_ValidInput_ReturnsSessionId()

// Integration test naming: Component_Scenario_ExpectedResult
[Fact]
public void HostController_AuthenticateToken_ReturnsSuccess()

// End-to-end test naming: UserStory_Scenario_ExpectedOutcome
[Fact]
public void CreateSessionWorkflow_ValidHost_SessionCreatedSuccessfully()
```

## Writing Effective Tests

### Unit Test Best Practices

#### 1. Test Structure (Arrange-Act-Assert)

```csharp
[Fact]
public void GenerateHostToken_ValidRequest_ReturnsGuid()
{
    // Arrange
    var service = new HostTokenService();
    var request = new GenerateTokenRequest { CreatedBy = "Test User" };

    // Act
    var result = service.GenerateToken(request);

    // Assert
    Assert.NotNull(result);
    Assert.True(Guid.TryParse(result.Token, out _));
}
```

#### 2. Mocking Dependencies

```csharp
[Fact]
public void GetSessions_DatabaseUnavailable_ThrowsException()
{
    // Arrange
    var mockContext = new Mock<CanvasDbContext>();
    mockContext.Setup(x => x.Sessions).Throws(new InvalidOperationException());
    var controller = new SessionController(mockContext.Object);

    // Act & Assert
    Assert.Throws<InvalidOperationException>(() => controller.GetSessions());
}
```

#### 3. Test Data Management

```csharp
public class TestDataBuilder
{
    public static Session CreateValidSession()
    {
        return new Session
        {
            Id = Guid.NewGuid(),
            HostToken = Guid.NewGuid().ToString(),
            Status = SessionStatus.Active,
            CreatedAt = DateTime.UtcNow
        };
    }
}
```

### Integration Test Best Practices

#### 1. Database Testing

```csharp
[Fact]
public async Task CreateSession_DatabaseIntegration_PersistsCorrectly()
{
    // Arrange
    using var context = CreateTestDbContext();
    var service = new SessionService(context);
    var request = new CreateSessionRequest { /* properties */ };

    // Act
    var sessionId = await service.CreateSessionAsync(request);

    // Assert
    var savedSession = await context.Sessions.FindAsync(sessionId);
    Assert.NotNull(savedSession);
    Assert.Equal(request.HostToken, savedSession.HostToken);
}
```

#### 2. API Testing

```csharp
[Fact]
public async Task CreateSession_ApiEndpoint_ReturnsCreatedStatus()
{
    // Arrange
    using var client = _factory.CreateClient();
    var request = new CreateSessionRequest { /* properties */ };

    // Act
    var response = await client.PostAsJsonAsync("/api/sessions", request);

    // Assert
    Assert.Equal(HttpStatusCode.Created, response.StatusCode);
    var session = await response.Content.ReadFromJsonAsync<Session>();
    Assert.NotNull(session);
}
```

#### 3. SignalR Testing

```csharp
[Fact]
public async Task SessionHub_SendMessage_BroadcastsToClients()
{
    // Arrange
    using var connection = await StartConnectionAsync();
    var receivedMessages = new List<string>();
    connection.On<string>("MessageReceived", message => receivedMessages.Add(message));

    // Act
    await connection.InvokeAsync("SendMessage", "Test message");

    // Assert
    await Task.Delay(100); // Allow message processing
    Assert.Contains("Test message", receivedMessages);
}
```

## Test Data Management

### Test Database Setup

```csharp
public class TestDbContextFactory
{
    public static CanvasDbContext CreateInMemoryContext()
    {
        var options = new DbContextOptionsBuilder<CanvasDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        return new CanvasDbContext(options);
    }

    public static async Task SeedTestDataAsync(CanvasDbContext context)
    {
        // Add standard test data
        context.Sessions.AddRange(CreateTestSessions());
        context.Participants.AddRange(CreateTestParticipants());
        await context.SaveChangesAsync();
    }
}
```

### Test Configuration

```json
// appsettings.Testing.json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=AHHOME;Database=NOOR_Canvas_Test;Trusted_Connection=true;",
    "KSessionsDb": "Server=AHHOME;Database=KSESSIONS_Test;Trusted_Connection=true;"
  },
  "Logging": {
    "LogLevel": {
      "Default": "Warning",
      "Microsoft": "Warning"
    }
  }
}
```

## Test Execution Strategies

### Parallel Test Execution

```xml
<!-- In test project files -->
<PropertyGroup>
  <ParallelizeTestCollections>true</ParallelizeTestCollections>
  <MaxParallelThreads>4</MaxParallelThreads>
</PropertyGroup>
```

### Test Categories and Filtering

```csharp
[Fact]
[Trait("Category", "Unit")]
[Trait("Component", "SessionController")]
public void CreateSession_ValidInput_ReturnsSuccess()
{
    // Test implementation
}
```

```powershell
# Run by category
dotnet test --filter "Category=Unit"

# Run by component
dotnet test --filter "Component=SessionController"

# Run by trait combination
dotnet test --filter "Category=Integration&Component=Database"
```

### Test Performance Monitoring

```csharp
[Fact]
public void DatabaseQuery_Performance_CompletesWithinTimeout()
{
    // Arrange
    var stopwatch = Stopwatch.StartNew();

    // Act
    var result = _service.GetSessions();

    // Assert
    stopwatch.Stop();
    Assert.True(stopwatch.ElapsedMilliseconds < 1000, "Query took too long");
}
```

## Continuous Testing Integration

### Pre-Commit Hook Testing

```powershell
# .hooks/pre-commit-test.ps1 (automatic execution)
# Runs comprehensive test suite before allowing commits
# Uses smart caching to skip redundant test execution
# Prevents broken code from entering repository
```

### Build Pipeline Testing

```yaml
# .github/workflows/build-and-test.yml
- name: Run Tests
  run: |
    dotnet test --configuration Release
    dotnet test --logger trx --results-directory TestResults/
```

### Test Result Reporting

```powershell
# Generate test coverage report
dotnet test --collect:"XPlat Code Coverage"

# Convert to readable format
reportgenerator -reports:**/coverage.cobertura.xml -targetdir:CoverageReport
```

## Test Maintenance

### Updating Tests for Code Changes

1. **Refactoring**: Update tests when refactoring code
2. **New Features**: Add tests for new functionality
3. **Bug Fixes**: Add regression tests for fixed bugs
4. **Deprecation**: Remove or update tests for deprecated features

### Test Code Quality

```csharp
// Good: Clear, specific test
[Fact]
public void CalculateSessionDuration_OneHourSession_ReturnsCorrectDuration()

// Bad: Vague, unclear test
[Fact]
public void TestSession()
```

### Test Performance Optimization

1. **Fast Tests**: Keep unit tests under 100ms
2. **Isolated Tests**: Avoid dependencies between tests
3. **Cleanup**: Properly dispose resources in tests
4. **Mocking**: Use mocks to avoid expensive operations

## Troubleshooting Test Issues

### Common Test Failures

#### Database Connection Issues

```csharp
// Solution: Use in-memory database for unit tests
services.AddDbContext<CanvasDbContext>(options =>
    options.UseInMemoryDatabase("TestDb"));
```

#### Timing Issues

```csharp
// Solution: Use proper async/await patterns
await Task.Delay(100); // Allow async operations to complete
```

#### Resource Cleanup

```csharp
// Solution: Implement proper disposal
public void Dispose()
{
    _context?.Dispose();
    _httpClient?.Dispose();
}
```

### Test Debugging

#### Debug Individual Tests

```powershell
# Run specific test in debug mode
dotnet test --filter "FullyQualifiedName=NamespaceName.ClassName.TestMethodName" --logger console
```

#### Test Output Debugging

```csharp
[Fact]
public void TestWithOutput(ITestOutputHelper output)
{
    output.WriteLine($"Debug info: {variable}");
    // Test implementation
}
```

## Quality Metrics and Reporting

### Code Coverage

- **Target**: Maintain >80% code coverage
- **Measurement**: Use dotnet test with code coverage collection
- **Reporting**: Generate HTML reports for detailed analysis

### Test Success Metrics

- **Build Success Rate**: >95% of builds should pass tests
- **Test Execution Time**: Keep total test time under 5 minutes
- **Flaky Test Rate**: <2% of tests should be flaky

### Quality Gates

Before merging code:

- [ ] All tests must pass
- [ ] Code coverage must not decrease
- [ ] No new test warnings
- [ ] Performance tests within acceptable limits

For comprehensive technical details, see the [Testing Framework Technical Reference](../technical/testing-framework-technical-reference.md).
