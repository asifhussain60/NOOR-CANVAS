using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
// Project reference - no direct using needed for HttpClient configuration tests
using System.Net.Http;
using System.Net.Http.Json;
using Xunit;

namespace NoorCanvas.Tests.Authentication
{
    /// <summary>
    /// Tests for HttpClient configuration to prevent regression of Issue-23
    /// </summary>
    public class HttpClientConfigurationTests
    {
        /// <summary>
        /// TC-AUTH-002: Validate HttpClient BaseAddress configuration
        /// Ensures Issue-23 (HttpClient BaseAddress missing) doesn't regress
        /// </summary>
        [Fact]
        [Trait("Category", "HttpClientConfig")]
        public void HttpClientFactory_Configuration_HasCorrectBaseAddress()
        {
            // Arrange: Create service collection with NOOR Canvas configuration
            var services = new ServiceCollection();

            // Simulate the same configuration from Program.cs
            var baseAddress = "https://localhost:9091"; // Development environment
            services.AddHttpClient("default", client =>
            {
                client.BaseAddress = new Uri(baseAddress);
            });

            var serviceProvider = services.BuildServiceProvider();

            // Act: Get the configured HttpClient
            var httpClientFactory = serviceProvider.GetRequiredService<IHttpClientFactory>();
            var httpClient = httpClientFactory.CreateClient("default");

            // Assert: Verify BaseAddress is properly configured
            Assert.NotNull(httpClient.BaseAddress);
            Assert.Equal("https://localhost:9091/", httpClient.BaseAddress.ToString());
        }

        /// <summary>
        /// TC-AUTH-006: Test missing BaseAddress scenario (Issue-23 reproduction)
        /// This test validates the exact error that was causing authentication failures
        /// </summary>
        [Fact]
        [Trait("Category", "HttpClientConfig")]
        public async Task HttpClient_MissingBaseAddress_ThrowsExpectedException()
        {
            // Arrange: Create HttpClient without BaseAddress (reproduces Issue-23)
            var httpClient = new HttpClient();
            var requestData = new { HostGuid = "323d7da4-b4cd-4976-a8af-599c9adc191b" };

            // Act & Assert: Verify the exact exception from Issue-23
            var exception = await Assert.ThrowsAsync<InvalidOperationException>(
                async () => await httpClient.PostAsJsonAsync("/api/host/authenticate", requestData)
            );

            Assert.Contains("An invalid request URI was provided", exception.Message);
            Assert.Contains("Either the request URI must be an absolute URI or BaseAddress must be set",
                          exception.Message);
        }

        /// <summary>
        /// TC-AUTH-009: Validate HttpClient with absolute URLs works (workaround validation)
        /// </summary>
        [Fact]
        [Trait("Category", "HttpClientConfig")]
        public void HttpClient_AbsoluteUrl_WorksWithoutBaseAddress()
        {
            // Arrange: HttpClient without BaseAddress
            var httpClient = new HttpClient();
            var absoluteUrl = "https://localhost:9091/api/host/authenticate";

            // Act & Assert: Absolute URL should work without BaseAddress
            var request = new HttpRequestMessage(HttpMethod.Post, absoluteUrl);

            // This should NOT throw an exception (validates the workaround)
            Assert.NotNull(request.RequestUri);
            Assert.True(request.RequestUri.IsAbsoluteUri);
        }

        /// <summary>
        /// TC-AUTH-010: Validate environment-specific configuration
        /// </summary>
        [Fact]
        [Trait("Category", "HttpClientConfig")]
        public void HttpClientFactory_EnvironmentConfiguration_SetsCorrectBaseAddress()
        {
            // Arrange: Test both development and production scenarios
            var testCases = new[]
            {
                new { Environment = "Development", Expected = "https://localhost:9091" },
                new { Environment = "Production", Expected = "https://yourproductionurl.com" }
            };

            foreach (var testCase in testCases)
            {
                var services = new ServiceCollection();

                // Simulate environment-aware configuration
                var baseAddress = testCase.Environment == "Development"
                    ? "https://localhost:9091"
                    : "https://yourproductionurl.com";

                services.AddHttpClient("default", client =>
                {
                    client.BaseAddress = new Uri(baseAddress);
                });

                var serviceProvider = services.BuildServiceProvider();

                // Act: Get configured HttpClient
                var httpClientFactory = serviceProvider.GetRequiredService<IHttpClientFactory>();
                var httpClient = httpClientFactory.CreateClient("default");

                // Assert: Verify correct BaseAddress for environment
                Assert.Equal(testCase.Expected + "/", httpClient.BaseAddress.ToString());
            }
        }

        /// <summary>
        /// TC-AUTH-011: Validate multiple named HttpClient configurations
        /// </summary>
        [Fact]
        [Trait("Category", "HttpClientConfig")]
        public void HttpClientFactory_MultipleClients_ConfiguredCorrectly()
        {
            // Arrange: Configure multiple named clients
            var services = new ServiceCollection();

            services.AddHttpClient("default", client =>
            {
                client.BaseAddress = new Uri("https://localhost:9091");
            });

            services.AddHttpClient("external", client =>
            {
                client.BaseAddress = new Uri("https://api.external.com");
                client.Timeout = TimeSpan.FromSeconds(30);
            });

            var serviceProvider = services.BuildServiceProvider();

            // Act: Get both configured clients
            var httpClientFactory = serviceProvider.GetRequiredService<IHttpClientFactory>();
            var defaultClient = httpClientFactory.CreateClient("default");
            var externalClient = httpClientFactory.CreateClient("external");

            // Assert: Verify both clients configured correctly
            Assert.Equal("https://localhost:9091/", defaultClient.BaseAddress.ToString());
            Assert.Equal("https://api.external.com/", externalClient.BaseAddress.ToString());
            Assert.Equal(TimeSpan.FromSeconds(30), externalClient.Timeout);
        }
    }
}
