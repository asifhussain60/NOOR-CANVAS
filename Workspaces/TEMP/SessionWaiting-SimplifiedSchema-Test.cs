// SessionWaiting.razor API Test - Validates simplified schema integration
// This test validates that SessionWaiting.razor works correctly with the new 3-table schema

using Microsoft.AspNetCore.Mvc.Testing;
using System.Net.Http;
using System.Text.Json;
using Xunit;

namespace NoorCanvas.Tests.Integration
{
    public class SessionWaitingSchemaTests : IClassFixture<WebApplicationFactory<Program>>
    {
        private readonly WebApplicationFactory<Program> _factory;
        private readonly HttpClient _client;

        public SessionWaitingSchemaTests(WebApplicationFactory<Program> factory)
        {
            _factory = factory;
            _client = _factory.CreateClient();
        }

        [Fact]
        [Trait("Category", "Integration")]
        [Trait("Schema", "Simplified")]
        public async Task SessionWaiting_ValidateEndpoint_ShouldWorkWithSimplifiedSchema()
        {
            // This test validates the API endpoints that SessionWaiting.razor uses
            // Token "LG8GAJ6Q" was created during our schema testing
            var token = "LG8GAJ6Q";
            
            // Test session validation endpoint
            var response = await _client.GetAsync($"/api/participant/session/{token}/validate");
            
            Assert.True(response.IsSuccessStatusCode, $"Validation endpoint failed: {response.StatusCode}");
            
            var content = await response.Content.ReadAsStringAsync();
            var validation = JsonSerializer.Deserialize<JsonElement>(content);
            
            Assert.True(validation.GetProperty("valid").GetBoolean());
            Assert.Equal(3, validation.GetProperty("sessionId").GetInt32());
            Assert.Equal("A Model For Success", validation.GetProperty("session").GetProperty("title").GetString());
        }

        [Fact]
        [Trait("Category", "Integration")]
        [Trait("Schema", "Simplified")]
        public async Task SessionWaiting_ParticipantsEndpoint_ShouldWorkWithSimplifiedSchema()
        {
            // Test participants endpoint
            var token = "LG8GAJ6Q";
            
            var response = await _client.GetAsync($"/api/participant/session/{token}/participants");
            
            Assert.True(response.IsSuccessStatusCode, $"Participants endpoint failed: {response.StatusCode}");
            
            var content = await response.Content.ReadAsStringAsync();
            var participants = JsonSerializer.Deserialize<JsonElement>(content);
            
            Assert.Equal(3, participants.GetProperty("sessionId").GetInt32());
            Assert.Equal(0, participants.GetProperty("participantCount").GetInt32());
            Assert.True(participants.GetProperty("participants").ValueKind == JsonValueKind.Array);
        }
    }
}