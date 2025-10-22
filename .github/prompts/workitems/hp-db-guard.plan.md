# WORKITEM: hp-db-guard - Database Environment Guard Security

**Created**: 2025-10-22  
**Status**: Ready for Execution  
**Priority**: CRITICAL (Security)  
**Assignee**: GitHub Copilot Agent  

## Problem Statement
Host Provisioner WinForms executable in production did not close on click, indicating deployment failed to update the binary. This reveals a critical security risk: if production application (noorcanvas.servehttp.com) connects to KSESSIONS_DEV database, it could corrupt development data or expose production users to test data.

## Acceptance Criteria
1. ✅ Production URL + KSESSIONS_DEV connection = **RED ALERT UI BLOCK** (no interaction allowed)
2. ✅ Production URL + KSESSIONS connection = Normal operation (no alert)
3. ✅ Development URL + KSESSIONS_DEV connection = Normal operation (no alert)
4. ✅ Detection service injectable and reusable across pages
5. ✅ Alert displays hostname, expected database, actual database
6. ✅ Only affects 3 host pages: HostControlPanel, Host-SessionOpener, HostLanding
7. ✅ Zero false positives (localhost:9091 never triggers alert)
8. ✅ Full-screen overlay blocks all UI interaction when alert active

## Phases

### Phase 1: Create DatabaseEnvironmentGuard Service
**Context**: Need reusable service to detect production URL + dev database mismatch

**Files to Create**:
- `SPA/NoorCanvas/Services/Security/DatabaseEnvironmentGuardService.cs`
- `SPA/NoorCanvas/Services/Security/IDatabaseEnvironmentGuardService.cs`

**Implementation**:
```csharp
// IDatabaseEnvironmentGuardService.cs
public interface IDatabaseEnvironmentGuardService
{
    /// <summary>
    /// Check if production app is connecting to development database (security violation)
    /// </summary>
    /// <param name="currentUrl">Current request URL (from NavigationManager)</param>
    /// <returns>Mismatch details if violation detected, null if safe</returns>
    EnvironmentMismatchInfo? CheckEnvironmentMismatch(string currentUrl);
}

public class EnvironmentMismatchInfo
{
    public string Hostname { get; set; } = "";
    public string ExpectedDatabase { get; set; } = "KSESSIONS";
    public string ActualDatabase { get; set; } = "";
    public string Severity { get; set; } = "CRITICAL";
}

// DatabaseEnvironmentGuardService.cs
public class DatabaseEnvironmentGuardService : IDatabaseEnvironmentGuardService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<DatabaseEnvironmentGuardService> _logger;
    
    // Detection logic:
    // 1. Parse hostname from currentUrl
    // 2. Check if hostname contains "noorcanvas.servehttp.com" (production)
    // 3. Extract database name from connection string
    // 4. If production hostname AND database contains "KSESSIONS_DEV" → VIOLATION
    // 5. Log all checks for audit trail
}
```

**Service Registration**:
- Add to `Program.cs` DI container: `builder.Services.AddScoped<IDatabaseEnvironmentGuardService, DatabaseEnvironmentGuardService>();`

**@task Prompt**:
```
Create IDatabaseEnvironmentGuardService and DatabaseEnvironmentGuardService in SPA/NoorCanvas/Services/Security/.
Service must detect if hostname contains "noorcanvas.servehttp.com" AND connection string contains "KSESSIONS_DEV".
Return EnvironmentMismatchInfo with hostname, expected "KSESSIONS", actual database name, severity "CRITICAL".
Register service in Program.cs as scoped dependency.
Include comprehensive logging for security audit trail.
```

**Exit Criteria**:
- ✅ Service compiles without errors
- ✅ Service registered in DI container
- ✅ Detects production URL (noorcanvas.servehttp.com)
- ✅ Detects dev database (KSESSIONS_DEV in connection string)
- ✅ Returns null for safe combinations (localhost + KSESSIONS_DEV, production + KSESSIONS)

---

### Phase 2: Integrate Security Guard into 3 Host Pages
**Context**: Add full-screen red alert overlay to block UI when mismatch detected

**Files to Modify**:
1. `SPA/NoorCanvas/Pages/HostControlPanel.razor`
2. `SPA/NoorCanvas/Pages/Host-SessionOpener.razor`
3. `SPA/NoorCanvas/Pages/HostLanding.razor`

**Implementation Pattern** (apply to all 3 pages):
```razor
@inject IDatabaseEnvironmentGuardService DbGuard
@inject NavigationManager Navigation

@code {
    private EnvironmentMismatchInfo? environmentMismatch = null;
    
    protected override async Task OnInitializedAsync()
    {
        // FIRST CHECK - before any other logic
        environmentMismatch = DbGuard.CheckEnvironmentMismatch(Navigation.Uri);
        
        if (environmentMismatch != null)
        {
            Logger.LogCritical("[SECURITY-VIOLATION] Production app connected to dev database! Hostname: {Hostname}, Expected: {Expected}, Actual: {Actual}",
                environmentMismatch.Hostname,
                environmentMismatch.ExpectedDatabase,
                environmentMismatch.ActualDatabase);
            return; // STOP - do not load any data
        }
        
        // Normal initialization continues only if safe...
    }
}

<!-- FULL-SCREEN RED ALERT (at top of page, before any other content) -->
@if (environmentMismatch != null)
{
    <div style="position:fixed;top:0;left:0;width:100vw;height:100vh;background-color:#DC2626;z-index:9999;display:flex;align-items:center;justify-content:center;padding:2rem;">
        <div style="background-color:white;border-radius:1rem;padding:3rem;max-width:600px;box-shadow:0 25px 50px rgba(0,0,0,0.5);text-align:center;">
            <div style="font-size:5rem;color:#DC2626;margin-bottom:1rem;">🚨</div>
            <h1 style="font-family:'Poppins',sans-serif;font-size:2rem;color:#DC2626;margin:0 0 1rem 0;">SECURITY VIOLATION</h1>
            <p style="font-family:'Inter',sans-serif;font-size:1.125rem;color:#374151;margin:0 0 1.5rem 0;">
                Production application is connected to <strong>DEVELOPMENT DATABASE</strong>
            </p>
            <div style="background-color:#FEE2E2;border:2px solid #DC2626;border-radius:0.5rem;padding:1rem;text-align:left;margin-bottom:1.5rem;">
                <p style="margin:0.5rem 0;font-family:monospace;font-size:0.875rem;"><strong>Hostname:</strong> @environmentMismatch.Hostname</p>
                <p style="margin:0.5rem 0;font-family:monospace;font-size:0.875rem;"><strong>Expected Database:</strong> @environmentMismatch.ExpectedDatabase</p>
                <p style="margin:0.5rem 0;font-family:monospace;font-size:0.875rem;"><strong>Actual Database:</strong> @environmentMismatch.ActualDatabase</p>
            </div>
            <p style="font-family:'Inter',sans-serif;font-size:0.875rem;color:#6B7280;">
                This page has been blocked for security. Contact system administrator immediately.
            </p>
        </div>
    </div>
}
```

**@task Prompt**:
```
Integrate IDatabaseEnvironmentGuardService into HostControlPanel.razor, Host-SessionOpener.razor, and HostLanding.razor.
Inject DbGuard service and Navigation manager.
In OnInitializedAsync, call DbGuard.CheckEnvironmentMismatch(Navigation.Uri) FIRST before any other logic.
If mismatch detected, log critical security violation and return early (do not load data).
Add full-screen red alert overlay (z-index 9999, fixed position, red background #DC2626) at top of each page.
Alert must display hostname, expected database, actual database from EnvironmentMismatchInfo.
Alert must completely block UI interaction (no clickable elements behind it).
Use conditional rendering: @if (environmentMismatch != null) { ... }
```

**Exit Criteria**:
- ✅ All 3 pages inject DbGuard service
- ✅ OnInitializedAsync checks environment mismatch BEFORE other logic
- ✅ Red alert renders when mismatch detected
- ✅ Alert displays correct hostname, expected DB, actual DB
- ✅ Alert blocks all UI interaction (z-index 9999, full-screen overlay)
- ✅ Build succeeds with zero errors

---

### Phase 3: Testing and Validation
**Context**: Verify security guard works correctly for all scenarios

**Test Scenarios**:
1. **Production URL + KSESSIONS_DEV** → RED ALERT (violation)
2. **Production URL + KSESSIONS** → Normal operation (safe)
3. **localhost:9091 + KSESSIONS_DEV** → Normal operation (safe, development)
4. **localhost:9091 + KSESSIONS** → Normal operation (safe)

**Manual Testing Steps**:
1. Modify `appsettings.Production.json` connection string to use "KSESSIONS_DEV"
2. Deploy to production (ncdeploy.ps1)
3. Navigate to https://noorcanvas.servehttp.com/host/landing
4. **Expected**: Full-screen red alert with security violation message
5. Revert connection string to "KSESSIONS"
6. Redeploy to production
7. Navigate to same URL
8. **Expected**: Normal page load, no alert

**@test-generation Prompt**:
```
Create integration tests for DatabaseEnvironmentGuardService covering:
1. Production URL (noorcanvas.servehttp.com) + KSESSIONS_DEV → Returns EnvironmentMismatchInfo
2. Production URL + KSESSIONS → Returns null
3. Localhost URL + KSESSIONS_DEV → Returns null
4. Localhost URL + KSESSIONS → Returns null
5. Service correctly parses hostname from full URLs
6. Service correctly extracts database name from connection strings

Create Playwright UI tests for Host pages covering:
1. When environmentMismatch is set, red alert overlay is visible
2. Alert displays correct hostname, expected DB, actual DB
3. Alert blocks interaction with underlying page elements
4. When environmentMismatch is null, page loads normally
```

**Documentation**:
- Update `Tools/HostProvisioner/README.md` with security guard section
- Create `.github/instructions/DatabaseEnvironmentGuard.md` explaining deployment validation steps

**Exit Criteria**:
- ✅ All integration tests pass
- ✅ Manual testing confirms red alert on production + dev database
- ✅ Manual testing confirms normal operation on production + production database
- ✅ Documentation updated with security guard details
- ✅ Build succeeds with zero errors and zero warnings

---

## Error Remediation Plan
**Pre-Execution**: Collect all existing build errors (CA2017 in SessionController.cs is known pre-existing warning)

**During Implementation**:
- If DI registration fails → Verify service interface/implementation naming matches
- If connection string parsing fails → Add null checks and defensive parsing
- If hostname detection fails → Log actual URL received for debugging
- If red alert doesn't render → Check z-index conflicts with existing styles
- If alert doesn't block interaction → Verify fixed positioning and 100vw/100vh dimensions

**Post-Implementation**:
- Collect all new errors introduced
- Categorize: Critical (blocks functionality), High (degrades UX), Medium (cosmetic), Low (warnings)
- Execute fixes for critical and high severity
- Document medium/low severity for future work

---

## Self-Review Loop (Phase 4)
**After Phase 3 completes**:

1. **Design Review**:
   - ✅ Service follows repository DI patterns
   - ✅ UI overlay matches NOOR Canvas design system (Poppins titles, Inter body text, #DC2626 red)
   - ✅ Only 3 specified host pages modified (no scope creep)

2. **Functionality Review**:
   - ✅ Production + dev database triggers alert (acceptance criteria 1)
   - ✅ Production + production database = normal operation (acceptance criteria 2)
   - ✅ Development + dev database = normal operation (acceptance criteria 3)
   - ✅ Alert displays all required info (acceptance criteria 5)

3. **Code Quality Review**:
   - ✅ No dead code or unused variables
   - ✅ Comprehensive logging for security audit
   - ✅ Null safety on connection string parsing
   - ✅ No hardcoded values (read from configuration)

4. **Test Coverage Review**:
   - ✅ Integration tests cover all 4 URL/database combinations
   - ✅ UI tests verify alert rendering and blocking behavior
   - ✅ Manual testing confirms real-world production scenario

5. **Documentation Review**:
   - ✅ README.md updated with security guard section
   - ✅ Instructions file created for deployment validation
   - ✅ Inline code comments explain security logic

**Pass Criteria**:
- All acceptance criteria met (8/8)
- All tests passing (zero failures)
- Build succeeds (zero errors, zero warnings)
- Manual production test confirms red alert on mismatch
- Maximum 3 self-review iterations (escalate if fails 3 times)

---

## Final Healthcheck (Phase 5)
**Run**: `@healthcheck scope=all` to validate entire system

**Verification**:
- ✅ No regressions in existing host pages
- ✅ Service registration doesn't break DI container
- ✅ Production deployment succeeds
- ✅ HostProvisioner.WinForms.exe auto-close works (original issue)

**Completion Metrics**:
- Files Created: 2 (service interface + implementation)
- Files Modified: 4 (3 host pages + Program.cs)
- Lines Added: ~250
- Tests Created: 10+ (integration + UI)
- Security Vulnerabilities Fixed: 1 (critical)

---

## Commit Strategy
**Per Phase Checkpoint Commits** (following `commit-checkpoint-protocol.md`):

1. Phase 1: `ckpt(hp-db-guard): Phase 1 - DatabaseEnvironmentGuard service created`
2. Phase 2: `ckpt(hp-db-guard): Phase 2 - Security alert integrated into 3 host pages`
3. Phase 3: `ckpt(hp-db-guard): Phase 3 - Testing and validation complete`
4. Final: `feat(security): Database environment guard prevents production/dev mismatch`

**MANDATORY**: Git commit after EVERY phase completion, even if tests fail (commit test failures for review).

---

## Notes
- **HostProvisioner.WinForms Issue**: Original problem (exe not closing) indicates deployment script may not be copying latest binaries. Investigate ncdeploy.ps1 after this security fix.
- **Future Enhancement**: Consider extending guard to ALL pages, not just host pages, for comprehensive protection.
- **Deployment Validation**: Add pre-deployment smoke test that verifies connection string matches environment.
