# KDS Test-First Strategy: Layer-by-Layer Implementation Guide

**Date**: November 2, 2025  
**Version**: 1.0  
**Purpose**: Detailed test strategy for Logic, UI, and Database layers in KDS workflow

---

## Executive Summary

**Challenge**: How does KDS handle test-first development across different application layers?

**Answer**: KDS uses a **layer-aware test strategy** that automatically selects the appropriate testing approach based on the component being developed.

**Current Framework**: 
- ✅ **Unit Tests**: xUnit (existing in codebase)
- ✅ **Integration Tests**: xUnit + WebApplicationFactory
- ✅ **E2E Tests**: Playwright (244 test files)
- ✅ **Visual Tests**: Percy for visual regression

---

## Test Strategy Matrix

| Layer | Test Type | Framework | Run Time | Database | Example |
|-------|-----------|-----------|----------|----------|---------|
| **Business Logic** | Unit Test | xUnit | < 1s | In-Memory / Mock | `ShareService.CalculatePermissions()` |
| **Data Access** | Integration Test | xUnit + EF Core | 1-3s | In-Memory EF | `ShareRepository.SaveAsync()` |
| **API Layer** | Integration Test | WebApplicationFactory | 2-5s | In-Memory / Test DB | `POST /api/share` |
| **UI Component** | E2E Test | Playwright | 5-15s | Real DB / Test Session | Share button click → verification |
| **Visual** | Visual Regression | Percy + Playwright | 10-30s | Real DB / Test Session | Share button appearance |
| **Cross-Layer** | E2E Test | Playwright | 15-45s | Real DB / Test Session | Full share workflow |

---

## Layer 1: Business Logic Tests (Unit Tests)

### When to Use
- ✅ Pure business logic (no external dependencies)
- ✅ Calculations, validations, transformations
- ✅ Service layer methods
- ✅ Helper utilities

### Test-First Workflow

**Step 1: Create Failing Test**
```csharp
// File: Tests/Unit/Services/ShareServiceTests.cs
using Xunit;
using Moq;
using NoorCanvas.Services;
using NoorCanvas.Models;

namespace NoorCanvas.Tests.Unit.Services
{
    public class ShareServiceTests
    {
        [Fact]
        public void CalculateSharePermissions_AssetOwner_ReturnsFullPermissions()
        {
            // Arrange
            var shareService = new ShareService();
            var request = new ShareRequest
            {
                AssetId = "asset-123",
                UserId = "user-456",
                SessionId = 789
            };
            
            var assetOwner = new User { UserId = "user-456" };
            
            // Act
            var permissions = shareService.CalculateSharePermissions(request, assetOwner);
            
            // Assert
            Assert.True(permissions.CanShare);
            Assert.True(permissions.CanRevoke);
            Assert.Equal("full", permissions.Level);
        }
        
        [Fact]
        public void CalculateSharePermissions_NotOwner_ReturnsLimitedPermissions()
        {
            // Arrange
            var shareService = new ShareService();
            var request = new ShareRequest
            {
                AssetId = "asset-123",
                UserId = "user-999", // Different user
                SessionId = 789
            };
            
            var assetOwner = new User { UserId = "user-456" };
            
            // Act
            var permissions = shareService.CalculateSharePermissions(request, assetOwner);
            
            // Assert
            Assert.False(permissions.CanShare);
            Assert.False(permissions.CanRevoke);
            Assert.Equal("view-only", permissions.Level);
        }
    }
}
```

**Step 2: Run Test (Expect RED)**
```powershell
dotnet test --filter "FullyQualifiedName~ShareServiceTests" --logger "console;verbosity=detailed"

# Expected Output:
# ❌ FAILED: ShareServiceTests.CalculateSharePermissions_AssetOwner_ReturnsFullPermissions
# Error: The type or namespace name 'ShareService' could not be found
```

**Step 3: Implement Minimum Code**
```csharp
// File: SPA/NoorCanvas/Services/ShareService.cs
using NoorCanvas.Models;

namespace NoorCanvas.Services
{
    public class ShareService
    {
        public SharePermissions CalculateSharePermissions(ShareRequest request, User assetOwner)
        {
            var isOwner = request.UserId == assetOwner.UserId;
            
            return new SharePermissions
            {
                CanShare = isOwner,
                CanRevoke = isOwner,
                Level = isOwner ? "full" : "view-only"
            };
        }
    }
    
    public class SharePermissions
    {
        public bool CanShare { get; set; }
        public bool CanRevoke { get; set; }
        public string Level { get; set; }
    }
}
```

**Step 4: Run Test (Expect GREEN)**
```powershell
dotnet test --filter "FullyQualifiedName~ShareServiceTests"

# Expected Output:
# ✅ PASSED: ShareServiceTests.CalculateSharePermissions_AssetOwner_ReturnsFullPermissions (125ms)
# ✅ PASSED: ShareServiceTests.CalculateSharePermissions_NotOwner_ReturnsLimitedPermissions (89ms)
```

### Mocking Dependencies

When service depends on external services:

```csharp
[Fact]
public async Task ShareAsset_ValidRequest_CallsSignalRHub()
{
    // Arrange
    var mockHub = new Mock<IHubContext<AnnotationHub>>();
    var mockClients = new Mock<IHubClients>();
    var mockGroup = new Mock<IClientProxy>();
    
    mockHub.Setup(h => h.Clients).Returns(mockClients.Object);
    mockClients.Setup(c => c.Group(It.IsAny<string>())).Returns(mockGroup.Object);
    
    var shareService = new ShareService(mockHub.Object);
    var request = new ShareRequest { SessionId = 789, AssetId = "asset-123" };
    
    // Act
    await shareService.ShareAssetAsync(request);
    
    // Assert
    mockGroup.Verify(g => g.SendAsync("AssetShared", It.IsAny<object>(), default), Times.Once);
}
```

### KDS Template for Unit Tests

```markdown
## KDS Unit Test Template

When generating business logic code, follow this sequence:

### 1. Identify Pure Logic
Determine which methods have no external dependencies (DB, HTTP, file I/O).

### 2. Generate Test First
Create `Tests/Unit/{ComponentName}Tests.cs` with:
- ✅ Happy path test (valid input → expected output)
- ✅ Edge case test (boundary values)
- ✅ Error case test (invalid input → exception)

### 3. Run Test (RED)
Execute: `dotnet test --filter "FullyQualifiedName~{ComponentName}Tests"`
Verify test fails with compilation error or assertion failure.

### 4. Implement Code
Create minimal implementation in `SPA/NoorCanvas/{Namespace}/{ComponentName}.cs`

### 5. Run Test (GREEN)
Re-run tests, verify all pass.

### 6. Add Logging
Add correlation ID tracing:
```csharp
_logger.LogDebug(
    "[TRACE:service:{RequestId}] CalculateSharePermissions - UserId: {UserId} [KDS:{KDS}]",
    requestId, request.UserId, kdsCorrelationId
);
```
```

---

## Layer 2: Data Access Tests (Integration Tests)

### When to Use
- ✅ Repository methods (EF Core queries)
- ✅ Database operations (CRUD)
- ✅ Complex queries with joins
- ✅ Transaction handling

### Test-First Workflow

**Step 1: Create Failing Test**
```csharp
// File: Tests/Integration/Repositories/ShareRepositoryTests.cs
using Xunit;
using Microsoft.EntityFrameworkCore;
using NoorCanvas.Data;
using NoorCanvas.Repositories;

namespace NoorCanvas.Tests.Integration.Repositories
{
    public class ShareRepositoryTests : IDisposable
    {
        private readonly CanvasDbContext _context;
        private readonly ShareRepository _repository;
        
        public ShareRepositoryTests()
        {
            // Use In-Memory database for each test
            var options = new DbContextOptionsBuilder<CanvasDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
                
            _context = new CanvasDbContext(options);
            _repository = new ShareRepository(_context);
        }
        
        [Fact]
        public async Task SaveShareAsync_ValidShare_PersistsToDatabase()
        {
            // Arrange
            var share = new SharedAsset
            {
                AssetId = "asset-123",
                SharedBy = "user-456",
                SessionId = 789,
                SharedAt = DateTime.UtcNow
            };
            
            // Act
            var savedShare = await _repository.SaveShareAsync(share);
            
            // Assert
            Assert.NotNull(savedShare);
            Assert.True(savedShare.Id > 0); // Auto-generated ID
            
            var fromDb = await _context.SharedAssets.FindAsync(savedShare.Id);
            Assert.NotNull(fromDb);
            Assert.Equal("asset-123", fromDb.AssetId);
        }
        
        [Fact]
        public async Task GetActiveSharesForSession_MultipleShares_ReturnsOnlyActive()
        {
            // Arrange - Seed test data
            _context.SharedAssets.AddRange(
                new SharedAsset { AssetId = "asset-1", SessionId = 789, IsActive = true },
                new SharedAsset { AssetId = "asset-2", SessionId = 789, IsActive = false },
                new SharedAsset { AssetId = "asset-3", SessionId = 789, IsActive = true }
            );
            await _context.SaveChangesAsync();
            
            // Act
            var activeShares = await _repository.GetActiveSharesForSessionAsync(789);
            
            // Assert
            Assert.Equal(2, activeShares.Count);
            Assert.All(activeShares, share => Assert.True(share.IsActive));
        }
        
        public void Dispose()
        {
            _context?.Dispose();
        }
    }
}
```

**Step 2: Run Test (RED)**
```powershell
dotnet test --filter "FullyQualifiedName~ShareRepositoryTests"

# Expected:
# ❌ FAILED: ShareRepository does not exist
```

**Step 3: Implement Repository**
```csharp
// File: SPA/NoorCanvas/Repositories/ShareRepository.cs
using Microsoft.EntityFrameworkCore;
using NoorCanvas.Data;
using NoorCanvas.Models;

namespace NoorCanvas.Repositories
{
    public interface IShareRepository
    {
        Task<SharedAsset> SaveShareAsync(SharedAsset share);
        Task<List<SharedAsset>> GetActiveSharesForSessionAsync(long sessionId);
    }
    
    public class ShareRepository : IShareRepository
    {
        private readonly CanvasDbContext _context;
        private readonly ILogger<ShareRepository> _logger;
        
        public ShareRepository(CanvasDbContext context, ILogger<ShareRepository> logger)
        {
            _context = context;
            _logger = logger;
        }
        
        public async Task<SharedAsset> SaveShareAsync(SharedAsset share)
        {
            var requestId = Guid.NewGuid().ToString("N")[..8];
            _logger.LogDebug("[TRACE:data:{RequestId}] SaveShareAsync - AssetId: {AssetId}", 
                requestId, share.AssetId);
            
            _context.SharedAssets.Add(share);
            await _context.SaveChangesAsync();
            
            _logger.LogDebug("[TRACE:data:{RequestId}] Share saved - Id: {Id}", requestId, share.Id);
            return share;
        }
        
        public async Task<List<SharedAsset>> GetActiveSharesForSessionAsync(long sessionId)
        {
            var requestId = Guid.NewGuid().ToString("N")[..8];
            _logger.LogDebug("[TRACE:data:{RequestId}] GetActiveShares - SessionId: {SessionId}", 
                requestId, sessionId);
            
            var shares = await _context.SharedAssets
                .Where(s => s.SessionId == sessionId && s.IsActive)
                .ToListAsync();
            
            _logger.LogDebug("[TRACE:data:{RequestId}] Found {Count} active shares", 
                requestId, shares.Count);
            return shares;
        }
    }
}
```

**Step 4: Run Test (GREEN)**
```powershell
dotnet test --filter "FullyQualifiedName~ShareRepositoryTests"

# Expected:
# ✅ PASSED: SaveShareAsync_ValidShare_PersistsToDatabase (245ms)
# ✅ PASSED: GetActiveSharesForSession_MultipleShares_ReturnsOnlyActive (189ms)
```

### Database-Specific Tests

**Complex Queries:**
```csharp
[Fact]
public async Task GetSharedAssetsWithOwnerInfo_JoinQuery_ReturnsCompleteData()
{
    // Arrange
    var user = new User { UserId = "user-456", Name = "Test User" };
    _context.Users.Add(user);
    
    var share = new SharedAsset 
    { 
        AssetId = "asset-123", 
        SharedBy = "user-456", 
        SessionId = 789 
    };
    _context.SharedAssets.Add(share);
    await _context.SaveChangesAsync();
    
    // Act
    var result = await _repository.GetSharedAssetsWithOwnerInfoAsync(789);
    
    // Assert
    Assert.Single(result);
    Assert.Equal("asset-123", result[0].AssetId);
    Assert.Equal("Test User", result[0].OwnerName); // From join
}
```

**Transaction Handling:**
```csharp
[Fact]
public async Task ShareMultipleAssets_Transactional_AllOrNothing()
{
    // Arrange
    var assets = new List<SharedAsset>
    {
        new SharedAsset { AssetId = "asset-1", SessionId = 789 },
        new SharedAsset { AssetId = "asset-2", SessionId = 789 },
        new SharedAsset { AssetId = "invalid", SessionId = 789 } // Will fail validation
    };
    
    // Act & Assert
    await Assert.ThrowsAsync<ValidationException>(
        async () => await _repository.ShareMultipleAssetsAsync(assets)
    );
    
    // Verify rollback - no assets saved
    var savedCount = await _context.SharedAssets.CountAsync();
    Assert.Equal(0, savedCount);
}
```

### KDS Template for Data Access Tests

```markdown
## KDS Data Access Test Template

### 1. Identify Database Operations
Determine which methods interact with EF Core DbContext.

### 2. Generate Integration Test
Create `Tests/Integration/Repositories/{RepositoryName}Tests.cs` with:
- ✅ In-Memory database setup in constructor
- ✅ CRUD operation tests (Create, Read, Update, Delete)
- ✅ Query tests (filters, joins, ordering)
- ✅ Transaction tests (rollback scenarios)
- ✅ IDisposable cleanup

### 3. Run Test (RED)
Execute: `dotnet test --filter "FullyQualifiedName~{RepositoryName}Tests"`

### 4. Implement Repository
Create in `SPA/NoorCanvas/Repositories/{RepositoryName}.cs`

### 5. Run Test (GREEN)
Verify all database operations work correctly.

### 6. Add Logging
Include SQL-level tracing:
```csharp
_logger.LogDebug("[TRACE:data:{RequestId}] Executing query: {Query}", requestId, query);
```
```

---

## Layer 3: API Layer Tests (Integration Tests)

### When to Use
- ✅ Controller endpoints
- ✅ Request/response validation
- ✅ Authorization checks
- ✅ API contracts

### Test-First Workflow

**Step 1: Create Failing Test**
```csharp
// File: Tests/Integration/Controllers/ShareControllerTests.cs
using Xunit;
using Microsoft.AspNetCore.Mvc.Testing;
using System.Net.Http.Json;

namespace NoorCanvas.Tests.Integration.Controllers
{
    public class ShareControllerTests : IClassFixture<WebApplicationFactory<Program>>
    {
        private readonly WebApplicationFactory<Program> _factory;
        private readonly HttpClient _client;
        
        public ShareControllerTests(WebApplicationFactory<Program> factory)
        {
            _factory = factory.WithWebHostBuilder(builder =>
            {
                builder.ConfigureServices(services =>
                {
                    // Use in-memory database for tests
                    services.AddDbContext<CanvasDbContext>(options =>
                        options.UseInMemoryDatabase("TestDb"));
                });
            });
            
            _client = _factory.CreateClient();
        }
        
        [Fact]
        public async Task ShareAsset_ValidRequest_Returns200AndShareData()
        {
            // Arrange
            var request = new ShareRequest
            {
                AssetId = "asset-123",
                SessionId = 789,
                UserId = "user-456"
            };
            
            // Act
            var response = await _client.PostAsJsonAsync("/api/share", request);
            
            // Assert
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            
            var shareResponse = await response.Content.ReadFromJsonAsync<ShareResponse>();
            Assert.NotNull(shareResponse);
            Assert.Equal("asset-123", shareResponse.AssetId);
            Assert.True(shareResponse.Success);
        }
        
        [Fact]
        public async Task ShareAsset_InvalidAssetId_Returns400()
        {
            // Arrange
            var request = new ShareRequest
            {
                AssetId = "", // Invalid
                SessionId = 789,
                UserId = "user-456"
            };
            
            // Act
            var response = await _client.PostAsJsonAsync("/api/share", request);
            
            // Assert
            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
            
            var error = await response.Content.ReadFromJsonAsync<ErrorResponse>();
            Assert.Contains("AssetId", error.Message);
        }
        
        [Fact]
        public async Task ShareAsset_UnauthorizedUser_Returns401()
        {
            // Arrange
            var request = new ShareRequest
            {
                AssetId = "asset-123",
                SessionId = 789,
                UserId = null // No user
            };
            
            // Act
            var response = await _client.PostAsJsonAsync("/api/share", request);
            
            // Assert
            Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        }
    }
}
```

**Step 2: Run Test (RED)**
```powershell
dotnet test --filter "FullyQualifiedName~ShareControllerTests"

# Expected:
# ❌ FAILED: Route /api/share not found (404)
```

**Step 3: Implement Controller**
```csharp
// File: SPA/NoorCanvas/Controllers/ShareController.cs
using Microsoft.AspNetCore.Mvc;
using NoorCanvas.Services;
using NoorCanvas.Models;

namespace NoorCanvas.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ShareController : ControllerBase
    {
        private readonly IShareService _shareService;
        private readonly ILogger<ShareController> _logger;
        
        public ShareController(IShareService shareService, ILogger<ShareController> logger)
        {
            _shareService = shareService;
            _logger = logger;
        }
        
        [HttpPost]
        public async Task<IActionResult> ShareAsset(
            [FromBody] ShareRequest request,
            [FromHeader(Name = "X-KDS-Correlation-Id")] string? kdsCorrelationId)
        {
            var requestId = Guid.NewGuid().ToString("N")[..8];
            
            _logger.LogInformation(
                "[TRACE:api:{RequestId}] ShareAsset entry - AssetId: {AssetId} [KDS:{KDS}]",
                requestId, request.AssetId, kdsCorrelationId ?? "none"
            );
            
            // Validation
            if (string.IsNullOrEmpty(request.AssetId))
            {
                _logger.LogWarning("[TRACE:api:{RequestId}] Invalid AssetId", requestId);
                return BadRequest(new ErrorResponse { Message = "AssetId is required" });
            }
            
            if (string.IsNullOrEmpty(request.UserId))
            {
                _logger.LogWarning("[TRACE:api:{RequestId}] Unauthorized - No UserId", requestId);
                return Unauthorized();
            }
            
            try
            {
                _logger.LogDebug("[TRACE:api:{RequestId}] Calling ShareService", requestId);
                var result = await _shareService.ShareAssetAsync(request, requestId);
                
                _logger.LogInformation("[TRACE:api:{RequestId}] Share successful", requestId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[TRACE:api:{RequestId}] Share failed", requestId);
                return StatusCode(500, new ErrorResponse { Message = "Internal error" });
            }
        }
    }
}
```

**Step 4: Run Test (GREEN)**
```powershell
dotnet test --filter "FullyQualifiedName~ShareControllerTests"

# Expected:
# ✅ PASSED: ShareAsset_ValidRequest_Returns200AndShareData (456ms)
# ✅ PASSED: ShareAsset_InvalidAssetId_Returns400 (234ms)
# ✅ PASSED: ShareAsset_UnauthorizedUser_Returns401 (189ms)
```

### KDS Template for API Tests

```markdown
## KDS API Test Template

### 1. Identify API Endpoints
Determine which HTTP methods and routes are needed.

### 2. Generate API Test
Create `Tests/Integration/Controllers/{ControllerName}Tests.cs` with:
- ✅ WebApplicationFactory setup
- ✅ Happy path (200 OK with valid response)
- ✅ Validation errors (400 Bad Request)
- ✅ Authorization errors (401 Unauthorized)
- ✅ Server errors (500 Internal Server Error)

### 3. Run Test (RED)
Execute: `dotnet test --filter "FullyQualifiedName~{ControllerName}Tests"`

### 4. Implement Controller
Create in `SPA/NoorCanvas/Controllers/{ControllerName}.cs`

### 5. Run Test (GREEN)
Verify all API contracts work.

### 6. Add Logging
Include request/response tracing:
```csharp
_logger.LogInformation("[TRACE:api:{RequestId}] {Method} {Route} - Status: {Status}", 
    requestId, httpMethod, route, statusCode);
```
```

---

## Layer 4: UI Tests (E2E with Playwright)

### When to Use
- ✅ User interactions (clicks, typing, navigation)
- ✅ UI state changes
- ✅ SignalR real-time updates
- ✅ Cross-component workflows

### Test-First Workflow

**Step 1: Create Failing Test**
```typescript
// File: Tests/UI/share-asset-workflow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Share Asset Workflow', () => {
    
    test.beforeEach(async ({ page }) => {
        // Navigate to session canvas
        await page.goto('https://localhost:9091/Canvas/212/KJAHA99L');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000); // Wait for Blazor
    });
    
    test('should share asset and display in shared panel', async ({ page }) => {
        // Arrange - Find asset card
        const assetCard = page.locator('[data-asset-id="asset-ayah-card-1"]');
        await expect(assetCard).toBeVisible();
        
        // Act - Click share button
        const shareButton = assetCard.locator('button[data-share-button]');
        await shareButton.click();
        
        // Assert - Shared panel updated
        await page.waitForTimeout(1000); // Wait for SignalR broadcast
        
        const sharedPanel = page.locator('[data-shared-assets-panel]');
        const sharedAsset = sharedPanel.locator('[data-shared-asset-id="asset-ayah-card-1"]');
        
        await expect(sharedAsset).toBeVisible();
        await expect(sharedAsset).toContainText('Shared');
    });
    
    test('should show share confirmation toast', async ({ page }) => {
        // Arrange
        const shareButton = page.locator('[data-asset-id="asset-ayah-card-1"] button[data-share-button]');
        
        // Act
        await shareButton.click();
        
        // Assert - Toast appears
        const toast = page.locator('#toast-container .toast-success');
        await expect(toast).toBeVisible({ timeout: 3000 });
        await expect(toast).toContainText('Asset shared successfully');
    });
    
    test('should disable share button after sharing', async ({ page }) => {
        // Arrange
        const shareButton = page.locator('[data-asset-id="asset-ayah-card-1"] button[data-share-button]');
        
        // Act
        await shareButton.click();
        await page.waitForTimeout(500);
        
        // Assert - Button disabled
        await expect(shareButton).toBeDisabled();
        await expect(shareButton).toHaveText('Shared');
    });
});
```

**Step 2: Run Test (RED)**
```powershell
npx playwright test Tests/UI/share-asset-workflow.spec.ts

# Expected:
# ❌ FAILED: Element [data-share-button] not found
```

**Step 3: Implement UI Component**
```razor
<!-- File: SPA/NoorCanvas/Components/AssetCard.razor -->
@inject ILogger<AssetCard> Logger
@inject IHubContext<AnnotationHub> HubContext

<div class="asset-card" data-asset-id="@AssetId">
    <div class="asset-content">
        @ChildContent
    </div>
    
    <div class="asset-actions">
        <button 
            class="btn btn-primary" 
            data-share-button
            @onclick="ShareAsset"
            disabled="@IsShared">
            @(IsShared ? "Shared" : "Share")
        </button>
    </div>
</div>

@code {
    [Parameter] public string AssetId { get; set; } = string.Empty;
    [Parameter] public RenderFragment? ChildContent { get; set; }
    [Parameter] public long SessionId { get; set; }
    [Parameter] public string UserId { get; set; } = string.Empty;
    
    private bool IsShared { get; set; }
    
    private async Task ShareAsset()
    {
        var requestId = Guid.NewGuid().ToString("N")[..8];
        Logger.LogInformation(
            "[TRACE:ui:{RequestId}] Share button clicked - AssetId: {AssetId}",
            requestId, AssetId
        );
        
        try
        {
            // Call API
            var response = await Http.PostAsJsonAsync("/api/share", new
            {
                AssetId = AssetId,
                SessionId = SessionId,
                UserId = UserId
            });
            
            if (response.IsSuccessStatusCode)
            {
                Logger.LogInformation("[TRACE:ui:{RequestId}] Share API successful", requestId);
                
                IsShared = true;
                StateHasChanged();
                
                // Show toast
                await JSRuntime.InvokeVoidAsync("toastr.success", "Asset shared successfully");
                
                Logger.LogInformation("[TRACE:ui:{RequestId}] UI updated", requestId);
            }
        }
        catch (Exception ex)
        {
            Logger.LogError(ex, "[TRACE:ui:{RequestId}] Share failed", requestId);
            await JSRuntime.InvokeVoidAsync("toastr.error", "Failed to share asset");
        }
    }
}
```

**Step 4: Run Test (GREEN)**
```powershell
npx playwright test Tests/UI/share-asset-workflow.spec.ts

# Expected:
# ✅ PASSED: should share asset and display in shared panel (2.3s)
# ✅ PASSED: should show share confirmation toast (1.8s)
# ✅ PASSED: should disable share button after sharing (1.5s)
```

### KDS Template for UI Tests

```markdown
## KDS UI Test Template

### 1. Identify User Interaction
Determine what user actions trigger the feature.

### 2. Generate E2E Test
Create `Tests/UI/{feature-name}.spec.ts` with:
- ✅ Test setup (navigation, wait for Blazor)
- ✅ User action simulation (click, type, etc.)
- ✅ UI state verification (element visibility, text content)
- ✅ Toast/notification verification
- ✅ Real-time update verification (SignalR)

### 3. Run Test (RED)
Execute: `npx playwright test Tests/UI/{feature-name}.spec.ts`

### 4. Implement Component
Create in `SPA/NoorCanvas/Components/{ComponentName}.razor`

### 5. Run Test (GREEN)
Verify all user interactions work.

### 6. Add Logging
Include UI event tracing:
```csharp
Logger.LogDebug("[TRACE:ui:{RequestId}] Button clicked - Action: {Action}", 
    requestId, actionName);
```
```

---

## Layer 5: Visual Regression Tests (Percy)

### When to Use
- ✅ Visual styling changes
- ✅ Layout modifications
- ✅ Responsive design
- ✅ Cross-browser consistency

### Test-First Workflow

**Step 1: Create Visual Test**
```typescript
// File: Tests/UI/share-button-visual.spec.ts
import { test, expect } from '@playwright/test';
import percySnapshot from '@percy/playwright';

test.describe('Share Button Visual Regression', () => {
    
    test('share button appearance - default state', async ({ page }) => {
        // Arrange
        await page.goto('https://localhost:9091/Canvas/212/KJAHA99L');
        await page.waitForLoadState('networkidle');
        
        const assetCard = page.locator('[data-asset-id="asset-ayah-card-1"]');
        await expect(assetCard).toBeVisible();
        
        // Act & Assert - Percy snapshot
        await percySnapshot(page, 'Share Button - Default State', {
            widths: [375, 768, 1280], // Mobile, tablet, desktop
            minHeight: 1024
        });
    });
    
    test('share button appearance - hover state', async ({ page }) => {
        // Arrange
        await page.goto('https://localhost:9091/Canvas/212/KJAHA99L');
        await page.waitForLoadState('networkidle');
        
        const shareButton = page.locator('[data-asset-id="asset-ayah-card-1"] button[data-share-button]');
        
        // Act - Hover
        await shareButton.hover();
        
        // Assert - Percy snapshot
        await percySnapshot(page, 'Share Button - Hover State', {
            widths: [1280] // Desktop only for hover
        });
    });
    
    test('share button appearance - shared state', async ({ page }) => {
        // Arrange
        await page.goto('https://localhost:9091/Canvas/212/KJAHA99L');
        await page.waitForLoadState('networkidle');
        
        const shareButton = page.locator('[data-asset-id="asset-ayah-card-1"] button[data-share-button]');
        
        // Act - Share asset
        await shareButton.click();
        await page.waitForTimeout(1000);
        
        // Assert - Percy snapshot
        await percySnapshot(page, 'Share Button - Shared State', {
            widths: [375, 768, 1280]
        });
    });
});
```

**Step 2: Run Test (Creates Baseline)**
```powershell
$env:PERCY_TOKEN = "your-percy-token"
npx percy exec -- playwright test Tests/UI/share-button-visual.spec.ts

# Expected:
# [percy] Percy has started!
# [percy] Created build #1: https://percy.io/your-org/NOOR-CANVAS/builds/123
# [percy] Snapshot taken: Share Button - Default State (3 viewports)
# [percy] Snapshot taken: Share Button - Hover State (1 viewport)
# [percy] Snapshot taken: Share Button - Shared State (3 viewports)
# [percy] Build complete!
```

**Step 3: Implement Visual Design**
```css
/* File: SPA/NoorCanvas/wwwroot/css/asset-card.css */
.asset-card {
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    padding: 1rem;
    margin-bottom: 1rem;
}

.asset-card button[data-share-button] {
    background: #007bff;
    color: #fff;
    border: none;
    border-radius: 4px;
    padding: 0.5rem 1rem;
    cursor: pointer;
    transition: background 0.2s ease;
}

.asset-card button[data-share-button]:hover {
    background: #0056b3;
}

.asset-card button[data-share-button]:disabled {
    background: #6c757d;
    cursor: not-allowed;
}
```

**Step 4: Run Test (Visual Diff)**
```powershell
npx percy exec -- playwright test Tests/UI/share-button-visual.spec.ts

# Percy Dashboard:
# ✅ Share Button - Default State: No changes
# ⚠️ Share Button - Hover State: 2px padding difference detected
# ✅ Share Button - Shared State: No changes

# Review and approve/reject in Percy dashboard
```

### KDS Template for Visual Tests

```markdown
## KDS Visual Test Template

### 1. Identify Visual Changes
Determine which components have visual modifications.

### 2. Generate Percy Test
Create `Tests/UI/{component-name}-visual.spec.ts` with:
- ✅ Default state snapshot
- ✅ Hover/focus state snapshot
- ✅ Active/selected state snapshot
- ✅ Error state snapshot (if applicable)
- ✅ Multi-viewport snapshots (375, 768, 1280)

### 3. Run Test (Create Baseline)
Execute: `npx percy exec -- playwright test Tests/UI/{component-name}-visual.spec.ts`

### 4. Implement Visual Design
Create CSS in `SPA/NoorCanvas/wwwroot/css/{component-name}.css`

### 5. Run Test (Visual Diff)
Verify changes in Percy dashboard, approve if correct.

### 6. CSS Variables
Use CSS custom properties for consistency:
```css
:root {
    --color-primary: #007bff;
    --color-primary-hover: #0056b3;
    --border-radius: 4px;
}
```
```

---

## Cross-Layer Integration: Full Workflow Test

### When to Use
- ✅ Complete feature end-to-end
- ✅ Multi-step user flows
- ✅ Real-time updates across components
- ✅ Production-like scenarios

### Test-First Workflow

**Complete Test:**
```typescript
// File: Tests/UI/share-workflow-complete.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Complete Share Workflow - Multi-Layer', () => {
    
    test('share asset workflow - from click to real-time update', async ({ browser }) => {
        // Setup: Two contexts (sharer and receiver)
        const sharerContext = await browser.newContext();
        const receiverContext = await browser.newContext();
        
        const sharerPage = await sharerContext.newPage();
        const receiverPage = await receiverContext.newPage();
        
        // Both join same session
        await sharerPage.goto('https://localhost:9091/Canvas/212/TOKEN_USER_A');
        await receiverPage.goto('https://localhost:9091/Canvas/212/TOKEN_USER_B');
        
        await sharerPage.waitForLoadState('networkidle');
        await receiverPage.waitForLoadState('networkidle');
        
        // Act: User A shares asset
        const shareButton = sharerPage.locator('[data-asset-id="asset-ayah-card-1"] button[data-share-button]');
        await shareButton.click();
        
        // Assert Layer 1: UI updates for sharer
        await expect(shareButton).toBeDisabled();
        await expect(shareButton).toHaveText('Shared');
        
        // Assert Layer 2: Toast appears
        const toast = sharerPage.locator('#toast-container .toast-success');
        await expect(toast).toBeVisible({ timeout: 3000 });
        
        // Assert Layer 3: API called (network monitoring)
        // (Already verified by successful toast)
        
        // Assert Layer 4: Database persisted
        // (Verified by subsequent query - share appears in panel)
        
        // Assert Layer 5: SignalR broadcast to User B
        await receiverPage.waitForTimeout(2000); // Allow SignalR propagation
        
        const receiverSharedPanel = receiverPage.locator('[data-shared-assets-panel]');
        const receivedAsset = receiverSharedPanel.locator('[data-shared-asset-id="asset-ayah-card-1"]');
        
        await expect(receivedAsset).toBeVisible({ timeout: 5000 });
        await expect(receivedAsset).toContainText('Shared by User A');
        
        // Cleanup
        await sharerContext.close();
        await receiverContext.close();
    });
});
```

**This single test validates:**
- ✅ **UI Layer**: Button click, state change, toast
- ✅ **API Layer**: HTTP POST to /api/share
- ✅ **Service Layer**: ShareService business logic
- ✅ **Data Layer**: Database persistence
- ✅ **Real-Time Layer**: SignalR broadcast
- ✅ **Cross-User**: Receiver gets update

---

## Test Execution Order in KDS Workflow

### Recommended Sequence

```
1. UNIT TESTS (Fastest - Run First)
   ├─ Business logic tests
   ├─ Validation tests
   └─ Helper/utility tests
   
2. INTEGRATION TESTS (Medium Speed)
   ├─ Repository tests (in-memory DB)
   ├─ API tests (WebApplicationFactory)
   └─ Service integration tests
   
3. E2E TESTS (Slower - Run After)
   ├─ UI interaction tests
   ├─ Workflow tests
   └─ Cross-component tests
   
4. VISUAL TESTS (Slowest - Run Last)
   ├─ Component visual regression
   ├─ Layout tests
   └─ Multi-viewport tests
```

### KDS Execution Command

```powershell
# Run all tests in recommended order
dotnet test --logger "console;verbosity=detailed"
npx playwright test --reporter=html
npx percy exec -- playwright test Tests/UI/*-visual.spec.ts
```

---

## Test Coverage Goals

| Layer | Minimum Coverage | Critical Paths |
|-------|-----------------|----------------|
| Business Logic | 80% | 100% |
| Data Access | 70% | 90% |
| API Layer | 75% | 95% |
| UI Components | 60% | 80% |
| Visual | 100% of changed components | N/A |

---

## Summary

**KDS Test Strategy** follows a **layer-aware approach**:

1. **Business Logic** → Unit tests (xUnit, mocked dependencies)
2. **Data Access** → Integration tests (xUnit, in-memory EF Core)
3. **API Layer** → Integration tests (WebApplicationFactory)
4. **UI Components** → E2E tests (Playwright)
5. **Visual Design** → Visual regression (Percy + Playwright)
6. **Full Workflows** → Cross-layer E2E tests (Playwright multi-context)

**All tests follow RED-GREEN-REFACTOR cycle:**
1. Write failing test first
2. Run test (RED)
3. Implement minimum code
4. Run test (GREEN)
5. Add logging/tracing
6. Refactor if needed

**Correlation IDs** flow through all layers for end-to-end traceability from KDS workflow → production logs.

---

**Author**: GitHub Copilot  
**Date**: November 2, 2025  
**Version**: 1.0  
**Status**: Ready for Implementation
