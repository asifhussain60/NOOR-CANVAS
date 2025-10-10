using OpenAI;
using OpenAI.Chat;

namespace NoorCanvas.Services;

/// <summary>
/// Service for extracting UI/UX requirements from annotated screenshots using GPT-4 Vision API.
/// Supports AI-powered task extraction from visual mockups with annotations (arrows, text overlays, markup).
/// </summary>
public interface IScreenshotAnalysisService
{
    /// <summary>
    /// Extracts actionable requirements from an annotated screenshot image.
    /// </summary>
    /// <param name="imagePath">Absolute or relative path to the screenshot image file.</param>
    /// <param name="additionalContext">Optional context to guide extraction (e.g., "Focus on layout changes").</param>
    /// <returns>List of extracted requirements as structured task descriptions.</returns>
    Task<List<string>> ExtractRequirementsAsync(string imagePath, string? additionalContext = null);

    /// <summary>
    /// Validates that the service is properly configured with API credentials.
    /// </summary>
    /// <returns>True if configured correctly, false otherwise.</returns>
    bool IsConfigured();
}

/// <summary>
/// Implementation of screenshot analysis service using OpenAI GPT-4 Vision.
/// </summary>
public class ScreenshotAnalysisService : IScreenshotAnalysisService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<ScreenshotAnalysisService> _logger;
    private readonly OpenAIClient? _openAiClient;
    private readonly string? _modelName;

    /// <summary>
    /// Initializes a new instance of the <see cref="ScreenshotAnalysisService"/> class.
    /// </summary>
    /// <param name="configuration">Application configuration.</param>
    /// <param name="logger">Logger instance.</param>
    public ScreenshotAnalysisService(
        IConfiguration configuration,
        ILogger<ScreenshotAnalysisService> logger)
    {
        _configuration = configuration;
        _logger = logger;

        var apiKey = _configuration["OpenAI:ApiKey"];
        _modelName = _configuration["OpenAI:VisionDeploymentName"] ?? "gpt-4o";

        if (!string.IsNullOrWhiteSpace(apiKey))
        {
            _openAiClient = new OpenAIClient(apiKey);
            _logger.LogInformation("ScreenshotAnalysisService initialized with model: {Model}", _modelName);
        }
        else
        {
            _logger.LogWarning("OpenAI API key not configured. Screenshot analysis features will be disabled.");
        }
    }

    /// <summary>
    /// Checks if the service is properly configured.
    /// </summary>
    /// <returns>True if configured, false otherwise.</returns>
    public bool IsConfigured()
    {
        return _openAiClient != null && !string.IsNullOrWhiteSpace(_modelName);
    }

    /// <summary>
    /// Extracts requirements from an annotated screenshot.
    /// </summary>
    /// <param name="imagePath">Path to the screenshot file.</param>
    /// <param name="additionalContext">Optional additional context.</param>
    /// <returns>List of extracted requirements.</returns>
    public async Task<List<string>> ExtractRequirementsAsync(string imagePath, string? additionalContext = null)
    {
        if (!IsConfigured())
        {
            _logger.LogError("Cannot extract requirements: OpenAI API not configured");
            throw new InvalidOperationException("OpenAI API key not configured. Please add OpenAI:ApiKey to appsettings.json");
        }

        if (!File.Exists(imagePath))
        {
            _logger.LogError("Screenshot file not found: {ImagePath}", imagePath);
            throw new FileNotFoundException($"Screenshot file not found: {imagePath}");
        }

        try
        {
            _logger.LogInformation("Extracting requirements from screenshot: {ImagePath}", imagePath);

            // Read image as base64
            byte[] imageBytes = await File.ReadAllBytesAsync(imagePath);
            string base64Image = Convert.ToBase64String(imageBytes);
            string extension = Path.GetExtension(imagePath).ToLowerInvariant();
            string mimeType = extension switch
            {
                ".png" => "image/png",
                ".jpg" or ".jpeg" => "image/jpeg",
                ".gif" => "image/gif",
                ".bmp" => "image/bmp",
                ".webp" => "image/webp",
                _ => "image/png"
            };

            string dataUrl = $"data:{mimeType};base64,{base64Image}";

            // Build prompt for GPT-4 Vision
            string systemPrompt = @"You are an expert UI/UX analyst. Analyze annotated screenshots and extract actionable development requirements.

IMPORTANT: Focus on visual annotations like:
- Red/colored arrows pointing to specific elements
- Text overlays describing changes (e.g., ""Make logo 250px × 250px"")
- Highlighted areas indicating modifications
- Markup annotations with measurements or specifications

Extract each requirement as a separate, clear, actionable task.
Format: Return ONLY a numbered list of tasks, one per line. No additional commentary.

Example output format:
1. Center the logo above the title and make it 250px × 250px
2. Increase height of canvas div to a fixed height suitable for accommodating shareable assets
3. Make the sidebar responsive on mobile devices";

            string userPrompt = "Extract all UI/UX requirements from this annotated screenshot.";
            if (!string.IsNullOrWhiteSpace(additionalContext))
            {
                userPrompt += $"\n\nAdditional context: {additionalContext}";
            }

            var chatClient = _openAiClient!.GetChatClient(_modelName!);

            var messages = new List<ChatMessage>
            {
                new SystemChatMessage(systemPrompt),
                new UserChatMessage(
                    ChatMessageContentPart.CreateTextPart(userPrompt),
                    ChatMessageContentPart.CreateImagePart(new Uri(dataUrl)))
            };

            var response = await chatClient.CompleteChatAsync(messages);
            var content = response.Value.Content[0].Text;

            _logger.LogInformation("GPT-4 Vision response received: {Content}", content);

            // Parse the response into individual requirements
            var requirements = ParseRequirementsFromResponse(content);

            _logger.LogInformation("Extracted {Count} requirements from screenshot", requirements.Count);

            return requirements;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error extracting requirements from screenshot: {ImagePath}", imagePath);
            throw;
        }
    }

    private List<string> ParseRequirementsFromResponse(string response)
    {
        var requirements = new List<string>();

        if (string.IsNullOrWhiteSpace(response))
        {
            return requirements;
        }

        // Split by lines and extract numbered items
        var lines = response.Split('\n', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

        foreach (var line in lines)
        {
            // Match patterns like "1. Task description" or "- Task description"
            var trimmedLine = line.Trim();

            // Remove leading numbers, bullets, or dashes
            var cleaned = System.Text.RegularExpressions.Regex.Replace(
                trimmedLine,
                @"^[\d\.\-\*\•]+\s*",
                string.Empty).Trim();

            if (!string.IsNullOrWhiteSpace(cleaned))
            {
                requirements.Add(cleaned);
            }
        }

        return requirements;
    }
}
