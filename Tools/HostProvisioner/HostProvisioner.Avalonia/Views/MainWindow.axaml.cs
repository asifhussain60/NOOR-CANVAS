using Avalonia.Controls;
using Avalonia.Input;
using Avalonia.Interactivity;
using HostProvisioner.Avalonia.ViewModels;

namespace HostProvisioner.Avalonia.Views;

public partial class MainWindow : Window
{
    public MainWindow()
    {
        InitializeComponent();
        
        // Set window reference in ViewModel for clipboard access
        this.DataContextChanged += (sender, args) =>
        {
            if (DataContext is MainWindowViewModel viewModel)
            {
                viewModel.SetWindow(this);
            }
        };
    }

    private void CloseButton_Click(object? sender, RoutedEventArgs e)
    {
        Close();
    }

    private void TxtSessionId_KeyDown(object? sender, KeyEventArgs e)
    {
        if (e.Key == Key.Enter)
        {
            e.Handled = true;
            
            // Trigger the Generate Token command
            if (DataContext is MainWindowViewModel viewModel)
            {
                viewModel.GenerateTokenCommand.Execute(null);
            }
        }
    }
}