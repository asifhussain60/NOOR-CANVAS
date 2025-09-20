using Microsoft.EntityFrameworkCore;
using NoorCanvas.Data;
using NoorCanvas.Hubs;
using NoorCanvas.Services;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

// Configure Serilog (environment-aware)
var loggerConfig = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext();

if (builder.Environment.IsDevelopment())
{
    // Development: include debug and verbose console output
    loggerConfig.WriteTo.Debug();
    loggerConfig.WriteTo.Console(outputTemplate:
        "[{Timestamp:HH:mm:ss} {Level:u3}] {SourceContext} {Message:lj} {Properties:j}{NewLine}{Exception}");
}
else
{
    // Production: rely on appsettings.Production.json for file sinks and use minimal console template
    loggerConfig.WriteTo.Console(outputTemplate:
        "[{Timestamp:yyyy-MM-dd HH:mm:ss} {Level:u3}] {Message:lj}{NewLine}{Exception}");
}

Log.Logger = loggerConfig.CreateLogger();
builder.Host.UseSerilog();

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
            "Server=(localdb)\\mssqllocaldb;Database=NoorCanvas;Trusted_Connection=true;MultipleActiveResultSets=true"));
    
    // Add Simplified Schema Context (for migration)
    builder.Services.AddDbContext<SimplifiedCanvasDbContext>(options =>
        options.UseSqlServer(builder.Configuration.GetConnectionString("SimplifiedConnection") ?? 
            builder.Configuration.GetConnectionString("DefaultConnection") ??
            "Server=(localdb)\\mssqllocaldb;Database=NoorCanvasSimplified;Trusted_Connection=true;MultipleActiveResultSets=true"));
}

// Add KSESSIONS Database Context (Read-only for Groups, Categories, Sessions)
builder.Services.AddDbContext<KSessionsDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("KSessionsDb") ??
        builder.Configuration.GetConnectionString("DefaultConnection") ??
        "Server=(localdb)\\mssqllocaldb;Database=KSESSIONS_DEV;Trusted_Connection=true;MultipleActiveResultSets=true")
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
builder.Services.AddScoped<HttpClient>(provider =>
{
    var factory = provider.GetRequiredService<IHttpClientFactory>();
    return factory.CreateClient("default");
});

// Add application services
builder.Services.AddScoped<IAnnotationService, AnnotationService>();
builder.Services.AddScoped<DialogService>();
builder.Services.AddScoped<DebugService>(); // NOOR_DEBUG: Enhanced debug service registration v2.0

// Schema Migration Services - Both legacy and simplified
builder.Services.AddScoped<SecureTokenService>(); // Legacy secure token service
builder.Services.AddScoped<SimplifiedTokenService>(); // New simplified token service  
builder.Services.AddScoped<SchemaTransitionAdapter>(); // Migration compatibility bridge

builder.Services.AddScoped<AssetDetectorService>(); // UC-L1: Asset detection and sharing service

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

// NOOR_DEBUG: Enhanced debug middleware for comprehensive request tracking
if (app.Environment.IsDevelopment())
{
    app.UseMiddleware<NoorCanvas.Middleware.DebugMiddleware>();
}

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
        var httpClientFactory = services.GetRequiredService<IHttpClientFactory>();
        var defaultClient = httpClientFactory.CreateClient("default");

        if (defaultClient.BaseAddress == null)
        {
            throw new InvalidOperationException("NOOR-FATAL: HttpClient 'default' BaseAddress not configured. This causes API authentication failures.");
        }

        logger.LogInformation("✅ NOOR-VALIDATION: HttpClient BaseAddress configured: {BaseAddress}", defaultClient.BaseAddress);

        // Database Connection Validation (using proper scope)
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

        logger.LogInformation("✅ NOOR-VALIDATION: All critical configurations validated successfully");
    }
    catch (Exception ex)
    {
        logger.LogCritical(ex, "❌ NOOR-FATAL: Startup configuration validation failed: {Message}", ex.Message);
        throw; // Fail fast on configuration issues
    }
}

// Make Program class accessible for testing
public partial class Program { }
