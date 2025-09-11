# Issue-9: Blazor JavaScript Interop During Static Rendering

**Date Created:** September 11, 2025  
**Priority:** High  
**Category:** Bug  
**Status:** Not Started

---

## **Issue Summary**

HostDashboard component is attempting to call JavaScript interop functions during OnInitializedAsync lifecycle method while component is being statically rendered (server-side prerendering), causing InvalidOperationException.

## **Error Details**

**Exception Type:** `InvalidOperationException`  
**Message:** JavaScript interop calls cannot be issued at this time. This is because the component is being statically rendered. When prerendering is enabled, JavaScript interop calls can only be performed during the OnAfterRenderAsync lifecycle method.

**Stack Trace Location:** 
- `NoorCanvas.Pages.HostDashboard.OnInitializedAsync()` in HostDashboard.razor
- Line: `await JSRuntime.InvokeVoidAsync("NoorLogger.error", "HOST-DASHBOARD", "Initialization failed", new { error = ex.Message });`

## **Root Cause Analysis**

1. **Blazor Server Prerendering**: Component is being statically rendered on server before SignalR connection is established
2. **Incorrect Lifecycle Method**: JavaScript interop calls in `OnInitializedAsync()` instead of `OnAfterRenderAsync()`
3. **Missing Render State Check**: No check for `firstRender` parameter to ensure client-side execution

## **Impact Assessment**

- **Severity**: High - Prevents HostDashboard component from loading
- **User Experience**: Host authentication fails, dashboard inaccessible
- **System Impact**: Breaks core host functionality, affects session management
- **Browser Behavior**: Shows ASP.NET Core error page instead of dashboard

## **Reproduction Steps**

1. Navigate to host authentication page
2. Enter valid host token/GUID
3. Click "Access Dashboard" button
4. Exception occurs during component initialization
5. Error page displays instead of HostDashboard

## **Expected Behavior**

- HostDashboard should load without JavaScript interop errors
- Logging should work properly after component renders on client
- Host should access dashboard successfully after authentication

---

## **Resolution Framework**

### **Solution Options**
1. **Move JS Calls to OnAfterRenderAsync**: Use proper Blazor lifecycle method for JavaScript interop
2. **Add Render State Checks**: Ensure JavaScript calls only execute on client-side rendering
3. **Implement Error Boundary**: Add proper error handling for initialization failures
4. **Fix Logging Strategy**: Use server-side logging during initialization, client-side logging after render

### **Implementation Plan**
1. Examine HostDashboard.razor component for JavaScript interop calls
2. Move all JSRuntime calls from OnInitializedAsync to OnAfterRenderAsync
3. Add firstRender parameter checking
4. Implement fallback error handling for initialization
5. Test component loading with proper lifecycle management

### **Acceptance Criteria**
- [ ] HostDashboard loads without InvalidOperationException
- [ ] JavaScript interop calls execute only after client-side rendering
- [ ] Error logging works properly in both server and client contexts
- [ ] Host authentication and dashboard access functional
- [ ] No Blazor lifecycle violations in browser console

## **Dependencies**
- HostDashboard.razor component modifications
- Blazor Server lifecycle understanding
- JavaScript interop best practices
- Error handling improvements

## **Notes**
- This is a common Blazor Server issue when mixing server-side prerendering with client-side JavaScript
- Similar patterns should be checked in other components (Landing.razor, ParticipantView.razor)
- Consider implementing consistent logging strategy across all components
