# Framework Configuration Validation

## Purpose
Validate framework-specific setup before investigating component code to prevent wasted time on wrong layer.

---

## When to Apply
Trigger when error triage classifies error as **Framework/Platform Error** (Priority 1)

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

## ASP.NET Core API Checklist

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

## Entity Framework Checklist

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
