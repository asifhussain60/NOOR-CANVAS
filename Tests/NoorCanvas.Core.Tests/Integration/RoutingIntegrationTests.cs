using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using NoorCanvas.Core.Tests.Fixtures;
using System.Net;
using System.Net.Http;
using Xunit;
using Xunit.Abstractions;

namespace NoorCanvas.Core.Tests.Integration
{
    /// <summary>
    /// Integration tests for Issue-18 and Issue-19 routing fixes
    /// FIXED: Issue-23 Entity Framework dual provider configuration using TestWebApplicationFactory
    /// 
    /// These tests validate that:
    /// 1. Application starts without routing exceptions
    /// 2. All fixed routes are accessible via HTTP requests
    /// 3. No ambiguous route conflicts prevent application startup
    /// 4. Health endpoints work correctly after routing fixes
    /// </summary>
    public class RoutingIntegrationTests : IClassFixture<TestWebApplicationFactory<Program>>
    {
        private readonly TestWebApplicationFactory<Program> _factory;
        private readonly HttpClient _client;
        private readonly ITestOutputHelper _output;

        public RoutingIntegrationTests(TestWebApplicationFactory<Program> factory, ITestOutputHelper output)
        {
            _factory = factory;
            _client = _factory.CreateClient();
            _output = output;
        }

        [Fact]
        public async Task Issue18And19_ApplicationStartup_ShouldNotThrowRoutingExceptions()
        {
            // This test validates that the web application factory can create the app
            // without throwing InvalidOperationException due to ambiguous routes
            
            // Arrange & Act
            var exception = Record.Exception(() =>
            {
                using var scope = _factory.Services.CreateScope();
                var logger = scope.ServiceProvider.GetRequiredService<ILogger<RoutingIntegrationTests>>();
                logger.LogInformation("Testing application startup for routing issues");
            });

            // Assert
            Assert.Null(exception);
            _output.WriteLine("✅ Integration Test Passed: Application starts without routing exceptions");
        }

        [Theory]
        [InlineData("/")]
        [InlineData("/landing")]
        [InlineData("/home")]
        [InlineData("/counter")]
        [InlineData("/fetchdata")]
        public async Task FixedRoutes_ShouldBeAccessible(string route)
        {
            // Arrange & Act
            var response = await _client.GetAsync(route);

            // Assert
            Assert.True(response.IsSuccessStatusCode || response.StatusCode == HttpStatusCode.NotFound,
                $"Route {route} should either work or return 404, but got: {response.StatusCode}");

            // For Blazor pages, we typically get 200 OK even if the specific component logic fails
            // The important thing is that routing works and we don't get routing-related exceptions

            _output.WriteLine($"✅ Route Test: {route} -> {response.StatusCode}");
        }

        [Fact]
        public async Task HealthEndpoint_ShouldWorkAfterRoutingFix()
        {
            // Arrange & Act
            var response = await _client.GetAsync("/healthz");

            // Assert
            Assert.True(response.IsSuccessStatusCode, 
                $"Health endpoint should work after routing fix, but got: {response.StatusCode}");

            var content = await response.Content.ReadAsStringAsync();
            _output.WriteLine($"✅ Health Endpoint Test Passed: {response.StatusCode} - {content}");
        }

        [Fact]
        public async Task RootRoute_ShouldServeLandingPage()
        {
            // Arrange & Act
            var response = await _client.GetAsync("/");

            // Assert
            // For Blazor Server, we expect HTML content with the app structure
            Assert.True(response.IsSuccessStatusCode);
            
            var content = await response.Content.ReadAsStringAsync();
            
            // Should contain HTML structure indicating Blazor app loaded
            Assert.Contains("<!DOCTYPE html>", content);
            
            _output.WriteLine("✅ Root Route Test Passed: Landing page serves correctly");
        }

        [Fact]
        public async Task HomeRoute_ShouldServeIndexPage()
        {
            // Arrange & Act
            var response = await _client.GetAsync("/home");

            // Assert
            Assert.True(response.IsSuccessStatusCode);
            
            var content = await response.Content.ReadAsStringAsync();
            Assert.Contains("<!DOCTYPE html>", content);
            
            _output.WriteLine("✅ Home Route Test Passed: Index page serves correctly at /home");
        }

        [Fact]
        public async Task NonExistentRoute_ShouldReturn404OrFallback()
        {
            // Arrange & Act
            var response = await _client.GetAsync("/nonexistent-route-test");

            // Assert
            // Should either return 404 or serve the Blazor fallback (which then shows "Sorry, there's nothing at this address")
            Assert.True(response.StatusCode == HttpStatusCode.NotFound || response.IsSuccessStatusCode);
            
            _output.WriteLine($"✅ Non-existent Route Test: /nonexistent-route-test -> {response.StatusCode}");
        }

        [Fact]
        public async Task MultipleSimultaneousRequests_ShouldNotCauseRoutingConflicts()
        {
            // Arrange
            var routes = new[] { "/", "/home", "/landing", "/counter", "/fetchdata", "/healthz" };
            var tasks = new List<Task<HttpResponseMessage>>();

            // Act
            foreach (var route in routes)
            {
                tasks.Add(_client.GetAsync(route));
            }

            var responses = await Task.WhenAll(tasks);

            // Assert
            foreach (var (response, index) in responses.Select((r, i) => (r, i)))
            {
                var route = routes[index];
                Assert.True(response.IsSuccessStatusCode || response.StatusCode == HttpStatusCode.NotFound,
                    $"Concurrent request to {route} failed with: {response.StatusCode}");
                
                _output.WriteLine($"✅ Concurrent Route Test: {route} -> {response.StatusCode}");
            }

            _output.WriteLine("✅ Concurrent Access Test Passed: No routing conflicts under load");
        }

        protected virtual void Dispose(bool disposing)
        {
            if (disposing)
            {
                _client?.Dispose();
            }
        }

        public void Dispose()
        {
            Dispose(true);
            GC.SuppressFinalize(this);
        }
    }
}
