using System;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Microsoft.JSInterop;
using Moq;
using NoorCanvas.Services.SignalR;
using NoorCanvas.ViewModels;
using Xunit;

namespace NoorCanvas.Tests.Unit.Services.SignalR;

/// <summary>
/// Unit tests for HostSignalREventHandler service
/// [REFACTOR:Phase2] TDD approach - tests created before integration
/// </summary>
public class HostSignalREventHandlerTests
{
    private readonly Mock<ILogger<HostSignalREventHandler>> _mockLogger;
    private readonly Mock<IJSRuntime> _mockJSRuntime;
    private readonly HostSignalREventHandler _handler;

    public HostSignalREventHandlerTests()
    {
        _mockLogger = new Mock<ILogger<HostSignalREventHandler>>();
        _mockJSRuntime = new Mock<IJSRuntime>();
        _handler = new HostSignalREventHandler(_mockLogger.Object, _mockJSRuntime.Object);
    }

    #region HandleQuestionReceivedAsync Tests

    [Fact]
    public async Task HandleQuestionReceivedAsync_ValidData_InvokesCallback()
    {
        // Arrange
        var questionId = Guid.NewGuid();
        var questionData = new
        {
            questionId = questionId.ToString(),
            text = "What is the meaning of Tawheed?",
            userName = "Ahmad",
            userId = "user-123",
            submittedAt = DateTime.UtcNow,
            votes = 5
        };

        QuestionItem? capturedQuestion = null;
        Task OnQuestionAdded(QuestionItem q)
        {
            capturedQuestion = q;
            return Task.CompletedTask;
        }

        // Act
        await _handler.HandleQuestionReceivedAsync(questionData, OnQuestionAdded);

        // Assert
        Assert.NotNull(capturedQuestion);
        Assert.Equal(questionId, capturedQuestion.Id);
        Assert.Equal("What is the meaning of Tawheed?", capturedQuestion.Text);
        Assert.Equal("Ahmad", capturedQuestion.UserName);
        Assert.Equal("user-123", capturedQuestion.CreatedBy);
        Assert.Equal(5, capturedQuestion.VoteCount);
        Assert.False(capturedQuestion.IsAnswered);
    }

    [Fact]
    public async Task HandleQuestionReceivedAsync_NullData_DoesNotInvokeCallback()
    {
        // Arrange
        var callbackInvoked = false;
        Task OnQuestionAdded(QuestionItem q)
        {
            callbackInvoked = true;
            return Task.CompletedTask;
        }

        // Act
        await _handler.HandleQuestionReceivedAsync(null, OnQuestionAdded);

        // Assert
        Assert.False(callbackInvoked);
    }

    [Fact]
    public async Task HandleQuestionReceivedAsync_MissingQuestionId_DoesNotInvokeCallback()
    {
        // Arrange
        var questionData = new
        {
            text = "Test question?",
            userName = "TestUser"
        };

        var callbackInvoked = false;
        Task OnQuestionAdded(QuestionItem q)
        {
            callbackInvoked = true;
            return Task.CompletedTask;
        }

        // Act
        await _handler.HandleQuestionReceivedAsync(questionData, OnQuestionAdded);

        // Assert
        Assert.False(callbackInvoked);
    }

    [Fact]
    public async Task HandleQuestionReceivedAsync_MissingText_DoesNotInvokeCallback()
    {
        // Arrange
        var questionData = new
        {
            questionId = Guid.NewGuid().ToString(),
            userName = "TestUser"
        };

        var callbackInvoked = false;
        Task OnQuestionAdded(QuestionItem q)
        {
            callbackInvoked = true;
            return Task.CompletedTask;
        }

        // Act
        await _handler.HandleQuestionReceivedAsync(questionData, OnQuestionAdded);

        // Assert
        Assert.False(callbackInvoked);
    }

    [Fact]
    public async Task HandleQuestionReceivedAsync_NullCallback_DoesNotThrow()
    {
        // Arrange
        var questionData = new
        {
            questionId = Guid.NewGuid().ToString(),
            text = "Test question?",
            userName = "TestUser"
        };

        // Act & Assert (should not throw)
        await _handler.HandleQuestionReceivedAsync(questionData, null);
    }

    #endregion

    #region HandleTranscriptUpdatedAsync Tests

    [Fact]
    public async Task HandleTranscriptUpdatedAsync_ValidTranscript_InvokesCallback()
    {
        // Arrange
        var transcript = "This is the updated transcript content.";
        string? capturedTranscript = null;

        Task OnTranscriptUpdated(string t)
        {
            capturedTranscript = t;
            return Task.CompletedTask;
        }

        // Act
        await _handler.HandleTranscriptUpdatedAsync(transcript, OnTranscriptUpdated);

        // Assert
        Assert.Equal(transcript, capturedTranscript);
    }

    [Fact]
    public async Task HandleTranscriptUpdatedAsync_EmptyTranscript_InvokesCallback()
    {
        // Arrange
        var transcript = "";
        string? capturedTranscript = null;

        Task OnTranscriptUpdated(string t)
        {
            capturedTranscript = t;
            return Task.CompletedTask;
        }

        // Act
        await _handler.HandleTranscriptUpdatedAsync(transcript, OnTranscriptUpdated);

        // Assert
        Assert.Equal("", capturedTranscript);
    }

    [Fact]
    public async Task HandleTranscriptUpdatedAsync_NullCallback_DoesNotThrow()
    {
        // Arrange
        var transcript = "Test transcript";

        // Act & Assert (should not throw)
        await _handler.HandleTranscriptUpdatedAsync(transcript, null);
    }

    #endregion

    #region HandleVoteUpdateReceivedAsync Tests

    [Fact]
    public async Task HandleVoteUpdateReceivedAsync_ValidData_InvokesCallback()
    {
        // Arrange
        var questionText = "What is Salat?";
        var voteCount = 42;
        string? capturedText = null;
        int? capturedVoteCount = null;

        Task OnVoteUpdated(string text, int votes)
        {
            capturedText = text;
            capturedVoteCount = votes;
            return Task.CompletedTask;
        }

        // Act
        await _handler.HandleVoteUpdateReceivedAsync(questionText, voteCount, OnVoteUpdated);

        // Assert
        Assert.Equal(questionText, capturedText);
        Assert.Equal(voteCount, capturedVoteCount);
    }

    [Fact]
    public async Task HandleVoteUpdateReceivedAsync_NullCallback_DoesNotThrow()
    {
        // Arrange
        var questionText = "Test?";
        var voteCount = 10;

        // Act & Assert (should not throw)
        await _handler.HandleVoteUpdateReceivedAsync(questionText, voteCount, null);
    }

    #endregion

    #region HandleHostQuestionUpdatedAsync Tests

    [Fact]
    public async Task HandleHostQuestionUpdatedAsync_ValidData_InvokesCallback()
    {
        // Arrange
        var questionId = Guid.NewGuid();
        var questionData = new
        {
            questionId = questionId.ToString(),
            text = "Updated question text"
        };

        QuestionItem? capturedQuestion = null;
        Task OnQuestionUpdated(QuestionItem q)
        {
            capturedQuestion = q;
            return Task.CompletedTask;
        }

        // Act
        await _handler.HandleHostQuestionUpdatedAsync(questionData, OnQuestionUpdated);

        // Assert
        Assert.NotNull(capturedQuestion);
        Assert.Equal(questionId, capturedQuestion.Id);
        Assert.Equal("Updated question text", capturedQuestion.Text);
    }

    [Fact]
    public async Task HandleHostQuestionUpdatedAsync_NullData_DoesNotInvokeCallback()
    {
        // Arrange
        var callbackInvoked = false;
        Task OnQuestionUpdated(QuestionItem q)
        {
            callbackInvoked = true;
            return Task.CompletedTask;
        }

        // Act
        await _handler.HandleHostQuestionUpdatedAsync(null, OnQuestionUpdated);

        // Assert
        Assert.False(callbackInvoked);
    }

    [Fact]
    public async Task HandleHostQuestionUpdatedAsync_MissingQuestionId_DoesNotInvokeCallback()
    {
        // Arrange
        var questionData = new
        {
            text = "Updated text"
        };

        var callbackInvoked = false;
        Task OnQuestionUpdated(QuestionItem q)
        {
            callbackInvoked = true;
            return Task.CompletedTask;
        }

        // Act
        await _handler.HandleHostQuestionUpdatedAsync(questionData, OnQuestionUpdated);

        // Assert
        Assert.False(callbackInvoked);
    }

    [Fact]
    public async Task HandleHostQuestionUpdatedAsync_MissingText_DoesNotInvokeCallback()
    {
        // Arrange
        var questionData = new
        {
            questionId = Guid.NewGuid().ToString()
        };

        var callbackInvoked = false;
        Task OnQuestionUpdated(QuestionItem q)
        {
            callbackInvoked = true;
            return Task.CompletedTask;
        }

        // Act
        await _handler.HandleHostQuestionUpdatedAsync(questionData, OnQuestionUpdated);

        // Assert
        Assert.False(callbackInvoked);
    }

    #endregion

    #region HandleHostQuestionDeletedAsync Tests

    [Fact]
    public async Task HandleHostQuestionDeletedAsync_ValidData_InvokesCallback()
    {
        // Arrange
        var questionId = Guid.NewGuid();
        var deleteData = new
        {
            questionId = questionId.ToString(),
            sessionId = 123
        };

        Guid? capturedQuestionId = null;
        Task OnQuestionDeleted(Guid id)
        {
            capturedQuestionId = id;
            return Task.CompletedTask;
        }

        // Act
        await _handler.HandleHostQuestionDeletedAsync(deleteData, OnQuestionDeleted);

        // Assert
        Assert.Equal(questionId, capturedQuestionId);
    }

    [Fact]
    public async Task HandleHostQuestionDeletedAsync_NullData_DoesNotInvokeCallback()
    {
        // Arrange
        var callbackInvoked = false;
        Task OnQuestionDeleted(Guid id)
        {
            callbackInvoked = true;
            return Task.CompletedTask;
        }

        // Act
        await _handler.HandleHostQuestionDeletedAsync(null, OnQuestionDeleted);

        // Assert
        Assert.False(callbackInvoked);
    }

    [Fact]
    public async Task HandleHostQuestionDeletedAsync_MissingQuestionId_DoesNotInvokeCallback()
    {
        // Arrange
        var deleteData = new
        {
            sessionId = 123
        };

        var callbackInvoked = false;
        Task OnQuestionDeleted(Guid id)
        {
            callbackInvoked = true;
            return Task.CompletedTask;
        }

        // Act
        await _handler.HandleHostQuestionDeletedAsync(deleteData, OnQuestionDeleted);

        // Assert
        Assert.False(callbackInvoked);
    }

    [Fact]
    public async Task HandleHostQuestionDeletedAsync_InvalidGuidFormat_DoesNotInvokeCallback()
    {
        // Arrange
        var deleteData = new
        {
            questionId = "not-a-valid-guid",
            sessionId = 123
        };

        var callbackInvoked = false;
        Task OnQuestionDeleted(Guid id)
        {
            callbackInvoked = true;
            return Task.CompletedTask;
        }

        // Act
        await _handler.HandleHostQuestionDeletedAsync(deleteData, OnQuestionDeleted);

        // Assert
        Assert.False(callbackInvoked);
    }

    #endregion

    #region Error Handling Tests

    [Fact]
    public async Task HandleQuestionReceivedAsync_CallbackThrows_LogsError()
    {
        // Arrange
        var questionData = new
        {
            questionId = Guid.NewGuid().ToString(),
            text = "Test?",
            userName = "TestUser"
        };

        Task OnQuestionAdded(QuestionItem q)
        {
            throw new InvalidOperationException("Test exception");
        }

        // Act
        await _handler.HandleQuestionReceivedAsync(questionData, OnQuestionAdded);

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

    [Fact]
    public async Task HandleTranscriptUpdatedAsync_CallbackThrows_LogsError()
    {
        // Arrange
        var transcript = "Test transcript";

        Task OnTranscriptUpdated(string t)
        {
            throw new InvalidOperationException("Test exception");
        }

        // Act
        await _handler.HandleTranscriptUpdatedAsync(transcript, OnTranscriptUpdated);

        // Assert
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Error,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Exception processing TranscriptUpdated")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    [Fact]
    public async Task HandleVoteUpdateReceivedAsync_CallbackThrows_LogsError()
    {
        // Arrange
        var questionText = "Test?";
        var voteCount = 5;

        Task OnVoteUpdated(string text, int votes)
        {
            throw new InvalidOperationException("Test exception");
        }

        // Act
        await _handler.HandleVoteUpdateReceivedAsync(questionText, voteCount, OnVoteUpdated);

        // Assert
        _mockLogger.Verify(
            x => x.Log(
                LogLevel.Error,
                It.IsAny<EventId>(),
                It.Is<It.IsAnyType>((v, t) => v.ToString()!.Contains("Exception processing VoteUpdateReceived")),
                It.IsAny<Exception>(),
                It.IsAny<Func<It.IsAnyType, Exception?, string>>()),
            Times.Once);
    }

    #endregion
}
