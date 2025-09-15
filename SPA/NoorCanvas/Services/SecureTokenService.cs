using Microsoft.EntityFrameworkCore;
using NoorCanvas.Data;
using NoorCanvas.Models;
using System.Security.Cryptography;
using System.Text;

namespace NoorCanvas.Services;

public class SecureTokenService
{
    private const string CHARSET = "ABCDEFGHIJKLMNPQRSTUVWXYZ23456789"; // Exclude 0/O, 1/I
    private const int TOKEN_LENGTH = 8;
    private readonly CanvasDbContext _context;
    private readonly ILogger<SecureTokenService> _logger;
    
    public SecureTokenService(CanvasDbContext context, ILogger<SecureTokenService> logger)
    {
        _context = context;
        _logger = logger;
    }
    
    public async Task<(string hostToken, string userToken)> GenerateTokenPairAsync(
        long sessionId, 
        int validHours = 24,
        string? clientIp = null)
    {
        var hostToken = await GenerateUniqueTokenAsync();
        var userToken = await GenerateUniqueTokenAsync(); 
        
        var secureToken = new SecureToken
        {
            SessionId = sessionId,
            HostToken = hostToken,
            UserToken = userToken,
            ExpiresAt = DateTime.UtcNow.AddHours(validHours),
            IsActive = true,
            CreatedByIp = clientIp
        };
        
        _context.SecureTokens.Add(secureToken);
        await _context.SaveChangesAsync();
        
        _logger.LogInformation("NOOR-SECURITY: Generated token pair for Session {SessionId}: Host={HostToken}, User={UserToken}",
            sessionId, hostToken, userToken);
            
        return (hostToken, userToken);
    }
    
    public async Task<SecureToken?> ValidateTokenAsync(string token, bool isHostToken)
    {
        var validationId = Guid.NewGuid().ToString("N")[..8];
        _logger.LogInformation("NOOR-SECURITY-DEBUG: [{ValidationId}] Starting token validation", validationId);
        _logger.LogInformation("NOOR-SECURITY-DEBUG: [{ValidationId}] Token: {Token}, IsHost: {IsHost}", 
            validationId, token, isHostToken);
        
        try
        {
            _logger.LogInformation("NOOR-SECURITY-DEBUG: [{ValidationId}] Querying database for token", validationId);
            
            // Check if any tokens exist in the table
            var totalTokens = await _context.SecureTokens.CountAsync();
            _logger.LogInformation("NOOR-SECURITY-DEBUG: [{ValidationId}] Total tokens in database: {Count}", 
                validationId, totalTokens);
            
            // Check if any active tokens exist
            var activeTokens = await _context.SecureTokens
                .Where(st => st.IsActive && st.ExpiresAt > DateTime.UtcNow)
                .CountAsync();
            _logger.LogInformation("NOOR-SECURITY-DEBUG: [{ValidationId}] Active non-expired tokens: {Count}", 
                validationId, activeTokens);
            
            // Check for exact token match
            var matchingTokens = await _context.SecureTokens
                .Where(st => isHostToken ? st.HostToken == token : st.UserToken == token)
                .ToListAsync();
            _logger.LogInformation("NOOR-SECURITY-DEBUG: [{ValidationId}] Tokens matching '{Token}': {Count}", 
                validationId, token, matchingTokens.Count);
            
            // Log details of matching tokens
            foreach (var mt in matchingTokens)
            {
                _logger.LogInformation("NOOR-SECURITY-DEBUG: [{ValidationId}] Match found - ID: {Id}, SessionId: {SessionId}, Active: {IsActive}, Expires: {ExpiresAt}, HostToken: {HostToken}, UserToken: {UserToken}", 
                    validationId, mt.Id, mt.SessionId, mt.IsActive, mt.ExpiresAt, mt.HostToken, mt.UserToken);
            }
            
            var secureToken = await _context.SecureTokens
                .Include(st => st.Session)
                .Where(st => st.IsActive && st.ExpiresAt > DateTime.UtcNow)
                .Where(st => isHostToken ? st.HostToken == token : st.UserToken == token)
                .FirstOrDefaultAsync();
            _logger.LogInformation("NOOR-SECURITY-DEBUG: [{ValidationId}] Final query result: {Result}", 
                validationId, secureToken != null ? "Found valid token" : "No valid token found");
                
            if (secureToken != null)
            {
                _logger.LogInformation("NOOR-SECURITY-DEBUG: [{ValidationId}] Token validation successful - Session {SessionId}, Access #{AccessCount}, Expires: {ExpiresAt}", 
                    validationId, secureToken.SessionId, secureToken.AccessCount + 1, secureToken.ExpiresAt);
                _logger.LogInformation("NOOR-SECURITY-DEBUG: [{ValidationId}] Session details - Title: '{Title}', Status: '{Status}'", 
                    validationId, secureToken.Session?.Title, secureToken.Session?.Status);
                    
                // Update access tracking
                secureToken.AccessCount++;
                secureToken.LastAccessedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
                _logger.LogInformation("NOOR-SECURITY-DEBUG: [{ValidationId}] Access count updated to {AccessCount}", 
                    validationId, secureToken.AccessCount);
            }
            else
            {
                _logger.LogWarning("NOOR-SECURITY-DEBUG: [{ValidationId}] Token validation failed - {TokenType} token not found or expired: {Token}", 
                    validationId, isHostToken ? "HOST" : "USER", token);
                    
                // Additional debugging for failed validation
                var expiredTokens = await _context.SecureTokens
                    .Where(st => isHostToken ? st.HostToken == token : st.UserToken == token)
                    .Where(st => st.ExpiresAt <= DateTime.UtcNow)
                    .CountAsync();
                var inactiveTokens = await _context.SecureTokens
                    .Where(st => isHostToken ? st.HostToken == token : st.UserToken == token)
                    .Where(st => !st.IsActive)
                    .CountAsync();
                    
                _logger.LogInformation("NOOR-SECURITY-DEBUG: [{ValidationId}] Failure analysis - Expired: {ExpiredCount}, Inactive: {InactiveCount}", 
                    validationId, expiredTokens, inactiveTokens);
            }
            
            return secureToken;
        }
        catch (Exception ex)
        {
            _logger.LogError("NOOR-SECURITY-DEBUG: [{ValidationId}] Exception during token validation: {Error}", 
                validationId, ex.Message);
            _logger.LogError("NOOR-SECURITY-DEBUG: [{ValidationId}] Stack trace: {StackTrace}", validationId, ex.StackTrace);
            throw;
        }
    }
    
    public async Task<SecureToken?> GetTokenBySessionIdAsync(long sessionId)
    {
        return await _context.SecureTokens
            .Include(st => st.Session)
            .Where(st => st.SessionId == sessionId && st.IsActive && st.ExpiresAt > DateTime.UtcNow)
            .FirstOrDefaultAsync();
    }
    
    public async Task<bool> ExpireTokenAsync(long sessionId)
    {
        var tokens = await _context.SecureTokens
            .Where(st => st.SessionId == sessionId)
            .ToListAsync();
            
        foreach (var token in tokens)
        {
            token.IsActive = false;
        }
        
        await _context.SaveChangesAsync();
        
        _logger.LogInformation("NOOR-SECURITY: Expired {TokenCount} tokens for Session {SessionId}",
            tokens.Count, sessionId);
            
        return tokens.Count > 0;
    }
    
    private async Task<string> GenerateUniqueTokenAsync()
    {
        string token;
        int attempts = 0;
        const int maxAttempts = 100;
        
        do {
            token = GenerateRandomToken();
            attempts++;
            
            if (attempts > maxAttempts)
                throw new InvalidOperationException("Unable to generate unique token after maximum attempts");
                
        } while (await TokenExistsAsync(token));
        
        return token;
    }
    
    private string GenerateRandomToken()
    {
        using var rng = RandomNumberGenerator.Create();
        var result = new StringBuilder(TOKEN_LENGTH);
        
        for (int i = 0; i < TOKEN_LENGTH; i++)
        {
            var randomByte = new byte[1];
            rng.GetBytes(randomByte);
            result.Append(CHARSET[randomByte[0] % CHARSET.Length]);
        }
        
        return result.ToString();
    }
    
    private async Task<bool> TokenExistsAsync(string token)
    {
        return await _context.SecureTokens
            .AnyAsync(st => st.HostToken == token || st.UserToken == token);
    }
}
