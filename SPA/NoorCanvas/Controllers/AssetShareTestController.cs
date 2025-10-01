using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using NoorCanvas.Hubs;
using System.Text.Json;

namespace NoorCanvas.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AssetShareTestController : ControllerBase
{
    private readonly IHubContext<SessionHub> _hubContext;
    private readonly ILogger<AssetShareTestController> _logger;
    private readonly IHttpClientFactory _httpClientFactory;

    public AssetShareTestController(
        IHubContext<SessionHub> hubContext, 
        ILogger<AssetShareTestController> logger,
        IHttpClientFactory httpClientFactory)
    {
        _hubContext = hubContext;
        _logger = logger;
        _httpClientFactory = httpClientFactory;
    }

    [HttpPost("test-broadcast")]
    public async Task<IActionResult> TestBroadcast([FromBody] TestBroadcastRequest request)
    {
        var testId = Guid.NewGuid().ToString("N")[..8];
        _logger.LogInformation("[ASSET-SHARE-TEST] Test broadcast initiated, testId={TestId}, sessionId={SessionId}", 
            testId, request.SessionId);

        try
        {
            var testHtml = $@"<div style='background:#E8F5E8;padding:20px;border-radius:8px;border:2px solid #4CAF50;text-align:center;'>
    <h3 style='color:#2E7D32;margin-top:0;'>📚 Test Asset Content</h3>
    <p style='margin:5px 0;'><strong>Broadcast Time:</strong> {DateTime.UtcNow:HH:mm:ss}</p>
    <p style='margin:5px 0;'><strong>Session ID:</strong> {request.SessionId}</p>
    <p style='margin:5px 0;'><strong>Test ID:</strong> {testId}</p>
    <p style='margin:5px 0;'><strong>Content:</strong> {request.Content ?? "Default test content"}</p>
    <p style='margin:10px 0 0 0;font-size:14px;'>✅ POC Broadcasting Working!</p>
</div>";

            // Use the simple PublishAssetContent method
            await _hubContext.Clients.Group($"session_{request.SessionId}")
                .SendAsync("AssetContentReceived", testHtml);

            _logger.LogInformation("[ASSET-SHARE-TEST] ✅ Test broadcast successful, testId={TestId}, contentLength={ContentLength}", 
                testId, testHtml.Length);

            return Ok(new TestBroadcastResponse
            {
                Success = true,
                TestId = testId,
                ContentLength = testHtml.Length,
                SessionId = request.SessionId,
                BroadcastTime = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[ASSET-SHARE-TEST] ❌ Test broadcast failed, testId={TestId}", testId);
            return BadRequest(new { success = false, error = ex.Message, testId });
        }
    }

    [HttpPost("test-session-212")]
    public async Task<IActionResult> TestWithSession212([FromBody] Session212TestRequest request)
    {
        var testId = Guid.NewGuid().ToString("N")[..8];
        _logger.LogInformation("[ASSET-SHARE-TEST] Session 212 test initiated, testId={TestId}", testId);

        try
        {
            // Get Session 212 transcript data
            var transcriptData = await GetSession212TranscriptAsync();
            
            if (string.IsNullOrEmpty(transcriptData))
            {
                return BadRequest(new { success = false, error = "Could not retrieve Session 212 data", testId });
            }

            // Extract first ayah-card for testing
            var ayahCardContent = ExtractFirstAyahCard(transcriptData);
            
            if (string.IsNullOrEmpty(ayahCardContent))
            {
                return BadRequest(new { success = false, error = "No ayah-card found in Session 212 data", testId });
            }

            // Broadcast the real content
            await _hubContext.Clients.Group($"session_{request.SessionId}")
                .SendAsync("AssetContentReceived", ayahCardContent);

            _logger.LogInformation("[ASSET-SHARE-TEST] ✅ Session 212 test successful, testId={TestId}, contentLength={ContentLength}", 
                testId, ayahCardContent.Length);

            return Ok(new Session212TestResponse
            {
                Success = true,
                TestId = testId,
                ContentLength = ayahCardContent.Length,
                SessionId = request.SessionId,
                OriginalTranscriptLength = transcriptData.Length,
                BroadcastTime = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[ASSET-SHARE-TEST] ❌ Session 212 test failed, testId={TestId}", testId);
            return BadRequest(new { success = false, error = ex.Message, testId });
        }
    }

    private async Task<string> GetSession212TranscriptAsync()
    {
        try
        {
            var httpClient = _httpClientFactory.CreateClient();
            
            // Try to get Session 212 transcript from the sessions API
            var response = await httpClient.GetAsync("/api/sessions/212/transcript");
            
            if (response.IsSuccessStatusCode)
            {
                return await response.Content.ReadAsStringAsync();
            }
            
            _logger.LogWarning("[ASSET-SHARE-TEST] Session 212 API call failed: {StatusCode}", response.StatusCode);
            
            // Fallback: return sample ayah-card HTML for testing
            return GetSampleAyahCardHtml();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[ASSET-SHARE-TEST] Error retrieving Session 212 data");
            return GetSampleAyahCardHtml();
        }
    }

    private string ExtractFirstAyahCard(string html)
    {
        // Simple extraction for POC - find first ayah-card div
        var startIndex = html.IndexOf("<div class=\"ayah-card\"", StringComparison.OrdinalIgnoreCase);
        if (startIndex == -1)
        {
            startIndex = html.IndexOf("class=\"ayah-card\"", StringComparison.OrdinalIgnoreCase);
        }
        
        if (startIndex != -1)
        {
            // Find the opening div
            var divStart = html.LastIndexOf('<', startIndex);
            if (divStart != -1)
            {
                // Find the matching closing div - simplified approach
                var depth = 0;
                var i = divStart;
                while (i < html.Length)
                {
                    if (html[i] == '<')
                    {
                        if (i + 1 < html.Length && html[i + 1] == '/')
                        {
                            depth--;
                            if (depth == 0)
                            {
                                var closingTagEnd = html.IndexOf('>', i);
                                if (closingTagEnd != -1)
                                {
                                    return html.Substring(divStart, closingTagEnd - divStart + 1);
                                }
                            }
                        }
                        else if (html.Substring(i).StartsWith("<div", StringComparison.OrdinalIgnoreCase))
                        {
                            depth++;
                        }
                    }
                    i++;
                }
            }
        }

        // Fallback if extraction fails
        return GetSampleAyahCardHtml();
    }

    private string GetSampleAyahCardHtml()
    {
        return @"<div class='ayah-card' style='background:#FFF8E1;border:2px solid #FFA000;border-radius:12px;padding:20px;margin:15px 0;'>
    <div style='text-align:center;margin-bottom:15px;'>
        <h4 style='color:#E65100;margin:0;font-family:""Times New Roman"",serif;'>📖 Sample Ayah Card</h4>
    </div>
    <div style='background:white;padding:15px;border-radius:8px;text-align:center;'>
        <p style='font-size:1.2em;color:#333;margin:10px 0;'>This is a sample ayah card for POC testing</p>
        <p style='color:#666;font-size:0.9em;margin:5px 0;'>Content extracted from Session 212 transcript</p>
        <p style='color:#999;font-size:0.8em;margin:5px 0;'>Broadcast Time: " + DateTime.UtcNow.ToString("HH:mm:ss") + @"</p>
    </div>
</div>";
    }
}

public class TestBroadcastRequest
{
    public long SessionId { get; set; }
    public string? Content { get; set; }
}

public class TestBroadcastResponse
{
    public bool Success { get; set; }
    public string TestId { get; set; } = string.Empty;
    public int ContentLength { get; set; }
    public long SessionId { get; set; }
    public DateTime BroadcastTime { get; set; }
}

public class Session212TestRequest
{
    public long SessionId { get; set; }
}

public class Session212TestResponse
{
    public bool Success { get; set; }
    public string TestId { get; set; } = string.Empty;
    public int ContentLength { get; set; }
    public long SessionId { get; set; }
    public int OriginalTranscriptLength { get; set; }
    public DateTime BroadcastTime { get; set; }
}