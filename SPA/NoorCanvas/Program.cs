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
builder.Services.AddControllers();

// Add Entity Framework - Conditional based on environment
if (builder.Environment.EnvironmentName == "Testing")
{
    // Use In-Memory database for testing
    builder.Services.AddDbContext<CanvasDbContext>(options =>
        options.UseInMemoryDatabase("NoorCanvasTestDb"));
}
else
{
    // Use SQL Server for development and production
    builder.Services.AddDbContext<CanvasDbContext>(options =>
        options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection") ?? 
            "Server=(localdb)\\mssqllocaldb;Database=NoorCanvas;Trusted_Connection=true;MultipleActiveResultSets=true"));
}

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

// Add HttpClient service for dependency injection
builder.Services.AddHttpClient();

// Add application services
builder.Services.AddScoped<IAnnotationService, AnnotationService>();
builder.Services.AddScoped<DialogService>();

var app = builder.Build();

// Configure the HTTP request pipeline
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Error");
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();

app.UseRouting();

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

Log.Information("NOOR-STARTUP: NOOR Canvas Phase 1 application starting on https://localhost:9091 and http://localhost:9090");

try
{
    app.Run("https://localhost:9091");
}
catch (Exception ex)
{
    Log.Fatal(ex, "NOOR-FATAL: Application terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}

// Make Program class accessible for testing
public partial class Program { }
