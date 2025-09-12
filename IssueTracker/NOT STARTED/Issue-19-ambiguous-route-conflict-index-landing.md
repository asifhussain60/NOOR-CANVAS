# Issue-19: Ambiguous Route Conflict Between Index and Landing Pages

## 📋 **Issue Details**
- **Title:** Ambiguous Route Conflict Between Index and Landing Pages  
- **Priority:** High 🔴
- **Category:** Bug 🐛
- **Status:** Not Started ❌
- **Created:** September 12, 2025
- **Reporter:** System Error / User Report

## 🔍 **Problem Description**
The Blazor application is throwing an `InvalidOperationException` due to ambiguous routing configuration. Both `Index.razor` and `Landing.razor` pages are configured to use the same empty route `''`, causing the routing system to be unable to determine which component should handle the root path.

## ⚠️ **Error Details**
```
InvalidOperationException: The following routes are ambiguous:
'' in 'NoorCanvas.Pages.Index'
'' in 'NoorCanvas.Pages.Landing'
```

**Full Stack Trace:**
```
Microsoft.AspNetCore.Components.RouteTableFactory.DetectAmbiguousRoutes(TreeRouteBuilder builder)
Microsoft.AspNetCore.Components.RouteTableFactory.Create(Dictionary<Type, string[]> templatesByHandler, IServiceProvider serviceProvider)
...
Microsoft.AspNetCore.Diagnostics.DeveloperExceptionPageMiddlewareImpl.Invoke(HttpContext context)
```

## 🎯 **Root Cause Analysis**
1. **Index.razor** has `@page "/"` directive
2. **Landing.razor** also has `@page "/"` directive  
3. Both pages are trying to claim the root route, creating a conflict
4. ASP.NET Core routing system cannot resolve which component to use

## 🔧 **Impact Assessment**
- **Severity:** Application Breaking
- **Affected Areas:** All navigation, application startup
- **User Experience:** Complete application failure
- **Workaround:** None - application cannot start

## 📝 **Reproduction Steps**
1. Navigate to application root URL (http://localhost:9090/)
2. Application throws InvalidOperationException
3. Developer exception page displays routing conflict error
4. Application cannot proceed with normal operation

## ✅ **Acceptance Criteria**
- [ ] Remove route conflict between Index.razor and Landing.razor
- [ ] Establish clear routing hierarchy
- [ ] Application starts without routing errors
- [ ] All navigation links work correctly
- [ ] Root path loads appropriate default page

## 🛠️ **Resolution Approach**
1. **Identify Current Route Assignments:**
   - Check `@page` directives in both Index.razor and Landing.razor
   - Determine intended purpose of each page

2. **Resolve Route Conflict:**
   - Option A: Use Index.razor for root `/` route, assign different route to Landing.razor
   - Option B: Use Landing.razor for root `/` route, assign different route to Index.razor
   - Option C: Create new default page, move both to specific routes

3. **Update Navigation Links:**
   - Ensure NavMenu.razor links point to correct routes
   - Update any hardcoded navigation references

4. **Test Resolution:**
   - Verify application starts without errors
   - Test all navigation scenarios
   - Confirm intended page loads at root URL

## 📚 **Reference Materials**
- **Related Issues:** Issue-18 (Blazor Routing Navigation Failure)
- **ASP.NET Core Routing:** [Microsoft Documentation](https://docs.microsoft.com/en-us/aspnet/core/blazor/fundamentals/routing)
- **Previous Fixes:** Check COMPLETED folder for routing-related solutions

## 📅 **Status History**
- **September 12, 2025:** Issue created - Ambiguous routing error reported
