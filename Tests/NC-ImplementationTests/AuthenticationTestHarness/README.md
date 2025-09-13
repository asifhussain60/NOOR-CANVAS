# NOOR Canvas Authentication Test Harness

**Purpose**: Comprehensive test suite for Host GUID authentication functionality  
**Created**: September 12, 2025  
**Location**: `Tests/NC-ImplementationTests/AuthenticationTestHarness/`  

---

## 🎯 **Test Harness Overview**

This test harness validates the complete Host GUID authentication workflow, including:
- HttpClient BaseAddress configuration validation
- Host GUID format validation and authentication
- API endpoint functionality testing
- Integration testing with real backend services
- Error handling and edge case validation

## 🧪 **Test Categories**

### **1. Unit Tests - HttpClient Configuration**
**File**: `HttpClientConfigurationTests.cs`
**Purpose**: Validate dependency injection and HttpClient setup

### **2. Integration Tests - Authentication API**
**File**: `AuthenticationIntegrationTests.cs`  
**Purpose**: Test complete authentication workflow with real API calls

### **3. UI Tests - Landing Page Authentication**
**File**: `LandingPageAuthenticationTests.cs`
**Purpose**: Test Blazor component authentication functionality

### **4. Negative Tests - Error Scenarios**
**File**: `AuthenticationErrorTests.cs`
**Purpose**: Validate error handling and edge cases

---

## 🔧 **Running the Test Harness**

### **Prerequisites**
```powershell
# Ensure application is running
cd "D:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas"
dotnet run --urls "https://localhost:9091"

# Run test harness (separate terminal)
cd "D:\PROJECTS\NOOR CANVAS\Tests\NC-ImplementationTests"
dotnet test --filter "Category=Authentication" --verbosity normal
```

### **Individual Test Execution**
```powershell
# Run specific test category
dotnet test --filter "Category=HttpClientConfig"
dotnet test --filter "Category=AuthenticationAPI"
dotnet test --filter "Category=UITesting"
dotnet test --filter "Category=ErrorHandling"
```

---

## 📋 **Test Case Documentation**

### **Positive Test Cases**

#### **TC-AUTH-001: Valid GUID Authentication**
```csharp
[Fact]
public async Task AuthenticateHost_ValidGuid_ReturnsSuccessResponse()
```
- **Input**: Valid GUID (e.g., `323d7da4-b4cd-4976-a8af-599c9adc191b`)
- **Expected**: HTTP 200, valid HostAuthResponse with SessionToken
- **Validates**: Complete authentication workflow

#### **TC-AUTH-002: HttpClient BaseAddress Configuration**
```csharp
[Fact]
public void HttpClientFactory_Configuration_HasCorrectBaseAddress()
```
- **Input**: DI container inspection
- **Expected**: HttpClient has BaseAddress = "https://localhost:9091"
- **Validates**: Fix for Issue-23 HttpClient BaseAddress problem

#### **TC-AUTH-003: API Endpoint Availability**
```csharp
[Fact]
public async Task HostAuthEndpoint_IsAccessible_ReturnsValidResponse()
```
- **Input**: Direct API call to `/api/host/authenticate`
- **Expected**: Endpoint responds (not 404)
- **Validates**: API routing and controller availability

### **Negative Test Cases**

#### **TC-AUTH-004: Invalid GUID Format**
```csharp
[Fact]
public async Task AuthenticateHost_InvalidGuid_ReturnsBadRequest()
```
- **Input**: Invalid GUID formats ("invalid-guid", "12345", empty string)
- **Expected**: HTTP 400 Bad Request
- **Validates**: Input validation

#### **TC-AUTH-005: Network Failure Handling**
```csharp
[Fact]
public async Task AuthenticateHost_NetworkError_HandlesGracefully()
```
- **Input**: Simulated network failure
- **Expected**: Graceful error handling, user-friendly message
- **Validates**: Error resilience

#### **TC-AUTH-006: Missing BaseAddress Error**
```csharp
[Fact]
public void HttpClient_MissingBaseAddress_ThrowsExpectedException()
```
- **Input**: HttpClient without BaseAddress configuration
- **Expected**: InvalidOperationException with specific message
- **Validates**: Regression prevention for Issue-23

### **Integration Test Cases**

#### **TC-AUTH-007: End-to-End Authentication Flow**
```csharp
[Fact]
public async Task CompleteAuthenticationFlow_ValidGuid_RedirectsToHostDashboard()
```
- **Input**: Complete user workflow simulation
- **Expected**: Successful navigation to host dashboard
- **Validates**: Complete integration

#### **TC-AUTH-008: Session Token Management**
```csharp
[Fact]
public async Task AuthenticationResponse_ValidToken_HasCorrectExpiry()
```
- **Input**: Successful authentication
- **Expected**: SessionToken with 8-hour expiry
- **Validates**: Token lifecycle management

---

## 🎨 **Test Data & Fixtures**

### **Test GUIDs**
```csharp
public static class TestGUIDs
{
    public const string ValidHostGuid = "323d7da4-b4cd-4976-a8af-599c9adc191b";
    public const string ValidTestGuid = "12345678-1234-1234-1234-123456789abc";
    public const string InvalidFormat1 = "invalid-guid-format";
    public const string InvalidFormat2 = "12345";
    public const string EmptyGuid = "";
    public const string NullGuid = null;
}
```

### **Expected Responses**
```csharp
public static class ExpectedResponses
{
    public static HostAuthResponse ValidAuthResponse => new()
    {
        Success = true,
        SessionToken = "[Generated-GUID]",
        ExpiresAt = DateTime.UtcNow.AddHours(8),
        HostGuid = TestGUIDs.ValidHostGuid
    };
}
```

---

## 🚀 **Automated Test Execution**

### **CI/CD Integration**
```yaml
# GitHub Actions Workflow
name: Authentication Test Suite
on: [push, pull_request]
jobs:
  authentication-tests:
    runs-on: windows-latest
    steps:
      - name: Run Authentication Test Harness
        run: |
          dotnet test Tests/NC-ImplementationTests 
          --filter "Category=Authentication" 
          --logger "trx;LogFileName=auth-tests.trx"
```

### **Local Development Script**
```powershell
# Scripts/run-auth-tests.ps1
param([switch]$Verbose, [switch]$Coverage)

Write-Host "🧪 NOOR Canvas Authentication Test Harness" -ForegroundColor Cyan

if ($Coverage) {
    dotnet test --collect:"XPlat Code Coverage" --filter "Category=Authentication"
} else {
    dotnet test --filter "Category=Authentication" --verbosity $(if($Verbose){"normal"}else{"minimal"})
}
```

---

## 📊 **Test Results & Reporting**

### **Test Metrics**
- **Total Test Cases**: 12 (8 positive, 4 negative)
- **Code Coverage Target**: >90% for authentication components
- **Performance Baseline**: <500ms per test execution
- **Success Criteria**: 100% pass rate required

### **Test Result Validation**
```csharp
// Example test validation structure
[Fact]
public async Task ValidateTestHarness_AllTestsPass_MeetsQualityStandards()
{
    // Ensure test harness itself is working correctly
    var testResults = await RunAllAuthenticationTests();
    
    Assert.True(testResults.PassRate >= 1.0, "All authentication tests must pass");
    Assert.True(testResults.CoveragePercent >= 90, "Code coverage must be >90%");
    Assert.True(testResults.AvgExecutionTime < TimeSpan.FromMilliseconds(500), 
                "Tests must execute under 500ms");
}
```

---

## 🔄 **Maintenance & Updates**

### **When to Update Test Harness**
1. **API Changes**: When authentication endpoints are modified
2. **Configuration Changes**: When HttpClient setup changes
3. **Security Updates**: When authentication logic is enhanced
4. **Bug Fixes**: When new edge cases are discovered

### **Test Harness Validation Schedule**
- **Pre-commit**: Run authentication tests before any commit
- **Daily**: Automated execution in CI/CD pipeline
- **Release**: Full test suite with performance benchmarking
- **Post-deployment**: Smoke tests against production environment

---

## ✅ **Success Criteria**

This test harness is considered successful when:
1. ✅ **All tests pass consistently** (100% pass rate)
2. ✅ **HttpClient configuration validated** (Issue-23 regression prevention)
3. ✅ **Authentication workflow verified** (end-to-end functionality)
4. ✅ **Error handling tested** (graceful failure scenarios)
5. ✅ **Performance benchmarks met** (<500ms execution time)
6. ✅ **Code coverage achieved** (>90% for authentication components)

---

**Test Harness Status**: ✅ IMPLEMENTED  
**Last Updated**: September 12, 2025  
**Next Review**: October 12, 2025
