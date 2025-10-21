# Framework Configuration Validation

## Purpose
Validate framework-specific setup before investigating component code to prevent wasted time on wrong layer.

---

## When to Apply
Trigger when error triage classifies error as **Framework/Platform Error** (Priority 1)

---

## ASP.NET Web API (.NET Framework 4.8) Checklist — KSESSIONS Default

1. Web.config essentials
  - connectionStrings: `DefaultDb` (KSESSIONS_DEV), `QuranDb` (KQUR_DEV)
  - appSettings: Auth0 domain, clientId (no secrets in repo)
  - system.webServer: handlers, modules for OWIN

2. OWIN/JWT configuration
  - OWIN startup present (e.g., `Startup.cs`)
  - JWT bearer middleware configured (issuer, audience)

3. Routing & Controllers
  - Attribute routes applied where expected
  - Global configuration sets JSON formatter (Newtonsoft.Json)

4. Dependency boundaries
  - Controllers → Services → Repositories pattern respected
  - Dapper accessed only via repository layer

5. NLog
  - NLog.config/NLog targets present; errors routed to ErrorLog

6. IIS Express
  - Launch on port 8080 via `ksrun` when Auth0 required; API-only via `ksiis` on 3000+

---

## AngularJS 1.8.2 SPA Checklist — KSESSIONS Default

1. App bootstrap
  - AngularJS scripts loaded in correct order
  - Main module bootstraps the SPA; routes configured

2. HTTP/Auth
  - $http interceptors for Authorization header
  - Token storage in localStorage with safe access

3. SignalR
  - jQuery + SignalR client loaded; hub URL correct (`/signalr`)
  - Connection start logic with basic error handling

4. Views/Partials
  - Template URLs resolve; 404s avoided

5. Prod hardening
  - Minified bundles or CDN fallbacks (optional)

---

## Blazor Server Checklist

**1. Render Mode Configuration** (_Host.cshtml or App.razor):
```csharp
// Check for proper render mode
<component type="typeof(App)" render-mode="ServerPrerendered" />
// OR
<HeadOutlet @rendermode="RenderMode.InteractiveServer" />
```

**2. JavaScript Interop Setup** (Program.cs):
```csharp
// Verify Blazor JavaScript is registered
app.MapBlazorHub();
app.MapFallbackToPage("/_Host");
```

**3. SignalR Circuit Configuration** (Program.cs):
```csharp
// Check circuit options
builder.Services.AddServerSideBlazor(options =>
{
    options.DetailedErrors = true; // Development only
    options.DisconnectedCircuitRetentionPeriod = TimeSpan.FromMinutes(3);
});
```

**4. Service Registration** (Program.cs):
```csharp
// Verify all required services are registered
builder.Services.AddScoped<IYourService, YourService>();
// Check for missing DI registrations
```

---

## ASP.NET Core API Checklist (Optional — Not Default in KSESSIONS)

**1. Controller Registration** (Program.cs):
```csharp
// Verify controllers are added
builder.Services.AddControllers();
// AND
app.MapControllers();
```

**2. Middleware Order** (Program.cs):
```csharp
// CRITICAL ORDER:
app.UseRouting();
app.UseAuthentication(); // Before UseAuthorization
app.UseAuthorization();
app.MapControllers();
```

**3. Dependency Injection** (Program.cs):
```csharp
// Check service lifetime matches usage
builder.Services.AddScoped<DbContext>(); // Scoped for EF
builder.Services.AddSingleton<IConfiguration>(); // Singleton for config
```

---

## SignalR Checklist

**1. Hub Configuration** (Program.cs):
```csharp
// Server-side registration
builder.Services.AddSignalR();
app.MapHub<YourHub>("/hubpath");
```

**2. Client Configuration** (JavaScript):
```javascript
// Client-side connection
const connection = new signalR.HubConnectionBuilder()
    .withUrl("/hubpath")
    .build();
```

---

## Entity Framework Checklist (Optional — Not Default in KSESSIONS)

**1. DbContext Registration** (Program.cs):
```csharp
// Verify connection string and DbContext
builder.Services.AddDbContext<YourDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("DefaultConnection")
    )
);
```

**2. Migration Status**:
```bash
# Check for pending migrations
dotnet ef migrations list
dotnet ef database update
```

---

## Validation Output

### If `verbosity=concise`:
```
⚙️ Framework Validation: {PASS | WARN | FAIL}
- {Framework}: {X} configuration issues found
- Recommendations: {brief list}
```

### If `verbosity=detailed`:
```
⚙️ Framework Configuration Validation
- **Framework**: {Blazor Server | ASP.NET Core API | SignalR | Entity Framework}
- **Render Mode**: {Server | ServerPrerendered | etc.} (if Blazor)
- **Service Registration**: {X services validated, Y issues found}
- **Configuration Issues**:
  - Issue 1: {description}
  - Issue 2: {description}
- **Known Patterns Matched**: {pattern name if applicable}
- **Recommendations**:
  - Recommendation 1: {specific fix}
  - Recommendation 2: {specific fix}
```

---

## Abort Conditions

- Critical framework misconfiguration detected (missing required service registration)
- Framework version incompatibility identified
- Configuration conflicts found (middleware order, service lifetime issues)
- **Action**: User must resolve framework issues before proceeding with component code investigation

---

## Common Framework Issues

### Blazor Server
- Missing `AddServerSideBlazor()` in Program.cs
- Incorrect render mode (Static instead of Server)
- Circuit timeout too short
- Missing `@inject` directives in components

### ASP.NET Core API
- Controllers not registered (`AddControllers()` missing)
- Middleware in wrong order (auth before routing)
- CORS not configured for SPA
- Missing route attributes on controllers

### SignalR
- Hub not mapped (`MapHub<T>()` missing)
- Client URL mismatch (different hub path)
- Connection timeout too short
- Missing CORS configuration

### Entity Framework
- Connection string misconfigured
- Pending migrations not applied
- DbContext not registered in DI
- Wrong service lifetime (Singleton instead of Scoped)
