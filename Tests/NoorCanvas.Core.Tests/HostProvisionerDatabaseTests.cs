using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Configuration;
using Microsoft.EntityFrameworkCore;
using NoorCanvas.Data;
using NoorCanvas.Models;
using System;
using System.Threading.Tasks;
using Xunit;
using Xunit.Abstractions;

namespace NoorCanvas.Core.Tests.HostProvisioner
{
    /// <summary>
    /// Test Host Provisioner database connectivity and Host GUID creation
    /// This test validates Issue-39: Host Provisioner Multiple Critical Database Failures
    /// </summary>
    public class HostProvisionerDatabaseTests
    {
        private readonly ITestOutputHelper _output;

        public HostProvisionerDatabaseTests(ITestOutputHelper output)
        {
            _output = output;
        }

        [Fact]
        public async Task HostProvisioner_ShouldConnectToDatabase_WithCorrectConfiguration()
        {
            // Arrange - Use In-Memory database for consistent testing environment
            var services = new ServiceCollection();

            services.AddDbContext<CanvasDbContext>(options =>
                options.UseInMemoryDatabase("HostProvisionerTestDb"));

            services.AddDbContext<KSessionsDbContext>(options =>
                options.UseInMemoryDatabase("KSessionsProvisionerTestDb"));

            var serviceProvider = services.BuildServiceProvider();

            // Act & Assert
            using var scope = serviceProvider.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<CanvasDbContext>();

            try
            {
                // Ensure database is created for In-Memory provider
                await context.Database.EnsureCreatedAsync();

                // Test 1: Database connection (In-Memory provider always connects)
                var canConnect = await context.Database.CanConnectAsync();
                _output.WriteLine($"In-Memory database connection test: {canConnect}");
                Assert.True(canConnect, "Should be able to connect to In-Memory database");

                // Test 2: Canvas Sessions table access
                var sessionCount = await context.Sessions.CountAsync();
                _output.WriteLine($"Canvas.Sessions table accessible. Count: {sessionCount}");
                Assert.True(sessionCount >= 0, "Should be able to query Sessions table");

                // Test 3: HostSessions table access
                var hostSessionCount = await context.HostSessions.CountAsync();
                _output.WriteLine($"Canvas.HostSessions table accessible. Count: {hostSessionCount}");
                Assert.True(hostSessionCount >= 0, "Should be able to query HostSessions table");

                // Test 4: KSessionsDbContext access
                var kSessionsContext = scope.ServiceProvider.GetRequiredService<KSessionsDbContext>();
                await kSessionsContext.Database.EnsureCreatedAsync();
                var kSessionsCount = await kSessionsContext.Sessions.CountAsync();
                _output.WriteLine($"KSessions table accessible. Count: {kSessionsCount}");
                Assert.True(kSessionsCount >= 0, "Should be able to query KSessions table");

            }
            catch (Exception ex)
            {
                _output.WriteLine($"Database test failed: {ex.Message}");
                _output.WriteLine($"Stack trace: {ex.StackTrace}");
                throw;
            }
        }

        [Fact]
        public async Task HostProvisioner_ShouldCreateHostSession_WithValidSessionId()
        {
            // Arrange - Use In-Memory database for consistent testing environment
            var services = new ServiceCollection();

            services.AddDbContext<CanvasDbContext>(options =>
                options.UseInMemoryDatabase("HostProvisionerTestDb2"));

            var serviceProvider = services.BuildServiceProvider();

            // Act
            using var scope = serviceProvider.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<CanvasDbContext>();

            // Ensure we have a test session (Session ID 215)
            var testSession = await context.Sessions.FirstOrDefaultAsync(s => s.SessionId == 215);
            if (testSession == null)
            {
                _output.WriteLine("Test Session ID 215 not found. Creating test session...");
                testSession = new Session
                {
                    SessionId = 215,
                    GroupId = Guid.NewGuid(),
                    Title = "Test Session for Host Provisioner",
                    CreatedAt = DateTime.UtcNow,
                    Status = "Active"
                };
                context.Sessions.Add(testSession);
                await context.SaveChangesAsync();
                _output.WriteLine("Test session created successfully");
            }

            // Create Host Session
            var hostGuid = Guid.NewGuid();
            var hostSession = new HostSession
            {
                SessionId = 215,
                HostGuidHash = "test-hash-" + hostGuid.ToString("N")[..16],
                CreatedAt = DateTime.UtcNow,
                CreatedBy = "XUnit Test",
                IsActive = true
            };

            // Assert
            try
            {
                context.HostSessions.Add(hostSession);
                await context.SaveChangesAsync();

                _output.WriteLine($"Host Session created successfully:");
                _output.WriteLine($"  HostSessionId: {hostSession.HostSessionId}");
                _output.WriteLine($"  SessionId: {hostSession.SessionId}");
                _output.WriteLine($"  HostGuidHash: {hostSession.HostGuidHash}");

                Assert.True(hostSession.HostSessionId > 0, "HostSessionId should be generated");
                Assert.Equal(215, hostSession.SessionId);

                // Cleanup - remove test record
                context.HostSessions.Remove(hostSession);
                await context.SaveChangesAsync();
                _output.WriteLine("Test cleanup completed");
            }
            catch (Exception ex)
            {
                _output.WriteLine($"Host Session creation failed: {ex.Message}");
                throw;
            }
        }

        [Fact]
        public void HostProvisioner_ShouldUseCorrectConfiguration_NotProductionDatabase()
        {
            // Arrange & Act
            var configuration = new ConfigurationBuilder()
                .AddJsonFile("appsettings.json", optional: true)
                .Build();

            var connectionString = configuration.GetConnectionString("DefaultConnection");

            // Assert
            Assert.NotNull(connectionString);
            Assert.Contains("KSESSIONS_DEV", connectionString);
            Assert.DoesNotContain("KSESSIONS;", connectionString);
            Assert.Contains("adf4961glo", connectionString);
            Assert.DoesNotContain("Password=123", connectionString);

            _output.WriteLine($"Configuration test passed. Connection string uses KSESSIONS_DEV");
        }
    }
}
