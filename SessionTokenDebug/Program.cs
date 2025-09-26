using System;
using System.Linq;

Console.WriteLine("Session Token Format Validation Debug Test");
Console.WriteLine("=========================================");

// The exact scenario from logs and user debug evidence
Console.WriteLine("SCENARIO: User panel shows Session Token Format validation failure");
Console.WriteLine("HOST PANEL: All green (validates HostToken + UserToken)");
Console.WriteLine("USER PANEL: One red (validates SessionToken from route parameter)");
Console.WriteLine();

// Test the actual values from terminal logs
string actualSessionToken = "KJAHA99L";
string actualHostToken = "PQ9N5YWW";
string actualUserToken = "KJAHA99L";

Console.WriteLine("Actual values from terminal logs:");
Console.WriteLine($"SessionToken (from route): '{actualSessionToken}'");
Console.WriteLine($"HostToken: '{actualHostToken}'");
Console.WriteLine($"UserToken: '{actualUserToken}'");
Console.WriteLine();

// Test Host panel validation (should pass - confirms user's evidence)
bool hostTokenValid = ValidateToken(actualHostToken, "HostToken");
bool userTokenValid = ValidateToken(actualUserToken, "UserToken");
bool hostPanelAllGreen = hostTokenValid && userTokenValid;

Console.WriteLine("HOST PANEL VALIDATION (using HostToken + UserToken):");
Console.WriteLine($"  HostToken validation: {(hostTokenValid ? "✅ PASS" : "❌ FAIL")}");
Console.WriteLine($"  UserToken validation: {(userTokenValid ? "✅ PASS" : "❌ FAIL")}");
Console.WriteLine($"  Overall: {(hostPanelAllGreen ? "✅ ALL GREEN" : "❌ HAS ISSUES")}");
Console.WriteLine();

// Test User panel validation (should pass but user says it fails)
bool sessionTokenValid = ValidateToken(actualSessionToken, "SessionToken");

Console.WriteLine("USER PANEL VALIDATION (using SessionToken from route):");
Console.WriteLine($"  SessionToken validation: {(sessionTokenValid ? "✅ PASS" : "❌ FAIL")}");
Console.WriteLine();

// Check for edge cases that might cause the discrepancy
Console.WriteLine("EDGE CASE ANALYSIS:");
Console.WriteLine("------------------");

// Case 1: Null/empty SessionToken
if (string.IsNullOrEmpty(actualSessionToken))
{
    Console.WriteLine("❌ ISSUE FOUND: SessionToken is null/empty!");
}
else
{
    Console.WriteLine("✅ SessionToken is not null/empty");
}

// Case 2: Different token values
if (actualSessionToken != actualUserToken)
{
    Console.WriteLine($"❌ ISSUE FOUND: SessionToken ('{actualSessionToken}') != UserToken ('{actualUserToken}')!");
}
else
{
    Console.WriteLine("✅ SessionToken matches UserToken");
}

// Case 3: Timing issue - token not yet populated during validation
Console.WriteLine();
Console.WriteLine("POTENTIAL ROOT CAUSES:");
Console.WriteLine("1. Timing issue: SessionToken parameter not populated when Self Check runs");
Console.WriteLine("2. Route parameter parsing issue: SessionToken from URL malformed");
Console.WriteLine("3. Component initialization order: Debug panel initialized before SessionToken set");
Console.WriteLine();

if (sessionTokenValid && hostPanelAllGreen)
{
    Console.WriteLine("🔍 CONCLUSION: Both validations should pass based on actual token values.");
    Console.WriteLine("The issue is likely timing or initialization order related.");
    Console.WriteLine("The User panel's SessionToken parameter may be null/empty when Self Check runs.");
    Console.WriteLine();
    Console.WriteLine("RECOMMENDED FIX: Ensure SessionToken is populated before Self Check runs,");
    Console.WriteLine("similar to the timing fix applied to HostControlPanel.");
}
else
{
    Console.WriteLine("❌ VALIDATION LOGIC ERROR: One or both validations failed unexpectedly.");
}

static bool ValidateToken(string token, string tokenType)
{
    if (string.IsNullOrEmpty(token))
    {
        Console.WriteLine($"  {tokenType} is null/empty");
        return false;
    }
    
    bool lengthValid = token.Length == 8 || token.Length == 9;
    bool alphanumericValid = token.All(c => char.IsLetterOrDigit(c));
    bool overall = lengthValid && alphanumericValid;
    
    Console.WriteLine($"  {tokenType}: '{token}' (Length: {token.Length}, Alphanumeric: {alphanumericValid})");
    
    return overall;
}
