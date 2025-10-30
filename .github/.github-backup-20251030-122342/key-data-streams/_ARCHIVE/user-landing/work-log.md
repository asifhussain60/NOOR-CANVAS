# Work Log - user-landing

**Key**: `user-landing`  
**Branch**: `development`  
**Created**: 2025-10-20  
**Status**: Planning Complete - Ready for Implementation

---

## Problem Statement

Host selects between "Asset Share" and "Section Share" on `HostControlPanel.razor`, but this selection is only tracked locally. When users register on `UserLanding.razor` during an active session, the app doesn't know which canvas type to route them to, resulting in incorrect routing (always defaulting to SessionCanvas).

## Solution Summary

Add `CanvasType` column to `canvas.Sessions` table to persist host's selection, update API to save the value, and modify `UserLanding.razor` to route users based on database `CanvasType`.

## User Answers to Open Questions

1. **Update existing NULL values to "asset"?** → YES
2. **Production migration needed?** → YES (ALWAYS)
3. **TranscriptCanvas route?** → `/transcript/canvas/{token}` (transcript token)
4. **Asset token route?** → `/session/canvas/{token}`

## Implementation Plan

- **Total Phases**: 5
- **Estimated Duration**: 3h 30min
- **Risk Level**: Low
- **Enhancements Selected**: A, B, D, E

### Phase Breakdown

1. **Database Schema Migration** (45 min) - Add CanvasType column with migration scripts
2. **Backend Persistence Layer** (30 min) - Update API to save/retrieve CanvasType
3. **Frontend Routing Logic** (45 min) - Update UserLanding to route based on CanvasType
4. **Testing & Validation** (60 min) - E2E tests for both routing paths
5. **Production Deployment** (30 min) - Deploy with migration to production

## Files to Be Created/Modified

### New Files (8)
- `Migrations/migration-{timestamp}-add-canvastype-column.sql`
- `Migrations/migration-{timestamp}-add-canvastype-column-prod.sql`
- `Migrations/rollback-{timestamp}-add-canvastype-column.sql`
- `Migrations/README-add-canvastype-column.md`
- `Tests/UI/user-landing-asset-share-routing.spec.ts`
- `Tests/UI/user-landing-transcript-routing.spec.ts`
- `Scripts/run-user-landing-routing-tests.ps1`
- `.github/prompts.keys/user-landing/MANUAL-TESTING.md`

### Modified Files (4)
- `SPA/NoorCanvas/Models/Simplified/Session.cs`
- `SPA/NoorCanvas/Controllers/HostController.cs`
- `SPA/NoorCanvas/Controllers/SessionController.cs`
- `SPA/NoorCanvas/Pages/UserLanding.razor`

## Database Changes

```sql
-- Column Specification
ALTER TABLE [canvas].[Sessions]
ADD [CanvasType] NVARCHAR(20) NULL DEFAULT 'asset';

-- Index for Performance
CREATE INDEX IX_Sessions_CanvasType ON [canvas].[Sessions]([CanvasType]);

-- Allowed Values: 'asset' | 'transcript'
-- Default: 'asset' (backward compatible)
```

## Routing Logic

```
CanvasType = "asset"       → /session/canvas/{token}
CanvasType = "transcript"  → /transcript/canvas/{token}
CanvasType = NULL          → /session/canvas/{token} (fallback)
```

## Success Criteria

- ✅ Users route to correct canvas based on host selection
- ✅ 100% backward compatibility with existing sessions
- ✅ E2E tests pass for both Asset and Section Share flows
- ✅ Production migration executes successfully
- ✅ Zero errors in production logs

---

## Handoff to Task Agent

**Ready to begin implementation**

Use the following command to start Phase 1:

```
@workspace /task key=user-landing github-branch=development phase=1 tasks="Create DEV migration script to add CanvasType column to canvas.Sessions table - Use NVARCHAR(20) NULL DEFAULT 'asset' - Include validation checks - Add index IX_Sessions_CanvasType - Update existing sessions to 'asset' - Create rollback script - Create PROD migration script - Document in README - Follow deployment-migration v1.0 protocol"
```

---

## Progress Tracking

Track progress in: `.github/prompts.keys/user-landing/user-landing.plan.json`

Current Status:
- **Phase**: 0 (Planning Complete)
- **Tasks Completed**: 0 / 23
- **Tests Passing**: 0 / 6

---

## Notes

- Migration follows deployment-migration v1.0 protocol
- ncdeploy.ps1 will auto-detect migration files
- Rollback script tested in DEV before PROD deployment
- Comprehensive logging added for debugging
- Manual testing checklist provided for QA

---

**Next Action**: Say "proceed" to begin Phase 1 implementation.
