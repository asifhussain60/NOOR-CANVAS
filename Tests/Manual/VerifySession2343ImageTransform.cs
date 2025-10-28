using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using NoorCanvas.Services;

namespace NoorCanvas.Testing
{
    /// <summary>
    /// Manual verification test for Session2343 image URL transformation.
    /// Tests that Resources/IMAGES/2343/*.jpg paths are transformed to CDN URLs.
    /// Run this to verify the MediaUrlTransformService is working correctly.
    /// </summary>
    public class VerifySession2343ImageTransform
    {
        public static async Task RunTest()
        {
            Console.WriteLine("╔════════════════════════════════════════════════════════════════╗");
            Console.WriteLine("║  Session2343 Image URL Transformation Verification Test       ║");
            Console.WriteLine("╚════════════════════════════════════════════════════════════════╝");
            Console.WriteLine();

            // Setup service
            var loggerFactory = LoggerFactory.Create(builder => builder.AddConsole());
            var logger = loggerFactory.CreateLogger<MediaUrlTransformService>();
            var cache = new MemoryCache(new MemoryCacheOptions());
            
            var configuration = new ConfigurationBuilder()
                .AddInMemoryCollection(new Dictionary<string, string?>
                {
                    { "Resources:Production:BaseUrl", "https://resources.kashkole.com" }
                })
                .Build();

            // Mock environment (production mode to test CDN transformation)
            var mockEnvironment = new MockWebHostEnvironment { EnvironmentName = "Production" };
            
            var service = new MediaUrlTransformService(
                mockEnvironment,
                configuration,
                logger,
                cache);

            // Test HTML with actual Session2343 image patterns
            var testHtml = @"
<h3>Ablution as the Gnosis of Three Spiritual States</h3>
<p><img src=""Resources/IMAGES/2343/6cfa2ba3-9ae1-44d1-b38d-357ae051450c.jpg"" 
    style=""width: 988px;"" class=""fr-fic fr-dib imgResponsive fr-bordered"" 
    data-type=""image"" data-image-id=""6cfa2ba3-9ae1-44d1-b38d-357ae051450c"" 
    data-session-id=""2343"" /></p>
<p><img src=""Resources/IMAGES/2343/0bae0475-f5de-4d3d-8c83-134d16da18b7.jpg"" 
    style=""width: 604px;"" class=""fr-fic fr-dib imgResponsive fr-bordered"" 
    data-type=""image"" data-image-id=""0bae0475-f5de-4d3d-8c83-134d16da18b7"" 
    data-session-id=""2343"" /></p>";

            Console.WriteLine("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            Console.WriteLine("Original HTML:");
            Console.WriteLine("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            Console.WriteLine(testHtml);
            Console.WriteLine();

            // Transform
            Console.WriteLine("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            Console.WriteLine("Transforming...");
            Console.WriteLine("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            var result = await service.TransformMediaUrlsAsync(testHtml, sessionId: 2343);
            Console.WriteLine();

            Console.WriteLine("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            Console.WriteLine("Transformed HTML:");
            Console.WriteLine("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            Console.WriteLine(result);
            Console.WriteLine();

            // Verify transformation
            var expectedUrl1 = "https://resources.kashkole.com/IMAGES/2343/6cfa2ba3-9ae1-44d1-b38d-357ae051450c.jpg";
            var expectedUrl2 = "https://resources.kashkole.com/IMAGES/2343/0bae0475-f5de-4d3d-8c83-134d16da18b7.jpg";
            
            bool success1 = result.Contains(expectedUrl1);
            bool success2 = result.Contains(expectedUrl2);
            bool noResourcesPrefix = !result.Contains("Resources/IMAGES/");

            Console.WriteLine("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            Console.WriteLine("Verification Results:");
            Console.WriteLine("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            Console.WriteLine($"✓ Image 1 transformed to CDN: {(success1 ? "✅ PASS" : "❌ FAIL")}");
            Console.WriteLine($"  Expected: {expectedUrl1}");
            Console.WriteLine($"  Found: {success1}");
            Console.WriteLine();
            Console.WriteLine($"✓ Image 2 transformed to CDN: {(success2 ? "✅ PASS" : "❌ FAIL")}");
            Console.WriteLine($"  Expected: {expectedUrl2}");
            Console.WriteLine($"  Found: {success2}");
            Console.WriteLine();
            Console.WriteLine($"✓ No Resources/IMAGES/ prefix remaining: {(noResourcesPrefix ? "✅ PASS" : "❌ FAIL")}");
            Console.WriteLine();

            if (success1 && success2 && noResourcesPrefix)
            {
                Console.ForegroundColor = ConsoleColor.Green;
                Console.WriteLine("╔════════════════════════════════════════════════════════════════╗");
                Console.WriteLine("║                    ✅ ALL TESTS PASSED                         ║");
                Console.WriteLine("║                                                                ║");
                Console.WriteLine("║  MediaUrlTransformService correctly transforms Session2343     ║");
                Console.WriteLine("║  image URLs to CDN format.                                     ║");
                Console.WriteLine("╚════════════════════════════════════════════════════════════════╝");
                Console.ResetColor();
            }
            else
            {
                Console.ForegroundColor = ConsoleColor.Red;
                Console.WriteLine("╔════════════════════════════════════════════════════════════════╗");
                Console.WriteLine("║                    ❌ TESTS FAILED                             ║");
                Console.WriteLine("╚════════════════════════════════════════════════════════════════╝");
                Console.ResetColor();
            }
            
            Console.WriteLine();
            Console.WriteLine("Press any key to exit...");
            Console.ReadKey();
        }

        private class MockWebHostEnvironment : IWebHostEnvironment
        {
            public string WebRootPath { get; set; } = "";
            public IFileProvider WebRootFileProvider { get; set; } = null!;
            public string ApplicationName { get; set; } = "NoorCanvas";
            public IFileProvider ContentRootFileProvider { get; set; } = null!;
            public string ContentRootPath { get; set; } = "";
            public string EnvironmentName { get; set; } = "Production";
        }
    }
}
