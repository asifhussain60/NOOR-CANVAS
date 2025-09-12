# Issue #23: Entity Framework Dual Provider Configuration Test Failures

## 📋 Issue Summary
**Title**: Entity Framework dual database provider registration causing test suite failures  
**Priority**: 🔴 **HIGH** - Blocking 50 integration tests  
**Category**: 🐛 **Bug** - Test Configuration Issue  
**Status**: Not Started  
**Created**: September 12, 2025 09:30 AM  
**Affected Component**: Test Suite Configuration & Integration Tests

## 🚨 Problem Description
The test suite is failing with 50 errors due to conflicting Entity Framework database provider registrations. Both SQL Server and In-Memory database providers are being registered simultaneously in the service provider, which is not supported.

### Error Message
```
System.InvalidOperationException : Services for database providers 'Microsoft.EntityFrameworkCore.SqlServer', 'Microsoft.EntityFrameworkCore.InMemory' have been registered in the service provider. Only a single database provider can be registered in a service provider. If possible, ensure that Entity Framework is managing its service provider by removing the call to 'UseInternalServiceProvider'. Otherwise, consider conditionally registering the database provider, or maintaining one service provider per database provider.
```

## 🔍 Root Cause Analysis
1. **Dual Registration**: Both SQL Server (production) and In-Memory (testing) providers registered
2. **Test Configuration Issue**: `WebApplicationFactory` setup conflicts with main application DbContext registration
3. **Service Provider Conflict**: Entity Framework cannot handle multiple database providers in single service provider

## 💥 Impact Assessment
- **Failed Tests**: 39 out of 201 tests failing due to this issue
- **Affected Files**: All `ApiIntegrationTests.cs` test methods
- **Test Categories**: Integration tests, API endpoint tests, database interaction tests
- **Development Impact**: Cannot validate API functionality, database operations, or integration workflows

## 📂 Affected Files
```
Tests/NoorCanvas.Core.Tests/Integration/ApiIntegrationTests.cs (Line 50)
└── Constructor failure in WebApplicationFactory setup
└── All test methods affected by DbContext initialization failure
```

## 🔧 Resolution Framework

### Phase 1: Test Environment Isolation
1. **Separate Test Configuration**
   - Create dedicated test-specific `Program.cs` or configuration
   - Conditionally register database providers based on environment
   - Use `UseInternalServiceProvider` appropriately

### Phase 2: WebApplicationFactory Enhancement
2. **Custom Test Factory**
   - Override database configuration in test factory
   - Replace SQL Server with In-Memory provider for tests
   - Ensure clean database state for each test

### Phase 3: Configuration Management
3. **Environment-Based Provider Registration**
   - Use configuration flags to determine provider
   - Implement provider selection logic
   - Add proper service provider management

## 💡 Technical Solution Approach

### Option 1: Conditional Provider Registration (Recommended)
```csharp
// In Program.cs or Startup configuration
if (builder.Environment.IsTesting())
{
    builder.Services.AddDbContext<CanvasDbContext>(options =>
        options.UseInMemoryDatabase("TestDatabase"));
}
else
{
    builder.Services.AddDbContext<CanvasDbContext>(options =>
        options.UseSqlServer(connectionString));
}
```

### Option 2: Custom WebApplicationFactory
```csharp
public class CustomWebApplicationFactory<TStartup> : WebApplicationFactory<TStartup>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureServices(services =>
        {
            // Remove SQL Server registration
            var descriptor = services.SingleOrDefault(d => d.ServiceType == typeof(DbContextOptions<CanvasDbContext>));
            if (descriptor != null) services.Remove(descriptor);
            
            // Add In-Memory database for tests
            services.AddDbContext<CanvasDbContext>(options =>
                options.UseInMemoryDatabase("TestDatabase"));
        });
    }
}
```

### Option 3: Service Provider Per Database (Complex)
- Create separate service providers for different database contexts
- Manage provider lifetime and scope appropriately
- Requires significant architecture changes

## ✅ Acceptance Criteria
1. **All integration tests pass** without Entity Framework provider conflicts
2. **Production application** continues using SQL Server provider
3. **Test environment** uses In-Memory provider exclusively
4. **No breaking changes** to existing application functionality
5. **Test isolation** ensures clean state between test runs

## 🧪 Testing Requirements
1. **Unit Test Validation**: Verify all `ApiIntegrationTests` pass
2. **Configuration Testing**: Test both development and test environment configurations
3. **Integration Verification**: Ensure production database operations unaffected
4. **Performance Check**: Verify test execution speed with In-Memory provider

## 📊 Priority Justification
**HIGH Priority** because:
- **Blocks development workflow**: Cannot validate API changes
- **Affects all integration testing**: 39 tests failing
- **Prevents CI/CD pipeline**: Test failures block deployment
- **Quality assurance impact**: Cannot verify database operations

## 🔗 Related Issues
- Potentially related to DialogService test failures (separate configuration issue)
- May affect model validation tests (database-dependent validations)
- Could impact host authentication tests (database lookup failures)

## 📝 Implementation Notes
- **Preserve existing functionality**: SQL Server for production must remain unchanged
- **Test data seeding**: Ensure In-Memory database properly seeded for tests
- **Connection string management**: Handle configuration differences appropriately
- **Entity relationship testing**: Verify foreign key constraints work in In-Memory provider

## 🏷️ Tags
`entity-framework` `test-configuration` `database` `integration-tests` `high-priority` `blocking-issue`
