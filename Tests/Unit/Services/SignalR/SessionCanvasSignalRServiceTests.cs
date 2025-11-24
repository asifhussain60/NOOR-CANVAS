using System;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Microsoft.JSInterop;
using Moq;
using NoorCanvas.Pages;
using NoorCanvas.Services.SignalR;
using Xunit;

namespace NoorCanvas.Tests.Unit.Services.SignalR;

/// <summary>
/// Unit tests for SessionCanvasSignalRService
/// [REFACTOR:Phase3] TDD approach - tests created before implementation
/// </summary>
public class SessionCanvasSignalRServiceTests
{
    private readonly Mock<ILogger<SessionCanvasSignalRService>> _mockLogger;
    private readonly Mock<IJSRuntime> _mockJSRuntime;
    private readonly SessionCanvasSignalRService _service;

    public SessionCanvasSignalRServiceTests()
    {
        _mockLogger = new Mock<ILogger<SessionCanvasSignalRService>>();
        _mockJSRuntime = new Mock<IJSRuntime>();
        _service = new SessionCanvasSignalRService(_mockLogger.Object, _mockJSRuntime.Object);
    }

    #region HandleQuestionReceivedAsync Tests

    [Fact]
    public async Task HandleQuestionReceivedAsync_ValidData_InvokesCallback()
    {
        // Arrange
        var questionData = new
        {
            questionId = "123e4567-e89b-12d3-a456-426614174000",
            text = "What is Salah?",
            userName = "Fatima",
            userId = "user-456",
            votes = 3,
            submittedAt = DateTime.UtcNow,
            isAnswered = false
        };

        SessionCanvas.QuestionData? capturedQuestion = null;
        Task OnQuestionAdded(SessionCanvas.QuestionData q)
        {
            capturedQuestion = q;
            return Task.CompletedTask;
        }

        // Act
        await _service.HandleQuestionReceivedAsync(questionData, OnQuestionAdded);

        // Assert
        Assert.NotNull(capturedQuestion);
        Assert.Equal("123e4567-e89b-12d3-a456-426614174000", capturedQuestion.QuestionId);
        Assert.Equal("What is Salah?", capturedQuestion.Text);
        Assert.Equal("Fatima", capturedQuestion.UserName);
        Assert.Equal("user-456", capturedQuestion.CreatedBy);
        Assert.Equal(3, capturedQuestion.Votes);
        Assert.False(capturedQuestion.IsAnswered);
    }

    [Fact]
    public async Task HandleQuestionReceivedAsync_NullData_DoesNotInvokeCallback()
    {
        // Arrange
        var callbackInvoked = false;
        Task OnQuestionAdded(SessionCanvas.QuestionData q)
        {
            callbackInvoked = true;
            return Task.CompletedTask;
        }

        // Act
        await _service.HandleQuestionReceivedAsync(null, OnQuestionAdded);

        // Assert
        Assert.False(callbackInvoked);
    }

    #endregion

    #region HandleQuestionUpdatedAsync Tests

    [Fact]
    public async Task HandleQuestionUpdatedAsync_ValidData_InvokesCallback()
    {
        // Arrange
        var questionData = new
        {
            questionId = "question-123",
            text = "Updated question text",
            userName = "Ali"
        };

        SessionCanvas.QuestionData? capturedQuestion = null;
        Task OnQuestionUpdated(SessionCanvas.QuestionData q)
        {
            capturedQuestion = q;
            return Task.CompletedTask;
        }

        // Act
        await _service.HandleQuestionUpdatedAsync(questionData, OnQuestionUpdated);

        // Assert
        Assert.NotNull(capturedQuestion);
        Assert.Equal("question-123", capturedQuestion.QuestionId);
        Assert.Equal("Updated question text", capturedQuestion.Text);
    }

    [Fact]
    public async Task HandleQuestionUpdatedAsync_NullData_DoesNotInvokeCallback()
    {
        // Arrange
        var callbackInvoked = false;
        Task OnQuestionUpdated(SessionCanvas.QuestionData q)
        {
            callbackInvoked = true;
            return Task.CompletedTask;
        }

        // Act
        await _service.HandleQuestionUpdatedAsync(null, OnQuestionUpdated);

        // Assert
        Assert.False(callbackInvoked);
    }

    #endregion

    #region HandleQuestionDeletedAsync Tests

    [Fact]
    public async Task HandleQuestionDeletedAsync_ValidId_InvokesCallback()
    {
        // Arrange
        var questionId = "deleted-question-456";
        var data = new { questionId };
        string? capturedId = null;

        Task OnQuestionDeleted(string id, string? originalAskerGuid)
        {
            capturedId = id;
            return Task.CompletedTask;
        }

        // Act
        await _service.HandleQuestionDeletedAsync(data, OnQuestionDeleted);

        // Assert
        Assert.Equal(questionId, capturedId);
    }

    [Fact]
    public async Task HandleQuestionDeletedAsync_NullId_DoesNotInvokeCallback()
    {
        // Arrange
        var callbackInvoked = false;
        Task OnQuestionDeleted(string id, string? originalAskerGuid)
        {
            callbackInvoked = true;
            return Task.CompletedTask;
        }

        // Act
        await _service.HandleQuestionDeletedAsync(null!, OnQuestionDeleted);

        // Assert
        Assert.False(callbackInvoked);
    }

    #endregion

    #region HandleVoteUpdateAsync Tests

    [Fact]
    public async Task HandleVoteUpdateAsync_ValidData_InvokesCallback()
    {
        // Arrange
        var questionId = "voted-question-789";
        var voteCount = 15;
        var data = new { questionId, votes = voteCount };
        string? capturedId = null;
        int? capturedVotes = null;

        Task OnVoteUpdated(string id, int votes)
        {
            capturedId = id;
            capturedVotes = votes;
            return Task.CompletedTask;
        }

        // Act
        await _service.HandleVoteUpdateAsync(data, OnVoteUpdated);

        // Assert
        Assert.Equal(questionId, capturedId);
        Assert.Equal(voteCount, capturedVotes);
    }

    #endregion

    #region HandleAssetSharedAsync Tests

    [Fact]
    public async Task HandleAssetSharedAsync_ValidData_InvokesCallback()
    {
        // Arrange
        var htmlContent = "<div>Shared asset content</div>";
        var data = new { htmlContent };
        
        string? capturedHtml = null;

        Task OnAssetShared(string html)
        {
            capturedHtml = html;
            return Task.CompletedTask;
        }

        // Act
        await _service.HandleAssetSharedAsync(data, OnAssetShared);

        // Assert
        Assert.Equal(htmlContent, capturedHtml);
    }

    [Fact]
    public async Task HandleAssetSharedAsync_NullHtml_DoesNotInvokeCallback()
    {
        // Arrange
        var callbackInvoked = false;
        Task OnAssetShared(string html)
        {
            callbackInvoked = true;
            return Task.CompletedTask;
        }

        // Act
        await _service.HandleAssetSharedAsync(null!, OnAssetShared);

        // Assert
        Assert.False(callbackInvoked);
    }

    #endregion

    #region HandleTranscriptUpdatedAsync Tests

    [Fact]
    public async Task HandleTranscriptUpdatedAsync_ValidTranscript_InvokesCallback()
    {
        // Arrange
        var transcript = "Updated transcript content";
        string? capturedTranscript = null;

        Task OnTranscriptUpdated(string t)
        {
            capturedTranscript = t;
            return Task.CompletedTask;
        }

        // Act
        await _service.HandleTranscriptUpdatedAsync(transcript, OnTranscriptUpdated);

        // Assert
        Assert.Equal(transcript, capturedTranscript);
    }

    #endregion

    #region HandleSessionEndedAsync Tests

    [Fact]
    public async Task HandleSessionEndedAsync_ValidReason_InvokesCallback()
    {
        // Arrange
        var sessionId = 123;
        var data = new { sessionId };
        int? capturedSessionId = null;

        Task OnSessionEnded(int sId)
        {
            capturedSessionId = sId;
            return Task.CompletedTask;
        }

        // Act
        await _service.HandleSessionEndedAsync(data, OnSessionEnded);

        // Assert
        Assert.Equal(sessionId, capturedSessionId);
    }

    #endregion

    #region Error Handling Tests

    [Fact]
    public async Task HandleQuestionReceivedAsync_CallbackThrows_LogsError()
    {
        // Arrange
        var questionData = new
        {
            questionId = "123",
            text = "Test?",
            userName = "TestUser"
        };

        Task OnQuestionAdded(SessionCanvas.QuestionData q)
        {
            throw new InvalidOperationException("Test exception");
        }

        // Act
        await _service.HandleQuestionReceivedAsync(questionData, OnQuestionAdded);

        // Assert
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Error,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Exception processing QuestionReceived")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    #endregion
}
