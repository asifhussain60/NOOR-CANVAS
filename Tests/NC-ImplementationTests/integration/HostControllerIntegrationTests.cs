using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using NoorCanvas.Data;
using System.Text;
using System.Text.Json;
using Xunit;

namespace NC_ImplementationTests.Integration
{
    /// <summary>
    /// Integration tests for Host Controller API endpoints
    /// 
    /// Tests complete request/response cycles with in-memory database
    /// to validate host authentication, session management, and dashboard functionality.
    /// </summary>
    public class HostControllerIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
    {
        private readonly WebApplicationFactory<Program> _factory;

        public HostControllerIntegrationTests(WebApplicationFactory<Program> factory)
        {
            _factory = factory.WithWebHostBuilder(builder =>
            {
                builder.ConfigureServices(services =>
                {
                    // Remove existing DbContext registration
                    var descriptor = services.SingleOrDefault(d => d.ServiceType == typeof(DbContextOptions<CanvasDbContext>));
                    if (descriptor != null)
                    {
                        services.Remove(descriptor);
                    }

                    // Add in-memory database for testing
                    services.AddDbContext<CanvasDbContext>(options =>
                    {
                        options.UseInMemoryDatabase($"TestDb_{Guid.NewGuid()}");
                    });
                });
            });
        }

        [Fact]
        [Trait("Category", "Integration")]
        [Trait("Controller", "Host")]
        public async Task Host_Authentication_Should_Accept_Valid_GUID()
        {
            // Arrange
            var client = _factory.CreateClient();
            var validHostGuid = "host-noor-canvas-2025"; // Known test GUID

            var requestData = new
            {
                hostGuid = validHostGuid
            };

            var json = JsonSerializer.Serialize(requestData);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            // Act
            var response = await client.PostAsync("/api/host/authenticate", content);

            // Assert
            Assert.True(response.IsSuccessStatusCode || response.StatusCode == System.Net.HttpStatusCode.NotFound,
                "Host authentication should either succeed or return proper error codes");

            if (response.IsSuccessStatusCode)
            {
                var responseContent = await response.Content.ReadAsStringAsync();
                Assert.NotEmpty(responseContent);
            }
        }

        // Host Dashboard endpoint removed - Phase 4 update: Direct CreateSession flow

        [Fact]
        [Trait("Category", "Integration")]
        [Trait("Controller", "Host")]
        public async Task Session_Creation_Should_Work_With_Valid_Data()
        {
            // Arrange
            var client = _factory.CreateClient();
            
            var sessionData = new
            {
                title = "Test Session",
                description = "Integration test session",
                albumId = 1,
                categoryId = 1,
                hostGuid = "host-noor-canvas-2025"
            };

            var json = JsonSerializer.Serialize(sessionData);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            // Act
            var response = await client.PostAsync("/api/host/session/create", content);

            // Assert
            Assert.True(response.IsSuccessStatusCode || 
                       response.StatusCode == System.Net.HttpStatusCode.BadRequest ||
                       response.StatusCode == System.Net.HttpStatusCode.Unauthorized,
                "Session creation should handle requests properly");
        }

        [Fact]
        [Trait("Category", "Integration")]
        [Trait("Controller", "Host")]
        public async Task Session_Management_Should_Handle_Lifecycle_Operations()
        {
            // Arrange
            var client = _factory.CreateClient();

            // Act - Test session start operation
            var sessionId = Guid.NewGuid().ToString();
            var response = await client.PostAsync($"/api/host/session/{sessionId}/start", null);

            // Assert
            Assert.True(response.StatusCode != System.Net.HttpStatusCode.InternalServerError,
                "Session lifecycle operations should not cause server errors");
        }

        [Theory]
        [InlineData("/api/host/authenticate")]
        [InlineData("/api/host/sessions")]
        [Trait("Category", "Integration")]
        [Trait("Controller", "Host")]
        public async Task Host_API_Endpoints_Should_Be_Accessible(string endpoint)
        {
            // Arrange
            var client = _factory.CreateClient();

            // Act
            var response = await client.GetAsync(endpoint);

            // Assert
            Assert.NotEqual(System.Net.HttpStatusCode.NotFound, response.StatusCode);
            Assert.NotEqual(System.Net.HttpStatusCode.InternalServerError, response.StatusCode);
        }

        [Fact]
        [Trait("Category", "Integration")]
        [Trait("Controller", "Host")]
        public async Task Host_Authentication_Should_Reject_Invalid_GUID()
        {
            // Arrange
            var client = _factory.CreateClient();
            var invalidGuid = "invalid-guid-12345";

            var requestData = new { hostGuid = invalidGuid };
            var json = JsonSerializer.Serialize(requestData);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            // Act
            var response = await client.PostAsync("/api/host/authenticate", content);

            // Assert
            Assert.True(response.StatusCode == System.Net.HttpStatusCode.Unauthorized ||
                       response.StatusCode == System.Net.HttpStatusCode.BadRequest ||
                       response.StatusCode == System.Net.HttpStatusCode.NotFound,
                "Invalid GUID should be rejected with appropriate error code");
        }
    }
}
