# Issue-62: HttpClient BaseAddress Configuration Missing

**Category:** 🚨 CRITICAL BUG  
**Priority:** CRITICAL  
**Status:** ⚡ IN PROGRESS  
**Created:** September 14, 2025  
**Root Cause of Issue-60:** HttpClient configuration causing recurring "Failed to initialize session manager" errors

## **Problem Description**
🚨 **ROOT CAUSE IDENTIFIED**: The recurring HostSessionManager initialization failures are caused by missing HttpClient BaseAddress configuration, NOT the JSON deserialization issues we've been chasing.

**Error Pattern:**
```
System.InvalidOperationException: An invalid request URI was provided. 
Either the request URI must be an absolute URI or BaseAddress must be set.
```

## **Evidence from Server Logs**
**Actual Error Location:** Line 366 in HostSessionManager.razor
**Error Context:** During `/api/host/authenticate` API call
**Root Cause:** HttpClient created without BaseAddress, relative URLs failing

```
[08:43:19 ERR] NoorCanvas.Pages.HostSessionManager NOOR-ERROR: Exception during host authentication: 
An invalid request URI was provided. Either the request URI must be an absolute URI or BaseAddress must be set.
   at System.Net.Http.HttpClient.PrepareRequestMessage(HttpRequestMessage request)
   at NoorCanvas.Pages.HostSessionManager.AuthenticateHostAndLoadData() in HostSessionManager.razor:line 366
```

## **Why Previous Fixes Failed**
1. **Symptom Chasing**: We fixed JSON deserialization, JavaScript errors, routing - all symptoms, not the root cause
2. **Configuration Drift**: HttpClient configuration not persisting between sessions
3. **Incomplete Testing**: Never tested the complete API call workflow
4. **Missing BaseAddress**: HttpClientFactory not properly configured

## **Solution Implementation**

### **Step 1: Configure HttpClient BaseAddress**
**Location:** `Program.cs`
```csharp
// Add proper HttpClient configuration
builder.Services.AddHttpClient("default", client =>
{
    client.BaseAddress = new Uri("https://localhost:9091/");
    client.Timeout = TimeSpan.FromMinutes(5);
});
```

### **Step 2: Update HostSessionManager API Calls**
**Location:** `Pages/HostSessionManager.razor`
```csharp
// Use named HttpClient with BaseAddress
using var httpClient = HttpClientFactory.CreateClient("default");

// API calls now work with relative URLs
var authResponse = await httpClient.PostAsJsonAsync("api/host/authenticate", authRequest);
var albumResponse = await httpClient.GetAsync("api/host/albums?guid={Guid}");
```

### **Step 3: Add Configuration Validation**
**Location:** `Program.cs`
```csharp
// Add startup validation to catch configuration issues early
public static void ValidateConfiguration(IServiceProvider services)
{
    var httpClientFactory = services.GetRequiredService<IHttpClientFactory>();
    var client = httpClientFactory.CreateClient("default");
    
    if (client.BaseAddress == null)
        throw new InvalidOperationException("CRITICAL: HttpClient BaseAddress not configured");
}
```

## **Verification Steps**
1. ✅ Configure HttpClient BaseAddress in Program.cs
2. ✅ Update API calls to use named HttpClient
3. ✅ Add startup configuration validation
4. ✅ Test complete authentication workflow end-to-end
5. ✅ Verify no "invalid request URI" errors
6. ✅ Confirm dropdowns populate correctly

## **Success Criteria**
- ✅ No "An invalid request URI was provided" errors
- ✅ Host authentication completes successfully
- ✅ Albums/Categories/Sessions load from API
- ✅ HostSessionManager initialization works consistently
- ✅ Configuration validation prevents future issues

## **Related Issues**
- **Issue-60**: HostSessionManager Initialization Failure (ROOT CAUSE RESOLVED)
- **Issue-58**: AlertDialog JavaScript Errors (SYMPTOM - FIXED)
- **Issue-59**: DialogService Race Condition (SYMPTOM - FIXED)

## **Prevention Measures**
- HttpClient BaseAddress required for all API calls
- Startup configuration validation implemented
- End-to-end testing protocol established
- Configuration dependency documentation created
