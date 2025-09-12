using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace NC_ImplementationTests.unit
{
    /// <summary>
    /// Test case for Issue 22: _Host endpoint missing - application startup failure
    /// Verifies that the _Host Razor page is accessible and the application starts without InvalidOperationException
    /// </summary>
    public class Issue_22_HostEndpointMissingTests : IClassFixture<WebApplicationFactory<Program>>
    {
        private readonly WebApplicationFactory<Program> _factory;

        public Issue_22_HostEndpointMissingTests(WebApplicationFactory<Program> factory)
        {
            _factory = factory;
        }

        [Fact]
        public async Task Application_Starts_Without_InvalidOperationException()
        {
            // Arrange & Act: Create client (this will start the application)
            var client = _factory.CreateClient();
            
            // Assert: If we reach this point, the application started successfully without throwing
            // InvalidOperationException about missing _Host endpoint
            Assert.NotNull(client);
        }

        [Fact]
        public async Task HostEndpoint_IsAccessible()
        {
            // Arrange
            var client = _factory.CreateClient();

            // Act
            var response = await client.GetAsync("/");

            // Assert
            Assert.True(response.IsSuccessStatusCode, 
                $"Expected successful response, got {response.StatusCode}: {response.ReasonPhrase}");
            
            var content = await response.Content.ReadAsStringAsync();
            Assert.Contains("NoorCanvas", content);
            Assert.Contains("<!DOCTYPE html>", content);
        }

        [Fact]
        public async Task HostEndpoint_ContainsBlazorServerConfiguration()
        {
            // Arrange
            var client = _factory.CreateClient();

            // Act
            var response = await client.GetAsync("/");
            var content = await response.Content.ReadAsStringAsync();

            // Assert: Check for Blazor Server specific elements
            Assert.Contains("_framework/blazor.server.js", content);
            Assert.Contains("ServerPrerendered", content);
            Assert.Contains("blazor-error-ui", content);
        }
    }
}
