using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using NoorCanvas.Data;

namespace NC.ImplementationTests.Fixtures
{
    /// <summary>
    /// Custom WebApplicationFactory for testing that ensures proper test environment configuration
    /// Resolves Issue-23: Entity Framework dual provider configuration conflicts
    /// </summary>
    public class TestWebApplicationFactory<TStartup> : WebApplicationFactory<TStartup> where TStartup : class
    {
        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            // Set environment to Testing BEFORE application configuration runs
            builder.UseEnvironment("Testing");

            builder.ConfigureServices(services =>
            {
                // Remove any existing DbContext registrations to avoid conflicts
                var canvasDescriptor = services.SingleOrDefault(d => d.ServiceType == typeof(DbContextOptions<CanvasDbContext>));
                if (canvasDescriptor != null)
                {
                    services.Remove(canvasDescriptor);
                }

                var kSessionsDescriptor = services.SingleOrDefault(d => d.ServiceType == typeof(DbContextOptions<KSessionsDbContext>));
                if (kSessionsDescriptor != null)
                {
                    services.Remove(kSessionsDescriptor);
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
            if (disposing)
            {
                // Cleanup test databases
                using (var scope = Services.CreateScope())
                {
                    var canvasContext = scope.ServiceProvider.GetService<CanvasDbContext>();
                    canvasContext?.Database.EnsureDeleted();

                    var kSessionsContext = scope.ServiceProvider.GetService<KSessionsDbContext>();
                    kSessionsContext?.Database.EnsureDeleted();
                }
            }

            base.Dispose(disposing);
        }
    }
}
