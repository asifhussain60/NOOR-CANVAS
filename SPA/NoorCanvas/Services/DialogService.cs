using Microsoft.AspNetCore.Components;
using NoorCanvas.Components.Dialogs;

namespace NoorCanvas.Services
{
    public class DialogService
    {
        private AlertDialog? _alertDialog;
        private ConfirmDialog? _confirmDialog;

        public void RegisterAlertDialog(AlertDialog alertDialog)
        {
            _alertDialog = alertDialog;
        }

        public void RegisterConfirmDialog(ConfirmDialog confirmDialog)
        {
            _confirmDialog = confirmDialog;
        }

        public async Task ShowAlertAsync(string message, string title = "Alert", AlertDialog.AlertType type = AlertDialog.AlertType.Info)
        {
            if (_alertDialog == null)
                throw new InvalidOperationException("AlertDialog not registered. Please add <AlertDialog @ref=\"_alertDialog\" /> to your component and call dialogService.RegisterAlertDialog(_alertDialog) in OnInitialized.");

            _alertDialog.Title = title;
            _alertDialog.Message = message;
            _alertDialog.Type = type;
            await _alertDialog.ShowAsync();
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
