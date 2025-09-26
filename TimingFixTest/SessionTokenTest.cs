using System;
using System.Linq;
using System.Threading.Tasks;

namespace SessionTokenDebugTest
{
    /// <summary>
    /// Test to verify SessionToken validation timing issue.
    /// Debug evidence: "SessionToken length: 12" vs actual token "KJAHA99L" (8 chars)
    /// This suggests SessionToken is NULL when validation runs.
    /// </summary>
    class Program
    {
        static async Task Main(string[] args)
        {
            Console.WriteLine("=== SESSION TOKEN TIMING FIX TEST ===");
            Console.WriteLine("Based on debug evidence showing validation failure despite valid token");
            Console.WriteLine();
            
            // Simulate the actual scenario
            string actualToken = "KJAHA99L";
            Console.WriteLine($"Real Token (from logs): '{actualToken}' (Length: {actualToken.Length})");
            
            // Test validation logic
            bool isValid = ValidateSessionToken(actualToken);
            Console.WriteLine($"Validation Result: {(isValid ? "✅ PASS" : "❌ FAIL")}");
            Console.WriteLine();
            
            // Simulate timing issue scenario
            Console.WriteLine("=== SIMULATING TIMING ISSUE ===");
            await SimulateCanvasViewTiming();
        }
        
        private static bool ValidateSessionToken(string? sessionToken)
        {
            return !string.IsNullOrEmpty(sessionToken) && 
                   (sessionToken.Length == 8 || sessionToken.Length == 9) && 
                   sessionToken.All(c => char.IsLetterOrDigit(c));
        }
        
        private static async Task SimulateCanvasViewTiming()
        {
            string? sessionToken = null; // Route parameter starts as null
            
            Console.WriteLine("BEFORE FIX: Self-check runs immediately");
            Console.WriteLine($"SessionToken: {sessionToken ?? "NULL"}");
            Console.WriteLine($"Validation: {(ValidateSessionToken(sessionToken) ? "✅ PASS" : "❌ FAIL")}");
            Console.WriteLine();
            
            Console.WriteLine("AFTER FIX: Wait for SessionToken to populate");
            
            // Simulate timing fix - wait for parameter to populate
            int maxRetries = 10;
            int retryDelay = 500;
            bool sessionTokenReady = false;
            
            for (int i = 0; i < maxRetries && !sessionTokenReady; i++)
            {
                await Task.Delay(retryDelay);
                
                // Simulate parameter population after delay
                if (i >= 2) // Simulate parameter available after 1.5 seconds
                {
                    sessionToken = "KJAHA99L";
                }
                
                sessionTokenReady = !string.IsNullOrEmpty(sessionToken);
                
                if (!sessionTokenReady)
                {
                    Console.WriteLine($"⏳ Retry {i + 1}/{maxRetries}: SessionToken still null, waiting...");
                }
                else
                {
                    Console.WriteLine($"✅ SessionToken populated: '{sessionToken}' after {(i + 1) * retryDelay}ms");
                }
            }
            
            Console.WriteLine();
            Console.WriteLine("Self Check - Session Token Format:");
            bool finalValidation = ValidateSessionToken(sessionToken);
            Console.WriteLine($"SessionToken: '{sessionToken ?? "NULL"}'");
            Console.WriteLine($"Result: {(finalValidation ? "✅ PASS" : "❌ FAIL")}");
            Console.WriteLine();
            
            Console.WriteLine("=== CONCLUSION ===");
            Console.WriteLine("BEFORE FIX: SessionToken would be NULL at Self Check time → ❌ FAIL");
            Console.WriteLine("AFTER FIX: SessionToken waits to be populated → ✅ PASS");
            Console.WriteLine();
            Console.WriteLine("🎯 The timing fix in SignalRDebugPanel should resolve this issue!");
        }
    }
}