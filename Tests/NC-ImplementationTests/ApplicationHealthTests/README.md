# Application Health Test Harness

## Purpose

Comprehensive test harness for **Issue-26: Application Not Loading Despite IIS Express Running**

This xUnit test suite provides automated validation of application health, process management, and connectivity to prevent regression of the critical startup issue.

## Test Categories

### 1. Health Check Tests (`[Trait("Category", "HealthCheck")]`)

- **Process Detection**: Validates dotnet/IIS Express processes are running
- **Port Binding**: Confirms ports 9090/9091 are properly bound
- **HTTP Connectivity**: Tests both HTTP and HTTPS endpoints
- **Health Endpoint**: Validates `/healthz` endpoint responses

### 2. Regression Tests (`[Trait("Category", "Regression")]`)

- **Issue-26 Specific**: Detects process/port binding mismatches
- **Stale Process Detection**: Identifies orphaned processes
- **Port Conflict Resolution**: Validates port ownership

### 3. Performance Tests (`[Trait("Category", "Performance")]`)

- **Response Time**: Ensures application responds within 5 seconds
- **Health Monitoring**: Tracks application responsiveness

### 4. Recovery Tests (`[Trait("Category", "Recovery")]`)

- **Issue Detection**: Validates diagnostic capabilities
- **Auto-Recovery Logic**: Tests recovery trigger conditions

## Usage

### Run All Health Tests

```powershell
cd "D:\PROJECTS\NOOR CANVAS\Tests\NC-ImplementationTests\ApplicationHealthTests"
dotnet test --logger "console;verbosity=detailed"
```

### Run Specific Test Category

```powershell
# Only health check tests
dotnet test --filter "Category=HealthCheck" --logger "console;verbosity=detailed"

# Only Issue-26 regression tests
dotnet test --filter "Category=Regression" --logger "console;verbosity=detailed"

# Performance validation
dotnet test --filter "Category=Performance" --logger "console;verbosity=detailed"
```

### Run from Visual Studio

1. Open Test Explorer (`Test` → `Test Explorer`)
2. Build solution to discover tests
3. Right-click test categories to run specific groups
4. View detailed output in Test Explorer results

## Integration with Development Workflow

### Pre-Deployment Validation

```powershell
# Before committing changes that affect application startup
dotnet test "Tests\NC-ImplementationTests\ApplicationHealthTests" --logger "console;verbosity=normal"
```

### Continuous Integration

Tests are designed for CI/CD integration with detailed logging and categorical execution.

### Issue-26 Monitoring

The regression tests specifically validate the conditions that caused Issue-26:

- IIS Express process exists but ports bound to different PID
- Multiple stale processes preventing proper startup
- Port conflicts causing application loading failures

## Test Configuration

### Endpoints Tested

- **HTTP**: http://localhost:9090
- **HTTPS**: https://localhost:9091 (primary)
- **Health**: `/healthz` on both protocols

### Expected Behavior

- At least one application process running (dotnet or iisexpress)
- Ports 9090/9091 bound to application processes
- Health endpoints responding with success status
- Response times under 5 seconds
- No process/port binding mismatches

### Failure Scenarios

Tests will fail if:

- No application processes detected
- Ports not bound or bound to wrong processes
- Health endpoints not responding
- Response times exceed performance thresholds
- Issue-26 regression conditions detected

## Test Output

### Success Example

```
✓ Test_ProcessDetection_ShouldFindRunningProcesses
✓ Test_PortBinding_ShouldHaveCorrectPorts
✓ Test_HttpConnectivity_ShouldRespondToRequests
✓ Test_HealthEndpoint_ShouldRespondCorrectly
✓ Test_Issue26_Regression_ProcessVsPortMismatch
✓ Test_ApplicationResponseTime_ShouldBeFast
✓ Test_AutoRecovery_CanDetectIssues
```

### Failure Example (Issue-26 Detected)

```
✗ Test_Issue26_Regression_ProcessVsPortMismatch
  Issue-26 regression detected: Process/port binding mismatch indicates stale processes
  IIS Express PIDs: 1234, 5678
  Port binding PIDs: 9012
```

## Maintenance

### Adding New Tests

1. Create new test methods with appropriate `[Trait("Category", "...")]` attributes
2. Follow naming convention: `Test_FeatureName_ShouldBehavior`
3. Include detailed logging for diagnostic purposes
4. Update this documentation with new test descriptions

### Updating Test Configuration

- Modify endpoint URLs in `ApplicationHealthTests` constructor
- Update expected ports in `_expectedPorts` array
- Adjust timeout values for performance tests

### Integration Points

- Used by NC command for health validation
- Referenced in ApplicationHealthChecker.ps1 for diagnostic correlation
- Integrated with CI/CD pipeline for deployment validation
