using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using NoorCanvas.Data;

namespace NoorCanvas.Core.Tests.Fixtures
{
    /// <summary>
    /// Custom WebApplicationFactory for testing that ensures proper test environment configuration
    /// Resolves Issue-23: Entity Framework dual provider configuration conflicts
    /// </summary>
    public class TestWebApplicationFactory<TStartup> : WebApplicationFactory<TStartup> where TStartup : class
    {
        protected override IWebHostBuilder? CreateWebHostBuilder()
        {
            // Create the web host builder with Testing environment set BEFORE any services are registered
            var builder = base.CreateWebHostBuilder();
            return builder?.UseEnvironment("Testing");
        }
        
        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            // Double-check environment is set
            builder.UseEnvironment("Testing");
            
            builder.ConfigureServices(services =>
            {
                // Remove any existing DbContext registrations to avoid conflicts
                var canvasDescriptor = services.SingleOrDefault(d => 
                    d.ServiceType == typeof(DbContextOptions<CanvasDbContext>));
                if (canvasDescriptor != null)
                {
                    services.Remove(canvasDescriptor);
                }
                
                // Also remove by implementation type to be thorough
                var canvasDbContextDescriptor = services.SingleOrDefault(d => 
                    d.ServiceType == typeof(CanvasDbContext));
                if (canvasDbContextDescriptor != null)
                {
                    services.Remove(canvasDbContextDescriptor);
                }
                
                var kSessionsDescriptor = services.SingleOrDefault(d => 
                    d.ServiceType == typeof(DbContextOptions<KSessionsDbContext>));
                if (kSessionsDescriptor != null)
                {
                    services.Remove(kSessionsDescriptor);
                }
                
                var kSessionsDbContextDescriptor = services.SingleOrDefault(d => 
                    d.ServiceType == typeof(KSessionsDbContext));
                if (kSessionsDbContextDescriptor != null)
                {
                    services.Remove(kSessionsDbContextDescriptor);
                }
                
                // Register In-Memory databases for testing
                services.AddDbContext<CanvasDbContext>(options =>
                {
                    options.UseInMemoryDatabase("NoorCanvasTestDb");
                    options.EnableSensitiveDataLogging();
                });
                
                services.AddDbContext<KSessionsDbContext>(options =>
                {
                    options.UseInMemoryDatabase("KSessionsTestDb");
                    options.EnableSensitiveDataLogging();
                    options.UseQueryTrackingBehavior(QueryTrackingBehavior.NoTracking);
                });
            });
        }

        protected override void Dispose(bool disposing)
        {
            // Skip database cleanup to avoid dual provider conflicts
            // In-Memory databases are automatically disposed with the service provider
            base.Dispose(disposing);
        }
    }
}
