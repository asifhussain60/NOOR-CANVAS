# Zoom Integration Plan v1.0

**Key**: `zoom-integration`  
**Status**: Draft - Awaiting Approval  
**Created**: 2025-10-25  
**Branch**: `zoom-integration/major-20251025` (Temporary - Requires EXPLICIT merge approval)  
**Parent**: N/A (New feature)  
**Classification**: MAJOR CHANGE

---

## Executive Summary

Integrate Zoom Meeting SDK 2.16.0 into NoorCanvas to enable embedded video conferencing with:
- ✅ Host-initiated meetings from HostControlPanel
- ✅ Participant joining from SessionCanvas/TranscriptCanvas  
- ✅ Auto-meeting creation via Zoom REST API
- ✅ Single token URL (Zoom always available)
- ✅ Cloud recording storage (Zoom managed)
- ✅ Host-only recording permissions

---

## User Decisions (from Questionnaire)

### Q1: Zoom SDK Credentials
**Chosen**: A - Yes, I have Zoom SDK credentials (ClientId/ClientSecret)  
**Impact**: Can proceed immediately with full integration. Phase 1 includes credential configuration.

### Q2: Meeting Creation Strategy
**Chosen**: A - Auto-create Zoom meetings when host starts session  
**Impact**: Requires Zoom REST API integration (Phase 2). Seamless UX, no manual meeting ID entry.

### Q3: Link Sharing Strategy
**Chosen**: A - Single token URL with auto-detect (Zoom always available)  
**Impact**: Simplest participant experience. SessionCanvas/TranscriptCanvas automatically show Zoom when session loaded.

### Q4: Recording Storage
**Chosen**: A - Zoom Cloud (default)  
**Impact**: No additional infrastructure needed. Recording management via Zoom's cloud storage.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         NOOR Canvas                              │
│                                                                   │
│  ┌─────────────────┐      ┌──────────────────┐                  │
│  │ HostControlPanel│◄────►│  ZoomController  │                  │
│  │   .razor        │      │   (API)          │                  │
│  │  [Start Mtg]    │      └────────┬─────────┘                  │
│  └────────┬────────┘               │                             │
│           │                        │                             │
│           │                ┌───────▼──────────┐                  │
│           │                │ ZoomMeetingService│                 │
│           │                │ (REST API Client) │                 │
│           │                └───────┬──────────┘                  │
│           │                        │                             │
│  ┌────────▼────────┐      ┌───────▼──────────┐                  │
│  │ SessionCanvas/  │      │ ZoomSignature    │                  │
│  │ TranscriptCanvas│      │ Service          │                  │
│  │ [Auto Zoom UI]  │      └───────┬──────────┘                  │
│  └────────┬────────┘               │                             │
│           │                        │                             │
│  ┌────────▼────────────────────────▼──────────┐                  │
│  │         ZoomOptions Configuration          │                  │
│  │    (User Secrets / Environment Variables)  │                  │
│  └─────────────────────────────────────────────┘                  │
│                                                                   │
└───────────────────────────┬───────────────────────────────────────┘
                            │
                ┌───────────▼───────────┐
                │   Zoom Meeting SDK    │
                │   (CDN v2.16.0)       │
                └───────────┬───────────┘
                            │
                ┌───────────▼───────────┐
                │   Zoom REST API       │
                │ (Meeting Management)  │
                └───────────────────────┘
```

---

## Database Schema Changes

### canvas.Sessions Table - New Columns

```sql
ALTER TABLE [canvas].[Sessions]
ADD 
    [ZoomMeetingId] BIGINT NULL,                    -- Zoom meeting ID (numeric)
    [ZoomMeetingUrl] NVARCHAR(512) NULL,            -- Participant join URL
    [ZoomStartUrl] NVARCHAR(512) NULL,              -- Host start URL
    [ZoomPassword] NVARCHAR(128) NULL,              -- Meeting password (encrypted)
    [ZoomRecordingEnabled] BIT NOT NULL DEFAULT 0,  -- Recording permission flag
    [ZoomMeetingUuid] NVARCHAR(256) NULL,           -- Zoom meeting UUID
    [ZoomCreatedAt] DATETIME2 NULL,                 -- When Zoom meeting was created
    [ZoomStatus] NVARCHAR(50) NULL;                 -- waiting|started|ended
```

---

## Phases

### Phase 1: Git Safety + Configuration + Database Schema
**Duration**: 30 min  
**Risk**: Low

**Tasks**:
1. Create git tag `pre-zoom-integration-2025-10-25` for rollback
2. Create temporary branch `zoom-integration/major-20251025`
3. Add `ZoomOptions.cs` configuration class
4. Configure User Secrets for development credentials
5. Add ZoomOptions to DI container in `Program.cs`
6. Create database migration script (add columns to canvas.Sessions)
7. Execute migration on KSESSIONS_DEV database

**Files**:
- Tag: `pre-zoom-integration-2025-10-25`
- Branch: `zoom-integration/major-20251025`
- New: `SPA/NoorCanvas/Configuration/ZoomOptions.cs`
- Modified: `SPA/NoorCanvas/Program.cs`
- New: `Migrations/migration-20251025-add-zoom-fields.sql`

**Acceptance Criteria**:
- ✅ Git tag created and verified
- ✅ Branch created and pushed to remote
- ✅ ZoomOptions loads credentials from User Secrets
- ✅ Database migration executes successfully
- ✅ Application builds without errors

**Commit**: `feat(zoom-integration): Phase 1 - Configuration and database schema`

---

### Phase 2: Zoom REST API Integration (Meeting Auto-Creation)
**Duration**: 2-3 hours  
**Risk**: Medium (External API dependency)

**Tasks**:
1. Create `ZoomMeetingService.cs` for REST API calls
2. Implement OAuth JWT generation for server-to-server auth
3. Implement `CreateMeeting()` method (POST /users/me/meetings)
4. Implement `GetMeeting(meetingId)` method (GET /meetings/{meetingId})
5. Implement `DeleteMeeting(meetingId)` method (DELETE /meetings/{meetingId})
6. Add error handling for API rate limits
7. Add retry logic with exponential backoff
8. Add structured logging for all API calls

**Files**:
- New: `SPA/NoorCanvas/Services/ZoomMeetingService.cs`
- Modified: `SPA/NoorCanvas/Program.cs` (register service)

**API Integration**:
```csharp
public async Task<ZoomMeetingResponse> CreateMeeting(CreateMeetingRequest request)
{
    // POST https://api.zoom.us/v2/users/me/meetings
    // Headers: Authorization: Bearer {JWT}
    // Body: { topic, agenda, settings: { join_before_host: false, ... } }
}
```

**Acceptance Criteria**:
- ✅ Zoom meeting created successfully via API
- ✅ Meeting ID, join URL, start URL returned
- ✅ Error handling for 401 (auth), 429 (rate limit), 500 (server)
- ✅ Retry logic tested with simulated failures
- ✅ Logs show API request/response details

**Commit**: `feat(zoom-integration): Phase 2 - Zoom REST API meeting service`

---

### Phase 3: Backend Core + Host Controls
**Duration**: 2 hours  
**Risk**: Low

**Tasks**:
1. Create `ZoomSignatureService.cs` for JWT signature generation (SDK auth)
2. Create `ZoomController.cs` with API endpoints:
   - `POST /api/zoom/create-meeting` - Host creates Zoom meeting
   - `GET /api/zoom/signature` - Generate SDK signature for join
   - `GET /api/zoom/meeting/{sessionId}` - Get Zoom meeting details
   - `GET /api/zoom/health` - Health check
3. Update `HostController.StartSession()` to trigger Zoom meeting creation
4. Add "Start Zoom Meeting" button to `HostControlPanel.razor`
5. Add Zoom meeting display section to HostControlPanel
6. Add recording controls (host-only)
7. Store Zoom meeting details in `canvas.Sessions` table

**Files**:
- New: `SPA/NoorCanvas/Services/ZoomSignatureService.cs`
- New: `SPA/NoorCanvas/Controllers/ZoomController.cs`
- Modified: `SPA/NoorCanvas/Controllers/HostController.cs`
- Modified: `SPA/NoorCanvas/Pages/HostControlPanel.razor`

**HostControlPanel UI Changes**:
```razor
<!-- Add to session management section -->
<div class="zoom-meeting-section">
    <h3>Zoom Meeting</h3>
    
    @if (string.IsNullOrEmpty(Model.ZoomMeetingUrl))
    {
        <button @onclick="CreateZoomMeeting" class="btn-create-zoom">
            📹 Start Zoom Meeting
        </button>
    }
    else
    {
        <div class="zoom-meeting-active">
            <p>✅ Zoom Meeting Active</p>
            <p>Meeting ID: @Model.ZoomMeetingId</p>
            <button @onclick="JoinAsHost" class="btn-join-host">
                Join as Host
            </button>
            <button @onclick="ToggleRecording" class="btn-record">
                @(Model.ZoomRecordingEnabled ? "⏸️ Stop Recording" : "⏺️ Start Recording")
            </button>
        </div>
    }
</div>
```

**Acceptance Criteria**:
- ✅ Host clicks "Start Zoom Meeting" → API creates meeting via Phase 2 service
- ✅ Meeting details saved to database
- ✅ Host can join meeting with host privileges
- ✅ Recording toggle works (host-only)
- ✅ Health check endpoint returns configuration status

**Commit**: `feat(zoom-integration): Phase 3 - Host controls and API endpoints`

---

### Phase 4: Participant UI (SessionCanvas + TranscriptCanvas)
**Duration**: 2 hours  
**Risk**: Medium (JavaScript interop)

**Tasks**:
1. Add Zoom SDK scripts to `_Host.cshtml` (CDN v2.16.0)
2. Create `zoomInterop.js` for SDK initialization
3. Create `zoom-meeting.css` for SDK styling
4. Update `SessionCanvas.razor` to auto-show Zoom if meeting exists
5. Update `TranscriptCanvas.razor` to auto-show Zoom if meeting exists
6. Implement `JoinZoomMeeting()` JavaScript interop method
7. Implement `LeaveZoomMeeting()` method
8. Add Zoom SDK container (`<div id="zmmtg-root">`)
9. Disable recording UI for participants (host-only restriction)
10. Add "Leave Meeting" button

**Files**:
- Modified: `SPA/NoorCanvas/Pages/_Host.cshtml`
- New: `SPA/NoorCanvas/wwwroot/js/zoomInterop.js`
- New: `SPA/NoorCanvas/wwwroot/css/zoom-meeting.css`
- Modified: `SPA/NoorCanvas/Pages/SessionCanvas.razor`
- Modified: `SPA/NoorCanvas/Pages/TranscriptCanvas.razor`

**SDK Integration** (`_Host.cshtml`):
```html
<!-- Zoom SDK v2.16.0 -->
<link href="https://source.zoom.us/2.16.0/css/bootstrap.css" rel="stylesheet" />
<link href="https://source.zoom.us/2.16.0/css/react-select.css" rel="stylesheet" />
<script src="https://source.zoom.us/2.16.0/lib/vendor/react.min.js"></script>
<script src="https://source.zoom.us/2.16.0/lib/vendor/react-dom.min.js"></script>
<script src="https://source.zoom.us/2.16.0/lib/vendor/redux.min.js"></script>
<script src="https://source.zoom.us/2.16.0/lib/vendor/redux-thunk.min.js"></script>
<script src="https://source.zoom.us/2.16.0/lib/vendor/lodash.min.js"></script>
<script src="https://source.zoom.us/zoom-meeting-2.16.0.min.js"></script>
<script src="~/js/zoomInterop.js" asp-append-version="true"></script>
```

**SessionCanvas.razor Changes**:
```razor
@code {
    protected override async Task OnInitializedAsync()
    {
        // ... existing code ...
        
        // Load session data
        await LoadSessionData();
        
        // Auto-join Zoom if meeting exists (User Choice: Q3-A)
        if (!string.IsNullOrEmpty(sessionData.ZoomMeetingUrl))
        {
            await JoinZoomMeeting();
        }
    }
    
    private async Task JoinZoomMeeting()
    {
        // Get signature from API
        var signature = await GetZoomSignature(sessionData.ZoomMeetingId);
        
        // Call JavaScript interop
        await JSRuntime.InvokeVoidAsync("zoomInterop.initZoomMeeting", 
            sessionData.ZoomMeetingId,
            participantName,
            signature,
            zoomSdkKey,
            participantEmail,
            sessionData.ZoomPassword,
            "/session/canvas/" + sessionToken // leave URL
        );
    }
}
```

**Acceptance Criteria**:
- ✅ Participant opens session link → Zoom SDK loads automatically
- ✅ Zoom UI embedded in page (no redirect)
- ✅ Participant can join meeting with correct permissions
- ✅ Recording UI hidden for participants
- ✅ Leave meeting returns to canvas view
- ✅ Works in SessionCanvas and TranscriptCanvas

**Commit**: `feat(zoom-integration): Phase 4 - Participant Zoom UI auto-load`

---

### Phase 5: Testing + Documentation
**Duration**: 1-2 hours  
**Risk**: Low

**Tasks**:
1. Create E2E test: Host creates meeting
2. Create E2E test: Participant joins meeting
3. Create E2E test: Recording permissions (host-only)
4. Create Percy visual test: HostControlPanel with Zoom controls
5. Create Percy visual test: SessionCanvas with Zoom embedded
6. Update `ZOOM-INTEGRATION-DOCUMENTATION.md` with implementation details
7. Create deployment checklist
8. Document rollback procedure (git tag usage)

**Files**:
- New: `Tests/UI/zoom-host-create-meeting.spec.ts`
- New: `Tests/UI/zoom-participant-join.spec.ts`
- New: `Tests/UI/zoom-recording-permissions.spec.ts`
- New: `Tests/UI/zoom-visual-host-controls.spec.ts`
- New: `Tests/UI/zoom-visual-participant-canvas.spec.ts`
- Modified: `Docs/ZOOM-INTEGRATION-DOCUMENTATION.md`
- New: `.github/key-data-streams/zoom-integration/deployment-checklist.md`

**Test Scenarios**:
1. **Host Workflow**: Login → Start Session → Create Zoom Meeting → Join as Host → Toggle Recording
2. **Participant Workflow**: Receive link → Open canvas → Auto-join Zoom → Leave meeting
3. **Recording Restrictions**: Participant attempts recording → UI hidden, API blocks request
4. **Visual Regression**: Before/after screenshots for HostControlPanel and SessionCanvas

**Acceptance Criteria**:
- ✅ All E2E tests pass
- ✅ Percy visual tests show no regressions
- ✅ Documentation complete and accurate
- ✅ Deployment checklist validated
- ✅ Rollback procedure tested (revert to git tag)

**Commit**: `test(zoom-integration): Phase 5 - E2E and visual regression tests`

---

### Phase 6: Production Deployment Preparation
**Duration**: 1 hour  
**Risk**: Medium (Production credentials)

**Tasks**:
1. Create production Zoom credentials (if different from dev)
2. Configure environment variables for production IIS
3. Update `web.config` with Zoom credentials placeholders
4. Create database migration script for production (KSESSIONS)
5. Dry-run deployment on staging environment
6. Create deployment runbook
7. Plan rollback strategy

**Files**:
- Modified: `SPA/NoorCanvas/web.config`
- New: `Scripts/deploy-zoom-integration-prod.ps1`
- New: `.github/key-data-streams/zoom-integration/rollback-plan.md`

**Production Checklist**:
- [ ] Zoom credentials stored in Azure Key Vault (or secure storage)
- [ ] Environment variables configured in IIS
- [ ] Database migration executed on KSESSIONS (production)
- [ ] Staging deployment successful
- [ ] Smoke tests passed on staging
- [ ] Rollback git tag accessible: `pre-zoom-integration-2025-10-25`

**Acceptance Criteria**:
- ✅ Production credentials configured and tested
- ✅ Database migration validated on staging
- ✅ Deployment runbook reviewed and approved
- ✅ Rollback strategy documented and tested

**Commit**: `chore(zoom-integration): Phase 6 - Production deployment preparation`

---

## Temporary Branch Workflow

### Branch Name
`zoom-integration/major-20251025`

### Justification
- ✅ Third-party SDK integration (Zoom)
- ✅ Database schema modifications (6 new columns)
- ✅ External API dependency (Zoom REST API)
- ✅ Multiple files across backend, frontend, database

### Verification Checklist (Pre-Merge)

**Code Quality**:
- [ ] All phases committed successfully
- [ ] No compiler errors or warnings
- [ ] Code follows NoorCanvas patterns
- [ ] Logging added for all Zoom operations

**Testing**:
- [ ] E2E tests pass (5 test files)
- [ ] Percy visual tests pass (2 snapshots)
- [ ] Manual testing completed:
  - [ ] Host creates meeting
  - [ ] Participant joins meeting
  - [ ] Recording permissions enforced
  - [ ] Leave meeting works
  - [ ] Rollback tested

**Security**:
- [ ] Credentials in User Secrets (dev) / Environment Variables (prod)
- [ ] No credentials in source code
- [ ] API error messages don't leak sensitive data
- [ ] Recording restricted to host only

**Database**:
- [ ] Migration script executed on KSESSIONS_DEV
- [ ] New columns nullable (backward compatible)
- [ ] Rollback script tested

**Documentation**:
- [ ] ZOOM-INTEGRATION-DOCUMENTATION.md updated
- [ ] Deployment checklist complete
- [ ] Rollback procedure documented

### Branch Creation Commands (EXECUTE THESE)

```powershell
# 1. Create git tag for rollback safety
git tag -a pre-zoom-integration-2025-10-25 -m "Baseline before Zoom integration - safe rollback point"
git push origin pre-zoom-integration-2025-10-25

# 2. Create and switch to temporary branch
git checkout -b zoom-integration/major-20251025

# 3. Verify branch
git branch --show-current  # Should output: zoom-integration/major-20251025

# 4. Push branch to remote
git push -u origin zoom-integration/major-20251025
```

### Merge Commands (ONLY AFTER USER APPROVAL: "approve merge zoom-integration/major-20251025")

```powershell
# User must explicitly say: "approve merge zoom-integration/major-20251025"

# 1. Ensure development is up to date
git fetch origin
git checkout development
git pull --ff-only origin development

# 2. Merge temporary branch (no fast-forward to preserve history)
git merge --no-ff zoom-integration/major-20251025 -m "feat(zoom): Merge Zoom SDK integration into development

Phases completed:
- Phase 1: Configuration + database schema
- Phase 2: Zoom REST API integration
- Phase 3: Host controls
- Phase 4: Participant UI
- Phase 5: Testing + documentation
- Phase 6: Production deployment prep

User decisions:
- Auto-create meetings (Zoom REST API)
- Single token URL (Zoom always available)
- Cloud recording storage

Verification checklist: PASSED
Rollback tag: pre-zoom-integration-2025-10-25"

# 3. Push merged development branch
git push origin development

# 4. Delete temporary branch (after successful production deployment)
git branch -d zoom-integration/major-20251025
git push origin --delete zoom-integration/major-20251025
```

### Rollback Procedure

If issues discovered after merge:

```powershell
# Option 1: Revert to tag (safest)
git checkout development
git reset --hard pre-zoom-integration-2025-10-25
git push --force origin development  # CAUTION: Requires team coordination

# Option 2: Revert merge commit
git revert -m 1 <merge-commit-hash>
git push origin development
```

---

## Files to be Created/Modified

### New Files (15)
1. `SPA/NoorCanvas/Configuration/ZoomOptions.cs`
2. `SPA/NoorCanvas/Services/ZoomMeetingService.cs`
3. `SPA/NoorCanvas/Services/ZoomSignatureService.cs`
4. `SPA/NoorCanvas/Controllers/ZoomController.cs`
5. `SPA/NoorCanvas/wwwroot/js/zoomInterop.js`
6. `SPA/NoorCanvas/wwwroot/css/zoom-meeting.css`
7. `Migrations/migration-20251025-add-zoom-fields.sql`
8. `Migrations/rollback-20251025-add-zoom-fields.sql`
9. `Tests/UI/zoom-host-create-meeting.spec.ts`
10. `Tests/UI/zoom-participant-join.spec.ts`
11. `Tests/UI/zoom-recording-permissions.spec.ts`
12. `Tests/UI/zoom-visual-host-controls.spec.ts`
13. `Tests/UI/zoom-visual-participant-canvas.spec.ts`
14. `.github/key-data-streams/zoom-integration/deployment-checklist.md`
15. `.github/key-data-streams/zoom-integration/rollback-plan.md`

### Modified Files (6)
1. `SPA/NoorCanvas/Program.cs` (DI registration)
2. `SPA/NoorCanvas/Pages/_Host.cshtml` (Zoom SDK scripts)
3. `SPA/NoorCanvas/Pages/HostControlPanel.razor` (Zoom controls)
4. `SPA/NoorCanvas/Pages/SessionCanvas.razor` (auto-join Zoom)
5. `SPA/NoorCanvas/Pages/TranscriptCanvas.razor` (auto-join Zoom)
6. `Docs/ZOOM-INTEGRATION-DOCUMENTATION.md` (updated implementation details)

---

## Risk Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Zoom API rate limits | Medium | High | Implement exponential backoff, cache meeting details |
| SDK CDN unavailable | Low | High | Add local fallback copies of SDK files |
| Meeting creation fails | Medium | Medium | Graceful error handling, retry logic, notify host |
| Database migration fails | Low | High | Test on staging first, have rollback script ready |
| Merge conflicts | Medium | Low | Frequent rebases from development, small commits |

---

## Success Criteria

**Functional**:
- ✅ Host can create Zoom meetings from HostControlPanel
- ✅ Participants auto-join Zoom when opening session link
- ✅ Recording restricted to host only
- ✅ Single token URL works seamlessly

**Technical**:
- ✅ All 6 phases completed successfully
- ✅ All E2E tests pass
- ✅ Percy visual tests pass
- ✅ No production regressions

**Operational**:
- ✅ Deployment checklist validated
- ✅ Rollback procedure tested
- ✅ Documentation complete

---

## Timeline Estimate

| Phase | Duration | Cumulative |
|-------|----------|------------|
| Phase 1: Configuration + DB | 30 min | 30 min |
| Phase 2: Zoom REST API | 2-3 hours | 3.5 hours |
| Phase 3: Host Controls | 2 hours | 5.5 hours |
| Phase 4: Participant UI | 2 hours | 7.5 hours |
| Phase 5: Testing | 1-2 hours | 9.5 hours |
| Phase 6: Deployment Prep | 1 hour | 10.5 hours |

**Total**: ~10-11 hours (1.5 work days)

---

## Next Steps

**User Action Required**:
1. Review this plan
2. Approve or request modifications
3. Say "proceed" to begin Phase 1

**Agent Actions After Approval**:
1. Create git tag `pre-zoom-integration-2025-10-25`
2. Create branch `zoom-integration/major-20251025`
3. Execute Phase 1 tasks
4. Commit and checkpoint
5. Present Phase 2 for execution

---

**Plan Status**: ✅ Ready for Approval  
**Questionnaire**: ✅ Completed (4/4 questions answered)  
**User Decisions**: ✅ Incorporated into phases  
**Branch Workflow**: ✅ Defined (temporary branch with merge protection)
