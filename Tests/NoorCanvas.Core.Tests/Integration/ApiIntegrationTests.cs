using Xunit;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore;
using NoorCanvas.Data;
using NoorCanvas.Models;
using System.Text;
using System.Text.Json;
using System.Net.Http;

namespace NoorCanvas.Core.Tests.Integration
{
    /// <summary>
    /// End-to-end API integration tests using TestServer
    /// Tests complete request/response cycles and API workflows
    /// </summary>
    public class ApiIntegrationTests : IClassFixture<WebApplicationFactory<Program>>, IDisposable
    {
        private readonly WebApplicationFactory<Program> _factory;
        private readonly HttpClient _client;
        private readonly IServiceScope _scope;
        private readonly CanvasDbContext _context;

        public ApiIntegrationTests(WebApplicationFactory<Program> factory)
        {
            _factory = factory.WithWebHostBuilder(builder =>
            {
                builder.ConfigureServices(services =>
                {
                    // Remove existing DbContext registration
                    var descriptor = services.SingleOrDefault(d => d.ServiceType == typeof(DbContextOptions<CanvasDbContext>));
                    if (descriptor != null)
                    {
                        services.Remove(descriptor);
                    }

                    // Add test database
                    services.AddDbContext<CanvasDbContext>(options =>
                    {
                        options.UseInMemoryDatabase($"ApiIntegrationTest_{Guid.NewGuid()}");
                    });
                });
            });

            _client = _factory.CreateClient();
            _scope = _factory.Services.CreateScope();
            _context = _scope.ServiceProvider.GetRequiredService<CanvasDbContext>();
            
            // Ensure database is created
            _context.Database.EnsureCreated();
        }

        #region Health Endpoint Tests

        [Fact]
        [Trait("Category", "ApiIntegration")]
        [Trait("Endpoint", "Health")]
        public async Task HealthEndpoint_ShouldReturnOk()
        {
            // Act
            var response = await _client.GetAsync("/healthz");

            // Assert
            response.EnsureSuccessStatusCode();
            var content = await response.Content.ReadAsStringAsync();
            var healthData = JsonSerializer.Deserialize<JsonElement>(content);
            
            Assert.Equal("ok", healthData.GetProperty("status").GetString());
            Assert.True(healthData.TryGetProperty("timestamp", out _));
        }

        #endregion

        #region Host API Tests

        [Fact]
        [Trait("Category", "ApiIntegration")]
        [Trait("Endpoint", "HostAuth")]
        public async Task HostAuthentication_WithValidGuid_ShouldReturnSuccess()
        {
            // Arrange
            var request = new { HostGuid = Guid.NewGuid().ToString() };
            var json = JsonSerializer.Serialize(request);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            // Act
            var response = await _client.PostAsync("/api/host/authenticate", content);

            // Assert
            response.EnsureSuccessStatusCode();
            var responseContent = await response.Content.ReadAsStringAsync();
            var authResponse = JsonSerializer.Deserialize<JsonElement>(responseContent);

            Assert.True(authResponse.GetProperty("success").GetBoolean());
            Assert.True(authResponse.TryGetProperty("sessionToken", out _));
            Assert.True(authResponse.TryGetProperty("expiresAt", out _));
        }

        [Fact]
        [Trait("Category", "ApiIntegration")]
        [Trait("Endpoint", "SessionCreate")]
        public async Task CreateSession_WithValidRequest_ShouldCreateSessionSuccessfully()
        {
            // Arrange
            var request = new 
            {
                Title = "API Integration Test Session",
                Description = "Testing session creation via API",
                MaxParticipants = 50
            };
            var json = JsonSerializer.Serialize(request);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            // Act
            var response = await _client.PostAsync("/api/host/session/create", content);

            // Assert
            response.EnsureSuccessStatusCode();
            var responseContent = await response.Content.ReadAsStringAsync();
            var sessionResponse = JsonSerializer.Deserialize<JsonElement>(responseContent);

            Assert.True(sessionResponse.TryGetProperty("sessionId", out _));
            Assert.True(sessionResponse.TryGetProperty("sessionGuid", out _));
            Assert.True(sessionResponse.TryGetProperty("joinLink", out _));
            
            var joinLink = sessionResponse.GetProperty("joinLink").GetString();
            Assert.Contains("localhost", joinLink);
            Assert.Contains("/session/", joinLink);

            // Verify database record was created
            var sessionsCount = await _context.Sessions.CountAsync();
            Assert.True(sessionsCount > 0);
        }

        [Fact]
        [Trait("Category", "ApiIntegration")]
        [Trait("Endpoint", "SessionStart")]
        public async Task StartSession_WithValidSessionId_ShouldStartSessionSuccessfully()
        {
            // Arrange - Create a session first
            var session = new Session
            {
                GroupId = Guid.NewGuid(),
                Title = "Start Test Session",
                CreatedAt = DateTime.UtcNow,
                ExpiresAt = DateTime.UtcNow.AddHours(3)
            };
            
            _context.Sessions.Add(session);
            await _context.SaveChangesAsync();

            // Act
            var response = await _client.PostAsync($"/api/host/session/{session.SessionId}/start", null);

            // Assert
            response.EnsureSuccessStatusCode();
            var responseContent = await response.Content.ReadAsStringAsync();
            var startResponse = JsonSerializer.Deserialize<JsonElement>(responseContent);

            Assert.True(startResponse.GetProperty("success").GetBoolean());
            Assert.Equal("Active", startResponse.GetProperty("status").GetString());

            // Verify session was updated in database
            var updatedSession = await _context.Sessions.FindAsync(session.SessionId);
            Assert.NotNull(updatedSession.StartedAt);
        }

        [Fact]
        [Trait("Category", "ApiIntegration")]
        [Trait("Endpoint", "HostDashboard")]
        public async Task GetDashboardData_WithValidToken_ShouldReturnDashboardData()
        {
            // Arrange - Create test data
            var session = new Session
            {
                GroupId = Guid.NewGuid(),
                Title = "Dashboard Test Session",
                StartedAt = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow,
                ExpiresAt = DateTime.UtcNow.AddHours(3)
            };
            
            _context.Sessions.Add(session);
            await _context.SaveChangesAsync();

            var sessionToken = Guid.NewGuid().ToString();

            // Act
            var response = await _client.GetAsync($"/api/host/dashboard?sessionToken={sessionToken}");

            // Assert
            response.EnsureSuccessStatusCode();
            var responseContent = await response.Content.ReadAsStringAsync();
            var dashboardResponse = JsonSerializer.Deserialize<JsonElement>(responseContent);

            Assert.True(dashboardResponse.TryGetProperty("hostName", out _));
            Assert.True(dashboardResponse.TryGetProperty("activeSessions", out _));
            Assert.True(dashboardResponse.TryGetProperty("totalParticipants", out _));
            Assert.True(dashboardResponse.TryGetProperty("recentSessions", out _));
        }

        #endregion

        #region Participant API Tests

        [Fact]
        [Trait("Category", "ApiIntegration")]
        [Trait("Endpoint", "SessionValidation")]
        public async Task ValidateSession_WithValidSession_ShouldReturnSessionInfo()
        {
            // Arrange - Create session and session link
            var session = new Session
            {
                GroupId = Guid.NewGuid(),
                Title = "Validation Test Session",
                Description = "Testing session validation",
                Status = "Created",
                MaxParticipants = 100,
                CreatedAt = DateTime.UtcNow,
                ExpiresAt = DateTime.UtcNow.AddHours(3)
            };

            _context.Sessions.Add(session);
            await _context.SaveChangesAsync();

            var sessionLink = new SessionLink
            {
                SessionId = session.SessionId,
                Guid = Guid.NewGuid(),
                State = 1, // Active
                CreatedAt = DateTime.UtcNow
            };

            _context.SessionLinks.Add(sessionLink);
            await _context.SaveChangesAsync();

            // Act
            var response = await _client.GetAsync($"/api/participant/session/{sessionLink.Guid}/validate");

            // Assert
            response.EnsureSuccessStatusCode();
            var responseContent = await response.Content.ReadAsStringAsync();
            var validationResponse = JsonSerializer.Deserialize<JsonElement>(responseContent);

            Assert.True(validationResponse.GetProperty("valid").GetBoolean());
            Assert.True(validationResponse.TryGetProperty("title", out _));
            Assert.True(validationResponse.TryGetProperty("canJoin", out _));
            Assert.True(validationResponse.TryGetProperty("participantCount", out _));
            Assert.True(validationResponse.TryGetProperty("maxParticipants", out _));
        }

        [Fact]
        [Trait("Category", "ApiIntegration")]
        [Trait("Endpoint", "ParticipantRegistration")]
        public async Task RegisterParticipant_WithValidData_ShouldRegisterSuccessfully()
        {
            // Arrange - Create session and session link
            var session = new Session
            {
                GroupId = Guid.NewGuid(),
                Title = "Registration Test Session",
                CreatedAt = DateTime.UtcNow,
                ExpiresAt = DateTime.UtcNow.AddHours(3)
            };

            _context.Sessions.Add(session);
            await _context.SaveChangesAsync();

            var sessionLink = new SessionLink
            {
                SessionId = session.SessionId,
                Guid = Guid.NewGuid(),
                State = 1,
                CreatedAt = DateTime.UtcNow
            };

            _context.SessionLinks.Add(sessionLink);
            await _context.SaveChangesAsync();

            var registrationRequest = new
            {
                SessionGuid = sessionLink.Guid.ToString(),
                Name = "API Test User",
                City = "Test City",
                Country = "Test Country",
                UserId = "",
                Fingerprint = "api-test-fingerprint"
            };

            var json = JsonSerializer.Serialize(registrationRequest);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            // Act
            var response = await _client.PostAsync("/api/participant/register", content);

            // Assert
            response.EnsureSuccessStatusCode();
            var responseContent = await response.Content.ReadAsStringAsync();
            var registrationResponse = JsonSerializer.Deserialize<JsonElement>(responseContent);

            Assert.True(registrationResponse.GetProperty("success").GetBoolean());
            Assert.True(registrationResponse.TryGetProperty("userId", out _));
            Assert.True(registrationResponse.TryGetProperty("registrationId", out _));
            Assert.True(registrationResponse.TryGetProperty("waitingRoomUrl", out _));

            // Verify database records
            var userCount = await _context.Users.CountAsync();
            var registrationCount = await _context.Registrations.CountAsync();
            
            Assert.True(userCount > 0);
            Assert.True(registrationCount > 0);
        }

        [Fact]
        [Trait("Category", "ApiIntegration")]
        [Trait("Endpoint", "SessionStatus")]
        public async Task GetSessionStatus_WithValidSessionAndUser_ShouldReturnStatus()
        {
            // Arrange - Create full test scenario
            var session = new Session
            {
                GroupId = Guid.NewGuid(),
                Title = "Status Test Session",
                StartedAt = DateTime.UtcNow, // Session is active
                CreatedAt = DateTime.UtcNow,
                ExpiresAt = DateTime.UtcNow.AddHours(3)
            };

            _context.Sessions.Add(session);
            await _context.SaveChangesAsync();

            var sessionLink = new SessionLink
            {
                SessionId = session.SessionId,
                Guid = Guid.NewGuid(),
                State = 1,
                CreatedAt = DateTime.UtcNow
            };

            _context.SessionLinks.Add(sessionLink);
            await _context.SaveChangesAsync();

            var user = new User
            {
                UserId = Guid.NewGuid(),
                Name = "Status Test User",
                City = "Test City",
                Country = "Test Country",
                FirstJoinedAt = DateTime.UtcNow
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            var registration = new Registration
            {
                SessionId = session.SessionId,
                UserId = user.UserId,
                JoinTime = DateTime.UtcNow
            };

            _context.Registrations.Add(registration);
            await _context.SaveChangesAsync();

            // Act
            var response = await _client.GetAsync(
                $"/api/participant/session/{sessionLink.Guid}/status?userId={user.UserId}");

            // Assert
            response.EnsureSuccessStatusCode();
            var responseContent = await response.Content.ReadAsStringAsync();
            var statusResponse = JsonSerializer.Deserialize<JsonElement>(responseContent);

            Assert.True(statusResponse.GetProperty("valid").GetBoolean());
            Assert.Equal("Active", statusResponse.GetProperty("status").GetString());
            Assert.True(statusResponse.GetProperty("canJoin").GetBoolean()); // User is registered and session is active
        }

        #endregion

        #region Error Handling Tests

        [Fact]
        [Trait("Category", "ApiIntegration")]
        [Trait("Type", "ErrorHandling")]
        public async Task InvalidEndpoint_ShouldReturn404()
        {
            // Act
            var response = await _client.GetAsync("/api/nonexistent/endpoint");

            // Assert
            Assert.Equal(System.Net.HttpStatusCode.NotFound, response.StatusCode);
        }

        [Fact]
        [Trait("Category", "ApiIntegration")]
        [Trait("Type", "ErrorHandling")]
        public async Task InvalidJsonRequest_ShouldReturn400()
        {
            // Arrange
            var invalidJson = "{ invalid json structure";
            var content = new StringContent(invalidJson, Encoding.UTF8, "application/json");

            // Act
            var response = await _client.PostAsync("/api/host/authenticate", content);

            // Assert
            Assert.Equal(System.Net.HttpStatusCode.BadRequest, response.StatusCode);
        }

        [Fact]
        [Trait("Category", "ApiIntegration")]
        [Trait("Type", "ErrorHandling")]
        public async Task MissingRequiredFields_ShouldReturn400()
        {
            // Arrange
            var incompleteRequest = new { }; // Empty request object
            var json = JsonSerializer.Serialize(incompleteRequest);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            // Act
            var response = await _client.PostAsync("/api/participant/register", content);

            // Assert
            Assert.Equal(System.Net.HttpStatusCode.BadRequest, response.StatusCode);
        }

        #endregion

        #region End-to-End Workflow Tests

        [Fact]
        [Trait("Category", "ApiIntegration")]
        [Trait("Type", "E2EWorkflow")]
        public async Task CompleteSessionWorkflow_ShouldWorkEndToEnd()
        {
            // Step 1: Host Authentication
            var hostAuthRequest = new { HostGuid = Guid.NewGuid().ToString() };
            var hostAuthJson = JsonSerializer.Serialize(hostAuthRequest);
            var hostAuthContent = new StringContent(hostAuthJson, Encoding.UTF8, "application/json");
            
            var hostAuthResponse = await _client.PostAsync("/api/host/authenticate", hostAuthContent);
            hostAuthResponse.EnsureSuccessStatusCode();

            // Step 2: Create Session
            var createSessionRequest = new 
            {
                Title = "E2E Test Session",
                Description = "End-to-end workflow test",
                MaxParticipants = 25
            };
            var createSessionJson = JsonSerializer.Serialize(createSessionRequest);
            var createSessionContent = new StringContent(createSessionJson, Encoding.UTF8, "application/json");
            
            var createSessionResponse = await _client.PostAsync("/api/host/session/create", createSessionContent);
            createSessionResponse.EnsureSuccessStatusCode();
            
            var sessionResponseContent = await createSessionResponse.Content.ReadAsStringAsync();
            var sessionData = JsonSerializer.Deserialize<JsonElement>(sessionResponseContent);
            var sessionGuid = sessionData.GetProperty("sessionGuid").GetString();
            var sessionId = sessionData.GetProperty("sessionId").GetString();

            // Step 3: Validate Session (Participant perspective)
            var validateResponse = await _client.GetAsync($"/api/participant/session/{sessionGuid}/validate");
            validateResponse.EnsureSuccessStatusCode();
            
            var validateContent = await validateResponse.Content.ReadAsStringAsync();
            var validateData = JsonSerializer.Deserialize<JsonElement>(validateContent);
            Assert.True(validateData.GetProperty("valid").GetBoolean());

            // Step 4: Register Participant
            var registerRequest = new
            {
                SessionGuid = sessionGuid,
                Name = "E2E Test Participant",
                City = "Test City",
                Country = "Test Country",
                UserId = "",
                Fingerprint = "e2e-test-fingerprint"
            };
            var registerJson = JsonSerializer.Serialize(registerRequest);
            var registerContent = new StringContent(registerJson, Encoding.UTF8, "application/json");
            
            var registerResponse = await _client.PostAsync("/api/participant/register", registerContent);
            registerResponse.EnsureSuccessStatusCode();
            
            var registerResponseContent = await registerResponse.Content.ReadAsStringAsync();
            var registerData = JsonSerializer.Deserialize<JsonElement>(registerResponseContent);
            var userId = registerData.GetProperty("userId").GetString();

            // Step 5: Start Session
            var sessionIdLong = await GetSessionIdFromDatabase(sessionGuid);
            var startResponse = await _client.PostAsync($"/api/host/session/{sessionIdLong}/start", null);
            startResponse.EnsureSuccessStatusCode();

            // Step 6: Check Session Status
            var statusResponse = await _client.GetAsync($"/api/participant/session/{sessionGuid}/status?userId={userId}");
            statusResponse.EnsureSuccessStatusCode();
            
            var statusContent = await statusResponse.Content.ReadAsStringAsync();
            var statusData = JsonSerializer.Deserialize<JsonElement>(statusContent);
            Assert.Equal("Active", statusData.GetProperty("status").GetString());
            Assert.True(statusData.GetProperty("canJoin").GetBoolean());

            // Step 7: End Session
            var endResponse = await _client.PostAsync($"/api/host/session/{sessionIdLong}/end", null);
            endResponse.EnsureSuccessStatusCode();

            // Final verification - Check final status
            var finalStatusResponse = await _client.GetAsync($"/api/participant/session/{sessionGuid}/status?userId={userId}");
            finalStatusResponse.EnsureSuccessStatusCode();
            
            var finalStatusContent = await finalStatusResponse.Content.ReadAsStringAsync();
            var finalStatusData = JsonSerializer.Deserialize<JsonElement>(finalStatusContent);
            Assert.Equal("Completed", finalStatusData.GetProperty("status").GetString());
        }

        #endregion

        #region Helper Methods

        private async Task<long> GetSessionIdFromDatabase(string sessionGuid)
        {
            var sessionLink = await _context.SessionLinks
                .FirstOrDefaultAsync(sl => sl.Guid.ToString() == sessionGuid);
            return sessionLink?.SessionId ?? 0;
        }

        #endregion

        public void Dispose()
        {
            _client?.Dispose();
            _scope?.Dispose();
        }
    }

    /// <summary>
    /// Performance and load testing for API endpoints
    /// Tests API performance under various load conditions
    /// </summary>
    public class ApiPerformanceTests : IClassFixture<WebApplicationFactory<Program>>, IDisposable
    {
        private readonly WebApplicationFactory<Program> _factory;
        private readonly HttpClient _client;

        public ApiPerformanceTests(WebApplicationFactory<Program> factory)
        {
            _factory = factory;
            _client = _factory.CreateClient();
        }

        [Fact]
        [Trait("Category", "ApiPerformance")]
        [Trait("Type", "LoadTest")]
        public async Task HealthEndpoint_ShouldHandleConcurrentRequests()
        {
            // Arrange
            const int concurrentRequests = 50;
            var tasks = new List<Task<HttpResponseMessage>>();

            // Act - Execute concurrent requests
            var startTime = DateTime.UtcNow;
            
            for (int i = 0; i < concurrentRequests; i++)
            {
                tasks.Add(_client.GetAsync("/healthz"));
            }

            var responses = await Task.WhenAll(tasks);
            var endTime = DateTime.UtcNow;

            // Assert
            Assert.All(responses, response =>
            {
                Assert.True(response.IsSuccessStatusCode);
                response.Dispose();
            });

            var totalTime = endTime - startTime;
            Assert.True(totalTime.TotalSeconds < 10, $"Concurrent requests took {totalTime.TotalSeconds} seconds");
        }

        [Theory]
        [Trait("Category", "ApiPerformance")]
        [Trait("Type", "ResponseTime")]
        [InlineData("/healthz")]
        public async Task ApiEndpoints_ShouldRespondWithinReasonableTime(string endpoint)
        {
            // Act
            var startTime = DateTime.UtcNow;
            var response = await _client.GetAsync(endpoint);
            var endTime = DateTime.UtcNow;

            // Assert
            response.EnsureSuccessStatusCode();
            var responseTime = endTime - startTime;
            Assert.True(responseTime.TotalMilliseconds < 5000, 
                $"Endpoint {endpoint} took {responseTime.TotalMilliseconds}ms to respond");
            
            response.Dispose();
        }

        public void Dispose()
        {
            _client?.Dispose();
        }
    }
}
