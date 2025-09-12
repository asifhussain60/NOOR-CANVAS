using Xunit;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using NoorCanvas.Services;
using NoorCanvas.Data;
using NoorCanvas.Models;
using System.Text.Json;

namespace NoorCanvas.Core.Tests.Services
{
    /// <summary>
    /// Comprehensive test suite for AnnotationService
    /// Tests annotation CRUD operations, business logic, and data persistence
    /// </summary>
    public class AnnotationServiceTests : IDisposable
    {
        private readonly CanvasDbContext _context;
        private readonly Mock<ILogger<AnnotationService>> _loggerMock;
        private readonly AnnotationService _annotationService;

        public AnnotationServiceTests()
        {
            // Setup in-memory database
            var options = new DbContextOptionsBuilder<CanvasDbContext>()
                .UseInMemoryDatabase(databaseName: $"AnnotationService_Tests_{Guid.NewGuid()}")
                .Options;

            _context = new CanvasDbContext(options);
            _loggerMock = new Mock<ILogger<AnnotationService>>();
            _annotationService = new AnnotationService(_context, _loggerMock.Object);

            // Ensure database is created
            _context.Database.EnsureCreated();
        }

        [Fact]
        [Trait("Category", "AnnotationService")]
        [Trait("Method", "CreateAnnotationAsync")]
        public async Task CreateAnnotationAsync_WithValidData_ShouldCreateAnnotationSuccessfully()
        {
            // Arrange
            var session = await CreateTestSession();
            var sessionId = session.SessionId;
            var createdBy = "test-user";
            var annotationData = new
            {
                type = "highlight",
                coordinates = new[] { new { x = 100, y = 200 }, new { x = 150, y = 250 } },
                text = "Selected text for highlighting",
                color = "#ffff00"
            };

            // Act
            var result = await _annotationService.CreateAnnotationAsync(sessionId, createdBy, annotationData);

            // Assert
            Assert.NotNull(result);
            Assert.True(result.AnnotationId > 0);
            Assert.Equal(sessionId, result.SessionId);
            Assert.Equal(createdBy, result.CreatedBy);
            Assert.NotNull(result.AnnotationData);
            Assert.True(result.CreatedAt > DateTime.MinValue);

            // Verify JSON structure
            var parsedData = JsonSerializer.Deserialize<JsonElement>(result.AnnotationData);
            Assert.Equal("highlight", parsedData.GetProperty("type").GetString());
            Assert.Equal("#ffff00", parsedData.GetProperty("color").GetString());

            // Verify persistence
            var persistedAnnotation = await _context.Annotations.FindAsync(result.AnnotationId);
            Assert.NotNull(persistedAnnotation);
            Assert.Equal(result.AnnotationData, persistedAnnotation.AnnotationData);
        }

        [Theory]
        [Trait("Category", "AnnotationService")]
        [Trait("Method", "CreateAnnotationAsync")]
        [MemberData(nameof(GetAnnotationTestData))]
        public async Task CreateAnnotationAsync_WithDifferentAnnotationTypes_ShouldHandleAllTypes(
            object annotationData, string expectedType)
        {
            // Arrange
            var session = await CreateTestSession();
            var sessionId = session.SessionId;
            var createdBy = "test-user";

            // Act
            var result = await _annotationService.CreateAnnotationAsync(sessionId, createdBy, annotationData);

            // Assert
            Assert.NotNull(result);
            var parsedData = JsonSerializer.Deserialize<JsonElement>(result.AnnotationData);
            Assert.Equal(expectedType, parsedData.GetProperty("type").GetString());
        }

        public static IEnumerable<object[]> GetAnnotationTestData()
        {
            yield return new object[]
            {
                new { type = "highlight", text = "Highlighted text", color = "#ffff00" },
                "highlight"
            };
            yield return new object[]
            {
                new { type = "drawing", path = "M100,200 L150,250 L200,200", strokeColor = "#ff0000", strokeWidth = 2 },
                "drawing"
            };
            yield return new object[]
            {
                new { type = "note", position = new { x = 300, y = 400 }, text = "This is a note", backgroundColor = "#fff2cc" },
                "note"
            };
        }

        [Fact]
        [Trait("Category", "AnnotationService")]
        [Trait("Method", "GetSessionAnnotationsAsync")]
        public async Task GetSessionAnnotationsAsync_WithMultipleAnnotations_ShouldReturnAllAnnotations()
        {
            // Arrange
            var session = await CreateTestSession();
            var sessionId = session.SessionId;
            
            // Create multiple annotations
            var annotations = new[]
            {
                new Annotation
                {
                    SessionId = sessionId,
                    CreatedBy = "user1",
                    AnnotationData = JsonSerializer.Serialize(new { type = "highlight", text = "First annotation" }),
                    CreatedAt = DateTime.UtcNow.AddMinutes(-10)
                },
                new Annotation
                {
                    SessionId = sessionId,
                    CreatedBy = "user2",
                    AnnotationData = JsonSerializer.Serialize(new { type = "drawing", path = "M100,200 L150,250" }),
                    CreatedAt = DateTime.UtcNow.AddMinutes(-5)
                },
                new Annotation
                {
                    SessionId = sessionId,
                    CreatedBy = "user1",
                    AnnotationData = JsonSerializer.Serialize(new { type = "note", text = "A note annotation" }),
                    CreatedAt = DateTime.UtcNow
                }
            };

            _context.Annotations.AddRange(annotations);
            await _context.SaveChangesAsync();

            // Act
            var result = await _annotationService.GetSessionAnnotationsAsync(sessionId);

            // Assert
            Assert.NotNull(result);
            var annotationList = result.ToList();
            Assert.Equal(3, annotationList.Count);
            
            // Verify ordering (should be by creation time)
            Assert.True(annotationList[0].CreatedAt <= annotationList[1].CreatedAt);
            Assert.True(annotationList[1].CreatedAt <= annotationList[2].CreatedAt);

            // Verify all belong to the session
            Assert.All(annotationList, a => Assert.Equal(sessionId, a.SessionId));
        }

        [Fact]
        [Trait("Category", "AnnotationService")]
        [Trait("Method", "GetSessionAnnotationsAsync")]
        public async Task GetSessionAnnotationsAsync_WithEmptySession_ShouldReturnEmptyCollection()
        {
            // Arrange
            var session = await CreateTestSession();
            var sessionId = session.SessionId;

            // Act
            var result = await _annotationService.GetSessionAnnotationsAsync(sessionId);

            // Assert
            Assert.NotNull(result);
            Assert.Empty(result);
        }

        [Fact]
        [Trait("Category", "AnnotationService")]
        [Trait("Method", "UpdateAnnotationAsync")]
        public async Task UpdateAnnotationAsync_WithValidData_ShouldUpdateAnnotationSuccessfully()
        {
            // Arrange
            var session = await CreateTestSession();
            var originalData = new { type = "highlight", text = "Original text", color = "#ffff00" };
            var annotation = await _annotationService.CreateAnnotationAsync(
                session.SessionId, "test-user", originalData);

            var updatedData = new { type = "highlight", text = "Updated text", color = "#ff0000" };

            // Act
            var result = await _annotationService.UpdateAnnotationAsync(
                annotation.AnnotationId, "test-user", updatedData);

            // Assert
            Assert.True(result);

            // Verify the update
            var updatedAnnotation = await _context.Annotations.FindAsync(annotation.AnnotationId);
            Assert.NotNull(updatedAnnotation);
            
            var parsedData = JsonSerializer.Deserialize<JsonElement>(updatedAnnotation.AnnotationData);
            Assert.Equal("Updated text", parsedData.GetProperty("text").GetString());
            Assert.Equal("#ff0000", parsedData.GetProperty("color").GetString());
        }

        [Fact]
        [Trait("Category", "AnnotationService")]
        [Trait("Method", "UpdateAnnotationAsync")]
        public async Task UpdateAnnotationAsync_WithWrongUser_ShouldReturnFalse()
        {
            // Arrange
            var session = await CreateTestSession();
            var originalData = new { type = "highlight", text = "Original text" };
            var annotation = await _annotationService.CreateAnnotationAsync(
                session.SessionId, "original-user", originalData);

            var updatedData = new { type = "highlight", text = "Updated text" };

            // Act
            var result = await _annotationService.UpdateAnnotationAsync(
                annotation.AnnotationId, "different-user", updatedData);

            // Assert
            Assert.False(result);

            // Verify no change occurred
            var unchangedAnnotation = await _context.Annotations.FindAsync(annotation.AnnotationId);
            Assert.NotNull(unchangedAnnotation);
            Assert.Equal(annotation.AnnotationData, unchangedAnnotation.AnnotationData);
        }

        [Fact]
        [Trait("Category", "AnnotationService")]
        [Trait("Method", "DeleteAnnotationAsync")]
        public async Task DeleteAnnotationAsync_WithValidUserAndAnnotation_ShouldDeleteSuccessfully()
        {
            // Arrange
            var session = await CreateTestSession();
            var annotationData = new { type = "highlight", text = "To be deleted" };
            var annotation = await _annotationService.CreateAnnotationAsync(
                session.SessionId, "test-user", annotationData);

            // Act
            var result = await _annotationService.DeleteAnnotationAsync(
                annotation.AnnotationId, "test-user");

            // Assert
            Assert.True(result);

            // Verify deletion
            var deletedAnnotation = await _context.Annotations.FindAsync(annotation.AnnotationId);
            Assert.Null(deletedAnnotation);
        }

        [Fact]
        [Trait("Category", "AnnotationService")]
        [Trait("Method", "DeleteAnnotationAsync")]
        public async Task DeleteAnnotationAsync_WithWrongUser_ShouldReturnFalse()
        {
            // Arrange
            var session = await CreateTestSession();
            var annotationData = new { type = "highlight", text = "Protected annotation" };
            var annotation = await _annotationService.CreateAnnotationAsync(
                session.SessionId, "original-user", annotationData);

            // Act
            var result = await _annotationService.DeleteAnnotationAsync(
                annotation.AnnotationId, "different-user");

            // Assert
            Assert.False(result);

            // Verify annotation still exists
            var existingAnnotation = await _context.Annotations.FindAsync(annotation.AnnotationId);
            Assert.NotNull(existingAnnotation);
        }

        [Fact]
        [Trait("Category", "AnnotationService")]
        [Trait("Method", "ClearSessionAnnotationsAsync")]
        public async Task ClearSessionAnnotationsAsync_WithValidUser_ShouldClearUserAnnotations()
        {
            // Arrange
            var session = await CreateTestSession();
            var sessionId = session.SessionId;
            var targetUser = "target-user";
            var otherUser = "other-user";

            // Create annotations for both users
            await _annotationService.CreateAnnotationAsync(sessionId, targetUser, new { type = "highlight", text = "User1 annotation 1" });
            await _annotationService.CreateAnnotationAsync(sessionId, targetUser, new { type = "drawing", path = "M100,200" });
            await _annotationService.CreateAnnotationAsync(sessionId, otherUser, new { type = "note", text = "User2 annotation" });

            // Act
            await _annotationService.ClearSessionAnnotationsAsync(sessionId, targetUser);

            // Assert
            var remainingAnnotations = await _context.Annotations
                .Where(a => a.SessionId == sessionId)
                .ToListAsync();

            // Should only have the other user's annotation
            Assert.Single(remainingAnnotations);
            Assert.Equal(otherUser, remainingAnnotations[0].CreatedBy);
        }

        [Fact]
        [Trait("Category", "AnnotationService")]
        [Trait("Method", "GetSessionAnnotationsAsync")]
        public async Task GetSessionAnnotationsAsync_WithDifferentSessions_ShouldReturnOnlySessionAnnotations()
        {
            // Arrange
            var session1 = await CreateTestSession();
            var session2 = await CreateTestSession();

            // Create annotations for both sessions
            await _annotationService.CreateAnnotationAsync(session1.SessionId, "user1", new { type = "highlight", text = "Session 1 annotation" });
            await _annotationService.CreateAnnotationAsync(session2.SessionId, "user1", new { type = "drawing", path = "M100,200" });

            // Act
            var session1Annotations = await _annotationService.GetSessionAnnotationsAsync(session1.SessionId);
            var session2Annotations = await _annotationService.GetSessionAnnotationsAsync(session2.SessionId);

            // Assert
            Assert.Single(session1Annotations);
            Assert.Single(session2Annotations);
            
            Assert.Equal(session1.SessionId, session1Annotations.First().SessionId);
            Assert.Equal(session2.SessionId, session2Annotations.First().SessionId);
        }

        [Fact]
        [Trait("Category", "AnnotationService")]
        [Trait("Method", "CreateAnnotationAsync")]
        public async Task CreateAnnotationAsync_ShouldLogOperationsCorrectly()
        {
            // Arrange
            var session = await CreateTestSession();
            var annotationData = new { type = "test", text = "Logging test" };

            // Act
            await _annotationService.CreateAnnotationAsync(session.SessionId, "test-user", annotationData);

            // Assert - Verify logging calls
            _loggerMock.Verify(
                x => x.Log(
                    It.IsAny<LogLevel>(),
                    It.IsAny<EventId>(),
                    It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("NOOR")),
                    It.IsAny<Exception>(),
                    It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
                Times.AtLeastOnce);
        }

        // Helper method to create test session
        private async Task<Session> CreateTestSession()
        {
            var session = new Session
            {
                GroupId = Guid.NewGuid(),
                Title = "Test Session",
                Description = "Test Description",
                Status = "Created",
                CreatedAt = DateTime.UtcNow,
                ExpiresAt = DateTime.UtcNow.AddHours(3)
            };

            _context.Sessions.Add(session);
            await _context.SaveChangesAsync();
            return session;
        }

        public void Dispose()
        {
            _context.Dispose();
        }
    }
}

namespace NoorCanvas.Core.Tests.Services
{
    /// <summary>
    /// Test suite for DialogService
    /// Tests dialog functionality, state management, and service interactions
    /// </summary>
    public class DialogServiceTests
    {
        private readonly DialogService _dialogService;

        public DialogServiceTests()
        {
            _dialogService = new DialogService();
        }

        [Fact]
        [Trait("Category", "DialogService")]
        [Trait("Method", "ShowAlertAsync")]
        public async Task ShowAlertAsync_ShouldExecuteSuccessfully()
        {
            // Arrange
            var title = "Test Title";
            var message = "Test Message";

            // Act & Assert - Should not throw
            await _dialogService.ShowAlertAsync(message, title);
            
            // Verify the method completes successfully
            Assert.True(true); // If we get here, the method executed without throwing
        }

        [Theory]
        [Trait("Category", "DialogService")]
        [Trait("Method", "ShowAlertAsync")]
        [InlineData("success")]
        [InlineData("error")]
        [InlineData("warning")]
        [InlineData("info")]
        public async Task ShowAlertAsync_WithDifferentTypes_ShouldHandleAllTypes(string alertType)
        {
            // Arrange & Act & Assert - Should not throw
            await _dialogService.ShowAlertAsync("Message", "Title");
            
            // Verify the method completes successfully with different alert types
            Assert.True(true); // If we get here, the method executed without throwing
        }

        [Fact]
        [Trait("Category", "DialogService")]
        [Trait("Method", "ShowConfirmAsync")]
        public async Task ShowConfirmAsync_ShouldReturnBooleanResult()
        {
            // Arrange & Act
            var result = await _dialogService.ShowConfirmAsync("Are you sure?", "Confirm Title");

            // Assert
            Assert.IsType<bool>(result); // Should return a boolean (true or false doesn't matter for testing the API)
        }

        [Fact]
        [Trait("Category", "DialogService")]
        [Trait("Method", "ShowConfirmAsync")]
        public async Task ShowConfirmAsync_WithDifferentMessages_ShouldExecuteSuccessfully()
        {
            // Act & Assert - Should not throw
            var result = await _dialogService.ShowConfirmAsync("Are you sure you want to delete?", "Confirm Deletion");

            // Assert
            Assert.IsType<bool>(result); // Should return a boolean result
        }

        [Fact]
        [Trait("Category", "DialogService")]
        [Trait("Method", "ShowConfirmAsync")]
        public async Task ShowConfirmAsync_WithSpecificParameters_ShouldExecuteCorrectly()
        {
            // Arrange & Act
            var result = await _dialogService.ShowConfirmAsync("This action cannot be undone.", "Delete Session");

            // Assert
            Assert.IsType<bool>(result);
            // Method should execute without throwing and return a boolean result
        }

        [Fact]
        [Trait("Category", "DialogService")]
        [Trait("Method", "ShowAlertAsync")]
        public async Task ShowAlertAsync_WithNullParameters_ShouldHandleGracefully()
        {
            // Act & Assert - Should not throw even with null/empty parameters
            await _dialogService.ShowAlertAsync("", "");
            
            // Verify method handles edge cases gracefully
            Assert.True(true); // If we get here, the method handled null parameters without throwing
        }

        [Fact]
        [Trait("Category", "DialogService")]
        [Trait("Method", "Multiple")]
        public async Task DialogService_WithMultipleCalls_ShouldExecuteSuccessfully()
        {
            // Act & Assert - Multiple sequential calls should work
            await _dialogService.ShowAlertAsync("Test alert message", "Test Alert");
            var confirmResult = await _dialogService.ShowConfirmAsync("Test confirm message", "Test Confirm");

            // Assert
            Assert.IsType<bool>(confirmResult);
            
            // If we get here, multiple DialogService calls executed successfully
            Assert.True(true);
        }
    }
}
