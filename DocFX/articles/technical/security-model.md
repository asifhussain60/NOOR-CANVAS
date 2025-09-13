# Security Model

## Overview

NOOR CANVAS implements a comprehensive security model designed for Islamic educational content sharing with emphasis on data protection, secure communication, and user privacy.

## Authentication & Authorization

### GUID-based Session Management
NOOR CANVAS uses a novel GUID-based authentication system instead of traditional user accounts:

```csharp
public class SessionSecurity
{
    // Host token generation (cryptographically secure)
    public Guid GenerateHostToken()
    {
        return Guid.NewGuid(); // UUIDv4 - 128-bit random identifier
    }
    
    // Session validation
    public async Task<bool> ValidateSessionAccess(Guid sessionGuid, Guid hostToken)
    {
        var session = await _context.Sessions
            .FirstOrDefaultAsync(s => s.Guid == sessionGuid && s.HostToken == hostToken);
        return session != null && session.Status == "Active";
    }
}
```

### No Traditional Authentication Required
- **No Passwords**: Eliminates password-related security risks
- **Token-based Access**: Secure GUID tokens for session access  
- **Time-limited Sessions**: Automatic expiration for security
- **Host Control**: Session creators have full administrative control

## Data Protection

### Database Security

**SQL Injection Prevention**
```csharp
// All queries use parameterized statements
public async Task<Session> GetSessionAsync(Guid sessionGuid)
{
    return await _context.Sessions
        .Where(s => s.Guid == sessionGuid)  // Parameterized automatically
        .FirstOrDefaultAsync();
}
```

**Schema Isolation**
- **Dedicated Canvas Schema**: Isolated from other application data
- **Minimal Cross-Schema Access**: Read-only access to dbo schema
- **Proper Permissions**: Service account with minimal required privileges

### Sensitive Data Handling
```csharp
public class ParticipantSecurity
{
    // Hash sensitive data before storage
    public string HashFingerprint(string fingerprint)
    {
        using var sha256 = SHA256.Create();
        var hashBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(fingerprint + _salt));
        return Convert.ToBase64String(hashBytes);
    }
    
    // IP address hashing for privacy
    public string HashIpAddress(string ipAddress)
    {
        using var sha256 = SHA256.Create();
        var hashBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(ipAddress + _salt));
        return Convert.ToBase64String(hashBytes);
    }
}
```

## Communication Security

### HTTPS Enforcement
```csharp
// Startup configuration
public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
{
    if (!env.IsDevelopment())
    {
        app.UseHsts(); // HTTP Strict Transport Security
        app.UseHttpsRedirection(); // Force HTTPS
    }
    
    // Security headers
    app.Use((context, next) =>
    {
        context.Response.Headers.Add("X-Content-Type-Options", "nosniff");
        context.Response.Headers.Add("X-Frame-Options", "DENY");
        context.Response.Headers.Add("X-XSS-Protection", "1; mode=block");
        return next();
    });
}
```

### SignalR Security
```csharp
public class SecureHub : Hub
{
    public override async Task OnConnectedAsync()
    {
        var sessionId = Context.GetHttpContext()?.Request.Query["sessionId"];
        var hostToken = Context.GetHttpContext()?.Request.Query["hostToken"];
        
        // Validate session access before allowing connection
        if (!await _securityService.ValidateAccess(sessionId, hostToken))
        {
            _logger.LogWarning("Unauthorized SignalR connection attempt from {ConnectionId}", 
                Context.ConnectionId);
            Context.Abort();
            return;
        }
        
        await base.OnConnectedAsync();
    }
    
    // Message validation for all hub methods
    public async Task SendMessage(string sessionId, string message)
    {
        if (!await ValidateMessageContent(message))
        {
            await Clients.Caller.SendAsync("Error", "Invalid message content");
            return;
        }
        
        await Clients.Group(sessionId).SendAsync("ReceiveMessage", message);
    }
}
```

## Input Validation & Sanitization

### Content Security
```csharp
public class ContentValidator
{
    public bool ValidateAnnotationData(AnnotationData annotation)
    {
        // Validate coordinate ranges
        if (annotation.Coordinates?.Any(c => c < 0 || c > 2000) == true)
            return false;
        
        // Validate color format (hex colors only)
        if (!Regex.IsMatch(annotation.Color ?? "", @"^#[0-9A-Fa-f]{6}$"))
            return false;
        
        // Validate thickness range
        if (annotation.Thickness < 1 || annotation.Thickness > 50)
            return false;
        
        return true;
    }
    
    public string SanitizeTextInput(string input)
    {
        if (string.IsNullOrWhiteSpace(input))
            return string.Empty;
        
        // Remove potentially dangerous HTML
        return HttpUtility.HtmlEncode(input.Trim());
    }
}
```

### Islamic Content Considerations
- **Cultural Sensitivity**: Validation of appropriate content
- **Arabic Text Validation**: RTL text handling and validation
- **Religious Content Filtering**: Ensures appropriate Islamic educational content

## Privacy Protection

### Participant Privacy
```csharp
public class PrivacyService
{
    public ParticipantDisplay CreatePublicProfile(Participant participant)
    {
        return new ParticipantDisplay
        {
            DisplayName = SanitizeName(participant.Name),
            Country = participant.Country, // Optional, user-provided
            City = participant.City,       // Optional, user-provided
            JoinTime = participant.JoinTime,
            // Never expose: IP, fingerprint hashes, internal IDs
        };
    }
}
```

### Data Minimization
- **Collect Only Necessary Data**: Minimal participant information
- **Automatic Data Cleanup**: Session data expiration
- **No Persistent Tracking**: Session-based interaction only
- **Optional Geographic Data**: User choice for location sharing

## Logging & Monitoring Security

### Secure Logging
```csharp
public class SecureLogger
{
    public void LogSecurityEvent(string eventType, object data)
    {
        var sanitizedData = SanitizeLogData(data);
        _logger.LogWarning("NOOR-SECURITY: {EventType} - {Data}", 
            eventType, JsonSerializer.Serialize(sanitizedData));
    }
    
    private object SanitizeLogData(object data)
    {
        // Remove sensitive fields from log data
        var json = JsonSerializer.Serialize(data);
        var doc = JsonDocument.Parse(json);
        
        // Remove sensitive properties
        var sanitized = RemoveSensitiveFields(doc.RootElement, 
            ["password", "token", "hash", "fingerprint", "ip"]);
        
        return sanitized;
    }
}
```

### Security Monitoring
- **Failed Authentication Attempts**: Track invalid session access
- **Suspicious Activity**: Monitor unusual annotation patterns
- **Rate Limiting**: Prevent abuse and spam
- **Connection Monitoring**: Track SignalR connection anomalies

## Compliance & Best Practices

### Islamic Ethics in Security
- **Trust and Transparency**: Clear security practices
- **Privacy Respect**: Minimal data collection aligned with Islamic values
- **Community Safety**: Protection from harmful content
- **Educational Focus**: Security measures support learning objectives

### Technical Security Standards
- **OWASP Compliance**: Following web security best practices
- **Data Encryption**: In-transit and at-rest encryption
- **Regular Security Reviews**: Ongoing security assessment
- **Vulnerability Management**: Prompt security updates

## Development Security

### Secure Development Practices
```csharp
// Example: Secure configuration management
public class SecurityConfiguration
{
    public void ConfigureServices(IServiceCollection services)
    {
        // Secure session configuration
        services.Configure<SessionSecurityOptions>(options =>
        {
            options.SessionTimeout = TimeSpan.FromHours(2);
            options.RequireHttps = true;
            options.SecureSessionTokens = true;
            options.EnableRateLimiting = true;
        });
    }
}
```

### Security Testing
- **Penetration Testing**: Regular security assessments
- **Code Security Reviews**: Static analysis for vulnerabilities
- **Dependency Scanning**: Third-party library security checks
- **Authentication Testing**: Session security validation

---

*For implementation details, see [Database Schema](database-schema.md) and [SignalR Integration](signalr-integration.md)*
