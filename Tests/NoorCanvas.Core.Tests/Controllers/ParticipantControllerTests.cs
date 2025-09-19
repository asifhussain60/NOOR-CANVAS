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
    /// Comprehensive test suite for ParticipantController
    /// Tests session validation, registration, status checking, and error scenarios
    /// </summary>
    public class ParticipantControllerTests : IDisposable
    {
        private readonly CanvasDbContext _context;
        private readonly Mock<ILogger<ParticipantController>> _loggerMock;
        private readonly ParticipantController _controller;

        public ParticipantControllerTests()
        {
            // Setup in-memory database
            var options = new DbContextOptionsBuilder<CanvasDbContext>()
                .UseInMemoryDatabase(databaseName: $"ParticipantController_Tests_{Guid.NewGuid()}")
                .Options;

            _context = new CanvasDbContext(options);
            _loggerMock = new Mock<ILogger<ParticipantController>>();
            _controller = new ParticipantController(_context, _loggerMock.Object);

            // Ensure database is created
            _context.Database.EnsureCreated();
        }

        [Fact]
        [Trait("Category", "ParticipantController")]
        [Trait("Method", "ValidateSession")]
        public async Task ValidateSession_WithValidSessionGuid_ShouldReturnValidSession()
        {
            // Arrange
            var session = await CreateTestSessionWithLink();

            // Act
            var result = await _controller.ValidateSession(session.sessionLink.Guid.ToString());

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = JsonSerializer.Deserialize<SessionValidationResponse>(
                JsonSerializer.Serialize(okResult.Value), new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

            Assert.NotNull(response);
            Assert.True(response.Valid);
            Assert.True(response.CanJoin);
            Assert.True(response.ParticipantCount >= 0);
            Assert.True(response.MaxParticipants > 0);
        }

        [Theory]
        [Trait("Category", "ParticipantController")]
        [Trait("Method", "ValidateSession")]
        [InlineData("invalid-guid")]
        [InlineData("")]
        [InlineData("not-a-guid-at-all")]
        public async Task ValidateSession_WithInvalidGuidFormat_ShouldReturnBadRequest(string invalidGuid)
        {
            // Act
            var result = await _controller.ValidateSession(invalidGuid);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
            Assert.NotNull(badRequestResult.Value);
        }

        [Fact]
        [Trait("Category", "ParticipantController")]
        [Trait("Method", "ValidateSession")]
        public async Task ValidateSession_WithNonExistentSession_ShouldReturnNotFound()
        {
            // Arrange
            var nonExistentGuid = Guid.NewGuid().ToString();

            // Act
            var result = await _controller.ValidateSession(nonExistentGuid);

            // Assert
            var notFoundResult = Assert.IsType<NotFoundObjectResult>(result);
            Assert.NotNull(notFoundResult.Value);
        }

        [Fact]
        [Trait("Category", "ParticipantController")]
        [Trait("Method", "ValidateSession")]
        public async Task ValidateSession_WithExpiredSession_ShouldReturnBadRequest()
        {
            // Arrange
            var session = await CreateTestSessionWithLink(expiresAt: DateTime.UtcNow.AddHours(-1)); // Expired

            // Act
            var result = await _controller.ValidateSession(session.sessionLink.Guid.ToString());

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
            Assert.NotNull(badRequestResult.Value);
        }

        [Fact]
        [Trait("Category", "ParticipantController")]
        [Trait("Method", "ValidateSession")]
        public async Task ValidateSession_WithInactiveSessionLink_ShouldReturnBadRequest()
        {
            // Arrange
            var session = await CreateTestSessionWithLink(linkState: 0); // Inactive link

            // Act
            var result = await _controller.ValidateSession(session.sessionLink.Guid.ToString());

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
            Assert.NotNull(badRequestResult.Value);
        }

        [Fact]
        [Trait("Category", "ParticipantController")]
        [Trait("Method", "RegisterParticipant")]
        public async Task RegisterParticipant_WithValidData_ShouldRegisterSuccessfully()
        {
            // Arrange
            var session = await CreateTestSessionWithLink();
            var request = new ParticipantRegistrationRequest
            {
                SessionGuid = session.sessionLink.Guid.ToString(),
                Name = "John Doe",
                City = "New York",
                Country = "United States",
                UserId = "", // New user
                Fingerprint = "test-fingerprint"
            };

            // Act
            var result = await _controller.RegisterParticipant(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = JsonSerializer.Deserialize<ParticipantRegistrationResponse>(
                JsonSerializer.Serialize(okResult.Value), new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

            Assert.NotNull(response);
            Assert.True(response.Success);
            Assert.NotEmpty(response.UserId);
            Assert.True(response.RegistrationId > 0);
            Assert.NotEmpty(response.WaitingRoomUrl);
            Assert.True(response.JoinTime > DateTime.MinValue);

            // Verify database records
            var user = await _context.Users.FirstOrDefaultAsync(u => u.UserId.ToString() == response.UserId);
            Assert.NotNull(user);
            Assert.Equal("John Doe", user.Name);
            Assert.Equal("New York", user.City);
            Assert.Equal("United States", user.Country);

            var registration = await _context.Registrations.FirstOrDefaultAsync(r => r.RegistrationId == response.RegistrationId);
            Assert.NotNull(registration);
            Assert.Equal(session.session.SessionId, registration.SessionId);
        }

        [Fact]
        [Trait("Category", "ParticipantController")]
        [Trait("Method", "RegisterParticipant")]
        public async Task RegisterParticipant_WithExistingUser_ShouldUpdateUserInfo()
        {
            // Arrange
            var session = await CreateTestSessionWithLink();
            var existingUser = new User
            {
                UserId = Guid.NewGuid(),
                Name = "Old Name",
                City = "Old City",
                Country = "Old Country",
                FirstJoinedAt = DateTime.UtcNow.AddDays(-30),
                LastJoinedAt = DateTime.UtcNow.AddDays(-1)
            };

            _context.Users.Add(existingUser);
            await _context.SaveChangesAsync();

            var request = new ParticipantRegistrationRequest
            {
                SessionGuid = session.sessionLink.Guid.ToString(),
                Name = "Updated Name",
                City = "Updated City",
                Country = "Updated Country",
                UserId = existingUser.UserId.ToString(),
                Fingerprint = "test-fingerprint"
            };

            // Act
            var result = await _controller.RegisterParticipant(request);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);

            // Verify user was updated
            var updatedUser = await _context.Users.FindAsync(existingUser.UserId);
            Assert.NotNull(updatedUser);
            Assert.Equal("Updated Name", updatedUser.Name);
            Assert.Equal("Updated City", updatedUser.City);
            Assert.Equal("Updated Country", updatedUser.Country);
            Assert.True(updatedUser.LastJoinedAt > existingUser.LastJoinedAt);
        }

        [Theory]
        [Trait("Category", "ParticipantController")]
        [Trait("Method", "RegisterParticipant")]
        [InlineData("", "City", "Country")]
        [InlineData("Name", "", "Country")]
        [InlineData("Name", "City", "")]
        [InlineData("   ", "City", "Country")]
        [InlineData("Name", "   ", "Country")]
        [InlineData("Name", "City", "   ")]
        public async Task RegisterParticipant_WithMissingRequiredFields_ShouldReturnBadRequest(
            string name, string city, string country)
        {
            // Arrange
            var session = await CreateTestSessionWithLink();
            var request = new ParticipantRegistrationRequest
            {
                SessionGuid = session.sessionLink.Guid.ToString(),
                Name = name,
                City = city,
                Country = country
            };

            // Act
            var result = await _controller.RegisterParticipant(request);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
            Assert.NotNull(badRequestResult.Value);
        }

        [Fact]
        [Trait("Category", "ParticipantController")]
        [Trait("Method", "RegisterParticipant")]
        public async Task RegisterParticipant_WithExpiredSession_ShouldReturnBadRequest()
        {
            // Arrange
            var session = await CreateTestSessionWithLink(expiresAt: DateTime.UtcNow.AddHours(-1));
            var request = new ParticipantRegistrationRequest
            {
                SessionGuid = session.sessionLink.Guid.ToString(),
                Name = "John Doe",
                City = "New York",
                Country = "United States"
            };

            // Act
            var result = await _controller.RegisterParticipant(request);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
            Assert.NotNull(badRequestResult.Value);
        }

        [Fact]
        [Trait("Category", "ParticipantController")]
        [Trait("Method", "RegisterParticipant")]
        public async Task RegisterParticipant_WithEndedSession_ShouldReturnBadRequest()
        {
            // Arrange
            var session = await CreateTestSessionWithLink(endedAt: DateTime.UtcNow.AddMinutes(-30));
            var request = new ParticipantRegistrationRequest
            {
                SessionGuid = session.sessionLink.Guid.ToString(),
                Name = "John Doe",
                City = "New York",
                Country = "United States"
            };

            // Act
            var result = await _controller.RegisterParticipant(request);

            // Assert
            var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
            Assert.NotNull(badRequestResult.Value);
        }

        [Fact]
        [Trait("Category", "ParticipantController")]
        [Trait("Method", "GetSessionStatus")]
        public async Task GetSessionStatus_WithValidSessionAndUser_ShouldReturnStatus()
        {
            // Arrange
            var session = await CreateTestSessionWithLink();
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
                SessionId = session.session.SessionId,
                UserId = user.UserId,
                JoinTime = DateTime.UtcNow
            };

            _context.Users.Add(user);
            _context.Registrations.Add(registration);

            // Start the session
            session.session.StartedAt = DateTime.UtcNow.AddMinutes(-15);
            await _context.SaveChangesAsync();

            // Act
            var result = await _controller.GetSessionStatus(
                session.sessionLink.Guid.ToString(),
                user.UserId.ToString());

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = JsonSerializer.Deserialize<SessionStatusResponse>(
                JsonSerializer.Serialize(okResult.Value), new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

            Assert.NotNull(response);
            Assert.Equal("Active", response.Status);
            Assert.True(response.CanJoin); // User is registered and session is active
        }

        [Fact]
        [Trait("Category", "ParticipantController")]
        [Trait("Method", "GetSessionStatus")]
        public async Task GetSessionStatus_WithUnregisteredUser_ShouldReturnCannotJoin()
        {
            // Arrange
            var session = await CreateTestSessionWithLink();
            session.session.StartedAt = DateTime.UtcNow.AddMinutes(-15); // Session is active
            await _context.SaveChangesAsync();

            var unregisteredUserId = Guid.NewGuid().ToString();

            // Act
            var result = await _controller.GetSessionStatus(
                session.sessionLink.Guid.ToString(),
                unregisteredUserId);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var response = JsonSerializer.Deserialize<SessionStatusResponse>(
                JsonSerializer.Serialize(okResult.Value), new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

            Assert.NotNull(response);
            Assert.Equal("Active", response.Status);
            Assert.False(response.CanJoin); // User is not registered
        }

        [Fact]
        [Trait("Category", "ParticipantController")]
        [Trait("Method", "RegisterParticipant")]
        public async Task RegisterParticipant_ShouldLogOperationsCorrectly()
        {
            // Arrange
            var session = await CreateTestSessionWithLink();
            var request = new ParticipantRegistrationRequest
            {
                SessionGuid = session.sessionLink.Guid.ToString(),
                Name = "Log Test User",
                City = "Test City",
                Country = "Test Country"
            };

            // Act
            await _controller.RegisterParticipant(request);

            // Assert - Verify logging calls
            _loggerMock.Verify(
                x => x.Log(
                    LogLevel.Information,
                    It.IsAny<EventId>(),
                    It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("NOOR-INFO: Participant registration:")),
                    It.IsAny<Exception>(),
                    It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
                Times.AtLeastOnce);

            _loggerMock.Verify(
                x => x.Log(
                    LogLevel.Information,
                    It.IsAny<EventId>(),
                    It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("NOOR-SUCCESS: Participant registered:")),
                    It.IsAny<Exception>(),
                    It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
                Times.AtLeastOnce);
        }

        // Helper method to create test session with session link
        private async Task<(Session session, SessionLink sessionLink)> CreateTestSessionWithLink(
            DateTime? expiresAt = null,
            DateTime? endedAt = null,
            int linkState = 1)
        {
            var session = new Session
            {
                GroupId = Guid.NewGuid(),
                Title = "Test Session",
                Description = "Test Description",
                Status = "Created",
                MaxParticipants = 100,
                CreatedAt = DateTime.UtcNow,
                ExpiresAt = expiresAt ?? DateTime.UtcNow.AddHours(3),
                EndedAt = endedAt
            };

            _context.Sessions.Add(session);
            await _context.SaveChangesAsync();

            var sessionLink = new SessionLink
            {
                SessionId = session.SessionId,
                Guid = Guid.NewGuid(),
                State = (byte)linkState,
                CreatedAt = DateTime.UtcNow
            };

            _context.SessionLinks.Add(sessionLink);
            await _context.SaveChangesAsync();

            return (session, sessionLink);
        }

        public void Dispose()
        {
            _context.Dispose();
        }
    }
}
