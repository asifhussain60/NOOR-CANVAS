using Microsoft.EntityFrameworkCore;
using NoorCanvas.Configuration;
using NoorCanvas.Data;
using NoorCanvas.Hubs;
using NoorCanvas.Services;
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

// Development services - Only available in development builds
builder.Services.AddScoped<NoorCanvas.Services.Development.IDevModeService, NoorCanvas.Services.Development.DevModeService>();

// Schema Migration Services - Simplified schema only
builder.Services.AddScoped<SimplifiedTokenService>(); // Simplified token service

builder.Services.AddScoped<AssetDetectorService>(); // UC-L1: Asset detection and sharing service (legacy)
builder.Services.AddScoped<AssetDetectionService>(); // SessionAssets table-based asset detection
builder.Services.AddScoped<FlagService>(); // Resilient flag service with CDN fallbacks

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

// Map SignalR Hubs
app.MapHub<SessionHub>("/hub/session");
app.MapHub<QAHub>("/hub/qa");
app.MapHub<AnnotationHub>("/hub/annotation");

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
/// </summary>
static void ValidateStartupConfiguration(IServiceProvider services)
{
    var logger = services.GetRequiredService<ILogger<Program>>();

    try
    {
        // CRITICAL: HttpClient BaseAddress Validation (Issue-62 Prevention)
        try
        {
            var httpClientFactory = services.GetRequiredService<IHttpClientFactory>();
            var defaultClient = httpClientFactory.CreateClient("default");

            if (defaultClient.BaseAddress == null)
            {
                logger.LogWarning("⚠️ NOOR-WARNING: HttpClient 'default' BaseAddress not configured. This may cause API authentication issues.");
            }
            else
            {
                logger.LogInformation("✅ NOOR-VALIDATION: HttpClient BaseAddress configured: {BaseAddress}", defaultClient.BaseAddress);
            }
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "⚠️ NOOR-WARNING: HttpClient validation failed: {Message}", ex.Message);
        }

        // Database Connection Validation (non-blocking)
        try
        {
            using var scope = services.CreateScope();
            var canvasDbContext = scope.ServiceProvider.GetRequiredService<CanvasDbContext>();
            var canConnect = canvasDbContext.Database.CanConnect();

            if (!canConnect)
            {
                logger.LogWarning("⚠️ NOOR-WARNING: Canvas database connection failed during startup validation");
            }
            else
            {
                logger.LogInformation("✅ NOOR-VALIDATION: Canvas database connection verified");
            }
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "⚠️ NOOR-WARNING: Database connection validation failed: {Message}", ex.Message);
        }

        logger.LogInformation("✅ NOOR-VALIDATION: Startup configuration validation completed (non-blocking mode)");
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "❌ NOOR-ERROR: Startup configuration validation encountered unexpected error: {Message}", ex.Message);
        // Don't throw - allow application to continue starting
    }
}

// Make Program class accessible for testing
public partial class Program { }
