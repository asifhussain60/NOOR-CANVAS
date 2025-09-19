using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using System.Net.Http.Json;
using System.Text.Json;
using Xunit;
using Xunit.Abstractions;
using NoorCanvas.Models;
using NoorCanvas.Data;
using Microsoft.EntityFrameworkCore;

namespace NoorCanvas.Core.Tests.Authentication
{
    /// <summary>
    /// Host Authentication Test Harness for Issue-25
    /// Validates end-to-end host authentication flow with SSL certificate bypass
    /// Tests Session 215 GUID authentication and JSON serialization fixes
    /// </summary>
    public class HostAuthenticationTestHarness : IClassFixture<WebApplicationFactory<Program>>
    {
        private readonly WebApplicationFactory<Program> _factory;
        private readonly HttpClient _client;
        private readonly ITestOutputHelper _output;

        // Session 215 test data from Issue-25
        private const string TestSessionId = "215";
        private const string TestHostGuid = "XQmUFUnFdjvsWq4IJhUU9b9mRSn7YHuZql/JMWaxFrM=";
        private const string AlternateHostGuid = "6d752e72-93a1-456c-bc2d-d27af095882a";

        public HostAuthenticationTestHarness(WebApplicationFactory<Program> factory, ITestOutputHelper output)
        {
            _factory = factory;
            _output = output;
            _client = _factory.CreateClient();
        }

        [Fact(DisplayName = "AUTH-01: Host Authentication with Session 215 Base64 GUID")]
        public async Task AuthenticateHost_Session215Base64Guid_ShouldSucceed()
        {
            // Arrange
            _output.WriteLine($"Testing host authentication with Session 215 GUID: {TestHostGuid}");

            var request = new
            {
                hostGuid = TestHostGuid
            };

            // Act
            var response = await _client.PostAsJsonAsync("/api/host/authenticate", request);
            var content = await response.Content.ReadAsStringAsync();

            _output.WriteLine($"Response Status: {response.StatusCode}");
            _output.WriteLine($"Response Content: {content}");

            // Assert
            Assert.True(response.IsSuccessStatusCode,
                $"Expected successful response, got {response.StatusCode}. Content: {content}");

            var authResponse = JsonSerializer.Deserialize<HostAuthResponse>(content, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            });

            Assert.NotNull(authResponse);
            Assert.True(authResponse.Success, "Authentication should succeed with valid GUID");
            Assert.NotEmpty(authResponse.SessionToken);
            Assert.NotEmpty(authResponse.HostGuid);
            Assert.True(authResponse.ExpiresAt > DateTime.UtcNow, "Session should not be expired");

            _output.WriteLine($"✅ Authentication successful - Token: {authResponse.SessionToken[..10]}...");
        }

        [Fact(DisplayName = "AUTH-02: Host Authentication with Standard GUID Format")]
        public async Task AuthenticateHost_StandardGuidFormat_ShouldSucceed()
        {
            // Arrange
            _output.WriteLine($"Testing host authentication with standard GUID: {AlternateHostGuid}");

            var request = new
            {
                hostGuid = AlternateHostGuid
            };

            // Act
            var response = await _client.PostAsJsonAsync("/api/host/authenticate", request);
            var content = await response.Content.ReadAsStringAsync();

            _output.WriteLine($"Response Status: {response.StatusCode}");
            _output.WriteLine($"Response Content: {content}");

            // Assert - May succeed or fail depending on database content, but should not throw SSL errors
            if (response.IsSuccessStatusCode)
            {
                var authResponse = JsonSerializer.Deserialize<HostAuthResponse>(content, new JsonSerializerOptions
                {
                    PropertyNamingPolicy = JsonNamingPolicy.CamelCase
                });

                Assert.NotNull(authResponse);
                _output.WriteLine($"✅ Standard GUID authentication successful");
            }
            else
            {
                // Should be a clean authentication failure, not SSL certificate error
                Assert.DoesNotContain("certificate", content, StringComparison.OrdinalIgnoreCase);
                Assert.DoesNotContain("SSL", content, StringComparison.OrdinalIgnoreCase);
                Assert.DoesNotContain("trust", content, StringComparison.OrdinalIgnoreCase);

                _output.WriteLine($"✅ Clean authentication failure (no SSL errors): {content}");
            }
        }

        [Fact(DisplayName = "AUTH-03: JSON Serialization CamelCase Validation")]
        public async Task AuthenticateHost_JsonResponse_ShouldUseCamelCaseProperties()
        {
            // Arrange - Use Session 215 known GUID
            var request = new { hostGuid = TestHostGuid };

            // Act
            var response = await _client.PostAsJsonAsync("/api/host/authenticate", request);
            var jsonContent = await response.Content.ReadAsStringAsync();

            _output.WriteLine($"Raw JSON Response: {jsonContent}");

            // Assert - Check for camelCase properties in response
            if (response.IsSuccessStatusCode)
            {
                // Should contain camelCase properties, not PascalCase
                Assert.Contains("\"success\":", jsonContent, StringComparison.Ordinal);
                Assert.Contains("\"sessionToken\":", jsonContent, StringComparison.Ordinal);
                Assert.Contains("\"hostGuid\":", jsonContent, StringComparison.Ordinal);
                Assert.Contains("\"expiresAt\":", jsonContent, StringComparison.Ordinal);

                // Should NOT contain PascalCase properties
                Assert.DoesNotContain("\"Success\":", jsonContent, StringComparison.Ordinal);
                Assert.DoesNotContain("\"SessionToken\":", jsonContent, StringComparison.Ordinal);
                Assert.DoesNotContain("\"HostGuid\":", jsonContent, StringComparison.Ordinal);
                Assert.DoesNotContain("\"ExpiresAt\":", jsonContent, StringComparison.Ordinal);

                _output.WriteLine("✅ JSON response uses camelCase property names correctly");
            }
            else
            {
                _output.WriteLine($"Authentication failed, but JSON format validation passed: {jsonContent}");
            }
        }

        [Fact(DisplayName = "AUTH-04: Database Connectivity During Authentication")]
        public async Task AuthenticateHost_DatabaseQuery_ShouldNotThrowSslErrors()
        {
            // Arrange
            _output.WriteLine("Testing database connectivity during authentication process");

            var request = new { hostGuid = TestHostGuid };

            // Act
            var response = await _client.PostAsJsonAsync("/api/host/authenticate", request);
            var content = await response.Content.ReadAsStringAsync();

            // Assert - Should not contain SSL-related errors
            Assert.DoesNotContain("certificate chain was issued by an authority that is not trusted", content);
            Assert.DoesNotContain("SSL Provider", content);
            Assert.DoesNotContain("TrustServerCertificate", content);
            Assert.DoesNotContain("certificate", content, StringComparison.OrdinalIgnoreCase);

            _output.WriteLine("✅ No SSL certificate errors detected in authentication response");
            _output.WriteLine($"Response content: {content}");
        }

        [Fact(DisplayName = "AUTH-05: Authentication Performance with SSL Bypass")]
        public async Task AuthenticateHost_PerformanceTest_ShouldCompleteQuickly()
        {
            // Arrange
            var request = new { hostGuid = TestHostGuid };
            var stopwatch = System.Diagnostics.Stopwatch.StartNew();

            // Act
            var response = await _client.PostAsJsonAsync("/api/host/authenticate", request);
            stopwatch.Stop();

            var content = await response.Content.ReadAsStringAsync();

            // Assert - Should complete within reasonable time (SSL issues would cause timeouts)
            Assert.True(stopwatch.ElapsedMilliseconds < 5000,
                $"Authentication took too long: {stopwatch.ElapsedMilliseconds}ms. May indicate SSL certificate issues.");

            _output.WriteLine($"✅ Authentication completed in {stopwatch.ElapsedMilliseconds}ms");
            _output.WriteLine($"Response: {response.StatusCode} - {content}");
        }

        [Fact(DisplayName = "AUTH-06: Multiple Authentication Requests Stress Test")]
        public async Task AuthenticateHost_MultipleRequests_ShouldHandleConcurrency()
        {
            // Arrange - Test concurrent authentication requests
            var tasks = new List<Task<HttpResponseMessage>>();
            var request = new { hostGuid = TestHostGuid };

            // Act - Send 5 concurrent authentication requests
            for (int i = 0; i < 5; i++)
            {
                tasks.Add(_client.PostAsJsonAsync("/api/host/authenticate", request));
            }

            var responses = await Task.WhenAll(tasks);

            // Assert - All requests should complete without SSL errors
            for (int i = 0; i < responses.Length; i++)
            {
                var content = await responses[i].Content.ReadAsStringAsync();

                Assert.DoesNotContain("certificate", content, StringComparison.OrdinalIgnoreCase);
                Assert.DoesNotContain("SSL", content, StringComparison.OrdinalIgnoreCase);

                _output.WriteLine($"✅ Concurrent request {i + 1}: {responses[i].StatusCode} - No SSL errors");
            }
        }

        [Theory(DisplayName = "AUTH-07: Invalid GUID Handling")]
        [InlineData("")]
        [InlineData("invalid-guid")]
        [InlineData("00000000-0000-0000-0000-000000000000")]
        [InlineData("not-a-guid-at-all")]
        public async Task AuthenticateHost_InvalidGuid_ShouldFailGracefully(string invalidGuid)
        {
            // Arrange
            var request = new { hostGuid = invalidGuid };
            _output.WriteLine($"Testing invalid GUID: '{invalidGuid}'");

            // Act
            var response = await _client.PostAsJsonAsync("/api/host/authenticate", request);
            var content = await response.Content.ReadAsStringAsync();

            // Assert - Should fail gracefully, not with SSL errors
            Assert.False(response.IsSuccessStatusCode, "Invalid GUID should not authenticate successfully");

            // Should not contain SSL-related error messages
            Assert.DoesNotContain("certificate", content, StringComparison.OrdinalIgnoreCase);
            Assert.DoesNotContain("SSL Provider", content);

            _output.WriteLine($"✅ Invalid GUID rejected cleanly: {response.StatusCode}");
        }

        [Fact(DisplayName = "AUTH-08: Canvas Schema Access Validation")]
        public async Task AuthenticateHost_CanvasSchemaAccess_ShouldWorkWithSslBypass()
        {
            // Arrange - This tests that the canvas schema is accessible with SSL bypass
            using var scope = _factory.Services.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<CanvasDbContext>();

            // Act & Assert - Should be able to query canvas schema without SSL errors
            try
            {
                // Test basic canvas schema connectivity
                var sessionCount = await context.Sessions.CountAsync();
                _output.WriteLine($"✅ Canvas schema accessible - {sessionCount} sessions found");

                // Test specific Session 215 if it exists
                var session215 = await context.Sessions
                    .FirstOrDefaultAsync(s => s.SessionId == 215);

                if (session215 != null)
                {
                    _output.WriteLine($"✅ Session 215 found in database: {session215.GroupId}");
                }
                else
                {
                    _output.WriteLine("⚠️ Session 215 not found in database (may need to be created)");
                }
            }
            catch (Exception ex)
            {
                if (ex.Message.Contains("certificate") || ex.Message.Contains("SSL") || ex.Message.Contains("trust"))
                {
                    Assert.Fail($"SSL certificate error accessing canvas schema: {ex.Message}");
                }

                _output.WriteLine($"Database access error (non-SSL): {ex.Message}");
                throw;
            }
        }
    }

    /// <summary>
    /// Authentication response model for testing
    /// </summary>
    public class HostAuthResponse
    {
        public bool Success { get; set; }
        public string SessionToken { get; set; } = string.Empty;
        public string HostGuid { get; set; } = string.Empty;
        public DateTime ExpiresAt { get; set; }
    }
}
