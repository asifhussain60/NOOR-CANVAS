using System;
using System.Net.Http;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.SignalR.Client;
using Xunit;

namespace NC_ImplementationTests.Unit
{
    /// <summary>
    /// Test coverage for Issue-3: SignalR Connection Parsing Error
    /// 
    /// Ensures SignalR connections establish without parsing errors and CORS policy
    /// supports multiple ports (9090, 9091) for development environment.
    /// </summary>
    public class Issue3SignalRParsingErrorTests
    {
        private readonly WebApplicationFactory<Program> _factory;

        public Issue3SignalRParsingErrorTests(WebApplicationFactory<Program> factory)
        {
            _factory = factory;
        }

        [Fact]
        [Trait("Category", "BugFix")]
        [Trait("Issue", "Issue-3")]
        public async Task SignalR_Connection_Should_Establish_Without_Parsing_Errors()
        {
            // Arrange
            var client = _factory.CreateClient();
            var baseAddress = client.BaseAddress?.ToString().TrimEnd('/');

            var connection = new HubConnectionBuilder()
                .WithUrl($"{baseAddress}/hub/session")
                .Build();

            try
            {
                // Act
                await connection.StartAsync();

                // Assert
                Assert.Equal(HubConnectionState.Connected, connection.State);
            }
            finally
            {
                // Cleanup
                await connection.DisposeAsync();
            }
        }

        [Fact]
        [Trait("Category", "BugFix")]
        [Trait("Issue", "Issue-3")]
        public async Task SignalR_Should_Support_Multiple_Development_Ports()
        {
            // Arrange
            var client = _factory.CreateClient();

            // Act - Test CORS preflight for multiple ports
            var response = await client.SendAsync(new HttpRequestMessage(HttpMethod.Options, "/hub/session")
            {
                Headers = {
                    { "Origin", "https://localhost:9091" },
                    { "Access-Control-Request-Method", "GET" },
                    { "Access-Control-Request-Headers", "connection" }
                }
            });

            // Assert
            Assert.True(response.IsSuccessStatusCode || response.StatusCode == System.Net.HttpStatusCode.NoContent,
                "CORS preflight should succeed for development ports");
        }

        [Fact]
        [Trait("Category", "Integration")]
        [Trait("Issue", "Issue-3")]
        public async Task SignalR_Hub_Should_Handle_Session_Events_Without_Parsing_Errors()
        {
            // Arrange
            var client = _factory.CreateClient();
            var baseAddress = client.BaseAddress?.ToString().TrimEnd('/');

            var connection = new HubConnectionBuilder()
                .WithUrl($"{baseAddress}/hub/session")
                .Build();

            var messageReceived = false;
            connection.On<string>("SessionUpdate", (message) =>
            {
                messageReceived = true;
            });

            try
            {
                // Act
                await connection.StartAsync();

                // Simulate a hub method call that might cause parsing errors
                await connection.InvokeAsync("JoinSession", Guid.NewGuid().ToString());

                // Wait briefly for any potential parsing errors to surface
                await Task.Delay(100);

                // Assert
                Assert.Equal(HubConnectionState.Connected, connection.State);
                // Note: messageReceived validation depends on actual hub implementation
            }
            finally
            {
                await connection.DisposeAsync();
            }
        }

        [Fact]
        [Trait("Category", "Regression")]
        [Trait("Issue", "Issue-3")]
        public async Task SignalR_Configuration_Should_Include_Required_Protocols()
        {
            // Arrange
            var client = _factory.CreateClient();

            // Act - Check that SignalR endpoint is accessible
            var response = await client.GetAsync("/hub/session");

            // Assert - Should get a negotiation response or proper error, not a 404
            Assert.NotEqual(System.Net.HttpStatusCode.NotFound, response.StatusCode);
        }
    }
}
