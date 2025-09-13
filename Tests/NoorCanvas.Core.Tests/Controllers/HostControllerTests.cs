using Xunit;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using NoorCanvas.Controllers;
using NoorCanvas.Data;
using NoorCanvas.Models;
using System.Text.Json;

namespace NoorCanvas.Core.Tests.Controllers
{
    /// <summary>
    /// Comprehensive test suite for HostController
    /// Tests all API endpoints, request validation, error handling, and business logic
    /// </summary>
    public class HostControllerTests : IDisposable
    {
        private readonly CanvasDbContext _context;
        private readonly KSessionsDbContext _kSessionsContext;
        private readonly Mock<ILogger<HostController>> _loggerMock;
        private readonly HostController _controller;
        private readonly DbContextOptions<CanvasDbContext> _options;
        private readonly DbContextOptions<KSessionsDbContext> _kSessionsOptions;

        public HostControllerTests()
        {
            // Setup in-memory databases
            _options = new DbContextOptionsBuilder<CanvasDbContext>()
                .UseInMemoryDatabase(databaseName: $"HostController_Tests_{Guid.NewGuid()}")
                .Options;

            _kSessionsOptions = new DbContextOptionsBuilder<KSessionsDbContext>()
                .UseInMemoryDatabase(databaseName: $"KSessions_Tests_{Guid.NewGuid()}")
                .Options;

            _context = new CanvasDbContext(_options);
            _kSessionsContext = new KSessionsDbContext(_kSessionsOptions);
            _loggerMock = new Mock<ILogger<HostController>>();
            _controller = new HostController(_context, _kSessionsContext, _loggerMock.Object);

            // Ensure database is created
            _context.Database.EnsureCreated();
        }

        [Fact]
        [Trait("Category", "HostController")]
        [Trait("Method", "AuthenticateHost")]
        public async Task AuthenticateHost_WithValidHostGuid_ShouldReturnSuccess()
        {
            // Arrange
            var hostGuid = Guid.NewGuid().ToString();
            var request = new HostAuthRequest { HostGuid = hostGuid };

            // Act
            var result = await _controller.AuthenticateHost(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = JsonSerializer.Deserialize<HostAuthResponse>(
                JsonSerializer.Serialize(okResult.Value), new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
            
            Assert.NotNull(response);
            Assert.True(response.Success);
            Assert.NotEmpty(response.SessionToken);
            Assert.Equal(hostGuid, response.HostGuid);
            Assert.True(response.ExpiresAt > DateTime.UtcNow);
        }

        [Theory]
        [Trait("Category", "HostController")]
        [Trait("Method", "AuthenticateHost")]
        [InlineData("")]
        [InlineData(null)]
        [InlineData("   ")]
        public async Task AuthenticateHost_WithInvalidHostGuid_ShouldReturnBadRequest(string invalidGuid)
        {
            // Arrange
            var request = new HostAuthRequest { HostGuid = invalidGuid };

            // Act
            var result = await _controller.AuthenticateHost(request);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
            Assert.NotNull(badRequestResult.Value);
        }

        [Fact]
        [Trait("Category", "HostController")]
        [Trait("Method", "CreateSession")]
        public async Task CreateSession_WithValidRequest_ShouldCreateSessionSuccessfully()
        {
            // Arrange
            var request = new CreateSessionRequest
            {
                Title = "Test Session",
                Description = "Test Description",
                MaxParticipants = 50
            };

            // Act
            var result = await _controller.CreateSession(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = JsonSerializer.Deserialize<SessionResponse>(
                JsonSerializer.Serialize(okResult.Value), new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

            Assert.NotNull(response);
            Assert.True(response.SessionId != Guid.Empty);
            Assert.NotEmpty(response.SessionGuid);
            Assert.NotEmpty(response.JoinLink);
            Assert.Contains("localhost:9091/session/", response.JoinLink);
            Assert.True(response.CreatedAt > DateTime.MinValue);
            Assert.True(response.ExpiresAt > DateTime.UtcNow);

            // Verify database records
            var session = await _context.Sessions.FirstOrDefaultAsync();
            Assert.NotNull(session);
            
            var sessionLink = await _context.SessionLinks.FirstOrDefaultAsync();
            Assert.NotNull(sessionLink);
            Assert.Equal(1, sessionLink.State); // Active state
        }

        [Fact]
        [Trait("Category", "HostController")]
        [Trait("Method", "StartSession")]
        public async Task StartSession_WithValidSessionId_ShouldStartSessionSuccessfully()
        {
            // Arrange
            var session = new Session
            {
                GroupId = Guid.NewGuid(),
                CreatedAt = DateTime.UtcNow,
                ExpiresAt = DateTime.UtcNow.AddHours(3)
            };
            
            _context.Sessions.Add(session);
            await _context.SaveChangesAsync();

            // Act
            var result = await _controller.StartSession(session.SessionId);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = JsonSerializer.Deserialize<JsonElement>(
                JsonSerializer.Serialize(okResult.Value));

            Assert.True(response.GetProperty("success").GetBoolean());
            Assert.Equal("Active", response.GetProperty("status").GetString());

            // Verify session was updated
            var updatedSession = await _context.Sessions.FindAsync(session.SessionId);
            Assert.NotNull(updatedSession);
            Assert.NotNull(updatedSession.StartedAt);
            Assert.True(updatedSession.StartedAt > DateTime.MinValue);
        }

        [Fact]
        [Trait("Category", "HostController")]
        [Trait("Method", "StartSession")]
        public async Task StartSession_WithNonExistentSessionId_ShouldReturnNotFound()
        {
            // Arrange
            var nonExistentSessionId = 99999L;

            // Act
            var result = await _controller.StartSession(nonExistentSessionId);

            // Assert
            var notFoundResult = Assert.IsType<NotFoundObjectResult>(result);
            Assert.NotNull(notFoundResult.Value);
        }

        [Fact]
        [Trait("Category", "HostController")]
        [Trait("Method", "EndSession")]
        public async Task EndSession_WithValidSessionId_ShouldEndSessionSuccessfully()
        {
            // Arrange
            var session = new Session
            {
                GroupId = Guid.NewGuid(),
                CreatedAt = DateTime.UtcNow,
                StartedAt = DateTime.UtcNow.AddMinutes(-30),
                ExpiresAt = DateTime.UtcNow.AddHours(3)
            };
            
            _context.Sessions.Add(session);
            await _context.SaveChangesAsync();

            // Act
            var result = await _controller.EndSession(session.SessionId);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = JsonSerializer.Deserialize<JsonElement>(
                JsonSerializer.Serialize(okResult.Value));

            Assert.True(response.GetProperty("success").GetBoolean());
            Assert.Equal("Completed", response.GetProperty("status").GetString());

            // Verify session was updated
            var updatedSession = await _context.Sessions.FindAsync(session.SessionId);
            Assert.NotNull(updatedSession);
            Assert.NotNull(updatedSession.EndedAt);
            Assert.True(updatedSession.EndedAt > DateTime.MinValue);
        }

        [Fact]
        [Trait("Category", "HostController")]
        [Trait("Method", "GetDashboardData")]
        public async Task GetDashboardData_WithValidToken_ShouldReturnDashboardData()
        {
            // Arrange
            var sessionToken = Guid.NewGuid().ToString();
            
            // Create test data
            var activeSession = new Session
            {
                GroupId = Guid.NewGuid(),
                CreatedAt = DateTime.UtcNow,
                StartedAt = DateTime.UtcNow.AddMinutes(-15),
                ExpiresAt = DateTime.UtcNow.AddHours(3)
            };

            var completedSession = new Session
            {
                GroupId = Guid.NewGuid(),
                CreatedAt = DateTime.UtcNow.AddDays(-1),
                StartedAt = DateTime.UtcNow.AddDays(-1),
                EndedAt = DateTime.UtcNow.AddDays(-1).AddHours(2),
                ExpiresAt = DateTime.UtcNow.AddDays(-1).AddHours(3)
            };

            _context.Sessions.AddRange(activeSession, completedSession);
            await _context.SaveChangesAsync();

            // Add some registrations
            var user = new User
            {
                UserId = Guid.NewGuid(),
                Name = "Test User",
                City = "Test City",
                Country = "Test Country",
                FirstJoinedAt = DateTime.UtcNow
            };

            var registration = new Registration
            {
                SessionId = activeSession.SessionId,
                UserId = user.UserId,
                JoinTime = DateTime.UtcNow
            };

            _context.Users.Add(user);
            _context.Registrations.Add(registration);
            await _context.SaveChangesAsync();

            // Act
            var result = await _controller.GetDashboardData(sessionToken);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = JsonSerializer.Deserialize<HostDashboardResponse>(
                JsonSerializer.Serialize(okResult.Value), new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

            Assert.NotNull(response);
            Assert.NotEmpty(response.HostName);
            Assert.True(response.ActiveSessions >= 1);
            Assert.True(response.TotalParticipants >= 1);
            Assert.NotNull(response.RecentSessions);
            Assert.True(response.RecentSessions.Count() >= 1);
        }

        [Theory]
        [Trait("Category", "HostController")]
        [Trait("Method", "GetDashboardData")]
        [InlineData("")]
        [InlineData("invalid-guid")]
        [InlineData("   ")]
        public async Task GetDashboardData_WithInvalidToken_ShouldReturnBadRequest(string invalidToken)
        {
            // Act
            var result = await _controller.GetDashboardData(invalidToken);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
            Assert.NotNull(badRequestResult.Value);
        }

        [Fact]
        [Trait("Category", "HostController")]
        [Trait("Method", "CreateSession")]
        public async Task CreateSession_ShouldLogOperationsCorrectly()
        {
            // Arrange
            var request = new CreateSessionRequest { Title = "Log Test Session" };

            // Act
            await _controller.CreateSession(request);

            // Assert - Verify logging calls
            _loggerMock.Verify(
                x => x.Log(
                    LogLevel.Information,
                    It.IsAny<EventId>(),
                    It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("NOOR-INFO: Creating new session")),
                    It.IsAny<Exception>(),
                    It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
                Times.AtLeastOnce);

            _loggerMock.Verify(
                x => x.Log(
                    LogLevel.Information,
                    It.IsAny<EventId>(),
                    It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("NOOR-SUCCESS: Session created with ID:")),
                    It.IsAny<Exception>(),
                    It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
                Times.AtLeastOnce);
        }

        [Fact]
        [Trait("Category", "HostController")]
        [Trait("Method", "AuthenticateHost")]
        [Trait("Issue", "Issue-25")]
        public async Task AuthenticateHost_JsonSerialization_ShouldReturnCamelCaseProperties()
        {
            // Arrange - Test for Issue-25: Host Authentication Failure with Valid GUID
            var testGuid = "6d752e72-93a1-456c-bc2d-d27af095882a";
            var request = new HostAuthRequest { HostGuid = testGuid };

            // Act
            var result = await _controller.AuthenticateHost(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            
            // Serialize the response to JSON to verify camelCase property names
            var jsonResponse = JsonSerializer.Serialize(okResult.Value);
            
            // Verify that the JSON contains camelCase property names (as expected by frontend)
            Assert.Contains("\"success\":", jsonResponse);
            Assert.Contains("\"sessionToken\":", jsonResponse);
            Assert.Contains("\"hostGuid\":", jsonResponse);
            Assert.Contains("\"expiresAt\":", jsonResponse);
            
            // Verify that PascalCase properties are NOT present (would cause deserialization issues)
            Assert.DoesNotContain("\"Success\":", jsonResponse);
            Assert.DoesNotContain("\"SessionToken\":", jsonResponse);
            Assert.DoesNotContain("\"HostGuid\":", jsonResponse);
            Assert.DoesNotContain("\"ExpiresAt\":", jsonResponse);
            
            // Verify the response can be deserialized with camelCase property names
            var deserializedResponse = JsonSerializer.Deserialize<HostAuthResponse>(jsonResponse);
            Assert.NotNull(deserializedResponse);
            Assert.True(deserializedResponse.Success);
            Assert.Equal(testGuid, deserializedResponse.HostGuid);
        }

        public void Dispose()
        {
            _context.Dispose();
            _kSessionsContext.Dispose();
        }
    }
}
