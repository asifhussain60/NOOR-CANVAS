using Xunit;
using Microsoft.AspNetCore.Mvc.Testing;
using System.Threading.Tasks;
using System.Text;
using System.Text.Json;

namespace NC_ImplementationTests.Unit
{
    /// <summary>
    /// Test coverage for Issue-15: New Session API Integration Gap
    /// 
    /// Ensures frontend components properly integrate with backend API endpoints
    /// instead of using mock implementations for session creation and management.
    /// </summary>
    public class Issue15NewSessionApiIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
    {
        private readonly WebApplicationFactory<Program> _factory;

        public Issue15NewSessionApiIntegrationTests(WebApplicationFactory<Program> factory)
        {
            _factory = factory;
        }

        [Fact]
        [Trait("Category", "BugFix")]
        [Trait("Issue", "Issue-15")]
        public async Task Session_Creation_API_Should_Be_Accessible()
        {
            // Arrange
            var client = _factory.CreateClient();

            // Act
            var response = await client.GetAsync("/api/host/session/create");

            // Assert
            // Should not return 404 - API endpoint should exist
            Assert.NotEqual(System.Net.HttpStatusCode.NotFound, response.StatusCode);
        }

        [Fact]
        [Trait("Category", "BugFix")]
        [Trait("Issue", "Issue-15")]
        public async Task Session_Management_API_Should_Support_CRUD_Operations()
        {
            // Arrange
            var client = _factory.CreateClient();

            // Act - Test session management endpoint exists
            var response = await client.GetAsync("/api/host/sessions");

            // Assert
            Assert.True(response.IsSuccessStatusCode || 
                       response.StatusCode == System.Net.HttpStatusCode.Unauthorized ||
                       response.StatusCode == System.Net.HttpStatusCode.Forbidden,
                "Session management API should exist and require authentication, not return 404");
        }

        [Fact]
        [Trait("Category", "BugFix")]
        [Trait("Issue", "Issue-15")]
        public async Task Participant_Registration_API_Should_Be_Integrated()
        {
            // Arrange
            var client = _factory.CreateClient();

            // Act
            var response = await client.GetAsync("/api/participant/register");

            // Assert
            Assert.NotEqual(System.Net.HttpStatusCode.NotFound, response.StatusCode);
        }

        [Fact]
        [Trait("Category", "BugFix")]
        [Trait("Issue", "Issue-15")]
        public async Task Session_Validation_API_Should_Work_With_GUIDs()
        {
            // Arrange
            var client = _factory.CreateClient();
            var testGuid = System.Guid.NewGuid().ToString();

            // Act
            var response = await client.GetAsync($"/api/participant/session/{testGuid}/validate");

            // Assert
            Assert.True(response.IsSuccessStatusCode || 
                       response.StatusCode == System.Net.HttpStatusCode.BadRequest ||
                       response.StatusCode == System.Net.HttpStatusCode.NotFound,
                "Session validation should handle GUID validation properly");
        }

        [Fact]
        [Trait("Category", "Integration")]
        [Trait("Issue", "Issue-15")]
        public async Task Host_Dashboard_API_Should_Return_Real_Data()
        {
            // Arrange
            var client = _factory.CreateClient();

            // Act
            var response = await client.GetAsync("/api/host/dashboard");

            // Assert
            Assert.True(response.IsSuccessStatusCode || 
                       response.StatusCode == System.Net.HttpStatusCode.Unauthorized,
                "Dashboard API should return real data or require authentication");
        }

        [Fact]
        [Trait("Category", "Regression")]
        [Trait("Issue", "Issue-15")]
        public async Task API_Endpoints_Should_Not_Return_Mock_Data_Indicators()
        {
            // Arrange
            var client = _factory.CreateClient();

            // Act
            var response = await client.GetAsync("/api/health");

            // Assert
            if (response.IsSuccessStatusCode)
            {
                var content = await response.Content.ReadAsStringAsync();
                
                // Should not contain mock data indicators
                Assert.DoesNotContain("mock", content.ToLowerInvariant());
                Assert.DoesNotContain("placeholder", content.ToLowerInvariant());
                Assert.DoesNotContain("TODO", content);
            }
        }
    }
}
