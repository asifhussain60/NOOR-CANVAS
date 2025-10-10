using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Azure.AI.OpenAI;

namespace NoorCanvas.Services.Test
{
    /// <summary>
    /// Test program to validate screenshot requirement extraction
    /// </summary>
    class Program
    {
        static async Task Main(string[] args)
        {
            // Note: This is a test harness. You'll need to:
            // 1. Set OPENAI_API_KEY environment variable
            // 2. Save the screenshot as test-mockup.png in TEMP/test-screenshots/
            
            var apiKey = Environment.GetEnvironmentVariable("OPENAI_API_KEY");
            
            if (string.IsNullOrWhiteSpace(apiKey))
            {
                Console.WriteLine("ERROR: OPENAI_API_KEY environment variable not set");
                Console.WriteLine("Please set it with: $env:OPENAI_API_KEY = \"your-api-key-here\"");
                return;
            }

            var screenshotPath = Path.Combine(
                Directory.GetCurrentDirectory(), 
                "TEMP", 
                "test-screenshots", 
                "test-mockup.png"
            );

            if (!File.Exists(screenshotPath))
            {
                Console.WriteLine($"ERROR: Screenshot not found at: {screenshotPath}");
                Console.WriteLine("Please save your annotated screenshot as test-mockup.png in TEMP/test-screenshots/");
                return;
            }

            Console.WriteLine("=".PadRight(80, '='));
            Console.WriteLine("SCREENSHOT REQUIREMENT EXTRACTION TEST");
            Console.WriteLine("=".PadRight(80, '='));
            Console.WriteLine($"Screenshot: {screenshotPath}");
            Console.WriteLine($"File Size: {new FileInfo(screenshotPath).Length / 1024} KB");
            Console.WriteLine();

            // Create logger factory
            using var loggerFactory = LoggerFactory.Create(builder =>
            {
                builder
                    .AddConsole()
                    .SetMinimumLevel(LogLevel.Information);
            });

            var logger = loggerFactory.CreateLogger<ScreenshotAnalysisService>();

            // Create service instance
            var service = new ScreenshotAnalysisService(logger, apiKey, "gpt-4o");

            if (!service.IsConfigured)
            {
                Console.WriteLine("ERROR: Service is not properly configured");
                return;
            }

            try
            {
                Console.WriteLine("Sending screenshot to GPT-4o Vision API...");
                Console.WriteLine();

                var requirements = await service.ExtractRequirementsAsync(
                    screenshotPath,
                    "This is a UI mockup for the Noor Canvas session page showing layout and responsive design requirements"
                );

                Console.WriteLine();
                Console.WriteLine("=".PadRight(80, '='));
                Console.WriteLine($"EXTRACTED REQUIREMENTS ({requirements.Count} total)");
                Console.WriteLine("=".PadRight(80, '='));
                Console.WriteLine();

                for (int i = 0; i < requirements.Count; i++)
                {
                    Console.WriteLine($"{i + 1}. {requirements[i]}");
                }

                Console.WriteLine();
                Console.WriteLine("=".PadRight(80, '='));
                Console.WriteLine("TEST COMPLETED SUCCESSFULLY");
                Console.WriteLine("=".PadRight(80, '='));
            }
            catch (Exception ex)
            {
                Console.WriteLine();
                Console.WriteLine("ERROR during extraction:");
                Console.WriteLine(ex.Message);
                Console.WriteLine();
                Console.WriteLine("Stack Trace:");
                Console.WriteLine(ex.StackTrace);
            }
        }
    }

    // Simplified version of ScreenshotAnalysisService for testing
    public class ScreenshotAnalysisService
    {
        private readonly ILogger<ScreenshotAnalysisService> _logger;
        private readonly string _apiKey;
        private readonly string _deploymentName;

        public ScreenshotAnalysisService(ILogger<ScreenshotAnalysisService> logger, string apiKey, string deploymentName)
        {
            _logger = logger;
            _apiKey = apiKey;
            _deploymentName = deploymentName;
        }

        public bool IsConfigured => !string.IsNullOrWhiteSpace(_apiKey);

        public async Task<List<string>> ExtractRequirementsAsync(string imagePath, string? additionalContext = null)
        {
            if (!File.Exists(imagePath))
            {
                throw new FileNotFoundException($"Screenshot file not found: {imagePath}");
            }

            var imageBytes = await File.ReadAllBytesAsync(imagePath);
            var base64Image = Convert.ToBase64String(imageBytes);
            var extension = Path.GetExtension(imagePath).ToLowerInvariant();
            var mimeType = extension switch
            {
                ".png" => "image/png",
                ".jpg" or ".jpeg" => "image/jpeg",
                ".gif" => "image/gif",
                ".bmp" => "image/bmp",
                ".webp" => "image/webp",
                _ => "image/png"
            };

            var client = new OpenAIClient(_apiKey);

            var systemPrompt = @"You are an expert UI/UX analyst and requirements engineer. Your task is to analyze annotated UI mockups and screenshots to extract clear, actionable requirements.

When analyzing an image:
1. Look for annotations, arrows, labels, and text overlays that indicate desired features or changes
2. Identify layout requirements, spacing requirements, and responsive behavior notes
3. Extract specific CSS/styling requirements (sizes, colors, positioning)
4. Note any behavioral requirements (interactions, animations, responsiveness)
5. Capture accessibility and mobile-specific requirements

Format your response as a numbered list of clear, concise requirements. Each requirement should be:
- Specific and actionable
- Focused on a single change or feature
- Written from a developer's perspective
- Include technical details when mentioned in annotations

Example output format:
1. Center the logo above the title and make it 250px X 250px
2. Increase height of canvas div to accommodate shareable assets
3. Make the right sidebar responsive on mobile devices";

            var userPrompt = $@"Please analyze this annotated UI mockup and extract all requirements from the annotations and labels.

{(string.IsNullOrWhiteSpace(additionalContext) ? "" : $"Additional Context: {additionalContext}\n\n")}Provide a numbered list of specific, actionable requirements.";

            var chatCompletionsOptions = new ChatCompletionsOptions
            {
                DeploymentName = _deploymentName,
                Messages =
                {
                    new ChatRequestSystemMessage(systemPrompt),
                    new ChatRequestUserMessage(
                        new ChatMessageTextContentItem(userPrompt),
                        new ChatMessageImageContentItem(
                            new Uri($"data:{mimeType};base64,{base64Image}")
                        )
                    )
                },
                MaxTokens = 1000,
                Temperature = 0.3f
            };

            _logger.LogInformation("Sending request to OpenAI Vision API...");

            var response = await client.GetChatCompletionsAsync(chatCompletionsOptions);
            var content = response.Value.Choices[0].Message.Content;

            var requirements = ParseRequirementsFromResponse(content);

            _logger.LogInformation("Extracted {Count} requirements from screenshot", requirements.Count);

            return requirements;
        }

        private List<string> ParseRequirementsFromResponse(string response)
        {
            var requirements = new List<string>();

            if (string.IsNullOrWhiteSpace(response))
            {
                return requirements;
            }

            var lines = response.Split('\n', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

            foreach (var line in lines)
            {
                var trimmedLine = line.Trim();
                var cleaned = System.Text.RegularExpressions.Regex.Replace(
                    trimmedLine,
                    @"^[\d\.\-\*\•]+\s*",
                    string.Empty).Trim();

                if (!string.IsNullOrWhiteSpace(cleaned) && cleaned.Length > 10)
                {
                    requirements.Add(cleaned);
                }
            }

            return requirements;
        }
    }
}
