using Microsoft.EntityFrameworkCore;
using NoorCanvas.Configuration;
using NoorCanvas.Data;
using NoorCanvas.Hubs;
using NoorCanvas.Services;
using NoorCanvas.Services.Development;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

// Configure Serilog (use configuration-based approach only to prevent duplication)
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .CreateLogger();

builder.Host.UseSerilog();

// Configure Countries settings
builder.Services.Configure<CountriesOptions>(
    builder.Configuration.GetSection(CountriesOptions.SectionName));

// Configure Kestrel server for production readiness
builder.Services.Configure<Microsoft.AspNetCore.Server.Kestrel.Core.KestrelServerOptions>(options =>
{
    options.Limits.MaxConcurrentConnections = 100;
    options.Limits.MaxConcurrentUpgradedConnections = 100;
    options.Limits.MaxRequestBodySize = 30_000_000; // 30MB
    options.Limits.KeepAliveTimeout = TimeSpan.FromMinutes(2);
    options.Limits.RequestHeadersTimeout = TimeSpan.FromSeconds(30);
});

// Add services to the container
builder.Services.AddRazorPages();
builder.Services.AddServerSideBlazor(options =>
{
    // Configure Blazor Server options to prevent protocol conflicts
    options.JSInteropDefaultCallTimeout = TimeSpan.FromSeconds(10);
    options.DisconnectedCircuitMaxRetained = 100;
    options.DisconnectedCircuitRetentionPeriod = TimeSpan.FromSeconds(180);
});
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        // Configure JSON serialization to use camelCase (for frontend compatibility)
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.DictionaryKeyPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
    });

// Add Entity Framework - Conditional based on environment
if (builder.Environment.EnvironmentName == "Testing")
{
    // Use In-Memory database for testing
    builder.Services.AddDbContext<CanvasDbContext>(options =>
        options.UseInMemoryDatabase("NoorCanvasTestDb"));

    // Add Simplified Schema for testing
    builder.Services.AddDbContext<SimplifiedCanvasDbContext>(options =>
        options.UseInMemoryDatabase("NoorCanvasSimplifiedTestDb"));
}
else
{
    // Use SQL Server for development and production
    builder.Services.AddDbContext<CanvasDbContext>(options =>
        options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection") ??
            "Server=AHHOME;Database=NoorCanvas;Trusted_Connection=true;MultipleActiveResultSets=true"));

    // Add Simplified Schema Context (for migration)
    builder.Services.AddDbContext<SimplifiedCanvasDbContext>(options =>
        options.UseSqlServer(builder.Configuration.GetConnectionString("SimplifiedConnection") ??
            builder.Configuration.GetConnectionString("DefaultConnection") ??
            "Server=AHHOME;Database=NoorCanvasSimplified;Trusted_Connection=true;MultipleActiveResultSets=true"));
}

// Add KSESSIONS Database Context (Read-only for Groups, Categories, Sessions)
builder.Services.AddDbContext<KSessionsDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("KSessionsDb") ??
        builder.Configuration.GetConnectionString("DefaultConnection") ??
        "Server=AHHOME;Database=KSESSIONS_DEV;Trusted_Connection=true;MultipleActiveResultSets=true")
    .UseQueryTrackingBehavior(QueryTrackingBehavior.NoTracking)); // Read-only optimization

// Add SignalR with JSON protocol only (avoiding BlazorPack compatibility issues)
builder.Services.AddSignalR(options =>
{
    options.EnableDetailedErrors = builder.Environment.IsDevelopment();
    options.HandshakeTimeout = TimeSpan.FromSeconds(15);
    options.KeepAliveInterval = TimeSpan.FromSeconds(15);
    options.ClientTimeoutInterval = TimeSpan.FromSeconds(30);
    options.MaximumReceiveMessageSize = 1024 * 1024; // 1MB max message size

    // Enhanced logging for hostcanvas debugging
    if (builder.Environment.IsDevelopment())
    {
        Log.Information("NOOR-SIGNALR-CONFIG: SignalR configured with detailed errors, timeouts: handshake={HandshakeTimeout}s, keepalive={KeepAliveInterval}s, client={ClientTimeoutInterval}s",
            options.HandshakeTimeout?.TotalSeconds ?? 0, options.KeepAliveInterval?.TotalSeconds ?? 0, options.ClientTimeoutInterval?.TotalSeconds ?? 0);
    }
})
.AddJsonProtocol(); // Force JSON protocol only

// Add CORS for development
builder.Services.AddCors(options =>
{
    options.AddPolicy("DevelopmentCorsPolicy", policy =>
    {
        policy.WithOrigins("https://localhost:9090", "https://localhost:9091", "http://localhost:9090", "http://localhost:9091")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// Add HttpClient service for dependency injection with base address
builder.Services.AddHttpClient("default", client =>
{
    // Configure base address for relative URL requests
    var baseAddress = builder.Environment.IsDevelopment()
        ? "https://localhost:9091"
        : "https://localhost:9091"; // Update this for production
    client.BaseAddress = new Uri(baseAddress);
    client.DefaultRequestHeaders.Add("User-Agent", "NoorCanvas-BlazorServer");
});

// COPILOT-FIX: Add missing NoorCanvasApi HttpClient configuration to resolve SessionCanvas BaseAddress error
builder.Services.AddHttpClient("NoorCanvasApi", client =>
{
    var baseAddress = builder.Environment.IsDevelopment()
        ? "https://localhost:9091"
        : "https://localhost:9091"; // Update this for production
    client.BaseAddress = new Uri(baseAddress);
    client.DefaultRequestHeaders.Add("User-Agent", "NoorCanvas-SessionCanvas");
});

builder.Services.AddScoped<HttpClient>(provider =>
{
    var factory = provider.GetRequiredService<IHttpClientFactory>();
    return factory.CreateClient("default");
});

// Add application services
builder.Services.AddScoped<IAnnotationService, AnnotationService>();
builder.Services.AddScoped<DialogService>();
builder.Services.AddScoped<DebugService>(); // NOOR_DEBUG: Enhanced debug service registration v2.0
builder.Services.AddScoped<HostSessionService>(); // Host session management service
builder.Services.AddScoped<LoadingService>(); // Global loading state management service

// Development services - Only available in development builds
builder.Services.AddScoped<NoorCanvas.Services.Development.IDevModeService, NoorCanvas.Services.Development.DevModeService>();
builder.Services.AddScoped<NoorCanvas.Services.Development.ITestDataService, NoorCanvas.Services.Development.TestDataService>();

// Schema Migration Services - Simplified schema only
builder.Services.AddScoped<SimplifiedTokenService>(); // Simplified token service
builder.Services.AddScoped<SessionStateService>(); // Session state persistence service

// [DEBUG-WORKITEM:hostcanvas:continue] HTML rendering service for safe transcript display ;CLEANUP_OK
builder.Services.AddScoped<SafeHtmlRenderingService>(); // Safe HTML rendering inspired by KSESSIONS $sce.trustAsHtml

// [DEBUG-WORKITEM:assetshare:impl:09291233-as1] Enhanced asset HTML processing service using HtmlAgilityPack ;CLEANUP_OK
builder.Services.AddScoped<AssetHtmlProcessingService>(); // Advanced asset detection, extraction, and processing for host sharing

// AssetProcessingService - Extracted from HostControlPanel for HTML transformation and asset sharing
builder.Services.AddScoped<AssetProcessingService>(); // HTML transformation service with asset sharing buttons

builder.Services.AddScoped<AssetDetectorService>(); // UC-L1: Asset detection and sharing service (legacy)
builder.Services.AddScoped<AssetDetectionService>(); // SessionAssets table-based asset detection
builder.Services.AddScoped<FlagService>(); // Resilient flag service with CDN fallbacks
builder.Services.AddScoped<HtmlParsingService>(); // [DEBUG-WORKITEM:signalcomm:impl] Advanced HTML parsing service to replace Blazor DOM parser limitations ;CLEANUP_OK
// [DEBUG-WORKITEM:canvascleanup:impl] ContentBroadcastService removed ;CLEANUP_OK
// [DEBUG-WORKITEM:canvascleanup:impl] DatabaseMigrator removed ;CLEANUP_OK

var app = builder.Build();

// NOOR CANVAS STARTUP VALIDATION - Prevent configuration issues like Issue-62
ValidateStartupConfiguration(app.Services);

// Configure the HTTP request pipeline
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Error");
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();

app.UseRouting();

// NOOR_DEBUG: Enhanced debug middleware for comprehensive request tracking (temporarily disabled)
// if (app.Environment.IsDevelopment())
// {
//     app.UseMiddleware<NoorCanvas.Middleware.DebugMiddleware>();
// }

if (app.Environment.IsDevelopment())
{
    app.UseCors("DevelopmentCorsPolicy");
}

app.UseAuthorization();

// Configure endpoints
app.MapRazorPages();
app.MapBlazorHub(configureOptions: options =>
{
    // Configure Blazor SignalR to use JSON protocol only
    options.ApplicationMaxBufferSize = 32 * 1024;  // 32KB buffer
    options.TransportMaxBufferSize = 32 * 1024;    // 32KB buffer  
});

// Map testing suite route (single consolidated handler)
app.MapGet("/testing/{**catchall}", async (HttpContext context) =>
{
    var filePath = Path.Combine(app.Environment.WebRootPath, "testing", "index.html");
    if (File.Exists(filePath))
    {
        context.Response.ContentType = "text/html";
        await context.Response.SendFileAsync(filePath);
    }
    else
    {
        context.Response.StatusCode = 404;
        await context.Response.WriteAsync("Testing suite not found");
    }
}).WithName("TestingSuite");

app.MapControllers();
app.MapFallbackToPage("/_Host");

// Map SignalR Hubs with enhanced logging
app.MapHub<SessionHub>("/hub/session");        // PRIMARY: Production sessions, HTML broadcasting
app.MapHub<QAHub>("/hub/qa");                  // Q&A functionality
app.MapHub<AnnotationHub>("/hub/annotation");  // Annotation features
app.MapHub<TestHub>("/hub/test");              // TESTING: Development/debugging only

Log.Information("NOOR-SIGNALR: SignalR hubs mapped - SessionHub (/hub/session), QAHub (/hub/qa), AnnotationHub (/hub/annotation), TestHub (/hub/test)");

// Health endpoint (also available at /healthz via controller)
app.MapGet("/healthz", () => new
{
    status = "ok",
    timestamp = DateTime.UtcNow,
    version = "1.0.0-phase1"
});

// Observer stream endpoint (development only)
if (app.Environment.IsDevelopment())
{
    app.MapGet("/observer/stream", async (HttpContext context) =>
    {
        context.Response.Headers["Content-Type"] = "text/event-stream";
        context.Response.Headers["Cache-Control"] = "no-cache";
        context.Response.Headers["Connection"] = "keep-alive";

        await context.Response.WriteAsync("data: {\"event\":\"observer-connected\",\"timestamp\":\"" + DateTime.UtcNow + "\"}\n\n");
        await context.Response.Body.FlushAsync();

        // Keep connection alive for observer stream
        while (!context.RequestAborted.IsCancellationRequested)
        {
            await Task.Delay(5000);
            await context.Response.WriteAsync("data: {\"event\":\"heartbeat\",\"timestamp\":\"" + DateTime.UtcNow + "\"}\n\n");
            await context.Response.Body.FlushAsync();
        }
    });
}

Log.Information("NOOR-STARTUP: NOOR Canvas Phase 1 application starting");

try
{
    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "NOOR-FATAL: Application terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}

/// <summary>
/// NOOR CANVAS STARTUP CONFIGURATION VALIDATION
/// Prevents configuration-related issues like Issue-62 from reaching production
/// Enhanced with error aggregation and fail-fast behavior for critical issues
/// </summary>
static void ValidateStartupConfiguration(IServiceProvider services)
{
    var logger = services.GetRequiredService<ILogger<Program>>();
    var criticalErrors = new List<string>();
    var warnings = new List<string>();

    try
    {
        // CRITICAL: HttpClient BaseAddress Validation (Issue-62 Prevention)
        try
        {
            var httpClientFactory = services.GetRequiredService<IHttpClientFactory>();
            var defaultClient = httpClientFactory.CreateClient("default");
            var noorCanvasApiClient = httpClientFactory.CreateClient("NoorCanvasApi");

            if (defaultClient.BaseAddress == null)
            {
                var error = "HttpClient 'default' BaseAddress not configured. This will cause API authentication failures.";
                criticalErrors.Add(error);
                logger.LogError("❌ NOOR-CRITICAL: {Error}", error);
            }
            else
            {
                logger.LogInformation("✅ NOOR-VALIDATION: HttpClient BaseAddress configured: {BaseAddress}", defaultClient.BaseAddress);
            }

            if (noorCanvasApiClient.BaseAddress == null)
            {
                var error = "HttpClient 'NoorCanvasApi' BaseAddress not configured. This will cause API communication failures.";
                criticalErrors.Add(error);
                logger.LogError("❌ NOOR-CRITICAL: {Error}", error);
            }
            else
            {
                logger.LogInformation("✅ NOOR-VALIDATION: NoorCanvasApi HttpClient BaseAddress configured: {BaseAddress}", noorCanvasApiClient.BaseAddress);
            }
        }
        catch (Exception ex)
        {
            var error = $"HttpClient validation failed: {ex.Message}";
            criticalErrors.Add(error);
            logger.LogError(ex, "❌ NOOR-CRITICAL: {Error}", error);
        }

        // Database Connection Validation with fail-fast for critical database issues
        try
        {
            using var scope = services.CreateScope();
            var canvasDbContext = scope.ServiceProvider.GetRequiredService<CanvasDbContext>();
            var kSessionsDbContext = scope.ServiceProvider.GetRequiredService<KSessionsDbContext>();

            var canvasCanConnect = canvasDbContext.Database.CanConnect();
            var kSessionsCanConnect = kSessionsDbContext.Database.CanConnect();

            if (!canvasCanConnect)
            {
                var error = "Canvas database connection failed. Application cannot function without canvas database.";
                criticalErrors.Add(error);
                logger.LogError("❌ NOOR-CRITICAL: {Error}", error);
            }
            else
            {
                logger.LogInformation("✅ NOOR-VALIDATION: Canvas database connection verified");
            }

            if (!kSessionsCanConnect)
            {
                var warning = "KSESSIONS database connection failed. Some features may be limited.";
                warnings.Add(warning);
                logger.LogWarning("⚠️ NOOR-WARNING: {Warning}", warning);
            }
            else
            {
                logger.LogInformation("✅ NOOR-VALIDATION: KSESSIONS database connection verified");

                // [DEBUG-WORKITEM:signalcomm:impl] ContentBroadcasts table will be created on first access ;CLEANUP_OK
                logger.LogInformation("[DEBUG-WORKITEM:signalcomm:impl] ContentBroadcasts table migration will run on first broadcast ;CLEANUP_OK");
            }
        }
        catch (Exception ex)
        {
            var error = $"Database connection validation failed: {ex.Message}";
            criticalErrors.Add(error);
            logger.LogError(ex, "❌ NOOR-CRITICAL: {Error}", error);
        }

        // FAIL-FAST: If critical errors exist, halt application startup
        if (criticalErrors.Any())
        {
            logger.LogError("❌ NOOR-FATAL: Application startup halted due to {CriticalErrorCount} critical configuration errors:", criticalErrors.Count);
            foreach (var error in criticalErrors)
            {
                logger.LogError("   - {Error}", error);
            }

            throw new ApplicationException($"Application startup failed due to {criticalErrors.Count} critical configuration errors. " +
                "See logs for details. Fix configuration issues before restarting.");
        }

        // Report warnings but continue startup
        if (warnings.Any())
        {
            logger.LogWarning("⚠️ NOOR-STARTUP: Application starting with {WarningCount} configuration warnings:", warnings.Count);
            foreach (var warning in warnings)
            {
                logger.LogWarning("   - {Warning}", warning);
            }
        }

        logger.LogInformation("✅ NOOR-VALIDATION: Startup configuration validation completed - {CriticalErrors} critical errors, {Warnings} warnings",
            criticalErrors.Count, warnings.Count);
    }
    catch (Exception ex) when (!(ex is ApplicationException))
    {
        logger.LogError(ex, "❌ NOOR-ERROR: Startup configuration validation encountered unexpected error: {Message}", ex.Message);
        throw new ApplicationException("Startup configuration validation failed unexpectedly. See logs for details.", ex);
    }
}

// Make Program class accessible for testing
public partial class Program { }
