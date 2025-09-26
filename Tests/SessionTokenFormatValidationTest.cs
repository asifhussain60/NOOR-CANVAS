using Xunit;

namespace NoorCanvas.Tests
{
    /// <summary>
    /// Test for Session Token Format validation issue reported in debug evidence.
    /// User shows HOST panel all green but USER panel has one Session Token Format validation failure.
    /// Actual token from logs: KJAHA99L (8 characters) - should be valid per validation logic.
    /// </summary>
    public class SessionTokenFormatValidationTest
    {
        [Fact]
        public void SessionToken_KJAHA99L_ShouldPassValidation()
        {
            // Arrange - the actual token from terminal logs
            string sessionToken = "KJAHA99L";
            
            // Act - replicate the validation logic from SignalRDebugPanel.razor line 347-349
            var sessionTokenValid = !string.IsNullOrEmpty(sessionToken) && 
                                    (sessionToken.Length == 8 || sessionToken.Length == 9) && 
                                    sessionToken.All(c => char.IsLetterOrDigit(c));
            
            // Assert - this should pass according to validation rules
            Assert.True(sessionTokenValid, 
                $"SessionToken '{sessionToken}' (Length: {sessionToken.Length}) should be valid. " +
                $"Expected: 8 or 9 characters, all alphanumeric. " +
                $"Actual: Length={sessionToken.Length}, Alphanumeric={sessionToken.All(c => char.IsLetterOrDigit(c))}");
        }
        
        [Theory]
        [InlineData("KJAHA99L", true)]  // 8 chars - should pass
        [InlineData("PQ9N5YWW", true)]  // 8 chars (host token from logs) - should pass
        [InlineData("ABCDEFGHI", true)] // 9 chars - should pass
        [InlineData("ABCDEFG", false)]  // 7 chars - should fail
        [InlineData("ABCDEFGHIJ", false)] // 10 chars - should fail
        [InlineData("KJAHA99L!", false)] // 8 chars with special char - should fail
        [InlineData("", false)]         // empty - should fail
        [InlineData(null, false)]       // null - should fail
        public void SessionToken_ValidationLogic_ShouldMatchExpectedResults(string token, bool expectedValid)
        {
            // Act - replicate the exact validation logic from SignalRDebugPanel.razor
            var sessionTokenValid = !string.IsNullOrEmpty(token) && 
                                    (token.Length == 8 || token.Length == 9) && 
                                    token.All(c => char.IsLetterOrDigit(c));
            
            // Assert
            Assert.Equal(expectedValid, sessionTokenValid);
        }
        
        [Fact]
        public void Investigate_PotentialBug_InUserPanelValidation()
        {
            // This test investigates why USER panel shows Session Token Format failure
            // when HOST panel shows success with the same token KJAHA99L
            
            string actualToken = "KJAHA99L";
            
            // Test various edge cases that might cause validation to behave differently
            // in User panel vs Host panel
            
            // 1. Check if there's a trim issue
            var withSpaces = $" {actualToken} ";
            var trimmedValid = !string.IsNullOrEmpty(withSpaces.Trim()) && 
                              (withSpaces.Trim().Length == 8 || withSpaces.Trim().Length == 9) && 
                              withSpaces.Trim().All(c => char.IsLetterOrDigit(c));
            
            // 2. Check if there's a case sensitivity issue  
            var lowerCase = actualToken.ToLower();
            var lowerCaseValid = !string.IsNullOrEmpty(lowerCase) && 
                                (lowerCase.Length == 8 || lowerCase.Length == 9) && 
                                lowerCase.All(c => char.IsLetterOrDigit(c));
            
            // 3. Check basic validation again
            var basicValid = !string.IsNullOrEmpty(actualToken) && 
                            (actualToken.Length == 8 || actualToken.Length == 9) && 
                            actualToken.All(c => char.IsLetterOrDigit(c));
            
            // All should be true - if any fail, we found the issue
            Assert.True(basicValid, $"Basic validation failed for '{actualToken}'");
            Assert.True(trimmedValid, $"Trim validation failed for '{withSpaces}'");
            Assert.True(lowerCaseValid, $"Case validation failed for '{lowerCase}'");
            
            // Log the results for debugging
            var details = $"Token: '{actualToken}', Length: {actualToken.Length}, " +
                         $"Alphanumeric: {actualToken.All(c => char.IsLetterOrDigit(c))}, " +
                         $"BasicValid: {basicValid}, TrimValid: {trimmedValid}, LowerValid: {lowerCaseValid}";
            
            // If we reach here, the validation logic should work correctly
            // The issue might be elsewhere (e.g., token passing, panel context, etc.)
        }
    }
}