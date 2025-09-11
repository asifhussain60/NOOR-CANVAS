using Microsoft.EntityFrameworkCore;
using NoorCanvas.Data;
using NoorCanvas.Hubs;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

// Configure Serilog
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .WriteTo.File("logs/noor-canvas-.txt", 
        rollingInterval: RollingInterval.Day,
        retainedFileCountLimit: 7)
    .CreateLogger();

builder.Host.UseSerilog();

// Add services to the container
builder.Services.AddRazorPages();
builder.Services.AddServerSideBlazor();
builder.Services.AddControllers();

// Add Entity Framework
builder.Services.AddDbContext<CanvasDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection") ?? 
        "Server=(localdb)\\mssqllocaldb;Database=NoorCanvas;Trusted_Connection=true;MultipleActiveResultSets=true"));

// Add SignalR
builder.Services.AddSignalR(options =>
{
    options.EnableDetailedErrors = builder.Environment.IsDevelopment();
    options.HandshakeTimeout = TimeSpan.FromSeconds(15);
    options.KeepAliveInterval = TimeSpan.FromSeconds(15);
    options.ClientTimeoutInterval = TimeSpan.FromSeconds(30);
});

// Add CORS for development
builder.Services.AddCors(options =>
{
    options.AddPolicy("DevelopmentCorsPolicy", policy =>
    {
        policy.WithOrigins("https://localhost:9090")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

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
app.MapBlazorHub();
app.MapFallbackToPage("/_Host");
app.MapControllers();

// Map SignalR Hubs
app.MapHub<SessionHub>("/hub/session");
app.MapHub<QAHub>("/hub/qa");

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
        context.Response.Headers.Add("Content-Type", "text/event-stream");
        context.Response.Headers.Add("Cache-Control", "no-cache");
        context.Response.Headers.Add("Connection", "keep-alive");
        
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

Log.Information("NOOR-STARTUP: NOOR Canvas Phase 1 application starting on http://localhost:9090");

try
{
    app.Run("http://localhost:9090");
}
catch (Exception ex)
{
    Log.Fatal(ex, "NOOR-FATAL: Application terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}
