using System;
using System.Linq;

Console.WriteLine("Testing Session Token Format Validation");
Console.WriteLine("======================================");

// Test the actual token from logs
string actualToken = "KJAHA99L";
bool result = ValidateSessionToken(actualToken);

Console.WriteLine($"Token: '{actualToken}'");
Console.WriteLine($"Length: {actualToken.Length}");
Console.WriteLine($"All alphanumeric: {actualToken.All(c => char.IsLetterOrDigit(c))}");
Console.WriteLine($"Validation result: {result}");
Console.WriteLine();

// Test edge cases
var testCases = new[]
{
    ("KJAHA99L", true, "8 chars - should pass"),
    ("PQ9N5YWW", true, "8 chars (host token) - should pass"),
    ("ABCDEFGHI", true, "9 chars - should pass"),
    ("ABCDEFG", false, "7 chars - should fail"),
    ("ABCDEFGHIJ", false, "10 chars - should fail"),
    ("KJAHA99L!", false, "8 chars with special char - should fail"),
    ("", false, "empty - should fail"),
    (null, false, "null - should fail")
};

Console.WriteLine("Test Cases:");
Console.WriteLine("-----------");

foreach (var (token, expected, description) in testCases)
{
    bool actual = ValidateSessionToken(token);
    string status = actual == expected ? "✅ PASS" : "❌ FAIL";
    Console.WriteLine($"{status} {description}: '{token}' => {actual} (expected {expected})");
}

Console.WriteLine();
Console.WriteLine("If all tests pass, the validation logic is correct.");
Console.WriteLine("The issue must be elsewhere (token source, panel context, etc.)");

// Replicate the exact validation logic from SignalRDebugPanel.razor
static bool ValidateSessionToken(string sessionToken)
{
    return !string.IsNullOrEmpty(sessionToken) && 
           (sessionToken.Length == 8 || sessionToken.Length == 9) && 
           sessionToken.All(c => char.IsLetterOrDigit(c));
}
