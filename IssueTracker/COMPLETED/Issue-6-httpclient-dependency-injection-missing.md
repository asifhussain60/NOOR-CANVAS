# Issue 6: HttpClient Dependency Injection Missing

**Issue ID**: 6  
**Title**: HttpClient Dependency Injection Missing  
**Priority**: High 🔴  
**Category**: Bug 🐛  
**Status**: Not Started ❌  
**Created**: September 11, 2025  

---

## 📋 **Issue Summary**

HostDashboard component fails to load due to missing HttpClient service registration in the dependency injection container.

## 🐛 **Error Details**

**Error Message**:
```
System.InvalidOperationException: Cannot provide a value for property 'Http' on type 'NoorCanvas.Pages.HostDashboard'. There is no registered service of type 'System.Net.Http.HttpClient'.
```

**Error Location**: HostDashboard.razor component  
**Impact**: Host authentication succeeds but dashboard fails to render, causing connection disconnect

## 🔄 **Reproduction Steps**

1. Run NOOR Canvas application (`ncrun`)
2. Navigate to landing page
3. Select "Host" role
4. Enter valid host GUID: `a909b3f1-f596-4c6e-963b-0a68512ecd3e`
5. Click "Access Host Dashboard"
6. Observe browser console error and component failure

## 📊 **Expected vs Actual Behavior**

**Expected**: HostDashboard component loads successfully after authentication  
**Actual**: Component throws InvalidOperationException due to missing HttpClient injection

## 🔍 **Root Cause Analysis**

The HostDashboard component has an injected HttpClient property:
```csharp
[Inject] public HttpClient Http { get; set; } = default!;
```

However, HttpClient service is not registered in `Program.cs` dependency injection configuration.

## 💡 **Resolution Strategy**

Register HttpClient service in Program.cs:
```csharp
builder.Services.AddHttpClient();
```

## ✅ **Acceptance Criteria**

- [ ] HttpClient service registered in dependency injection
- [ ] HostDashboard component loads without errors
- [ ] Host authentication flow completes successfully
- [ ] No InvalidOperationException in browser console
- [ ] Host dashboard renders properly

## 🔗 **Related Issues**

None

## 📝 **Resolution Notes**

**Fix Applied**: Added `builder.Services.AddHttpClient();` to Program.cs dependency injection configuration

**Code Change Location**: `D:\PROJECTS\NOOR CANVAS\SPA\NoorCanvas\Program.cs` - Line 62
```csharp
// Add HttpClient service for dependency injection
builder.Services.AddHttpClient();

// Add application services
builder.Services.AddScoped<IAnnotationService, AnnotationService>();
```

**Verification Required**: Test host authentication flow and HostDashboard component loading

---

**Status History**:
- 2025-09-11: Issue created - HttpClient dependency injection missing
- 2025-09-11: Fix implemented - Added HttpClient service registration, moved to AWAITING_CONFIRMATION
- 2025-09-11: **COMPLETED** - Verified HttpClient service properly registered in Program.cs line 60
