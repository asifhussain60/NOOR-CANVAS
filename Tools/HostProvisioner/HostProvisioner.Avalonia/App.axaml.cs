using System;
using System.Linq;
using Avalonia;
using Avalonia.Controls.ApplicationLifetimes;
using Avalonia.Data.Core;
using Avalonia.Data.Core.Plugins;
using Avalonia.Markup.Xaml;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Configuration;
using Microsoft.EntityFrameworkCore;
using HostProvisioner.Avalonia.ViewModels;
using HostProvisioner.Avalonia.Views;
using HostProvisioner.Shared;
using NoorCanvas.Data;
using NoorCanvas.Services;

namespace HostProvisioner.Avalonia;

public partial class App : Application
{
    private IServiceProvider? _serviceProvider;

    public override void Initialize()
    {
        AvaloniaXamlLoader.Load(this);
    }

    public override void OnFrameworkInitializationCompleted()
    {
        if (ApplicationLifetime is IClassicDesktopStyleApplicationLifetime desktop)
        {
            // Initialize services
            var services = new ServiceCollection();
            
            // Detect environment
            var (environment, baseUrl) = HostProvisionerConfig.DetectEnvironment("HostProvisioner.Avalonia.dll.config");
            
            // Configure services
            HostProvisionerConfig.ConfigureServices(services, environment);
            
            _serviceProvider = services.BuildServiceProvider();

            // Get database name from connection string
            var config = _serviceProvider.GetRequiredService<IConfiguration>();
            var connectionString = config.GetConnectionString("DefaultConnection") ?? "";
            var dbName = connectionString.Contains("KSESSIONS_DEV") ? "KSESSIONS_DEV" : "KSESSIONS";

            // Create ViewModel with injected services
            var viewModel = new MainWindowViewModel(
                _serviceProvider.GetRequiredService<SimplifiedCanvasDbContext>(),
                _serviceProvider.GetRequiredService<KSessionsDbContext>(),
                _serviceProvider.GetRequiredService<SimplifiedTokenService>(),
                baseUrl,
                environment,
                dbName
            );

            // Avoid duplicate validations
            DisableAvaloniaDataAnnotationValidation();
            
            desktop.MainWindow = new MainWindow
            {
                DataContext = viewModel
            };
        }

        base.OnFrameworkInitializationCompleted();
    }

    private void DisableAvaloniaDataAnnotationValidation()
    {
        var dataValidationPluginsToRemove =
            BindingPlugins.DataValidators.OfType<DataAnnotationsValidationPlugin>().ToArray();

        foreach (var plugin in dataValidationPluginsToRemove)
        {
            BindingPlugins.DataValidators.Remove(plugin);
        }
    }
}