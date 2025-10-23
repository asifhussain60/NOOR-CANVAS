using System;
using System.IO;
using System.Linq;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore;
using NoorCanvas.Data;
using NoorCanvas.Services;

namespace HostProvisioner.Shared;

/// <summary>
/// [DEBUG-WORKITEM:host-provisioner-form:config] Centralized configuration for both CLI and WinForms Host Provisioner applications
/// </summary>
public static class HostProvisionerConfig
{
    /// <summary>
    /// Detect environment from multiple sources with priority order:
    /// 1. app.config file (modified by ncdeploy for production)
    /// 2. Default to "Development" (NEVER use ASPNETCORE_ENVIRONMENT for Host Provisioner)
    /// 
    /// NOTE: Host Provisioner should ALWAYS run in Development mode unless explicitly deployed
    /// via ncdeploy.ps1 which modifies app.config. The ASPNETCORE_ENVIRONMENT variable is 
    /// used by the web app and should NOT affect Host Provisioner.
    /// </summary>
    public static (string environment, string baseUrl) DetectEnvironment(string appConfigFileName)
    {
        string? environment = null;
        string? baseUrl = null;
        
        // DO NOT check environment variable - it's for the web app, not Host Provisioner
        // Only read from app.config file (modified by ncdeploy for production deployment)
        try
        {
            var appConfigPath = Path.Combine(Directory.GetCurrentDirectory(), appConfigFileName);
            if (File.Exists(appConfigPath))
            {
                var configDoc = System.Xml.Linq.XDocument.Load(appConfigPath);
                var envSetting = configDoc.Descendants("add")
                    .FirstOrDefault(x => x.Attribute("key")?.Value == "ASPNETCORE_ENVIRONMENT");
                environment = envSetting?.Attribute("value")?.Value;
                Console.WriteLine($"[TRACE] Environment from app.config: {environment}");
                
                // Read BaseUrl for the environment
                var baseUrlKey = $"BaseUrl_{environment}";
                var baseUrlSetting = configDoc.Descendants("add")
                    .FirstOrDefault(x => x.Attribute("key")?.Value == baseUrlKey);
                baseUrl = baseUrlSetting?.Attribute("value")?.Value;
                Console.WriteLine($"[TRACE] BaseUrl from app.config: {baseUrl}");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[TRACE] Could not read app.config: {ex.Message}");
        }
        
        // ALWAYS default to Development (Host Provisioner should only be Production when deployed via ncdeploy)
        environment ??= "Development";
        
        // Default BaseUrl if not set from config
        baseUrl ??= (environment == "Production" ? "https://noorcanvas.kashkole.com" : "https://localhost:9091");
        
        // Set the environment variable so appsettings loading works correctly
        Environment.SetEnvironmentVariable("ASPNETCORE_ENVIRONMENT", environment);
        
        // Store BaseUrl in environment for use in token generation
        Environment.SetEnvironmentVariable("NOORCANVAS_BASE_URL", baseUrl);
        
        Console.WriteLine($"[DEBUG-WORKITEM:host-provisioner-form:config] Environment: {environment}");
        Console.WriteLine($"[DEBUG-WORKITEM:host-provisioner-form:config] Base URL: {baseUrl}");
        
        return (environment, baseUrl);
    }

    /// <summary>
    /// Configure DI services for Host Provisioner (shared by CLI and WinForms)
    /// </summary>
    public static void ConfigureServices(ServiceCollection services, string environment)
    {
        // Load configuration
        var configuration = new ConfigurationBuilder()
            .SetBasePath(Directory.GetCurrentDirectory())
            .AddJsonFile("appsettings.json", optional: true, reloadOnChange: true)
            .AddJsonFile($"appsettings.{environment}.json", optional: true, reloadOnChange: true)
            .AddEnvironmentVariables()
            .Build();

        // Add Entity Framework with connection string from configuration
        var connectionString = configuration.GetConnectionString("DefaultConnection") ??
            "Server=AHHOME;Database=KSESSIONS_DEV;User ID=sa;Password=adf4961glo;Connection Timeout=3600;MultipleActiveResultSets=true;TrustServerCertificate=True;Encrypt=False;";

        // [DEBUG-WORKITEM:host-provisioner-form:config] Log which database is being targeted
        var dbName = connectionString.Contains("KSESSIONS_DEV") ? "KSESSIONS_DEV" : "KSESSIONS";
        Console.WriteLine($"[DEBUG-WORKITEM:host-provisioner-form:config] Target Database: {dbName}");

        // Use simplified schema only - use DefaultConnection for all database contexts
        services.AddDbContext<SimplifiedCanvasDbContext>(options =>
            options.UseSqlServer(connectionString, sqlOptions =>
                sqlOptions.CommandTimeout(3600)));

        // Add KSESSIONS Database Context for Session validation
        services.AddDbContext<KSessionsDbContext>(options =>
            options.UseSqlServer(connectionString, sqlOptions =>
                sqlOptions.CommandTimeout(3600)));

        // Add logging factory for token services
        services.AddLogging();
        
        // Add simplified token service
        services.AddScoped<SimplifiedTokenService>();

        // Register configuration
        services.AddSingleton<IConfiguration>(configuration);
    }

    /// <summary>
    /// Extract database name from connection string
    /// </summary>
    public static string ExtractDatabaseName(string connectionString)
    {
        try
        {
            var parts = connectionString.Split(';');
            var dbPart = parts.FirstOrDefault(p => p.Trim().StartsWith("Database=", StringComparison.OrdinalIgnoreCase));
            if (dbPart != null)
            {
                return dbPart.Split('=')[1].Trim();
            }
        }
        catch { }
        return "KSESSIONS_DEV";
    }

    /// <summary>
    /// Get connection string for display purposes (with masked password)
    /// </summary>
    public static string GetConnectionStringForDisplay(string environment)
    {
        try
        {
            var configuration = new ConfigurationBuilder()
                .SetBasePath(Directory.GetCurrentDirectory())
                .AddJsonFile("appsettings.json", optional: true)
                .AddJsonFile($"appsettings.{environment}.json", optional: true)
                .Build();
            
            var connStr = configuration.GetConnectionString("DefaultConnection") ?? 
                   "Server=AHHOME;Database=KSESSIONS_DEV;User ID=sa;Password=***;";
            
            // Mask password
            if (connStr.Contains("Password="))
            {
                var parts = connStr.Split(';');
                for (int i = 0; i < parts.Length; i++)
                {
                    if (parts[i].Trim().StartsWith("Password=", StringComparison.OrdinalIgnoreCase))
                    {
                        parts[i] = "Password=***";
                    }
                }
                connStr = string.Join(";", parts);
            }
            
            return connStr;
        }
        catch
        {
            return "Server=AHHOME;Database=KSESSIONS_DEV;User ID=sa;Password=***;";
        }
    }
}
