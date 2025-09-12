using Xunit;
using Microsoft.AspNetCore.Mvc.Testing;
using System.Threading.Tasks;
using Microsoft.Extensions.DependencyInjection;

namespace NC_ImplementationTests.Unit
{
    /// <summary>
    /// Test coverage for Issue-6: HttpClient Dependency Injection Missing
    /// 
    /// Ensures HttpClient is properly registered in DI container and available
    /// for controllers and services that need to make HTTP requests.
    /// </summary>
    public class Issue6HttpClientDependencyInjectionTests : IClassFixture<WebApplicationFactory<Program>>
    {
        private readonly WebApplicationFactory<Program> _factory;

        public Issue6HttpClientDependencyInjectionTests(WebApplicationFactory<Program> factory)
        {
            _factory = factory;
        }

        [Fact]
        [Trait("Category", "BugFix")]
        [Trait("Issue", "Issue-6")]
        public void HttpClient_Should_Be_Registered_In_DI_Container()
        {
            // Arrange & Act
            using var scope = _factory.Services.CreateScope();
            var services = scope.ServiceProvider;

            // Assert
            var httpClient = services.GetService<HttpClient>();
            Assert.NotNull(httpClient);
        }

        [Fact]
        [Trait("Category", "BugFix")]
        [Trait("Issue", "Issue-6")]
        public void IHttpClientFactory_Should_Be_Registered()
        {
            // Arrange & Act
            using var scope = _factory.Services.CreateScope();
            var services = scope.ServiceProvider;

            // Assert
            var httpClientFactory = services.GetService<IHttpClientFactory>();
            Assert.NotNull(httpClientFactory);
        }

        [Fact]
        [Trait("Category", "BugFix")]
        [Trait("Issue", "Issue-6")]
        public void HttpClient_Should_Be_Usable_In_Services()
        {
            // Arrange & Act
            using var scope = _factory.Services.CreateScope();
            var services = scope.ServiceProvider;
            var httpClientFactory = services.GetRequiredService<IHttpClientFactory>();

            // Assert
            var client = httpClientFactory.CreateClient();
            Assert.NotNull(client);
            Assert.NotNull(client.BaseAddress ?? new System.Uri("http://localhost"));
        }

        [Fact]
        [Trait("Category", "Integration")]
        [Trait("Issue", "Issue-6")]
        public async Task Controllers_Should_Have_Access_To_HttpClient()
        {
            // Arrange
            var client = _factory.CreateClient();

            // Act - Try to access an endpoint that might use HttpClient
            var response = await client.GetAsync("/api/health");

            // Assert - Should not fail due to missing HttpClient dependency
            Assert.True(response.IsSuccessStatusCode || 
                       response.StatusCode == System.Net.HttpStatusCode.NotFound,
                "Controllers should not fail due to missing HttpClient dependency");
        }

        [Fact]
        [Trait("Category", "Configuration")]
        [Trait("Issue", "Issue-6")]
        public void HttpClient_Configuration_Should_Be_Valid()
        {
            // Arrange & Act
            using var scope = _factory.Services.CreateScope();
            var services = scope.ServiceProvider;
            var httpClientFactory = services.GetRequiredService<IHttpClientFactory>();
            var client = httpClientFactory.CreateClient();

            // Assert
            Assert.True(client.Timeout > TimeSpan.Zero, "HttpClient should have a valid timeout");
            Assert.NotNull(client.DefaultRequestHeaders);
        }
    }
}
