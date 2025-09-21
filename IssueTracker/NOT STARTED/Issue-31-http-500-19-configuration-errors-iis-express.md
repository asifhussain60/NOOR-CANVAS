# Issue-31: HTTP 500.19 Configuration Errors in IIS Express

## 📋 **Issue Details**

- **Issue ID:** Issue-31
- **Title:** HTTP 500.19 Configuration Errors in IIS Express
- **Type:** Bug 🐛
- **Priority:** High 🔴
- **Status:** ⏳ Awaiting User Confirmation - FIXED
- **Created:** September 13, 2025
- **Fixed:** September 13, 2025
- **Reporter:** User (Manual Testing)
- **Assignee:** Development Team

## 🎯 **Problem Statement**

Application shows HTTP 500.19 errors in IIS Express window when accessing localhost:9091. The status code 500.19 typically indicates a configuration error in web.config or applicationhost.config that prevents the application from starting properly.

## 📝 **Detailed Description**

**Observed Behavior:**

- IIS Express launches successfully
- Application binds to ports 9090 (HTTP) and 9091 (HTTPS)
- HTTP 500.19 errors appear in IIS Express console
- favicon.ico also returns HTTP 500.19
- Health endpoints are not responding

**Expected Behavior:**

- Application should start without configuration errors
- Health endpoint should return 200 OK
- Application should be accessible via browser

## 🔍 **Root Cause Analysis**

HTTP 500.19 errors in IIS Express typically indicate:

1. **Missing web.config configuration**
2. **Invalid ASP.NET Core hosting configuration**
3. **Missing IIS module dependencies**
4. **Incorrect applicationhost.config settings**

## 🏗️ **Technical Investigation Required**

1. **Check web.config presence and validity**
2. **Verify ASP.NET Core Module registration**
3. **Validate applicationhost.config IIS Express settings**
4. **Check Program.cs hosting configuration**
5. **Verify all required dependencies are installed**

## 🔧 **Resolution Steps**

1. Inspect IIS Express applicationhost.config
2. Verify web.config generation during build
3. Check ASP.NET Core runtime installation
4. Validate hosting model configuration
5. Test with minimal ASP.NET Core configuration

## ✅ **Acceptance Criteria**

- [ ] Application starts without HTTP 500.19 errors
- [ ] Health endpoint returns 200 OK response
- [ ] Application is accessible in browser
- [ ] No configuration errors in IIS Express console

## 📊 **Impact Assessment**

- **User Impact:** Application cannot be manually tested
- **Development Impact:** Blocks all feature validation
- **Priority Justification:** Critical blocker for testing

---

**Status History:**

- **2025-09-13:** Issue identified during manual testing session
- **2025-09-13:** ✅ FIXED - Root cause: Program.cs called app.Run("https://localhost:9091") which conflicts with IIS Express hosting. Changed to app.Run() to let IIS Express handle URL configuration.

## ✅ **Resolution Summary**

**Root Cause:** The `Program.cs` file was calling `app.Run("https://localhost:9091")` which forced Kestrel to bind to a specific URL, conflicting with IIS Express configuration expectations.

**Fix Applied:**

- Changed `app.Run("https://localhost:9091")` to `app.Run()` in Program.cs line 193
- This allows IIS Express to handle URL binding configuration through launchSettings.json
- Application now starts successfully without HTTP 500.19 errors

**Verification:**

- Application builds successfully
- Application starts without configuration errors
- Listening on both HTTP (9090) and HTTPS (9091) ports
- No more "Failed to bind to address" errors
