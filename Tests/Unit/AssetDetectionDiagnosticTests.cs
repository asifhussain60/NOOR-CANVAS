using Microsoft.Extensions.Logging;
using Moq;
using NoorCanvas.Services;
using NoorCanvas.Controllers;
using NoorCanvas.Models;
using System.Net;
using System.Text;
using System.Text.Json;
using Xunit;
using Moq.Protected;

namespace Tests.Unit
{
    /// <summary>
    /// Diagnostic tests for asset detection pipeline using Session 212 transcript HTML.
    /// Traces HTML through: HtmlParsingService → MediaUrlTransformService → 
    /// AssetProcessingService.MarkAssetLocationsAsync → ShareButtonInjectionService
    /// 
    /// Purpose: Identify where asset detection is failing for Session 212.
    /// Reference: #file:session-212-transcript.html contains the asset (image).
    /// </summary>
    public class AssetDetectionDiagnosticTests : IDisposable
    {
        private readonly Mock<ILogger<HtmlParsingService>> _htmlParsingLoggerMock;
        private readonly Mock<ILogger<AssetProcessingService>> _assetProcessingLoggerMock;
        private readonly Mock<ILogger<ShareButtonInjectionService>> _shareButtonLoggerMock;
        private readonly Mock<ILogger<UnifiedHtmlTransformService>> _unifiedLoggerMock;
        private readonly Mock<ILogger<MediaUrlTransformService>> _mediaUrlLoggerMock;
        private readonly Mock<IHttpClientFactory> _httpClientFactoryMock;
        
        private readonly HtmlParsingService _htmlParsingService;
        private readonly AssetProcessingService _assetProcessingService;
        private readonly ShareButtonInjectionService _shareButtonService;
        private readonly MediaUrlTransformService _mediaUrlTransformService;
        
        private readonly string _session212Html;

        public AssetDetectionDiagnosticTests()
        {
            // Initialize mocks
            _htmlParsingLoggerMock = new Mock<ILogger<HtmlParsingService>>();
            _assetProcessingLoggerMock = new Mock<ILogger<AssetProcessingService>>();
            _shareButtonLoggerMock = new Mock<ILogger<ShareButtonInjectionService>>();
            _unifiedLoggerMock = new Mock<ILogger<UnifiedHtmlTransformService>>();
            _mediaUrlLoggerMock = new Mock<ILogger<MediaUrlTransformService>>();
            _httpClientFactoryMock = new Mock<IHttpClientFactory>();

            // Load Session 212 HTML fixture
            // Use robust path resolution that works across different build environments
            var projectRoot = Path.GetFullPath(
                Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "..")
            );
            var fixturePath = Path.Combine(projectRoot, "Tests", "Fixtures", "session-212-transcript.html");

            if (!File.Exists(fixturePath))
            {
                // Fallback to relative path if BaseDirectory approach doesn't work
                fixturePath = Path.Combine(
                    Directory.GetCurrentDirectory(),
                    "..", "..", "..",
                    "Fixtures",
                    "session-212-transcript.html"
                );
                
                if (!File.Exists(fixturePath))
                {
                    throw new FileNotFoundException(
                        $"Session 212 fixture not found. Tried:\n" +
                        $"  - {Path.Combine(projectRoot, "Tests", "Fixtures", "session-212-transcript.html")}\n" +
                        $"  - {fixturePath}\n" +
                        $"BaseDirectory: {AppContext.BaseDirectory}\n" +
                        $"CurrentDirectory: {Directory.GetCurrentDirectory()}"
                    );
                }
            }

            _session212Html = File.ReadAllText(fixturePath);

            // Initialize services with proper configuration mocking
            _htmlParsingService = new HtmlParsingService(_htmlParsingLoggerMock.Object);
            
            // Setup IConfiguration mock for MediaUrlTransformService
            var configMock = new Mock<Microsoft.Extensions.Configuration.IConfiguration>();
            configMock.Setup(c => c["MediaStorage:BaseUrl"]).Returns("https://localhost:9091");
            configMock.Setup(c => c["MediaStorage:CDN:Enabled"]).Returns("false");
            
            // Setup IWebHostEnvironment mock
            var envMock = new Mock<Microsoft.AspNetCore.Hosting.IWebHostEnvironment>();
            envMock.Setup(e => e.EnvironmentName).Returns("Development");
            
            // Setup IMemoryCache
            var cache = new Microsoft.Extensions.Caching.Memory.MemoryCache(
                new Microsoft.Extensions.Caching.Memory.MemoryCacheOptions()
            );
            
            _mediaUrlTransformService = new MediaUrlTransformService(
                envMock.Object,
                configMock.Object,
                _mediaUrlLoggerMock.Object,
                cache
            );
            
            _assetProcessingService = new AssetProcessingService(
                _assetProcessingLoggerMock.Object,
                _httpClientFactoryMock.Object
            );
            _shareButtonService = new ShareButtonInjectionService(
                _httpClientFactoryMock.Object,
                _shareButtonLoggerMock.Object
            );
            
            // UnifiedHtmlTransformService will be created on-demand in full pipeline test
        }

        [Fact]
        public void Session212_ShouldContainImageAsset()
        {
            // Arrange & Act - Verify fixture contains the expected image
            
            // Assert
            Assert.NotNull(_session212Html);
            Assert.NotEmpty(_session212Html);
            
            // Verify the image asset exists in source HTML
            Assert.Contains("<img src=\"Resources/IMAGES/212/34fca08b-43b3-4d46-b346-0a50d8ceac6d.jpg\"", _session212Html);
            Assert.Contains("data-type=\"image\"", _session212Html);
            Assert.Contains("data-image-id=\"34fca08b-43b3-4d46-b346-0a50d8ceac6d\"", _session212Html);
            Assert.Contains("data-session-id=\"212\"", _session212Html);
            
            // Output for diagnostics
            var imageIndex = _session212Html.IndexOf("<img");
            var imageSnippet = _session212Html.Substring(imageIndex, Math.Min(500, _session212Html.Length - imageIndex));
            System.Diagnostics.Debug.WriteLine($"[DIAGNOSTIC] Image found at index {imageIndex}");
            System.Diagnostics.Debug.WriteLine($"[DIAGNOSTIC] Image HTML: {imageSnippet}");
        }

        [Fact]
        public void Phase1_HtmlParsingService_ShouldPreserveImageAsset()
        {
            // Arrange
            var inputHtml = _session212Html;

            // Act - Phase 1: HTML Parsing (security, sanitization, Blazor compatibility)
            var parseResult = _htmlParsingService.ParseHtml(inputHtml, ParseMode.Safe);

            // Assert
            Assert.True(parseResult.IsValid, "HTML parsing should succeed");
            Assert.NotNull(parseResult.Content);
            Assert.NotEmpty(parseResult.Content);

            // Verify image asset is preserved after parsing
            Assert.Contains("<img", parseResult.Content);
            Assert.Contains("Resources/IMAGES/212", parseResult.Content);
            Assert.Contains("34fca08b-43b3-4d46-b346-0a50d8ceac6d.jpg", parseResult.Content);

            // Diagnostic output
            System.Diagnostics.Debug.WriteLine($"[PHASE 1 - PARSING] Input length: {inputHtml.Length}");
            System.Diagnostics.Debug.WriteLine($"[PHASE 1 - PARSING] Output length: {parseResult.Content.Length}");
            System.Diagnostics.Debug.WriteLine($"[PHASE 1 - PARSING] Image preserved: {parseResult.Content.Contains("<img")}");
        }

        [Fact]
        public async Task Phase2_MediaUrlTransform_ShouldPreserveImageAsset()
        {
            // Arrange
            var parseResult = _htmlParsingService.ParseHtml(_session212Html, ParseMode.Safe);
            var parsedHtml = parseResult.Content ?? string.Empty;

            // Act - Phase 2: Media URL transformation
            var transformedHtml = await _mediaUrlTransformService.TransformMediaUrlsAsync(parsedHtml, 212);

            // Assert
            Assert.NotNull(transformedHtml);
            Assert.NotEmpty(transformedHtml);

            // Image should still exist (URL might be transformed but element preserved)
            Assert.Contains("<img", transformedHtml);
            Assert.Contains("34fca08b-43b3-4d46-b346-0a50d8ceac6d.jpg", transformedHtml);

            // Diagnostic output
            System.Diagnostics.Debug.WriteLine($"[PHASE 2 - MEDIA TRANSFORM] Input length: {parsedHtml.Length}");
            System.Diagnostics.Debug.WriteLine($"[PHASE 2 - MEDIA TRANSFORM] Output length: {transformedHtml.Length}");
            System.Diagnostics.Debug.WriteLine($"[PHASE 2 - MEDIA TRANSFORM] Image preserved: {transformedHtml.Contains("<img")}");
            
            // Check if URL was transformed
            var originalUrl = "Resources/IMAGES/212";
            var urlTransformed = !transformedHtml.Contains(originalUrl);
            System.Diagnostics.Debug.WriteLine($"[PHASE 2 - MEDIA TRANSFORM] URL transformed: {urlTransformed}");
        }

        [Fact]
        public async Task Phase3_MarkAssetLocations_ShouldDetectImageAsset()
        {
            // Arrange
            var parseResult = _htmlParsingService.ParseHtml(_session212Html, ParseMode.Safe);
            var parsedHtml = parseResult.Content ?? string.Empty;
            var transformedHtml = await _mediaUrlTransformService.TransformMediaUrlsAsync(parsedHtml, 212);

            // Setup mock HTTP client to return AssetLookup data
            var assetLookups = new List<AssetLookupDto>
            {
                new AssetLookupDto
                {
                    AssetId = 1,
                    AssetIdentifier = "inserted-image",
                    AssetType = "image",
                    CssSelector = "img[data-type='image']",
                    DisplayName = "Inserted Image",
                    IsActive = true
                }
            };

            SetupAssetLookupApiMock(assetLookups);

            // Act - Phase 3: Mark asset locations
            var markedHtml = await _assetProcessingService.MarkAssetLocationsAsync(transformedHtml, "212");

            // Assert
            Assert.NotNull(markedHtml);
            Assert.NotEmpty(markedHtml);

            // Check if asset markers were added
            var hasAssetMarker = markedHtml.Contains("data-noor-asset-marker=\"true\"");
            var hasAssetType = markedHtml.Contains("data-asset-type=\"inserted-image\"");
            var hasShareId = markedHtml.Contains("data-share-id=\"asset-inserted-image-");

            // Diagnostic output
            System.Diagnostics.Debug.WriteLine($"[PHASE 3 - MARK ASSETS] Input length: {transformedHtml.Length}");
            System.Diagnostics.Debug.WriteLine($"[PHASE 3 - MARK ASSETS] Output length: {markedHtml.Length}");
            System.Diagnostics.Debug.WriteLine($"[PHASE 3 - MARK ASSETS] Has asset marker: {hasAssetMarker}");
            System.Diagnostics.Debug.WriteLine($"[PHASE 3 - MARK ASSETS] Has asset type: {hasAssetType}");
            System.Diagnostics.Debug.WriteLine($"[PHASE 3 - MARK ASSETS] Has share ID: {hasShareId}");

            // Extract and display the marked image element
            if (hasAssetMarker)
            {
                var markerIndex = markedHtml.IndexOf("data-noor-asset-marker");
                if (markerIndex > 0)
                {
                    var imgStartIndex = markedHtml.LastIndexOf("<img", markerIndex);
                    var imgSnippet = markedHtml.Substring(imgStartIndex, Math.Min(600, markedHtml.Length - imgStartIndex));
                    System.Diagnostics.Debug.WriteLine($"[PHASE 3 - MARKED IMAGE]: {imgSnippet}");
                }
            }

            // Assertions
            Assert.True(hasAssetMarker, "Image should have data-noor-asset-marker attribute");
            Assert.True(hasAssetType, "Image should have data-asset-type attribute");
            Assert.True(hasShareId, "Image should have data-share-id attribute");
        }

        [Fact]
        public async Task Phase4_ShareButtonInjection_ShouldInjectButtonForImage()
        {
            // Arrange
            var parseResult = _htmlParsingService.ParseHtml(_session212Html, ParseMode.Safe);
            var parsedHtml = parseResult.Content ?? string.Empty;
            var transformedHtml = await _mediaUrlTransformService.TransformMediaUrlsAsync(parsedHtml, 212);

            // Setup AssetLookup API mock
            var assetLookups = new List<AssetLookupDto>
            {
                new AssetLookupDto
                {
                    AssetId = 1,
                    AssetIdentifier = "inserted-image",
                    AssetType = "image",
                    CssSelector = "img[data-type='image']",
                    DisplayName = "Inserted Image",
                    IsActive = true
                }
            };
            SetupAssetLookupApiMock(assetLookups);

            var markedHtml = await _assetProcessingService.MarkAssetLocationsAsync(transformedHtml, "212");

            // Setup SessionAssets API mock (simulating pre-detected assets)
            var sessionAssets = new List<ShareButtonInjectionService.SessionAssetDto>
            {
                new ShareButtonInjectionService.SessionAssetDto
                {
                    AssetId = 1,
                    AssetType = "image",
                    AssetSelector = @"<img[^>]*data-type=""image""[^>]*>",
                    Position = 1
                }
            };
            SetupSessionAssetsApiMock(212, sessionAssets);

            // Act - Phase 4: Share button injection
            var finalHtml = await _shareButtonService.InjectShareButtonsAsync(markedHtml, 212);

            // Assert
            Assert.NotNull(finalHtml);
            Assert.NotEmpty(finalHtml);

            // Check for share button presence
            var hasShareButton = finalHtml.Contains("data-share-button=\"asset\"");
            var hasButtonId = finalHtml.Contains("share-btn-image-");
            var hasAssetWrapper = finalHtml.Contains("asset-share-wrapper");

            // Diagnostic output
            System.Diagnostics.Debug.WriteLine($"[PHASE 4 - SHARE BUTTONS] Input length: {markedHtml.Length}");
            System.Diagnostics.Debug.WriteLine($"[PHASE 4 - SHARE BUTTONS] Output length: {finalHtml.Length}");
            System.Diagnostics.Debug.WriteLine($"[PHASE 4 - SHARE BUTTONS] Has share button: {hasShareButton}");
            System.Diagnostics.Debug.WriteLine($"[PHASE 4 - SHARE BUTTONS] Has button ID: {hasButtonId}");
            System.Diagnostics.Debug.WriteLine($"[PHASE 4 - SHARE BUTTONS] Has asset wrapper: {hasAssetWrapper}");

            // Extract and display share button if present
            if (hasShareButton)
            {
                var buttonIndex = finalHtml.IndexOf("data-share-button");
                if (buttonIndex > 0)
                {
                    var buttonStartIndex = finalHtml.LastIndexOf("<button", buttonIndex);
                    var buttonSnippet = finalHtml.Substring(buttonStartIndex, Math.Min(400, finalHtml.Length - buttonStartIndex));
                    System.Diagnostics.Debug.WriteLine($"[PHASE 4 - SHARE BUTTON]: {buttonSnippet}");
                }
            }

            // Assertions
            Assert.True(hasShareButton, "Share button should be injected for image asset");
            Assert.True(hasButtonId, "Share button should have unique ID");
            Assert.True(hasAssetWrapper, "Image should be wrapped in asset-share-wrapper");
        }

        [Fact]
        public async Task FullPipeline_UnifiedTransformService_ShouldDetectAndProcessImageAsset()
        {
            // Arrange
            var sessionId = 212;
            var sessionStatus = "Active";

            // Setup AssetLookup API mock
            var assetLookups = new List<AssetLookupDto>
            {
                new AssetLookupDto
                {
                    AssetId = 1,
                    AssetIdentifier = "inserted-image",
                    AssetType = "image",
                    CssSelector = "img[data-type='image']",
                    DisplayName = "Inserted Image",
                    IsActive = true
                }
            };
            SetupAssetLookupApiMock(assetLookups);

            // Setup SessionAssets API mock
            var sessionAssets = new List<ShareButtonInjectionService.SessionAssetDto>
            {
                new ShareButtonInjectionService.SessionAssetDto
                {
                    AssetId = 1,
                    AssetType = "image",
                    AssetSelector = @"<img[^>]*data-type=""image""[^>]*>",
                    Position = 1
                }
            };
            SetupSessionAssetsApiMock(sessionId, sessionAssets);

            // Initialize UnifiedHtmlTransformService
            var unifiedService = new UnifiedHtmlTransformService(
                _htmlParsingService,
                _assetProcessingService,
                _mediaUrlTransformService,
                _shareButtonService,
                _unifiedLoggerMock.Object
            );

            // Act - Full pipeline transformation
            var finalHtml = await unifiedService.TransformForHostAsync(_session212Html, sessionId, sessionStatus);

            // Assert
            Assert.NotNull(finalHtml);
            Assert.NotEmpty(finalHtml);

            // Verify full pipeline results
            var hasImage = finalHtml.Contains("<img");
            var hasAssetMarker = finalHtml.Contains("data-noor-asset-marker=\"true\"");
            var hasShareButton = finalHtml.Contains("data-share-button=\"asset\"");
            var hasAssetWrapper = finalHtml.Contains("asset-share-wrapper");

            // Diagnostic output
            System.Diagnostics.Debug.WriteLine("=== FULL PIPELINE DIAGNOSTIC ===");
            System.Diagnostics.Debug.WriteLine($"Input length: {_session212Html.Length}");
            System.Diagnostics.Debug.WriteLine($"Output length: {finalHtml.Length}");
            System.Diagnostics.Debug.WriteLine($"Has image: {hasImage}");
            System.Diagnostics.Debug.WriteLine($"Has asset marker: {hasAssetMarker}");
            System.Diagnostics.Debug.WriteLine($"Has share button: {hasShareButton}");
            System.Diagnostics.Debug.WriteLine($"Has asset wrapper: {hasAssetWrapper}");

            // Extract final HTML snippet showing the transformed image
            if (hasImage)
            {
                var imgIndex = finalHtml.IndexOf("<img");
                var snippetStart = Math.Max(0, imgIndex - 200);
                var snippetLength = Math.Min(800, finalHtml.Length - snippetStart);
                var snippet = finalHtml.Substring(snippetStart, snippetLength);
                System.Diagnostics.Debug.WriteLine($"=== TRANSFORMED IMAGE CONTEXT ===");
                System.Diagnostics.Debug.WriteLine(snippet);
            }

            // Assertions
            Assert.True(hasImage, "Image should be preserved through full pipeline");
            Assert.True(hasAssetMarker, "Image should have asset marker attributes");
            Assert.True(hasShareButton, "Share button should be injected for image");
            Assert.True(hasAssetWrapper, "Image should be wrapped in share wrapper");
        }

        [Fact]
        public async Task Diagnostic_CheckAssetLookupApiResponse()
        {
            // Arrange - Setup mock to verify API call pattern
            var assetLookups = new List<AssetLookupDto>
            {
                new AssetLookupDto
                {
                    AssetId = 1,
                    AssetIdentifier = "inserted-image",
                    AssetType = "image",
                    CssSelector = "img[data-type='image']",
                    DisplayName = "Inserted Image",
                    IsActive = true
                }
            };
            SetupAssetLookupApiMock(assetLookups);

            // Act - Call the API directly through the service
            var result = await _assetProcessingService.GetAssetLookupsFromApiAsync("diagnostic-test");

            // Assert
            Assert.NotNull(result);
            Assert.Single(result);
            Assert.Equal("inserted-image", result[0].AssetIdentifier);
            Assert.Equal("img[data-type='image']", result[0].CssSelector);

            // Diagnostic output
            System.Diagnostics.Debug.WriteLine("=== ASSET LOOKUP API DIAGNOSTIC ===");
            System.Diagnostics.Debug.WriteLine($"Asset Lookups returned: {result.Count}");
            foreach (var lookup in result)
            {
                System.Diagnostics.Debug.WriteLine($"  - {lookup.AssetIdentifier}: {lookup.CssSelector}");
            }
        }

        [Fact]
        public async Task Diagnostic_VerifyImageMatchesCssSelector()
        {
            // Arrange
            var parseResult = _htmlParsingService.ParseHtml(_session212Html, ParseMode.Safe);
            var html = parseResult.Content ?? string.Empty;

            // Test various CSS selectors to find which one matches the image
            var selectorsToTest = new[]
            {
                "img[data-type='image']",
                "img[data-type=\"image\"]",
                "img",
                "img[data-image-id]",
                "img[data-session-id='212']",
                "img[src*='34fca08b-43b3-4d46-b346-0a50d8ceac6d']"
            };

            System.Diagnostics.Debug.WriteLine("=== CSS SELECTOR DIAGNOSTIC ===");
            System.Diagnostics.Debug.WriteLine($"Testing {selectorsToTest.Length} selectors against parsed HTML");

            var parser = new AngleSharp.Html.Parser.HtmlParser();
            var document = parser.ParseDocument(html);

            foreach (var selector in selectorsToTest)
            {
                try
                {
                    var matches = document.QuerySelectorAll(selector);
                    var matchCount = matches.Length;
                    System.Diagnostics.Debug.WriteLine($"Selector '{selector}': {matchCount} matches");

                    if (matchCount > 0)
                    {
                        var firstMatch = matches[0].OuterHtml;
                        var preview = firstMatch.Length > 200 ? firstMatch.Substring(0, 200) + "..." : firstMatch;
                        System.Diagnostics.Debug.WriteLine($"  First match: {preview}");
                    }
                }
                catch (Exception ex)
                {
                    System.Diagnostics.Debug.WriteLine($"Selector '{selector}': ERROR - {ex.Message}");
                }
            }

            // Assert - At least one selector should match
            var imgElements = document.QuerySelectorAll("img");
            Assert.True(imgElements.Length > 0, "Should find at least one img element");
        }

        [Fact]
        public async Task Integration_AssetLookupApi_ShouldReturnImageConfiguration()
        {
            // Arrange - Setup realistic AssetLookup API response
            var expectedAssetLookups = new List<AssetLookupDto>
            {
                new AssetLookupDto
                {
                    AssetId = 1,
                    AssetIdentifier = "inserted-image",
                    AssetType = "image",
                    CssSelector = "img[data-type='image']",
                    DisplayName = "Inserted Image",
                    IsActive = true
                }
            };
            SetupAssetLookupApiMock(expectedAssetLookups);

            // Act - Query through the service (simulating what happens in production)
            var actualAssetLookups = await _assetProcessingService.GetAssetLookupsFromApiAsync("integration-test");

            // Assert - Verify the configuration is correct for image detection
            Assert.NotNull(actualAssetLookups);
            Assert.NotEmpty(actualAssetLookups);

            var imageAsset = actualAssetLookups.FirstOrDefault(a => a.AssetIdentifier == "inserted-image");
            Assert.NotNull(imageAsset);
            
            // CRITICAL: Verify the CSS selector that should match Session 212's image
            Assert.Equal("img[data-type='image']", imageAsset.CssSelector);
            Assert.Equal("image", imageAsset.AssetType);
            Assert.Equal("Inserted Image", imageAsset.DisplayName);
            Assert.True(imageAsset.IsActive);

            // Diagnostic output
            System.Diagnostics.Debug.WriteLine("=== INTEGRATION: ASSET LOOKUP CONFIGURATION ===");
            System.Diagnostics.Debug.WriteLine($"AssetIdentifier: {imageAsset.AssetIdentifier}");
            System.Diagnostics.Debug.WriteLine($"CssSelector: {imageAsset.CssSelector}");
            System.Diagnostics.Debug.WriteLine($"AssetType: {imageAsset.AssetType}");
            System.Diagnostics.Debug.WriteLine($"DisplayName: {imageAsset.DisplayName}");
            System.Diagnostics.Debug.WriteLine($"IsActive: {imageAsset.IsActive}");
            System.Diagnostics.Debug.WriteLine("=== This configuration should detect Session 212's image ===");
        }

        // Helper methods for setting up mock HTTP responses

        private void SetupAssetLookupApiMock(List<AssetLookupDto> assetLookups)
        {
            var response = new AssetLookupResponse
            {
                Success = true,
                AssetLookups = assetLookups
            };

            var json = JsonSerializer.Serialize(response, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            var mockHttpMessageHandler = new Mock<HttpMessageHandler>();
            mockHttpMessageHandler.Protected()
                .Setup<Task<HttpResponseMessage>>(
                    "SendAsync",
                    ItExpr.Is<HttpRequestMessage>(req => req.RequestUri != null && req.RequestUri.AbsolutePath.EndsWith("/api/host/asset-lookup")),
                    ItExpr.IsAny<CancellationToken>()
                )
                .ReturnsAsync(new HttpResponseMessage
                {
                    StatusCode = HttpStatusCode.OK,
                    Content = new StringContent(json, Encoding.UTF8, "application/json")
                });

            var httpClient = new HttpClient(mockHttpMessageHandler.Object)
            {
                BaseAddress = new Uri("https://localhost:9091")
            };

            _httpClientFactoryMock.Setup(f => f.CreateClient("default"))
                .Returns(httpClient);
        }

        private void SetupSessionAssetsApiMock(long sessionId, List<ShareButtonInjectionService.SessionAssetDto> assets)
        {
            var response = new ShareButtonInjectionService.SessionAssetsResponse
            {
                Assets = assets
            };

            var json = JsonSerializer.Serialize(response, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            });

            var mockHttpMessageHandler = new Mock<HttpMessageHandler>();
            mockHttpMessageHandler.Protected()
                .Setup<Task<HttpResponseMessage>>(
                    "SendAsync",
                    ItExpr.Is<HttpRequestMessage>(req => 
                        req.RequestUri != null && 
                        req.RequestUri.AbsolutePath.Contains($"/api/host/sessions/{sessionId}/assets")),
                    ItExpr.IsAny<CancellationToken>()
                )
                .ReturnsAsync(new HttpResponseMessage
                {
                    StatusCode = HttpStatusCode.OK,
                    Content = new StringContent(json, Encoding.UTF8, "application/json")
                });

            var httpClient = new HttpClient(mockHttpMessageHandler.Object)
            {
                BaseAddress = new Uri("https://localhost:9091")
            };

            _httpClientFactoryMock.Setup(f => f.CreateClient("default"))
                .Returns(httpClient);
        }

        public void Dispose()
        {
            // Cleanup if needed
            GC.SuppressFinalize(this);
        }
    }
}
