// Quick test to verify MediaUrlTransformService transforms Session2343.html images correctly
// Run with: cd SPA/NoorCanvas && dotnet run --no-build test-media-transform

using System;
using System.IO;
using System.Threading.Tasks;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using NoorCanvas.Services;

namespace NoorCanvas.Testing
{
    public class MediaUrlTransformTest
    {
        public static async Task RunTest()
        {
            Console.WriteLine("=== MediaUrlTransformService Test ===\n");
            
            // Setup service with production configuration
            var configuration = new ConfigurationBuilder()
                .AddJsonFile("appsettings.json")
                .Build();
                
            var environment = new TestEnvironment { EnvironmentName = "Production" };
            var logger = new TestLogger();
            var cache = new MemoryCache(new MemoryCacheOptions());
            
            var service = new MediaUrlTransformService(environment, configuration, logger, cache);
            
            // Test HTML from Session2343
            var testHtml = @"<p><img src=""Resources/IMAGES/2343/6cfa2ba3-9ae1-44d1-b38d-357ae051450c.jpg"" 
                style=""width: 988px;"" class=""fr-fic fr-dib imgResponsive fr-bordered"" /></p>
                <p><img src=""Resources/IMAGES/2343/0bae0475-f5de-4d3d-8c83-134d16da18b7.jpg"" 
                style=""width: 604px;"" class=""fr-fic fr-dib imgResponsive fr-bordered"" /></p>";
            
            Console.WriteLine("Original HTML:");
            Console.WriteLine(testHtml);
            Console.WriteLine("\n--- Transforming ---\n");
            
            var result = await service.TransformMediaUrlsAsync(testHtml, sessionId: 2343);
            
            Console.WriteLine("Transformed HTML:");
            Console.WriteLine(result);
            Console.WriteLine();
            
            // Verify transformation
            bool success = result.Contains("https://resources.kashkole.com/IMAGES/2343/");
            Console.WriteLine(success ? "✅ TEST PASSED - Images transformed to CDN URLs" : "❌ TEST FAILED - Images not transformed");
        }
        
        private class TestEnvironment : IWebHostEnvironment
        {
            public string EnvironmentName { get; set; } = "Production";
            public string ApplicationName { get; set; } = "NoorCanvas";
            public string ContentRootPath { get; set; } = "";
            public IFileProvider ContentRootFileProvider { get; set; } = null!;
            public string WebRootPath { get; set; } = "";
            public IFileProvider WebRootFileProvider { get; set; } = null!;
        }
        
        private class TestLogger : ILogger<MediaUrlTransformService>
        {
            public IDisposable BeginScope<TState>(TState state) => null!;
            public bool IsEnabled(LogLevel logLevel) => true;
            public void Log<TState>(LogLevel logLevel, EventId eventId, TState state, Exception? exception, Func<TState, Exception?, string> formatter)
            {
                Console.WriteLine($"[{logLevel}] {formatter(state, exception)}");
            }
        }
    }
}
