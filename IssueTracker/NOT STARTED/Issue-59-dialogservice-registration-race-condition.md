# Issue-59: DialogService Registration Race Condition

**Status:** Not Started  
**Priority:** High  
**Category:** Bug  
**Created:** September 14, 2025  

## **Problem Description**

Race condition exists where `DialogService.ShowErrorAsync()` is called during component initialization before `AlertDialog` component is registered in `OnAfterRenderAsync()`, causing null reference exceptions.

## **Error Flow**

```
1. HostSessionManager.OnInitializedAsync() starts
2. AuthenticateHostAndLoadData() called
3. Exception occurs in authentication
4. DialogService.ShowErrorAsync() called
5. AlertDialog not yet registered (OnAfterRenderAsync hasn't run)
6. InvalidOperationException thrown
7. Blazor connection fails
```

## **Root Cause Analysis**

### **Timing Issue**
- **OnInitializedAsync()**: Runs immediately during component initialization
- **OnAfterRenderAsync()**: Runs after first render cycle completes
- **Problem**: Error handling needs dialogs before dialogs are registered

### **Current Code Flow (Problematic)**

```csharp
// HostSessionManager.razor
protected override async Task OnInitializedAsync()
{
    try
    {
        // This can fail and call ShowErrorAsync() immediately
        await AuthenticateHostAndLoadData(); 
    }
    catch (Exception ex)
    {
        Logger.LogError(ex, "NOOR-ERROR: Failed to initialize host session manager");
        // BUG: AlertDialog not registered yet!
        await DialogService.ShowErrorAsync("Failed to initialize session manager. Please try again.", "Error");
    }
}

protected override async Task OnAfterRenderAsync(bool firstRender)
{
    if (firstRender)
    {
        // Registration happens AFTER OnInitializedAsync completes
        DialogService.RegisterAlertDialog(alertDialog);
        DialogService.RegisterConfirmDialog(confirmDialog);
    }
}
```

## **Impact**

- **Severity**: High - Prevents proper error reporting during initialization
- **User Experience**: Users see Blazor errors instead of friendly error messages
- **Development**: Debugging complicated by missing error dialogs
- **Reliability**: Component initialization becomes fragile

## **Proposed Solutions**

### **Solution 1: Defensive DialogService (Recommended)**

```csharp
// DialogService.cs - Enhanced with fallback behavior
public async Task ShowErrorAsync(string message, string title = "Error")
{
    if (_alertDialog == null)
    {
        Logger.LogWarning("NOOR-WARNING: AlertDialog not registered, using fallback error display");
        
        // Fallback to JavaScript alert for early initialization errors
        await JSRuntime.InvokeVoidAsync("alert", $"{title}: {message}");
        return;
    }
    
    await ShowAlertAsync(message, title, AlertDialog.AlertType.Error);
}
```

### **Solution 2: Initialization Order Restructuring**

```csharp
// HostSessionManager.razor - Deferred initialization
protected override async Task OnAfterRenderAsync(bool firstRender)
{
    if (firstRender)
    {
        DialogService.RegisterAlertDialog(alertDialog);
        DialogService.RegisterConfirmDialog(confirmDialog);
        
        // Move initialization after dialog registration
        await InitializeHostSessionManager();
    }
}

private async Task InitializeHostSessionManager()
{
    try
    {
        await AuthenticateHostAndLoadData();
    }
    catch (Exception ex)
    {
        Logger.LogError(ex, "NOOR-ERROR: Failed to initialize host session manager");
        await DialogService.ShowErrorAsync("Failed to initialize session manager. Please try again.", "Error");
    }
    finally
    {
        isLoading = false;
    }
}
```

### **Solution 3: Async Registration Pattern**

```csharp
// DialogService.cs - Queue operations until registration
private readonly Queue<Func<Task>> _pendingOperations = new();

public async Task ShowErrorAsync(string message, string title = "Error")
{
    if (_alertDialog == null)
    {
        // Queue the operation for when dialog is registered
        _pendingOperations.Enqueue(async () => await ShowAlertAsync(message, title, AlertDialog.AlertType.Error));
        return;
    }
    
    await ShowAlertAsync(message, title, AlertDialog.AlertType.Error);
}

public async Task RegisterAlertDialog(AlertDialog alertDialog)
{
    _alertDialog = alertDialog;
    
    // Process queued operations
    while (_pendingOperations.Count > 0)
    {
        var operation = _pendingOperations.Dequeue();
        await operation();
    }
}
```

## **Enhanced Debugging & Logging**

### **Required Logging Additions**

```csharp
// Add to DialogService constructor
private readonly ILogger<DialogService> _logger;

public DialogService(ILogger<DialogService> logger)
{
    _logger = logger;
}

// Enhanced error tracking
public async Task ShowErrorAsync(string message, string title = "Error")
{
    _logger.LogDebug("NOOR-DEBUG: ShowErrorAsync called - AlertDialog registered: {IsRegistered}", _alertDialog != null);
    
    if (_alertDialog == null)
    {
        _logger.LogWarning("NOOR-WARNING: Attempted to show error dialog before registration - Message: {Message}", message);
        // Fallback behavior
    }
}
```

## **Test Cases Required**

1. **Early Error Testing**: Force exception in OnInitializedAsync before first render
2. **Registration Timing**: Measure time between component lifecycle events
3. **Multiple Error Scenario**: Test rapid sequential error calls
4. **Component Disposal**: Test error calls during component cleanup

## **Related Issues**

- **Issue-58**: AlertDialog Null Reference JavaScript Error
- **Primary Symptom**: Both issues cause Blazor connection failures

## **References**

- **Service**: `SPA/NoorCanvas/Services/DialogService.cs`
- **Component**: `SPA/NoorCanvas/Pages/HostSessionManager.razor` lines 310-320
- **Dialog Component**: `SPA/NoorCanvas/Components/Dialogs/AlertDialog.razor`
