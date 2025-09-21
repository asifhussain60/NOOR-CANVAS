# Issue-58: AlertDialog Null Reference JavaScript Error

**Status:** Not Started  
**Priority:** High  
**Category:** Bug  
**Created:** September 14, 2025

## **Problem Description**

JavaScript error occurs when AlertDialog attempts to focus on a DOM element that doesn't exist, causing Blazor SignalR connection disconnection.

## **Error Details**

```javascript
Microsoft.JSInterop.JSException: Cannot read properties of null (reading 'focus')
TypeError: Cannot read properties of null (reading 'focus')
    at eval (eval at <anonymous> (blazor.server.js:1:3047), <anonymous>:1:72)
```

**Stack Trace:**

- **Source**: `AlertDialog.ShowAsync()` line 96
- **Method**: `JSRuntime.InvokeVoidAsync("eval", $"document.getElementById('{ModalId}').focus()");`
- **Impact**: Blazor connection disconnected after error

## **Root Cause Analysis**

1. **DOM Element Missing**: `document.getElementById('{ModalId}')` returns `null`
2. **Timing Issue**: JavaScript executed before DOM element is fully rendered
3. **No Null Check**: Direct `.focus()` call on potentially null element
4. **Critical Error**: JavaScript exception causes Blazor connection termination

## **Current Code (Problematic)**

```csharp
// AlertDialog.razor line 96
public async Task ShowAsync()
{
    IsVisible = true;
    StateHasChanged();
    await Task.Delay(100); // Allow DOM to update
    await JSRuntime.InvokeVoidAsync("eval", $"document.getElementById('{ModalId}').focus()");
}
```

## **Impact**

- **Severity**: High - Causes complete Blazor disconnection
- **User Experience**: Host session manager initialization fails
- **Frequency**: Consistent on HostSessionManager page load
- **Scope**: All dialog operations affected

## **Proposed Solution**

### **Enhanced JavaScript Safety Pattern**

```csharp
public async Task ShowAsync()
{
    IsVisible = true;
    StateHasChanged();
    await Task.Delay(150); // Increased delay for DOM stability

    // Safe focus with null checking and retry logic
    var script = $@"
        (function() {{
            const element = document.getElementById('{ModalId}');
            if (element) {{
                element.focus();
                return true;
            }} else {{
                console.warn('NOOR-WARNING: Modal element {ModalId} not found for focus');
                return false;
            }}
        }})()";

    try
    {
        var result = await JSRuntime.InvokeAsync<bool>("eval", script);
        if (!result)
        {
            Logger.LogWarning("NOOR-WARNING: Failed to focus modal {ModalId} - element not found", ModalId);
        }
    }
    catch (JSException ex)
    {
        Logger.LogError(ex, "NOOR-ERROR: JavaScript error in AlertDialog.ShowAsync for {ModalId}", ModalId);
    }
}
```

## **Additional Debugging**

### **Enhanced Logging Required**

1. **DOM State Logging**: Log when DOM elements are created/destroyed
2. **Timing Analysis**: Measure delay between StateHasChanged() and DOM availability
3. **Modal ID Validation**: Ensure ModalId uniqueness and proper generation
4. **JavaScript Exception Handling**: Graceful degradation when focus fails

### **Test Cases Needed**

1. **Rapid Dialog Opening**: Test multiple quick ShowAsync() calls
2. **Component Lifecycle**: Test during component initialization/disposal
3. **Browser Compatibility**: Test across different browsers
4. **Mobile Devices**: Test on touch devices where focus behavior differs

## **Related Issues**

- **Issue-59**: DialogService Registration Race Condition
- **Issue-32**: HostSessionManager API Endpoints 500 Errors (may be related)

## **References**

- **File**: `SPA/NoorCanvas/Components/Dialogs/AlertDialog.razor`
- **Method**: `ShowAsync()` line 96
- **Service**: `NoorCanvas.Services.DialogService.cs` line 29
- **Consumer**: `NoorCanvas.Pages.HostSessionManager.razor` line 317
