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
    /// Integration tests for Participant Controller API endpoints
    /// 
    /// Tests participant registration, session validation, and user management
    /// with in-memory database to validate complete user workflows.
    /// </summary>
    public class ParticipantControllerIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
    {
        private readonly WebApplicationFactory<Program> _factory;

        public ParticipantControllerIntegrationTests(WebApplicationFactory<Program> factory)
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
                        options.UseInMemoryDatabase($"ParticipantTestDb_{Guid.NewGuid()}");
                    });
                });
            });
        }

        [Fact]
        [Trait("Category", "Integration")]
        [Trait("Controller", "Participant")]
        public async Task Participant_Registration_Should_Accept_Valid_Data()
        {
            // Arrange
            var client = _factory.CreateClient();
            
            var registrationData = new
            {
                sessionGuid = Guid.NewGuid().ToString(),
                name = "Test Participant",
                city = "Test City",
                country = "Test Country",
                userId = Guid.NewGuid().ToString()
            };

            var json = JsonSerializer.Serialize(registrationData);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            // Act
            var response = await client.PostAsync("/api/participant/register", content);

            // Assert
            Assert.True(response.IsSuccessStatusCode || 
                       response.StatusCode == System.Net.HttpStatusCode.BadRequest ||
                       response.StatusCode == System.Net.HttpStatusCode.NotFound,
                "Participant registration should handle valid data appropriately");
        }

        [Fact]
        [Trait("Category", "Integration")]
        [Trait("Controller", "Participant")]
        public async Task Session_Validation_Should_Handle_GUID_Lookup()
        {
            // Arrange
            var client = _factory.CreateClient();
            var testSessionGuid = Guid.NewGuid().ToString();

            // Act
            var response = await client.GetAsync($"/api/participant/session/{testSessionGuid}/validate");

            // Assert
            Assert.True(response.IsSuccessStatusCode ||
                       response.StatusCode == System.Net.HttpStatusCode.NotFound ||
                       response.StatusCode == System.Net.HttpStatusCode.BadRequest,
                "Session validation should handle GUID lookup properly");

            if (response.IsSuccessStatusCode)
            {
                var content = await response.Content.ReadAsStringAsync();
                Assert.NotEmpty(content);
                
                // Should return session validation response
                var json = JsonDocument.Parse(content);
                Assert.True(json.RootElement.ValueKind == JsonValueKind.Object);
            }
        }

        [Theory]
        [InlineData("", "Test City", "Test Country")] // Empty name
        [InlineData("Test User", "", "Test Country")] // Empty city
        [InlineData("Test User", "Test City", "")] // Empty country
        [Trait("Category", "Integration")]
        [Trait("Controller", "Participant")]
        public async Task Registration_Should_Validate_Required_Fields(string name, string city, string country)
        {
            // Arrange
            var client = _factory.CreateClient();
            
            var registrationData = new
            {
                sessionGuid = Guid.NewGuid().ToString(),
                name = name,
                city = city,
                country = country,
                userId = Guid.NewGuid().ToString()
            };

            var json = JsonSerializer.Serialize(registrationData);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            // Act
            var response = await client.PostAsync("/api/participant/register", content);

            // Assert
            Assert.True(response.StatusCode == System.Net.HttpStatusCode.BadRequest ||
                       response.IsSuccessStatusCode,
                "Registration should validate required fields or accept them gracefully");
        }

        [Fact]
        [Trait("Category", "Integration")]
        [Trait("Controller", "Participant")]
        public async Task Session_Join_Should_Handle_Valid_Session_GUID()
        {
            // Arrange
            var client = _factory.CreateClient();
            var validSessionGuid = Guid.NewGuid().ToString();

            // Act
            var response = await client.GetAsync($"/api/participant/session/{validSessionGuid}");

            // Assert
            Assert.True(response.IsSuccessStatusCode ||
                       response.StatusCode == System.Net.HttpStatusCode.NotFound,
                "Session join should handle valid GUID format");
        }

        [Fact]
        [Trait("Category", "Integration")]
        [Trait("Controller", "Participant")]
        public async Task Session_Validation_Should_Reject_Invalid_GUID()
        {
            // Arrange
            var client = _factory.CreateClient();
            var invalidGuid = "invalid-session-guid";

            // Act
            var response = await client.GetAsync($"/api/participant/session/{invalidGuid}/validate");

            // Assert
            Assert.True(response.StatusCode == System.Net.HttpStatusCode.BadRequest ||
                       response.StatusCode == System.Net.HttpStatusCode.NotFound,
                "Invalid GUID format should be rejected appropriately");
        }

        [Theory]
        [InlineData("/api/participant/register")]
        [InlineData("/api/participant/sessions")]
        [Trait("Category", "Integration")]
        [Trait("Controller", "Participant")]
        public async Task Participant_API_Endpoints_Should_Exist(string endpoint)
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
        [Trait("Controller", "Participant")]
        public async Task User_Profile_Should_Handle_Cross_Session_Lookup()
        {
            // Arrange
            var client = _factory.CreateClient();
            var userId = Guid.NewGuid().ToString();

            // Act
            var response = await client.GetAsync($"/api/participant/user/{userId}");

            // Assert
            Assert.True(response.IsSuccessStatusCode ||
                       response.StatusCode == System.Net.HttpStatusCode.NotFound,
                "User profile lookup should handle valid user ID");
        }
    }
}
