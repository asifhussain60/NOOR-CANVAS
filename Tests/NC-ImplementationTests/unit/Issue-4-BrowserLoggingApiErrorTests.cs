using Xunit;
using Microsoft.AspNetCore.Mvc.Testing;
using System.Threading.Tasks;
using System.Text;
using System.Text.Json;

namespace NC_ImplementationTests.Unit
{
    /// <summary>
    /// Test coverage for Issue-4: Browser Logging API 500 Error
    /// 
    /// Ensures the /api/logs endpoint properly handles browser log submissions
    /// and JSON parsing works correctly with safe property extraction.
    /// </summary>
    public class Issue4BrowserLoggingApiErrorTests : IClassFixture<WebApplicationFactory<Program>>
    {
        private readonly WebApplicationFactory<Program> _factory;

        public Issue4BrowserLoggingApiErrorTests(WebApplicationFactory<Program> factory)
        {
            _factory = factory;
        }

        [Fact]
        [Trait("Category", "BugFix")]
        [Trait("Issue", "Issue-4")]
        public async Task Browser_Logging_API_Should_Accept_Valid_Log_Entries()
        {
            // Arrange
            var client = _factory.CreateClient();
            
            var logEntry = new
            {
                level = "INFO",
                message = "Test browser log entry",
                component = "TestComponent",
                timestamp = System.DateTime.UtcNow.ToString("O"),
                sessionId = System.Guid.NewGuid().ToString(),
                userId = "test-user-123"
            };

            var json = JsonSerializer.Serialize(logEntry);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            // Act
            var response = await client.PostAsync("/api/logs", content);

            // Assert
            Assert.True(response.IsSuccessStatusCode, 
                $"Browser logging API should accept valid entries. Status: {response.StatusCode}");
        }

        [Fact]
        [Trait("Category", "BugFix")]
        [Trait("Issue", "Issue-4")]
        public async Task Browser_Logging_API_Should_Handle_Malformed_JSON()
        {
            // Arrange
            var client = _factory.CreateClient();
            
            // Malformed JSON that might cause parsing errors
            var malformedJson = "{ \"level\": \"ERROR\", \"message\": \"Test\", }"; // Trailing comma
            var content = new StringContent(malformedJson, Encoding.UTF8, "application/json");

            // Act
            var response = await client.PostAsync("/api/logs", content);

            // Assert
            // Should not return 500 - either accept gracefully or return 400 Bad Request
            Assert.NotEqual(System.Net.HttpStatusCode.InternalServerError, response.StatusCode);
        }

        [Fact]
        [Trait("Category", "BugFix")]
        [Trait("Issue", "Issue-4")]
        public async Task Browser_Logging_API_Should_Handle_Missing_Properties()
        {
            // Arrange
            var client = _factory.CreateClient();
            
            // Log entry with missing optional properties
            var minimalLogEntry = new
            {
                level = "WARN",
                message = "Minimal log entry"
                // Missing: component, timestamp, sessionId, userId
            };

            var json = JsonSerializer.Serialize(minimalLogEntry);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            // Act
            var response = await client.PostAsync("/api/logs", content);

            // Assert
            Assert.True(response.IsSuccessStatusCode, 
                "Browser logging API should handle entries with missing optional properties");
        }

        [Fact]
        [Trait("Category", "BugFix")]
        [Trait("Issue", "Issue-4")]
        public async Task Browser_Logging_API_Should_Handle_Large_Log_Messages()
        {
            // Arrange
            var client = _factory.CreateClient();
            
            // Large log message that might cause processing issues
            var largeMessage = new string('x', 10000); // 10KB message
            var logEntry = new
            {
                level = "ERROR",
                message = largeMessage,
                component = "LargeMessageTest"
            };

            var json = JsonSerializer.Serialize(logEntry);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            // Act
            var response = await client.PostAsync("/api/logs", content);

            // Assert
            Assert.True(response.IsSuccessStatusCode || 
                       response.StatusCode == System.Net.HttpStatusCode.BadRequest,
                "API should either accept large messages or return 400, not 500");
        }

        [Fact]
        [Trait("Category", "Regression")]
        [Trait("Issue", "Issue-4")]
        public async Task Browser_Logging_API_Should_Be_Accessible()
        {
            // Arrange
            var client = _factory.CreateClient();

            // Act - Test that the endpoint exists (GET might return Method Not Allowed, but not 404)
            var response = await client.GetAsync("/api/logs");

            // Assert
            Assert.NotEqual(System.Net.HttpStatusCode.NotFound, response.StatusCode);
        }

        [Theory]
        [InlineData("DEBUG")]
        [InlineData("INFO")]
        [InlineData("WARN")]
        [InlineData("ERROR")]
        [InlineData("FATAL")]
        [Trait("Category", "BugFix")]
        [Trait("Issue", "Issue-4")]
        public async Task Browser_Logging_API_Should_Accept_All_Log_Levels(string logLevel)
        {
            // Arrange
            var client = _factory.CreateClient();
            
            var logEntry = new
            {
                level = logLevel,
                message = $"Test {logLevel} level message",
                component = "LogLevelTest"
            };

            var json = JsonSerializer.Serialize(logEntry);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            // Act
            var response = await client.PostAsync("/api/logs", content);

            // Assert
            Assert.True(response.IsSuccessStatusCode, 
                $"Browser logging API should accept {logLevel} level entries");
        }
    }
}
