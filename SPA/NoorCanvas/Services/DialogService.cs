using Microsoft.AspNetCore.Components;
using Microsoft.JSInterop;
using NoorCanvas.Components.Dialogs;

namespace NoorCanvas.Services
{
    public class DialogService
    {
        private readonly ILogger<DialogService> _logger;
        private readonly IJSRuntime _jsRuntime;
        private readonly Queue<Func<Task>> _pendingOperations = new();
        private AlertDialog? _alertDialog;
        private ConfirmDialog? _confirmDialog;

        public DialogService(ILogger<DialogService> logger, IJSRuntime jsRuntime)
        {
            _logger = logger;
            _jsRuntime = jsRuntime;
        }

        public async Task RegisterAlertDialog(AlertDialog alertDialog)
        {
            _logger.LogDebug("NOOR-DEBUG: Registering AlertDialog component");
            _alertDialog = alertDialog;

            // Process queued operations
            while (_pendingOperations.Count > 0)
            {
                var operation = _pendingOperations.Dequeue();
                try
                {
                    await operation();
                    _logger.LogDebug("NOOR-DEBUG: Processed queued dialog operation");
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "NOOR-ERROR: Failed to process queued dialog operation");
                }
            }
        }

        public void RegisterConfirmDialog(ConfirmDialog confirmDialog)
        {
            _logger.LogDebug("NOOR-DEBUG: Registering ConfirmDialog component");
            _confirmDialog = confirmDialog;
        }

        public async Task ShowAlertAsync(string message, string title = "Alert", AlertDialog.AlertType type = AlertDialog.AlertType.Info)
        {
            _logger.LogDebug("NOOR-DEBUG: ShowAlertAsync called - AlertDialog registered: {IsRegistered}", _alertDialog != null);

            if (_alertDialog == null)
            {
                _logger.LogWarning("NOOR-WARNING: Attempted to show alert dialog before registration - Message: {Message}", message);

                // Queue the operation for when dialog is registered
                _pendingOperations.Enqueue(async () =>
                {
                    await _alertDialog!.ShowAsync(title, message, type);
                });

                // Fallback to JavaScript alert for immediate display
                try
                {
                    await _jsRuntime.InvokeVoidAsync("alert", $"{title}: {message}");
                    _logger.LogInformation("NOOR-INFO: Used JavaScript alert fallback for: {Title}", title);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "NOOR-ERROR: Failed to show JavaScript alert fallback");
                }
                return;
            }

            await _alertDialog.ShowAsync(title, message, type);
        }

        public async Task ShowSuccessAsync(string message, string title = "Success")
        {
            await ShowAlertAsync(message, title, AlertDialog.AlertType.Success);
        }

        public async Task ShowWarningAsync(string message, string title = "Warning")
        {
            await ShowAlertAsync(message, title, AlertDialog.AlertType.Warning);
        }

        public async Task ShowErrorAsync(string message, string title = "Error")
        {
            await ShowAlertAsync(message, title, AlertDialog.AlertType.Error);
        }

        public async Task<bool> ShowConfirmAsync(string message, string title = "Confirm Action", ConfirmDialog.ConfirmationType type = ConfirmDialog.ConfirmationType.Question)
        {
            if (_confirmDialog == null)
                throw new InvalidOperationException("ConfirmDialog not registered. Please add <ConfirmDialog @ref=\"_confirmDialog\" /> to your component and call dialogService.RegisterConfirmDialog(_confirmDialog) in OnInitialized.");

            return await _confirmDialog.ShowConfirmAsync(title, message, type);
        }

        public async Task<bool> ShowWarningConfirmAsync(string message, string title = "Warning")
        {
            return await ShowConfirmAsync(message, title, ConfirmDialog.ConfirmationType.Warning);
        }

        public async Task<bool> ShowDangerConfirmAsync(string message, string title = "Confirm Delete")
        {
            return await ShowConfirmAsync(message, title, ConfirmDialog.ConfirmationType.Danger);
        }
    }
}
