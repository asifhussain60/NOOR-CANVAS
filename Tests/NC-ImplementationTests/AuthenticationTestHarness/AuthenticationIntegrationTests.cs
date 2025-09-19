using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
// Project reference handles NoorCanvas namespace automatically
using System.Net;
using System.Net.Http;
using System.Net.Http.Json;
using System.Text.Json;
using Xunit;

namespace NoorCanvas.Tests.Authentication
{
    /// <summary>
    /// Integration tests for authentication API endpoints
    /// Tests the complete authentication workflow with real HTTP calls
    /// </summary>
    public class AuthenticationIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
    {
        private readonly WebApplicationFactory<Program> _factory;
        private readonly HttpClient _client;

        public AuthenticationIntegrationTests(WebApplicationFactory<Program> factory)
        {
            _factory = factory;
            _client = _factory.CreateClient();
        }

        /// <summary>
        /// TC-AUTH-001: Full authentication workflow test
        /// Tests the complete flow from HostLanding.razor to successful authentication
        /// </summary>
        [Fact]
        [Trait("Category", "Integration")]
        public async Task Authentication_ValidHostGuid_ReturnsSuccess()
        {
            // Arrange: Valid host GUID from test data
            var hostGuid = "323d7da4-b4cd-4976-a8af-599c9adc191b";
            var requestData = new { HostGuid = hostGuid };

            // Act: Send authentication request
            var response = await _client.PostAsJsonAsync("/api/host/authenticate", requestData);

            // Assert: Should return success (200 OK or 302 redirect)
            Assert.True(response.IsSuccessStatusCode || response.StatusCode == HttpStatusCode.Redirect,
                       $"Expected success or redirect, got {response.StatusCode}");

            // Verify response content if JSON
            if (response.Content.Headers.ContentType?.MediaType == "application/json")
            {
                var content = await response.Content.ReadAsStringAsync();
                var responseData = JsonSerializer.Deserialize<JsonElement>(content);

                // Should contain success indicator
                Assert.True(responseData.TryGetProperty("success", out var successProperty) &&
                           successProperty.GetBoolean());
            }
        }

        /// <summary>
        /// TC-AUTH-003: Test authentication with invalid GUID
        /// </summary>
        [Fact]
        [Trait("Category", "Integration")]
        public async Task Authentication_InvalidHostGuid_ReturnsError()
        {
            // Arrange: Invalid host GUID
            var invalidGuid = "invalid-guid-format";
            var requestData = new { HostGuid = invalidGuid };

            // Act: Send authentication request
            var response = await _client.PostAsJsonAsync("/api/host/authenticate", requestData);

            // Assert: Should return error status
            Assert.False(response.IsSuccessStatusCode,
                        $"Expected error status for invalid GUID, got {response.StatusCode}");
        }

        /// <summary>
        /// TC-AUTH-004: Test authentication with empty GUID
        /// </summary>
        [Fact]
        [Trait("Category", "Integration")]
        public async Task Authentication_EmptyHostGuid_ReturnsError()
        {
            // Arrange: Empty host GUID
            var requestData = new { HostGuid = "" };

            // Act: Send authentication request
            var response = await _client.PostAsJsonAsync("/api/host/authenticate", requestData);

            // Assert: Should return error status (400 Bad Request)
            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        }

        /// <summary>
        /// TC-AUTH-007: Test authentication endpoint availability
        /// Ensures the endpoint exists and is routable
        /// </summary>
        [Fact]
        [Trait("Category", "Integration")]
        public async Task Authentication_EndpointExists_IsRoutable()
        {
            // Arrange: Valid request structure
            var requestData = new { HostGuid = "323d7da4-b4cd-4976-a8af-599c9adc191b" };

            // Act: Send request to authentication endpoint
            var response = await _client.PostAsJsonAsync("/api/host/authenticate", requestData);

            // Assert: Should not return 404 Not Found
            Assert.NotEqual(HttpStatusCode.NotFound, response.StatusCode);

            // Should not return 405 Method Not Allowed  
            Assert.NotEqual(HttpStatusCode.MethodNotAllowed, response.StatusCode);
        }

        /// <summary>
        /// TC-AUTH-008: Test CORS configuration for authentication API
        /// </summary>
        [Fact]
        [Trait("Category", "Integration")]
        public async Task Authentication_CORS_AllowsOrigin()
        {
            // Arrange: CORS preflight request
            var request = new HttpRequestMessage(HttpMethod.Options, "/api/host/authenticate");
            request.Headers.Add("Origin", "https://localhost:9091");
            request.Headers.Add("Access-Control-Request-Method", "POST");
            request.Headers.Add("Access-Control-Request-Headers", "Content-Type");

            // Act: Send CORS preflight
            var response = await _client.SendAsync(request);

            // Assert: Should allow the request
            Assert.True(response.IsSuccessStatusCode ||
                       response.Headers.Contains("Access-Control-Allow-Origin"),
                       "CORS should be configured to allow authentication requests");
        }

        /// <summary>
        /// TC-AUTH-012: Test error scenarios comprehensive coverage
        /// </summary>
        [Theory]
        [Trait("Category", "Integration")]
        [InlineData(null, "Null GUID")]
        [InlineData("", "Empty GUID")]
        [InlineData("   ", "Whitespace GUID")]
        [InlineData("not-a-guid", "Invalid format")]
        [InlineData("00000000-0000-0000-0000-000000000000", "Empty Guid")]
        public async Task Authentication_ErrorScenarios_HandledCorrectly(string? hostGuid, string scenario)
        {
            // Arrange: Various error scenarios
            var requestData = new { HostGuid = hostGuid };

            // Act: Send authentication request
            var response = await _client.PostAsJsonAsync("/api/host/authenticate", requestData);

            // Assert: Should handle errors gracefully (not 500 Internal Server Error)
            Assert.NotEqual(HttpStatusCode.InternalServerError, response.StatusCode);

            // Should return appropriate client error status
            Assert.True((int)response.StatusCode >= 400 && (int)response.StatusCode < 500,
                       $"Scenario '{scenario}' should return client error status, got {response.StatusCode}");
        }

        // WebApplicationFactory automatically handles HttpClient disposal
    }
}
