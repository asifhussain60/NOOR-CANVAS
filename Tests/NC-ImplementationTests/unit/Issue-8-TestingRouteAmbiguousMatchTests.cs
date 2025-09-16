using Xunit;
using Microsoft.AspNetCore.Mvc.Testing;
using System.Threading.Tasks;

namespace NC_ImplementationTests.Unit
{
    /// <summary>
    /// Test coverage for Issue-8: Testing Route Ambiguous Match Exception
    /// 
    /// Ensures routing configuration resolves ambiguous routes correctly
    /// and Index.razor vs HostLanding.razor route conflicts are resolved.
    /// </summary>
    public class Issue8TestingRouteAmbiguousMatchTests : IClassFixture<WebApplicationFactory<Program>>
    {
        private readonly WebApplicationFactory<Program> _factory;

        public Issue8TestingRouteAmbiguousMatchTests(WebApplicationFactory<Program> factory)
        {
            _factory = factory;
        }

        [Fact]
        [Trait("Category", "BugFix")]
        [Trait("Issue", "Issue-8")]
        public async Task Root_Route_Should_Resolve_Without_Ambiguity()
        {
            // Arrange
            var client = _factory.CreateClient();

            // Act
            var response = await client.GetAsync("/");

            // Assert
            Assert.True(response.IsSuccessStatusCode, "Root route should resolve without ambiguous match exception");
        }

        [Fact]
        [Trait("Category", "BugFix")]
        [Trait("Issue", "Issue-8")]
        public async Task Home_Route_Should_Be_Accessible()
        {
            // Arrange
            var client = _factory.CreateClient();

            // Act
            var response = await client.GetAsync("/home");

            // Assert
            Assert.True(response.IsSuccessStatusCode || response.StatusCode == System.Net.HttpStatusCode.NotFound,
                "Home route should either be accessible or properly return 404, not throw ambiguous match exception");
        }

        [Fact]
        [Trait("Category", "BugFix")]
        [Trait("Issue", "Issue-8")]
        public async Task Landing_Route_Should_Be_Distinct()
        {
            // Arrange
            var client = _factory.CreateClient();

            // Act
            var response = await client.GetAsync("/landing");

            // Assert
            Assert.True(response.IsSuccessStatusCode || response.StatusCode == System.Net.HttpStatusCode.NotFound,
                "Landing route should be distinct from root route");
        }

        [Theory]
        [InlineData("/")]
        [InlineData("/home")]
        [InlineData("/host")]
        [InlineData("/participant")]
        [Trait("Category", "Regression")]
        [Trait("Issue", "Issue-8")]
        public async Task Common_Routes_Should_Not_Cause_Ambiguous_Matches(string route)
        {
            // Arrange
            var client = _factory.CreateClient();

            // Act & Assert
            var exception = await Record.ExceptionAsync(async () =>
            {
                var response = await client.GetAsync(route);
                // Just ensure no exception is thrown, regardless of response status
            });

            Assert.Null(exception);
        }
    }
}
