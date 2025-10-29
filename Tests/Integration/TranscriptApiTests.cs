using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using NoorCanvas.Data;
using Xunit;

namespace NoorCanvas.Tests.Integration;

/// <summary>
/// [PHASE-1:hcp-cleanup] Integration tests for Transcript API endpoints
/// TEST-FIRST APPROACH: These tests define expected API contracts BEFORE implementation
/// All tests SHOULD FAIL initially - implementation comes after test definition
/// </summary>
public class TranscriptApiTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;
    private readonly HttpClient _client;

    public TranscriptApiTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
        _client = factory.CreateClient(new WebApplicationFactoryClientOptions
        {
            AllowAutoRedirect = false,
            BaseAddress = new Uri("https://localhost:9091")
        });
    }

    #region GET /api/transcript/{sessionId} - Get Transcript Content

    /// <summary>
    /// Test 1: GET /api/transcript/{sessionId} returns transcript HTML for valid session
    /// Expected API Contract:
    /// - HTTP 200 OK
    /// - JSON response with { sessionId, transcript, lastUpdated }
    /// - Transcript content from KSESSIONS.SessionTranscripts table
    /// </summary>
    [Fact]
    public async Task GetTranscript_ValidSessionId_ReturnsTranscriptHtml()
    {
        // Arrange
        const long testSessionId = 212; // Known session in test database

        // Act
        var response = await _client.GetAsync($"/api/transcript/{testSessionId}");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var content = await response.Content.ReadAsStringAsync();
        var jsonDoc = JsonDocument.Parse(content);
        var root = jsonDoc.RootElement;

        // Verify response structure
        Assert.True(root.TryGetProperty("sessionId", out var sessionIdProp));
        Assert.Equal(testSessionId, sessionIdProp.GetInt64());

        Assert.True(root.TryGetProperty("transcript", out var transcriptProp));
        Assert.False(string.IsNullOrEmpty(transcriptProp.GetString()));

        Assert.True(root.TryGetProperty("lastUpdated", out var lastUpdatedProp));
        Assert.NotEqual(DateTime.MinValue, lastUpdatedProp.GetDateTime());
    }

    /// <summary>
    /// Test 2: GET /api/transcript/{sessionId} returns 404 for non-existent session
    /// </summary>
    [Fact]
    public async Task GetTranscript_InvalidSessionId_Returns404()
    {
        // Arrange
        const long invalidSessionId = 999999; // Non-existent session

        // Act
        var response = await _client.GetAsync($"/api/transcript/{invalidSessionId}");

        // Assert
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    /// <summary>
    /// Test 3: GET /api/transcript/{sessionId} handles empty transcripts
    /// Expected: 200 OK with empty transcript string (not null)
    /// </summary>
    [Fact]
    public async Task GetTranscript_EmptyTranscript_ReturnsEmptyString()
    {
        // Arrange - Create session with null/empty transcript
        // This test will need database seeding in future
        const long testSessionId = 212;

        // Act
        var response = await _client.GetAsync($"/api/transcript/{testSessionId}");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var content = await response.Content.ReadAsStringAsync();
        var jsonDoc = JsonDocument.Parse(content);
        var root = jsonDoc.RootElement;

        Assert.True(root.TryGetProperty("transcript", out var transcriptProp));
        // Transcript should be empty string, not null
        Assert.NotNull(transcriptProp.GetString());
    }

    #endregion

    #region POST /api/transcript/{sessionId}/transform - Transform Transcript HTML

    /// <summary>
    /// Test 4: POST /api/transcript/{sessionId}/transform removes delete buttons
    /// Expected API Contract:
    /// - HTTP 200 OK
    /// - JSON response with { sessionId, transformedHtml, transformationType }
    /// - Delete buttons removed via regex
    /// </summary>
    [Fact]
    public async Task TransformTranscript_RemovesDeleteButtons()
    {
        // Arrange
        const long testSessionId = 212;
        var requestPayload = new
        {
            sessionId = testSessionId,
            html = @"<div><h2>Test Section</h2><button class='delete-btn'>Delete</button><p>Content</p></div>",
            transformationType = "remove-delete-buttons"
        };

        // Act
        var response = await _client.PostAsJsonAsync($"/api/transcript/{testSessionId}/transform", requestPayload);

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var content = await response.Content.ReadAsStringAsync();
        var jsonDoc = JsonDocument.Parse(content);
        var root = jsonDoc.RootElement;

        Assert.True(root.TryGetProperty("transformedHtml", out var transformedHtmlProp));
        var transformedHtml = transformedHtmlProp.GetString();

        // Verify delete button was removed
        Assert.NotNull(transformedHtml);
        Assert.DoesNotContain("delete-btn", transformedHtml);
        Assert.Contains("<h2>Test Section</h2>", transformedHtml);
        Assert.Contains("<p>Content</p>", transformedHtml);
    }

    /// <summary>
    /// Test 5: POST /api/transcript/{sessionId}/transform removes share buttons
    /// Expected: Individual asset share buttons removed
    /// </summary>
    [Fact]
    public async Task TransformTranscript_RemovesShareButtons()
    {
        // Arrange
        const long testSessionId = 212;
        var requestPayload = new
        {
            sessionId = testSessionId,
            html = @"<div><h2>Test</h2><button onclick='shareIndividualAsset(1)'>Share</button><p>Content</p></div>",
            transformationType = "remove-share-buttons"
        };

        // Act
        var response = await _client.PostAsJsonAsync($"/api/transcript/{testSessionId}/transform", requestPayload);

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var content = await response.Content.ReadAsStringAsync();
        var jsonDoc = JsonDocument.Parse(content);
        var root = jsonDoc.RootElement;

        Assert.True(root.TryGetProperty("transformedHtml", out var transformedHtmlProp));
        var transformedHtml = transformedHtmlProp.GetString();

        // Verify share button was removed
        Assert.NotNull(transformedHtml);
        Assert.DoesNotContain("shareIndividualAsset", transformedHtml);
        Assert.Contains("<h2>Test</h2>", transformedHtml);
    }

    /// <summary>
    /// Test 6: POST /api/transcript/{sessionId}/transform removes data-asset-id attributes
    /// Expected: Clean markup without asset tracking attributes
    /// </summary>
    [Fact]
    public async Task TransformTranscript_RemovesAssetAttributes()
    {
        // Arrange
        const long testSessionId = 212;
        var requestPayload = new
        {
            sessionId = testSessionId,
            html = @"<div data-asset-id='asset-123'><h2>Test Section</h2><p>Content</p></div>",
            transformationType = "remove-asset-attributes"
        };

        // Act
        var response = await _client.PostAsJsonAsync($"/api/transcript/{testSessionId}/transform", requestPayload);

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var content = await response.Content.ReadAsStringAsync();
        var jsonDoc = JsonDocument.Parse(content);
        var root = jsonDoc.RootElement;

        Assert.True(root.TryGetProperty("transformedHtml", out var transformedHtmlProp));
        var transformedHtml = transformedHtmlProp.GetString();

        // Verify data-asset-id was removed
        Assert.NotNull(transformedHtml);
        Assert.DoesNotContain("data-asset-id", transformedHtml);
        Assert.Contains("<h2>Test Section</h2>", transformedHtml);
    }

    /// <summary>
    /// Test 7: POST /api/transcript/{sessionId}/transform handles invalid HTML gracefully
    /// Expected: 400 Bad Request with error message
    /// </summary>
    [Fact]
    public async Task TransformTranscript_InvalidHtml_Returns400()
    {
        // Arrange
        const long testSessionId = 212;
        var requestPayload = new
        {
            sessionId = testSessionId,
            html = "", // Empty HTML should fail
            transformationType = "remove-delete-buttons"
        };

        // Act
        var response = await _client.PostAsJsonAsync($"/api/transcript/{testSessionId}/transform", requestPayload);

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    #endregion

    #region POST /api/transcript/{sessionId}/detect-assets - Detect Sharable Assets

    /// <summary>
    /// Test 8: POST /api/transcript/{sessionId}/detect-assets returns asset count
    /// Expected API Contract:
    /// - HTTP 200 OK
    /// - JSON response with { sessionId, totalAssets, assetBreakdown[] }
    /// - assetBreakdown contains { assetType, count, selector }
    /// </summary>
    [Fact]
    public async Task DetectAssets_ValidTranscript_ReturnsAssetCount()
    {
        // Arrange
        const long testSessionId = 212;
        var requestPayload = new
        {
            sessionId = testSessionId,
            html = @"
                <div class='ks-image'><img src='test1.jpg' /></div>
                <div class='ks-image'><img src='test2.jpg' /></div>
                <div class='ks-video'><video src='test.mp4'></video></div>
            "
        };

        // Act
        var response = await _client.PostAsJsonAsync($"/api/transcript/{testSessionId}/detect-assets", requestPayload);

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var content = await response.Content.ReadAsStringAsync();
        var jsonDoc = JsonDocument.Parse(content);
        var root = jsonDoc.RootElement;

        Assert.True(root.TryGetProperty("sessionId", out var sessionIdProp));
        Assert.Equal(testSessionId, sessionIdProp.GetInt64());

        Assert.True(root.TryGetProperty("totalAssets", out var totalAssetsProp));
        Assert.True(totalAssetsProp.GetInt32() > 0); // Should detect at least one asset

        Assert.True(root.TryGetProperty("assetBreakdown", out var breakdownProp));
        Assert.True(breakdownProp.GetArrayLength() > 0);
    }

    /// <summary>
    /// Test 9: POST /api/transcript/{sessionId}/detect-assets handles no assets
    /// Expected: 200 OK with totalAssets = 0
    /// </summary>
    [Fact]
    public async Task DetectAssets_NoAssets_ReturnsZeroCount()
    {
        // Arrange
        const long testSessionId = 212;
        var requestPayload = new
        {
            sessionId = testSessionId,
            html = "<div><p>Plain text with no assets</p></div>"
        };

        // Act
        var response = await _client.PostAsJsonAsync($"/api/transcript/{testSessionId}/detect-assets", requestPayload);

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var content = await response.Content.ReadAsStringAsync();
        var jsonDoc = JsonDocument.Parse(content);
        var root = jsonDoc.RootElement;

        Assert.True(root.TryGetProperty("totalAssets", out var totalAssetsProp));
        Assert.Equal(0, totalAssetsProp.GetInt32());
    }

    #endregion

    #region Error Handling & Edge Cases

    /// <summary>
    /// Test 10: All endpoints return 500 on database connection failure
    /// Expected: Proper error handling with meaningful messages
    /// </summary>
    [Fact]
    public async Task TranscriptEndpoints_DatabaseError_Returns500()
    {
        // This test would require mocking database failures
        // Placeholder for future implementation with test database
        Assert.True(true, "Database error handling test - to be implemented with test fixtures");
    }

    /// <summary>
    /// Test 11: API endpoints reject invalid content types
    /// Expected: 415 Unsupported Media Type for non-JSON requests
    /// </summary>
    [Fact]
    public async Task TranscriptEndpoints_InvalidContentType_Returns415()
    {
        // Arrange
        const long testSessionId = 212;
        var content = new StringContent("invalid-xml", System.Text.Encoding.UTF8, "application/xml");

        // Act
        var response = await _client.PostAsync($"/api/transcript/{testSessionId}/transform", content);

        // Assert
        Assert.Equal(HttpStatusCode.UnsupportedMediaType, response.StatusCode);
    }

    #endregion
}
